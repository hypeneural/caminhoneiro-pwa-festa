import { useState, useEffect, useCallback } from 'react';
import { NewsItem, NewsState, NewsFilters } from '@/types/news';
import newsService from '@/services/api/newsService';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface UseNewsParams {
  filters?: NewsFilters;
  initialLoad?: boolean;
}

export const useNews = ({ filters = {}, initialLoad = true }: UseNewsParams = {}) => {
  const [state, setState] = useState<NewsState>({
    items: [],
    loading: initialLoad,
    error: null,
    hasMore: true
  });

  const { isOnline } = useNetworkStatus();

  const fetchNews = useCallback(async (newFilters?: NewsFilters, append = false) => {
    if (!isOnline) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const finalFilters = { ...filters, ...newFilters };
      const response = await newsService.getNews(finalFilters);

      if (!response?.data) {
        throw new Error('Dados inválidos recebidos da API');
      }

      // Check if response has error (from service fallback)
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
      console.error('Error in useNews:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar notícias',
        hasMore: false
      }));
    }
  }, [isOnline, filters]);

  const loadMore = useCallback(async () => {
    if (!state.hasMore || state.loading) return;
    
    const currentPage = Math.ceil(state.items.length / (filters.limit || 10)) + 1;
    await fetchNews({ ...filters, page: currentPage }, true);
  }, [state.hasMore, state.loading, state.items.length, filters, fetchNews]);

  const refresh = useCallback(() => {
    setState(prev => ({ ...prev, items: [] }));
    return fetchNews();
  }, [fetchNews]);

  // Initial load
  useEffect(() => {
    if (initialLoad) {
      fetchNews();
    }
  }, [initialLoad]);

  return {
    items: state.items,
    loading: state.loading,
    error: state.error,
    hasMore: state.hasMore,
    refresh,
    loadMore,
    fetchNews
  };
};

// Hook específico para notícias em destaque
export const useFeaturedNews = () => {
  const [featuredNews, setFeaturedNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOnline } = useNetworkStatus();

  const fetchFeaturedNews = useCallback(async () => {
    if (!isOnline) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await newsService.getFeaturedNews();
      setFeaturedNews(data || []);
    } catch (err) {
      console.error('Error fetching featured news:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar notícias em destaque');
      // Set empty array to prevent crashes
      setFeaturedNews([]);
    } finally {
      setLoading(false);
    }
  }, [isOnline]);

  useEffect(() => {
    fetchFeaturedNews();
  }, [fetchFeaturedNews]);

  return {
    featuredNews,
    loading,
    error,
    refresh: fetchFeaturedNews
  };
};