<template>
  <div class="page review">
    <!-- ==================== 开始前 ==================== -->
    <section v-if="!started && stats.dueCount > 0" class="card ready">
      <span class="ready__emoji">🔔</span>
      <h2 class="ready__title">有 {{ stats.dueCount }} 个单词到期了</h2>
      <p class="ready__desc">先凭记忆回想，再点击卡片翻面核对释义</p>
      <button class="btn btn-primary btn-block" @click="start">开始复习</button>
    </section>

    <!-- ==================== 无到期单词 ==================== -->
    <section v-if="!started && stats.dueCount === 0" class="card empty">
      <span class="empty__emoji">✅</span>
      <h2 class="empty__title">暂无待复习单词</h2>
      <p class="empty__desc">学完新词后，会按 1 / 2 / 4 / 7 / 15 天自动安排复习</p>
      <router-link to="/learn" class="btn btn-primary btn-block">去学新词</router-link>
    </section>

    <!-- ==================== 复习中 ==================== -->
    <section v-if="started && !finished" class="session">
      <div class="session__bar">
        <span>剩余 {{ remaining.length }} 个</span>
        <span class="session__count">记得 {{ remembered }} · 不记得 {{ forgotten }}</span>
      </div>

      <!-- 当前单词处于遗忘曲线的第几个节点，以及点「记得」后的安排 -->
      <div v-if="node" class="node">
        <span class="node__pill">第 {{ node.index }}/{{ node.total }} 次复习</span>
        <span class="node__hint">
          {{ node.willMaster ? '记得 → 标记为已掌握' : `记得 → ${node.nextDays} 天后复习` }}
        </span>
      </div>

      <!-- 翻转卡片：点击卡片切换正反面 -->
      <WordCard
        :word="current"
        mode="review"
        :show-meaning="showMeaning"
        clickable
        @flip="toggleFlip"
      />

      <div class="actions">
        <button class="btn btn-danger" @click="onForget">不记得</button>
        <button class="btn btn-success" @click="onRemember">记得</button>
      </div>
      <div class="session__foot">
        <span class="session__tip">点击卡片可随时翻面查看释义</span>
        <button class="link-btn" @click="endEarly">结束复习</button>
      </div>
    </section>

    <!-- ==================== 本次统计 ==================== -->
    <section v-if="finished" class="card result">
      <span class="result__emoji">{{ endedEarly ? '⏸️' : '📝' }}</span>
      <h2 class="result__title">{{ endedEarly ? '本次复习已结束' : '本次复习完成' }}</h2>

      <div class="result__stats">
        <div class="result__item">
          <span class="result__num">{{ remembered }}</span>
          <span class="result__label">记得</span>
        </div>
        <div class="result__item">
          <span class="result__num">{{ forgotten }}</span>
          <span class="result__label">不记得</span>
        </div>
        <div class="result__item">
          <span class="result__num">{{ remembered + forgotten }}</span>
          <span class="result__label">已复习</span>
        </div>
      </div>

      <p class="result__note" :class="{ 'result__note--warn': forgotten > 0 }">
        {{
          forgotten > 0
            ? `不记得的 ${forgotten} 个单词已重置进度，将在 1 天后重新复习`
            : '全部记得，记忆很牢固！'
        }}
      </p>
      <p v-if="endedEarly && remaining.length" class="result__note">
        还有 {{ remaining.length }} 个单词未复习，随时可以再来
      </p>

      <div class="result__actions">
        <button class="btn btn-ghost" @click="goHome">返回看板</button>
        <button v-if="endedEarly && remaining.length" class="btn btn-primary" @click="resume">
          继续复习
        </button>
        <button v-else class="btn btn-primary" @click="goStats">查看统计</button>
      </div>
    </section>
  </div>
</template>

<script setup>
/**
 * 复习页
 * 流程：取所有到期单词 → 翻转卡片回忆 → 判断「记得 / 不记得」→ 出本次统计
 * - 记得   ：进入下一个复习节点（满 5 次即已掌握）
 * - 不记得 ：重置进度，1 天后从头再来
 * - 结束复习：中途退出，已判断过的单词结果已保存
 */
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import WordCard from '../components/WordCard.vue'
import { useStore } from '../composables/useStore'

