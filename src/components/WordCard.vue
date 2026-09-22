<template>
  <div
    class="word-card"
    :class="{ 'word-card--clickable': clickable }"
    :role="clickable ? 'button' : null"
    :tabindex="clickable ? 0 : null"
    :aria-label="clickable ? `翻转卡片查看 ${word.word} 的释义` : null"
    @click="onCardClick"
    @keydown.enter.prevent="onCardClick"
    @keydown.space.prevent="onCardClick"
  >
    <!-- ============ 学习模式：默认只露单词，点按钮才显示释义与例句 ============ -->
    <div v-if="mode === 'learn'" class="wc-learn">
      <div class="wc-head">
        <span class="wc-word">{{ word.word }}</span>
        <button class="speak-btn" title="朗读单词" aria-label="朗读单词" @click.stop="speakWord">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M11 5 6 9H2v6h4l5 4V5z" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        </button>
      </div>
      <p v-if="word.phonetic" class="wc-phonetic">{{ word.phonetic }}</p>

      <!-- 未翻开：先自己回想，避免一上来就看到释义 -->
      <div v-if="!revealed" class="wc-reveal">
        <p class="wc-reveal__hint">先回想一下它的意思</p>
        <button class="wc-reveal__btn" @click.stop="emit('reveal')">显示释义</button>
      </div>

      <!-- 已翻开：释义 + 例句 -->
      <div v-else class="wc-revealed">
        <p class="wc-meaning">{{ word.meaning }}</p>
        <div v-if="word.example" class="wc-example">
          <span>{{ word.example }}</span>
          <span v-if="word.exampleCn" class="wc-example__cn">{{ word.exampleCn }}</span>
        </div>
        <WordExtras :word="word" />
      </div>
    </div>

    <!-- ============ 复习模式：3D 翻转卡片（正面英文 / 背面释义） ============ -->
    <div v-else class="wc-flip" :class="{ 'is-flipped': showMeaning }">
      <!-- 正面 -->
      <div class="wc-face wc-face--front">
        <span class="wc-word">{{ word.word }}</span>
        <p v-if="word.phonetic" class="wc-phonetic">{{ word.phonetic }}</p>
        <button class="speak-btn" title="朗读单词" aria-label="朗读单词" @click.stop="speakWord">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M11 5 6 9H2v6h4l5 4V5z" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        </button>
        <span class="wc-hint">点击卡片查看释义</span>
      </div>
      <!-- 背面 -->
      <div class="wc-face wc-face--back">
        <p class="wc-meaning">{{ word.meaning }}</p>
        <div v-if="word.example" class="wc-example">
          <span>{{ word.example }}</span>
          <span v-if="word.exampleCn" class="wc-example__cn">{{ word.exampleCn }}</span>
        </div>
        <!-- 复习卡片背面同样展示搭配与真题例句 -->
        <WordExtras :word="word" />
        <button class="speak-btn" title="朗读单词" aria-label="朗读单词" @click.stop="speakWord">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M11 5 6 9H2v6h4l5 4V5z" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 单词卡片
 * - mode="learn" ：平铺展示全部信息（新词学习页）
 * - mode="review"：3D 翻转，正面只露英文，点击翻面看释义（复习页）
 * 缺失字段（部分词无音标/无例句）会自动隐藏对应区块。
 */
import { speak } from '../composables/useSpeech'
import { useStore } from '../composables/useStore'
import WordExtras from './WordExtras.vue'

const props = defineProps({
  word: { type: Object, required: true },
  mode: { type: String, default: 'learn' }, // 'learn' | 'review'
  showMeaning: { type: Boolean, default: true }, // 复习模式下是否已翻面
  clickable: { type: Boolean, default: false }, // 是否允许点击翻面
  revealed: { type: Boolean, default: true } // 学习模式下释义/例句是否已显示（false 时靠按钮展开）
})

const emit = defineEmits(['flip', 'reveal'])

const { state } = useStore()

/** 朗读当前单词（遵循设置里的朗读开关与语速） */
function speakWord() {
  if (state.settings.speechEnabled) speak(props.word.word, { rate: state.settings.speechRate })
}

/** 点击卡片：仅复习模式下触发翻面 */
function onCardClick() {
  if (props.clickable) emit('flip')
}
</script>

<style scoped>
.word-card {
  background: var(--card);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 24px 20px;
  min-height: 230px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  animation: pop-in 0.28s ease;
}

.word-card--clickable {
  cursor: pointer;
}

/* 键盘聚焦时的可见焦点环（可访问性） */
.word-card--clickable:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 3px;
}

/* ---------- 单词 ---------- */
.wc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.wc-word {
  display: block;
  /* clamp：小屏 28px、随视口增大到 38px，避免长单词撑破卡片 */
  font-size: clamp(28px, 8vw, 38px);
  font-weight: 800;
  letter-spacing: 0.4px;
  line-height: 1.2;
  word-break: break-word;
}

.wc-phonetic {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 15px;
}

/* ---------- 学习模式：未显示释义时的展开区 ---------- */
.wc-reveal {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.wc-reveal__hint {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}

.wc-reveal__btn {
  min-height: 44px;
  padding: 11px 24px;
  border-radius: 13px;
  background: var(--primary);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  box-shadow: 0 6px 16px rgba(79, 124, 255, 0.28);
  transition: transform 0.15s ease;
}
.wc-reveal__btn:active {
  transform: scale(0.97);
}

/* 展开后的内容淡入，避免"突然出现" */
.wc-revealed {
  animation: reveal-in 0.28s ease;
}

@keyframes reveal-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.wc-meaning {
  margin: 14px 0 0;
  font-size: 18px;
  line-height: 1.55;
  font-weight: 600;
}

.wc-example {
  margin-top: 12px;
  padding-left: 12px;
  border-left: 3px solid var(--primary-soft);
  color: var(--muted);
  font-size: 14px;
  line-height: 1.65;
}

/* 例句的中文译文：换行并弱化 */
.wc-example__cn {
  display: block;
  margin-top: 4px;
  font-size: 13px;
  opacity: 0.85;
}

/* ---------- 朗读按钮 ---------- */
.speak-btn {
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--primary-soft);
  color: var(--primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease;
}
.speak-btn svg {
  width: 20px;
  height: 20px;
  display: block;
}
.speak-btn:active {
  transform: scale(0.9);
}

/* ---------- 翻转卡片 ---------- */
.wc-flip {
  position: relative;
  width: 100%;
  min-height: 230px;
  perspective: 1200px; /* 3D 透视 */
  transform-style: preserve-3d;
  transition: transform 0.55s cubic-bezier(0.4, 0.2, 0.2, 1);
}

/* 翻面：整体绕 Y 轴转 180° */
.wc-flip.is-flipped {
  transform: rotateY(180deg);
}

.wc-face {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  /* safe center：内容超出时不会把顶部裁掉（可正常滚动查看） */
  justify-content: safe center;
  align-items: center;
  text-align: center;
  padding: 20px 8px;
  border-radius: var(--radius);
  overflow-y: auto;
  /* 背面隐藏：两面各朝一侧，翻转后只看到一面 */
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.wc-face--front .speak-btn {
  margin-top: 16px;
}

.wc-face--back {
  transform: rotateY(180deg);
  background: var(--primary-soft);
}

.wc-face--back .wc-meaning {
  margin-top: 0;
}

.wc-face--back .speak-btn {
  margin-top: 14px;
}

.wc-face--back .wc-example {
  border-left-color: var(--primary);
  text-align: left;
}

.wc-hint {
  margin-top: 16px;
  color: var(--muted);
  font-size: 12.5px;
}
</style>
