import type { IDBPDatabase } from 'idb'
import type { SomaticoDB } from '~/types/db'
import type { DomainIntentProfile } from '~/types/widget-contract'

const RAMP_DAYS = 3
const HEAVY_DWELL_MS = 300_000 // 5 minutes cumulative dwell = "heavy" usage

/**
 * Reference implementation of DomainAnalyzer. Use this as the template for
 * every future widget's controller — the shape of this function (read own
 * domain's data, scope confidence to own domain's age, return the contract
 * shape) is what's universal, not this specific logic.
 */
export async function getNewsIntentProfile(db: IDBPDatabase<SomaticoDB>): Promise<DomainIntentProfile> {
  const events = await db.getAllFromIndex('widget_analytics', 'by_widget', 'news')

  if (events.length === 0) {
    return { domainId: 'news', intentWeight: 0, confidence: 0, associatedTags: [], canTriggerIntegrations: false }
  }

  // scoped to news's OWN first event — not a global app-wide clock
  const firstSeen = Math.min(...events.map(e => e.timestamp))
  const ageDays = (Date.now() - firstSeen) / 86_400_000
  const confidence = Math.max(0, Math.min(1, ageDays / RAMP_DAYS)) // smooth ramp, bounded [0,1]

  const totalDwell = events.reduce((sum, e) => sum + e.dwellTimeMs, 0)
  const dwellRatio = Math.max(0, Math.min(1, totalDwell / HEAVY_DWELL_MS))
  const intentWeight = dwellRatio * confidence // muted until confidence is earned

  const keywords = await db.getAllFromIndex('keywords', 'by_source', 'news')
  const associatedTags = [...new Set(keywords.map(k => k.word.toLowerCase()))]

  return {
    domainId: 'news',
    intentWeight,
    confidence,
    associatedTags,
    canTriggerIntegrations: confidence >= 1,
  }
}