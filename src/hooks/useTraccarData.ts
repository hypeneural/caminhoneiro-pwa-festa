import { useQuery } from '@tanstack/react-query';

export interface TraccarData {
  id: number;
  attributes: {
    batteryLevel: number;
    motion: boolean;
    totalDistance: number;
    odometer: number;
    activity: string;
    distance: number;
  };
  deviceId: number;
  fixTime: string;
  latitude: number;
  longitude: number;
  speed: number; // em nós
  course: number; // direção em graus
  address: string | null;
  protocol: string;
  serverTime: string;
  deviceTime: string;
  valid: boolean;
  outdated: boolean;
  altitude: number;
  accuracy: number;
  network: any;
  geofenceIds: any;
}

// A API retorna diretamente um array
type TraccarResponse = TraccarData[];

const fetchTraccarData = async (): Promise<TraccarData> => {
  console.log('🚚 Fazendo requisição para API Traccar...');
  
  try {
    const response = await fetch('https://hypeneural.com/caminhao/api.php', {
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} - ${response.statusText}`);
    }
    
    const result: TraccarResponse = await response.json();
    console.log('📡 Dados recebidos da API:', result);
    
    if (!Array.isArray(result) || result.length === 0) {
      throw new Error('API retornou array vazio ou formato inválido');
    }
    
    const traccarData = result[0]; // Primeiro item do array
    console.log('✅ Dados processados:', traccarData);
    
    return traccarData;
  } catch (error) {
    console.error('❌ Erro na API Traccar:', error);
    throw error; // Não usar mais dados mock automáticos
  }
};

export const useTraccarData = () => {
  return useQuery({
    queryKey: ['traccar-data'],
    queryFn: fetchTraccarData,
    refetchInterval: 10000, // 10 segundos para tempo real
    staleTime: 8000, // 8 segundos para otimização
    retry: (failureCount, error) => {
      console.log(`🔄 Tentativa ${failureCount} falhou:`, error?.message);
      // Tentar até 2 vezes
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => {
      const delay = Math.min(1000 * 2 ** attemptIndex, 10000);
      console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
      return delay;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};