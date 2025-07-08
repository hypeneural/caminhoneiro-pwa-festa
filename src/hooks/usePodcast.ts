import { useState, useEffect, useCallback } from 'react';
import { PodcastItem, PodcastState, PodcastFilters } from '@/types/podcast';
import podcastService from '@/services/api/podcastService';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface UsePodcastParams {
  filters?: PodcastFilters;
  initialLoad?: boolean;
}

export const usePodcast = ({ filters = {}, initialLoad = true }: UsePodcastParams = {}) => {
  const [state, setState] = useState<PodcastState>({
    items: [],
    loading: initialLoad,
    error: null,
    hasMore: true
  });

  const { isOnline } = useNetworkStatus();

  const fetchPodcasts = useCallback(async (newFilters?: PodcastFilters, append = false) => {
    if (!isOnline) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const finalFilters = { ...filters, ...newFilters };
      const response = await podcastService.getPodcasts(finalFilters);

      if (!response?.data) {
        throw new Error('Dados inválidos recebidos da API');
      }

      if ('error' in response && response.error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: response.error,
          hasMore: false
        }));
        return response;
      }

      setState(prev => ({
        items: append ? [...prev.items, ...response.data] : response.data,
        loading: false,
        error: null,
        hasMore: response.data.length === (finalFilters.limit || 10) && response.data.length > 0
      }));

      return response;
    } catch (error) {
      console.error('Error in usePodcast:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar podcasts',
        hasMore: false
      }));
    }
  }, [isOnline, filters]);

  const loadMore = useCallback(async () => {
    if (!state.hasMore || state.loading) return;
    
    const currentPage = Math.ceil(state.items.length / (filters.limit || 10)) + 1;
    await fetchPodcasts({ ...filters, page: currentPage }, true);
  }, [state.hasMore, state.loading, state.items.length, filters, fetchPodcasts]);

  const refresh = useCallback(() => {
    setState(prev => ({ ...prev, items: [] }));
    return fetchPodcasts();
  }, [fetchPodcasts]);

  useEffect(() => {
    if (initialLoad) {
      fetchPodcasts();
    }
  }, [initialLoad]);

  return {
    items: state.items,
    loading: state.loading,
    error: state.error,
    hasMore: state.hasMore,
    refresh,
    loadMore,
    fetchPodcasts
  };
};