import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon-*.png', 'audio/**/*'],
        manifest: {
          name: 'BUGSMASHER — Tactical QA System',
          short_name: 'BUGSMASHER',
          description: 'Defend the core. Smash the swarm. Brutalist OS vs bio-luminescent bugs.',
          start_url: '/',
          display: 'standalone',
          background_color: '#050505',
          theme_color: '#050505',
          orientation: 'any',
          icons: [
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,jpg,png,wav}'],
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.destination === 'audio',
              handler: 'CacheFirst',
              options: {
                cacheName: 'audio-cache',
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
        },
      }),
    ],
    define: {
      'process.env': '{}',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      // Temporary raised per audit bundle work; TODO: full lazy Firebase to drop below 500kB warning.
      // See firebase.ts for lazy getter.
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              // Keep ONLY libraries with clean one-way dependency edges in
              // their own chunks. Everything else (react, react-dom, scheduler,
              // motion, recharts, @firebase/*, @google/*) merges into a single
              // 'vendor' chunk: these packages import each other in cycles
              // (react <-> scheduler, vendor recharts -> react, motion <->
              // other libs), and splitting them across chunks produced circular
              // chunk dependencies that crashed the page at module-eval time
              // with 'Cannot read properties of undefined (forwardRef)' and
              // 'Cannot access ... before initialization'. A single vendor
              // chunk lets Rollup hoist intra-chunk cycles safely.
              if (id.includes('/firebase/')) return 'firebase';
              if (id.includes('/lucide-react/')) return 'icons';
              return 'vendor';
            }
            // Future: split heavy game/ UI if desired (e.g. if (id.includes('game/rendering')) return 'rendering';)
            return undefined; // explicit for all paths
          },
        },
      },
    },
  };
});
