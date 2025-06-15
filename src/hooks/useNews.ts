import { useState, useEffect, useCallback, useMemo } from 'react';
import { NewsItem, NewsFilters, NewsState } from '@/types/news';
import { mockNews } from '@/data';
import { APP_CONFIG } from '@/constants';

const initialState: NewsState = {
  items: [],
  categories: [],
  filters: {},
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: APP_CONFIG.PAGINATION.NEWS_LIMIT,
    total: 0,
    hasMore: false
  }
};

export function useNews() {
  const [state, setState] = useState<NewsState>(initialState);

  // Load news data
  const loadNews = useCallback(async (filters?: NewsFilters) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
      let filteredNews = [...mockNews];
      
      // Apply filters
      if (filters?.category) {
        filteredNews = filteredNews.filter(news => 
          news.category.toLowerCase().includes(filters.category!.toLowerCase())
        );
      }
      
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredNews = filteredNews.filter(news =>
          news.title.toLowerCase().includes(searchTerm) ||
          news.summary.toLowerCase().includes(searchTerm) ||
          news.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }
      
      if (filters?.featured !== undefined) {
        filteredNews = filteredNews.filter(news => news.featured === filters.featured);
      }
      
      // Apply sorting
      if (filters?.sortBy) {
        filteredNews.sort((a, b) => {
          const order = filters.sortOrder === 'desc' ? -1 : 1;
          
          switch (filters.sortBy) {
            case 'publishedAt':
              return order * (new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
            case 'views':
              return order * (b.views - a.views);
            case 'likes':
              return order * (b.likes - a.likes);
            case 'title':
              return order * a.title.localeCompare(b.title);
            default:
              return 0;
          }
        });
      }
      
      // Extract categories
      const categories = Array.from(new Set(mockNews.map(news => news.category)))
        .map(category => ({
          id: category.toLowerCase(),
          name: category,
          slug: category.toLowerCase().replace(/\s+/g, '-'),
          color: mockNews.find(news => news.category === category)?.categoryColor || 'bg-muted',
          count: mockNews.filter(news => news.category === category).length
        }));
      
      setState(prev => ({
        ...prev,
        items: filteredNews,
        categories,
        filters: filters || {},
        loading: false,
        pagination: {
          ...prev.pagination,
          total: filteredNews.length,
          hasMore: false
        }
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar notícias'
      }));
    }
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<NewsFilters>) => {
    const updatedFilters = { ...state.filters, ...newFilters };
    loadNews(updatedFilters);
  }, [state.filters, loadNews]);

  // Clear filters
  const clearFilters = useCallback(() => {
    loadNews();
  }, [loadNews]);

  // Get featured news
  const featuredNews = useMemo(() => 
    state.items.filter(news => news.featured),
    [state.items]
  );

  // Get latest news
  const latestNews = useMemo(() => 
    state.items
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 5),
    [state.items]
  );

  // Check if filters are active
  const isFiltersActive = useMemo(() => 
    Object.keys(state.filters).length > 0 &&
    Object.values(state.filters).some(value => 
      value !== undefined && value !== '' && 
      (Array.isArray(value) ? value.length > 0 : true)
    ),
    [state.filters]
  );

  // Get news by ID
  const getNewsById = useCallback((id: string) => 
    state.items.find(news => news.id === id),
    [state.items]
  );

  // Like/unlike news
  const toggleLike = useCallback((newsId: string) => {
    setState(prev => ({
      ...prev,
      items: prev.items.map(news => 
        news.id === newsId 
          ? { ...news, likes: news.likes + 1 } // Simplified - would track user likes in real app
          : news
      )
    }));
  }, []);

  // Initial load
  useEffect(() => {
    loadNews();
  }, [loadNews]);

  return {
    // State
    news: state.items,
    categories: state.categories,
    filters: state.filters,
    loading: state.loading,
    error: state.error,
    pagination: state.pagination,
    
    // Computed
    featuredNews,
    latestNews,
    isFiltersActive,
    
    // Actions
    loadNews,
    updateFilters,
    clearFilters,
    getNewsById,
    toggleLike,
    
    // Utils
    refresh: () => loadNews(state.filters)
  };
}