<template>
  <div class="page settings">
    <!-- ==================== 外观 ==================== -->
    <section class="card block">
      <h3 class="section-title">外观</h3>
      <div class="row">
        <div class="row__main">
          <span class="row__title">主题模式</span>
          <span class="row__desc">浅色 / 暗黑</span>
        </div>
        <div class="segmented">
          <button
            class="segmented__item"
            :class="{ 'segmented__item--active': state.settings.theme === 'light' }"
            @click="setTheme('light')"
          >
            浅色
          </button>
          <button
            class="segmented__item"
            :class="{ 'segmented__item--active': state.settings.theme === 'dark' }"
            @click="setTheme('dark')"
          >
            暗黑
          </button>
        </div>
      </div>
    </section>

    <!-- ==================== 学习 ==================== -->
    <section class="card block">
      <h3 class="section-title">学习</h3>

      <!-- 每次学习数量 -->
      <div class="row">
        <div class="row__main">
          <span class="row__title">每次学习新词数量</span>
          <span class="row__desc">建议 10 - 30 个</span>
        </div>
        <input
          class="num-input"
          type="number"
          inputmode="numeric"
          min="1"
          max="100"
          :value="state.settings.batchSize"
          @change="onBatchChange"
        />
      </div>

      <!-- 出词顺序（乱序 / 正序） -->
      <div class="row">
        <div class="row__main">
          <span class="row__title">出词顺序</span>
          <span class="row__desc">乱序更难预判，记忆效果更好</span>
        </div>
        <div class="segmented">
          <button
            class="segmented__item"
            :class="{ 'segmented__item--active': state.settings.order === 'shuffle' }"
            @click="setOrder('shuffle')"
          >
            乱序
          </button>
          <button
            class="segmented__item"
            :class="{ 'segmented__item--active': state.settings.order === 'alpha' }"
            @click="setOrder('alpha')"
          >
            正序
          </button>
        </div>
      </div>

      <!-- 朗读开关 -->
      <div class="row">
        <div class="row__main">
          <span class="row__title">单词朗读</span>
          <span class="row__desc">使用浏览器内置语音合成（Web Speech API）</span>
        </div>
        <label class="switch">
          <input
            type="checkbox"
            :checked="state.settings.speechEnabled"
            @change="setSpeechEnabled($event.target.checked)"
          />
          <span class="switch__slider"></span>
        </label>
      </div>

      <!-- 语速（仅朗读开启时显示） -->
      <div class="row" v-if="state.settings.speechEnabled">
        <div class="row__main">
          <span class="row__title">朗读语速</span>
          <span class="row__desc">当前 {{ state.settings.speechRate }}x</span>
        </div>
        <input
          class="range"
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          :value="state.settings.speechRate"
          @input="setSpeechRate($event.target.value)"
        />
      </div>
    </section>

    <!-- ==================== 数据管理 ==================== -->
    <section class="card block">
      <h3 class="section-title">数据管理</h3>

      <div class="row">
        <div class="row__main">
          <span class="row__title">导出备份</span>
          <span class="row__desc">把全部学习记录导出为 JSON 文件</span>
        </div>
        <button class="btn btn-ghost btn--compact" @click="onExport">导出</button>
      </div>

      <div class="row">
        <div class="row__main">
          <span class="row__title">导入备份</span>
          <span class="row__desc">从 JSON 文件恢复（会覆盖当前数据）</span>
        </div>
        <label class="btn btn-ghost btn--compact">
          选择
          <input type="file" accept="application/json,.json" hidden @change="onImport" />
        </label>
      </div>

      <div class="row">
        <div class="row__main">
          <span class="row__title row__title--danger">重置学习记录</span>
          <span class="row__desc">清空单词进度（保留偏好设置）</span>
        </div>
        <button class="btn btn-danger btn--compact" @click="onReset">重置</button>
      </div>
    </section>

    <!-- ==================== 关于 ==================== -->
    <section class="card block">
      <h3 class="section-title">关于</h3>
      <p class="about">
        纯前端应用，<b>无后端、不使用数据库</b>，学习数据保存在浏览器
        <code>localStorage</code>。清除浏览器数据会一并清除记录，建议定期导出备份。
      </p>
      <p class="about about--muted">
        词库：四级全量词汇 {{ stats.totalWords }} 个<br />
        复习节点：1 / 2 / 4 / 7 / 15 天
      </p>
    </section>
  </div>
