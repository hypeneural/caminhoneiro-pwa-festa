import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type {
  TraccarPosition,
  ProcessedTrackerData,
  MovementStatus,
  ConnectionStatus,
  BatteryStatus,
  ActivityStatus,
  AccuracyStatus,
  MovementState,
  ConnectionState,
  BatteryState,
  AccuracyLevel,
  ActivityType
} from '@/types/tracker';
import { API } from '@/constants/api';

// Conversões básicas
export const convertKnotsToKmh = (knots: number): number => {
  return Math.round(knots * 1.852);
};

export const convertMetersToKm = (meters: number): number => {
  return Number((meters / 1000).toFixed(1));
};

// Validação de coordenadas
export const isValidCoordinate = (lat: number, lng: number): boolean => {
  return !isNaN(lat) && !isNaN(lng) && 
         lat >= -90 && lat <= 90 && 
         lng >= -180 && lng <= 180;
};

// Validação de timestamp
export const isValidTimestamp = (timestamp: string): boolean => {
  const date = new Date(timestamp);
  return !isNaN(date.getTime()) && date.getTime() > 0;
};

// Verificação se dados são em tempo real
export const isRecentUpdate = (timestamp: string, thresholdMs: number = 30000): boolean => {
  const now = Date.now();
  const fixTime = new Date(timestamp).getTime();
  return (now - fixTime) <= thresholdMs;
};

// Idade dos dados em segundos
export const getDataAge = (timestamp: string): number => {
  const now = Date.now();
  const fixTime = new Date(timestamp).getTime();
  return Math.floor((now - fixTime) / 1000);
};

// Estado de movimento baseado na velocidade (critério principal)
export const getMovementState = (motion: boolean, speed: number, activity: ActivityType): MovementState => {
  const speedKmh = convertKnotsToKmh(speed);
  
  // Critério principal: velocidade > 0 = em movimento
  if (speedKmh > 0) {
    return 'moving';
  }
  
  // Se velocidade é 0, verificar contexto adicional
  if (speedKmh === 0) {
    // Se estava em movimento recentemente (motion ainda true), considerar pausa
    if (motion && ['in_vehicle', 'on_bicycle'].includes(activity)) {
      return 'idle';
    }
    
    // Caso contrário, está parado
    return 'stopped';
  }
  
  return 'stopped';
};

// Status de movimento para UI
export const getMovementStatus = (position: TraccarPosition): MovementStatus => {
  const state = getMovementState(position.attributes.motion, position.speed, position.attributes.activity);
  const speedKmh = convertKnotsToKmh(position.speed);
  
  switch (state) {
    case 'moving':
      return {
        state,
        label: 'Em Movimento',
        description: `Velocidade: ${speedKmh} km/h`,
        color: 'bg-trucker-green/20',
        textColor: 'text-trucker-green',
        icon: '🚛',
        animate: true
      };
    case 'idle':
      return {
        state,
        label: 'Pausado',
        description: 'Parado temporariamente',
        color: 'bg-trucker-yellow/20',
        textColor: 'text-trucker-yellow',
        icon: '⏸️',
        animate: false
      };
    case 'stopped':
      return {
        state,
        label: 'Parado',
        description: 'Sem movimento detectado',
        color: 'bg-muted',
        textColor: 'text-muted-foreground',
        icon: '🅿️',
        animate: false
      };
    default:
      return {
        state: 'unknown',
        label: 'Status Indefinido',
        description: 'Verificando status...',
        color: 'bg-destructive/20',
        textColor: 'text-destructive',
        icon: '❓',
        animate: false
      };
  }
};

// Estado de conexão
export const getConnectionState = (position: TraccarPosition): ConnectionState => {
  const dataAge = getDataAge(position.fixTime);
  const isValid = position.valid;
  
  if (!isValid) return 'offline';
  if (dataAge <= 30) return 'live';       // < 30s = tempo real
  if (dataAge <= 300) return 'delayed';   // < 5min = atrasado
  return 'offline';                       // > 5min = offline
};

// Status de conexão para UI
export const getConnectionStatus = (position: TraccarPosition): ConnectionStatus => {
  const state = getConnectionState(position);
  const lastUpdate = formatDistanceToNow(new Date(position.fixTime), { 
    locale: ptBR, 
    addSuffix: true 
  });
  
  switch (state) {
    case 'live':
      return {
        state,
        label: 'AO VIVO',
        description: 'Dados em tempo real',
        color: 'bg-destructive',
        textColor: 'text-destructive-foreground',
        icon: '📡',
        lastUpdate,
        isRealtime: true
      };
    case 'delayed':
      return {
        state,
        label: 'ATRASADO',
        description: 'Dados recentes',
        color: 'bg-trucker-yellow',
        textColor: 'text-black',
        icon: '⏰',
        lastUpdate,
        isRealtime: false
      };
    case 'offline':
      return {
        state,
        label: 'OFFLINE',
        description: 'Sem sinal GPS',
        color: 'bg-muted',
        textColor: 'text-muted-foreground',
        icon: '📶',
        lastUpdate,
        isRealtime: false
      };
    default:
      return {
        state: 'error',
        label: 'ERRO',
        description: 'Falha na comunicação',
        color: 'bg-destructive',
        textColor: 'text-destructive-foreground',
        icon: '❌',
        lastUpdate,
        isRealtime: false
      };
  }
};

// Estado da bateria
export const getBatteryState = (level: number): BatteryState => {
  if (level < 10) return 'critical';
  if (level < 30) return 'low';
  if (level < 70) return 'normal';
  return 'good';
};

