import { reactive } from 'vue'

/**
 * 轻量全局 UI 状态：Toast 轻提示 + 应用内确认弹窗
 * ----------------------------------------------------------------------------
 * 为什么不用原生 window.alert / window.confirm：
 *   1. 原生弹窗样式与 App 观感割裂，暗黑模式下仍是白底系统样式；
 *   2. 在 iOS「添加到主屏」独立运行、或被 iframe 嵌入等场景下，
 *      confirm/alert 可能被浏览器忽略，导致"重置/导入提示"静默失效；
 *   3. 原生弹窗会阻塞页面，无法做样式与动画。
 * 所以统一改为应用内实现，由 <AppUI /> 负责渲染。
 */

/** UI 状态（全局单例） */
const ui = reactive({
  toast: { visible: false, message: '' },
  confirm: {
    visible: false,
    title: '',
    message: '',
    confirmText: '确定',
    cancelText: '取消',
    danger: false,
    _resolve: null // 保存 Promise 的 resolve，供按钮回调用
  }
})

let toastTimer = null

/**
 * 顶部/底部轻提示，自动消失
 * @param {string} message 提示文案
 * @param {number} duration 持续毫秒数
 */
function toast(message, duration = 2000) {
  ui.toast.message = message
  ui.toast.visible = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    ui.toast.visible = false
  }, duration)
}

/**
 * 应用内确认弹窗（Promise 化）
 * 用法：const ok = await confirm({ title:'重置', message:'...', danger:true })
 * @returns {Promise<boolean>} 用户点确认返回 true，取消返回 false
 */
function confirmDialog({ title = '确认', message = '', confirmText = '确定', cancelText = '取消', danger = false } = {}) {
  // 若已有弹窗未关闭，先把它当作"取消"处理，避免 Promise 永久挂起
  if (ui.confirm._resolve) {
    const prev = ui.confirm._resolve
    ui.confirm._resolve = null
    prev(false)
  }

  return new Promise((resolve) => {
    ui.confirm.visible = true
    ui.confirm.title = title
    ui.confirm.message = message
    ui.confirm.confirmText = confirmText
    ui.confirm.cancelText = cancelText
    ui.confirm.danger = danger
    ui.confirm._resolve = resolve
  })
}

/** 关闭弹窗并回传结果（由弹窗按钮调用） */
function resolveConfirm(value) {
  const resolve = ui.confirm._resolve
  ui.confirm.visible = false
  ui.confirm._resolve = null
  if (resolve) resolve(value)
}

export function useUI() {
  return { ui, toast, confirmDialog, resolveConfirm }
}
