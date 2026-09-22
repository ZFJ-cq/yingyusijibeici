<template>
  <div class="app-shell">
    <!-- ===================== 顶部标题栏 ===================== -->
    <header class="app-header">
      <div class="app-header__inner">
        <div class="app-header__left">
          <!-- 非 Tab 页面（如「学新词」）显示返回按钮，符合"详情页"的直觉 -->
          <button v-if="!isTabRoute" class="icon-btn icon-btn--back" title="返回" @click="goBack">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <!-- 标题跟随当前路由（route.meta.title） -->
          <h1 class="app-header__title">{{ pageTitle }}</h1>
        </div>

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

    <!-- ===================== 全局 Toast / 确认弹窗 ===================== -->
    <AppUI />
  </div>
</template>

<script setup>
/**
 * App 外壳
 * - 顶部标题栏：显示当前页面名（取自路由 meta.title）+ 主题切换
 * - 内容区：router-view，页面切换带淡入过渡
 * - 底部 Tab 栏：5 个主入口，App 式切换（图标来自 Feather Icons 的极简线条风格）
 * - AppUI：全局 Toast 与确认弹窗（替代原生 alert/confirm）
 */
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppUI from './components/AppUI.vue'
import { useStore } from './composables/useStore'

const route = useRoute()
const router = useRouter()
const { state, setTheme } = useStore()

/* 底部 Tab 定义：icon 为若干条 SVG 路径（d 属性）
   注意：「学新词」不占 Tab，它从首页看板的入口进入（详情页形式，带返回按钮） */
const tabs = [
  { path: '/', label: '看板', icon: ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'] },
  { path: '/review', label: '复习', icon: ['M23 4v6h-6', 'M20.49 15a9 9 0 1 1-2.12-9.36L23 10'] },
  { path: '/practice', label: '练习', icon: ['M12 20h9', 'M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z'] },
  { path: '/stats', label: '统计', icon: ['M18 20V10', 'M12 20V4', 'M6 20v-6'] },
  { path: '/settings', label: '设置', icon: ['M4 21v-7', 'M4 10V3', 'M12 21v-9', 'M12 8V3', 'M20 21v-5', 'M20 12V3', 'M1 14h6', 'M9 8h6', 'M17 16h6'] }
]

/* 当前页面标题 */
const pageTitle = computed(() => route.meta.title || '四级背单词')

/* 当前路由是否为底部 Tab 之一（用于决定是否显示返回按钮） */
const isTabRoute = computed(() => tabs.some((t) => t.path === route.path))

/** 返回上一页；没有历史记录时回到看板 */
function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}

/* 主题状态与切换 */
const isDark = computed(() => state.settings.theme === 'dark')
function toggleTheme() {
  setTheme(isDark.value ? 'light' : 'dark')
}

/** 主题底色（与 global.css 的 --bg 一致），用于同步移动端浏览器地址栏颜色 */
const THEME_COLORS = { light: '#f4f7fb', dark: '#12161e' }

/**
 * 把主题写到 <html data-theme="...">，global.css 里据此切换 CSS 变量。
 * 同时同步 <meta name="theme-color">，让移动端浏览器地址栏跟随主题。
 */
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', THEME_COLORS[theme] || THEME_COLORS.light)
}

applyTheme(state.settings.theme)
watch(() => state.settings.theme, applyTheme)
</script>
