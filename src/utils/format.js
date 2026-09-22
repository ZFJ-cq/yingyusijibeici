/**
 * 展示层的格式化工具（纯函数）
 */

/**
 * 把秒数格式化成简短的中文时长，用于统计卡片这种空间有限的地方
 *   45      → '45秒'
 *   90      → '1分30秒'
 *   600     → '10分'
 *   3720    → '1小时2分'
 *   86400   → '24小时'
 */
export function formatDuration(seconds) {
  const s = Math.max(0, Math.round(Number(seconds) || 0))
  if (s < 60) return `${s}秒`

  if (s < 3600) {
    const m = Math.floor(s / 60)
    const r = s % 60
    return r ? `${m}分${r}秒` : `${m}分`
  }

  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return m ? `${h}小时${m}分` : `${h}小时`
}

/**
 * 更详细的中文时长（带空格，适合放在说明性文字里）
 *   90 → '1 分 30 秒'
 */
export function formatDurationLong(seconds) {
  return formatDuration(seconds).replace(/(小时|分|秒)/g, '$1 ').trim()
}
