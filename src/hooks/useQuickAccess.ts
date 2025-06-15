import { useState, useEffect, useCallback, useMemo } from 'react';
import { QuickAccessItem, QuickAccessFilters, QuickAccessState } from '@/types/quickAccess';
import { quickAccessItems } from '@/data';
import { useLocalStorage } from './useLocalStorage';

const initialState: Omit<QuickAccessState, 'favorites' | 'recentlyUsed'> = {
  items: [],
  categories: [],
  filters: {},
  loading: false,
  error: null
};

export function useQuickAccess() {
  const [state, setState] = useState<Omit<QuickAccessState, 'favorites' | 'recentlyUsed'>>(initialState);
  const [favorites, setFavorites] = useLocalStorage<string[]>('quick_access_favorites', []);
  const [recentlyUsed, setRecentlyUsed] = useLocalStorage<string[]>('quick_access_recent', []);

  // Load quick access items
  const loadItems = useCallback(async (filters?: QuickAccessFilters) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
      let filteredItems = [...quickAccessItems];
      
      // Apply filters
      if (filters?.category) {
        filteredItems = filteredItems.filter(item => 
          item.category === filters.category
        );
      }
      
      if (filters?.isActive !== undefined) {
        filteredItems = filteredItems.filter(item => 
          item.isActive === filters.isActive
        );
      }
      
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredItems = filteredItems.filter(item =>
          item.title.toLowerCase().includes(searchTerm) ||
          item.description.toLowerCase().includes(searchTerm)
        );
      }
      
      if (filters?.showFavorites) {
        filteredItems = filteredItems.filter(item => 
          favorites.includes(item.id)
        );
      }
      
      // Apply sorting
      if (filters?.sortBy) {
        filteredItems.sort((a, b) => {
          const order = filters.sortOrder === 'desc' ? -1 : 1;
          
          switch (filters.sortBy) {
            case 'priority':
              return order * (a.priority - b.priority);
            case 'title':
              return order * a.title.localeCompare(b.title);
            case 'lastUsed':
              // Simplified last used comparison
              const aLastUsed = a.metadata?.lastUsed?.getTime() || 0;
              const bLastUsed = b.metadata?.lastUsed?.getTime() || 0;
              return order * (bLastUsed - aLastUsed);
            case 'useCount':
              const aUseCount = a.metadata?.useCount || 0;
              const bUseCount = b.metadata?.useCount || 0;
              return order * (bUseCount - aUseCount);
            default:
              return 0;
          }
        });
      } else {
        // Default sort by priority
        filteredItems.sort((a, b) => a.priority - b.priority);
      }
      
      // Group by categories
      const categories = Array.from(new Set(quickAccessItems.map(item => item.category)))
        .map(categoryName => {
          const categoryItems = filteredItems.filter(item => item.category === categoryName);
          const firstItem = quickAccessItems.find(item => item.category === categoryName);
          
          return {
            id: categoryName,
            name: categoryName.charAt(0).toUpperCase() + categoryName.slice(1),
            icon: firstItem?.icon || quickAccessItems[0].icon,
            color: firstItem?.color || 'text-muted-foreground',
            items: categoryItems
          };
        })
        .filter(category => category.items.length > 0);
      
      setState(prev => ({
        ...prev,
        items: filteredItems,
        categories,
        filters: filters || {},
        loading: false
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar itens'
      }));
    }
  }, [favorites]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<QuickAccessFilters>) => {
    const updatedFilters = { ...state.filters, ...newFilters };
    loadItems(updatedFilters);
  }, [state.filters, loadItems]);

  // Clear filters
  const clearFilters = useCallback(() => {
    loadItems();
  }, [loadItems]);

  // Track item usage
  const trackUsage = useCallback((itemId: string) => {
    // Update recently used
    setRecentlyUsed(prev => {
      const filtered = prev.filter(id => id !== itemId);
      return [itemId, ...filtered].slice(0, 10); // Keep last 10
    });
    
    // Update item metadata (would be persisted in real app)
    setState(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId
          ? {
              ...item,
              metadata: {
                ...item.metadata,
                lastUsed: new Date(),
                useCount: (item.metadata?.useCount || 0) + 1
              }
            }
          : item
      )
    }));
  }, [setRecentlyUsed]);

  // Favorites management
  const toggleFavorite = useCallback((itemId: string) => {
    setFavorites(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  }, [setFavorites]);

  const isFavorite = useCallback((itemId: string) => 
    favorites.includes(itemId),
    [favorites]
  );

  // Get items by category
  const getItemsByCategory = useCallback((category: string) => 
    state.items.filter(item => item.category === category),
    [state.items]
  );

  // Get favorite items
  const favoriteItems = useMemo(() => 
    state.items.filter(item => favorites.includes(item.id)),
    [state.items, favorites]
  );

  // Get recently used items
  const recentItems = useMemo(() => 
    recentlyUsed
      .map(id => state.items.find(item => item.id === id))
      .filter((item): item is QuickAccessItem => item !== undefined)
      .slice(0, 6),
    [state.items, recentlyUsed]
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

  // Get item by ID
  const getItemById = useCallback((id: string) => 
    state.items.find(item => item.id === id),
    [state.items]
  );

  // Initial load
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return {
    // State
    items: state.items,
    categories: state.categories,
    filters: state.filters,
    loading: state.loading,
    error: state.error,
    favorites,
    recentlyUsed,
    
    // Computed
    favoriteItems,
    recentItems,
    isFiltersActive,
    
    // Actions
    loadItems,
    updateFilters,
    clearFilters,
    trackUsage,
    toggleFavorite,
    isFavorite,
    getItemsByCategory,
    getItemById,
    
    // Utils
    refresh: () => loadItems(state.filters)
  };
}