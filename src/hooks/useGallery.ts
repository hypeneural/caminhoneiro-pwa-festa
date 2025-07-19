import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Photo, GalleryFilters, GalleryState, convertAPIPhotoToPhoto, FilterOptions } from '@/types/gallery';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import galleryService, { GalleryFilters as APIFilters } from '@/services/api/galleryService';

// Estado inicial otimizado com todas as propriedades necessárias
const initialFilters: GalleryFilters = {
  // Filtros da API
  page: 1,
  limit: 20, // Será ajustado dinamicamente
  ordenar_por: 'data_desc',
  
  // Filtros da API real
  destaque: undefined,
  periodo_dia: undefined,
  id_grupo_whatsapp: undefined,
  data_evento: undefined,
  data_inicio: undefined,
  data_fim: undefined,
  vehicle_plate: undefined,
  vehicle_brand_id: undefined,
  vehicle_model_id: undefined,
  vehicle_category_id: undefined,
  vehicle_year: undefined,
  vehicle_color: undefined,
  
  // Filtros legados para compatibilidade (evitar undefined)
  category: [],
  dateRange: {},
  timeOfDay: 'all',
  sortBy: 'newest',
  searchQuery: '',
  vehiclePlate: '',
  brand: '',
  model: '',
  modelYear: '',
  manufacturingYear: '',
  color: '',
  city: '',
  fuelType: '',
  vehicleType: '',
  specificDate: undefined,
  timeRange: {},
  showFeaturedOnly: false,
  tagCategory: 'all'
};

const initialState: Omit<GalleryState, 'favorites'> = {
  photos: [],
  filteredPhotos: [],
  loading: false,
  error: null,
  selectedPhoto: null,
  lightboxOpen: false,
  filters: initialFilters,
  viewMode: 'grid',
  hasMore: true,
  page: 1,
  isRefreshing: false,
  isLoadingMore: false,
  networkQuality: 'fast',
  cacheStatus: 'cold',
  totalPhotos: 0 // Total da API
};

