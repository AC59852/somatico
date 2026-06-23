import { openDB, type IDBPDatabase } from 'idb'
import type { SomaticoDB } from '~~/types/db'

/**
 * Bump DB_VERSION whenever types/db.ts changes.
 * Add a new `if (oldVersion < N)` block below for each version —
 * never recreate stores that already exist in a prior version.
 *
 * Fresh installs (oldVersion = 0) fall through every block.
 * Existing installs only run the blocks they haven't seen yet.
 */
const DB_VERSION = 2

let dbPromise: Promise<IDBPDatabase<SomaticoDB>> | null = null

export function useSomaticoDB() {
  if (!dbPromise) {
    dbPromise = openDB<SomaticoDB>('HabitTrackerDB', DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const analytics = db.createObjectStore('widget_analytics', { keyPath: 'id', autoIncrement: true })
          analytics.createIndex('by_widget', 'widgetId')
          analytics.createIndex('by_timestamp', 'timestamp')

          const keywords = db.createObjectStore('keywords', { keyPath: 'id', autoIncrement: true })
          keywords.createIndex('by_source', 'source')
          keywords.createIndex('by_timestamp', 'timestamp')
        }

        if (oldVersion < 2) {
          const sessions = db.createObjectStore('session_opens', { keyPath: 'id', autoIncrement: true })
          sessions.createIndex('by_timestamp', 'timestamp')
          sessions.createIndex('by_hour', 'hour')
        }

        // Adding a new widget with its own store?
        // 1. Add a new `if (oldVersion < N)` block here
        // 2. Add the store definition to types/db.ts
        // 3. Bump DB_VERSION at the top of this file
        // 4. Do all three in the same PR — call it out in the description
      },
    })
  }
  return dbPromise
}