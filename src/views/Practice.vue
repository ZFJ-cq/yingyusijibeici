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
          混合会随机出「英译中 / 中译英 / 短句填空 / 默写填空 / 词组填空」，这几种都需要打字作答；
          想练「蒙版遮挡」请单独选择该题型。
        </p>
        <p v-else-if="type === 'banked'" class="type-hint">
          ⭐ <b>真题题型</b>：完整四级真题原文挖 10 个空，从 15 个候选词里选，<b>不依赖词池</b>。
          题库现有 {{ EXAM_MAX.banked }} 篇真题。
        </p>
        <p v-else-if="type === 'translate'" class="type-hint">
          ⭐ <b>真题题型</b>：历年四级段落翻译真题拆成的单句，题库现有 {{ EXAM_MAX.translate }} 句。
          翻译没有唯一答案，提交后按<b>关键词覆盖率</b>判定并给出参考译文，请自行对照。
        </p>
        <p v-else-if="type === 'collocation' || type === 'collocationChoice'" class="type-hint">
          词组题考察固定搭配（如 take into ______）。题源是高频词的常用搭配整理，
          选「高频词」相关词池覆盖最全。
        </p>

        <button class="btn btn-primary btn-block start-btn" :disabled="!canStart" @click="start">
          {{ startLabel }}
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

      <!-- 词组填空：给中文释义 + 挖空的词组 -->
      <div v-else-if="current.type === 'collocation'" class="quiz__prompt">
        <p class="quiz__meaning">{{ current.prompt }}</p>
        <p class="quiz__phrase">{{ current.phrase }}</p>
        <p class="quiz__ask">请填出这个搭配里缺少的单词</p>
      </div>

      <!-- 词组四选一：给中文释义，四个搭配里挑正确的 -->
      <div v-else-if="current.type === 'collocationChoice'" class="quiz__prompt">
        <p class="quiz__meaning">{{ current.prompt }}</p>
        <p class="quiz__ask">下面哪个是「{{ current.word }}」的正确搭配？</p>
      </div>

      <!-- 汉译英（真题）：给中文原句 -->
      <div v-else-if="current.type === 'translate'" class="quiz__prompt">
        <span class="exam-src">{{ current.source }}</span>
        <p class="quiz__meaning quiz__meaning--cn">{{ current.prompt }}</p>
        <p class="quiz__ask">请把这句话译成英文</p>
      </div>

      <!-- 选词填空（真题 15 选 10）：真题原文 + 每空一个下拉选择 -->
      <div v-else-if="current.type === 'banked'" class="quiz__prompt">
        <span class="exam-src">{{ current.source }}</span>
        <h4 class="passage__title">{{ current.title }}</h4>
        <p class="passage">
          <template v-for="(seg, i) in current.segments" :key="i">
            <span>{{ seg }}</span>
            <span v-if="i < current.totalBlanks" class="blank-slot">
              <select
                v-model="bankedSelections[i]"
                class="blank-select"
                :class="blankClass(i)"
                :disabled="answered"
                :aria-label="`第 ${i + 1} 空`"
              >
                <option value="">—</option>
                <option v-for="b in current.wordBank" :key="b.key" :value="b.key">
                  {{ b.key }}) {{ b.word }}
                </option>
              </select>
            </span>
          </template>
        </p>

        <div class="bank">
          <span class="bank__label">词库（15 选 10，每个词只能用一次）</span>
          <div class="bank__grid">
            <span v-for="b in current.wordBank" :key="b.key" class="bank__item">
              <b>{{ b.key }})</b> {{ b.word }}
              <i>{{ b.pos }} {{ b.cn }}</i>
            </span>
          </div>
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

        <!-- 词组四选一：点选项作答，即时判分 -->
        <template v-else-if="current.type === 'collocationChoice'">
          <div class="options">
            <button
              v-for="(opt, i) in current.options"
              :key="i"
              class="option"
              :class="optionClass(i)"
              :disabled="answered"
              @click="pickOption(i)"
            >
              {{ opt }}
            </button>
          </div>

          <div v-if="answered" class="feedback" :class="feedbackClass">
            <span class="feedback__title">{{ feedbackTitle }}</span>
            <span class="feedback__answer">正确答案：<b>{{ current.answerText }}</b></span>
          </div>

          <button class="btn btn-primary btn-block" @click="onPrimary">{{ primaryLabel }}</button>
        </template>

        <!-- 其余题型：打字作答 + 自动判分 -->
        <template v-else>
          <!-- 汉译英用多行输入，其余用单行 -->
          <textarea
            v-if="current.type === 'translate'"
            v-model="userInput"
            class="answer__input answer__input--area"
            rows="3"
            :placeholder="placeholder"
            :disabled="answered"
          ></textarea>
          <input
            v-else
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

          <!-- 汉译英：关键词命中 + 参考译文（翻译没有唯一答案，必须给参考） -->
          <div v-if="answered && current.type === 'translate'" class="feedback" :class="feedbackClass">
            <span class="feedback__title">
              {{
                currentResult.trans.hit === currentResult.trans.total
                  ? '✅ 关键词全部命中'
                  : `⚠️ 关键词命中 ${currentResult.trans.hit}/${currentResult.trans.total}`
              }}
            </span>
            <span class="feedback__answer">参考译文：<b>{{ current.answerText }}</b></span>
            <span v-if="currentResult.trans.missed.length" class="feedback__extra">
              未覆盖关键词：{{ currentResult.trans.missed.join('、') }}
            </span>
            <span class="feedback__extra">
              翻译没有唯一答案，这里按关键词覆盖率判定，请对照参考译文自查。
            </span>
          </div>

          <!-- 选词填空：汇报对了几空（每个空已单独计入统计） -->
          <div v-else-if="answered && current.type === 'banked'" class="feedback" :class="feedbackClass">
            <span class="feedback__title">
              答对 {{ currentResult.banked.correctCount }} / {{ currentResult.banked.total }} 空
            </span>
            <span class="feedback__extra">
              每空已单独计入统计，答错的词可在结果页一键加入生词本。
            </span>
          </div>

          <!-- 判分反馈（普通题型） -->
          <div v-else-if="answered" class="feedback" :class="feedbackClass">
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
          <!-- 汉译英没有"单词"可收藏，不显示加入生词本 -->
          <button
            v-if="canAddNotebook(r)"
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
 * 九种题型（前 5 种可混合）：
 *   英译中 / 中译英 / 短句填空（给原形提示）/ 默写填空（不给提示）/ 蒙版遮挡（自评）
 *   词组填空 / 词组四选一 —— 题源：高频词常用搭配
 *   选词填空·真题（15 选 10）/ 汉译英·真题 —— 题源：真实四级真题
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
import {
  buildQuestions,
  judge,
  TYPE_LABEL,
  buildBankedQuestions,
  buildTranslationQuestions,
  judgeBanked,
  judgeTranslation
} from '../utils/practice'
import { BANKED_PASSAGES, TRANSLATION_ITEMS } from '../data/cet4Exam'

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
/** 题型：前 6 种基于词库词条；后 2 种（banked / translate）用的是**真实四级真题** */
const typeOptions = [
  { key: 'mixed', name: '混合（推荐）' },
  { key: 'en2cn', name: '英译中' },
  { key: 'cn2en', name: '中译英' },
  { key: 'cloze', name: '短句填空' },
  { key: 'dictation', name: '默写填空' },
  { key: 'mask', name: '蒙版遮挡' },
  { key: 'collocation', name: '词组填空' },
  { key: 'collocationChoice', name: '词组四选一' },
  { key: 'banked', name: '选词填空·真题' },
  { key: 'translate', name: '汉译英·真题' }
]

