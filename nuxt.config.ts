import { defineNuxtConfig } from 'nuxt/config'
import { fileURLToPath } from 'url'

export default defineNuxtConfig({
  srcDir: '.',
  compatibilityDate: '2026-06-20',
  alias: {
    '~': fileURLToPath(new URL('./', import.meta.url)),
    '@': fileURLToPath(new URL('./', import.meta.url))
  },
  typescript: {
    tsConfig: {
      include: [
        "../components/**/*",
        "../pages/**/*",
        "../composables/**/*",
        "../layouts/**/*",
        "../**/*" // This forces TS to scan the entire root directory relative to .nuxt
      ]
    }
  }
})
