import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // new deploys update the installed app automatically
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Haven',
        short_name: 'Haven',
        description: 'Haven progressive web app',
        theme_color: '#1a1a2e',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          // TODO: swap for real 192x192 and 512x512 PNG icons before demo day
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        // never serve API calls from the service-worker cache
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  server: {
    // during `npm run dev`, forward /api/* to `vercel dev` running on :3000
    proxy: { '/api': 'http://localhost:3000' },
  },
})
