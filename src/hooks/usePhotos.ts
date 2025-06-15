import { useState, useEffect, useCallback, useMemo } from 'react';
import { PhotoItem, PhotoFilters, PhotoState } from '@/types/photos';
import { mockPhotos } from '@/data';
import { APP_CONFIG } from '@/constants';
import { useLocalStorage } from './useLocalStorage';

const initialState: Omit<PhotoState, 'favorites'> = {
  items: [],
  categories: [],
  filters: {},
  loading: false,
  error: null,
  selectedPhoto: null,
  lightboxOpen: false
};

export function usePhotos() {
  const [state, setState] = useState<Omit<PhotoState, 'favorites'>>(initialState);
  const [favorites, setFavorites] = useLocalStorage<string[]>('photo_favorites', []);

  // Load photos data
  const loadPhotos = useCallback(async (filters?: PhotoFilters) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
      let filteredPhotos = [...mockPhotos];
      
      // Apply filters
      if (filters?.category) {
        filteredPhotos = filteredPhotos.filter(photo => 
          photo.category.toLowerCase().includes(filters.category!.toLowerCase())
        );
      }
      
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredPhotos = filteredPhotos.filter(photo =>
          photo.title.toLowerCase().includes(searchTerm) ||
          photo.category.toLowerCase().includes(searchTerm) ||
          photo.photographer.toLowerCase().includes(searchTerm) ||
          photo.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }
      
      if (filters?.featured !== undefined) {
        filteredPhotos = filteredPhotos.filter(photo => photo.featured === filters.featured);
      }
      
      if (filters?.photographer) {
        filteredPhotos = filteredPhotos.filter(photo => 
          photo.photographer.toLowerCase().includes(filters.photographer!.toLowerCase())
        );
      }
      
      // Apply date range filter
      if (filters?.dateRange) {
        filteredPhotos = filteredPhotos.filter(photo => {
          const photoDate = new Date(photo.capturedAt);
          return photoDate >= filters.dateRange!.start && photoDate <= filters.dateRange!.end;
        });
      }
      
      // Apply sorting
      if (filters?.sortBy) {
        filteredPhotos.sort((a, b) => {
          const order = filters.sortOrder === 'desc' ? -1 : 1;
          
          switch (filters.sortBy) {
            case 'capturedAt':
              return order * (new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime());
            case 'likes':
              return order * (b.likes - a.likes);
            case 'views':
              return order * (b.views - a.views);
            case 'title':
              return order * a.title.localeCompare(b.title);
            default:
              return 0;
          }
        });
      }
      
      // Extract categories
      const categories = Array.from(new Set(mockPhotos.map(photo => photo.category)))
        .map(category => ({
          id: category.toLowerCase(),
          name: category,
          slug: category.toLowerCase().replace(/\s+/g, '-'),
          count: mockPhotos.filter(photo => photo.category === category).length,
          thumbnail: mockPhotos.find(photo => photo.category === category)?.thumbnailUrl
        }));
      
      setState(prev => ({
        ...prev,
        items: filteredPhotos,
        categories,
        filters: filters || {},
        loading: false
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar fotos'
      }));
    }
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<PhotoFilters>) => {
    const updatedFilters = { ...state.filters, ...newFilters };
    loadPhotos(updatedFilters);
  }, [state.filters, loadPhotos]);

  // Clear filters
  const clearFilters = useCallback(() => {
    loadPhotos();
  }, [loadPhotos]);

  // Lightbox controls
  const openLightbox = useCallback((photo: PhotoItem) => {
    setState(prev => ({
      ...prev,
      selectedPhoto: photo,
      lightboxOpen: true
    }));
  }, []);

  const closeLightbox = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedPhoto: null,
      lightboxOpen: false
    }));
  }, []);

  const navigatePhoto = useCallback((direction: 'next' | 'prev') => {
    if (!state.selectedPhoto) return;
    
    const currentIndex = state.items.findIndex(photo => photo.id === state.selectedPhoto!.id);
    let newIndex;
    
    if (direction === 'next') {
      newIndex = currentIndex + 1 >= state.items.length ? 0 : currentIndex + 1;
    } else {
      newIndex = currentIndex - 1 < 0 ? state.items.length - 1 : currentIndex - 1;
    }
    
    setState(prev => ({
      ...prev,
      selectedPhoto: state.items[newIndex]
    }));
  }, [state.selectedPhoto, state.items]);

  // Favorites management
  const toggleFavorite = useCallback((photoId: string) => {
    setFavorites(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  }, [setFavorites]);

  const isFavorite = useCallback((photoId: string) => 
    favorites.includes(photoId),
    [favorites]
  );

  // Get featured photos
  const featuredPhotos = useMemo(() => 
    state.items.filter(photo => photo.featured),
    [state.items]
  );

  // Get latest photos
  const latestPhotos = useMemo(() => 
    state.items
      .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime())
      .slice(0, 10),
    [state.items]
  );

  // Get favorite photos
  const favoritePhotos = useMemo(() => 
    state.items.filter(photo => favorites.includes(photo.id)),
    [state.items, favorites]
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

  // Get photo by ID
  const getPhotoById = useCallback((id: string) => 
    state.items.find(photo => photo.id === id),
    [state.items]
  );

  // Initial load
  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  return {
    // State
    photos: state.items,
    categories: state.categories,
    filters: state.filters,
    loading: state.loading,
    error: state.error,
    selectedPhoto: state.selectedPhoto,
    lightboxOpen: state.lightboxOpen,
    favorites,
    
    // Computed
    featuredPhotos,
    latestPhotos,
    favoritePhotos,
    isFiltersActive,
    
    // Actions
    loadPhotos,
    updateFilters,
    clearFilters,
    openLightbox,
    closeLightbox,
    navigatePhoto,
    toggleFavorite,
    isFavorite,
    getPhotoById,
    
    // Utils
    refresh: () => loadPhotos(state.filters)
  };
}