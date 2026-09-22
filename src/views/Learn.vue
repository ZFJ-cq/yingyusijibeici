<template>
  <div class="page learn">
    <!-- ==================== 开始前：选择本次学习数量 ==================== -->
    <section v-if="!started" class="card setup">
      <h2 class="setup__title">本次学多少个新词？</h2>
      <p class="setup__desc">词库中还有 {{ available }} 个新词未学习</p>

      <!-- 数量步进器 -->
      <div class="stepper">
        <button class="stepper__btn" aria-label="减少" @click="decrement">−</button>
        <input
          class="stepper__input"
          type="number"
          inputmode="numeric"
          min="1"
          :max="maxBatch"
          :value="batch"
          @change="onBatchInput"
        />
        <button class="stepper__btn" aria-label="增加" @click="increment">＋</button>
      </div>

      <!-- 常用数量快捷选择（超出剩余新词数时自动收敛） -->
      <div class="presets">
        <button
          v-for="p in presets"
          :key="p"
          class="preset"
          :class="{ 'preset--active': batch === clampedPreset(p) }"
          @click="setPreset(p)"
        >
          {{ p }}
        </button>
      </div>

      <button class="btn btn-primary btn-block" :disabled="available === 0" @click="start">
        {{ available === 0 ? '没有新词可学了' : '开始学习' }}
      </button>
    </section>

    <!-- ==================== 学习中 ==================== -->
    <section v-if="started && !finished" class="session">
      <!-- 本次批次进度条 -->
      <div class="batch-head">
        <span>剩余 {{ remaining.length }} 个</span>
        <span class="batch-head__count">认识 {{ known }} · 不认识 {{ unknown }}</span>
      </div>
      <div class="batch-bar">
        <div class="batch-bar__fill" :style="{ width: batchPercent + '%' }"></div>
      </div>

      <WordCard :word="current" mode="learn" />

      <!-- 认识 / 不认识 -->
      <div class="actions">
        <button class="btn btn-danger" @click="onUnknown">不认识</button>
        <button class="btn btn-success" @click="onKnown">认识</button>
      </div>
      <div class="session__foot">
        <span class="session__tip">「不认识」会排到本批末尾，稍后再来一次</span>
        <button class="link-btn" @click="endBatch">结束本批</button>
      </div>
    </section>

    <!-- ==================== 本批完成 ==================== -->
    <section v-if="finished" class="card result">
      <span class="result__emoji">{{ endedEarly ? '⏸️' : '🎉' }}</span>
      <h2 class="result__title">{{ endedEarly ? '本批已结束' : '本批学习完成' }}</h2>
      <p class="result__text">
        认识 <b>{{ known }}</b> 个 · 反复不认识 <b>{{ unknown }}</b> 个
        <template v-if="endedEarly && remaining.length">
          <br />还有 <b>{{ remaining.length }}</b> 个未学习，可稍后继续
        </template>
      </p>
      <p class="result__note">已学单词已加入复习计划，将在 1 天后首次复习</p>
      <div class="result__actions">
        <button class="btn btn-ghost" @click="goHome">返回看板</button>
        <button v-if="available > 0" class="btn btn-primary" @click="reset">再学一批</button>
      </div>
    </section>
  </div>
</template>

<script setup>
/**
 * 学新词
 * 流程：选数量 → 逐张卡片判断「认识 / 不认识」→ 出本批统计
 * - 认识   ：记入复习计划（1 天后首次复习）
 * - 不认识 ：移到本批队尾，稍后重学（仍算"新词"，不写入进度）
 * - 结束本批：中途退出，已点「认识」的词会保留在复习计划中
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import WordCard from '../components/WordCard.vue'
import { useStore } from '../composables/useStore'
import { useUI } from '../composables/useUI'

const router = useRouter()
const { stats, state, getNewWords, learnWord, setBatchSize } = useStore()
const { toast } = useUI()

const presets = [10, 20, 30, 50] // 常用数量

/** 词库中剩余新词数：直接用统计结果，避免为取长度而过滤+洗牌整个词库 */
const available = computed(() => stats.value.newCount)
/** 单次学习数量上限（与设置页保持一致） */
const MAX_BATCH = 100
/** 实际可选上限 = min(单次上限, 剩余新词数) */
const maxBatch = computed(() => Math.max(1, Math.min(MAX_BATCH, available.value || 1)))

const batch = ref(state.settings.batchSize) // 本次计划学习数量
const started = ref(false) // 是否已开始
const finished = ref(false) // 本批是否结束
const endedEarly = ref(false) // 是否为中途"结束本批"
const remaining = ref([]) // 待学队列（当前卡 = 队列第一项）
const total = ref(0) // 本批总数（用于算进度）
const known = ref(0) // 本批「认识」次数
const unknown = ref(0) // 本批「不认识」次数

