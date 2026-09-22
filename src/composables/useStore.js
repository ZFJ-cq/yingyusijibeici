import { reactive, watch, computed } from 'vue'
import { WORDS } from '../data/words'

/**
 * 数据层（纯前端，无后端）
 * ----------------------------------------------------------------------------
 * 全部学习数据都存在浏览器 localStorage 的单一 key 下，结构如下：
 *
 * {
 *   version: 1,
 *   settings: { theme, batchSize, speechEnabled, speechRate, order },
 *   progress: {
 *     [单词]: { state, learnedAt, reviewsDone, nextReviewAt, lastReviewAt, history }
 *   }
 * }
 *
 * progress 里只有"学过"的词才会有记录：
 *   - 没有记录        → 属于"新词"
 *   - state=learning  → 已学习，正在按遗忘曲线复习中
 *   - state=mastered  → 已走完 5 个复习节点，视为已掌握
 */

/** localStorage 存储键名 */
const STORAGE_KEY = 'cet4_forgetting_curve_v1'

/** 遗忘曲线复习间隔（天）：学完新词后依次为 1、2、4、7、15 天 */
export const REVIEW_INTERVALS = [1, 2, 4, 7, 15]

/** 一天的毫秒数（时间统一用毫秒时间戳，前端算差值判断是否到期） */
const DAY = 24 * 60 * 60 * 1000

/** 设置项的默认值 */
function defaultSettings() {
  return {
    theme: 'light', // 'light' | 'dark'
    batchSize: 20, // 每次学习的新词数量
    speechEnabled: true, // 是否开启单词朗读
    speechRate: 1, // 朗读语速 0.5 - 2
    order: 'shuffle' // 出词顺序：'shuffle' 乱序（默认） | 'alpha' 正序
  }
}

/** 初始（空）状态 */
function defaultState() {
  return { version: 1, settings: defaultSettings(), progress: {} }
}

/** 从 localStorage 读取状态；损坏或缺失时回退到默认值 */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const def = defaultState()
      return {
        version: 1,
        // 与默认值合并：这样后续新增设置项时，老用户也能自动拿到默认值
        settings: { ...def.settings, ...(parsed.settings || {}) },
        progress: parsed.progress && typeof parsed.progress === 'object' ? parsed.progress : {}
      }
    }
  } catch (e) {
    console.warn('[store] 读取本地数据失败，已重置：', e)
  }
  return defaultState()
}

/** 全局单例状态：所有组件共享同一份 */
const state = reactive(loadState())

/** 任意变更后自动写入 localStorage（deep 监听，覆盖嵌套的 progress） */
watch(
  state,
  () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (e) {
      console.warn('[store] 写入本地数据失败：', e)
    }
  },
  { deep: true }
)

/** 取当前毫秒时间戳（统一入口，便于日后替换时间源） */
function now() {
  return Date.now()
}

/**
 * Fisher-Yates 洗牌：返回打乱后的新数组（不修改原数组）
 * 用于让出词顺序随机，避免总是按 a、b、c 字母序背单词
 */
