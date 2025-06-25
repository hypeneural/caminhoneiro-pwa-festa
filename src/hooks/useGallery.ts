import { useState, useCallback, useMemo, useEffect } from 'react';
import { Photo, GalleryFilters, GalleryState } from '@/types/gallery';
import { useLocalStorage } from '@/hooks/useLocalStorage';

// Mock data com novos campos de veículo
const generateMockPhotos = (): Photo[] => {
  const categories = ['caminhoes', 'carretas', 'familia', 'shows', 'religioso', 'geral'] as const;
  const plateFormats = ['ABC-1234', 'DEF-5678', 'GHI-9012', 'JKL-3456', 'MNO-7890', 'PQR-2468'];
  const photographers = ['João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Lima'];
  const brands = ['Volvo', 'Scania', 'Mercedes-Benz', 'Iveco', 'DAF', 'MAN'];
  const models = ['FH', 'FM', 'R-Series', 'S-Series', 'Actros', 'Atego'];
  const colors = ['Branco', 'Preto', 'Prata', 'Azul', 'Vermelho', 'Verde'];
  const cities = ['Chapecó', 'Xanxerê', 'Concórdia', 'São Miguel do Oeste'];
  const fuelTypes = ['Diesel', 'Diesel S-10', 'Gasolina', 'Etanol'];
  const vehicleTypes = ['Caminhão', 'Carreta', 'Bitrem', 'Rodotrem', 'Truck', 'VUC'];
  
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
    const currentYear = new Date().getFullYear();
    
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
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      location: {
        lat: -27.2423 + (Math.random() - 0.5) * 0.1,
        lng: -48.6467 + (Math.random() - 0.5) * 0.1,
        address: 'São Cristóvão, Chapecó - SC'
      },
      photographer: photographers[Math.floor(Math.random() * photographers.length)],
      views: Math.floor(Math.random() * 1000),
      likes: Math.floor(Math.random() * 100),
      tags: ['festa', 'caminhoneiro', 'chapeco'],
      fileSize: Math.floor(Math.random() * 5000000) + 1000000,
      dimensions: {
        width: 1920,
        height: 1080
      },
      // Novos campos
      brand: brands[Math.floor(Math.random() * brands.length)],
      model: models[Math.floor(Math.random() * models.length)],
      modelYear: (currentYear - Math.floor(Math.random() * 10)).toString(),
      manufacturingYear: (currentYear - Math.floor(Math.random() * 10)).toString(),
      color: colors[Math.floor(Math.random() * colors.length)],
      city: cities[Math.floor(Math.random() * cities.length)],
      fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
      vehicleType: vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)]
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
    if (state.loading || !state.hasMore) {
      console.log('Load more cancelled:', { loading: state.loading, hasMore: state.hasMore });
      return;
    }

    console.log('Loading more photos from page:', state.page);
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newPhotos = generateMockPhotos().slice(state.photos.length, state.photos.length + 20);
      const hasMore = state.photos.length + newPhotos.length < 200;
      
      console.log('Loaded new photos:', { count: newPhotos.length, hasMore });
      
      setState(prev => ({ 
        ...prev, 
        photos: [...prev.photos, ...newPhotos],
        hasMore,
        loading: false,
        page: prev.page + 1
      }));
    } catch (error) {
      console.error('Error loading more photos:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Erro ao carregar mais fotos',
        loading: false 
      }));
    }
  }, [state.loading, state.hasMore, state.photos.length, state.page]);

  // Refresh function for pull-to-refresh
  const refreshPhotos = useCallback(async () => {
    console.log('Refreshing photos');
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const photos = generateMockPhotos().slice(0, 20);
      
      console.log('Photos refreshed:', { count: photos.length });
      
      setState(prev => ({ 
        ...prev, 
        photos, 
        loading: false,
        hasMore: true,
        page: 1
      }));
    } catch (error) {
      console.error('Error refreshing photos:', error);
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

  // Update filters function
  const updateFilters = useCallback((newFilters: Partial<GalleryFilters>) => {
    console.log('Updating filters:', newFilters);
    setState(prev => {
      const updatedFilters = {
        ...prev.filters,
        ...newFilters
      };
      console.log('New filter state:', updatedFilters);
      return {
        ...prev,
        filters: updatedFilters
      };
    });
  }, []);

  // Clear filters function
  const clearFilters = useCallback(() => {
    console.log('Clearing all filters');
    setState(prev => ({
      ...prev,
      filters: initialFilters
    }));
  }, []);

  // Check if any filter is active
  const isFiltersActive = useMemo(() => {
    return (
      state.filters.category.length > 0 ||
      !!state.filters.dateRange.start ||
      !!state.filters.dateRange.end ||
      state.filters.timeOfDay !== 'all' ||
      state.filters.sortBy !== 'newest' ||
      !!state.filters.vehiclePlate ||
      !!state.filters.searchQuery ||
      !!state.filters.brand ||
      !!state.filters.model ||
      !!state.filters.modelYear ||
      !!state.filters.manufacturingYear ||
      !!state.filters.color ||
      !!state.filters.city ||
      !!state.filters.fuelType ||
      !!state.filters.vehicleType
    );
  }, [state.filters]);

  // Enhanced filter and sort photos
  useEffect(() => {
    console.log('Applying filters:', state.filters);
    console.time('filterPhotos');
    
    let result = [...state.photos];
    const filterResults: { [key: string]: number } = {};

    // Apply vehicle plate filter
    if (state.filters.vehiclePlate) {
      const plateQuery = state.filters.vehiclePlate.toLowerCase();
      result = result.filter(photo => 
        photo.vehiclePlate?.toLowerCase().includes(plateQuery)
      );
      filterResults.plateFilter = result.length;
    }

    // Apply new vehicle filters
    if (state.filters.brand) {
      result = result.filter(photo => 
        photo.brand?.toLowerCase().includes(state.filters.brand!.toLowerCase())
      );
      filterResults.brandFilter = result.length;
    }

    if (state.filters.model) {
      result = result.filter(photo => 
        photo.model?.toLowerCase().includes(state.filters.model!.toLowerCase())
      );
      filterResults.modelFilter = result.length;
    }

    if (state.filters.color) {
      result = result.filter(photo => 
        photo.color?.toLowerCase().includes(state.filters.color!.toLowerCase())
      );
      filterResults.colorFilter = result.length;
    }

    if (state.filters.city) {
      result = result.filter(photo => 
        photo.city?.toLowerCase().includes(state.filters.city!.toLowerCase())
      );
      filterResults.cityFilter = result.length;
    }

    if (state.filters.fuelType) {
      result = result.filter(photo => 
        photo.fuelType?.toLowerCase().includes(state.filters.fuelType!.toLowerCase())
      );
      filterResults.fuelFilter = result.length;
    }

    if (state.filters.vehicleType) {
      result = result.filter(photo => 
        photo.vehicleType?.toLowerCase().includes(state.filters.vehicleType!.toLowerCase())
      );
      filterResults.vehicleTypeFilter = result.length;
    }

    if (state.filters.modelYear) {
      result = result.filter(photo => photo.modelYear === state.filters.modelYear);
      filterResults.modelYearFilter = result.length;
    }

    if (state.filters.manufacturingYear) {
      result = result.filter(photo => photo.manufacturingYear === state.filters.manufacturingYear);
      filterResults.manufacturingYearFilter = result.length;
    }

    // Apply existing filters
    if (state.filters.searchQuery) {
      const query = state.filters.searchQuery.toLowerCase();
      result = result.filter(photo =>
        photo.title?.toLowerCase().includes(query) ||
        photo.description?.toLowerCase().includes(query) ||
        photo.tags.some(tag => tag.toLowerCase().includes(query)) ||
        photo.vehiclePlate?.toLowerCase().includes(query)
      );
      filterResults.searchFilter = result.length;
    }

    if (state.filters.category.length > 0) {
      result = result.filter(photo => 
        state.filters.category.includes(photo.category)
      );
      filterResults.categoryFilter = result.length;
    }

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
      filterResults.timeFilter = result.length;
    }

    if (state.filters.dateRange.start || state.filters.dateRange.end) {
      result = result.filter(photo => {
        const photoDate = photo.timestamp;
        if (state.filters.dateRange.start && photoDate < state.filters.dateRange.start) {
          return false;
        }
        if (state.filters.dateRange.end && photoDate > state.filters.dateRange.end) {
          return false;
        }
        return true;
      });
      filterResults.dateFilter = result.length;
    }

    // Apply sorting
    console.time('sortPhotos');
    result.sort((a, b) => {
      switch (state.filters.sortBy) {
        case 'oldest':
          return a.timestamp.getTime() - b.timestamp.getTime();
        case 'mostViewed':
          return b.views - a.views;
        case 'mostLiked':
          return b.likes - a.likes;
        case 'newest':
        default:
          return b.timestamp.getTime() - a.timestamp.getTime();
      }
    });
    console.timeEnd('sortPhotos');

    console.log('Filter results:', filterResults);
    console.timeEnd('filterPhotos');

    setState(prev => ({
      ...prev,
      filteredPhotos: result
    }));
  }, [state.photos, state.filters]);

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
