import { useState, useEffect, useCallback, useMemo } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { menuService } from '@/services/api/menuService';
import { APIMenuItem, APIMenuCategory, MenuQueryParams } from '@/types/menu';
import { useLocalStorage } from './useLocalStorage';
import { useNetworkStatus } from './useNetworkStatus';

interface MenuState {
  searchTerm: string;
  activeCategory: number | null;
  priceRange: [number, number];
  sortOrder: {
    sort?: 'price' | 'name';
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
  const [favorites, setFavorites] = useLocalStorage<number[]>('menu-favorites', []);
  const { isOnline } = useNetworkStatus();

  // Fetch categories with offline support
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories
  } = useQuery<APIMenuCategory[]>({
    queryKey: ['menu-categories'],
    queryFn: () => menuService.getCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry if offline
      if (!isOnline) return false;
      return failureCount < 2;
    },
    retryDelay: 1000
  });

  // Build query params with debouncing
  const buildQueryParams = useCallback((): MenuQueryParams => {
    const params: MenuQueryParams = {
      limit: 15
    };

    if (state.searchTerm.trim()) {
      params.search = state.searchTerm.trim();
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

  // Fetch menu items with infinite loading and offline support
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry if offline
      if (!isOnline) return false;
      return failureCount < 2;
    },
    retryDelay: 1000
  });

  // Flatten menu items from all pages
  const menuItems = useMemo(() => {
    if (!menuData?.pages) return [];
    return menuData.pages.flatMap(page => page.items);
  }, [menuData]);

  // Enhanced menu items with computed properties
  const enhancedMenuItems = useMemo(() => {
    return menuItems.map(item => ({
      ...item,
      formattedPrice: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(parseFloat(item.price)),
      isFavorite: favorites.includes(item.id),
      isInCart: false, // This will be handled by the cart hook
      cartQuantity: 0 // This will be handled by the cart hook
    }));
  }, [menuItems, favorites]);

  // Favorites management
  const toggleFavorite = useCallback((itemId: string) => {
    const numericId = parseInt(itemId);
    setFavorites(prev => {
      const newFavorites = prev.includes(numericId)
        ? prev.filter(id => id !== numericId)
        : [...prev, numericId];
      return newFavorites;
    });
  }, [setFavorites]);

  // Debounced search update
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);
  
  const updateSearch = useCallback((term: string) => {
    // Clear existing debounce
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }

    // Set new debounce
    const newDebounce = setTimeout(() => {
      setState(prev => ({ ...prev, searchTerm: term }));
    }, 300); // 300ms debounce

    setSearchDebounce(newDebounce);

    // If search is cleared immediately, update state
    if (!term.trim()) {
      setState(prev => ({ ...prev, searchTerm: '' }));
    }
  }, [searchDebounce]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (searchDebounce) {
        clearTimeout(searchDebounce);
      }
    };
  }, [searchDebounce]);

  // State updates
  const updateCategory = useCallback((categoryId: number | null) => {
    setState(prev => ({ ...prev, activeCategory: categoryId }));
  }, []);

  const updatePriceRange = useCallback((range: [number, number]) => {
    setState(prev => ({ ...prev, priceRange: range }));
  }, []);

  const updateSortOrder = useCallback((sort: 'price' | 'name' | undefined, order?: 'ASC' | 'DESC') => {
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

  // Preload essential data on mount
  useEffect(() => {
    if (isOnline) {
      menuService.preloadEssentialData().catch(console.warn);
    }
  }, [isOnline]);

  // Combined error handling
  const error = categoriesError || menuError;

  // Combined refetch function
  const refetch = useCallback(async () => {
    const promises = [];
    
    if (categoriesError) {
      promises.push(refetchCategories());
    }
    
    if (menuError) {
      promises.push(refetchMenu());
    }

    if (promises.length === 0) {
      promises.push(refetchMenu());
    }

    return Promise.allSettled(promises);
  }, [categoriesError, menuError, refetchCategories, refetchMenu]);

  return {
    // Data
    categories,
    menuItems: enhancedMenuItems,
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
    error,
    
    // Actions
    updateSearch,
    updateCategory,
    updatePriceRange,
    updateSortOrder,
    toggleViewMode,
    resetFilters,
    toggleFavorite,
    loadMore: fetchNextPage,
    refetch,
    
    // Network status
    isOnline
  };
} 