/** 真题题型的题库上限（用于钳制题量，避免显示"100 题"实际只出几题） */
const EXAM_MAX = { banked: BANKED_PASSAGES.length, translate: TRANSLATION_ITEMS.length }

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

/** 真题题型不依赖词池，所以始终可以开始 */
const canStart = computed(() => {
  if (type.value === 'banked' || type.value === 'translate') return true
  return poolSize.value > 0
})

/** 实际题量：真题题型按题库现有篇数/句数钳制，避免显示 100 题却只出几题 */
const effectiveCount = computed(() => {
  const max = EXAM_MAX[type.value]
  return max ? Math.min(count.value, max) : count.value
})

/** 开始按钮文案 */
const startLabel = computed(() => {
  if (!canStart.value) return '该词池暂无可练单词'
  if (type.value === 'banked') return `开始练习（${effectiveCount.value} 篇 × 10 空）`
  return `开始练习（${effectiveCount.value} 题）`
})

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
/** 选词填空（真题）：每个空所选的词库字母，长度 = 空数 */
const bankedSelections = ref([])
/** 词组四选一：已选中的选项下标 */
const choicePicked = ref(null)

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
  if (current.value.type === 'en2cn') return '输入中文释义'
  if (current.value.type === 'translate') return '写出你的英文翻译…'
  if (current.value.type === 'collocation') return '输入搭配中缺少的单词'
  return '输入英文单词'
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

