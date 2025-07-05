import { useState, useEffect, useCallback } from 'react';
import { NewsItem, NewsState } from '@/types/news';
import newsService from '@/services/api/newsService';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export const useNews = (initialLimit: number = 5) => {
  const [state, setState] = useState<NewsState>({
    items: [],
    loading: true,
    error: null,
    hasMore: false
  });

  const { isOnline } = useNetworkStatus();

  const fetchNews = useCallback(async () => {
    if (!isOnline) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      console.log('Fetching news...');
      
      const response = await newsService.getNews(initialLimit);
      console.log('News response:', response);

      if (!response?.data) {
        throw new Error('Dados inválidos recebidos da API');
      }

      setState({
        items: response.data,
        loading: false,
        error: null,
        hasMore: false
      });
    } catch (error) {
      console.error('Error in useNews:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar notícias'
      }));
    }
  }, [isOnline, initialLimit]);

  // Initial load
  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Get featured news
  const featuredNews = state.items.filter(item => item.featured);

  // Get latest news
  const latestNews = state.items;

  return {
    latestNews,
    featuredNews,
    loading: state.loading,
    error: state.error,
    refresh: fetchNews
  };
};