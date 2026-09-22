<template>
  <div v-if="hasPhrases || hasExam" class="extras">
    <!-- 常用搭配（题源：高频词常用搭配整理，用于「词组填空 / 词组四选一」） -->
    <div v-if="hasPhrases" class="extras__sec">
      <span class="extras__title">常用搭配</span>
      <div v-for="(p, i) in word.phrases" :key="'p' + i" class="phr">
        <b class="phr__en">{{ p[0] }}</b>
        <span class="phr__cn">{{ p[1] }}</span>
      </div>
    </div>

    <!-- 真题例句（真实四级真题原句，与上面的词典例句是两回事） -->
    <div v-if="hasExam" class="extras__sec">
      <span class="extras__title extras__title--exam">真题例句</span>
      <div v-for="(s, i) in word.exam" :key="'e' + i" class="exam">
        <p class="exam__en">{{ s.en }}</p>
        <p class="exam__cn">{{ s.cn }}</p>
        <span class="exam__src">{{ s.src }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 词条附加内容：常用搭配 + 真题例句
 * ----------------------------------------------------------------------------
 * 两样数据都挂在词条上（src/data/index.js 的 attachExtras），只有高频词才有，
 * 没有数据的词整个组件不渲染，不影响常规词的卡片高度。
 *
 * ⚠️ 区分清楚两件事，别让用户误以为搭配也是真题：
 *    - 常用搭配：教学向整理的固定搭配，用来练「词组填空 / 词组四选一」
 *    - 真题例句：真实四级真题里的原句
 */
import { computed } from 'vue'

const props = defineProps({
  word: { type: Object, required: true }
})

const hasPhrases = computed(() => Array.isArray(props.word.phrases) && props.word.phrases.length > 0)
const hasExam = computed(() => Array.isArray(props.word.exam) && props.word.exam.length > 0)
</script>

<style scoped>
.extras {
  margin-top: 12px;
  text-align: left;
}

.extras__sec {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed var(--border);
}

.extras__title {
  display: inline-block;
  margin-bottom: 7px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--card-soft);
  border: 1px solid var(--border);
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
}
/* 真题例句单独用强调色，和普通搭配区分开 */
.extras__title--exam {
  background: var(--warning-soft);
  border-color: transparent;
  color: var(--warning);
}

/* ---------- 搭配 ---------- */
.phr {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  padding: 3px 0;
  font-size: 13px;
  line-height: 1.5;
}
.phr__en {
  color: var(--text);
  font-weight: 700;
}
.phr__cn {
  flex-shrink: 0;
  color: var(--muted);
  font-size: 12.5px;
}

/* ---------- 真题例句 ---------- */
.exam {
  margin-top: 8px;
  padding-left: 10px;
  border-left: 3px solid var(--warning);
}
.exam__en {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.65;
  color: var(--text);
}
.exam__cn {
  margin: 3px 0 0;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--muted);
}
.exam__src {
  display: inline-block;
  margin-top: 3px;
  font-size: 11px;
  color: var(--muted);
  opacity: 0.8;
}
</style>
