import type { IDBPDatabase } from 'idb'
import type { SomaticoDB } from '~~/types/db'
import type { DomainIntentProfile } from '~~/types/widget-contract'

// Needs more data than News to form a meaningful pattern — 7 days before confidence is earned.
// This is intentional: a single unusual morning shouldn't reclassify the user.
const RAMP_DAYS = 7

export async function getSessionTimingProfile(db: IDBPDatabase<SomaticoDB>): Promise<DomainIntentProfile> {
  const sessions = await db.getAll('session_opens')

  if (sessions.length === 0) {
    return { domainId: 'session_timing', intentWeight: 0, confidence: 0, associatedTags: [], canTriggerIntegrations: false }
  }

  const firstSeen = Math.min(...sessions.map(s => s.timestamp))
  const ageDays = (Date.now() - firstSeen) / 86_400_000
  const confidence = Math.min(1, ageDays / RAMP_DAYS) // smooth ramp over 7 days

  const hours = sessions.map(s => s.hour)
  const avgHour = hours.reduce((sum, h) => sum + h, 0) / hours.length

  // Standard deviation of open hours — lower = more consistent user
  const variance = hours.reduce((sum, h) => sum + Math.pow(h - avgHour, 2), 0) / hours.length
  const stdDev = Math.sqrt(variance)
  // A std dev of 6+ hours means completely random — maps to 0 consistency.
  const consistencyScore = Math.max(0, 1 - stdDev / 6)

  const tags: string[] = []

  // Time-of-day classification based on average open hour
  if (avgHour >= 5 && avgHour < 10) tags.push('morning-user')
  else if (avgHour >= 10 && avgHour < 14) tags.push('midday-user')
  else if (avgHour >= 14 && avgHour < 19) tags.push('afternoon-user')
  else tags.push('evening-user')

  // Routine strength — the clearest behavioral signal
  if (consistencyScore > 0.7) tags.push('consistent-routine')
  else if (consistencyScore < 0.3) tags.push('irregular-schedule')

  // Weekday vs weekend split
  const weekdayOpens = sessions.filter(s => s.dayOfWeek >= 1 && s.dayOfWeek <= 5).length
  const weekendOpens = sessions.filter(s => s.dayOfWeek === 0 || s.dayOfWeek === 6).length
  if (weekdayOpens > weekendOpens * 2.5) tags.push('weekday-heavy')
  else if (weekendOpens >= weekdayOpens) tags.push('weekend-active')

  // intentWeight = how clear the signal is — a rock-solid 7am user has high intent weight,
  // someone who opens at random times has low, even with lots of data.
  // This is different from News where intentWeight is about engagement depth.
  const intentWeight = consistencyScore * confidence

  return {
    domainId: 'session_timing',
    intentWeight,
    confidence,
    associatedTags: tags,
    // Requires both a fully-ramped confidence AND a clear enough pattern to be useful
    canTriggerIntegrations: confidence >= 1 && consistencyScore > 0.5,
  }
}