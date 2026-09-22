<template>
  <div class="page settings">
    <h1 class="page-title">设置</h1>
    <p class="subtitle">个性化你的学习体验</p>

    <!-- 外观 -->
    <div class="card setting-block">
      <h3 class="block-title">外观</h3>
      <div class="row">
        <div>
          <div class="row-title">主题模式</div>
          <div class="row-desc">浅色 / 暗黑模式</div>
        </div>
        <div class="theme-switch">
          <button
            class="theme-btn"
            :class="{ active: state.settings.theme === 'light' }"
            @click="setTheme('light')"
          >
            ☀️ 浅色
          </button>
          <button
            class="theme-btn"
            :class="{ active: state.settings.theme === 'dark' }"
            @click="setTheme('dark')"
          >
            🌙 暗黑
          </button>
        </div>
      </div>
    </div>

    <!-- 学习 -->
    <div class="card setting-block">
      <h3 class="block-title">学习</h3>
      <div class="row">
        <div>
          <div class="row-title">每次学习新词数量</div>
          <div class="row-desc">建议 10 - 30 个</div>
        </div>
        <input
          class="num-input"
          type="number"
          min="1"
          max="100"
          :value="state.settings.batchSize"
          @change="onBatchChange"
        />
      </div>
      <div class="row">
        <div>
          <div class="row-title">单词朗读</div>
          <div class="row-desc">使用浏览器内置语音合成（Web Speech API）</div>
        </div>
        <label class="switch">
          <input
            type="checkbox"
            :checked="state.settings.speechEnabled"
            @change="setSpeechEnabled($event.target.checked)"
          />
          <span class="slider"></span>
        </label>
      </div>
      <div class="row" v-if="state.settings.speechEnabled">
        <div>
          <div class="row-title">朗读语速</div>
          <div class="row-desc">当前 {{ state.settings.speechRate }}x</div>
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
    </div>

    <!-- 数据管理 -->
    <div class="card setting-block">
      <h3 class="block-title">数据管理</h3>
      <div class="row">
        <div>
          <div class="row-title">导出备份</div>
          <div class="row-desc">将全部学习记录导出为 JSON 文件</div>
        </div>
        <button class="btn btn-ghost" @click="onExport">导出</button>
      </div>
      <div class="row">
        <div>
          <div class="row-title">导入备份</div>
          <div class="row-desc">从 JSON 文件恢复学习记录（会覆盖当前数据）</div>
        </div>
        <label class="btn btn-ghost file-label">
          选择文件
          <input type="file" accept="application/json,.json" @change="onImport" hidden />
        </label>
      </div>
      <div class="row">
        <div>
          <div class="row-title danger-text">重置学习记录</div>
          <div class="row-desc">清空所有单词进度（保留偏好设置）</div>
        </div>
        <button class="btn btn-danger" @click="onReset">重置</button>
      </div>
    </div>

    <!-- 关于 -->
    <div class="card setting-block about">
      <h3 class="block-title">关于</h3>
      <p>
        本应用为纯前端应用，<b>无需后端、不使用数据库</b>，所有学习数据均保存在浏览器
        <code>localStorage</code> 中。清除浏览器数据会一并清除学习记录，建议定期导出备份。
      </p>
      <p class="muted">
        词库：内置四级高频词 {{ stats.totalWords }} 个（可替换为完整词表）<br />
        遗忘曲线复习节点：1 / 2 / 4 / 7 / 15 天
      </p>
    </div>
  </div>
</template>

<script setup>
import { useStore } from '../composables/useStore'

const {
  state,
  stats,
  setTheme,
  setBatchSize,
  setSpeechEnabled,
  setSpeechRate,
  exportData,
  importData,
  resetProgress
} = useStore()

function onBatchChange(e) {
  setBatchSize(e.target.value)
  e.target.value = state.settings.batchSize
}

function onExport() {
  const data = exportData()
  const blob = new Blob([data], { type: 'application/json' })
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

function onImport(e) {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      importData(reader.result)
      window.alert('导入成功！学习记录已恢复。')
    } catch (err) {
      window.alert('导入失败：文件格式不正确。')
    }
    e.target.value = ''
  }
  reader.readAsText(file)
}

function onReset() {
  const ok = window.confirm(
    '确定要重置所有学习记录吗？此操作不可撤销（建议先导出备份）。'
  )
  if (ok) {
    resetProgress()
    window.alert('学习记录已重置。')
  }
}
</script>

<style scoped>
.setting-block {
  margin-bottom: 18px;
}
.block-title {
  margin: 0 0 16px;
  font-size: 16px;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 0;
  border-top: 1px solid var(--border);
}
.row:first-of-type {
  border-top: none;
  padding-top: 0;
}
.row-title {
  font-weight: 600;
}
.row-desc {
  color: var(--muted);
  font-size: 13px;
  margin-top: 4px;
}
.danger-text {
  color: var(--danger);
}

.theme-switch {
  display: flex;
  gap: 8px;
}
.theme-btn {
  padding: 10px 16px;
  border-radius: 10px;
  background: var(--bg);
  color: var(--muted);
  font-weight: 600;
  border: 1px solid var(--border);
  transition: all 0.2s ease;
}
.theme-btn.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

.num-input {
  width: 80px;
  height: 38px;
  text-align: center;
  font-size: 16px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
}

.range {
  width: 160px;
  accent-color: var(--primary);
}

.switch {
  position: relative;
  display: inline-block;
  width: 52px;
  height: 30px;
  flex-shrink: 0;
}
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: var(--border);
  border-radius: 999px;
  transition: 0.25s;
}
.slider::before {
  content: '';
  position: absolute;
  height: 22px;
  width: 22px;
  left: 4px;
  top: 4px;
  background: #fff;
  border-radius: 50%;
  transition: 0.25s;
  box-shadow: var(--shadow-sm);
}
.switch input:checked + .slider {
  background: var(--success);
}
.switch input:checked + .slider::before {
  transform: translateX(22px);
}

.file-label {
  display: inline-flex;
  align-items: center;
}

.about p {
  font-size: 14px;
  line-height: 1.7;
  margin: 0 0 10px;
}
.about code {
  background: var(--bg);
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 13px;
}
.muted {
  color: var(--muted);
}
</style>
