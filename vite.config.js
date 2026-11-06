import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // new deploys update the installed app automatically
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icon.svg'],
      manifest: {
        id: '/',
        // Disguise: only the home-screen identity (name + ruler icon) looks like a unit converter.
        // Opening the app goes straight into Haven.
        name: 'Convert',
        short_name: 'Convert',
        description: 'Quick unit converter for length, weight, temperature, and volume.',
        theme_color: '#faf7ee',
        background_color: '#faf7ee',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'en',
        categories: ['utilities'],
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        // Long-press shortcuts (Android) open Haven's capture screens directly.
        shortcuts: [
          { name: 'Record audio', short_name: 'Record', url: '/capture?mode=audio&auto=1', icons: [{ src: '/pwa-192.png', sizes: '192x192' }] },
          { name: 'Take photo', short_name: 'Photo', url: '/capture?mode=photo', icons: [{ src: '/pwa-192.png', sizes: '192x192' }] },
          { name: 'New note', short_name: 'Note', url: '/capture?mode=note', icons: [{ src: '/pwa-192.png', sizes: '192x192' }] },
        ],
        // Share text from another app (Android/Chrome) straight into Analyze.
        share_target: { action: '/share', method: 'GET', params: { title: 'title', text: 'text', url: 'url' } },
      },
      workbox: {
        // never serve API calls from the service-worker cache
        navigateFallbackDenylist: [/^\/api\//],
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
      },
    }),
  ],
  server: {
    // during `npm run dev`, forward /api/* to `vercel dev` running on :3000
    proxy: { '/api': 'http://localhost:3000' },
  },
})
