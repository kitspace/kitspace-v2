import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), viteTsConfigPaths()],
  test: {
    environment: 'jsdom',
    dir: 'test',
    setupFiles: ['./vitest.setup.ts'],
  },
})