</template>

<script setup>
/**
 * 设置页
 * 外观 / 学习偏好 / 数据备份与重置 / 关于
 * 所有设置项直接写入 useStore 的 state，由 watch 自动持久化到 localStorage。
 * 提示与确认统一走 useUI（应用内 Toast + 弹窗），不使用原生 alert/confirm：
 * 原生弹窗样式割裂，且在 iOS 独立运行等环境下可能被忽略导致操作静默失效。
 */
import { useStore } from '../composables/useStore'
import { useUI } from '../composables/useUI'

const {
  state,
  stats,
  setTheme,
  setBatchSize,
  setSpeechEnabled,
  setSpeechRate,
  setOrder,
  exportData,
  importData,
  resetProgress
} = useStore()

const { toast, confirmDialog } = useUI()

/** 输入数量后立即回写钳制结果，避免出现 0 或超范围的值 */
function onBatchChange(e) {
  setBatchSize(e.target.value)
  e.target.value = state.settings.batchSize
}

/** 导出：生成 Blob 并触发下载，文件名带时间戳 */
function onExport() {
  const blob = new Blob([exportData()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  a.href = url
  a.download = `cet4-backup-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** 导入：读取本地 JSON 文件并覆盖状态 */
function onImport(e) {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      importData(reader.result)
      toast('导入成功，学习记录已恢复')
    } catch (err) {
      toast('导入失败：文件格式不正确')
    }
    e.target.value = '' // 允许重复选择同一文件
  }
  reader.readAsText(file)
}

/** 重置：应用内二次确认后清空进度（保留偏好设置） */
async function onReset() {
  const ok = await confirmDialog({
    title: '重置学习记录',
    message: '将清空全部单词的学习进度，主题等偏好设置会保留。此操作不可撤销，建议先导出备份。',
    confirmText: '确认重置',
    danger: true
  })
  if (!ok) return
  resetProgress()
  toast('学习记录已重置')
}
</script>

<style scoped>
.block {
  margin-bottom: 14px;
}

/* 每一行设置项：左描述 + 右控件 */
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 0;
  border-top: 1px solid var(--border);
}
.row:first-of-type {
  border-top: none;
  padding-top: 0;
}
.row:last-child {
  padding-bottom: 0;
}
.row__main {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0; /* 允许文字换行而不撑破布局 */
}
.row__title {
  font-size: 14.5px;
  font-weight: 600;
}
.row__title--danger {
  color: var(--danger);
}
.row__desc {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.5;
}

/* 分段控件：浅色/暗黑、乱序/正序 */
.segmented {
  display: flex;
  flex-shrink: 0;
  padding: 3px;
  border-radius: 11px;
  background: var(--card-soft);
  border: 1px solid var(--border);
}
.segmented__item {
  padding: 7px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  transition: all 0.18s ease;
}
.segmented__item--active {
  background: var(--primary);
  color: #fff;
}

/* 数字输入 */
.num-input {
  width: 74px;
  height: 40px;
  flex-shrink: 0;
  text-align: center;
  font-size: 15px;
  font-weight: 700;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
}
.num-input::-webkit-outer-spin-button,
.num-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* 开关 */
.switch {
  position: relative;
  flex-shrink: 0;
  width: 50px;
  height: 30px;
}
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.switch__slider {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: var(--border);
  transition: background 0.25s ease;
  cursor: pointer;
}
.switch__slider::before {
  content: '';
  position: absolute;
  top: 4px;
  left: 4px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fff;
  box-shadow: var(--shadow-sm);
  transition: transform 0.25s ease;
}
.switch input:checked + .switch__slider {
  background: var(--success);
}
.switch input:checked + .switch__slider::before {
  transform: translateX(20px);
}

/* 语速滑块 */
.range {
  width: 130px;
  flex-shrink: 0;
  accent-color: var(--primary);
}

/* 紧凑按钮（设置行内） */
.btn--compact {
  min-height: 38px;
  padding: 8px 16px;
  font-size: 13px;
  flex-shrink: 0;
}

/* 关于文案 */
.about {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.75;
}
.about--muted {
  margin-top: 10px;
  color: var(--muted);
  font-size: 12.5px;
}
.about code {
  padding: 2px 6px;
  border-radius: 6px;
  background: var(--card-soft);
  font-size: 12px;
}
</style>
