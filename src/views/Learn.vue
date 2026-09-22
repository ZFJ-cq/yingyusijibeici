<template>
  <div class="page learn">
    <h1 class="page-title">学新词</h1>
    <p class="subtitle">卡片展示单词、音标、释义与例句，点击【认识】开始记忆</p>

    <!-- 设置：本次学习数量 -->
    <div class="card settings-row" v-if="!started">
      <label class="field-label">本次学习新词数量</label>
      <div class="batch-control">
        <button class="step-btn" @click="decrement">−</button>
        <input
          class="batch-input"
          type="number"
          min="1"
          :max="available"
          v-model.number="batch"
        />
        <button class="step-btn" @click="increment">＋</button>
        <span class="available-hint">共可学 {{ available }} 个</span>
      </div>
      <button class="btn btn-primary btn-block start-btn" @click="start">开始学习</button>
    </div>

    <!-- 学习进行中 -->
    <div v-if="started && !finished" class="learn-session">
      <div class="session-progress">
        <span>剩余 {{ remaining.length }} 个</span>
        <span class="counter">已认识 {{ known }} · 不认识 {{ unknown }}</span>
      </div>
      <WordCard :word="current" mode="learn" />
      <div class="action-row">
        <button class="btn btn-danger" @click="onUnknown">不认识</button>
        <button class="btn btn-success" @click="onKnown">认识</button>
      </div>
    </div>

    <!-- 学习完成 -->
    <div v-if="finished" class="card result-card">
      <div class="result-emoji">🎉</div>
      <h2>本批学习完成</h2>
      <p class="result-text">
        认识 <b>{{ known }}</b> 个 · 反复不认识 <b>{{ unknown }}</b> 个<br />
        这些单词已加入复习计划，将在 1 天后首次复习。
      </p>
      <div class="result-actions">
        <button class="btn btn-ghost" @click="goHome">返回看板</button>
        <button class="btn btn-primary" v-if="available > 0" @click="restart">再学一批</button>
      </div>
    </div>

    <div v-if="started && !finished && remaining.length === 0" class="empty-hint">加载中…</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import WordCard from '../components/WordCard.vue'
import { useStore } from '../composables/useStore'

const router = useRouter()
const { state, getNewWords, learnWord } = useStore()

const available = ref(0)
const batch = ref(state.settings.batchSize)
const started = ref(false)
const finished = ref(false)
const remaining = ref([])
const known = ref(0)
const unknown = ref(0)

const current = computed(() => remaining.value[0] || null)

function decrement() {
  batch.value = Math.max(1, batch.value - 1)
}
function increment() {
  batch.value = Math.min(available.value || 1, batch.value + 1)
}

function start() {
  const n = Math.max(1, Math.min(batch.value, available.value))
  state.settings.batchSize = n
  remaining.value = getNewWords(n)
  known.value = 0
  unknown.value = 0
  started.value = true
  finished.value = remaining.value.length === 0
}

function onKnown() {
  if (!current.value) return
  learnWord(current.value.word)
  known.value++
  remaining.value.shift()
  checkFinished()
}
function onUnknown() {
  if (!current.value) return
  unknown.value++
  // 不认识：移到队尾，稍后再学（保持为“新词”）
  const w = remaining.value.shift()
  remaining.value.push(w)
}
function checkFinished() {
  if (remaining.value.length === 0) finished.value = true
}
function restart() {
  started.value = false
  finished.value = false
  available.value = getNewWords().length
  batch.value = Math.min(state.settings.batchSize, available.value || 1)
}
function goHome() {
  router.push('/')
}

onMounted(() => {
  available.value = getNewWords().length
  batch.value = Math.min(state.settings.batchSize, available.value || 1)
})
</script>

<style scoped>
.settings-row {
  margin-bottom: 18px;
}
.field-label {
  font-weight: 600;
  display: block;
  margin-bottom: 10px;
}
.batch-control {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}
.step-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 20px;
  font-weight: 700;
}
.batch-input {
  width: 70px;
  height: 38px;
  text-align: center;
  font-size: 16px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
}
.available-hint {
  color: var(--muted);
  font-size: 13px;
}
.start-btn {
  margin-top: 4px;
}

.learn-session {
  animation: fade-in 0.3s ease;
}
.session-progress {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
  color: var(--muted);
  font-weight: 600;
}
.counter {
  color: var(--text);
}
.action-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 18px;
}
.action-row .btn {
  padding: 16px;
  font-size: 17px;
}

.result-card {
  text-align: center;
  animation: pop-in 0.3s ease;
}
.result-emoji {
  font-size: 56px;
}
.result-text {
  color: var(--muted);
  line-height: 1.7;
  margin: 14px 0 22px;
}
.result-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

@media (max-width: 600px) {
  .action-row {
    grid-template-columns: 1fr;
  }
}
</style>
