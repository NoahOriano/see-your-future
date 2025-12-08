import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite dev server config
// - Frontend runs on http://localhost:5173 (npm run dev)
// - API routes are served by `vercel dev` on http://localhost:3000
// - During dev, calls to `/api/*` from the browser at 5173 are proxied to 3000

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
