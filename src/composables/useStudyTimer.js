import { onMounted, onUnmounted } from 'vue'
import { useStore } from './useStore'

/**
 * 学习时长追踪
 * ----------------------------------------------------------------------------
 * 目标：统计"实际在学习"的时长，而不是"页面开着"的时长。
 *
 * 做法：
 *   - 监听常见的交互事件（点击 / 按键 / 滚动 / 触摸 / 滚轮），每次交互都记为"活跃"；
 *   - 心跳每秒一次，只有距上次交互在 IDLE_MS 以内才 +1 秒；
 *     超过 IDLE_MS 没有任何交互 → 认为人不在，暂停计时（避免挂着页面刷时长）；
 *   - 累计的秒数先存在内存里，每 FLUSH_MS 批量写回 store（减少 localStorage 写入次数），
 *     并在页面隐藏 / 关闭时立即落盘，防止丢数据。
 *
 * ⚠️ 全应用只应挂载一次（当前只在 App.vue 里调用）。
 *    挂载多次会起多个心跳，时长被重复累加。
 */

/** 超过这个时间没有任何交互，就暂停计时（1 分钟） */
const IDLE_MS = 60 * 1000

/** 攒够这么多时间就写回 store 一次（15 秒） */
const FLUSH_MS = 15 * 1000

/** 视为"人在操作"的事件 */
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll', 'mousemove']

export function useStudyTimer() {
  const { addStudySeconds } = useStore()

  let lastActiveAt = Date.now()
  let pendingSeconds = 0
  let tickId = null
  let flushId = null

  /** 记录一次"活跃" */
  function markActive() {
    lastActiveAt = Date.now()
  }

  /** 把内存里攒的秒数写回 store */
  function flush() {
    if (pendingSeconds > 0) {
      addStudySeconds(pendingSeconds)
      pendingSeconds = 0
    }
  }

  function onVisibilityChange() {
    // 切到后台/关闭标签时，立刻把当前进度落盘
    if (document.visibilityState === 'hidden') flush()
  }

  onMounted(() => {
    ACTIVITY_EVENTS.forEach((e) =>
      window.addEventListener(e, markActive, { passive: true, capture: true })
    )
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pagehide', flush)
    // 返回缓存（前进后退恢复页面）时，把"上次活跃时间"重置，避免刚回来就被判定为空闲
    window.addEventListener('pageshow', markActive)

    // 心跳：每秒判断一次是否处于活跃状态
    tickId = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      if (Date.now() - lastActiveAt > IDLE_MS) return
      pendingSeconds += 1
    }, 1000)

    // 定时落盘
    flushId = window.setInterval(flush, FLUSH_MS)
  })

  onUnmounted(() => {
    flush()
    if (tickId) window.clearInterval(tickId)
    if (flushId) window.clearInterval(flushId)
    ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, markActive, { capture: true }))
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('pagehide', flush)
    window.removeEventListener('pageshow', markActive)
  })
}
