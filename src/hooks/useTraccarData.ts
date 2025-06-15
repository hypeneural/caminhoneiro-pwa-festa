import { useQuery } from '@tanstack/react-query';

export interface TraccarData {
  id: number;
  attributes: {
    batteryLevel: number;
    motion: boolean;
    totalDistance: number;
  };
  deviceId: number;
  fixTime: string;
  latitude: number;
  longitude: number;
  speed: number; // em nós
  address: string | null;
  protocol: string;
  serverTime: string;
  deviceTime: string;
  valid: boolean;
}

interface TraccarResponse {
  data: TraccarData[];
}

const fetchTraccarData = async (): Promise<TraccarData> => {
  const response = await fetch('https://hypeneural.com/caminhao/api.php');
  
  if (!response.ok) {
    throw new Error(`Erro na API: ${response.status}`);
  }
  
  const result: TraccarResponse = await response.json();
  
  if (!result.data || result.data.length === 0) {
    throw new Error('Nenhum dado de rastreamento disponível');
  }
  
  return result.data[0]; // Sempre usar o primeiro objeto (mais recente)
};

export const useTraccarData = () => {
  return useQuery({
    queryKey: ['traccar-data'],
    queryFn: fetchTraccarData,
    refetchInterval: 7000, // 7 segundos para tempo real
    staleTime: 5000, // 5 segundos para otimização
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};