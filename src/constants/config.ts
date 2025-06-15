export const APP_CONFIG = {
  // API Configuration
  API: {
    BASE_URL: import.meta.env.VITE_API_URL || 'https://api.festacaminhoneiro.com.br',
    TIMEOUT: 10000,
    RETRIES: 3,
    RETRY_DELAY: 1000
  },
  
  // Cache Configuration
  CACHE: {
    TTL: 5 * 60 * 1000, // 5 minutes
    MAX_SIZE: 100,
    STRATEGY: 'lru' as const
  },
  
  // Pagination
  PAGINATION: {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    NEWS_LIMIT: 10,
    PHOTOS_LIMIT: 24,
    CAMERAS_LIMIT: 12
  },
  
  // Media Settings
  MEDIA: {
    IMAGE_QUALITY: 80,
    THUMBNAIL_SIZE: 256,
    LAZY_LOAD_THRESHOLD: '200px',
    VIDEO_AUTOPLAY: false,
    STREAM_BUFFER: 30000 // 30 seconds
  },
  
  // Refresh Intervals (in milliseconds)
  REFRESH_INTERVALS: {
    NEWS: 5 * 60 * 1000, // 5 minutes
    CAMERAS: 10 * 1000, // 10 seconds
    TRACKER: 30 * 1000, // 30 seconds
    STORIES: 60 * 1000, // 1 minute
    WEATHER: 15 * 60 * 1000 // 15 minutes
  },
  
  // Animation Settings
  ANIMATION: {
    DURATION: {
      FAST: 200,
      NORMAL: 300,
      SLOW: 500
    },
    EASING: 'cubic-bezier(0.4, 0, 0.2, 1)',
    STAGGER_DELAY: 100
  },
  
  // Event Information
  EVENT: {
    NAME: 'Festa do Caminhoneiro 2025',
    START_DATE: new Date('2025-07-25T08:00:00'),
    END_DATE: new Date('2025-07-26T22:00:00'),
    LOCATION: 'Praça Central',
    COORDINATES: {
      lat: -23.5505,
      lng: -46.6333
    },
    TIMEZONE: 'America/Sao_Paulo'
  },
  
  // Social Media
  SOCIAL: {
    FACEBOOK: 'https://facebook.com/festacaminhoneiro',
    INSTAGRAM: 'https://instagram.com/festacaminhoneiro',
    YOUTUBE: 'https://youtube.com/festacaminhoneiro',
    WHATSAPP: 'https://wa.me/5511999999999'
  },
  
  // Feature Flags
  FEATURES: {
    ENABLE_ANALYTICS: true,
    ENABLE_PWA: true,
    ENABLE_OFFLINE_MODE: true,
    ENABLE_PUSH_NOTIFICATIONS: true,
    ENABLE_DARK_MODE: true,
    ENABLE_STORIES: true,
    ENABLE_LIVE_CHAT: false,
    ENABLE_DONATIONS: false
  },
  
  // Local Storage Keys
  STORAGE_KEYS: {
    FAVORITES: 'festa_favorites',
    PREFERENCES: 'festa_preferences',
    CACHE: 'festa_cache',
    LAST_VISIT: 'festa_last_visit',
    THEME: 'festa_theme'
  },
  
  // Performance Settings
  PERFORMANCE: {
    ENABLE_SERVICE_WORKER: true,
    PRELOAD_IMAGES: true,
    OPTIMIZE_ANIMATIONS: true,
    DEBOUNCE_SEARCH: 300,
    THROTTLE_SCROLL: 16
  }
} as const;

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536
} as const;

export const DEVICE_TYPES = {
  MOBILE: 'mobile',
  TABLET: 'tablet',
  DESKTOP: 'desktop'
} as const;