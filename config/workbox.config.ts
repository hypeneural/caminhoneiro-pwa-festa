import { GenerateSWOptions } from 'workbox-webpack-plugin';

export const workboxConfig: Partial<GenerateSWOptions> = {
  runtimeCaching: [
    // GeoJSON files caching
    {
      urlPattern: ({ url }) => url.pathname.endsWith('.geojson'),
      handler: 'CacheFirst',
      options: {
        cacheName: 'geojson-cache',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
        },
      },
    },
    // OpenStreetMap tiles caching
    {
      urlPattern: ({ url }) => url.hostname.includes('tile.openstreetmap.org'),
      handler: 'CacheFirst',
      options: {
        cacheName: 'osm-tiles',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    // Live tracking data must never be served from cache.
    {
      urlPattern: ({ url }) => url.hostname === 'live.festadoscaminhoneiros.com.br',
      handler: 'NetworkOnly',
      options: {
        cacheName: 'live-tracking-network-only',
      },
    },
  ],
};
