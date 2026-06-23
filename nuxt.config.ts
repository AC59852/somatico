import { defineNuxtConfig } from 'nuxt/config'
import { fileURLToPath } from 'url'

export default defineNuxtConfig({
  compatibilityDate: '2026-06-20',
  typescript: {
    tsConfig: {
      include: [
       "../composables/**/*",
        "../types/**/*",
        "../utils/**/*"
      ]
    }
  }
})
