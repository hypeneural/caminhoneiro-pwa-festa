import { useQuery } from '@tanstack/react-query';
import { shortsService } from '@/services/api/shortsService';
import { ShortsQueryParams } from '@/types/shorts';

export const useShorts = (params?: ShortsQueryParams) => {
  return useQuery({
    queryKey: ['shorts', params],
    queryFn: () => shortsService.getShorts(params),
    staleTime: 1000 * 60 * 30, // 30 minutos
    gcTime: 1000 * 60 * 60 * 6, // 6 horas
  });
};

export const useShortById = (id: string) => {
  return useQuery({
    queryKey: ['short', id],
    queryFn: () => shortsService.getShortById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 30, // 30 minutos
    gcTime: 1000 * 60 * 60 * 6, // 6 horas
  });
};