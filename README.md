# 英语四级遗忘曲线背单词（Vue3 纯前端应用）

一个**无需后端、不使用数据库**的背单词单页应用：所有学习数据都保存在浏览器
`localStorage` 中。基于遗忘曲线安排复习，卡片式记忆。

界面为**移动端 App 风格**：顶部精简标题栏 + **底部 Tab 栏切换**（看板 / 学新词 / 复习 / 统计 / 设置），
适配 iPhone 刘海与底部安全区，也能在电脑上居中显示（内容限宽 680px，形成「App 视口」观感）。

## ✨ 功能特性

| 页面 | 说明 |
| --- | --- |
| **首页看板** | 今日主卡片（智能提示该复习还是学新词）、「待复习 / 新词 / 已掌握」数量、总体进度、两个入口 |
| **学新词** | 卡片展示单词、音标、释义、例句（含中文译文）；【认识 / 不认识】；可自定义每次学习数量 |
| **复习** | 可翻转卡片（正面英文，点击翻面显示释义）；【记得 / 不记得】；结束展示本次统计 |
| **统计** | 学习数据汇总 + 简易图表（状态分布、近 7 天复习活跃度） |
| **设置** | 出词顺序、每次学习数量、记录导出/导入、重置记录、主题切换、朗读开关与语速 |

**其它**
- 使用 **Web Speech API** 实现单词朗读发音（无需网络、无第三方依赖）。
- 单词**默认乱序**出题，避免按字母序死记；可在设置中切回**正序**。
- 全部图表用原生 div + CSS 绘制，不引入任何图表库。

## 🔁 遗忘曲线规则

- 学完一个**新词**后，自动进入复习计划，复习节点依次为：**1 天 → 2 天 → 4 天 → 7 天 → 15 天**。
- 复习时点击**【记得】**：进入下一个复习节点；完成全部 5 个节点后标记为**已掌握**。
- 复习时点击**【不记得】**：**重置该单词的学习进度，从头开始**（重新回到 1 天节点）。
- 时间统一使用**毫秒时间戳**，前端计算时间差判断是否到达复习时间。

## 🗂 目录结构

```
英语四级遗忘曲线背单词/
├── index.html                 # 应用入口 HTML（含移动端 viewport / 安全区配置）
├── package.json               # 依赖与脚本
├── vite.config.js             # Vite 配置（相对路径 base，支持 GitHub Pages）
├── README.md
├── public/
│   └── .nojekyll              # GitHub Pages 用：跳过 Jekyll 处理
├── .github/
│   └── workflows/
│       └── deploy.yml         # GitHub Actions：自动构建并部署到 Pages
└── src/
    ├── main.js                # 创建应用、挂载路由与全局样式
    ├── App.vue                # App 外壳：顶部标题栏 + 内容区 + 底部 Tab 栏
    ├── router/
    │   └── index.js           # 路由（hash 模式，静态托管友好）
    ├── data/
    │   └── words.js           # 内置四级词库 3739 词（word / phonetic / meaning / example / exampleCn）
    ├── composables/
    │   ├── useStore.js        # 核心状态：遗忘曲线逻辑 + 洗牌乱序 + localStorage 持久化 + 统计
    │   └── useSpeech.js       # Web Speech API 朗读工具
    ├── components/
    │   └── WordCard.vue       # 单词卡片（学习模式 / 可翻转复习模式）
    ├── views/
    │   ├── Home.vue           # 首页看板
    │   ├── Learn.vue          # 学新词
    │   ├── Review.vue         # 复习
    │   ├── Stats.vue          # 统计
    │   └── Settings.vue       # 设置
    └── styles/
        └── global.css         # 设计令牌 + App 外壳布局 + 浅色/暗黑主题
```

## 🚀 本地运行

> 需要 Node.js 16+（推荐 18 / 20）。

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器（默认 http://localhost:5173，自动打开浏览器）
npm run dev

# 3. 构建生产版本（产物在 dist/）
npm run build

# 4. 本地预览构建结果
npm run preview
```

## 🌐 部署到 GitHub Pages

项目已内置自动部署工作流 `.github/workflows/deploy.yml`，只需：

1. 在 GitHub 上新建一个仓库（例如 `cet4-words`），把本项目推送到 `main` 分支：
   ```bash
   git init
   git add .
   git commit -m "feat: 四级遗忘曲线背单词"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/<仓库名>.git
   git push -u origin main
   ```
2. 打开仓库 **Settings → Pages**，把 **Source** 设为 **GitHub Actions**。
3. 推送后 Actions 会自动构建并部署，稍等片刻即可访问：
   ```
   https://<你的用户名>.github.io/<仓库名>/
   ```

> 说明：
> - 应用使用 **hash 路由**（地址形如 `.../#/review`），配合相对路径资源，**刷新子页面不会 404**，可安全托管在 Pages 的项目子路径下。
> - 工作流会按仓库名自动设置 `BASE_PATH`（`/<仓库名>/`）。若你把仓库命名为 `<用户名>.github.io`（用户主页站点），请删除工作流里的 `BASE_PATH` 行，或改成 `BASE_PATH: /`。

### 手动部署（备选，不依赖 Actions）

```bash
npm run build
# 将 dist/ 目录内容推送到 gh-pages 分支，或在 Pages 设置中选择该分支
```

## 📖 如何使用

通过**底部 Tab 栏**在五个页面间切换（与手机 App 一致）。

1. **学新词**：设置每次学习数量 → 逐张卡片点击【认识】或【不认识】。
   - 【不认识】的词会排到本批队尾，稍后重学；
   - 【认识】的词加入复习计划，1 天后首次复习。
2. **复习**：到期的单词会出现在复习页，先凭记忆判断，**点击卡片可翻面**看释义。
   - 【记得】进入下一节点；【不记得】重置进度从头再来；
   - 结束展示本次「记得 / 不记得」统计。
3. **统计**：查看整体进度与近 7 天复习趋势。
4. **设置**：切换主题、切换出词顺序（乱序 / 正序）、调整每次学习数量与朗读、
   导出 / 导入备份、重置记录。

> 💡 **乱序**：默认从词库中随机抽词，避免按字母序背诵。若想按字母顺序复习，
> 到「设置 → 出词顺序」切换为「正序」即可。

## 📚 关于词库数据

`src/data/words.js` 内置**完整的四级词库（3739 词）**，每条包含音标、中文释义、例句及例句译文：

```js
{ word: 'abandon', phonetic: "/ə'bændən/", meaning: 'v. 丢弃；放弃，抛弃',
  example: 'How could she abandon her own child?', exampleCn: '她怎么能抛弃自己的孩子？' }
```

- 数据来源：有道四级词汇（正序版）词书，覆盖四级大纲词汇。
- 其中 103 词无例句、60 词无音标，卡片会自动隐藏对应区域。
- 如需换成其他版本词表，只需替换 `WORDS` 数组并保持相同字段结构，其余代码无需改动。

## 💾 数据存储

- 存储位置：浏览器 `localStorage`，键名为 `cet4_forgetting_curve_v1`。
- 存储内容：每词的 `state / learnedAt / reviewsDone / nextReviewAt / history` 与用户偏好设置。
- ⚠️ 清除浏览器数据会一并清除学习记录，建议定期在**设置**页导出备份。

## 🛠 技术栈

Vue 3（`<script setup>` 组合式 API）· Vue Router（hash 模式）· Vite · 原生 CSS（CSS 变量主题）· Web Speech API
