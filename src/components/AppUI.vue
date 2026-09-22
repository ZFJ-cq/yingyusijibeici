<template>
  <!-- ==================== Toast 轻提示 ==================== -->
  <transition name="toast">
    <div v-if="ui.toast.visible" class="toast" role="status" aria-live="polite">
      {{ ui.toast.message }}
    </div>
  </transition>

  <!-- ==================== 确认弹窗 ==================== -->
  <transition name="dialog">
    <div v-if="ui.confirm.visible" class="dialog-mask" @click.self="resolveConfirm(false)">
      <div class="dialog" role="dialog" aria-modal="true">
        <h3 class="dialog__title">{{ ui.confirm.title }}</h3>
        <p class="dialog__message">{{ ui.confirm.message }}</p>
        <div class="dialog__actions">
          <button class="dialog__btn" @click="resolveConfirm(false)">
            {{ ui.confirm.cancelText }}
          </button>
          <button
            class="dialog__btn dialog__btn--primary"
            :class="{ 'dialog__btn--danger': ui.confirm.danger }"
            @click="resolveConfirm(true)"
          >
            {{ ui.confirm.confirmText }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
/**
 * 全局 UI 宿主：渲染 Toast 与确认弹窗
 * 挂在 App.vue 根部，全应用共用一个实例（配合 composables/useUI.js 使用）。
 */
import { useUI } from '../composables/useUI'

const { ui, resolveConfirm } = useUI()
</script>

<style scoped>
/* ---------- Toast ---------- */
.toast {
  position: fixed;
  left: 50%;
  /* 悬浮在底部 Tab 栏之上 */
  bottom: calc(var(--tabbar-h) + 24px + env(safe-area-inset-bottom, 0px));
  transform: translateX(-50%);
  z-index: 120;
  max-width: min(88vw, 420px);
  padding: 11px 18px;
  border-radius: 999px;
  background: rgba(23, 30, 41, 0.92);
  color: #fff;
  font-size: 13.5px;
  line-height: 1.4;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.24);
  pointer-events: none;
}

/* ---------- 确认弹窗 ---------- */
.dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 110;
  background: rgba(15, 20, 28, 0.45);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.dialog {
  width: 100%;
  max-width: 320px;
  background: var(--card);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 22px 20px 16px;
  animation: pop-in 0.2s ease;
}

.dialog__title {
  margin: 0 0 8px;
  font-size: 16.5px;
  text-align: center;
}

.dialog__message {
  margin: 0 0 18px;
  font-size: 13.5px;
  line-height: 1.65;
  color: var(--muted);
  text-align: center;
}

.dialog__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.dialog__btn {
  min-height: 44px;
  border-radius: 12px;
  font-size: 14.5px;
  font-weight: 700;
  background: var(--card-soft);
  color: var(--text);
  border: 1px solid var(--border);
  transition: transform 0.14s ease;
}
.dialog__btn:active {
  transform: scale(0.97);
}
.dialog__btn--primary {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}
.dialog__btn--danger {
  background: var(--danger);
  border-color: var(--danger);
}

/* ---------- 过渡动画 ---------- */
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}

.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.18s ease;
}
.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}
</style>
