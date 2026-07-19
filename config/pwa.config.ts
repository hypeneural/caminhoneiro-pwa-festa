
import type { VitePWAOptions } from 'vite-plugin-pwa';

export const pwaConfig: Partial<VitePWAOptions> = {
  registerType: 'prompt',
  injectRegister: 'auto',
  minify: true,
  includeManifestIcons: true,
  workbox: {
    globPatterns: ['**/*.{js,css,html,woff,woff2}'],
    cleanupOutdatedCaches: true,
    skipWaiting: true,
    clientsClaim: true,
    maximumFileSizeToCacheInBytes: 600000,
    runtimeCaching: [
      {
        urlPattern: ({ url }) => (
          url.hostname === 'live.festadoscaminhoneiros.com.br' ||
          (url.hostname === 'localhost' && url.port === '3000') ||
          (url.hostname === '127.0.0.1' && url.port === '3000')
        ) && (
          url.pathname.startsWith('/public/') ||
          url.pathname === '/ws'
        ),
        handler: 'NetworkOnly',
        options: {
          cacheName: 'live-tracking-network-only'
        },
      },
      // HTML pages - Network First with offline fallback
      {
        urlPattern: ({ request }) => request.mode === 'navigate',
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pages-cache',
          networkTimeoutSeconds: 3,
        },
      },
      // API da producao - sempre rede para evitar dados operacionais obsoletos
      {
        urlPattern: /^https:\/\/api\.festadoscaminhoneiros\.com\.br\/.*/i,
        handler: 'NetworkOnly',
        options: {
          cacheName: 'api-network-only',
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
    // SPA routes use navigateFallback. Do not add index.html manually here:
    // Workbox already precaches it from globPatterns, and duplicate revisions
    // trigger add-to-cache-list-conflicting-entries in production.
  },
  includeAssets: [
    'favicon.ico',
    'pwa-64x64.png',
    'pwa-192x192.png',
    'pwa-512x512.png',
    'pwa-maskable-512x512.png',
    'assets/images/programacao/sao-cristovao-2026.png',
    'shortcuts/*.png'
  ],
  manifestFilename: 'manifest.json',
  manifest: {
    id: '/',
    name: 'Festa do Caminhoneiro - São Cristóvão 2026',
    short_name: 'Caminhoneiro 2026',
    description: 'PWA oficial da XXII Festa de São Cristóvão de Tijucas/SC',
    theme_color: '#1e3a8a',
    background_color: '#ffffff',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'portrait-primary',
    scope: '/',
    start_url: '/?utm_source=pwa',
    lang: 'pt-BR',
    dir: 'ltr',
    categories: ['entertainment', 'lifestyle', 'travel'],
    icons: [
      {
        src: 'pwa-64x64.png',
        sizes: '64x64',
        type: 'image/png'
      },
      {
        src: 'pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: 'pwa-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
    shortcuts: [
      {
        name: 'Programação 2026',
        short_name: 'Agenda',
        description: 'Veja a programação completa da festa',
        url: '/programacao',
        icons: [{ src: '/shortcuts/schedule.png', sizes: '96x96', type: 'image/png' }]
      },
      {
        name: 'Rota da Procissão',
        short_name: 'Rota',
        description: 'Acompanhe a rota da procissão automotiva',
        url: '/rota-completa',
        icons: [{ src: '/shortcuts/route.png', sizes: '96x96', type: 'image/png' }]
      },
      {
        name: 'Cardápio',
        short_name: 'Cardápio',
        description: 'Veja as opções de bar e cozinha',
        url: '/menu',
        icons: [{ src: '/shortcuts/menu.png', sizes: '96x96', type: 'image/png' }]
      },
      {
        name: 'Contato Capela',
        short_name: 'Contato',
        description: 'Encontre canais de contato da organização',
        url: '/contact',
        icons: [{ src: '/shortcuts/contact.png', sizes: '96x96', type: 'image/png' }]
      }
    ]
  },
  devOptions: {
    enabled: true,
    type: 'module',
    navigateFallback: 'index.html',
  },
};
