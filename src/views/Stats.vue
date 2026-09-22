<template>
  <div class="page stats">
    <!-- ==================== 学习概览 ==================== -->
    <section class="card overview-card">
      <h3 class="section-title">学习概览</h3>

      <div class="overview">
        <div class="overview__item">
          <span class="overview__num">{{ stats.todayLearned }}<i class="overview__unit">词</i></span>
          <span class="overview__label">今日学习</span>
        </div>
        <div class="overview__item">
          <span class="overview__num">{{ stats.learnedCount }}<i class="overview__unit">词</i></span>
          <span class="overview__label">累计学习</span>
        </div>
        <div class="overview__item">
          <span class="overview__num overview__num--time">{{ formatDuration(studyStats.todaySeconds) }}</span>
          <span class="overview__label">今日时长</span>
        </div>
        <div class="overview__item">
          <span class="overview__num overview__num--time">{{ formatDuration(studyStats.totalSeconds) }}</span>
          <span class="overview__label">累计时长</span>
        </div>
      </div>

      <p class="overview-card__note">
        今日学习＝今天新学或复习过的单词数；时长按「有操作」统计，连续 1 分钟无操作会自动暂停，
        不计入挂机时间。
      </p>
    </section>

    <!-- ==================== 单词状态分布 ==================== -->
    <section class="card chart">
      <h3 class="section-title">单词状态分布</h3>
      <p class="chart__sub">
        词库共 {{ stats.totalWords }} 词（常规 {{ stats.listSizes.regular }} · 高频 {{ stats.listSizes.high }}）
      </p>

      <div class="bar-row" v-for="row in distribution" :key="row.key">
        <span class="bar-row__name">{{ row.name }}</span>
        <div class="bar-row__track">
          <div class="bar-row__fill" :class="'bar-row__fill--' + row.key" :style="{ width: row.width }"></div>
        </div>
        <span class="bar-row__val">{{ row.value }}</span>
      </div>
    </section>

    <!-- ==================== 近 7 天复习活跃度 ==================== -->
    <section class="card chart">
      <h3 class="section-title">近 7 天复习活跃度</h3>

      <div class="week">
        <div v-for="d in last7" :key="d.label" class="week__col">
          <div class="week__bars">
            <div class="week__bar week__bar--remember" :style="{ height: barHeight(d.remember) }"></div>
            <div class="week__bar week__bar--forget" :style="{ height: barHeight(d.forget) }"></div>
          </div>
          <span class="week__label">{{ d.label }}</span>
        </div>
      </div>

      <div class="legend">
        <span><i class="legend__dot legend__dot--remember"></i>记得 {{ stats.rememberCount }}</span>
        <span><i class="legend__dot legend__dot--forget"></i>不记得 {{ stats.forgetCount }}</span>
        <span>累计复习 {{ stats.totalReviews }} 次</span>
      </div>
    </section>

    <!-- ==================== 练习统计（独立于 SRS） ==================== -->
    <section class="card chart">
      <h3 class="section-title">练习统计</h3>
      <p class="chart__sub">练习只记录刷题量，不影响遗忘曲线复习计划</p>

      <div class="practice-grid">
        <div class="practice-item">
          <span class="practice-item__num">{{ practiceStats.sessions }}</span>
          <span class="practice-item__label">练习组数</span>
        </div>
        <div class="practice-item">
          <span class="practice-item__num">{{ practiceStats.answered }}</span>
          <span class="practice-item__label">累计答题</span>
        </div>
        <div class="practice-item">
          <span class="practice-item__num">{{ practiceStats.accuracy }}%</span>
          <span class="practice-item__label">正确率</span>
        </div>
        <div class="practice-item">
          <span class="practice-item__num">{{ stats.notebookCount }}</span>
          <span class="practice-item__label">生词本</span>
        </div>
      </div>

      <p v-if="!practiceStats.sessions" class="chart__empty">
        还没有练习记录，去「练习」页试试吧～
      </p>
    </section>

    <!-- 没有任何学习记录时的提示 -->
    <p v-if="stats.learnedCount === 0" class="empty-hint">
      还没有学习记录，去「学新词」开始吧～
    </p>
  </div>
</template>

<script setup>
/**
 * 统计页
 * 1) 学习概览（今日学习 / 累计学习 / 今日时长 / 累计时长）
 * 2) 单词状态分布（新词 / 学习中 / 已掌握）条形图
 * 3) 近 7 天复习活跃度（记得 / 不记得）柱状图
 * 4) 练习统计（独立于 SRS）
 * 图表全部使用原生 div + CSS 绘制，不引入任何图表库。
 */
import { computed } from 'vue'
import { useStore } from '../composables/useStore'
import { formatDuration } from '../utils/format'

const { stats, practiceStats, studyStats, getLast7Days } = useStore()

