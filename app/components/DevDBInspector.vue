<script setup lang="ts">
/**
 * Dev-only. Answers "did my data actually land in the DB?" and
 * "what does the engine currently think about the user?"
 *
 * Rendered in app.vue only when $config.public.isDev is true.
 * Never imported in production.
 */
import { ref, onMounted } from 'vue'
import { useSomaticoDB } from '~~/composables/useSomaticoDB'
import { usePersonaEngine } from '~~/composables/usePersonaEngine'

const open = ref(false)

const analytics = ref<any[]>([])
const keywords = ref<any[]>([])
const sessions = ref<any[]>([])
const { domainProfiles, unlockedFeatures, evaluate } = usePersonaEngine()

async function refresh() {
  const db = await useSomaticoDB()
  const allAnalytics = await db.getAll('widget_analytics')
  const allKeywords = await db.getAll('keywords')
  const allSessions = await db.getAll('session_opens')

  // Show last 5 of each, most recent first
  analytics.value = allAnalytics.slice(-5).reverse()
  keywords.value = allKeywords.slice(-5).reverse()
  sessions.value = allSessions.slice(-5).reverse()

  await evaluate()
}

async function clearDB() {
  const db = await useSomaticoDB()
  const tx = db.transaction(['widget_analytics', 'keywords', 'session_opens'], 'readwrite')
  await tx.objectStore('widget_analytics').clear()
  await tx.objectStore('keywords').clear()
  await tx.objectStore('session_opens').clear()
  await tx.done
  sessionStorage.removeItem('da_session_recorded')
  await refresh()
}

function formatHour(h: number) {
  const ampm = h >= 12 ? 'pm' : 'am'
  const display = h % 12 || 12
  return `${display}${ampm}`
}

onMounted(refresh)
</script>

<template>
  <div style="position:fixed; bottom:16px; right:16px; z-index:9999; font-family:monospace; font-size:12px;">
    <button
      type="button"
      @click="open = !open"
      style="background:#1e1e2e; color:#cdd6f4; border:none; padding:6px 12px; border-radius:6px; cursor:pointer;"
    >
      {{ open ? '▼ DB inspector' : '▲ DB inspector' }}
    </button>

    <div v-if="open" style="background:#1e1e2e; color:#cdd6f4; padding:16px; border-radius:8px; margin-top:6px; width:440px; max-height:80vh; overflow-y:auto;">

      <div style="display:flex; gap:8px; margin-bottom:16px;">
        <button type="button" @click="refresh" style="background:#313244; color:#cdd6f4; border:none; padding:4px 10px; border-radius:4px; cursor:pointer;">↻ Refresh</button>
        <button type="button" @click="clearDB" style="background:#f38ba8; color:#1e1e2e; border:none; padding:4px 10px; border-radius:4px; cursor:pointer;">✕ Clear DB</button>
      </div>

      <!-- Raw store contents -->
      <p style="color:#89b4fa; margin:0 0 6px;">widget_analytics (last 5)</p>
      <div v-if="analytics.length === 0" style="color:#6c7086; margin-bottom:12px;">empty</div>
      <div v-for="row in analytics" :key="row.id" style="background:#313244; padding:6px 8px; border-radius:4px; margin-bottom:4px;">
        widget: <span style="color:#a6e3a1;">{{ row.widgetId }}</span>
        · dwell: {{ (row.dwellTimeMs / 1000).toFixed(0) }}s
        · idle: {{ (row.idleTimeMs / 1000).toFixed(0) }}s
        · <span style="color:#6c7086;">{{ new Date(row.timestamp).toLocaleDateString() }}</span>
      </div>

      <p style="color:#89b4fa; margin:12px 0 6px;">keywords (last 5)</p>
      <div v-if="keywords.length === 0" style="color:#6c7086; margin-bottom:12px;">empty</div>
      <div v-for="row in keywords" :key="row.id" style="background:#313244; padding:6px 8px; border-radius:4px; margin-bottom:4px;">
        <span style="color:#cba6f7;">{{ row.word }}</span>
        · weight: <span :style="row.weight > 0 ? 'color:#a6e3a1' : 'color:#f38ba8'">{{ row.weight > 0 ? '+' : '' }}{{ row.weight }}</span>
        · src: {{ row.source }}
      </div>

      <p style="color:#89b4fa; margin:12px 0 6px;">session_opens (last 5)</p>
      <div v-if="sessions.length === 0" style="color:#6c7086; margin-bottom:12px;">empty</div>
      <div v-for="row in sessions" :key="row.id" style="background:#313244; padding:6px 8px; border-radius:4px; margin-bottom:4px;">
        <span style="color:#f9e2af;">{{ formatHour(row.hour) }}</span>
        · {{ ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][row.dayOfWeek] }}
        · <span style="color:#6c7086;">{{ new Date(row.timestamp).toLocaleDateString() }}</span>
      </div>

      <!-- Computed persona profile -->
      <p style="color:#89b4fa; margin:16px 0 6px;">domain profiles</p>
      <div v-if="domainProfiles.length === 0" style="color:#6c7086;">not evaluated yet</div>
      <div v-for="p in domainProfiles" :key="p.domainId" style="background:#313244; padding:8px; border-radius:4px; margin-bottom:6px;">
        <span style="color:#cba6f7;">{{ p.domainId }}</span><br/>
        confidence: {{ (p.confidence * 100).toFixed(0) }}%
        · intent: {{ (p.intentWeight * 100).toFixed(0) }}%
        · triggers: {{ p.canTriggerIntegrations ? '✓' : '✗' }}<br/>
        tags: <span v-if="p.associatedTags.length === 0" style="color:#6c7086;">none yet</span>
        <span v-for="tag in p.associatedTags" :key="tag" style="background:#45475a; padding:2px 6px; border-radius:3px; margin-right:4px; color:#a6e3a1;">{{ tag }}</span>
      </div>

      <p style="color:#89b4fa; margin:12px 0 6px;">unlocked features</p>
      <div v-if="unlockedFeatures.length === 0" style="color:#6c7086;">none</div>
      <div v-for="f in unlockedFeatures" :key="f.id" style="background:#313244; padding:8px; border-radius:4px; margin-bottom:4px;">
        <span style="color:#f9e2af;">{{ f.id }}</span><br/>
        {{ f.title }}
      </div>

    </div>
  </div>
</template>