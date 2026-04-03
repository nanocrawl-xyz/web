import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Each test file gets its own isolated module registry —
    // critical for payments-store.ts which holds a module-level singleton.
    isolate: true,
  },
})
