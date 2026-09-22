<template>
  <div class="page practice">
    <!-- ==================== 一、配置 ==================== -->
    <template v-if="phase === 'idle'">
      <section class="card setup">
        <h2 class="setup__title">练习模式</h2>
        <p class="setup__desc">刷题巩固 · <b>不影响</b>遗忘曲线复习计划</p>

        <!-- 词池 -->
        <h3 class="section-title">练习词池</h3>
        <div class="chips">
          <button
            v-for="p in pools"
            :key="p.key"
            class="chip"
            :class="{ 'chip--active': pool === p.key }"
            :disabled="p.count === 0"
            @click="pool = p.key"
          >
            {{ p.name }}
            <span class="chip__count">{{ p.count }}</span>
          </button>
        </div>

        <!-- 题量 -->
        <h3 class="section-title">练习数量</h3>
        <div class="chips">
          <button
            v-for="n in [5, 10, 20]"
            :key="n"
            class="chip"
            :class="{ 'chip--active': countMode === n }"
            @click="countMode = n"
          >
            {{ n }} 题
          </button>
          <button
            class="chip"
            :class="{ 'chip--active': countMode === 'custom' }"
            @click="countMode = 'custom'"
          >
            自定义
          </button>
          <input
            v-if="countMode === 'custom'"
            class="chip-input"
            type="number"
            inputmode="numeric"
            min="1"
            max="100"
            :value="customCount"
            @change="onCustomCount"
          />
        </div>

        <!-- 题型 -->
        <h3 class="section-title">题型</h3>
        <div class="chips">
          <button
            v-for="t in typeOptions"
            :key="t.key"
            class="chip"
            :class="{ 'chip--active': type === t.key }"
            @click="type = t.key"
          >
            {{ t.name }}
          </button>
        </div>

        <!-- 蒙版遮挡：可选遮挡哪一面 -->
        <div v-if="type === 'mask'" class="sub-config">
          <span class="sub-config__label">遮挡方式</span>
          <div class="chips">
            <button
              v-for="s in maskSides"
              :key="s.key"
              class="chip"
              :class="{ 'chip--active': maskSide === s.key }"
              @click="maskSide = s.key"
            >
              {{ s.name }}
            </button>
          </div>
        </div>
        <p v-else-if="type === 'mixed'" class="type-hint">
          混合会随机出「英译中 / 中译英 / 短句填空 / 默写填空」，这几种都需要打字作答；
          想练「蒙版遮挡」请单独选择该题型。
        </p>

        <button class="btn btn-primary btn-block start-btn" :disabled="!canStart" @click="start">
          {{ canStart ? `开始练习（${count} 题）` : '该词池暂无可练单词' }}
        </button>
      </section>

      <!-- 生词本 -->
      <section class="card notebook">
        <button class="notebook__head" @click="notebookOpen = !notebookOpen">
          <span class="notebook__info">
            <span class="notebook__title">生词本</span>
            <span class="notebook__desc">共 {{ stats.notebookCount }} 个单词 · 练习错题可一键加入</span>
          </span>
          <span class="notebook__chev" :class="{ 'notebook__chev--open': notebookOpen }">›</span>
        </button>

        <div v-if="notebookOpen" class="notebook__list">
          <p v-if="!notebookList.length" class="notebook__empty">
            生词本还是空的。练习答错的单词可以一键加入这里，之后用「生词本」词池专项练习。
          </p>
          <div v-for="w in notebookList" :key="w.word" class="notebook__item">
            <span class="notebook__word">{{ w.word }}</span>
            <span class="notebook__meaning">{{ w.meaning }}</span>
            <button class="notebook__del" @click="removeFromNotebook(w.word)">移除</button>
          </div>
        </div>
      </section>
    </template>

    <!-- ==================== 二、答题 ==================== -->
    <section v-if="phase === 'quiz' && current" class="card quiz">
      <div class="quiz__bar">
        <span>第 {{ index + 1 }} / {{ questions.length }} 题</span>
        <span class="quiz__score">答对 {{ correctCount }}</span>
      </div>
      <div class="quiz__bar-track">
        <div class="quiz__bar-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>

      <span class="quiz__type">{{ typeLabel(current.type) }}</span>

      <!-- 英译中：给英文单词 -->
      <div v-if="current.type === 'en2cn'" class="quiz__prompt">
        <div class="quiz__word-row">
          <span class="quiz__word">{{ current.prompt }}</span>
          <button class="speak-btn" aria-label="朗读单词" @click="speakWord(current.prompt)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M11 5 6 9H2v6h4l5 4V5z" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          </button>
        </div>
        <p v-if="current.phonetic" class="quiz__phonetic">{{ current.phonetic }}</p>
        <p class="quiz__ask">请填写它的中文释义</p>
      </div>

      <!-- 中译英：给中文释义 -->
      <div v-else-if="current.type === 'cn2en'" class="quiz__prompt">
        <p class="quiz__meaning">{{ current.prompt }}</p>
        <p class="quiz__ask">请填写对应的英文单词</p>
      </div>

      <!-- 短句填空：给挖空例句 + 括号里的原形提示 -->
      <div v-else-if="current.type === 'cloze'" class="quiz__prompt">
        <p class="quiz__sentence">{{ current.sentence }}</p>
        <p class="quiz__hint">提示：{{ current.hint }}</p>
        <p class="quiz__ask">请补全句子中空缺的单词</p>
      </div>

      <!-- 默写填空：给中文释义 + 挖空例句，但不给原形提示（比短句填空更难） -->
      <div v-else-if="current.type === 'dictation'" class="quiz__prompt">
        <p class="quiz__meaning">{{ current.prompt }}</p>
        <p class="quiz__sentence quiz__sentence--gap">{{ current.sentence }}</p>
        <div class="quiz__ask-row">
          <span class="quiz__ask">根据释义默写句子里缺的单词</span>
          <!-- 听发音属于"要提示才给"的帮助，默认不点就不会泄露读音 -->
          <button class="hint-btn" @click="speakWord(current.word)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M11 5 6 9H2v6h4l5 4V5z" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
            听发音提示
          </button>
        </div>
      </div>

      <!-- 蒙版遮挡：题面正常显示，答案被蒙版盖住，点开后自评对错（不打字） -->
      <div v-else class="quiz__prompt">
        <!-- 遮中文：题面是英文单词 -->
        <template v-if="current.side === 'cn'">
          <div class="quiz__word-row">
            <span class="quiz__word">{{ current.word }}</span>
            <button class="speak-btn" aria-label="朗读单词" @click="speakWord(current.word)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M11 5 6 9H2v6h4l5 4V5z" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            </button>
          </div>
          <p v-if="current.phonetic" class="quiz__phonetic">{{ current.phonetic }}</p>
        </template>
        <!-- 遮英文：题面是中文释义 -->
        <p v-else class="quiz__meaning">{{ current.meaning }}</p>

        <!-- 蒙版本体：未揭开时答案被模糊 + 斜纹盖住 -->
        <button
          class="mask"
          :class="{ 'mask--open': revealed }"
          :aria-label="revealed ? '蒙版已揭开' : '点击揭开蒙版'"
          @click="revealMask"
        >
          <span class="mask__text" :class="{ 'mask__text--blurred': !revealed }" aria-hidden="true">
            {{ current.answerText }}
          </span>
          <span v-if="!revealed" class="mask__cover">
            <span class="mask__badge">点击揭开蒙版</span>
          </span>
        </button>

        <!-- 遮英文时，揭开后补上音标与朗读 -->
        <div v-if="current.side === 'en' && revealed" class="quiz__reveal-row">
          <span v-if="current.phonetic" class="quiz__phonetic">{{ current.phonetic }}</span>
          <button class="speak-btn" aria-label="朗读单词" @click="speakWord(current.word)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M11 5 6 9H2v6h4l5 4V5z" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          </button>
        </div>

        <p class="quiz__ask">
          {{ revealed ? '对照一下你刚才想的，然后如实自评（自评结果不影响遗忘曲线）' : '先在心里回忆一遍，再揭开蒙版核对' }}
        </p>
      </div>

      <!-- 作答区 -->
      <div class="answer">
        <!-- 蒙版遮挡：不需要打字，揭开蒙版后由自己如实评价 -->
        <template v-if="current.type === 'mask'">
          <button v-if="!revealed" class="btn btn-primary btn-block" @click="revealMask">
            揭开蒙版
          </button>
          <div v-else class="assess">
            <button class="btn btn-ghost assess__item assess__item--bad" @click="selfAssess(false)">
              没记住
            </button>
            <button class="btn btn-primary assess__item" @click="selfAssess(true)">
              记住了
            </button>
          </div>
        </template>

        <!-- 其余四种题型：打字作答 + 自动判分 -->
        <template v-else>
          <input
            ref="inputEl"
            v-model="userInput"
            class="answer__input"
            :class="inputClass"
            type="text"
            autocapitalize="off"
            autocomplete="off"
            spellcheck="false"
            :placeholder="placeholder"
            :disabled="answered"
            @keydown.enter.prevent="onEnter"
          />

          <!-- 判分反馈 -->
          <div v-if="answered" class="feedback" :class="feedbackClass">
            <span class="feedback__title">{{ feedbackTitle }}</span>
            <span class="feedback__answer">
              正确答案：<b>{{ current.answerText }}</b>
            </span>
            <span v-if="feedbackExtra" class="feedback__extra">{{ feedbackExtra }}</span>
          </div>

          <button class="btn btn-primary btn-block" @click="onPrimary">
            {{ primaryLabel }}
          </button>
        </template>
      </div>
    </section>

    <!-- ==================== 三、结果 ==================== -->
    <template v-if="phase === 'result'">
      <section class="card result">
        <span class="result__emoji">{{ accuracy >= 80 ? '🎉' : accuracy >= 50 ? '💪' : '📚' }}</span>
        <h2 class="result__title">本次练习完成</h2>

        <div class="result__stats">
          <div class="result__item">
            <span class="result__num">{{ accuracy }}%</span>
            <span class="result__label">正确率</span>
          </div>
          <div class="result__item">
            <span class="result__num">{{ correctCount }}</span>
            <span class="result__label">答对</span>
          </div>
          <div class="result__item">
            <span class="result__num">{{ wrongList.length }}</span>
            <span class="result__label">答错</span>
          </div>
        </div>

        <p class="result__note">
          练习不修改遗忘曲线进度，只有「复习」里的记得 / 不记得才会更新复习时间。
        </p>

        <div class="result__actions">
          <button class="btn btn-ghost" @click="phase = 'idle'">返回设置</button>
          <button class="btn btn-primary" @click="start">再来一组</button>
        </div>
      </section>

      <!-- 错题列表 -->
      <section v-if="wrongList.length" class="card wrong">
        <div class="wrong__head">
          <h3 class="section-title" style="margin: 0">错题（{{ wrongList.length }}）</h3>
          <button class="link-btn" @click="addWrongToNotebook">
            {{ allWrongAdded ? '已在生词本' : '一键加入生词本' }}
          </button>
        </div>

        <div v-for="(r, i) in wrongList" :key="i" class="wrong__item">
          <div class="wrong__top">
            <span class="wrong__type">{{ typeLabel(r.type) }}</span>
            <span class="wrong__word">{{ r.word }}</span>
          </div>
          <p class="wrong__q">{{ questionText(r) }}</p>
          <p class="wrong__a">
            你的答案：<span class="wrong__user">{{ r.input }}</span>
            <span v-if="r.near" class="wrong__near">（拼写很接近）</span>
          </p>
          <p class="wrong__a">正确答案：<b>{{ r.answerText }}</b></p>
          <button
            class="wrong__add"
            :disabled="isInNotebook(r.word)"
            @click="addOne(r.word)"
          >
            {{ isInNotebook(r.word) ? '已在生词本' : '+ 加入生词本' }}
          </button>
        </div>
      </section>

      <section v-else class="card">
        <p class="all-correct">全部答对，太棒了！</p>
      </section>
    </template>
  </div>
