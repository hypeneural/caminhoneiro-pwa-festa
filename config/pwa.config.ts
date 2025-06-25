
import type { VitePWAOptions } from 'vite-plugin-pwa';

export const pwaConfig: Partial<VitePWAOptions> = {
  registerType: 'prompt',
  injectRegister: 'auto',
  minify: true,
  includeManifestIcons: true,
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}'],
    cleanupOutdatedCaches: true,
    skipWaiting: true,
    clientsClaim: true,
    maximumFileSizeToCacheInBytes: 5000000, // 5MB
    runtimeCaching: [
      // HTML pages - Network First with offline fallback
      {
        urlPattern: ({ request }) => request.mode === 'navigate',
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pages-cache',
          networkTimeoutSeconds: 3,
        },
      },
      // API Cache - Network First com fallback offline robusto
      {
        urlPattern: /^https:\/\/api\.festadocaminhoneiro\.com\.br\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          networkTimeoutSeconds: 5,
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 2, // 2 days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // Poll API - NetworkFirst strategy
      {
        urlPattern: /\/poll\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'poll-cache',
          networkTimeoutSeconds: 3,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24, // 1 day
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // Imagens - Cache First otimizado
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images-cache',
          expiration: {
            maxEntries: 300,
            maxAgeSeconds: 60 * 60 * 24 * 60, // 60 days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // CSS/JS - Stale While Revalidate para performance
      {
        urlPattern: /\.(?:js|css)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-resources',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
        },
      },
      // Fontes - Cache First longo
      {
        urlPattern: /\.(?:woff|woff2|ttf|eot)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'fonts-cache',
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
        },
      },
      // Google Fonts CSS
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'google-fonts-stylesheets',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
        },
      },
      // Google Fonts arquivos
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-webfonts',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
        },
      },
      // CDN Assets externos
      {
        urlPattern: /^https:\/\/cdn\./i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'cdn-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 14, // 14 days
          },
        },
      },
    ],
    // Configuração offline robusta
    navigateFallback: '/index.html',
    navigateFallbackDenylist: [
      /^\/_/,
      /\/[^/?]+\.[^/]+$/,
      /^\/api\//,
      /\/manifest\.json$/,
    ],
    // Pre-cache apenas da rota principal
    additionalManifestEntries: [
      { url: '/', revision: Date.now().toString() },
      { url: '/index.html', revision: Date.now().toString() },
      { url: '/#poll', revision: Date.now().toString() },
    ],
  },
  includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
  manifestFilename: 'manifest.json',
  manifest: {
    name: 'Festa do Caminhoneiro',
    short_name: 'Caminhoneiro',
    description: 'App oficial da Festa do Caminhoneiro',
    theme_color: '#1e40af',
    background_color: '#ffffff',
    display: 'standalone',
    start_url: '/',
    shortcuts: [
      {
        name: 'Votar na Enquete',
        short_name: 'Enquete',
        description: 'Participar da enquete da festa',
        url: '/#poll',
        icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
      }
    ]
  },
  devOptions: {
    enabled: true,
    type: 'module',
    navigateFallback: 'index.html',
  },
};
