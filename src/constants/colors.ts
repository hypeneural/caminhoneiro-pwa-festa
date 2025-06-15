export const THEME_COLORS = {
  // Trucker Brand Colors
  TRUCKER_BLUE: 'trucker-blue',
  TRUCKER_GREEN: 'trucker-green',
  TRUCKER_RED: 'trucker-red',
  TRUCKER_ORANGE: 'trucker-orange',
  TRUCKER_YELLOW: 'trucker-yellow',
  
  // Trucker Foreground Colors
  TRUCKER_BLUE_FOREGROUND: 'trucker-blue-foreground',
  TRUCKER_GREEN_FOREGROUND: 'trucker-green-foreground',
  TRUCKER_RED_FOREGROUND: 'trucker-red-foreground',
  TRUCKER_ORANGE_FOREGROUND: 'trucker-orange-foreground',
  
  // Semantic Colors
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  ACCENT: 'accent',
  DESTRUCTIVE: 'destructive',
  
  // Background Colors
  BACKGROUND: 'background',
  FOREGROUND: 'foreground',
  CARD: 'card',
  CARD_FOREGROUND: 'card-foreground',
  POPOVER: 'popover',
  POPOVER_FOREGROUND: 'popover-foreground',
  
  // Muted Colors
  MUTED: 'muted',
  MUTED_FOREGROUND: 'muted-foreground',
  
  // Border Colors
  BORDER: 'border',
  INPUT: 'input',
  RING: 'ring'
} as const;

export const STATUS_COLORS = {
  SUCCESS: 'text-trucker-green bg-trucker-green/10',
  WARNING: 'text-trucker-orange bg-trucker-orange/10',
  ERROR: 'text-trucker-red bg-trucker-red/10',
  INFO: 'text-trucker-blue bg-trucker-blue/10',
  LIVE: 'text-trucker-red bg-trucker-red animate-pulse',
  OFFLINE: 'text-muted-foreground bg-muted'
} as const;

export const CATEGORY_COLORS = {
  INSCRICOES: 'bg-trucker-green text-trucker-green-foreground',
  PROGRAMACAO: 'bg-trucker-orange text-trucker-orange-foreground',
  RELIGIOSO: 'bg-trucker-blue text-trucker-blue-foreground',
  EVENTO: 'bg-trucker-red text-trucker-red-foreground',
  ENTRETENIMENTO: 'bg-purple-600 text-white',
  GERAL: 'bg-muted text-muted-foreground'
} as const;

export const GRADIENT_BACKGROUNDS = {
  PRIMARY: 'bg-gradient-to-r from-trucker-blue to-trucker-green',
  SECONDARY: 'bg-gradient-to-r from-trucker-red to-trucker-orange',
  ACCENT: 'bg-gradient-to-r from-purple-600 to-pink-600',
  SUBTLE: 'bg-gradient-to-r from-muted to-card'
} as const;