</template>

<script setup>
/**
 * 练习模式
 * ----------------------------------------------------------------------------
 * 五种题型（可混合前四种）：
 *   英译中 / 中译英 / 短句填空（给原形提示）/ 默写填空（不给提示）/ 蒙版遮挡（自评）
 * 词池：全部 / 待复习 / 已掌握 / 生词本；题量：5 / 10 / 20 / 自定义。
 * 结果页汇总正确率与错题，错题可一键加入生词本。
 *
 * ⚠️ 本页面只读取 progress（用于筛词池），**从不写入** progress。
 *    练习答错不会改变任何单词的遗忘曲线复习时间（SRS）。
 *    蒙版遮挡由用户自评，同样只进本页统计，不写 SRS。
 */
import { ref, computed, watch, nextTick } from 'vue'
import { useStore } from '../composables/useStore'
import { useUI } from '../composables/useUI'
import { speak } from '../composables/useSpeech'
import { buildQuestions, judge, TYPE_LABEL } from '../utils/practice'

const {
  state,
  stats,
  getPoolWords,
  addToNotebook,
  addManyToNotebook,
  removeFromNotebook,
  isInNotebook,
  recordPractice
} = useStore()
const { toast } = useUI()

/* ---------------- 配置项 ---------------- */
const pools = computed(() => [
  { key: 'all', name: '全部单词', count: stats.value.totalWords },
  { key: 'due', name: '待复习', count: stats.value.dueCount },
  { key: 'mastered', name: '已掌握', count: stats.value.masteredCount },
  { key: 'notebook', name: '生词本', count: stats.value.notebookCount }
])
const typeOptions = [
  { key: 'mixed', name: '混合（推荐）' },
  { key: 'en2cn', name: '英译中' },
  { key: 'cn2en', name: '中译英' },
  { key: 'cloze', name: '短句填空' },
  { key: 'dictation', name: '默写填空' },
  { key: 'mask', name: '蒙版遮挡' }
]

