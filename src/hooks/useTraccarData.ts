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
  course?: number; // direção em graus
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
  try {
    const response = await fetch('https://hypeneural.com/caminhao/api.php', {
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }
    
    const result: TraccarResponse = await response.json();
    
    if (!result.data || result.data.length === 0) {
      throw new Error('Nenhum dado de rastreamento disponível');
    }
    
    return result.data[0]; // Sempre usar o primeiro objeto (mais recente)
  } catch (error) {
    // Se a API falhar, retornar dados mock para desenvolvimento
    console.warn('API Traccar indisponível, usando dados mock:', error);
    return {
      id: 1,
      attributes: {
        batteryLevel: 87,
        motion: true,
        totalDistance: 234700, // em metros
      },
      deviceId: 1,
      fixTime: new Date().toISOString(),
      latitude: -27.2423,
      longitude: -48.6024,
      speed: 24.3, // em nós (45 km/h)
      address: "Rua das Flores, 123 - Centro, Tijucas/SC",
      protocol: "osmand",
      serverTime: new Date().toISOString(),
      deviceTime: new Date().toISOString(),
      valid: true,
    };
  }
};

export const useTraccarData = () => {
  return useQuery({
    queryKey: ['traccar-data'],
    queryFn: fetchTraccarData,
    refetchInterval: 7000, // 7 segundos para tempo real
    staleTime: 5000, // 5 segundos para otimização
    retry: (failureCount, error) => {
      // Não fazer retry se for erro de CORS ou rede
      if (error?.message?.includes('Failed to fetch') || error?.message?.includes('CORS')) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Continuar em background mesmo com erro
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};