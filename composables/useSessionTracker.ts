import { useSomaticoDB } from './useSomaticoDB'

/**
 * Records one app open per browser session to session_opens.
 * Uses sessionStorage as a dedup flag — survives navigation within the same
 * tab session but resets on tab close, which is the right granularity
 * (two page navigations in one sitting = one "open", not two data points).
 *
 * Call once from app.vue onMounted. Never call from a widget directly.
 */
export async function recordSessionOpen() {
  if (!import.meta.client) return
  if (sessionStorage.getItem('da_session_recorded')) return

  const db = await useSomaticoDB()
  const now = new Date()
  await db.add('session_opens', {
    timestamp: now.getTime(),
    hour: now.getHours(),
    dayOfWeek: now.getDay(),
  })

  sessionStorage.setItem('da_session_recorded', '1')
}