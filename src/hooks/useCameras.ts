import { useState, useEffect, useCallback, useMemo } from 'react';
import { CameraStream, CameraFilters, CameraState, CameraStats } from '@/types/camera';
import { mockCameras } from '@/data';
import { APP_CONFIG } from '@/constants';

const initialState: CameraState = {
  streams: [],
  filters: {},
  selectedCamera: null,
  loading: false,
  error: null,
  autoRefresh: true,
  refreshInterval: APP_CONFIG.REFRESH_INTERVALS.CAMERAS
};

export function useCameras() {
  const [state, setState] = useState<CameraState>(initialState);

  // Load cameras data
  const loadCameras = useCallback(async (filters?: CameraFilters) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 400));
      
      let filteredCameras = [...mockCameras];
      
      // Apply filters
      if (filters?.category) {
        filteredCameras = filteredCameras.filter(camera => 
          camera.category === filters.category
        );
      }
      
      if (filters?.isLive !== undefined) {
        filteredCameras = filteredCameras.filter(camera => 
          camera.isLive === filters.isLive
        );
      }
      
      if (filters?.hasAudio !== undefined) {
        filteredCameras = filteredCameras.filter(camera => 
          camera.hasAudio === filters.hasAudio
        );
      }
      
      if (filters?.quality?.length) {
        filteredCameras = filteredCameras.filter(camera => 
          filters.quality!.includes(camera.quality)
        );
      }
      
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredCameras = filteredCameras.filter(camera =>
          camera.name.toLowerCase().includes(searchTerm) ||
          camera.location.toLowerCase().includes(searchTerm) ||
          camera.description.toLowerCase().includes(searchTerm)
        );
      }
      
      // Apply sorting
      if (filters?.sortBy) {
        filteredCameras.sort((a, b) => {
          const order = filters.sortOrder === 'desc' ? -1 : 1;
          
          switch (filters.sortBy) {
            case 'priority':
              return order * (a.priority - b.priority);
            case 'viewers':
              return order * (b.viewers - a.viewers);
            case 'name':
              return order * a.name.localeCompare(b.name);
            case 'uptime':
              // Simplified uptime comparison
              return order * a.uptime.localeCompare(b.uptime);
            default:
              return 0;
          }
        });
      } else {
        // Default sort by priority
        filteredCameras.sort((a, b) => a.priority - b.priority);
      }
      
      setState(prev => ({
        ...prev,
        streams: filteredCameras,
        filters: filters || {},
        loading: false
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar câmeras'
      }));
    }
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<CameraFilters>) => {
    const updatedFilters = { ...state.filters, ...newFilters };
    loadCameras(updatedFilters);
  }, [state.filters, loadCameras]);

  // Clear filters
  const clearFilters = useCallback(() => {
    loadCameras();
  }, [loadCameras]);

  // Select camera
  const selectCamera = useCallback((camera: CameraStream | null) => {
    setState(prev => ({
      ...prev,
      selectedCamera: camera
    }));
  }, []);

  // Toggle auto refresh
  const toggleAutoRefresh = useCallback(() => {
    setState(prev => ({
      ...prev,
      autoRefresh: !prev.autoRefresh
    }));
  }, []);

  // Set refresh interval
  const setRefreshInterval = useCallback((interval: number) => {
    setState(prev => ({
      ...prev,
      refreshInterval: interval
    }));
  }, []);

  // Get live cameras
  const liveCameras = useMemo(() => 
    state.streams.filter(camera => camera.isLive),
    [state.streams]
  );

  // Get offline cameras
  const offlineCameras = useMemo(() => 
    state.streams.filter(camera => !camera.isLive),
    [state.streams]
  );

  // Get cameras by category
  const getCamerasByCategory = useCallback((category: string) => 
    state.streams.filter(camera => camera.category === category),
    [state.streams]
  );

  // Get camera statistics
  const stats: CameraStats = useMemo(() => {
    const totalViewers = state.streams.reduce((sum, camera) => sum + camera.viewers, 0);
    const popularCamera = state.streams.reduce((prev, current) => 
      current.viewers > prev.viewers ? current : prev, state.streams[0] || null
    );
    
    // Calculate average uptime (simplified)
    const uptimes = state.streams
      .filter(camera => camera.isLive)
      .map(camera => camera.uptime);
    const averageUptime = uptimes.length > 0 ? uptimes[0] : '0m'; // Simplified calculation
    
    return {
      totalCameras: state.streams.length,
      liveCameras: liveCameras.length,
      totalViewers,
      averageUptime,
      popularCamera
    };
  }, [state.streams, liveCameras.length]);

  // Check if filters are active
  const isFiltersActive = useMemo(() => 
    Object.keys(state.filters).length > 0 &&
    Object.values(state.filters).some(value => 
      value !== undefined && value !== '' && 
      (Array.isArray(value) ? value.length > 0 : true)
    ),
    [state.filters]
  );

  // Get camera by ID
  const getCameraById = useCallback((id: string) => 
    state.streams.find(camera => camera.id === id),
    [state.streams]
  );

  // Auto refresh effect
  useEffect(() => {
    if (!state.autoRefresh) return;
    
    const interval = setInterval(() => {
      if (!state.loading) {
        loadCameras(state.filters);
      }
    }, state.refreshInterval);
    
    return () => clearInterval(interval);
  }, [state.autoRefresh, state.refreshInterval, state.loading, state.filters, loadCameras]);

  // Initial load
  useEffect(() => {
    loadCameras();
  }, [loadCameras]);

  return {
    // State
    cameras: state.streams,
    filters: state.filters,
    selectedCamera: state.selectedCamera,
    loading: state.loading,
    error: state.error,
    autoRefresh: state.autoRefresh,
    refreshInterval: state.refreshInterval,
    
    // Computed
    liveCameras,
    offlineCameras,
    stats,
    isFiltersActive,
    
    // Actions
    loadCameras,
    updateFilters,
    clearFilters,
    selectCamera,
    toggleAutoRefresh,
    setRefreshInterval,
    getCamerasByCategory,
    getCameraById,
    
    // Utils
    refresh: () => loadCameras(state.filters)
  };
}