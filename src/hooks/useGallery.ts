import { useState, useCallback, useMemo, useEffect } from 'react';
import { Photo, GalleryFilters, GalleryState } from '@/types/gallery';
import { useLocalStorage } from '@/hooks/useLocalStorage';

// Mock data for demonstration
const generateMockPhotos = (): Photo[] => {
  const categories = ['caminhoes', 'carretas', 'familia', 'shows', 'religioso', 'geral'] as const;
  const plateFormats = ['ABC-1234', 'DEF-5678', 'GHI-9012', 'JKL-3456', 'MNO-7890', 'PQR-2468'];
  const photographers = ['João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Lima'];
  const placeholderImages = [
    'photo-1452378174528-3090a4bba7b2',
    'photo-1487252665478-49b61b47f302',
    'photo-1452960962994-acf4fd70b632',
    'photo-1518877593221-1f28583780b4',
    'photo-1469041797191-50ace28483c3',
    'photo-1472396961693-142e6e269027'
  ];

  return Array.from({ length: 100 }, (_, index) => {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const imageId = placeholderImages[Math.floor(Math.random() * placeholderImages.length)];
    
    return {
      id: `photo-${index + 1}`,
      url: `https://images.unsplash.com/${imageId}?auto=format&fit=crop&q=80&w=800`,
      thumbnailUrl: `https://images.unsplash.com/${imageId}?auto=format&fit=crop&q=80&w=400`,
      title: `Foto ${index + 1}`,
      description: `Descrição da foto ${index + 1}`,
      category,
      vehiclePlate: category === 'caminhoes' || category === 'carretas' 
        ? plateFormats[Math.floor(Math.random() * plateFormats.length)]
        : undefined,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Last 7 days
      location: {
        lat: -27.2423 + (Math.random() - 0.5) * 0.1,
        lng: -48.6467 + (Math.random() - 0.5) * 0.1,
        address: 'São Cristóvão, Chapecó - SC'
      },
      photographer: photographers[Math.floor(Math.random() * photographers.length)],
      views: Math.floor(Math.random() * 1000),
      likes: Math.floor(Math.random() * 100),
      tags: ['festa', 'caminhoneiro', 'chapeco'],
      fileSize: Math.floor(Math.random() * 5000000) + 1000000, // 1-6MB
      dimensions: {
        width: 1920,
        height: 1080
      }
    };
  });
};

const initialFilters: GalleryFilters = {
  category: [],
  dateRange: {},
  timeOfDay: 'all',
  sortBy: 'newest',
  searchQuery: '',
  vehiclePlate: ''
};

