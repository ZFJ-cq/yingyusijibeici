import { reactive, watch, computed } from 'vue'
import { WORDS } from '../data/words'

const STORAGE_KEY = 'cet4_forgetting_curve_v1'

// 遗忘曲线复习间隔（天）：学完新词后依次为 1、2、4、7、15 天
export const REVIEW_INTERVALS = [1, 2, 4, 7, 15]
const DAY = 24 * 60 * 60 * 1000

function defaultSettings() {
  return {
    theme: 'light', // 'light' | 'dark'
    batchSize: 20, // 每次学习新词数量
    speechEnabled: true,
    speechRate: 1 // 0.5 - 2
  }
}

function defaultState() {
  return {
    version: 1,
    settings: defaultSettings(),
    progress: {} // { [word]: { state, learnedAt, reviewsDone, nextReviewAt, lastReviewAt, history: [{t, result}] } }
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const def = defaultState()
      return {
        version: 1,
        settings: { ...def.settings, ...(parsed.settings || {}) },
        progress: parsed.progress && typeof parsed.progress === 'object' ? parsed.progress : {}
      }
    }
  } catch (e) {
    console.warn('[store] 读取本地数据失败，已重置：', e)
  }
  return defaultState()
}

// 全局单例状态
const state = reactive(loadState())

// 任意变更后自动持久化到 localStorage
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

function now() {
  return Date.now()
}

/* ------------------------- 核心业务方法 ------------------------- */

// 学新词：标记为学习中，安排第 1 次复习（1 天后）
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

// 复习“记得”：进入下一复习节点；完成全部间隔则“已掌握”
function reviewRemember(word) {
  const p = state.progress[word]
  if (!p) return
  p.reviewsDone += 1
  p.lastReviewAt = now()
  p.history.push({ t: now(), result: 'remember' })
  if (p.reviewsDone >= REVIEW_INTERVALS.length) {
    p.state = 'mastered'
    p.nextReviewAt = null
  } else {
    p.nextReviewAt = now() + REVIEW_INTERVALS[p.reviewsDone] * DAY
  }
}

// 复习“不记得”：重置学习进度，从头开始（回到第 1 个间隔）
function reviewForget(word) {
  const p = state.progress[word]
  if (!p) return
  p.reviewsDone = 0
  p.state = 'learning'
  p.lastReviewAt = now()
  p.nextReviewAt = now() + REVIEW_INTERVALS[0] * DAY
  p.history.push({ t: now(), result: 'forget' })
}

function isDue(word) {
  const p = state.progress[word]
  return !!p && p.state === 'learning' && p.nextReviewAt <= now()
}

// 取出最多 limit 个“未学习”的新词
function getNewWords(limit) {
  const list = WORDS.filter((w) => !state.progress[w.word])
  return limit ? list.slice(0, limit) : list
}

// 取出所有“到复习时间”的单词（返回单词对象数组）
function getDueReviews() {
  return WORDS.filter((w) => isDue(w.word))
}

// 计算近 7 天每日复习次数（含记得/不记得）
function getLast7Days() {
  const days = []
  const today = now()
  for (let i = 6; i >= 0; i--) {
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
    days.push({
      label: `${start.getMonth() + 1}/${start.getDate()}`,
      count,
      remember,
      forget
    })
  }
  return days
}

/* ------------------------- 统计（computed） ------------------------- */

const stats = computed(() => {
  let newCount = 0
  let learningCount = 0
  let masteredCount = 0
  let dueCount = 0
  let totalReviews = 0
  let rememberCount = 0
  let forgetCount = 0
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

/* ------------------------- 设置 / 备份 ------------------------- */

function setTheme(theme) {
  state.settings.theme = theme
}
function setBatchSize(n) {
  const v = Math.max(1, Math.min(100, parseInt(n, 10) || 1))
  state.settings.batchSize = v
}
function setSpeechEnabled(v) {
  state.settings.speechEnabled = !!v
}
function setSpeechRate(r) {
  state.settings.speechRate = Math.max(0.5, Math.min(2, Number(r) || 1))
}

// 导出备份：返回 JSON 字符串
function exportData() {
  return JSON.stringify(state, null, 2)
}

// 导入备份：解析并覆盖
function importData(jsonString) {
  const parsed = JSON.parse(jsonString)
  const next = defaultState()
  if (parsed && typeof parsed === 'object') {
    next.settings = { ...next.settings, ...(parsed.settings || {}) }
    next.progress = parsed.progress && typeof parsed.progress === 'object' ? parsed.progress : {}
  }
  // 整体替换，触发持久化
  state.settings = next.settings
  state.progress = next.progress
}

// 重置学习记录（保留设置），清空所有单词进度
function resetProgress() {
  state.progress = {}
}

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
    exportData,
    importData,
    resetProgress
  }
}
