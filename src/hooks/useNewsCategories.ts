import { useState, useEffect } from 'react';
import { NewsCategory } from '@/types/news';
import newsService from '@/services/api/newsService';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export const useNewsCategories = () => {
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOnline } = useNetworkStatus();

  const fetchCategories = async () => {
    if (!isOnline) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await newsService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [isOnline]);

  return {
    categories,
    loading,
    error,
    refresh: fetchCategories
  };
};