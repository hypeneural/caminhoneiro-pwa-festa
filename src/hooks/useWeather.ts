import { useQuery } from '@tanstack/react-query';
import { weatherService } from '@/services/api/weatherService';
import { WeatherData } from '@/types/weather';
import { API } from '@/constants/api';

interface UseWeatherReturn {
  weather: WeatherData | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useWeather(): UseWeatherReturn {
  const {
    data: weather,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['weather'],
    queryFn: weatherService.getWeather,
    staleTime: API.CACHE.WEATHER_STALE_TIME, // 6 horas
    gcTime: API.CACHE.WEATHER_CACHE_TIME, // 12 horas (substitui cacheTime)
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true
  });

  return {
    weather,
    isLoading,
    error: error as Error | null,
    refetch
  };
}