export const API = {
  BASE_URL: 'https://api.festadoscaminhoneiros.com.br/v1',
  
  ENDPOINTS: {
    BANNERS: '/advertisements/banners',
    SPONSORS: '/advertisements/sponsors',
    NOTIFICATIONS: {
      LIST: '/notifications',
      MARK_READ: (id: number) => `/notifications/${id}/read`,
      MARK_ALL_READ: '/notifications/read-all'
    },
    ANALYTICS: {
      BANNER_CLICK: '/analytics/banner-click',
      SPONSOR_CLICK: '/analytics/sponsor-click'
    }
  },

  POSITION_GROUPS: {
    HOME: 'home',
    SIDEBAR: 'sidebar',
    FOOTER: 'footer'
  },

  PACKAGE_TYPES: {
    DESTAQUE: 1,
    APOIADOR: 2
  },

  DEFAULTS: {
    BANNERS_LIMIT: 15,
    SPONSORS_LIMIT: 12,
    PAGE: 1,
    NOTIFICATION_POLL_INTERVAL: 60000 // 1 minuto
  },

  CACHE: {
    STALE_TIME: 5 * 60 * 1000, // 5 minutos
    CACHE_TIME: 10 * 60 * 1000 // 10 minutos
  },

  // Configurações de desenvolvimento
  DEV: {
    BASE_URL: 'http://localhost:8080/v1'
  }
}; 