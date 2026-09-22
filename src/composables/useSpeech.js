/**
 * 单词朗读工具（Web Speech API）
 * 使用浏览器内置的 speechSynthesis 朗读英文，无需任何第三方依赖或网络请求。
 */

/**
 * 朗读一段文本
 * @param {string} text 要朗读的内容（通常是单词本身）
 * @param {{rate?: number, lang?: string}} options rate 语速（0.5-2），lang 语言，默认美式英语
 */
export function speak(text, { rate = 1, lang = 'en-US' } = {}) {
  if (typeof window === 'undefined') return
  if (!('speechSynthesis' in window)) return // 浏览器不支持时静默跳过
  try {
    window.speechSynthesis.cancel() // 先取消上一条，避免连续点击时排队重叠
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = lang
    utter.rate = rate
    utter.pitch = 1
    window.speechSynthesis.speak(utter)
  } catch (e) {
    // 朗读失败不影响主流程
  }
}

/** 当前浏览器是否支持语音合成（可用于隐藏朗读按钮） */
export function speechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}
