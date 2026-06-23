<script setup lang="ts">
import { onMounted } from 'vue'
import { seedMockData } from '~~/utils/devSeed'
import { recordSessionOpen } from '~~/composables/useSessionTracker'
import { usePersonaEngine } from '~~/composables/usePersonaEngine'

const { evaluate } = usePersonaEngine()

/**
 * Execution order matters here:
 * 1. seedMockData  — writes fake history if the DB is empty (dev-only, no-ops in prod)
 * 2. recordSessionOpen — writes today's open to session_opens (deduped, always runs)
 * 3. evaluate      — reads everything and computes the current profile
 *
 * Any widget that then triggers an interaction (read, hide, etc.) calls
 * evaluate() again itself — see NewsWidget.vue for the pattern.
 */
onMounted(async () => {
  await seedMockData()
  await recordSessionOpen()
  await evaluate()
})
</script>

<template>
  <NuxtPage />
  <!-- DevDBInspector only renders in dev builds — import.meta.dev is stripped in prod -->
  <DevDBInspector />
</template>