/** 蒙版遮挡：遮挡哪一面（看词猜义 / 看义想词） */
const maskSides = [
  { key: 'cn', name: '遮中文（看词猜义）' },
  { key: 'en', name: '遮英文（看义想词）' }
]

const pool = ref('all')
const countMode = ref(10) // 5 | 10 | 20 | 'custom'
const customCount = ref(30)
const type = ref('mixed')
const maskSide = ref('cn') // 'cn' | 'en'

/** 最终题量 */
const count = computed(() => {
  if (countMode.value !== 'custom') return countMode.value
  return Math.max(1, Math.min(100, parseInt(customCount.value, 10) || 1))
})

/** 当前词池的候选词数量（用于禁用空词池与显示按钮文案） */
const poolSize = computed(() => {
  const found = pools.value.find((p) => p.key === pool.value)
  return found ? found.count : 0
})

/** 词池非空才允许开始；题型是否可出题由 start() 里的 buildQuestions 兜底判断 */
const canStart = computed(() => poolSize.value > 0)

/* ---------------- 生词本 ---------------- */
const notebookOpen = ref(false)
const notebookList = computed(() => getPoolWords('notebook'))

/* ---------------- 答题状态 ---------------- */
const phase = ref('idle') // 'idle' | 'quiz' | 'result'
const questions = ref([])
const index = ref(0)
const userInput = ref('')
const answered = ref(false)
const revealed = ref(false) // 蒙版遮挡：蒙版是否已揭开
const currentResult = ref(null)
const records = ref([]) // 每题作答记录
const inputEl = ref(null)
const allWrongAdded = ref(false)

