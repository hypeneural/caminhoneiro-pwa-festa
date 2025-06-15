import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Share2, MapPin, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

// Debug logging helper
const debugLog = (message: string, data?: any) => {
  console.log(`[ProcissaoMap] ${message}`, data || '');
};

// Error logging helper
const errorLog = (message: string, error?: any) => {
  console.error(`[ProcissaoMap ERROR] ${message}`, error || '');
};

console.log('[ProcissaoMap] Component file loaded');

interface GeoJSONData {
  type: string;
  features: any[];
}

interface MapLibraries {
  MapContainer: any;
  TileLayer: any;
  GeoJSON: any;
  useMap: any;
  LatLngBounds: any;
  DivIcon: any;
  LatLng: any;
  L: any;
}

const ProcissaoMap: React.FC = () => {
  debugLog('Component initializing');
  
  const [routeData, setRouteData] = useState<GeoJSONData | null>(null);
  const [pointData, setPointData] = useState<GeoJSONData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [mapLibraries, setMapLibraries] = useState<MapLibraries | null>(null);
  const [mapLoading, setMapLoading] = useState(true);
  
  // Stable references to avoid re-renders
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  debugLog('State initialized', { loading, error, isOffline, mapLoading });

  // Load map libraries
  useEffect(() => {
    const loadMapLibraries = async () => {
      try {
        debugLog('Loading map libraries...');
        
        // Import CSS first
        try {
          debugLog('Importing leaflet CSS...');
          await import('leaflet/dist/leaflet.css');
          debugLog('Leaflet CSS imported successfully');
        } catch (cssError) {
          debugLog('CSS import error (non-critical)', cssError);
        }

        debugLog('Importing react-leaflet...');
        const reactLeaflet = await import('react-leaflet');
        
        debugLog('Importing leaflet...');
        const leaflet = await import('leaflet');
        
        debugLog('All libraries imported, setting up...');
        
        const libraries: MapLibraries = {
          MapContainer: reactLeaflet.MapContainer,
          TileLayer: reactLeaflet.TileLayer,
          GeoJSON: reactLeaflet.GeoJSON,
          useMap: reactLeaflet.useMap,
          LatLngBounds: leaflet.LatLngBounds,
          DivIcon: leaflet.DivIcon,
          LatLng: leaflet.LatLng,
          L: leaflet.default || leaflet,
        };
        
        debugLog('Libraries setup complete');
        setMapLibraries(libraries);
        setMapLoading(false);
        
      } catch (err) {
        errorLog('Failed to load map libraries', err);
        setError('Erro ao carregar componentes do mapa');
        setMapLoading(false);
      }
    };

    loadMapLibraries();
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Stable fetch function without toast dependency
  const fetchGeoJSON = useCallback(async (url: string): Promise<GeoJSONData | null> => {
    debugLog(`Fetching GeoJSON from: ${url}`);
    
    try {
      // Try cache first
      const cacheKey = `geojson_${url}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached && isOffline) {
        debugLog('Using cached data (offline mode)');
        return JSON.parse(cached);
      }

      debugLog('Making network request...');
      const response = await fetch(url);
      
      if (!response.ok) {
        errorLog(`HTTP error! status: ${response.status}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      debugLog('GeoJSON data received', { features: data?.features?.length || 0 });
      
      // Validate GeoJSON structure
      if (!data || !data.features || !Array.isArray(data.features)) {
        errorLog('Invalid GeoJSON structure', data);
        throw new Error('Invalid GeoJSON structure');
      }
      
      // Cache the data
      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
      debugLog('Data cached successfully');
      
      return data;
    } catch (err) {
      errorLog(`Error fetching ${url}`, err);
      
      // Try to return cached data if available
      const cacheKey = `geojson_${url}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        debugLog('Falling back to cached data');
        try {
          const cachedData = JSON.parse(cached);
          toastRef.current({
            title: "Mapa offline",
            description: "Exibindo dados em cache",
            variant: "default"
          });
          return cachedData;
        } catch (parseErr) {
          errorLog('Error parsing cached data', parseErr);
        }
      }
      
      throw err;
    }
  }, [isOffline]);

  // Load GeoJSON data only once
  useEffect(() => {
    if (mapLoading || !mapLibraries) {
      debugLog('Waiting for map libraries to load...');
      return;
    }

    debugLog('useEffect: Starting data load');
    let mounted = true;
    
    const loadData = async () => {
      if (!mounted) {
        debugLog('Component unmounted, skipping load');
        return;
      }
      
      debugLog('Setting loading state');
      setLoading(true);
      setError(null);

      try {
        debugLog('Starting parallel fetch of route and point data');
        const [route, point] = await Promise.all([
          fetchGeoJSON('https://hypeneural.com/caminhao/geojson.php?f=1'),
          fetchGeoJSON('https://hypeneural.com/caminhao/geojson.php?f=2')
        ]);

        if (mounted) {
          debugLog('Data fetched successfully, updating state', {
            routeFeatures: route?.features?.length || 0,
            pointFeatures: point?.features?.length || 0
          });
          setRouteData(route);
          setPointData(point);
        } else {
          debugLog('Component unmounted during fetch, discarding data');
        }
      } catch (err) {
        errorLog('Error in loadData', err);
        if (mounted) {
          setError('Erro ao carregar dados do mapa');
          errorLog('Setting error state', err);
        }
      } finally {
        if (mounted) {
          debugLog('Setting loading to false');
          setLoading(false);
        }
      }
    };

    loadData();
    
    return () => {
      debugLog('useEffect cleanup');
      mounted = false;
    };
  }, [mapLoading, mapLibraries, fetchGeoJSON]);

  // Share functionality
  const handleShare = useCallback(async () => {
    try {
      if (!routeData) return;

      const routeCoords = routeData.features
        .filter(f => f.geometry.type === 'LineString')
        .flatMap(f => f.geometry.coordinates)
        .map((coord: number[]) => `${coord[1]},${coord[0]}`)
        .join('|');

      const shareData = {
        title: 'Procissão de São Cristóvão - Rota',
        text: 'Acompanhe a rota da procissão de São Cristóvão',
        url: `https://www.google.com/maps/dir/${routeCoords}`
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: "Link copiado!",
          description: "Link da rota copiado para a área de transferência",
        });
      }
    } catch (err) {
      console.error('Error sharing:', err);
      toast({
        title: "Erro ao compartilhar",
        description: "Não foi possível compartilhar a rota",
        variant: "destructive"
      });
    }
  }, [routeData, toast]);

  if (mapLoading) {
    debugLog('Rendering: Map libraries loading');
    return (
      <div className="w-full h-[50vh] rounded-lg overflow-hidden">
        <Skeleton className="w-full h-full" />
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  if (!mapLibraries) {
    debugLog('Rendering: Map libraries failed to load');
    return (
      <div className="w-full h-[50vh] rounded-lg overflow-hidden bg-muted flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Erro ao carregar mapa</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    debugLog('Rendering: Data loading');
    return (
      <div className="w-full h-[50vh] rounded-lg overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (error && !routeData && !pointData) {
    debugLog('Rendering: Error state');
    return (
      <div className="w-full h-[50vh] rounded-lg overflow-hidden bg-muted flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  debugLog('Rendering: Map with data', { 
    routeFeatures: routeData?.features?.length || 0,
    pointFeatures: pointData?.features?.length || 0
  });

  const { MapContainer, TileLayer, GeoJSON, LatLngBounds, DivIcon, LatLng, L } = mapLibraries;

  // Create icons
  const createTruckIcon = () => new DivIcon({
    html: `
      <div style="
        font-size: 24px;
        text-align: center;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
      ">🚛</div>
    `,
    className: 'custom-truck-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  const createChurchIcon = () => new DivIcon({
    html: `
      <div style="
        font-size: 20px;
        text-align: center;
        background: rgb(30, 58, 138);
        color: white;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
      ">⛪</div>
    `,
    className: 'custom-church-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 }}
      className="space-y-4"
    >
      {/* Status indicator */}
      {isOffline && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-center">
          <p className="text-xs text-yellow-800">
            📴 Modo offline - Exibindo dados em cache
          </p>
        </div>
      )}

      {/* Map Container */}
      <div className="w-full h-[50vh] rounded-lg overflow-hidden relative">
        <MapContainer
          center={[-27.236, -48.644]}
          zoom={13}
          className="w-full h-full"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© OpenStreetMap contributors'
          />
          
          {/* Route GeoJSON */}
          {routeData && (
            <GeoJSON
              data={routeData}
              style={{
                color: '#e63946',
                weight: 6,
                opacity: 0.8,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
          )}
          
          {/* Point GeoJSON */}
          {pointData && (
            <GeoJSON
              data={pointData}
              pointToLayer={(feature, latlng) => {
                const isTruck = feature.properties?.type === 'truck';
                const icon = isTruck ? createTruckIcon() : createChurchIcon();
                return L.marker(latlng, { icon });
              }}
              onEachFeature={(feature, layer) => {
                if (feature.properties) {
                  const { name, description, type } = feature.properties;
                  const emoji = type === 'truck' ? '🚛' : '⛪';
                  layer.bindPopup(`
                    <div class="text-center">
                      <div class="text-lg mb-1">${emoji}</div>
                      <div class="font-semibold">${name || 'Local'}</div>
                      ${description ? `<div class="text-sm text-gray-600">${description}</div>` : ''}
                    </div>
                  `);
                }
              }}
            />
          )}
        </MapContainer>

        {/* Map controls overlay */}
        <div className="absolute top-2 right-2 z-[1000] space-y-2">
          {navigator.geolocation && (
            <Button
              size="sm"
              variant="secondary"
              className="bg-background/80 backdrop-blur-sm"
              onClick={() => {
                navigator.geolocation.getCurrentPosition((position) => {
                  toast({
                    title: "Localização obtida",
                    description: "Sua posição foi identificada",
                  });
                });
              }}
            >
              <Navigation className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Share button */}
      <div className="flex justify-center">
        <Button
          onClick={handleShare}
          variant="outline"
          className="gap-2"
          disabled={!routeData}
          aria-label="Compartilhar rota da procissão"
        >
          <Share2 className="w-4 h-4" />
          Compartilhar Rota
        </Button>
      </div>
    </motion.div>
  );
};

export default ProcissaoMap;