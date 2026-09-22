import { WORDS as REGULAR_WORDS } from './words.js'
import { HIGH_FREQ_ONLY, HIGH_FREQ_SHARED } from './highFreqWords.js'

/**
 * 词库合并层
 * ----------------------------------------------------------------------------
 * 应用支持两本词书：
 *   regular 常规词汇 —— 四级完整词库（3739 词）
 *   high    高频词汇 —— 四级高频重点词（608 词，来自《四级高频词最新版.pdf》）
 *
 * ⚠️ 关键设计：**两个词书以"单词"为唯一键合并成同一个词条池**。
 *    同一个单词只会有一条记录，用 `lists` 标记它属于哪几本词书。
 *
 *    这么做是必须的，因为：
 *      - 学习进度（SRS）以单词为键存储，一个词不能有两份含义/两套进度；
 *      - 复习页、练习页、统计页都基于同一个词条池工作，
 *        否则从高频词库学到的词在复习页会找不到、永远无法复习。
 */

/** 词书定义（供界面展示与切换） */
export const WORD_LISTS = [
  { key: 'regular', name: '常规词汇', desc: '四级完整词库' },
  { key: 'high', name: '高频词汇', desc: '四级高频重点词' }
]

/** 默认词书 */
export const DEFAULT_LIST = 'regular'

/** 把多本词书合并成统一的词条池（按单词去重） */
function mergeLists() {
  const byWord = new Map()

  // 常规词库先入池
  for (const w of REGULAR_WORDS) {
    byWord.set(w.word, { ...w, lists: ['regular'] })
  }

  // 高频词表里「常规词库没有」的词：只有词形 + 释义（无音标/例句）
  for (const h of HIGH_FREQ_ONLY) {
    const exist = byWord.get(h.word)
    if (exist) {
      // 理论上不会走到（生成数据时已按词库差集拆分），兜底防止漏标
      if (!exist.lists.includes('high')) exist.lists.push('high')
    } else {
      byWord.set(h.word, {
        word: h.word,
        phonetic: '',
        meaning: h.meaning,
        example: '',
        exampleCn: '',
        lists: ['high']
      })
    }
  }

  // 高频词表里「与常规词库重合」的词：直接复用常规词条，仅追加归属标记
  for (const word of HIGH_FREQ_SHARED) {
    const exist = byWord.get(word)
    if (exist) {
      if (!exist.lists.includes('high')) exist.lists.push('high')
    }
  }

  return [...byWord.values()]
}

/** 全部词条（两本词书的并集） */
export const WORDS = mergeLists()

/** 取某本词书的全部词条 */
export function getWordsByList(list) {
  const key = list === 'high' ? 'high' : 'regular'
  return WORDS.filter((w) => w.lists.includes(key))
}

/** 每本词书的词数 */
export const LIST_SIZES = WORD_LISTS.reduce((acc, l) => {
  acc[l.key] = getWordsByList(l.key).length
  return acc
}, {})
