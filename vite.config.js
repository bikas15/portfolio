import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { workbenchBackend } from './server/workbench-api.mjs'

export default defineConfig({
  base: './',
  plugins: [react(), workbenchBackend()],
  server: {
    fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.workbench/**'] },
  },
  build: {
    rollupOptions: {
      input: { portfolio: 'index.html', desk: 'bikas-desk/index.html' },
    },
  },
})