/** 词组四选一：未答时高亮"已选"，答后标出正确项与选错项 */
function optionClass(i) {
  if (!answered.value) return choicePicked.value === i ? 'option--picked' : ''
  const q = current.value
  if (!q) return ''
  if (i === q.answerIndex) return 'option--right'
  if (i === choicePicked.value) return 'option--wrong'
  return ''
}

/** 选词填空：判分后逐空标出对错 */
function blankClass(i) {
  const r = currentResult.value && currentResult.value.banked
  if (!answered.value || !r) return ''
  return r.results[i] ? 'blank-select--ok' : 'blank-select--bad'
}

/** 错题列表里展示的题目文本 */
function questionText(r) {
  if (r.type === 'mask') return r.side === 'en' ? r.meaning : r.word
  if (r.type === 'cloze') return r.sentence
  if (r.type === 'dictation') return `${r.prompt} ｜ ${r.sentence}`
  if (r.type === 'collocation') return `${r.prompt} ｜ ${r.phrase || ''}`
  if (r.type === 'banked') return r.prompt
  return r.prompt // en2cn / cn2en / collocationChoice / translate
}

/** 汉译英记录里的 word 是"汉译英"四个字，不是真单词，不能进生词本 */
function canAddNotebook(r) {
  return !!r.word && r.type !== 'translate'
}

function speakWord(text) {
  if (state.settings.speechEnabled) speak(text, { rate: state.settings.speechRate })
}

/* ---------------- 流程 ---------------- */
function start() {
  let list = []
  if (type.value === 'banked') {
    // 真题选词填空：题源是真题原文，与词池无关
    list = buildBankedQuestions(effectiveCount.value)
  } else if (type.value === 'translate') {
    // 真题汉译英：题源是真题翻译原句，与词池无关
    list = buildTranslationQuestions(effectiveCount.value)
  } else {
    const words = getPoolWords(pool.value)
    if (!words.length) {
      toast('该词池暂无单词')
      return
    }
    list = buildQuestions({
      words,
      count: effectiveCount.value,
      type: type.value,
      maskSide: maskSide.value
    })
  }
  if (!list.length) {
    toast(
      type.value === 'collocation' || type.value === 'collocationChoice'
        ? '该词池里没有可出词组题的单词（需要该词有搭配记录），换「高频词」词池试试'
        : '该词池里没有可出此题型（需要例句）的单词，换个题型或词池试试'
    )
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
  choicePicked.value = null
  // 选词填空：给每个空准备一个空的选项位
  const q = current.value
  bankedSelections.value = q && q.type === 'banked' ? new Array(q.totalBlanks).fill('') : []
}

/**
 * 提交答案（判分只发生在内存里，不写任何 SRS 数据）
 * 不同题型的作答控件不同，这里按题型分流到各自的判分逻辑
 */
function submit() {
  const q = current.value
  if (!q) return
  if (q.type === 'banked') return submitBanked()
  if (q.type === 'translate') return submitTranslation()
  if (q.type === 'collocationChoice') return submitChoice()
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
    phrase: q.phrase, // 词组填空：挖空后的词组（错题列表要展示）
    answerText: q.answerText,
    input,
    correct: result.correct,
    near: !!result.near
  })
}

/* ---------------- 词组四选一 ---------------- */

/** 点击选项即作答，给即时反馈 */
function pickOption(i) {
  if (answered.value) return
  choicePicked.value = i
  submit()
}

function submitChoice() {
  const q = current.value
  if (!q) return
  if (choicePicked.value === null) {
    toast('请选择一个搭配')
    return
  }
  const picked = q.options[choicePicked.value]
  const result = judge(q, picked)
  currentResult.value = result
  answered.value = true
  records.value.push({
    type: q.type,
    word: q.word,
    prompt: q.prompt,
    answerText: q.answerText,
    input: picked,
    correct: result.correct
  })
}

/* ---------------- 选词填空（真题 15 选 10） ---------------- */

