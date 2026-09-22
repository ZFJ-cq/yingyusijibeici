<template>
  <div class="page stats">
    <h1 class="page-title">学习统计</h1>
    <p class="subtitle">你的记忆轨迹一览</p>

    <!-- 概览数字 -->
    <div class="overview-grid">
      <div class="ov-card">
        <div class="ov-num">{{ stats.totalWords }}</div>
        <div class="ov-label">词库总量</div>
      </div>
      <div class="ov-card">
        <div class="ov-num">{{ stats.learnedCount }}</div>
        <div class="ov-label">已学习</div>
      </div>
      <div class="ov-card">
        <div class="ov-num">{{ stats.masteredCount }}</div>
        <div class="ov-label">已掌握</div>
      </div>
      <div class="ov-card">
        <div class="ov-num">{{ stats.totalReviews }}</div>
        <div class="ov-label">累计复习</div>
      </div>
    </div>

    <!-- 状态分布 -->
    <div class="card chart-card">
      <h3 class="chart-title">单词状态分布</h3>
      <div class="bar-row">
        <span class="bar-name">新词</span>
        <div class="bar-track">
          <div class="bar-fill new" :style="{ width: pct(stats.newCount) }"></div>
        </div>
        <span class="bar-val">{{ stats.newCount }}</span>
      </div>
      <div class="bar-row">
        <span class="bar-name">学习中</span>
        <div class="bar-track">
          <div class="bar-fill learning" :style="{ width: pct(stats.learningCount) }"></div>
        </div>
        <span class="bar-val">{{ stats.learningCount }}</span>
      </div>
      <div class="bar-row">
        <span class="bar-name">已掌握</span>
        <div class="bar-track">
          <div class="bar-fill mastered" :style="{ width: pct(stats.masteredCount) }"></div>
        </div>
        <span class="bar-val">{{ stats.masteredCount }}</span>
      </div>
    </div>

    <!-- 近 7 天复习活跃度 -->
    <div class="card chart-card">
      <h3 class="chart-title">近 7 天复习活跃度</h3>
      <div class="week-chart">
        <div class="week-col" v-for="d in last7" :key="d.label">
          <div class="week-bars">
            <div
              class="week-bar remember"
              :style="{ height: barHeight(d.remember) }"
              :title="`记得 ${d.remember}`"
            ></div>
            <div
              class="week-bar forget"
              :style="{ height: barHeight(d.forget) }"
              :title="`不记得 ${d.forget}`"
            ></div>
          </div>
          <div class="week-label">{{ d.label }}</div>
        </div>
      </div>
      <div class="legend">
        <span><i class="dot remember"></i>记得 {{ stats.rememberCount }}</span>
        <span><i class="dot forget"></i>不记得 {{ stats.forgetCount }}</span>
      </div>
    </div>

    <div v-if="stats.learnedCount === 0" class="empty-hint">
      还没有学习记录，去「学新词」开始吧～
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from '../composables/useStore'

const { stats, getLast7Days } = useStore()

const last7 = computed(() => getLast7Days())

function pct(n) {
  const total = stats.value.totalWords || 1
  return Math.max(2, Math.round((n / total) * 100)) + '%'
}

const maxCount = computed(() => {
  let m = 1
  for (const d of last7.value) m = Math.max(m, d.remember + d.forget)
  return m
})
function barHeight(n) {
  if (!n) return '0%'
  return Math.max(4, Math.round((n / maxCount.value) * 100)) + '%'
}
</script>

<style scoped>
.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 18px;
}
.ov-card {
  background: var(--card);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  padding: 18px;
  text-align: center;
}
.ov-num {
  font-size: 28px;
  font-weight: 800;
}
.ov-label {
  color: var(--muted);
  font-size: 13px;
  margin-top: 4px;
}

.chart-card {
  margin-bottom: 18px;
}
.chart-title {
  margin: 0 0 16px;
  font-size: 16px;
}
.bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.bar-name {
  width: 48px;
  font-size: 14px;
  color: var(--muted);
}
.bar-track {
  flex: 1;
  height: 16px;
  background: var(--border);
  border-radius: 999px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.6s ease;
}
.bar-fill.new {
  background: var(--primary);
}
.bar-fill.learning {
  background: var(--warning);
}
.bar-fill.mastered {
  background: var(--success);
}
.bar-val {
  width: 40px;
  text-align: right;
  font-weight: 700;
  font-size: 14px;
}

.week-chart {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 160px;
  gap: 8px;
  padding: 0 4px;
}
.week-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}
.week-bars {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 4px;
  width: 100%;
  justify-content: center;
}
.week-bar {
  width: 12px;
  border-radius: 4px 4px 0 0;
  transition: height 0.5s ease;
}
.week-bar.remember {
  background: var(--success);
}
.week-bar.forget {
  background: var(--danger);
}
.week-label {
  margin-top: 8px;
  font-size: 12px;
  color: var(--muted);
}
.legend {
  display: flex;
  gap: 18px;
  margin-top: 14px;
  font-size: 13px;
  color: var(--muted);
}
.legend .dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 6px;
}
.dot.remember {
  background: var(--success);
}
.dot.forget {
  background: var(--danger);
}

@media (max-width: 600px) {
  .overview-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
