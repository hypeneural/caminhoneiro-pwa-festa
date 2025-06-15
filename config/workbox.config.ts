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
    // External API caching (hypeneural.com)
    {
      urlPattern: ({ url }) => url.hostname === 'hypeneural.com',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24, // 1 day
        },
      },
    },
  ],
};