function shuffle(list) {
  const arr = list.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** 按设置决定是否打乱：order='alpha' 时保持原（字母）序 */
function applyOrder(list) {
  return state.settings.order === 'alpha' ? list : shuffle(list)
}

/* ==========================================================================
   核心业务：学习与复习
   ========================================================================== */

/**
 * 学新词【认识】：进入复习计划，第 1 次复习安排在 1 天后
 */
function learnWord(word) {
  state.progress[word] = {
    state: 'learning',
    learnedAt: now(),
    reviewsDone: 0,
    nextReviewAt: now() + REVIEW_INTERVALS[0] * DAY,
    lastReviewAt: null,
    history: []
  }
}

/**
 * 复习【记得】：进入下一个复习节点
 * - reviewsDone + 1
 * - 下一次复习时间 = 当前时间 + INTERVALS[reviewsDone] 天
 * - 若已走完全部 5 个节点（reviewsDone >= 5）→ 标记为已掌握
 */
function reviewRemember(word) {
  const p = state.progress[word]
  if (!p) return

  p.reviewsDone += 1
  p.lastReviewAt = now()
  p.history.push({ t: now(), result: 'remember' })

  if (p.reviewsDone >= REVIEW_INTERVALS.length) {
    p.state = 'mastered'
    p.nextReviewAt = null // 已掌握，不再安排复习
  } else {
    p.nextReviewAt = now() + REVIEW_INTERVALS[p.reviewsDone] * DAY
  }
}

/**
 * 复习【不记得】：重置学习进度，从头开始
 * reviewsDone 归 0，下次复习时间重置为 1 天后（回到曲线起点）
 */
function reviewForget(word) {
  const p = state.progress[word]
  if (!p) return

  p.reviewsDone = 0
  p.state = 'learning'
  p.lastReviewAt = now()
  p.nextReviewAt = now() + REVIEW_INTERVALS[0] * DAY
  p.history.push({ t: now(), result: 'forget' })
}

/** 某词是否到达复习时间：学习中 且 下次复习时间 <= 当前时间 */
function isDue(word) {
  const p = state.progress[word]
  return !!p && p.state === 'learning' && p.nextReviewAt <= now()
}

/**
 * 取最多 limit 个新词（完全没学过的词）
 * 默认乱序返回，避免字母序背诵
 */
function getNewWords(limit) {
  const list = WORDS.filter((w) => !state.progress[w.word])
  const ordered = applyOrder(list)
  return limit ? ordered.slice(0, limit) : ordered
}

/** 取所有已到期的复习单词（同样遵循出词顺序设置） */
function getDueReviews() {
  return applyOrder(WORDS.filter((w) => isDue(w.word)))
}

/**
 * 近 7 天每日复习次数（用于统计页柱状图）
 * 返回 [{ label:'9/22', count, remember, forget }]，从最早到今天
 */
function getLast7Days() {
  const days = []
  const today = now()
  for (let i = 6; i >= 0; i--) {
    // 以「自然日」划分：当天 00:00 到次日 00:00
    const start = new Date(today - i * DAY)
    start.setHours(0, 0, 0, 0)
    const startT = start.getTime()
    const endT = startT + DAY

    let count = 0
    let remember = 0
    let forget = 0
    for (const w of WORDS) {
      const p = state.progress[w.word]
      if (!p) continue
      for (const h of p.history) {
        if (h.t >= startT && h.t < endT) {
          count++
          if (h.result === 'remember') remember++
          else forget++
        }
      }
    }
    days.push({ label: `${start.getMonth() + 1}/${start.getDate()}`, count, remember, forget })
  }
  return days
}

/* ==========================================================================
   统计（computed）：任一单词进度变化都会自动重算
   ========================================================================== */
const stats = computed(() => {
  let newCount = 0 // 新词
  let learningCount = 0 // 学习中
  let masteredCount = 0 // 已掌握
  let dueCount = 0 // 待复习（学习中且已到期）
  let totalReviews = 0 // 累计复习次数
  let rememberCount = 0 // 记得次数
  let forgetCount = 0 // 不记得次数

  const t = now()
  for (const w of WORDS) {
    const p = state.progress[w.word]
    if (!p) {
      newCount++
      continue
    }
    if (p.state === 'mastered') {
      masteredCount++
    } else {
      learningCount++
      if (p.nextReviewAt <= t) dueCount++
    }
    for (const h of p.history) {
      totalReviews++
      if (h.result === 'remember') rememberCount++
      else forgetCount++
    }
  }

  return {
    totalWords: WORDS.length,
    newCount,
    learningCount,
    masteredCount,
    dueCount,
    learnedCount: learningCount + masteredCount,
    totalReviews,
    rememberCount,
    forgetCount
  }
})

/* ==========================================================================
   设置与数据备份
   ========================================================================== */

function setTheme(theme) {
  state.settings.theme = theme
}

/** 每次学习数量，限制在 1 - 100 */
function setBatchSize(n) {
  state.settings.batchSize = Math.max(1, Math.min(100, parseInt(n, 10) || 1))
}

function setSpeechEnabled(v) {
  state.settings.speechEnabled = !!v
}

/** 朗读语速，限制在 0.5 - 2 倍 */
function setSpeechRate(r) {
  state.settings.speechRate = Math.max(0.5, Math.min(2, Number(r) || 1))
}

/** 出词顺序：'shuffle' 乱序 | 'alpha' 正序 */
function setOrder(order) {
  state.settings.order = order === 'alpha' ? 'alpha' : 'shuffle'
}

/** 导出备份：把整个 state 序列化成 JSON 字符串 */
function exportData() {
  return JSON.stringify(state, null, 2)
}

/** 导入备份：解析后覆盖当前设置与进度（字段缺失时用默认值补齐） */
function importData(jsonString) {
  const parsed = JSON.parse(jsonString)
  const next = defaultState()
  if (parsed && typeof parsed === 'object') {
    next.settings = { ...next.settings, ...(parsed.settings || {}) }
    next.progress = parsed.progress && typeof parsed.progress === 'object' ? parsed.progress : {}
  }
  state.settings = next.settings
  state.progress = next.progress
}

/** 重置学习记录（清空所有单词进度，保留主题等偏好设置） */
function resetProgress() {
  state.progress = {}
}

/** 统一出口：组件通过 useStore() 拿到同一份 state 与全部方法 */
export function useStore() {
  return {
    state,
    stats,
    REVIEW_INTERVALS,
    learnWord,
    reviewRemember,
    reviewForget,
    getNewWords,
    getDueReviews,
    getLast7Days,
    setTheme,
    setBatchSize,
    setSpeechEnabled,
    setSpeechRate,
    setOrder,
    exportData,
    importData,
    resetProgress
  }
}