export const useGallery = () => {
  const [favorites, setFavorites] = useLocalStorage<string[]>('gallery-favorites', []);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [state, setState] = useState<Omit<GalleryState, 'favorites'>>(initialState);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);

  // Refs para controle de performance
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRequestTimeRef = useRef<number>(0);

  // Detecta qualidade da rede para otimizar requests
  const networkQuality = useMemo((): 'slow' | 'medium' | 'fast' => {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection && connection.effectiveType) {
        const type = connection.effectiveType;
        if (type === '2g' || type === 'slow-2g') return 'slow';
        if (type === '3g') return 'medium';
      }
    }
    return 'fast';
  }, []);

  // Atualiza qualidade da rede no state
  useEffect(() => {
    setState(prev => ({ ...prev, networkQuality }));
  }, [networkQuality]);

  // Converte filtros do formato legado para API
  const convertFiltersToAPI = useCallback((filters: GalleryFilters): APIFilters => {
    const apiFilters: APIFilters = {
      page: filters.page || 1,
      limit: filters.limit,
      ordenar_por: filters.ordenar_por || 'data_desc'
    };

    // Mapeia filtros legados para API
    if (filters.destaque !== undefined) apiFilters.destaque = filters.destaque;
    if (filters.periodo_dia) apiFilters.periodo_dia = filters.periodo_dia;
    if (filters.id_grupo_whatsapp) apiFilters.id_grupo_whatsapp = filters.id_grupo_whatsapp;
    if (filters.data_evento) apiFilters.data_evento = filters.data_evento;
    if (filters.data_inicio) apiFilters.data_inicio = filters.data_inicio;
    if (filters.data_fim) apiFilters.data_fim = filters.data_fim;
    if (filters.vehicle_plate) apiFilters.vehicle_plate = filters.vehicle_plate;
    if (filters.vehicle_brand_id) apiFilters.vehicle_brand_id = filters.vehicle_brand_id;
    if (filters.vehicle_model_id) apiFilters.vehicle_model_id = filters.vehicle_model_id;
    if (filters.vehicle_category_id) apiFilters.vehicle_category_id = filters.vehicle_category_id;
    if (filters.vehicle_year) apiFilters.vehicle_year = filters.vehicle_year;
    if (filters.vehicle_color) apiFilters.vehicle_color = filters.vehicle_color;

    // Converte filtros legados
    if (filters.showFeaturedOnly) apiFilters.destaque = true;
    if (filters.vehiclePlate) apiFilters.vehicle_plate = filters.vehiclePlate;

    // Adiciona filtro de tag selecionada
    if (selectedTagId) apiFilters.id_grupo_whatsapp = selectedTagId;

    // Converte dateRange para data_inicio/data_fim
    if (filters.dateRange?.start) {
      apiFilters.data_inicio = filters.dateRange.start.toISOString().split('T')[0];
    }
    if (filters.dateRange?.end) {
      apiFilters.data_fim = filters.dateRange.end.toISOString().split('T')[0];
    }

    // Converte timeOfDay para periodo_dia
    if (filters.timeOfDay && filters.timeOfDay !== 'all') {
      const timeMap = {
        'morning': 'MANHA' as const,
        'afternoon': 'TARDE' as const,
        'evening': 'NOITE' as const
      };
      apiFilters.periodo_dia = timeMap[filters.timeOfDay];
    }

    // Converte sortBy para ordenar_por
    if (filters.sortBy && filters.sortBy !== 'newest') {
      const sortMap = {
        'oldest': 'data_asc' as const,
        'mostViewed': 'views_desc' as const,
        'mostLiked': 'destaque_desc' as const
      };
      apiFilters.ordenar_por = sortMap[filters.sortBy] || 'data_desc';
    }

    return apiFilters;
  }, [selectedTagId]);

  // Cancela requisições pendentes
  const cancelPendingRequests = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
  }, []);

  // Carrega opções de filtros da API
  const loadFilterOptions = useCallback(async () => {
    try {
      const options = await galleryService.getFilterOptions();
      setFilterOptions(options);
    } catch (error) {
      console.error('❌ Erro ao carregar opções de filtros:', error);
    }
  }, []);

  // Carrega fotos da API
  const loadPhotos = useCallback(async (filters: GalleryFilters, append = false) => {
    // Evita múltiplos requests simultâneos
    if (state.loading && !append) return;
    if (append && state.isLoadingMore) {
      console.log('❌ Já está carregando mais fotos, ignorando...');
      return;
    }
    
    console.log(`📡 LoadPhotos iniciado:`, { 
      page: filters.page, 
      append, 
      loading: state.loading, 
      isLoadingMore: state.isLoadingMore 
    });
    
    try {
      cancelPendingRequests();
      
      setState(prev => ({ 
        ...prev, 
        loading: !append,
        isLoadingMore: append,
        error: null 
      }));
      
      // Converte filtros para formato da API
      const apiFilters = convertFiltersToAPI(filters);
      
      const response = await galleryService.getPhotos(apiFilters);
      
      if (response.status === 'success') {
        // A API retorna 'thumbs' no endpoint /thumbs e 'photos' no endpoint /galeria
        const apiPhotos = response.data.thumbs || response.data.photos || [];
        const convertedPhotos = apiPhotos.map(convertAPIPhotoToPhoto);
        
        setState(prev => {
          const newPhotos = append 
            ? [...prev.photos, ...convertedPhotos]
            : convertedPhotos;
          
          // Lógica mais robusta para hasMore
          const pagination = response.data.pagination;
          const hasMorePages = pagination?.links?.proxima_pagina !== null;
          const currentPage = pagination?.pagina_atual || 1;
          const totalPages = pagination?.total_paginas || 1;
          const hasMoreByPages = currentPage < totalPages;
          
          // Debug para investigar problema de paginação
          console.log('📄 Paginação Debug:', {
            currentPage,
            totalPages,
            hasMorePages,
            hasMoreByPages,
            newPhotosLength: newPhotos.length,
            convertedPhotosLength: convertedPhotos.length,
            totalRegistros: pagination?.total_registros_filtrados,
            append,
            proximaPaginaLink: pagination?.links?.proxima_pagina,
            currentState: {
              oldPhotosLength: prev.photos.length,
              oldHasMore: prev.hasMore,
              oldPage: prev.page
            }
          });
          
          return {
            ...prev,
            photos: newPhotos,
            filteredPhotos: newPhotos,
            hasMore: hasMorePages || hasMoreByPages, // Dupla verificação
            page: currentPage,
            totalPhotos: pagination?.total_registros_filtrados || 0,
            loading: false,
            isLoadingMore: false,
            cacheStatus: 'warm'
          };
        });

      } else {
        throw new Error(response.message || 'Erro ao carregar fotos');
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar fotos:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        isLoadingMore: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
    } finally {
      // Garantia de que loading states sejam resetados
      setTimeout(() => {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          isLoadingMore: false 
        }));
      }, 5000); // 5s timeout safety
    }
  }, [state.loading, state.isLoadingMore, cancelPendingRequests, convertFiltersToAPI]);

  // Atualiza filtros
  const updateFilters = useCallback((newFilters: Partial<GalleryFilters>) => {
    setState(prev => {
      const updatedFilters = { ...prev.filters, ...newFilters };
      return { ...prev, filters: updatedFilters };
    });

    // Recarrega fotos com novos filtros
    const mergedFilters = { ...state.filters, ...newFilters, page: 1 };
    loadPhotos(mergedFilters, false);
  }, [state.filters, loadPhotos]);

  // Limpa filtros
  const clearFilters = useCallback(() => {
    const clearedFilters = { ...initialFilters };
    setSelectedTagId(null);
    setState(prev => ({ ...prev, filters: clearedFilters }));
    loadPhotos(clearedFilters, false);
  }, [loadPhotos]);

  // Seleciona tag para filtrar
  const selectTag = useCallback((tagId: number | null) => {
    setSelectedTagId(tagId);
  }, []);

  // Carrega mais fotos (infinite scroll) - melhorado
  const loadMorePhotos = useCallback(() => {
    console.log('🔄 LoadMorePhotos chamado:', {
      hasMore: state.hasMore,
      isLoadingMore: state.isLoadingMore,
      loading: state.loading,
      currentPage: state.page,
      photosLength: state.photos.length,
      totalPhotos: state.totalPhotos
    });
    
    if (state.hasMore && !state.isLoadingMore && !state.loading) {
      const nextPage = (state.page || 1) + 1;
      const nextPageFilters = { 
        ...state.filters, 
        page: nextPage
      };
      
      console.log('🚀 Carregando página:', nextPage);
      loadPhotos(nextPageFilters, true);
    } else {
      console.log('❌ LoadMore bloqueado:', {
        hasMore: state.hasMore,
        isLoadingMore: state.isLoadingMore,
        loading: state.loading
      });
    }
  }, [state.hasMore, state.isLoadingMore, state.loading, state.filters, state.page, state.photos.length, state.totalPhotos, loadPhotos]);

  // Recarrega fotos (pull to refresh)
  const refreshPhotos = useCallback(async () => {
    setState(prev => ({ ...prev, isRefreshing: true }));
    
    try {
      await loadFilterOptions(); // Atualiza opções de filtros também
      await loadPhotos({ ...state.filters, page: 1 }, false);
    } finally {
      setState(prev => ({ ...prev, isRefreshing: false }));
    }
  }, [state.filters, loadPhotos, loadFilterOptions]);

  // Abre lightbox
  const openLightbox = useCallback((photo: Photo) => {
    setState(prev => ({ 
      ...prev, 
      selectedPhoto: photo, 
      lightboxOpen: true 
    }));
  }, []);

  // Fecha lightbox
  const closeLightbox = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      selectedPhoto: null, 
      lightboxOpen: false 
    }));
  }, []);

  // Navega no lightbox
  const navigatePhoto = useCallback((direction: 'prev' | 'next') => {
    if (!state.selectedPhoto) return;
    
    const currentIndex = state.filteredPhotos.findIndex(
      photo => photo.id === state.selectedPhoto!.id
    );
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : state.filteredPhotos.length - 1;
    } else {
      newIndex = currentIndex < state.filteredPhotos.length - 1 ? currentIndex + 1 : 0;
    }
    
    setState(prev => ({ 
      ...prev, 
      selectedPhoto: prev.filteredPhotos[newIndex] 
    }));
  }, [state.selectedPhoto, state.filteredPhotos]);

  // Adiciona/remove favorito
  const toggleFavorite = useCallback((photoId: string) => {
    if (favorites.includes(photoId)) {
      setFavorites(prev => prev.filter(id => id !== photoId));
    } else {
      setFavorites(prev => [...prev, photoId]);
    }
  }, [favorites, setFavorites]);

  // Verifica se há filtros ativos
  const isFiltersActive = useMemo(() => {
    return selectedTagId !== null || 
           Object.entries(state.filters).some(([key, value]) => {
             if (key === 'page' || key === 'limit' || key === 'ordenar_por') return false;
             return value !== undefined && value !== null && value !== '' && 
                    (Array.isArray(value) ? value.length > 0 : true);
           });
  }, [state.filters, selectedTagId]);

  // Carregamento inicial de filtros
  useEffect(() => {
    console.log('🚀 Carregando opções de filtros...');
    loadFilterOptions();
    
    return () => {
      cancelPendingRequests();
    };
  }, []); // Roda apenas uma vez

  // Carregamento de fotos quando filtros ou tag mudam
  useEffect(() => {
    if (!filterOptions) return; // Aguarda filtros carregarem
    
    if (selectedTagId !== null) {
      // Tag foi selecionada, recarregar fotos
      console.log('🏷️ Tag selecionada, recarregando fotos:', selectedTagId);
      const newFilters = { ...state.filters, page: 1 };
      loadPhotos(newFilters, false);
    } else if (state.photos.length === 0 && !state.loading) {
      // Carregamento inicial (sem tag)
      console.log('📸 Carregando fotos iniciais (sem tag selecionada)');
      loadPhotos(state.filters, false);
    }
  }, [filterOptions, selectedTagId]); // Executa quando filterOptions carrega ou tag muda

  // Limpeza ao desmontar
  useEffect(() => {
    return () => {
      cancelPendingRequests();
    };
  }, [cancelPendingRequests]);

  return {
    // Estado
    ...state,
    favorites,
    filterOptions,
    selectedTagId,
    filters: state.filters,
    
    // Actions
    updateFilters,
    clearFilters,
    selectTag,
    loadMorePhotos,
    refreshPhotos,
    openLightbox,
    closeLightbox,
    navigatePhoto,
    toggleFavorite,
    
    // Computed
    isFiltersActive,
    
    // Debug
    cacheStats: galleryService.getCacheStats(),
  };
};
