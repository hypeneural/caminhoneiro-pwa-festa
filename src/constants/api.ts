const DEFAULT_TRACKING_GATEWAY_URL = import.meta.env.DEV
  ? 'http://localhost:3000'
  : 'https://live.evydencia.com';

export const API = {
  BASE_URL: import.meta.env.VITE_API_URL || 'https://api.festadoscaminhoneiros.com.br/v1',
  
  ENDPOINTS: {
    BANNERS: '/advertisements/banners',
    SPONSORS: '/advertisements/sponsors',
    WEATHER: '/weather',
    NOTIFICATIONS: {
      LIST: '/notifications'
    },
    ANALYTICS: {
      BANNER_CLICK: '/analytics/banner-click',
      SPONSOR_CLICK: '/analytics/sponsor-click'
    }
  },

  // Configurações do sistema Traccar
  TRACCAR: {
    ENABLED: import.meta.env.VITE_TRACCAR_ENABLED === 'true',
    BASE_URL: (
      import.meta.env.VITE_TRACKING_GATEWAY_URL ||
      import.meta.env.VITE_LIVE_TRACKING_URL ||
      import.meta.env.VITE_TRACCAR_URL ||
      DEFAULT_TRACKING_GATEWAY_URL
    ).replace(/\/+$/, ''),
    ENDPOINTS: {
      POSITIONS: '/public/state',
      STREAM: '/public/stream',
      VEHICLES: '/public/vehicles',
      WEBSOCKET: '/ws'
    },
    POLLING: {
      REALTIME: 5000,        // 5s para dados críticos (app em foco)
      BACKGROUND: 10000,     // 10s em background
      OFFLINE: 30000,        // 30s quando offline
      SLOW_CONNECTION: 15000 // 15s para conexões lentas
    },
    RETRY: {
      ATTEMPTS: 3,
      DELAY_BASE: 1000,      // 1s
      MAX_DELAY: 10000,      // 10s
      BACKOFF_FACTOR: 2
    },
    VALIDATION: {
      MAX_ACCURACY: 100,     // máx 100m de precisão
      MAX_AGE: 300000,       // máx 5min de idade
      MIN_SPEED_THRESHOLD: 1 // mín 1 nó para considerar movimento
    }
  },

  POSITION_GROUPS: {
    HOME: 'home',
    SIDEBAR: 'sidebar',
    FOOTER: 'footer'
  },

  DEFAULTS: {
    BANNERS_LIMIT: 15,
    SPONSORS_LIMIT: 1000,
    PAGE: 1,
    NOTIFICATION_POLL_INTERVAL: 60000 // 1 minuto
  },

  CACHE: {
    STALE_TIME: 5 * 60 * 1000, // 5 minutos
    CACHE_TIME: 10 * 60 * 1000, // 10 minutos
    WEATHER_STALE_TIME: 6 * 60 * 60 * 1000, // 6 horas
    WEATHER_CACHE_TIME: 12 * 60 * 60 * 1000, // 12 horas
    
    // Cache específico para tracking
    TRACKER_STALE_TIME: 3 * 1000,      // 3 segundos
    TRACKER_CACHE_TIME: 30 * 1000,     // 30 segundos
    GEOFENCE_CACHE_TIME: 60 * 60 * 1000, // 1 hora
    ROUTE_CACHE_TIME: 24 * 60 * 60 * 1000 // 24 horas
  },

  // Configurações de desenvolvimento
  DEV: {
    BASE_URL: 'http://localhost:8080/v1'
  }
};