import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Learn from '../views/Learn.vue'
import Review from '../views/Review.vue'
import Stats from '../views/Stats.vue'
import Settings from '../views/Settings.vue'

const routes = [
  { path: '/', name: 'home', component: Home, meta: { title: '看板' } },
  { path: '/learn', name: 'learn', component: Learn, meta: { title: '学新词' } },
  { path: '/review', name: 'review', component: Review, meta: { title: '复习' } },
  { path: '/stats', name: 'stats', component: Stats, meta: { title: '统计' } },
  { path: '/settings', name: 'settings', component: Settings, meta: { title: '设置' } }
]

const router = createRouter({
  // hash 模式：构建后的静态文件可直接双击打开 / 任意静态托管，无需服务端重写
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
