
export const ROUTES = {
  HOME: '/',
  GALLERY: '/galeria',
  STORIES: '/stories',
  MAP: '/mapa',
  SCHEDULE: '/programacao',
  RADIO: '/radio',
  VIDEOS: '/videos',
  HISTORY: '/historia',
  NEWS: '/noticias',
  PODCAST: '/podcast',
  COMPLETE_ROUTE: '/rota-completa',
  ROUTE: '/rota',
  CAMERAS: '/cameras',
  ABOUT: '/about',
  CONTACT: '/contact',
  SETTINGS: '/settings',
  MORE: '/mais',
  FAQ: '/faq',
  SAO_CRISTOVAO: '/sao-cristovao',
  MENU: '/menu',
  APOIO: '/apoio',
  VOCE_SABIA: '/vocesabia'
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RouteValue = typeof ROUTES[RouteKey];

export const NAVIGATION_ITEMS = [
  { key: 'HOME', label: 'Início', icon: 'Home' },
  { key: 'GALLERY', label: 'Galeria', icon: 'Camera' },
  { key: 'MAP', label: 'Mapa', icon: 'Map' },
  { key: 'SCHEDULE', label: 'Programação', icon: 'Calendar' },
  { key: 'MORE', label: 'Mais', icon: 'Menu' }
] as const;

export const EXTERNAL_ROUTES = {
  SOCIAL_FACEBOOK: 'https://facebook.com/festacaminhoneiro',
  SOCIAL_INSTAGRAM: 'https://instagram.com/festacaminhoneiro',
  SOCIAL_YOUTUBE: 'https://youtube.com/festacaminhoneiro',
  RADIO_STREAM: 'https://radio.festacaminhoneiro.com.br',
  LIVE_CHAT: 'https://chat.festacaminhoneiro.com.br'
} as const;
