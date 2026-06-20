import { openDB, type IDBPDatabase } from 'idb'
import type { SomaticoDB } from '~/types/db'

const DB_VERSION = 1 // bump alongside any types/db.ts store/index change

let dbPromise: Promise<IDBPDatabase<SomaticoDB>> | null = null

/**
 * Universal — never edited when adding a new widget. Each widget's domain
 * controller calls this to get the same shared connection.
 */
export function useAppDB() {
  if (!dbPromise) {
    dbPromise = openDB<SomaticoDB>('HabitTrackerDB', DB_VERSION, {
      upgrade(db) {
        const analytics = db.createObjectStore('widget_analytics', { keyPath: 'id', autoIncrement: true })
        analytics.createIndex('by_widget', 'widgetId')
        analytics.createIndex('by_timestamp', 'timestamp')

        const keywords = db.createObjectStore('keywords', { keyPath: 'id', autoIncrement: true })
        keywords.createIndex('by_source', 'source')
        keywords.createIndex('by_timestamp', 'timestamp')

        // New widget needing its own store? Add it here, in the same PR as
        // the types/db.ts change, and bump DB_VERSION above.
      },
    })
  }
  return dbPromise
}