export const useGallery = () => {
  const [favorites, setFavorites] = useLocalStorage<string[]>('gallery-favorites', []);
  const [state, setState] = useState<GalleryState>({
    photos: [],
    filteredPhotos: [],
    loading: true,
    error: null,
    selectedPhoto: null,
    lightboxOpen: false,
    filters: initialFilters,
    favorites,
    viewMode: 'grid',
    hasMore: true,
    page: 1
  });

  // Load more photos with pagination
  const loadMorePhotos = useCallback(async () => {
    if (state.loading || !state.hasMore) return;

    setState(prev => ({ ...prev, loading: true }));
    
    try {
      // Simulate API delay for loading more
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newPhotos = generateMockPhotos().slice(state.photos.length, state.photos.length + 20);
      const hasMore = state.photos.length + newPhotos.length < 200; // Max 200 photos for demo
      
      setState(prev => ({ 
        ...prev, 
        photos: [...prev.photos, ...newPhotos],
        hasMore,
        loading: false,
        page: prev.page + 1
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Erro ao carregar mais fotos',
        loading: false 
      }));
    }
  }, [state.loading, state.hasMore, state.photos.length]);

  // Refresh function for pull-to-refresh
  const refreshPhotos = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const photos = generateMockPhotos().slice(0, 20); // Reset to first 20 photos
      setState(prev => ({ 
        ...prev, 
        photos, 
        loading: false,
        hasMore: true,
        page: 1
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Erro ao atualizar fotos',
        loading: false 
      }));
    }
  }, []);

  // Initialize with mock data
  useEffect(() => {
    const loadPhotos = async () => {
      try {
        setState(prev => ({ ...prev, loading: true }));
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        const photos = generateMockPhotos();
        setState(prev => ({ 
          ...prev, 
          photos, 
          filteredPhotos: photos,
          loading: false 
        }));
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: 'Erro ao carregar fotos',
          loading: false 
        }));
      }
    };

    loadPhotos();
  }, []);

  // Filter and sort photos
  const filteredPhotos = useMemo(() => {
    let result = [...state.photos];

    // Search by vehicle plate
    if (state.filters.vehiclePlate) {
      const plateQuery = state.filters.vehiclePlate.toLowerCase();
      result = result.filter(photo => 
        photo.vehiclePlate?.toLowerCase().includes(plateQuery)
      );
    }

    // General search
    if (state.filters.searchQuery) {
      const query = state.filters.searchQuery.toLowerCase();
      result = result.filter(photo =>
        photo.title?.toLowerCase().includes(query) ||
        photo.description?.toLowerCase().includes(query) ||
        photo.tags.some(tag => tag.toLowerCase().includes(query)) ||
        photo.vehiclePlate?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (state.filters.category.length > 0) {
      result = result.filter(photo => 
        state.filters.category.includes(photo.category)
      );
    }

    // Time of day filter
    if (state.filters.timeOfDay !== 'all') {
      result = result.filter(photo => {
        const hour = photo.timestamp.getHours();
        switch (state.filters.timeOfDay) {
          case 'morning':
            return hour >= 6 && hour < 12;
          case 'afternoon':
            return hour >= 12 && hour < 18;
          case 'evening':
            return hour >= 18 || hour < 6;
          default:
            return true;
        }
      });
    }

    // Sort
    result.sort((a, b) => {
      switch (state.filters.sortBy) {
        case 'newest':
          return b.timestamp.getTime() - a.timestamp.getTime();
        case 'oldest':
          return a.timestamp.getTime() - b.timestamp.getTime();
        case 'most-viewed':
          return b.views - a.views;
        case 'most-liked':
          return b.likes - a.likes;
        default:
          return 0;
      }
    });

    return result;
  }, [state.photos, state.filters]);

  // Update filtered photos when filters change
  useEffect(() => {
    setState(prev => ({ ...prev, filteredPhotos }));
  }, [filteredPhotos]);

  const updateFilters = useCallback((newFilters: Partial<GalleryFilters>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters }
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: initialFilters
    }));
  }, []);

  const openLightbox = useCallback((photo: Photo) => {
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

  const navigatePhoto = useCallback((direction: 'prev' | 'next') => {
    if (!state.selectedPhoto) return;

    const currentIndex = state.filteredPhotos.findIndex(
      photo => photo.id === state.selectedPhoto!.id
    );
    
    let newIndex: number;
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : state.filteredPhotos.length - 1;
    } else {
      newIndex = currentIndex < state.filteredPhotos.length - 1 ? currentIndex + 1 : 0;
    }

    setState(prev => ({
      ...prev,
      selectedPhoto: state.filteredPhotos[newIndex]
    }));
  }, [state.selectedPhoto, state.filteredPhotos]);

  const toggleFavorite = useCallback((photoId: string) => {
    const newFavorites = favorites.includes(photoId)
      ? favorites.filter(id => id !== photoId)
      : [...favorites, photoId];
    
    setFavorites(newFavorites);
    setState(prev => ({ ...prev, favorites: newFavorites }));
  }, [favorites, setFavorites]);

  const isFiltersActive = useMemo(() => {
    return state.filters.category.length > 0 ||
           state.filters.searchQuery !== '' ||
           state.filters.vehiclePlate !== '' ||
           state.filters.timeOfDay !== 'all' ||
           state.filters.sortBy !== 'newest';
  }, [state.filters]);

  return {
    ...state,
    updateFilters,
    clearFilters,
    openLightbox,
    closeLightbox,
    navigatePhoto,
    toggleFavorite,
    isFiltersActive,
    loadMorePhotos,
    refreshPhotos
  };
};