const current = computed(() => questions.value[index.value] || null)
const correctCount = computed(() => records.value.filter((r) => r.correct).length)
const wrongList = computed(() => records.value.filter((r) => !r.correct))
const accuracy = computed(() =>
  records.value.length ? Math.round((correctCount.value / records.value.length) * 100) : 0
)
const progressPercent = computed(() => {
  const total = questions.value.length
  if (!total) return 0
  // 蒙版遮挡用「是否已揭开」当作本步已完成
  const done = index.value + (answered.value || revealed.value ? 1 : 0)
  return Math.round((done / total) * 100)
})

const placeholder = computed(() => {
  if (!current.value) return ''
  return current.value.type === 'en2cn' ? '输入中文释义' : '输入英文单词'
})

/* ---------------- 交互文案 ---------------- */
const feedbackClass = computed(() => {
  if (!currentResult.value) return ''
  return currentResult.value.correct ? 'feedback--ok' : 'feedback--bad'
})
const feedbackTitle = computed(() => {
  if (!currentResult.value) return ''
  if (currentResult.value.correct) {
    return currentResult.value.near ? '✅ 答对了（拼写略有出入）' : '✅ 答对了'
  }
  return currentResult.value.near ? '⚠️ 很接近，注意拼写' : '❌ 答错了'
})
const feedbackExtra = computed(() => {
  const r = currentResult.value
  if (!r) return ''
  if (r.correct && r.near) return '已按容错计入正确，注意标准拼写'
  if (!r.correct && r.near) return '只差一个字母，再仔细一点'
  return ''
})
const inputClass = computed(() => {
  if (!answered.value) return ''
  return currentResult.value && currentResult.value.correct ? 'answer__input--ok' : 'answer__input--bad'
})
const primaryLabel = computed(() => {
  if (!answered.value) return '提交'
  return index.value + 1 >= questions.value.length ? '查看结果' : '下一题'
})

