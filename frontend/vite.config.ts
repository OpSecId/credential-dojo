import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Local dev: backend on 3001. Railway / preview: set API_PROXY_TARGET (or VITE_API_PROXY_TARGET)
// to your API public URL so same-origin /api can be proxied when VITE_API_BASE is unset.
const apiProxyTarget =
  process.env.VITE_API_PROXY_TARGET ??
  process.env.API_PROXY_TARGET ??
  'http://127.0.0.1:3001'

const apiProxy = {
  '/api': {
    target: apiProxyTarget,
    changeOrigin: true,
  },
} as const

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: apiProxy,
  },
  preview: {
    // Host/port also set via CLI in `npm run start` (Railway sets PORT).
    host: true,
    proxy: apiProxy,
  },
})
