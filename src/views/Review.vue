<template>
  <div class="page review">
    <h1 class="page-title">复习</h1>
    <p class="subtitle">翻转卡片回忆释义，凭记忆选择【记得 / 不记得】</p>

    <!-- 开始前的提示 -->
    <div v-if="!started && dueCount > 0" class="card start-panel">
      <p>当前共有 <b>{{ dueCount }}</b> 个单词到达复习时间。</p>
      <button class="btn btn-primary btn-block" @click="start">开始复习</button>
    </div>

    <!-- 无待复习 -->
    <div v-if="dueCount === 0 && !finished" class="card empty-card">
      <div class="empty-emoji">✅</div>
      <p>太棒了，暂时没有需要复习的单词！</p>
      <p class="sub">学完新词后，会在 1 / 2 / 4 / 7 / 15 天后自动安排复习。</p>
      <router-link to="/learn" class="btn btn-primary">去学新词</router-link>
    </div>

    <!-- 复习进行中 -->
    <div v-if="started && !finished && current" class="review-session">
      <div class="session-progress">
        <span>剩余 {{ remaining.length }} 个</span>
        <span class="counter">记得 {{ remembered }} · 不记得 {{ forgotten }}</span>
      </div>
      <WordCard
        :word="current"
        mode="review"
        :show-meaning="showMeaning"
        :clickable="true"
        @flip="toggleFlip"
      />
      <div class="action-row">
        <button class="btn btn-danger" @click="onForget">不记得</button>
        <button class="btn btn-success" @click="onRemember">记得</button>
      </div>
      <p class="flip-tip">提示：点击卡片可随时翻面查看释义</p>
    </div>

    <!-- 复习完成 -->
    <div v-if="finished" class="card result-card">
      <div class="result-emoji">📝</div>
      <h2>本次复习完成</h2>
      <div class="result-stats">
        <div class="rs-item">
          <div class="rs-num">{{ remembered }}</div>
          <div class="rs-label">记得</div>
        </div>
        <div class="rs-item">
          <div class="rs-num">{{ forgotten }}</div>
          <div class="rs-label">不记得</div>
        </div>
        <div class="rs-item">
          <div class="rs-num">{{ remembered + forgotten }}</div>
          <div class="rs-label">总计</div>
        </div>
      </div>
      <p class="result-note" v-if="forgotten > 0">
        不记得的单词已重置进度，将在 1 天后重新复习。
      </p>
      <div class="result-actions">
        <button class="btn btn-ghost" @click="goHome">返回看板</button>
        <button class="btn btn-primary" v-if="dueCountAfter > 0" @click="restart">继续复习</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import WordCard from '../components/WordCard.vue'
import { useStore } from '../composables/useStore'

const router = useRouter()
const { stats, getDueReviews, reviewRemember, reviewForget } = useStore()

const dueCount = computed(() => stats.value.dueCount)
const dueCountAfter = ref(0)

const started = ref(false)
const finished = ref(false)
const remaining = ref([])
const remembered = ref(0)
const forgotten = ref(0)
const showMeaning = ref(false)

const current = computed(() => remaining.value[0] || null)

function start() {
  remaining.value = getDueReviews()
  remembered.value = 0
  forgotten.value = 0
  showMeaning.value = false
  started.value = true
  finished.value = remaining.value.length === 0
}
function toggleFlip() {
  showMeaning.value = !showMeaning.value
}
function onRemember() {
  if (!current.value) return
  reviewRemember(current.value.word)
  remembered.value++
  remaining.value.shift()
  afterAction()
}
function onForget() {
  if (!current.value) return
  reviewForget(current.value.word)
  forgotten.value++
  remaining.value.shift()
  afterAction()
}
function afterAction() {
  showMeaning.value = false
  if (remaining.value.length === 0) {
    finished.value = true
    dueCountAfter.value = getDueReviews().length
  }
}
function restart() {
  finished.value = false
  start()
}
function goHome() {
  router.push('/')
}

onMounted(() => {
  if (dueCount.value === 0) finished.value = false
})
</script>

<style scoped>
.start-panel {
  text-align: center;
}
.start-panel p {
  margin: 0 0 16px;
  font-size: 16px;
}

.empty-card {
  text-align: center;
}
.empty-emoji {
  font-size: 50px;
}
.empty-card p {
  margin: 10px 0;
  font-size: 16px;
}
.empty-card .sub {
  color: var(--muted);
  font-size: 14px;
}
.empty-card .btn {
  margin-top: 14px;
}

.review-session {
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
.flip-tip {
  text-align: center;
  color: var(--muted);
  font-size: 13px;
  margin-top: 12px;
}

.result-card {
  text-align: center;
  animation: pop-in 0.3s ease;
}
.result-emoji {
  font-size: 56px;
}
.result-stats {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin: 20px 0;
}
.rs-num {
  font-size: 34px;
  font-weight: 800;
}
.rs-label {
  color: var(--muted);
  font-size: 14px;
}
.result-note {
  color: var(--muted);
  font-size: 14px;
}
.result-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 18px;
}

@media (max-width: 600px) {
  .action-row {
    grid-template-columns: 1fr;
  }
}
</style>