function typeLabel(t) {
  return TYPE_LABEL[t] || t
}

/** 错题列表里展示的题目文本 */
function questionText(r) {
  if (r.type === 'mask') return r.side === 'en' ? r.meaning : r.word
  if (r.type === 'cloze') return r.sentence
  if (r.type === 'dictation') return `${r.prompt} ｜ ${r.sentence}`
  return r.prompt // en2cn / cn2en
}

function speakWord(text) {
  if (state.settings.speechEnabled) speak(text, { rate: state.settings.speechRate })
}

/* ---------------- 流程 ---------------- */
function start() {
  const words = getPoolWords(pool.value)
  if (!words.length) {
    toast('该词池暂无单词')
    return
  }
  const list = buildQuestions({ words, count: count.value, type: type.value, maskSide: maskSide.value })
  if (!list.length) {
    toast('该词池里没有可出此题型（需要例句）的单词，换个题型或词池试试')
    return
  }
  questions.value = list
  index.value = 0
  records.value = []
  allWrongAdded.value = false
  resetAnswer()
  phase.value = 'quiz'
}

function resetAnswer() {
  userInput.value = ''
  answered.value = false
  revealed.value = false
  currentResult.value = null
}

/** 提交答案（判分只发生在内存里，不写任何 SRS 数据） */
function submit() {
  const q = current.value
  if (!q) return
  const input = userInput.value.trim()
  if (!input) {
    toast('请先填写答案')
    return
  }
  const result = judge(q, input)
  currentResult.value = result
  answered.value = true
  records.value.push({
    type: q.type,
    word: q.word,
    prompt: q.prompt,
    sentence: q.sentence,
    hint: q.hint,
    answerText: q.answerText,
    input,
    correct: result.correct,
    near: !!result.near
  })
}

/* ---------------- 蒙版遮挡（自评题型） ---------------- */

/** 揭开蒙版：只改本地显示状态，不产生任何记录 */
function revealMask() {
  revealed.value = true
}

/**
 * 自评对错并进入下一题
 * 蒙版遮挡没有客观答案可判，由用户如实评价；
 * 记录同样只写进本次练习的结果（不碰 SRS）。
 */
function selfAssess(ok) {
  const q = current.value
  if (!q) return
  records.value.push({
    type: q.type,
    word: q.word,
    meaning: q.meaning,
    side: q.side,
    answerText: q.answerText,
    input: ok ? '记住了' : '没记住',
    correct: !!ok,
    selfAssessed: true
  })
  next()
}

/** 下一题 / 结束 */
function next() {
  if (index.value + 1 >= questions.value.length) {
    finish()
    return
  }
  index.value++
  resetAnswer()
}

function finish() {
  recordPractice({ answered: records.value.length, correct: correctCount.value })
  phase.value = 'result'
}

/** 主按钮：未作答时提交，已作答时进入下一题 */
function onPrimary() {
  if (!answered.value) submit()
  else next()
}

/** 回车键：同样根据是否已作答分流 */
function onEnter() {
  onPrimary()
}

/** 自定义题量输入钳制 */
function onCustomCount(e) {
  const v = Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 1))
  customCount.value = v
  e.target.value = v
}

/* ---------------- 生词本 ---------------- */
function addWrongToNotebook() {
  const words = wrongList.value.map((r) => r.word)
  const added = addManyToNotebook(words)
  allWrongAdded.value = true
  toast(added ? `已加入生词本 ${added} 个` : '这些错题都已在生词本中')
}

function addOne(word) {
  addToNotebook(word)
  toast('已加入生词本')
}

/* ---------------- 自动聚焦输入框 ---------------- */
watch([index, phase], async () => {
  if (phase.value !== 'quiz') return
  await nextTick()
  if (inputEl.value) inputEl.value.focus()
})
</script>

