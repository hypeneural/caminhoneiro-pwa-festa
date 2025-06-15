import type { VitePWAOptions } from 'vite-plugin-pwa';

export const pwaConfig: Partial<VitePWAOptions> = {
  registerType: 'autoUpdate',
  injectRegister: 'auto',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}'],
    cleanupOutdatedCaches: true,
    skipWaiting: true,
    clientsClaim: true,
    maximumFileSizeToCacheInBytes: 5000000, // 5MB
    runtimeCaching: [
      // HTML pages - Network First with offline fallback
      {
        urlPattern: ({ request }: any) => request.mode === 'navigate',
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
    // Pre-cache de rotas críticas
    additionalManifestEntries: [
      { url: '/', revision: Date.now().toString() },
      { url: '/galeria', revision: Date.now().toString() },
      { url: '/mapa', revision: Date.now().toString() },
      { url: '/programacao', revision: Date.now().toString() },
      { url: '/radio', revision: Date.now().toString() },
      { url: '/videos', revision: Date.now().toString() },
      { url: '/historia', revision: Date.now().toString() },
      { url: '/noticias', revision: Date.now().toString() },
      { url: '/mais', revision: Date.now().toString() },
    ],
  },
  includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
  manifestFilename: 'manifest.json',
  devOptions: {
    enabled: true,
    type: 'module',
    navigateFallback: 'index.html',
  },
};