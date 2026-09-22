/**
 * 练习模式引擎（纯函数，不依赖 Vue，便于单独验证）
 * ----------------------------------------------------------------------------
 * 三种题型：
 *   en2cn  英译中：展示英文单词 → 填写中文释义
 *   cn2en  中译英：展示中文释义 → 填写英文单词（大小写忽略 + 拼写容错）
 *   cloze  短句填空：挖空例句中的目标单词 → 补全句子
 *
 * ⚠️ 本模块只负责"出题 / 判分"，不读写任何 SRS（遗忘曲线）数据。
 *    练习答错不会影响复习时间戳，这是练习模式的硬约束。
 */

/** 词性前缀，用于把释义里的 "v." / "adj." 等去掉 */
const POS_PREFIX = /^\s*(n|v|adj|adv|prep|pron|conj|num|art|int|vt|vi|aux|abbr)\.\s*/i

/** 正则元字符转义（单词里可能出现 . - ' 等） */
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 文本归一化：统一小写、去掉空白与常见中英文标点
 * 中英文判分都先过这一层，避免空格/标点/全半角差异造成误判
 */
export function normalizeText(s) {
  return String(s == null ? '' : s)
    .toLowerCase()
    .replace(/[\s\u3000]+/g, '')
    .replace(/[.,;:!?'"()[\]{}，。；：！？、（）【】《》“”‘’—\-～~·]/g, '')
}

/** 去掉释义开头的词性标注，如 "v. 丢弃；放弃" → "丢弃；放弃" */
export function stripPos(meaning) {
  return String(meaning || '').replace(POS_PREFIX, '').trim()
}

/**
 * 把中文释义拆成"义项"数组，用于宽松比对
 * "v. 丢弃；放弃，抛弃" → ['丢弃', '放弃', '抛弃']
 * "n. 恶意,怨恨,不顾；n. 刁难,欺侮" → ['恶意', '怨恨', '不顾', '刁难', '欺侮']
 */
export function splitSenses(meaning) {
  return stripPos(meaning)
    .split(/[，,；;、/|]/)
    .map((seg) => seg.replace(POS_PREFIX, '').trim())
    .filter(Boolean)
}

/** Levenshtein 编辑距离（用于中译英 / 填词的拼写容错） */
export function levenshtein(a, b) {
  const s = String(a || '')
  const t = String(b || '')
  if (s === t) return 0
  if (!s.length) return t.length
  if (!t.length) return s.length

  let prev = Array.from({ length: t.length + 1 }, (_, i) => i)
  for (let i = 1; i <= s.length; i++) {
    const cur = [i]
    for (let j = 1; j <= t.length; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
    }
    prev = cur
  }
  return prev[t.length]
}

/**
 * 拼写容错的允许误差：词越短越严格
 *   ≤3 字母 → 必须完全正确（否则 cut/cat 这类会被误判为对）
 *   4-8 字母 → 允许差 1 个字符（覆盖"少写一个 s"这类笔误）
 *   ≥9 字母 → 允许差 2 个字符
 * 阈值刻意收得偏紧：2 个字符的差距在中等长度单词上往往是"另一个词"，
 * 例如 aband / abandon 相差 2，不应算对。
 */
function toleranceFor(len) {
  if (len <= 3) return 0
  if (len <= 8) return 1
  return 2
}

/**
 * 英译中判分：用户输入的中文是否命中该词任一条义项
 * 规则（宽松）：
 *   - 完全相等 → 对
 *   - 用户输入是某义项的子串（≥2 字）→ 对，例如答"放弃"而标准是"放弃，抛弃"
 *   - 某义项是用户输入的子串（≥2 字）→ 对，例如用户多写了几个义项
 * @returns {{correct: boolean, matched?: string}}
 */
export function judgeMeaning(input, meaning) {
  const answer = normalizeText(input)
  if (!answer) return { correct: false }

  const senses = splitSenses(meaning).map(normalizeText).filter(Boolean)
  if (!senses.length) return { correct: false }

  for (const sense of senses) {
    if (sense === answer) return { correct: true, matched: sense }
    // 中文单字太容易误命中，子串匹配要求至少 2 个字
    if (answer.length >= 2 && sense.includes(answer)) return { correct: true, matched: sense }
    if (sense.length >= 2 && answer.includes(sense)) return { correct: true, matched: sense }
  }
  return { correct: false }
}

/**
 * 英文拼写判分（中译英 / 短句填空共用）
 * @returns {{correct:boolean, exact:boolean, distance:number, tolerance:number}}
 *   correct=false 且 distance<=tolerance+1 时，说明"很接近"，可用于提示
 */
export function judgeSpelling(input, target) {
  const answer = normalizeText(input)
  const word = normalizeText(target)
  if (!answer || !word) return { correct: false, exact: false, distance: Infinity, tolerance: 0 }

  if (answer === word) return { correct: true, exact: true, distance: 0, tolerance: 0 }

  const distance = levenshtein(answer, word)
  const tolerance = toleranceFor(word.length)
  return {
    correct: distance <= tolerance,
    exact: false,
    distance,
    tolerance
  }
}

/**
 * 生成短句填空题目
 * 只在例句中出现"单词原形"时可用，避免把变形（abandoned）挖掉却要求填原形造成歧义。
 * 同时过滤掉两类低质题：虚词（长度 < 3）与例句片段（过短 / 无句末标点）。
 * @returns {{sentence:string, answer:string} | null}
 */
export function buildCloze(wordObj) {
  const example = String(wordObj.example || '').trim()
  if (!example) return null

  // 只保留字母与空格，兼容 "a bit" 这类短语
  const stem = String(wordObj.word || '').replace(/[^A-Za-z ]/g, '').trim()
  if (stem.length < 3) return null
  if (example.length < 15) return null
  if (!/[.?!]$/.test(example)) return null

  const re = new RegExp(`\\b${escapeRegExp(stem)}\\b`, 'i')
  const matched = example.match(re)
  if (!matched) return null

  const start = matched.index
  const end = start + matched[0].length
  return {
    sentence: example.slice(0, start) + '______' + example.slice(end),
    answer: matched[0]
  }
}

/** 该词能否出短句填空题 */
export function canCloze(wordObj) {
  return buildCloze(wordObj) !== null
}

/** Fisher-Yates 洗牌（返回新数组） */
export function shuffle(list) {
  const arr = list.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * 组装单道题目
 * @param {object} w 单词对象 { word, phonetic, meaning, example, exampleCn }
 * @param {'mixed'|'en2cn'|'cn2en'|'cloze'} type 题型
 */
function makeQuestion(w, type) {
  let t = type

  // 混合模式：在"可出的题型"里随机，有例句才可能出短句填空
  if (t === 'mixed') {
    const options = ['en2cn', 'cn2en']
    if (canCloze(w)) options.push('cloze')
    t = options[Math.floor(Math.random() * options.length)]
  }

  if (t === 'cloze') {
    const cloze = buildCloze(w)
    if (!cloze) return makeQuestion(w, 'en2cn') // 兜底，避免出空题
    return {
      word: w.word,
      type: 'cloze',
      sentence: cloze.sentence, // 挖空后的句子
      // 提示统一给"原形"：句首可能大写（Relevant），但答案按原形判定，避免歧义
      hint: w.word,
      answerText: w.word, // 标准答案
      meaning: w.meaning,
      phonetic: w.phonetic
    }
  }

  if (t === 'cn2en') {
    return {
      word: w.word,
      type: 'cn2en',
      prompt: stripPos(w.meaning), // 中文提示（去掉词性）
      answerText: w.word,
      meaning: w.meaning,
      phonetic: w.phonetic
    }
  }

  return {
    word: w.word,
    type: 'en2cn',
    prompt: w.word,
    answerText: w.meaning,
    meaning: w.meaning,
    phonetic: w.phonetic
  }
}

/**
 * 生成一组练习题
 * @param {{words: object[], count: number, type: string}} opts
 *        words 为已按词池筛选好的候选词
 * @returns {object[]} 题目数组
 */
export function buildQuestions({ words, count, type = 'mixed' }) {
  const candidates = type === 'cloze' ? words.filter(canCloze) : words
  const picked = shuffle(candidates).slice(0, Math.max(0, count))
  return picked.map((w) => makeQuestion(w, type))
}

/**
 * 统一判分入口
 * @returns {{correct:boolean, near?:boolean}} near=true 表示拼写很接近（用于给出提示语）
 */
export function judge(question, input) {
  if (question.type === 'en2cn') {
    return judgeMeaning(input, question.meaning)
  }
  const r = judgeSpelling(input, question.word)
  return {
    correct: r.correct,
    // 判为错但差距 ≤ 容错 + 1 时，视为"很接近"，提示用户注意拼写
    near: !r.correct && r.distance <= r.tolerance + 1
  }
}

/** 题型的中文名（用于界面与结果列表） */
export const TYPE_LABEL = {
  en2cn: '英译中',
  cn2en: '中译英',
  cloze: '短句填空'
}
