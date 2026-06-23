import type { IDBPDatabase } from 'idb'
import type { SomaticoDB } from '~~/types/db'
import type { DomainIntentProfile } from '~~/types/widget-contract'
import { useSomaticoDB } from '~~/composables/useSomaticoDB'

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
  const confidence = Math.min(1, ageDays / RAMP_DAYS) // smooth ramp, not a day-3 switch

  const totalDwell = events.reduce((sum, e) => sum + e.dwellTimeMs, 0)
  const intentWeight = Math.min(1, totalDwell / HEAVY_DWELL_MS) * confidence // muted until confidence is earned

  const keywords = await db.getAllFromIndex('keywords', 'by_source', 'news')
  const netWeightByWord = new Map<string, number>()
  for (const k of keywords) {
    netWeightByWord.set(k.word, (netWeightByWord.get(k.word) ?? 0) + k.weight)
  }
  // only words with positive NET signal count as an interest — a hidden
  // topic that was glanced at once before stays suppressed, not just diluted
  const associatedTags = [...netWeightByWord.entries()]
    .filter(([, weight]) => weight > 0)
    .map(([word]) => word)

  return {
    domainId: 'news',
    intentWeight,
    confidence,
    associatedTags,
    canTriggerIntegrations: confidence >= 1,
  }
}

/**
 * Write-side counterpart. Any News UI calls this on read/click (+1) or
 * "Hide similar" (-2). Lives here, not in a shared composable — News owns
 * both reading and writing its own slice of the keywords store.
 */
export async function recordKeywordEvent(tokens: string[], weight: number) {
  const db = await useSomaticoDB()
  const tx = db.transaction('keywords', 'readwrite')
  for (const word of tokens) {
    await tx.store.add({ word: word.toLowerCase(), source: 'news', weight, timestamp: Date.now() })
  }
  await tx.done
}