<template>
  <div class="page home">
    <h1 class="page-title">学习看板</h1>
    <p class="subtitle">科学复习，对抗遗忘 · 遗忘曲线：1 / 2 / 4 / 7 / 15 天</p>

    <div class="stat-grid">
      <div class="stat-card due">
        <div class="stat-num">{{ stats.dueCount }}</div>
        <div class="stat-label">待复习</div>
      </div>
      <div class="stat-card new">
        <div class="stat-num">{{ stats.newCount }}</div>
        <div class="stat-label">新词</div>
      </div>
      <div class="stat-card mastered">
        <div class="stat-num">{{ stats.masteredCount }}</div>
        <div class="stat-label">已掌握</div>
      </div>
    </div>

    <div class="progress-section card">
      <div class="progress-head">
        <span>总体进度</span>
        <span class="progress-text">已学习 {{ stats.learnedCount }} / {{ stats.totalWords }}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: learnedPercent + '%' }"></div>
      </div>
      <div class="progress-meta">
        <span>学习中 {{ stats.learningCount }}</span>
        <span>已掌握 {{ stats.masteredCount }}</span>
      </div>
    </div>

    <div class="entry-grid">
      <router-link to="/learn" class="entry-card learn-entry">
        <div class="entry-icon">📘</div>
        <div class="entry-title">学新词</div>
        <div class="entry-desc">本次可学 {{ learnableCount }} 个</div>
      </router-link>
      <router-link to="/review" class="entry-card review-entry">
        <div class="entry-icon">🔁</div>
        <div class="entry-title">复习</div>
        <div class="entry-desc">{{ stats.dueCount }} 个待复习</div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from '../composables/useStore'

const { stats, state, getNewWords } = useStore()

const learnedPercent = computed(() => {
  if (!stats.value.totalWords) return 0
  return Math.round((stats.value.learnedCount / stats.value.totalWords) * 100)
})

const learnableCount = computed(() => {
  const available = getNewWords().length
  return Math.min(available, state.settings.batchSize)
})
</script>

<style scoped>
.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 18px;
}
.stat-card {
  border-radius: var(--radius);
  padding: 22px;
  box-shadow: var(--shadow);
  text-align: center;
  animation: pop-in 0.3s ease;
}
.stat-card.due {
  background: var(--warning-soft);
}
.stat-card.new {
  background: var(--primary-soft);
}
.stat-card.mastered {
  background: var(--success-soft);
}
.stat-num {
  font-size: 40px;
  font-weight: 800;
  line-height: 1;
}
.stat-label {
  margin-top: 8px;
  color: var(--muted);
  font-size: 14px;
  font-weight: 600;
}

.progress-section {
  margin-bottom: 20px;
}
.progress-head {
  display: flex;
  justify-content: space-between;
  font-weight: 600;
  margin-bottom: 10px;
}
.progress-text {
  color: var(--muted);
  font-size: 14px;
}
.progress-bar {
  height: 12px;
  border-radius: 999px;
  background: var(--border);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), #7da0ff);
  border-radius: 999px;
  transition: width 0.5s ease;
}
.progress-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  color: var(--muted);
  font-size: 13px;
}

.entry-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.entry-card {
  border-radius: var(--radius);
  padding: 28px;
  box-shadow: var(--shadow);
  text-align: center;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  animation: pop-in 0.35s ease;
}
.entry-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 30px rgba(31, 39, 51, 0.14);
}
.learn-entry {
  background: var(--card);
  border-top: 4px solid var(--primary);
}
.review-entry {
  background: var(--card);
  border-top: 4px solid var(--warning);
}
.entry-icon {
  font-size: 44px;
}
.entry-title {
  font-size: 20px;
  font-weight: 700;
  margin-top: 8px;
}
.entry-desc {
  color: var(--muted);
  font-size: 14px;
  margin-top: 6px;
}

@media (max-width: 600px) {
  .stat-grid,
  .entry-grid {
    grid-template-columns: 1fr;
  }
}
</style>