// Status da bateria para UI
export const getBatteryStatus = (level: number): BatteryStatus => {
  const state = getBatteryState(level);
  
  switch (state) {
    case 'critical':
      return {
        state,
        level,
        label: 'Crítica',
        color: 'text-destructive',
        icon: '🔋',
        showWarning: true
      };
    case 'low':
      return {
        state,
        level,
        label: 'Baixa',
        color: 'text-trucker-yellow',
        icon: '🔋',
        showWarning: true
      };
    case 'normal':
      return {
        state,
        level,
        label: 'Normal',
        color: 'text-trucker-blue',
        icon: '🔋',
        showWarning: false
      };
    case 'good':
      return {
        state,
        level,
        label: 'Boa',
        color: 'text-trucker-green',
        icon: '🔋',
        showWarning: false
      };
    default:
      return {
        state: 'unknown',
        level: 0,
        label: 'Desconhecida',
        color: 'text-muted-foreground',
        icon: '❓',
        showWarning: false
      };
  }
};

// Nível de precisão
export const getAccuracyLevel = (accuracy: number): AccuracyLevel => {
  if (accuracy < 5) return 'excellent';
  if (accuracy < 15) return 'good';
  if (accuracy < 50) return 'fair';
  return 'poor';
};

// Status de precisão para UI
export const getAccuracyStatus = (accuracy: number): AccuracyStatus => {
  const level = getAccuracyLevel(accuracy);
  
  switch (level) {
    case 'excellent':
      return {
        level,
        value: accuracy,
        label: 'Excelente',
        description: `±${accuracy.toFixed(1)}m`,
        color: 'text-trucker-green',
        showWarning: false
      };
    case 'good':
      return {
        level,
        value: accuracy,
        label: 'Boa',
        description: `±${accuracy.toFixed(1)}m`,
        color: 'text-trucker-blue',
        showWarning: false
      };
    case 'fair':
      return {
        level,
        value: accuracy,
        label: 'Regular',
        description: `±${accuracy.toFixed(1)}m`,
        color: 'text-trucker-yellow',
        showWarning: true
      };
    case 'poor':
      return {
        level,
        value: accuracy,
        label: 'Ruim',
        description: `±${accuracy.toFixed(1)}m`,
        color: 'text-destructive',
        showWarning: true
      };
    default:
      return {
        level: 'unknown',
        value: 0,
        label: 'Desconhecida',
        description: 'Sem dados',
        color: 'text-muted-foreground',
        showWarning: false
      };
  }
};

// Labels para atividades
export const getActivityLabel = (activity: ActivityType): string => {
  const labels: Record<ActivityType, string> = {
    unknown: 'Indefinida',
    still: 'Parado',
    on_bicycle: 'De Bicicleta',
    in_vehicle: 'Em Veículo',
    on_foot: 'A Pé',
    running: 'Correndo',
    automotive: 'Automotivo'
  };
  
  return labels[activity] || 'Desconhecida';
};

// Status de atividade para UI
export const getActivityStatus = (activity: ActivityType): ActivityStatus => {
  const label = getActivityLabel(activity);
  
  // Ícones e descrições baseados na atividade
  const activityConfig: Record<ActivityType, { icon: string; description: string; confidence: 'high' | 'medium' | 'low' }> = {
    unknown: { icon: '❓', description: 'Atividade não identificada', confidence: 'low' },
    still: { icon: '⏹️', description: 'Dispositivo estacionário', confidence: 'high' },
    on_bicycle: { icon: '🚴', description: 'Movimento de bicicleta detectado', confidence: 'medium' },
    in_vehicle: { icon: '🚗', description: 'Dentro de um veículo', confidence: 'high' },
    on_foot: { icon: '🚶', description: 'Caminhando', confidence: 'medium' },
    running: { icon: '🏃', description: 'Correndo', confidence: 'medium' },
    automotive: { icon: '🚛', description: 'Veículo automotor', confidence: 'high' }
  };
  
  const config = activityConfig[activity] || activityConfig.unknown;
  
  return {
    type: activity,
    label,
    description: config.description,
    icon: config.icon,
    confidence: config.confidence
  };
};

// Formatar coordenadas para exibição
export const formatCoordinates = (lat: number, lng: number): string => {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};

// Função principal para processar dados do Traccar
export const processTrackerData = (position: TraccarPosition): ProcessedTrackerData => {
  const speedKmh = convertKnotsToKmh(position.speed);
  const totalDistanceKm = convertMetersToKm(position.attributes.totalDistance);
  const distanceKm = convertMetersToKm(position.attributes.distance);
  const dataAge = getDataAge(position.fixTime);
  
  const movementStatus = getMovementStatus(position);
  const connectionStatus = getConnectionStatus(position);
  const batteryStatus = getBatteryStatus(position.attributes.batteryLevel);
  const activityStatus = getActivityStatus(position.attributes.activity);
  const accuracyStatus = getAccuracyStatus(position.accuracy);
  
  const hasValidGPS = position.valid && position.accuracy <= API.TRACCAR.VALIDATION.MAX_ACCURACY;
  const isRealtime = connectionStatus.isRealtime;
  const isInMotion = movementStatus.state === 'moving';
  const isStationary = movementStatus.state === 'stopped';
  
  // Precisa de atenção se: bateria crítica, sem GPS, dados muito antigos
  const needsAttention = batteryStatus.showWarning || 
                        !hasValidGPS || 
                        dataAge > 300; // > 5 minutos
  
  return {
    ...position,
    speedKmh,
    totalDistanceKm,
    distanceKm,
    movementStatus,
    connectionStatus,
    batteryStatus,
    activityStatus,
    accuracyStatus,
    lastUpdateRelative: connectionStatus.lastUpdate,
    isRealtime,
    dataAge,
    hasValidGPS,
    coordinatesText: formatCoordinates(position.latitude, position.longitude),
    isInMotion,
    isStationary,
    needsAttention
  };
};