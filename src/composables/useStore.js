import { reactive, watch, computed } from 'vue'
import { WORDS, getWordsByList, LIST_SIZES, DEFAULT_LIST } from '../data'

/**
 * 数据层（纯前端，无后端）
 * ----------------------------------------------------------------------------
 * 全部数据都存在浏览器 localStorage 的单一 key 下，结构如下：
 *
 * {
 *   version: 1,
 *   settings: { theme, batchSize, speechEnabled, speechRate, order, learnList },
 *   progress: { [单词]: { state, learnedAt, reviewsDone, nextReviewAt, lastReviewAt, history } },
 *   notebook: { [单词]: { addedAt } },
 *   practice: { sessions, answered, correct },
 *   study:    { totalSeconds, todayDate, todaySeconds, dailySeconds }
 * }
 *
 * progress 里只有"学过"的词才会有记录：
 *   - 没有记录        → 属于"新词"
 *   - state=learning  → 已学习，正在按遗忘曲线复习中
 *   - state=mastered  → 已走完 5 个复习节点，视为已掌握
 *
 * ⚠️ 关键约束：只有【复习模块】(reviewRemember / reviewForget / learnWord) 会写 progress。
 *    【练习模式】答对答错都不碰 progress，只把错题记进 notebook，
 *    因此练习不会改变任何单词的 SRS 复习时间戳。
 *
 * ⚠️ study 只是"学习时长"的记账（由 useStudyTimer 累加），同样是独立数据，
 *    不参与任何 SRS 判断。
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
    order: 'shuffle', // 出词顺序：'shuffle' 乱序（默认） | 'alpha' 正序
    learnList: DEFAULT_LIST // 学新词使用的词书：'regular' 常规 | 'high' 高频
  }
}

/** 初始（空）状态 */
function defaultState() {
  return {
    version: 1,
    settings: defaultSettings(),
    // SRS 复习进度：⚠️ 只有【复习模块】会写这里，练习模式绝不触碰
    progress: {},
    // 生词本：{ [单词]: { addedAt } }，练习错题可一键加入，也可作为练习词池
    notebook: {},
    // 练习统计（与 SRS 完全独立，仅用于展示练习量）
    practice: { sessions: 0, answered: 0, correct: 0 },
    // 学习时长记账：totalSeconds 累计 / todaySeconds 今日 / dailySeconds 每日明细
    study: { totalSeconds: 0, todayDate: '', todaySeconds: 0, dailySeconds: {} }
  }
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
        progress: parsed.progress && typeof parsed.progress === 'object' ? parsed.progress : {},
        notebook: parsed.notebook && typeof parsed.notebook === 'object' ? parsed.notebook : {},
        practice: { ...def.practice, ...(parsed.practice || {}) },
        study: {
          ...def.study,
          ...(parsed.study || {}),
          dailySeconds:
            parsed.study && typeof parsed.study.dailySeconds === 'object'
              ? parsed.study.dailySeconds || {}
              : {}
        }
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
 * 本地自然日的键，形如 '2026-09-22'
 * 用本地时区而不是 UTC：用户的"今天"应该按他所在地的零点划分
 */
function todayKey(ts) {
  const d = new Date(ts == null ? now() : ts)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
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
 * 幂等保护：已有进度的词直接返回，避免重复初始化把已有复习记录覆盖掉。
 */
function learnWord(word) {
  if (state.progress[word]) return

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
  // 已掌握的词不该再进入复习；一并挡住，避免 reviewsDone 越界
  if (!p || p.state === 'mastered') return

  p.reviewsDone += 1
  p.lastReviewAt = now()
  p.history.push({ t: now(), result: 'remember' })

  if (p.reviewsDone >= REVIEW_INTERVALS.length) {
    p.state = 'mastered'
    p.nextReviewAt = null // 已掌握，不再安排复习
  } else {
    // 防御性兜底：万一下标取不到（异常数据），退回最后一个间隔而不是产生 NaN
    const days = REVIEW_INTERVALS[p.reviewsDone] ?? REVIEW_INTERVALS[REVIEW_INTERVALS.length - 1]
    p.nextReviewAt = now() + days * DAY
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
function getNewWords(limit, listKey) {
  // 默认用设置里选定的词书；也允许显式指定（首页统计、练习页等）
  const key = listKey || state.settings.learnList || DEFAULT_LIST
  const pool = getWordsByList(key)
  const ordered = applyOrder(pool.filter((w) => !state.progress[w.word]))
  return limit ? ordered.slice(0, limit) : ordered
}

/** 某本词书里"还没学过"的词数 */
function countNewWords(listKey) {
  const key = listKey || state.settings.learnList || DEFAULT_LIST
  return getWordsByList(key).filter((w) => !state.progress[w.word]).length
}

/** 取所有已到期的复习单词（同样遵循出词顺序设置） */
function getDueReviews() {
  return applyOrder(WORDS.filter((w) => isDue(w.word)))
}

/* ==========================================================================
   练习模式：词池筛选 / 生词本 / 练习统计
   ⚠️ 以下方法都只读写 notebook 与 practice，绝不修改 progress（SRS 进度），
      所以练习答错不会影响遗忘曲线的复习时间戳。
   ========================================================================== */

/**
 * 按词池取候选单词（供练习模式使用）
 * @param {'all'|'due'|'mastered'|'notebook'} pool
 */
function getPoolWords(pool = 'all') {
  switch (pool) {
    case 'due':
      return WORDS.filter((w) => isDue(w.word))
    case 'mastered':
      return WORDS.filter((w) => {
        const p = state.progress[w.word]
        return !!p && p.state === 'mastered'
      })
    case 'notebook':
      return WORDS.filter((w) => !!state.notebook[w.word])
    case 'all':
    default:
      return WORDS.slice()
  }
}

/** 该词是否已在生词本中 */
function isInNotebook(word) {
  return !!state.notebook[word]
}

/** 加入生词本（已存在则忽略） */
function addToNotebook(word) {
  if (!state.notebook[word]) state.notebook[word] = { addedAt: now() }
}

/**
 * 批量加入生词本（"一键加入错题"）
 * @returns {number} 实际新增的数量（已存在的不会重复计数）
 */
function addManyToNotebook(words) {
  let added = 0
  for (const word of words) {
    if (!state.notebook[word]) {
      state.notebook[word] = { addedAt: now() }
      added++
    }
  }
  return added
}

/** 从生词本移除 */
function removeFromNotebook(word) {
  delete state.notebook[word]
}

/** 清空生词本 */
function clearNotebook() {
  state.notebook = {}
}

/**
 * 记录一次练习结果（只累加练习统计，不涉及 SRS）
 * @param {{answered:number, correct:number}} result
 */
function recordPractice({ answered = 0, correct = 0 } = {}) {
  state.practice.sessions += 1
  state.practice.answered += answered
  state.practice.correct += correct
}

/** 重置练习统计 */
function resetPracticeStats() {
  state.practice = { sessions: 0, answered: 0, correct: 0 }
}

/* ==========================================================================
   学习时长记账（由 useStudyTimer 定期调用）
   ========================================================================== */

/** 每日明细只保留最近这么多天，避免 localStorage 无限增长 */
const DAILY_KEEP_DAYS = 14

/** 丢掉过期的每日明细 */
function pruneDaily(daily) {
  const keys = Object.keys(daily).sort()
  while (keys.length > DAILY_KEEP_DAYS) {
    delete daily[keys.shift()]
  }
}

/**
 * 累加学习时长（秒）
 * 由 useStudyTimer 每 15 秒左右调用一次；跨天时先把昨天的今日时长归档。
 * 只写 study 字段，与其他数据互不影响。
 */
function addStudySeconds(seconds) {
  const sec = Math.max(0, Math.round(Number(seconds) || 0))
  if (!sec) return

  const key = todayKey()
  if (state.study.todayDate !== key) {
    // 跨天（或初次使用）：归档旧的"今日"，从 0 重新开始计今天
    if (state.study.todayDate) {
      state.study.dailySeconds[state.study.todayDate] = state.study.todaySeconds
    }
    state.study.todayDate = key
    state.study.todaySeconds = 0
  }

  state.study.todaySeconds += sec
  state.study.totalSeconds += sec
  state.study.dailySeconds[key] = state.study.todaySeconds
  pruneDaily(state.study.dailySeconds)
}

/** 清空学习时长记录 */
function resetStudyTime() {
  state.study = { totalSeconds: 0, todayDate: todayKey(), todaySeconds: 0, dailySeconds: {} }
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
  let todayReviews = 0 // 今日复习次数（自然日 00:00 起算）
  let todayLearned = 0 // 今日学习词数（今天新学或复习过的去重词数）
  const newCountByList = { regular: 0, high: 0 }

  const t = now()
  // 今天的 0 点，用于统计"今日活跃度"
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayT = todayStart.getTime()

  for (const w of WORDS) {
    const p = state.progress[w.word]
    if (!p) {
      newCount++
      // 未学词按所属词书分别累计
      if (w.lists.includes('regular')) newCountByList.regular++
      if (w.lists.includes('high')) newCountByList.high++
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
      if (h.t >= todayT) todayReviews++
    }
    // 今天"碰过"这个词就算今天学过：新学时间或最近复习时间落在今天
    const reviewedToday = p.lastReviewAt != null && p.lastReviewAt >= todayT
    if (p.learnedAt >= todayT || reviewedToday) todayLearned++
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
    forgetCount,
    todayReviews,
    todayLearned, // 今日学习词数（新学 + 复习去重）
    notebookCount: Object.keys(state.notebook).length, // 生词本词数
    // 各词书的总词数与未学数（供「学新词」页选择词书时展示）
    listSizes: { ...LIST_SIZES },
    newCountByList
  }
})

/** 练习统计（独立于 SRS，仅用于展示练习量与正确率） */
const practiceStats = computed(() => {
  const p = state.practice
  return {
    sessions: p.sessions,
    answered: p.answered,
    correct: p.correct,
    wrong: Math.max(0, p.answered - p.correct),
    accuracy: p.answered ? Math.round((p.correct / p.answered) * 100) : 0
  }
})

/**
 * 学习时长统计
 * 注意"今日"要按当前自然日重算：进程里可能还留着昨天写下的 todaySeconds
 * （用户跨过零点继续用，或很久没操作后重新打开页面）。
 */
const studyStats = computed(() => {
  const s = state.study
  const key = todayKey()
  const sameDay = s.todayDate === key
  return {
    todaySeconds: sameDay ? s.todaySeconds : 0,
    totalSeconds: s.totalSeconds,
    dailySeconds: { ...s.dailySeconds },
    todayDate: key
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

/** 切换学新词使用的词书：'regular' | 'high' */
function setLearnList(listKey) {
  state.settings.learnList = listKey === 'high' ? 'high' : 'regular'
}

/** 出词顺序：'shuffle' 乱序 | 'alpha' 正序 */
function setOrder(order) {
  state.settings.order = order === 'alpha' ? 'alpha' : 'shuffle'
}

/** 导出备份：把整个 state 序列化成 JSON 字符串 */
function exportData() {
  // 只导出当前词库中真实存在的单词。
  // 若曾换过词库，progress/notebook 里可能残留旧词书的"幽灵记录"，
  // 它们不参与统计、也练不到，过滤掉能让备份文件更干净。
  const valid = new Set(WORDS.map((w) => w.word))
  const pick = (obj) => {
    const out = {}
    for (const [word, record] of Object.entries(obj)) {
      if (valid.has(word)) out[word] = record
    }
    return out
  }
  return JSON.stringify(
    {
      version: state.version,
      settings: state.settings,
      progress: pick(state.progress),
      notebook: pick(state.notebook),
      practice: state.practice,
      study: state.study
    },
    null,
    2
  )
}

/** 导入备份：解析后覆盖当前设置、进度、生词本、练习统计与学习时长（字段缺失时用默认值补齐） */
function importData(jsonString) {
  const parsed = JSON.parse(jsonString)
  const next = defaultState()
  if (parsed && typeof parsed === 'object') {
    next.settings = { ...next.settings, ...(parsed.settings || {}) }
    next.progress = parsed.progress && typeof parsed.progress === 'object' ? parsed.progress : {}
    next.notebook = parsed.notebook && typeof parsed.notebook === 'object' ? parsed.notebook : {}
    next.practice = { ...next.practice, ...(parsed.practice || {}) }
    next.study = {
      ...next.study,
      ...(parsed.study || {}),
      dailySeconds:
        parsed.study && typeof parsed.study.dailySeconds === 'object' ? parsed.study.dailySeconds || {} : {}
    }
  }
  state.settings = next.settings
  state.progress = next.progress
  state.notebook = next.notebook
  state.practice = next.practice
  state.study = next.study
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
    practiceStats,
    studyStats,
    REVIEW_INTERVALS,
    // 学习 / 复习（会写 SRS）
    learnWord,
    reviewRemember,
    reviewForget,
    getNewWords,
    countNewWords,
    getDueReviews,
    getLast7Days,
    // 练习模式（不写 SRS）
    getPoolWords,
    isInNotebook,
    addToNotebook,
    addManyToNotebook,
    removeFromNotebook,
    clearNotebook,
    recordPractice,
    resetPracticeStats,
    // 学习时长记账
    addStudySeconds,
    resetStudyTime,
    // 设置与数据
    setTheme,
    setBatchSize,
    setSpeechEnabled,
    setSpeechRate,
    setOrder,
    setLearnList,
    exportData,
    importData,
    resetProgress
  }
}