/** 当前卡片 */
const current = computed(() => remaining.value[0] || null)

/** 批次进度百分比 */
const batchPercent = computed(() => {
  if (!total.value) return 0
  return Math.round(((total.value - remaining.value.length) / total.value) * 100)
})

/** 把预设值收敛到剩余可用范围，用于高亮当前选中项 */
function clampedPreset(n) {
  return Math.min(n, available.value || n)
}

function decrement() {
  batch.value = Math.max(1, batch.value - 1)
}
function increment() {
  batch.value = Math.min(maxBatch.value, batch.value + 1)
}
function setPreset(n) {
  batch.value = clampedPreset(n)
}

/** 手动输入数量：统一按 1 ~ maxBatch 钳制（此前缺上限校验，可输入 999） */
function onBatchInput(e) {
  const v = parseInt(e.target.value, 10) || 1
  batch.value = Math.max(1, Math.min(maxBatch.value, v))
  e.target.value = batch.value
}

/** 开始一批学习：按设置数量取出新词（乱序，见 useStore.getNewWords） */
function start() {
  if (available.value === 0) {
    toast('没有新词可学了')
    return
  }
  // 数量先经过统一钳制（1-100），再写入设置，避免把异常值持久化
  const n = Math.max(1, Math.min(MAX_BATCH, batch.value, available.value))
  setBatchSize(n)
  batch.value = state.settings.batchSize

  remaining.value = getNewWords(n)
  total.value = remaining.value.length
  known.value = 0
  unknown.value = 0
  endedEarly.value = false
  started.value = true
  finished.value = remaining.value.length === 0
}

/** 认识：写入复习计划并从队列移除 */
function onKnown() {
  if (!current.value) return
  learnWord(current.value.word)
  known.value++
  remaining.value.shift()
  if (remaining.value.length === 0) finished.value = true
}

/** 不认识：计数后移到队尾，稍后重学 */
function onUnknown() {
  if (!current.value) return
  unknown.value++
  remaining.value.push(remaining.value.shift())
}

/** 结束本批：中途退出，直接看本批统计 */
function endBatch() {
  endedEarly.value = true
  finished.value = true
}

/** 再学一批：回到设置界面（available 已是响应式，会自动反映最新剩余数） */
function reset() {
  started.value = false
  finished.value = false
  endedEarly.value = false
  batch.value = Math.min(state.settings.batchSize, maxBatch.value)
}

function goHome() {
  router.push('/')
}

onMounted(() => {
  batch.value = Math.min(state.settings.batchSize, maxBatch.value)
})
</script>

<style scoped>
/* ---------- 设置区 ---------- */
.setup__title {
  margin: 0 0 4px;
  font-size: 18px;
}
.setup__desc {
  margin: 0 0 18px;
  font-size: 13px;
  color: var(--muted);
}

.stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-bottom: 14px;
}
.stepper__btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 22px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.stepper__btn:active {
  transform: scale(0.92);
}
.stepper__input {
  width: 88px;
  height: 44px;
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  /* 去掉 number 输入框的上下箭头，移动端更清爽 */
  -moz-appearance: textfield;
}
.stepper__input::-webkit-outer-spin-button,
.stepper__input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.presets {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 20px;
}
.preset {
  flex: 1;
  max-width: 74px;
  padding: 9px 0;
  border-radius: 10px;
  background: var(--card-soft);
  border: 1px solid var(--border);
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
  transition: all 0.16s ease;
}
.preset--active {
  background: var(--primary-soft);
  border-color: var(--primary);
  color: var(--primary);
}

/* ---------- 学习区 ---------- */
.batch-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
}
.batch-head__count {
  color: var(--text);
}
.batch-bar {
  height: 6px;
  border-radius: 999px;
  background: var(--border);
  overflow: hidden;
  margin-bottom: 14px;
}
.batch-bar__fill {
  height: 100%;
  border-radius: 999px;
  background: var(--primary);
  transition: width 0.35s ease;
}

.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 16px;
}
.actions .btn {
  min-height: 54px;
  font-size: 16px;
}

.session__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 14px 4px 0;
}
.session__tip {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.5;
}
.link-btn {
  flex-shrink: 0;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--primary);
  padding: 6px 2px;
}

/* ---------- 结果区 ---------- */
.result {
  text-align: center;
  padding: 30px 20px;
}
.result__emoji {
  font-size: 52px;
  line-height: 1;
}
.result__title {
  margin: 12px 0 0;
  font-size: 20px;
}
.result__text {
  margin: 14px 0 0;
  font-size: 15px;
  line-height: 1.7;
}
.result__note {
  margin: 8px 0 22px;
  font-size: 13px;
  color: var(--muted);
}
.result__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
.result__actions .btn {
  flex: 1;
}
</style>
