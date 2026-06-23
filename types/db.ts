import type { DBSchema } from 'idb'

/**
 * Every new widget that needs its own raw data adds a store here.
 * Bump DB_VERSION (see composables/useAppDB.ts) in the same PR as any change to this file,
 * and call it out in the PR description — the other dev's local DB needs to migrate too.
 */
export interface SomaticoDB extends DBSchema {
  widget_analytics: {
    key: number
    value: {
      id?: number
      widgetId: string      // must match the domainId used in that widget's contract response
      dwellTimeMs: number
      idleTimeMs: number
      timestamp: number
    }
    indexes: { by_widget: string; by_timestamp: number }
  }
  keywords: {
    key: number
    value: {
      id?: number
      word: string
      source: string
      weight: number         // +1 typical engagement, -2 "hide similar"
      timestamp: number
    }
    indexes: { by_source: string; by_timestamp: number }
  }
  session_opens: {
    key: number
    value: {
      id?: number
      timestamp: number
      hour: number           // 0-23, derived at write time for fast reads
      dayOfWeek: number      // 0-6, 0 = Sunday
    }
    indexes: { by_timestamp: number; by_hour: number }
  }
}