<template>
  <div class="app-shell">
    <!-- ===================== 顶部标题栏 ===================== -->
    <header class="app-header">
      <div class="app-header__inner">
        <!-- 标题跟随当前路由（route.meta.title） -->
        <h1 class="app-header__title">{{ pageTitle }}</h1>

        <!-- 快捷主题切换（设置页里也有一个入口） -->
        <button
          class="icon-btn"
          :title="isDark ? '切换到浅色模式' : '切换到暗黑模式'"
          @click="toggleTheme"
        >
          {{ isDark ? '☀️' : '🌙' }}
        </button>
      </div>
    </header>

    <!-- ===================== 内容区 ===================== -->
    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- ===================== 底部 Tab 栏 ===================== -->
    <nav class="tabbar">
      <div class="tabbar__inner">
        <router-link v-for="tab in tabs" :key="tab.path" :to="tab.path" class="tabbar__item">
          <!-- 线性图标：用极简 SVG 描边路径，颜色继承当前文字色 -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path v-for="(d, i) in tab.icon" :key="i" :d="d" />
          </svg>
          <span>{{ tab.label }}</span>
        </router-link>
      </div>
    </nav>
  </div>
</template>

<script setup>
/**
 * App 外壳
 * - 顶部标题栏：显示当前页面名（取自路由 meta.title）+ 主题切换
 * - 内容区：router-view，页面切换带淡入过渡
 * - 底部 Tab 栏：5 个主入口，App 式切换（图标来自 Feather Icons 的极简线条风格）
 */
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from './composables/useStore'

const route = useRoute()
const { state, setTheme } = useStore()

/* 底部 Tab 定义：icon 为若干条 SVG 路径（d 属性） */
const tabs = [
  { path: '/', label: '看板', icon: ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'] },
  { path: '/learn', label: '学新词', icon: ['M4 5.5A2.5 2.5 0 0 1 6.5 3H20v14H6.5A2.5 2.5 0 0 0 4 19.5z', 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20v4H6.5A2.5 2.5 0 0 1 4 19.5z'] },
  { path: '/review', label: '复习', icon: ['M23 4v6h-6', 'M20.49 15a9 9 0 1 1-2.12-9.36L23 10'] },
  { path: '/stats', label: '统计', icon: ['M18 20V10', 'M12 20V4', 'M6 20v-6'] },
  { path: '/settings', label: '设置', icon: ['M4 21v-7', 'M4 10V3', 'M12 21v-9', 'M12 8V3', 'M20 21v-5', 'M20 12V3', 'M1 14h6', 'M9 8h6', 'M17 16h6'] }
]

/* 当前页面标题 */
const pageTitle = computed(() => route.meta.title || '四级背单词')

/* 主题状态与切换 */
const isDark = computed(() => state.settings.theme === 'dark')
function toggleTheme() {
  setTheme(isDark.value ? 'light' : 'dark')
}

/**
 * 把主题写到 <html data-theme="...">，global.css 里据此切换 CSS 变量。
 * 首次挂载先同步一次，之后跟随设置变化。
 */
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
}
applyTheme(state.settings.theme)
watch(() => state.settings.theme, applyTheme)
</script>
