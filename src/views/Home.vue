<template>
  <div class="page home">
    <!-- ==================== 今日主卡片（驱动下一步行动） ==================== -->
    <section class="hero card">
      <p class="hero__greet">{{ greeting }}</p>
      <h2 class="hero__title">{{ heroTitle }}</h2>
      <p class="hero__desc">{{ heroDesc }}</p>
      <button class="btn btn-primary btn-block" :disabled="heroDisabled" @click="heroGo">
        {{ heroActionText }}
      </button>
    </section>

    <!-- ==================== 三个核心数字 ==================== -->
    <div class="stat-grid">
      <div class="stat-card stat-card--due">
        <span class="stat-card__num">{{ stats.dueCount }}</span>
        <span class="stat-card__label">待复习</span>
      </div>
      <div class="stat-card stat-card--new">
        <span class="stat-card__num">{{ stats.newCount }}</span>
        <span class="stat-card__label">新词</span>
      </div>
      <div class="stat-card stat-card--mastered">
        <span class="stat-card__num">{{ stats.masteredCount }}</span>
        <span class="stat-card__label">已掌握</span>
      </div>
    </div>

    <!-- ==================== 总体进度 ==================== -->
    <section class="card progress">
      <div class="progress__head">
        <span class="section-title" style="margin: 0">总体进度</span>
        <span class="progress__text">
          {{ stats.learnedCount }} / {{ stats.totalWords }}
        </span>
      </div>
      <div class="progress__bar">
        <div class="progress__fill" :style="{ width: learnedPercent + '%' }"></div>
      </div>
      <div class="progress__meta">
        <span>学习中 {{ stats.learningCount }}</span>
        <span>今日已复习 {{ stats.todayReviews }}</span>
      </div>
    </section>

    <!-- ==================== 两个入口 ==================== -->
    <div class="entry-grid">
      <router-link to="/learn" class="entry-card">
        <span class="entry-card__icon entry-card__icon--learn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v14H6.5A2.5 2.5 0 0 0 4 19.5z" />
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20v4H6.5A2.5 2.5 0 0 1 4 19.5z" />
          </svg>
        </span>
        <span class="entry-card__title">学新词</span>
        <span class="entry-card__desc">本次可学 {{ learnableCount }} 个</span>
      </router-link>

      <router-link to="/review" class="entry-card">
        <span class="entry-card__icon entry-card__icon--review">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M23 4v6h-6" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </span>
        <span class="entry-card__title">复习</span>
        <span class="entry-card__desc">{{ stats.dueCount }} 个待复习</span>
      </router-link>
    </div>

    <!-- ==================== 遗忘曲线说明（帮助新用户理解机制） ==================== -->
    <p class="footnote">
      遗忘曲线复习节点：1 / 2 / 4 / 7 / 15 天 · 复习「记得」进入下一节点，满 5 次即为已掌握
    </p>
  </div>
</template>

<script setup>
/**
 * 首页看板
 * 用一张主卡片告诉用户"现在该做什么"（有到期就复习，没有就去学新词），
 * 下面依次是核心数字、总体进度、两个功能入口。
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '../composables/useStore'

const router = useRouter()
const { stats, state } = useStore()

/* 根据当前时间给出问候语 */
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了，注意休息'
  if (h < 12) return '早上好'
  if (h < 18) return '下午好'
  return '晚上好'
})

/* 主卡片文案：优先提示复习，其次学新词，都完成则祝贺 */
const heroTitle = computed(() => {
  if (stats.value.dueCount > 0) return `有 ${stats.value.dueCount} 个单词待复习`
  if (stats.value.newCount > 0) return '今天没有待复习'
  return '全部单词都已掌握 🎉'
})

const heroDesc = computed(() => {
  if (stats.value.dueCount > 0) return '趁记忆还在，及时复习效果最好'
  if (stats.value.newCount > 0) return '来背几个新单词，扩充你的词库'
  return '可以去统计页看看这一路的学习轨迹'
})

/* 主按钮：有到期→去复习；否则→去学新词；都没有则不可点 */
const heroActionText = computed(() => {
  if (stats.value.dueCount > 0) return '开始复习'
  if (stats.value.newCount > 0) return '开始学新词'
  return '词库已全部掌握'
})

const heroDisabled = computed(() => stats.value.dueCount === 0 && stats.value.newCount === 0)

function heroGo() {
  router.push(stats.value.dueCount > 0 ? '/review' : '/learn')
}

/* 本次最多可学的新词数（受"每次学习数量"设置限制）
   直接用 stats.newCount：避免为了取长度而过滤 + 洗牌整个词库 */
const learnableCount = computed(() => Math.min(stats.value.newCount, state.settings.batchSize))

/* 总体进度百分比 */
const learnedPercent = computed(() => {
  if (!stats.value.totalWords) return 0
  return Math.round((stats.value.learnedCount / stats.value.totalWords) * 100)
})
</script>

<style scoped>
/* ---------- 主卡片 ---------- */
.hero {
  background: linear-gradient(135deg, var(--primary) 0%, #7b9cff 100%);
  color: #fff;
  box-shadow: 0 14px 30px rgba(79, 124, 255, 0.28);
  margin-bottom: 14px;
}
.hero__greet {
  margin: 0;
  font-size: 13px;
  opacity: 0.85;
}
.hero__title {
  margin: 6px 0 0;
  font-size: 22px;
  font-weight: 800;
  line-height: 1.3;
}
.hero__desc {
  margin: 8px 0 16px;
  font-size: 13.5px;
  opacity: 0.9;
}
/* 主卡片里的按钮反色，保证对比度 */
.hero .btn-primary {
  background: #fff;
  color: var(--primary);
  box-shadow: none;
}
.hero .btn:disabled {
  opacity: 0.7;
}

/* ---------- 三个数字 ---------- */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 14px;
}
.stat-card {
  border-radius: var(--radius);
  padding: 16px 8px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
  animation: pop-in 0.3s ease;
}
.stat-card--due {
  background: var(--warning-soft);
}
.stat-card--new {
  background: var(--primary-soft);
}
.stat-card--mastered {
  background: var(--success-soft);
}
.stat-card__num {
  font-size: 26px;
  font-weight: 800;
  line-height: 1.1;
}
.stat-card__label {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
}

/* ---------- 进度 ---------- */
.progress {
  margin-bottom: 14px;
}
.progress__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.progress__text {
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
}
.progress__bar {
  height: 10px;
  border-radius: 999px;
  background: var(--border);
  overflow: hidden;
}
.progress__fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--primary), #7da0ff);
  transition: width 0.5s ease;
}
.progress__meta {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: var(--muted);
}

/* ---------- 两个入口 ---------- */
.entry-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.entry-card {
  background: var(--card);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  padding: 20px 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transition: transform 0.16s ease, box-shadow 0.16s ease;
}
.entry-card:active {
  transform: scale(0.97);
}
/* 入口图标：用 SVG 描边图标，避免 emoji 在不同系统/浏览器下渲染不一致 */
.entry-card__icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
}
.entry-card__icon svg {
  width: 24px;
  height: 24px;
  display: block;
}
.entry-card__icon--learn {
  background: var(--primary-soft);
  color: var(--primary);
}
.entry-card__icon--review {
  background: var(--warning-soft);
  color: var(--warning);
}
.entry-card__title {
  font-size: 16px;
  font-weight: 700;
}
.entry-card__desc {
  font-size: 12px;
  color: var(--muted);
}

/* ---------- 脚注 ---------- */
.footnote {
  margin: 16px 2px 0;
  font-size: 12px;
  line-height: 1.7;
  color: var(--muted);
  text-align: center;
}
</style>
