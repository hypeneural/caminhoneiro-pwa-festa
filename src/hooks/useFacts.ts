import { useState, useEffect, useCallback } from 'react';
import { Fact, FactState, FactFilters, FactCategory } from '@/types/facts';
import { factsService } from '@/services/api/factsService';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface UseFactsParams {
  filters?: FactFilters;
  initialLoad?: boolean;
}

export const useFacts = ({ filters = {}, initialLoad = true }: UseFactsParams = {}) => {
  const [state, setState] = useState<FactState>({
    items: [],
    loading: initialLoad,
    error: null,
    hasMore: true
  });

  const [categories, setCategories] = useState<FactCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const { isOnline } = useNetworkStatus();

  const fetchFacts = useCallback(async (newFilters?: FactFilters, append = false) => {
    if (!isOnline) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const finalFilters = { ...filters, ...newFilters };
      const response = await factsService.getFacts(finalFilters);

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
        hasMore: response.data.length === (finalFilters.limit || 25)
      }));

      return response;
    } catch (error: any) {
      console.error('Error in fetchFacts:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erro ao carregar curiosidades',
        hasMore: false
      }));
    }
  }, [isOnline]); // Removed filters dependency to prevent infinite loops

  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const categoriesData = await factsService.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (state.loading || !state.hasMore || !isOnline) return;
    
    const currentPage = Math.ceil(state.items.length / (filters.limit || 25));
    const nextPage = currentPage + 1;
    
    fetchFacts({ ...filters, page: nextPage }, true);
  }, [state.loading, state.hasMore, state.items.length, filters, fetchFacts, isOnline]);

  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, items: [], hasMore: true }));
    await fetchFacts({ ...filters, page: 1 });
  }, [fetchFacts, filters]);

  // Initial load
  useEffect(() => {
    if (initialLoad) {
      fetchFacts();
      fetchCategories();
    }
  }, [initialLoad]); // Only depend on initialLoad

  return {
    items: state.items,
    loading: state.loading,
    error: state.error,
    hasMore: state.hasMore,
    categories,
    categoriesLoading,
    loadMore,
    refresh,
    fetchFacts
  };
};

// Hook for specific fact filtering and searching
export const useFactsFilter = () => {
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [state, setState] = useState<FactState>({
    items: [],
    loading: true,
    error: null,
    hasMore: true
  });
  const [categories, setCategories] = useState<FactCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const { isOnline } = useNetworkStatus();

  // Build filters object inline when needed

  const fetchFactsWithFilters = useCallback(async (overrideFilters?: FactFilters, append = false) => {
    if (!isOnline) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const finalFilters = overrideFilters || {
        category: activeCategory || undefined,
        search: searchQuery || undefined,
        sort: 'created_at',
        order: sortOrder,
        limit: 25,
        page: 1
      };
      
      const response = await factsService.getFacts(finalFilters);

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
        hasMore: response.data.length === (finalFilters.limit || 25)
      }));

      return response;
    } catch (error: any) {
      console.error('Error in fetchFactsWithFilters:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erro ao carregar curiosidades',
        hasMore: false
      }));
    }
  }, [activeCategory, searchQuery, sortOrder, isOnline]);

  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const categoriesData = await factsService.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (state.loading || !state.hasMore || !isOnline) return;
    
    const currentPage = Math.ceil(state.items.length / 25);
    const nextPage = currentPage + 1;
    
    const loadMoreFilters = {
      category: activeCategory || undefined,
      search: searchQuery || undefined,
      sort: 'created_at' as const,
      order: sortOrder,
      limit: 25,
      page: nextPage
    };
    
    fetchFactsWithFilters(loadMoreFilters, true);
  }, [state.loading, state.hasMore, state.items.length, activeCategory, searchQuery, sortOrder, fetchFactsWithFilters, isOnline]);

  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, items: [], hasMore: true }));
    const refreshFilters = {
      category: activeCategory || undefined,
      search: searchQuery || undefined,
      sort: 'created_at' as const,
      order: sortOrder,
      limit: 25,
      page: 1
    };
    await fetchFactsWithFilters(refreshFilters);
  }, [fetchFactsWithFilters, activeCategory, searchQuery, sortOrder]);

  const clearFilters = useCallback(() => {
    setActiveCategory(null);
    setSearchQuery('');
    setSortOrder('DESC');
  }, []);

  // Effect for filter changes
  useEffect(() => {
    setState(prev => ({ ...prev, items: [], hasMore: true }));
    fetchFactsWithFilters();
  }, [activeCategory, searchQuery, sortOrder]); // React to filter changes

  // Initial load
  useEffect(() => {
    fetchCategories();
  }, []);

  const hasActiveFilters = activeCategory !== null || searchQuery.trim() !== '';

  return {
    facts: state.items,
    loading: state.loading,
    error: state.error,
    hasMore: state.hasMore,
    categories,
    categoriesLoading,
    activeCategory,
    searchQuery,
    sortOrder,
    hasActiveFilters,
    setActiveCategory,
    setSearchQuery,
    setSortOrder,
    clearFilters,
    loadMore,
    refresh
  };
}; 