import { useSomaticoDB } from '~~/composables/useSomaticoDB'

const DAY_MS = 86_400_000

/**
 * Simulates ~4 days of a realistic user: news-heavy dwell time, a genuine
 * and reinforced interest in philosophy/stoicism content, and two
 * "hide similar" actions on election coverage. This is what a real user's
 * IndexedDB looks like after a few mornings — not what they see on screen
 * (that's utils/mock/newsFixtures.ts).
 *
 * Dev-only, hard-gated. Never runs against a real user's empty-but-real DB.
 */
export async function seedMockData() {
  if (!import.meta.dev) return
  const db = await useSomaticoDB()
  if ((await db.count('widget_analytics')) > 0) return

  const now = Date.now()
  const tx = db.transaction(['widget_analytics', 'keywords', 'session_opens'], 'readwrite')
  const analytics = tx.objectStore('widget_analytics')
  const keywords = tx.objectStore('keywords')
  const sessions = tx.objectStore('session_opens')

  // Day 1 — light, exploratory usage
  await analytics.add({ widgetId: 'news', dwellTimeMs: 45_000, idleTimeMs: 5_000, timestamp: now - 4 * DAY_MS })
  await keywords.add({ word: 'global economy', source: 'news', weight: 1, timestamp: now - 4 * DAY_MS })

  // Day 2 — engages with a philosophy piece, hides an election piece
  await analytics.add({ widgetId: 'news', dwellTimeMs: 90_000, idleTimeMs: 8_000, timestamp: now - 3 * DAY_MS })
  await keywords.add({ word: 'stoicism', source: 'news', weight: 1, timestamp: now - 3 * DAY_MS })
  await keywords.add({ word: 'philosophy', source: 'news', weight: 1, timestamp: now - 3 * DAY_MS })
  await keywords.add({ word: 'election', source: 'news', weight: -2, timestamp: now - 3 * DAY_MS })

  // Day 3 — the philosophy pattern reinforces itself
  await analytics.add({ widgetId: 'news', dwellTimeMs: 150_000, idleTimeMs: 6_000, timestamp: now - 2 * DAY_MS })
  await keywords.add({ word: 'marcus aurelius', source: 'news', weight: 1, timestamp: now - 2 * DAY_MS })
  await keywords.add({ word: 'philosophy', source: 'news', weight: 1, timestamp: now - 2 * DAY_MS })

  // Day 4 — heavy reading day, hides election coverage again
  await analytics.add({ widgetId: 'news', dwellTimeMs: 200_000, idleTimeMs: 4_000, timestamp: now - 1 * DAY_MS })
  await keywords.add({ word: 'election', source: 'news', weight: -2, timestamp: now - 1 * DAY_MS })

  // Session opens: consistent ~7am user across 4 days, weekdays only.
  // hour varies slightly (7:02, 7:15, 6:58, 7:22) to reflect realistic drift,
  // but the std dev is low — this produces a 'consistent-routine' tag.
  const sessionData = [
    { daysAgo: 4, hour: 7, minute: 2 },
    { daysAgo: 3, hour: 7, minute: 15 },
    { daysAgo: 2, hour: 6, minute: 58 },
    { daysAgo: 1, hour: 7, minute: 22 },
  ]
  for (const s of sessionData) {
    const d = new Date(now - s.daysAgo * DAY_MS)
    d.setHours(s.hour, s.minute, 0, 0)
    await sessions.add({ timestamp: d.getTime(), hour: d.getHours(), dayOfWeek: d.getDay() })
  }

  await tx.done
  console.log(
    'Dev seed loaded:\n' +
    '  News: 4-day news-heavy user, philosophy interest, election suppressed (-4 net)\n' +
    '  Sessions: 4 consistent ~7am opens → will produce [morning-user, consistent-routine]'
  )
}