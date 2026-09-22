import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base 默认使用相对路径 './'：
//   - 构建后的 dist 可直接双击打开，或托管到任意静态目录
//   - 配合 hash 路由，也能直接跑在 GitHub Pages 的项目子路径（https://user.github.io/repo/）下
// 如需显式指定子路径（例如 /cet4-words/），可在部署时通过环境变量 BASE_PATH 覆盖。
export default defineConfig({
  plugins: [vue()],
  base: process.env.BASE_PATH || './',
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
