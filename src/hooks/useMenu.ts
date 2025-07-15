import { useState, useEffect, useCallback, useMemo } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { menuService, APIMenuItem, APIMenuCategory, MenuQueryParams } from '@/services/api/menuService';
import { useLocalStorage } from './useLocalStorage';
import { useNetworkStatus } from './useNetworkStatus';

interface MenuState {
  searchTerm: string;
  activeCategory: number | null;
  priceRange: [number, number];
  sortOrder: {
    sort?: 'price';
    order?: 'ASC' | 'DESC';
  };
  viewMode: 'grid' | 'list';
}

interface MenuQueryResult {
  items: APIMenuItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

const initialState: MenuState = {
  searchTerm: '',
  activeCategory: null,
  priceRange: [0, 100],
  sortOrder: {},
  viewMode: 'grid'
};

export function useMenu() {
  const [state, setState] = useState<MenuState>(initialState);
  const [favorites, setFavorites] = useLocalStorage<string[]>('menu-favorites', []);
  const { isOnline } = useNetworkStatus();

  // Fetch categories
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    error: categoriesError
  } = useQuery<APIMenuCategory[]>({
    queryKey: ['menu-categories'],
    queryFn: () => menuService.getCategories(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: isOnline
  });

  // Build query params
  const buildQueryParams = useCallback((): MenuQueryParams => {
    const params: MenuQueryParams = {
      limit: 15
    };

    if (state.searchTerm) {
      params.search = state.searchTerm;
    }

    if (state.activeCategory !== null) {
      params.category = state.activeCategory;
    }

    if (state.priceRange[0] > 0) {
      params.min_price = state.priceRange[0];
    }

    if (state.priceRange[1] < 100) {
      params.max_price = state.priceRange[1];
    }

    if (state.sortOrder.sort) {
      params.sort = state.sortOrder.sort;
      params.order = state.sortOrder.order;
    }

    return params;
  }, [state]);

  // Fetch menu items with infinite loading
  const {
    data: menuData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: menuLoading,
    error: menuError,
    refetch: refetchMenu
  } = useInfiniteQuery<MenuQueryResult, Error>({
    queryKey: ['menu-items', state],
    queryFn: async ({ pageParam = 1 }) => {
      const params = {
        ...buildQueryParams(),
        page: pageParam as number
      };
      return menuService.getMenuItems(params);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, total, limit } = lastPage.meta;
      const totalPages = Math.ceil(total / limit);
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: isOnline,
    staleTime: 2 * 60 * 1000 // 2 minutes
  });

  // Flatten menu items from all pages
  const menuItems = useMemo(() => {
    if (!menuData?.pages) return [];
    return menuData.pages.flatMap(page => page.items);
  }, [menuData]);

  // Favorites management
  const toggleFavorite = useCallback((itemId: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId];
      return newFavorites;
    });
  }, [setFavorites]);

  // State updates
  const updateSearch = useCallback((term: string) => {
    setState(prev => ({ ...prev, searchTerm: term }));
  }, []);

  const updateCategory = useCallback((categoryId: number | null) => {
    setState(prev => ({ ...prev, activeCategory: categoryId }));
  }, []);

  const updatePriceRange = useCallback((range: [number, number]) => {
    setState(prev => ({ ...prev, priceRange: range }));
  }, []);

  const updateSortOrder = useCallback((sort: 'price' | undefined, order?: 'ASC' | 'DESC') => {
    setState(prev => ({ ...prev, sortOrder: { sort, order } }));
  }, []);

  const toggleViewMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      viewMode: prev.viewMode === 'grid' ? 'list' : 'grid'
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setState(initialState);
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      state.searchTerm !== '' ||
      state.activeCategory !== null ||
      state.priceRange[0] > 0 ||
      state.priceRange[1] < 100 ||
      !!state.sortOrder.sort
    );
  }, [state]);

  return {
    // Data
    categories,
    menuItems,
    favorites,
    
    // State
    searchTerm: state.searchTerm,
    activeCategory: state.activeCategory,
    priceRange: state.priceRange,
    sortOrder: state.sortOrder,
    viewMode: state.viewMode,
    hasActiveFilters,
    
    // Loading states
    isLoading: categoriesLoading || menuLoading,
    isFetchingMore: isFetchingNextPage,
    hasMore: hasNextPage,
    
    // Errors
    error: categoriesError || menuError,
    
    // Actions
    updateSearch,
    updateCategory,
    updatePriceRange,
    updateSortOrder,
    toggleViewMode,
    resetFilters,
    toggleFavorite,
    loadMore: fetchNextPage,
    refetch: refetchMenu
  };
} 