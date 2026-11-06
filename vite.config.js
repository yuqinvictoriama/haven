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
        // Disguise: the installed app is a unit converter named "Convert" with a ruler icon.
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
        // Icon shortcuts must not give the app away, so they only open converter categories.
        // Direct capture links (/capture?mode=audio&auto=1) still work from a Back Tap / Quick Tap shortcut.
        shortcuts: [
          { name: 'Length', short_name: 'Length', url: '/?c=length', icons: [{ src: '/pwa-192.png', sizes: '192x192' }] },
          { name: 'Weight', short_name: 'Weight', url: '/?c=weight', icons: [{ src: '/pwa-192.png', sizes: '192x192' }] },
          { name: 'Temperature', short_name: 'Temp', url: '/?c=temperature', icons: [{ src: '/pwa-192.png', sizes: '192x192' }] },
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