const router = useRouter()
const { state, stats, REVIEW_INTERVALS, getDueReviews, reviewRemember, reviewForget } = useStore()

const started = ref(false) // 是否已开始
const finished = ref(false) // 本次是否结束
const endedEarly = ref(false) // 是否为中途"结束复习"
const remaining = ref([]) // 待复习队列
const remembered = ref(0) // 本次「记得」数
const forgotten = ref(0) // 本次「不记得」数
const showMeaning = ref(false) // 卡片是否翻到释义面

/** 当前卡片 */
const current = computed(() => remaining.value[0] || null)

/**
 * 当前单词在遗忘曲线上的位置
 * reviewsDone = 已成功复习次数；下一次复习时间是 INTERVALS[reviewsDone]
 * 所以现在正处在「第 reviewsDone + 1 次」复习
 */
const node = computed(() => {
  if (!current.value) return null
  const p = state.progress[current.value.word]
  if (!p) return null

  const total = REVIEW_INTERVALS.length
  const index = p.reviewsDone + 1
  const willMaster = index >= total // 这是最后一次，答对即掌握
  return {
    index: Math.min(index, total),
    total,
    willMaster,
    // 点「记得」后，距离下次复习还有几天
    nextDays: willMaster ? null : REVIEW_INTERVALS[p.reviewsDone + 1]
  }
})

/** 点击卡片：切换正面 / 释义面 */
function toggleFlip() {
  showMeaning.value = !showMeaning.value
}

/** 开始复习：取出全部到期单词（顺序遵循设置） */
function start() {
  remaining.value = getDueReviews()
  remembered.value = 0
  forgotten.value = 0
  endedEarly.value = false
  showMeaning.value = false
  started.value = true
  finished.value = remaining.value.length === 0
}

/** 记得：推进复习节点 */
function onRemember() {
  if (!current.value) return
  reviewRemember(current.value.word)
  remembered.value++
  next()
}

/** 不记得：重置该词进度 */
function onForget() {
  if (!current.value) return
  reviewForget(current.value.word)
  forgotten.value++
  next()
}

/** 出队并复位翻面状态；队列清空则结束 */
function next() {
  remaining.value.shift()
  showMeaning.value = false
  if (remaining.value.length === 0) finished.value = true
}

/** 结束复习：中途退出，直接看本次统计 */
function endEarly() {
  endedEarly.value = true
  finished.value = true
}

/** 继续复习剩余的到期单词（结束复习后回到会话） */
function resume() {
  if (remaining.value.length === 0) {
    start() // 队列已空则重新取一次到期词（正常不会走到这里）
    return
  }
  endedEarly.value = false
  finished.value = false
  showMeaning.value = false
}

function goHome() {
  router.push('/')
}
function goStats() {
  router.push('/stats')
}
</script>

<style scoped>
/* ---------- 开始前 ---------- */
.ready,
.empty {
  text-align: center;
  padding: 30px 20px;
}
.ready__emoji,
.empty__emoji {
  font-size: 46px;
  line-height: 1;
}
.ready__title,
.empty__title {
  margin: 12px 0 0;
  font-size: 19px;
}
.ready__desc,
.empty__desc {
  margin: 8px 0 22px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--muted);
}

/* ---------- 复习中 ---------- */
.session__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
}
.session__count {
  color: var(--text);
}

/* 复习节点提示 */
.node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}
.node__pill {
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 11.5px;
  font-weight: 700;
}
.node__hint {
  font-size: 11.5px;
  color: var(--muted);
  text-align: right;
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
}
.link-btn {
  flex-shrink: 0;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--primary);
  padding: 6px 2px;
}

/* ---------- 结果统计 ---------- */
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
.result__stats {
  display: flex;
  justify-content: center;
  gap: 28px;
  margin: 22px 0 4px;
}
.result__item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.result__num {
  font-size: 30px;
  font-weight: 800;
  line-height: 1.1;
}
.result__label {
  font-size: 12px;
  color: var(--muted);
}
.result__note {
  margin: 14px 0 0;
  font-size: 13px;
  color: var(--muted);
}
.result__note--warn {
  color: var(--warning);
}
.result__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 22px;
}
.result__actions .btn {
  flex: 1;
}
</style>