<style scoped>
/* ---------- 配置区 ---------- */
.setup__title {
  margin: 0 0 4px;
  font-size: 18px;
}
.setup__desc {
  margin: 0 0 18px;
  font-size: 13px;
  color: var(--muted);
}
.setup .section-title {
  margin-top: 16px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  border-radius: 11px;
  background: var(--card-soft);
  border: 1px solid var(--border);
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
  transition: all 0.16s ease;
}
.chip:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.chip--active {
  background: var(--primary-soft);
  border-color: var(--primary);
  color: var(--primary);
}
.chip__count {
  font-size: 11px;
  opacity: 0.75;
}
.chip-input {
  width: 78px;
  height: 38px;
  text-align: center;
  font-size: 14px;
  font-weight: 700;
  border-radius: 11px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
}
.chip-input::-webkit-outer-spin-button,
.chip-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* 题型下方的补充配置（蒙版遮挡的遮挡方向） */
.sub-config {
  margin-top: 12px;
  padding: 12px;
  border-radius: 12px;
  background: var(--card-soft);
  border: 1px solid var(--border);
}
.sub-config__label {
  display: block;
  margin-bottom: 8px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--muted);
}
.type-hint {
  margin: 10px 0 0;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--muted);
}

.start-btn {
  margin-top: 20px;
}

/* ---------- 生词本 ---------- */
.notebook {
  margin-top: 14px;
}
.notebook__head {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  text-align: left;
}
.notebook__info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.notebook__title {
  font-size: 15px;
  font-weight: 700;
}
.notebook__desc {
  font-size: 12px;
  color: var(--muted);
}
.notebook__chev {
  font-size: 22px;
  color: var(--muted);
  transition: transform 0.2s ease;
}
.notebook__chev--open {
  transform: rotate(90deg);
}
.notebook__list {
  margin-top: 14px;
  border-top: 1px solid var(--border);
  padding-top: 12px;
}
.notebook__empty {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--muted);
}
.notebook__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 0;
  border-bottom: 1px solid var(--border);
}
.notebook__item:last-child {
  border-bottom: none;
}
.notebook__word {
  font-weight: 700;
  font-size: 14.5px;
  flex-shrink: 0;
}
.notebook__meaning {
  flex: 1;
  min-width: 0;
  font-size: 12.5px;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.notebook__del {
  flex-shrink: 0;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--danger);
}

/* ---------- 答题区 ---------- */
.quiz__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  margin-bottom: 8px;
}
.quiz__score {
  color: var(--text);
}
.quiz__bar-track {
  height: 6px;
  border-radius: 999px;
  background: var(--border);
  overflow: hidden;
  margin-bottom: 16px;
}
.quiz__bar-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--primary);
  transition: width 0.3s ease;
}

.quiz__type {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 11.5px;
  font-weight: 700;
}

.quiz__prompt {
  margin: 14px 0 18px;
}
.quiz__word-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.quiz__word {
  font-size: clamp(26px, 8vw, 34px);
  font-weight: 800;
  line-height: 1.2;
  word-break: break-word;
}
.quiz__phonetic {
  margin: 6px 0 0;
  font-size: 14px;
  color: var(--muted);
}
.quiz__meaning {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.5;
}
.quiz__sentence {
  margin: 0;
  font-size: 17px;
  line-height: 1.75;
}
/* 默写填空：句子跟在中英释义下面，留点间距 */
.quiz__sentence--gap {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--border);
}
.quiz__hint {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--muted);
}
.quiz__ask {
  margin: 10px 0 0;
  font-size: 12.5px;
  color: var(--muted);
}
/* 说明文字 + 右侧小按钮（听发音提示）同行 */
.quiz__ask-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
.quiz__ask-row .quiz__ask {
  margin: 10px 0 0;
}
.hint-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 10px;
  padding: 6px 11px;
  border-radius: 999px;
  background: var(--card-soft);
  border: 1px solid var(--border);
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
  transition: all 0.16s ease;
}
.hint-btn:active {
  transform: scale(0.95);
}
.hint-btn svg {
  width: 14px;
  height: 14px;
}

