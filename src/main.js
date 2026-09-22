/**
 * 应用入口
 * 创建 Vue 应用 → 挂载路由 → 挂载到 #app
 */
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/global.css'

createApp(App).use(router).mount('#app')
