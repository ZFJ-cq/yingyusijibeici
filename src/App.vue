<template>
  <div class="app">
    <header class="topbar">
      <div class="brand">📚 四级背单词</div>
      <nav class="nav">
        <router-link to="/">看板</router-link>
        <router-link to="/learn">学新词</router-link>
        <router-link to="/review">复习</router-link>
        <router-link to="/stats">统计</router-link>
        <router-link to="/settings">设置</router-link>
      </nav>
    </header>

    <main class="main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { watch } from 'vue'
import { useStore } from './composables/useStore'

const { state } = useStore()

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
}

applyTheme(state.settings.theme)
watch(
  () => state.settings.theme,
  (t) => applyTheme(t)
)
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