/* ---------- 蒙版遮挡 ---------- */
.mask {
  position: relative;
  display: block;
  width: 100%;
  min-height: 84px;
  margin-top: 14px;
  padding: 20px 16px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: var(--card-soft);
  overflow: hidden;
  transition: border-color 0.2s ease, background 0.2s ease;
}
.mask--open {
  border-color: var(--primary);
  background: var(--primary-soft);
}
.mask__text {
  display: block;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.55;
  color: var(--text);
  word-break: break-word;
}
/* 未揭开：答案被模糊，看不出内容 */
.mask__text--blurred {
  filter: blur(11px);
  opacity: 0.55;
  user-select: none;
}
/* 斜纹蒙版层盖在模糊的答案上 */
.mask__cover {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: repeating-linear-gradient(
    45deg,
    var(--card-soft) 0 9px,
    var(--bg) 9px 18px
  );
}
.mask__badge {
  padding: 7px 14px;
  border-radius: 999px;
  background: var(--card);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  color: var(--muted);
  font-size: 12.5px;
  font-weight: 700;
}
.quiz__reveal-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
}
.quiz__reveal-row .quiz__phonetic {
  margin: 0;
}

/* 自评按钮（蒙版遮挡） */
.assess {
  display: flex;
  gap: 12px;
}
.assess__item {
  flex: 1;
}
.assess__item--bad {
  border: 1.5px solid var(--danger);
  color: var(--danger);
}

.speak-btn {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary-soft);
  color: var(--primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.speak-btn svg {
  width: 19px;
  height: 19px;
}
.speak-btn:active {
  transform: scale(0.92);
}

/* ---------- 作答 ---------- */
.answer {
  border-top: 1px solid var(--border);
  padding-top: 16px;
}
.answer__input {
  width: 100%;
  min-height: 48px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1.5px solid var(--border);
  background: var(--bg);
  color: var(--text);
  font-size: 16px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s ease;
}
.answer__input:focus {
  border-color: var(--primary);
}
.answer__input--ok {
  border-color: var(--success);
  background: var(--success-soft);
}
.answer__input--bad {
  border-color: var(--danger);
  background: var(--danger-soft);
}

.feedback {
  margin: 12px 0 4px;
  padding: 12px 14px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13.5px;
  line-height: 1.6;
}
.feedback--ok {
  background: var(--success-soft);
  color: var(--success);
}
.feedback--bad {
  background: var(--danger-soft);
  color: var(--danger);
}
.feedback__title {
  font-weight: 700;
}
.feedback__answer {
  color: var(--text);
}
.feedback__extra {
  font-size: 12.5px;
  opacity: 0.9;
}

.answer .btn {
  margin-top: 14px;
}

/* ---------- 结果 ---------- */
.result {
  text-align: center;
  padding: 30px 20px;
}
.result__emoji {
  font-size: 52px;
  line-height: 1;
}
.result__title {
  margin: 12px 0 0;
  font-size: 20px;
}
.result__stats {
  display: flex;
  justify-content: center;
  gap: 26px;
  margin: 22px 0 4px;
}
.result__item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.result__num {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.1;
}
.result__label {
  font-size: 12px;
  color: var(--muted);
}
.result__note {
  margin: 16px 0 0;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--muted);
}
.result__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 22px;
}
.result__actions .btn {
  flex: 1;
}

/* ---------- 错题 ---------- */
.wrong {
  margin-top: 14px;
}
.wrong__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.link-btn {
  font-size: 13px;
  font-weight: 700;
  color: var(--primary);
  padding: 4px 2px;
}
.wrong__item {
  padding: 14px 0;
  border-top: 1px solid var(--border);
}
.wrong__top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.wrong__type {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--card-soft);
  border: 1px solid var(--border);
  font-size: 11px;
  color: var(--muted);
}
.wrong__word {
  font-weight: 800;
  font-size: 15px;
}
.wrong__q {
  margin: 8px 0 6px;
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--muted);
}
.wrong__a {
  margin: 4px 0 0;
  font-size: 13.5px;
}
.wrong__user {
  color: var(--danger);
}
.wrong__near {
  font-size: 12px;
  color: var(--warning);
}
.wrong__add {
  margin-top: 10px;
  padding: 7px 14px;
  border-radius: 10px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 12.5px;
  font-weight: 700;
}
.wrong__add:disabled {
  background: var(--card-soft);
  color: var(--muted);
  cursor: default;
}

.all-correct {
  margin: 0;
  padding: 20px 0;
  text-align: center;
  font-size: 15px;
  color: var(--success);
}
</style>
