import { useSomaticoDB } from './useSomaticoDB'
import { getNewsIntentProfile } from '~~/utils/domains/news'
import { getSessionTimingProfile } from '~~/utils/domains/sessionTiming'
import { integrationRules, type UnlockedFeature } from '~~/utils/integrationRules'
import type { DomainIntentProfile, DomainAnalyzer } from '~~/types/widget-contract'

// The ONLY edit a new widget makes to this file: add its analyzer here.
const domainAnalyzers: DomainAnalyzer[] = [
  getNewsIntentProfile,
  getSessionTimingProfile,
]

export const usePersonaEngine = () => {
  const domainProfiles = useState<DomainIntentProfile[]>('domainProfiles', () => [])
  const unlockedFeatures = useState<UnlockedFeature[]>('unlockedFeatures', () => [])

  const evaluate = async () => {
    if (!import.meta.client) return
    const db = await useSomaticoDB()
    const profiles = await Promise.all(domainAnalyzers.map(fn => fn(db)))
    domainProfiles.value = profiles
    unlockedFeatures.value = integrationRules
      .filter(rule => rule.matches(profiles))
      .map(rule => rule.toFeature(profiles))
  }

  return { domainProfiles, unlockedFeatures, evaluate }
}