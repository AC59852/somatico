import { onMounted, onUnmounted } from 'vue'
import { useSomaticoDB } from './useSomaticoDB'

/**
 * Universal — drop into any widget's root component unchanged.
 * Writes happen on interaction, spread across the session, so the
 * exit hook below only has to close out a number that already exists
 * instead of computing anything fresh.
 */
export function useWidgetTelemetry(widgetId: string) {
  const sessionStart = Date.now()
  let lastInteraction = sessionStart
  let idleAccumulator = 0
  let recordId: number | null = null

  async function recordInteraction() {
    const db = await useSomaticoDB()
    const now = Date.now()
    idleAccumulator += now - lastInteraction
    lastInteraction = now

    if (recordId === null) {
      recordId = (await db.add('widget_analytics', {
        widgetId,
        dwellTimeMs: now - sessionStart,
        idleTimeMs: idleAccumulator,
        timestamp: sessionStart,
      })) as number
    } else {
      const existing = await db.get('widget_analytics', recordId)
      if (existing) {
        existing.dwellTimeMs = now - sessionStart
        existing.idleTimeMs = idleAccumulator
        await db.put('widget_analytics', existing)
      }
    }
  }

  // deliberately tiny — closes out an existing row, no fresh calculation
  async function flushOnExit() {
    if (recordId === null) return
    const db = await useSomaticoDB()
    const existing = await db.get('widget_analytics', recordId)
    if (existing) {
      existing.dwellTimeMs = Date.now() - sessionStart
      await db.put('widget_analytics', existing)
    }
  }

  function handleVisibilityChange() {
    if (document.visibilityState === 'hidden') flushOnExit()
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', flushOnExit)
  })

  onUnmounted(() => {
    flushOnExit()
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('pagehide', flushOnExit)
  })

  return { recordInteraction }
}