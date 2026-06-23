<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useWidgetTelemetry } from '~~/composables/useWidgetTelemetry'
import { recordKeywordEvent } from '~~/utils/domains/news'
import { mockNewsFixtures, type MockArticle } from '~~/utils/mock/newsFixtures'
import { usePersonaEngine } from '~~/composables/usePersonaEngine'

const { recordInteraction } = useWidgetTelemetry('news')
const { evaluate } = usePersonaEngine()

const articles = ref<MockArticle[]>(mockNewsFixtures)
const hidden = ref(new Set<string>())

async function hideSimilar(article: MockArticle) {
  hidden.value.add(article.link)
  recordInteraction()
  await recordKeywordEvent(article.tokens, -2)
  await evaluate() // re-run the engine so the rest of the dashboard reflects this immediately
}

async function openArticle(article: MockArticle) {
  recordInteraction()
  await recordKeywordEvent(article.tokens, 1)
  await evaluate()
  window.open(article.link, '_blank')
}

onMounted(() => {
  recordInteraction() // a render is itself a session view
})
</script>

<template>
  <section class="signal">
    <h2>Signal</h2>
    <ul>
      <li v-for="article in articles.filter(a => !hidden.has(a.link))" :key="article.link">
        <button class="title" type="button" @click="openArticle(article)">
          {{ article.title }}
        </button>
        <button class="hide" type="button" @click="hideSimilar(article)">
          Hide similar
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.signal ul { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.75rem; }
.signal li { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
.title { background: none; border: none; text-align: left; cursor: pointer; font: inherit; }
.hide { background: none; border: none; opacity: 0.5; cursor: pointer; font-size: 0.8rem; }
.hide:hover { opacity: 1; }
</style>