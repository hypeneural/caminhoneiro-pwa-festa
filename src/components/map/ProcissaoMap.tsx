import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import { LatLngBounds, DivIcon, LatLng } from 'leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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

console.log('[ProcissaoMap] Component file loaded with static imports');

interface GeoJSONData {
  type: "FeatureCollection";
  features: any[];
}

// Simple map bounds component with error handling
const MapBounds: React.FC<{ routeData: GeoJSONData | null; pointData: GeoJSONData | null }> = ({ 
  routeData, 
  pointData 
}) => {
  const map = useMap();

  useEffect(() => {
    debugLog('MapBounds: Effect triggered', { routeData: !!routeData, pointData: !!pointData });
    
    if (!routeData || !pointData) {
      debugLog('MapBounds: Missing data');
      return;
    }

    try {
      const bounds = new LatLngBounds([]);
      
      // Add route coordinates to bounds
      routeData.features.forEach(feature => {
        if (feature.geometry?.type === 'LineString' && feature.geometry.coordinates) {
          feature.geometry.coordinates.forEach((coord: number[]) => {
            if (Array.isArray(coord) && coord.length >= 2) {
              bounds.extend(new LatLng(coord[1], coord[0]));
            }
          });
        }
      });

      // Add point coordinates to bounds
      pointData.features.forEach(feature => {
        if (feature.geometry?.type === 'Point' && feature.geometry.coordinates) {
          const coord = feature.geometry.coordinates;
          if (Array.isArray(coord) && coord.length >= 2) {
            bounds.extend(new LatLng(coord[1], coord[0]));
          }
        }
      });

      if (bounds.isValid()) {
        debugLog('MapBounds: Setting bounds');
        map.fitBounds(bounds, { padding: [20, 20] });
      } else {
        debugLog('MapBounds: Bounds not valid');
      }
    } catch (error) {
      errorLog('MapBounds: Error setting bounds', error);
    }
  }, [map, routeData, pointData]);

  return null;
};

const ProcissaoMap: React.FC = () => {
  debugLog('Component initializing');
  
  const [routeData, setRouteData] = useState<GeoJSONData | null>(null);
  const [pointData, setPointData] = useState<GeoJSONData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Stable toast reference 
  const toastFunction = useToast();
  const toastRef = useRef(toastFunction);
  toastRef.current = toastFunction;

  debugLog('State initialized', { loading, error, isOffline });

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      debugLog('Network: Online');
      setIsOffline(false);
    };
    const handleOffline = () => {
      debugLog('Network: Offline');
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch function with detailed logging
  const fetchGeoJSON = useCallback(async (url: string): Promise<GeoJSONData | null> => {
    debugLog(`Fetching GeoJSON from: ${url}`);
    
    try {
      const cacheKey = `geojson_${url}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached && isOffline) {
        debugLog('Using cached data (offline mode)');
        return JSON.parse(cached);
      }

      debugLog('Making network request...');
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      debugLog('GeoJSON data received', { 
        type: data?.type,
        features: data?.features?.length || 0 
      });
      
      // Validate GeoJSON structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response: not an object');
      }
      
      if (!data.features || !Array.isArray(data.features)) {
        throw new Error('Invalid GeoJSON: missing or invalid features array');
      }
      
      // Cache the data
      try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
        localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
        debugLog('Data cached successfully');
      } catch (cacheError) {
        debugLog('Cache error (non-critical)', cacheError);
      }
      
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
          toastRef.current.toast({
            title: "Mapa offline",
            description: "Exibindo dados em cache",
          });
          return cachedData;
        } catch (parseErr) {
          errorLog('Error parsing cached data', parseErr);
        }
      }
      
      throw err;
    }
  }, [isOffline]);

  // Load GeoJSON data
  useEffect(() => {
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
          debugLog('Data fetched successfully', {
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
  }, [fetchGeoJSON]);

  // Share functionality
  const handleShare = useCallback(async () => {
    debugLog('Share button clicked');
    try {
      if (!routeData) {
        debugLog('No route data for sharing');
        return;
      }

      const routeCoords = routeData.features
        .filter(f => f.geometry?.type === 'LineString')
        .flatMap(f => f.geometry?.coordinates || [])
        .map((coord: number[]) => `${coord[1]},${coord[0]}`)
        .join('|');

      const shareData = {
        title: 'Procissão de São Cristóvão - Rota',
        text: 'Acompanhe a rota da procissão de São Cristóvão',
        url: `https://www.google.com/maps/dir/${routeCoords}`
      };

      if (navigator.share) {
        await navigator.share(shareData);
        debugLog('Native share completed');
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toastRef.current.toast({
          title: "Link copiado!",
          description: "Link da rota copiado para a área de transferência",
        });
        debugLog('Clipboard share completed');
      }
    } catch (err) {
      errorLog('Error sharing', err);
      toastRef.current.toast({
        title: "Erro ao compartilhar",
        description: "Não foi possível compartilhar a rota",
        variant: "destructive"
      });
    }
  }, [routeData]);

  // Create icons with error handling
  const createTruckIcon = useCallback(() => {
    try {
      return new DivIcon({
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
    } catch (error) {
      errorLog('Error creating truck icon', error);
      return new DivIcon({
        html: '<div>📍</div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
    }
  }, []);

  const createChurchIcon = useCallback(() => {
    try {
      return new DivIcon({
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
    } catch (error) {
      errorLog('Error creating church icon', error);
      return new DivIcon({
        html: '<div>📍</div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
    }
  }, []);

  if (loading) {
    debugLog('Rendering: Loading state');
    return (
      <div className="w-full h-[50vh] rounded-lg overflow-hidden relative">
        <Skeleton className="w-full h-full" />
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Carregando mapa...</p>
        </div>
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
            onClick={() => {
              debugLog('Reload button clicked');
              window.location.reload();
            }}
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

  try {
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
                  try {
                    const isTruck = feature.properties?.type === 'truck';
                    const icon = isTruck ? createTruckIcon() : createChurchIcon();
                    return L.marker(latlng, { icon });
                  } catch (error) {
                    errorLog('Error creating marker', error);
                    return L.marker(latlng);
                  }
                }}
                onEachFeature={(feature, layer) => {
                  try {
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
                  } catch (error) {
                    errorLog('Error binding popup', error);
                  }
                }}
              />
            )}
            
            {/* Auto-fit bounds */}
            <MapBounds routeData={routeData} pointData={pointData} />
          </MapContainer>

          {/* Map controls overlay */}
          <div className="absolute top-2 right-2 z-[1000] space-y-2">
            {navigator.geolocation && (
              <Button
                size="sm"
                variant="secondary"
                className="bg-background/80 backdrop-blur-sm"
                onClick={() => {
                  debugLog('Location button clicked');
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      debugLog('Location obtained', position.coords);
                      toastRef.current.toast({
                        title: "Localização obtida",
                        description: "Sua posição foi identificada",
                      });
                    },
                    (error) => {
                      errorLog('Geolocation error', error);
                      toastRef.current.toast({
                        title: "Erro de localização",
                        description: "Não foi possível obter sua localização",
                        variant: "destructive"
                      });
                    }
                  );
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
  } catch (renderError) {
    errorLog('Render error', renderError);
    return (
      <div className="w-full h-[50vh] rounded-lg overflow-hidden bg-muted flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Erro ao renderizar o mapa</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Recarregar página
          </Button>
        </div>
      </div>
    );
  }
};

export default ProcissaoMap;