function submitBanked() {
  const q = current.value
  if (!q) return
  const sel = bankedSelections.value
  if (sel.some((s) => !s)) {
    toast('还有空格没有填完')
    return
  }
  const r = judgeBanked(q, sel)
  answered.value = true
  currentResult.value = { correct: r.correctCount >= Math.ceil(r.total * 0.6), banked: r }
  // 每个空单独记一条：正确率按"空"统计，错题也能逐个加入生词本
  for (let i = 0; i < q.answers.length; i++) {
    const rightItem = q.wordBank.find((b) => b.key === q.answers[i])
    const pickedItem = q.wordBank.find((b) => b.key === sel[i])
    records.value.push({
      type: 'banked',
      word: rightItem ? rightItem.word : q.answers[i],
      prompt: `《${q.title}》第 ${i + 1} 空`,
      answerText: rightItem ? rightItem.word : q.answers[i],
      input: pickedItem ? pickedItem.word : '（未填）',
      correct: r.results[i]
    })
  }
}

/* ---------------- 汉译英（真题） ---------------- */

function submitTranslation() {
  const q = current.value
  if (!q) return
  const input = userInput.value.trim()
  if (!input) {
    toast('请先写出你的翻译')
    return
  }
  const r = judgeTranslation(q, input)
  answered.value = true
  currentResult.value = { correct: r.correct, trans: r }
  records.value.push({
    type: 'translate',
    word: '汉译英',
    prompt: q.prompt,
    answerText: q.reference,
    input,
    correct: r.correct
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
  // 汉译英的 word 不是真单词，跳过
  const words = wrongList.value.filter((r) => canAddNotebook(r)).map((r) => r.word)
  if (!words.length) {
    toast('这些错题没有可加入生词本的单词')
    return
  }
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

/* ---------- 真题标识（选词填空 / 汉译英） ---------- */
.exam-src {
  display: inline-block;
  margin-bottom: 8px;
  padding: 3px 9px;
  border-radius: 999px;
  background: var(--warning-soft);
  color: var(--warning);
  font-size: 11px;
  font-weight: 700;
}

/* ---------- 选词填空（真题 15 选 10） ---------- */
.passage__title {
  margin: 0 0 10px;
  font-size: 15px;
  font-weight: 700;
}
.passage {
  margin: 0;
  font-size: 15.5px;
  line-height: 2.2;
  color: var(--text);
}
.blank-slot {
  display: inline-block;
  margin: 0 2px;
}
.blank-select {
  min-width: 96px;
  height: 30px;
  padding: 0 6px;
  border-radius: 8px;
  border: 1.5px solid var(--primary);
  background: var(--bg);
  color: var(--text);
  font-size: 13px;
  font-weight: 700;
  font-family: inherit;
  vertical-align: middle;
}
.blank-select:disabled {
  opacity: 1;
}
.blank-select--ok {
  border-color: var(--success);
  background: var(--success-soft);
  color: var(--success);
}
.blank-select--bad {
  border-color: var(--danger);
  background: var(--danger-soft);
  color: var(--danger);
}
.bank {
  margin-top: 14px;
  padding: 12px;
  border-radius: 12px;
  background: var(--card-soft);
  border: 1px solid var(--border);
}
.bank__label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
}
.bank__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 6px 10px;
}
.bank__item {
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--text);
}
.bank__item b {
  color: var(--primary);
}
.bank__item i {
  display: block;
  font-style: normal;
  font-size: 11.5px;
  color: var(--muted);
}

/* ---------- 词组填空 / 汉译英题干 ---------- */
.quiz__phrase {
  margin: 10px 0 0;
  font-size: 21px;
  font-weight: 800;
  letter-spacing: 1px;
  color: var(--text);
  word-break: break-word;
}
.quiz__meaning--cn {
  font-size: 16.5px;
  font-weight: 600;
  line-height: 1.8;
}

/* ---------- 四选一选项 ---------- */
.options {
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.option {
  width: 100%;
  text-align: left;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1.5px solid var(--border);
  background: var(--bg);
  color: var(--text);
  font-size: 14.5px;
  font-weight: 600;
  font-family: inherit;
  transition: all 0.16s ease;
}
.option:disabled {
  cursor: default;
}
.option--picked {
  border-color: var(--primary);
  background: var(--primary-soft);
  color: var(--primary);
}
.option--right {
  border-color: var(--success);
  background: var(--success-soft);
  color: var(--success);
}
.option--wrong {
  border-color: var(--danger);
  background: var(--danger-soft);
  color: var(--danger);
}

/* ---------- 多行输入（汉译英） ---------- */
.answer__input--area {
  resize: vertical;
  line-height: 1.7;
  font-size: 15px;
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
