import type { DomainIntentProfile } from '~~/types/widget-contract'

export interface UnlockedFeature {
  id: string
  targetDomain: string
  title: string
  description: string
}

interface IntegrationRule {
  id: string
  matches: (profiles: DomainIntentProfile[]) => boolean
  toFeature: (profiles: DomainIntentProfile[]) => UnlockedFeature
}

/**
 * Domain-specific "if X then unlock Y" logic lives here, and only here.
 * usePersonaEngine.ts loops over this array without knowing what any
 * individual rule checks for — add/remove rules without touching the engine.
 */
export const integrationRules: IntegrationRule[] = [
  {
    id: 'kindle_philosophy_sync',
    matches: (profiles) => {
      const news = profiles.find(p => p.domainId === 'news')
      return !!news?.canTriggerIntegrations && news.associatedTags.includes('philosophy')
    },
    toFeature: () => ({
      id: 'kindle_philosophy_sync',
      targetDomain: 'news',
      title: 'Link Philosophy Loggers',
      description: 'Sync your local reading footprint with your deep news consumption trends.',
    }),
  },
]