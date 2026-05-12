import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Keep Vite cache out of node_modules (Railpack/npm ci can hit EBUSY on node_modules/.vite).
const cacheDir = join(tmpdir(), 'vite-cache-credential-dojo')

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
  cacheDir,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: [
        'favicon.svg',
        'credential-dojo.png',
        'pwa-192.png',
        'pwa-512.png',
        'pwa-180.png',
        'og-image.png',
      ],
      manifest: {
        id: '/',
        name: 'Credential Dojo',
        short_name: 'Dojo',
        description:
          'CRMS for W3C Verifiable Credentials — Tehon, Menkyo, Enbu, Tejun, Kensa, Randori, Kinchaku, Kata.',
        lang: 'en',
        dir: 'ltr',
        scope: '/',
        start_url: '/',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui', 'browser'],
        orientation: 'any',
        background_color: '#070910',
        theme_color: '#070910',
        categories: ['education', 'productivity', 'finance'],
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    proxy: apiProxy,
  },
  preview: {
    // Host/port also set via CLI in `npm run start` (Railway sets PORT).
    host: true,
    proxy: apiProxy,
  },
})
