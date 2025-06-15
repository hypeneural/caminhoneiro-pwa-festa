import api from '@/lib/axios';

export interface SaoCristovaoLocation {
  id: string;
  isActive: boolean;
  currentLocation: {
    address: string;
    coordinates: { lat: number; lng: number };
  };
  status: 'moving' | 'stopped' | 'blessing';
  nextStop: {
    name: string;
    estimatedTime: number;
    coordinates: { lat: number; lng: number };
  };
  route: {
    name: string;
    stops: Array<{
      id: string;
      name: string;
      address: string;
      coordinates: { lat: number; lng: number };
      estimatedTime: string;
      completed: boolean;
    }>;
  };
  lastUpdate: string;
  speed: number;
  direction: string;
}

export const locationService = {
  // Buscar localização atual do São Cristóvão
  getCurrentLocation: async (): Promise<SaoCristovaoLocation> => {
    const response = await api.get('/location/sao-cristovao');
    return response.data;
  },

  // Buscar histórico de localizações
  getLocationHistory: async (params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<SaoCristovaoLocation[]> => {
    const response = await api.get('/location/history', { params });
    return response.data;
  },

  // Buscar rota completa da procissão
  getProcessionRoute: async (): Promise<{
    id: string;
    name: string;
    description: string;
    totalDistance: number;
    estimatedDuration: number;
    stops: Array<{
      id: string;
      name: string;
      address: string;
      coordinates: { lat: number; lng: number };
      estimatedTime: string;
      description: string;
      order: number;
    }>;
  }> => {
    const response = await api.get('/location/route');
    return response.data;
  }
};