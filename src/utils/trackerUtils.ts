import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const convertKnotsToKmh = (knots: number): number => {
  return Math.round(knots * 1.852);
};

export const convertMetersToKm = (meters: number): number => {
  return Number((meters / 1000).toFixed(1));
};

export const getMovementStatus = (motion: boolean, speed: number) => {
  const speedKmh = convertKnotsToKmh(speed);
  
  if (motion && speedKmh > 2) {
    return {
      label: 'Em movimento',
      icon: '🚛',
      color: 'bg-trucker-green',
      textColor: 'text-trucker-green-foreground'
    };
  }
  
  return {
    label: 'Parado',
    icon: '⏸️',
    color: 'bg-trucker-yellow',
    textColor: 'text-trucker-yellow-foreground'
  };
};

export const getBatteryColor = (level: number) => {
  if (level > 40) return 'text-trucker-green';
  if (level < 20) return 'text-destructive';
  return 'text-trucker-yellow';
};

export const formatLastUpdate = (fixTime: string): string => {
  try {
    const date = new Date(fixTime);
    return formatDistanceToNow(date, { 
      addSuffix: true,
      locale: ptBR 
    });
  } catch (error) {
    return 'Tempo indisponível';
  }
};

export const isRecentUpdate = (fixTime: string): boolean => {
  try {
    const date = new Date(fixTime);
    const now = new Date();
    const diffMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
    return diffMinutes < 2; // Considera recente se for menos de 2 minutos
  } catch (error) {
    return false;
  }
};