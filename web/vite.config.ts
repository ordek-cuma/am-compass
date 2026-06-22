import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    // Scrape control server (python3 -m competitor_ingest.server). Proxied so the
    // Competitor Data Room buttons can trigger crawls without CORS.
    proxy: { '/api': { target: 'http://127.0.0.1:8765', changeOrigin: true } },
  },
})
