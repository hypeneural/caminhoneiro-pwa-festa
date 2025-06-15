import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import { LatLngBounds, DivIcon, LatLng, Marker } from 'leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Share2, MapPin, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import type { GeoJsonObject } from 'geojson';

interface GeoJSONData extends GeoJsonObject {
  features: any[];
}

interface MapBoundsProps {
  routeData: GeoJSONData | null;
  pointData: GeoJSONData | null;
}

// Component to handle map bounds
const MapBounds: React.FC<MapBoundsProps> = ({ routeData, pointData }) => {
  const map = useMap();

  useEffect(() => {
    if (!routeData || !pointData) return;

    const bounds = new LatLngBounds([]);
    
    // Add route coordinates to bounds
    routeData.features.forEach(feature => {
      if (feature.geometry.type === 'LineString') {
        feature.geometry.coordinates.forEach((coord: number[]) => {
          bounds.extend(new LatLng(coord[1], coord[0]));
        });
      }
    });

    // Add point coordinates to bounds
    pointData.features.forEach(feature => {
      if (feature.geometry.type === 'Point') {
        const coord = feature.geometry.coordinates;
        bounds.extend(new LatLng(coord[1], coord[0]));
      }
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [map, routeData, pointData]);

  return null;
};

const ProcissaoMap: React.FC = () => {
  const [routeData, setRouteData] = useState<GeoJSONData | null>(null);
  const [pointData, setPointData] = useState<GeoJSONData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const { toast } = useToast();

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

  // Fetch GeoJSON data with caching
  const fetchGeoJSON = useCallback(async (url: string): Promise<GeoJSONData | null> => {
    try {
      // Try cache first
      const cacheKey = `geojson_${url}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached && isOffline) {
        return JSON.parse(cached);
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache the data
      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
      
      return data;
    } catch (err) {
      console.error(`Error fetching ${url}:`, err);
      
      // Try to return cached data if available
      const cacheKey = `geojson_${url}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        toast({
          title: "Mapa offline",
          description: "Exibindo dados em cache",
          variant: "default"
        });
        return JSON.parse(cached);
      }
      
      throw err;
    }
  }, [isOffline, toast]);

  // Load GeoJSON data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [route, point] = await Promise.all([
          fetchGeoJSON('https://hypeneural.com/caminhao/geojson.php?f=1'),
          fetchGeoJSON('https://hypeneural.com/caminhao/geojson.php?f=2')
        ]);

        setRouteData(route);
        setPointData(point);
      } catch (err) {
        setError('Erro ao carregar dados do mapa');
        console.error('Error loading map data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchGeoJSON]);

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

  // Custom truck icon
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

  // Custom church icon
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

  if (loading) {
    return (
      <div className="w-full h-[50vh] rounded-lg overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (error && !routeData && !pointData) {
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