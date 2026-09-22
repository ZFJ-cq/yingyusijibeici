<template>
  <div class="word-card" :class="{ clickable }" @click="onCardClick">
    <!-- 学习模式：直接展示单词 + 释义 + 例句 -->
    <div v-if="mode === 'learn'" class="wc-learn">
      <div class="wc-top">
        <div class="wc-word">{{ word.word }}</div>
        <button class="speak-btn" title="朗读" @click.stop="speakWord">🔊</button>
      </div>
      <div v-if="word.phonetic" class="wc-phonetic">{{ word.phonetic }}</div>
      <div class="wc-meaning">{{ word.meaning }}</div>
      <div v-if="word.example" class="wc-example">
        <span>{{ word.example }}</span>
        <span v-if="word.exampleCn" class="wc-example-cn">{{ word.exampleCn }}</span>
      </div>
    </div>

    <!-- 复习模式：可翻转卡片 -->
    <div v-else class="wc-inner" :class="{ flipped: showMeaning }">
      <div class="wc-face wc-front">
        <div class="wc-word">{{ word.word }}</div>
        <div v-if="word.phonetic" class="wc-phonetic">{{ word.phonetic }}</div>
        <button class="speak-btn" title="朗读" @click.stop="speakWord">🔊</button>
        <div class="wc-hint">点击卡片查看释义</div>
      </div>
      <div class="wc-face wc-back">
        <div class="wc-meaning">{{ word.meaning }}</div>
        <div v-if="word.example" class="wc-example">
          <span>{{ word.example }}</span>
          <span v-if="word.exampleCn" class="wc-example-cn">{{ word.exampleCn }}</span>
        </div>
        <button class="speak-btn" title="朗读" @click.stop="speakWord">🔊</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { speak } from '../composables/useSpeech'
import { useStore } from '../composables/useStore'

const props = defineProps({
  word: { type: Object, required: true },
  mode: { type: String, default: 'learn' }, // 'learn' | 'review'
  showMeaning: { type: Boolean, default: true },
  clickable: { type: Boolean, default: false }
})
const emit = defineEmits(['flip'])

const { state } = useStore()

function speakWord() {
  if (state.settings.speechEnabled) speak(props.word.word, { rate: state.settings.speechRate })
}
function onCardClick() {
  if (props.clickable) emit('flip')
}
</script>

<style scoped>
.word-card {
  background: var(--card);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 30px 28px;
  min-height: 240px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  animation: pop-in 0.3s ease;
}

.word-card.clickable {
  cursor: pointer;
}

.wc-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.wc-word {
  font-size: 34px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.wc-phonetic {
  color: var(--muted);
  font-size: 16px;
  margin-top: 6px;
}

.wc-meaning {
  font-size: 20px;
  margin-top: 16px;
  line-height: 1.5;
}

.wc-example {
  color: var(--muted);
  font-size: 15px;
  margin-top: 12px;
  line-height: 1.6;
  border-left: 3px solid var(--primary-soft);
  padding-left: 12px;
}

.wc-example-cn {
  display: block;
  margin-top: 4px;
  font-size: 13px;
  opacity: 0.85;
}

.speak-btn {
  background: var(--primary-soft);
  color: var(--primary);
  border-radius: 50%;
  width: 42px;
  height: 42px;
  font-size: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease, background 0.2s ease;
}
.speak-btn:hover {
  transform: scale(1.08);
}

/* 翻转卡片 */
.wc-inner {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 240px;
  perspective: 1200px;
}
.wc-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  justify-content: safe center;
  align-items: center;
  text-align: center;
  padding: 20px;
  border-radius: var(--radius);
  overflow-y: auto;
}
.wc-front .wc-word {
  font-size: 38px;
}
.wc-front .speak-btn {
  position: absolute;
  top: 14px;
  right: 14px;
}
.wc-hint {
  position: absolute;
  bottom: 16px;
  color: var(--muted);
  font-size: 13px;
}
.wc-back {
  transform: rotateY(180deg);
  background: var(--primary-soft);
}
.wc-back .speak-btn {
  position: absolute;
  top: 14px;
  right: 14px;
}
.wc-inner.flipped {
  transform: rotateY(180deg);
  transition: transform 0.55s cubic-bezier(0.4, 0.2, 0.2, 1);
}
.wc-inner {
  transition: transform 0.55s cubic-bezier(0.4, 0.2, 0.2, 1);
}
</style>