const last7 = computed(() => getLast7Days())

/** 状态分布数据：宽度按占词库总量的比例计算；0 个不画条，非 0 保留 2% 最小可见宽度 */
const distribution = computed(() => {
  const total = stats.value.totalWords || 1
  const rows = [
    { key: 'new', name: '新词', value: stats.value.newCount },
    { key: 'learning', name: '学习中', value: stats.value.learningCount },
    { key: 'mastered', name: '已掌握', value: stats.value.masteredCount }
  ]
  return rows.map((r) => ({
    ...r,
    // 修复：0 个时此前也会画出 2% 的小色条，看起来像"有数据"
    width: r.value === 0 ? '0%' : Math.max(2, Math.round((r.value / total) * 100)) + '%'
  }))
})

/** 7 天柱状图的当天最大值（用于归一化高度） */
const maxDaily = computed(() => {
  let m = 1
  for (const d of last7.value) m = Math.max(m, d.remember + d.forget)
  return m
})

/** 柱高：0 次返回 0%（不画柱子），非 0 至少 6% 保证可见 */
function barHeight(n) {
  if (!n) return '0%'
  return Math.max(6, Math.round((n / maxDaily.value) * 100)) + '%'
}
</script>

<style scoped>
/* ---------- 学习概览 ---------- */
.overview-card {
  margin-bottom: 14px;
}
.overview-card .section-title {
  margin-top: 0;
}
.overview {
  display: grid;
  /* 2×2：数字较大、还有"1小时2分"这类较长的值，两列比四列稳 */
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.overview__item {
  background: var(--card-soft);
  border-radius: var(--radius-sm);
  padding: 13px 10px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  text-align: center;
}
.overview__num {
  font-size: 24px;
  font-weight: 800;
  line-height: 1.15;
  color: var(--primary);
}
/* 时长是"1小时2分"这类文本，字要小一号才放得下 */
.overview__num--time {
  font-size: 19px;
}
.overview__unit {
  margin-left: 3px;
  font-size: 12px;
  font-style: normal;
  font-weight: 700;
  color: var(--muted);
}
.overview__label {
  font-size: 11.5px;
  color: var(--muted);
}
.overview-card__note {
  margin: 12px 0 0;
  font-size: 11.5px;
  line-height: 1.7;
  color: var(--muted);
}

/* ---------- 图表容器 ---------- */
.chart {
  margin-bottom: 14px;
}

/* ---------- 状态分布条 ---------- */
.bar-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.bar-row:last-child {
  margin-bottom: 0;
}
.bar-row__name {
  width: 46px;
  flex-shrink: 0;
  font-size: 13px;
  color: var(--muted);
}
.bar-row__track {
  flex: 1;
  height: 14px;
  border-radius: 999px;
  background: var(--border);
  overflow: hidden;
}
.bar-row__fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.6s ease;
}
.bar-row__fill--new {
  background: var(--primary);
}
.bar-row__fill--learning {
  background: var(--warning);
}
.bar-row__fill--mastered {
  background: var(--success);
}
.bar-row__val {
  width: 42px;
  flex-shrink: 0;
  text-align: right;
  font-size: 13px;
  font-weight: 700;
}

/* ---------- 7 天柱状图 ---------- */
.week {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 150px;
}
.week__col {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.week__bars {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 3px;
}
.week__bar {
  width: 11px;
  border-radius: 4px 4px 0 0;
  transition: height 0.5s ease;
}
.week__bar--remember {
  background: var(--success);
}
.week__bar--forget {
  background: var(--danger);
}
.week__label {
  margin-top: 7px;
  font-size: 11px;
  color: var(--muted);
}

/* ---------- 图例 ---------- */
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin-top: 14px;
  font-size: 12px;
  color: var(--muted);
}
.legend__dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  margin-right: 5px;
}
.legend__dot--remember {
  background: var(--success);
}
.legend__dot--forget {
  background: var(--danger);
}

/* 窄屏（≤360px）时概览纵向排一行，避免"1小时20分"被挤换行 */
@media (max-width: 360px) {
  .overview__num {
    font-size: 21px;
  }
  .overview__num--time {
    font-size: 17px;
  }
}

/* ---------- 练习统计 ---------- */
.chart__sub {
  margin: -6px 0 14px;
  font-size: 12px;
  color: var(--muted);
}
.chart__empty {
  margin: 14px 0 0;
  font-size: 12.5px;
  color: var(--muted);
  text-align: center;
}
.practice-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.practice-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 12px 4px;
  border-radius: var(--radius-sm);
  background: var(--card-soft);
}
.practice-item__num {
  font-size: 19px;
  font-weight: 800;
  line-height: 1.15;
}
.practice-item__label {
  font-size: 11px;
  color: var(--muted);
}

@media (max-width: 360px) {
  .practice-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
