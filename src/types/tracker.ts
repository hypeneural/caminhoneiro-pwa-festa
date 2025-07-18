// Tipos baseados nos dados reais do endpoint Traccar
// https://hypeneural.com/caminhao/api.php

export type ActivityType = 
  | 'unknown'
  | 'still'
  | 'on_bicycle'
  | 'in_vehicle'
  | 'on_foot'
  | 'running'
  | 'automotive';

export interface TraccarAttributes {
  motion: boolean;
  odometer: number;          // em metros
  activity: ActivityType;
  batteryLevel: number;      // 0-100%
  distance: number;          // distância desde última posição em metros
  totalDistance: number;     // distância total acumulada em metros
}

export interface TraccarPosition {
  id: number;
  deviceId: number;
  protocol: string;          // 'osmand'
  
  // Timestamps (ISO strings)
  serverTime: string;
  deviceTime: string;
  fixTime: string;
  
  // Status flags
  outdated: boolean;
  valid: boolean;           // true = GPS confiável, false = rede/baixa precisão
  
  // Posicionamento
  latitude: number;
  longitude: number;
  altitude: number;         // em metros
  speed: number;           // em nós (knots)
  course: number;          // 0-360° (0 = norte)
  accuracy: number;        // raio de erro em metros
  
  // Dados contextuais
  address: string | null;
  network: unknown;
  geofenceIds: number[] | null;
  
  // Atributos estendidos
  attributes: TraccarAttributes;
}

export type TraccarResponse = TraccarPosition[];

// Estados derivados para UI
export type MovementState = 
  | 'stopped'        // motion: false, speed: 0
  | 'idle'          // motion: false, mas teve movimento recente
  | 'moving'        // motion: true, speed > threshold
  | 'unknown';      // dados insuficientes

export type ConnectionState = 
  | 'live'          // dados recentes e válidos
  | 'delayed'       // dados antigos mas válidos
  | 'offline'       // sem dados ou inválidos
  | 'error';        // erro na comunicação

export type BatteryState = 
  | 'critical'      // < 10%
  | 'low'          // 10-30%
  | 'normal'       // 30-70%
  | 'good'         // > 70%
  | 'unknown';     // sem dados

export type AccuracyLevel = 
  | 'excellent'     // < 5m
  | 'good'         // 5-15m
  | 'fair'         // 15-50m
  | 'poor'         // > 50m
  | 'unknown';     // sem dados

export interface MovementStatus {
  state: MovementState;
  label: string;
  description: string;
  color: string;
  textColor: string;
  icon: string;
  animate: boolean;
}

export interface ConnectionStatus {
  state: ConnectionState;
  label: string;
  description: string;
  color: string;
  textColor: string;
  icon: string;
  lastUpdate: string;
  isRealtime: boolean;
}

export interface BatteryStatus {
  state: BatteryState;
  level: number;
  label: string;
  color: string;
  icon: string;
  showWarning: boolean;
}

export interface ActivityStatus {
  type: ActivityType;
  label: string;
  description: string;
  icon: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface AccuracyStatus {
  level: AccuracyLevel;
  value: number;
  label: string;
  description: string;
  color: string;
  showWarning: boolean;
}

// Interface para dados processados (UI-ready)
export interface ProcessedTrackerData extends TraccarPosition {
  // Conversões úteis
  speedKmh: number;
  totalDistanceKm: number;
  distanceKm: number;
  
  // Estados derivados
  movementStatus: MovementStatus;
  connectionStatus: ConnectionStatus;
  batteryStatus: BatteryStatus;
  activityStatus: ActivityStatus;
  accuracyStatus: AccuracyStatus;
  
  // Timing
  lastUpdateRelative: string;
  isRealtime: boolean;
  dataAge: number; // em segundos
  
  // Geolocalização
  hasValidGPS: boolean;
  coordinatesText: string;
  
  // Contexto
  isInMotion: boolean;
  isStationary: boolean;
  needsAttention: boolean; // bateria baixa, sem GPS, etc.
}

// Configurações de validação
export interface ValidationConfig {
  maxAccuracy: number;    // metros
  maxAge: number;        // milliseconds
  minSpeedThreshold: number; // nós
}

// Interface para cache
export interface CachedTrackerData {
  data: TraccarPosition;
  timestamp: number;
  ttl: number;
  priority: 'high' | 'medium' | 'low';
  networkLatency?: number;
}

// Configurações de polling
export interface PollingConfig {
  interval: number;
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
}

// Interface para métricas de performance
export interface TrackerMetrics {
  requestCount: number;
  errorCount: number;
  averageLatency: number;
  lastSuccessfulUpdate: number;
  cacheHitRate: number;
}

export interface TrackerError {
  type: 'network' | 'validation' | 'timeout' | 'server' | 'unknown';
  message: string;
  code?: number;
  timestamp: number;
  retryable: boolean;
} 