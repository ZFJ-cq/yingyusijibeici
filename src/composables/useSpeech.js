/**
 * Web Speech API 朗读工具
 * 使用浏览器内置语音合成朗读英文单词。
 */
export function speak(text, { rate = 1, lang = 'en-US' } = {}) {
  if (typeof window === 'undefined') return
  if (!('speechSynthesis' in window)) return
  try {
    // 先取消上一条，避免排队重叠
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = lang
    utter.rate = rate
    utter.pitch = 1
    window.speechSynthesis.speak(utter)
  } catch (e) {
    // 静默失败，不影响主流程
  }
}

export function speechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}
