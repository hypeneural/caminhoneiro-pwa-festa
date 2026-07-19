import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { LatLngBounds, DivIcon, LatLng } from 'leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Share2, MapPin, Navigation, Truck, Church, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ProcessedTrackerData } from '@/types/tracker';

// Debug logging
const debugLog = (message: string, data?: any) => {
  console.log(`[EnhancedProcissaoMap] ${message}`, data || '');
};

const errorLog = (message: string, error?: any) => {
  console.error(`[EnhancedProcissaoMap] ${message}`, error || '');
};

// Interfaces
interface GeoJSONData {
  type: string;
  features: any[];
}

interface EnhancedProcissaoMapProps {
  trackerData: ProcessedTrackerData;
  height?: string;
  showControls?: boolean;
}

// Create custom truck icon for real-time position
const createLiveTruckIcon = (course: number = 0, isMoving: boolean = false) => {
  const size = isMoving ? 40 : 35;
  const color = isMoving ? '#22c55e' : '#3b82f6';
  
  const truckSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
      <path d="M19 18h2a1 1 0 0 0 1-1v-5.14a1 1 0 0 0-.29-.71l-4.4-4.44A1 1 0 0 0 15.6 6H14"/>
      <circle cx="7.5" cy="18.5" r="2.5"/>
      <circle cx="16.5" cy="18.5" r="2.5"/>
    </svg>
  `;

  const parkingSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2"/>
      <path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>
    </svg>
  `;

  return new DivIcon({
    html: `
      <div style="
        transform: rotate(${course}deg);
        transition: transform 0.3s ease, background-color 0.3s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
      ">
        <div style="
          background-color: ${color};
          color: white;
          border-radius: 50%;
          width: ${size}px;
          height: ${size}px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2.5px solid white;
          margin-bottom: 2px;
          ${isMoving ? 'animation: live-bounce 2s infinite;' : ''}
        ">
          ${isMoving ? truckSvg : parkingSvg}
        </div>
        <div style="
          width: 8px;
          height: 8px;
          background-color: ${color};
          border-radius: 50%;
          border: 2px solid white;
          ${isMoving ? 'animation: live-pulse 2s infinite;' : ''}
        "></div>
      </div>
      <style>
        @keyframes live-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes live-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      </style>
    `,
    className: 'live-truck-marker',
    iconSize: [size + 10, size + 20],
    iconAnchor: [size / 2 + 5, size + 15],
    popupAnchor: [0, -(size + 10)]
  });
};

// Create church icon for route points
const createChurchIcon = () => {
  return new DivIcon({
    html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
      ">
        <div style="
          background-color: #dc2626;
          color: white;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          margin-bottom: 2px;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m12 3-8 8V21h16V11l-8-8z"/>
            <path d="M12 2v2"/>
            <path d="M11 3h2"/>
            <path d="M10 17v4h4v-4H10z"/>
            <path d="M8 12h8"/>
          </svg>
        </div>
        <div style="
          width: 6px;
          height: 6px;
          background-color: #dc2626;
          border-radius: 50%;
          border: 2px solid white;
        "></div>
      </div>
    `,
    className: 'church-marker',
    iconSize: [36, 40],
    iconAnchor: [18, 34],
    popupAnchor: [0, -30]
  });
};

// Component to auto-fit map bounds
const MapBounds: React.FC<{ 
  routeData: GeoJSONData | null; 
  pointData: GeoJSONData | null;
  trackerData: ProcessedTrackerData;
}> = ({ routeData, pointData, trackerData }) => {
  const map = useMap();
  
  useEffect(() => {
    try {
      const bounds = new LatLngBounds([]);
      let hasBounds = false;

      // Add tracker position
      if (trackerData.latitude && trackerData.longitude) {
        bounds.extend([trackerData.latitude, trackerData.longitude]);
        hasBounds = true;
      }

      // Add route bounds
      if (routeData?.features) {
        routeData.features.forEach((feature) => {
          if (feature.geometry?.coordinates) {
            feature.geometry.coordinates.forEach((coord: number[]) => {
              bounds.extend([coord[1], coord[0]]);
              hasBounds = true;
            });
          }
        });
      }

      // Add point bounds
      if (pointData?.features) {
        pointData.features.forEach((feature) => {
          if (feature.geometry?.coordinates) {
            const [lng, lat] = feature.geometry.coordinates;
            bounds.extend([lat, lng]);
            hasBounds = true;
          }
        });
      }

      if (hasBounds) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    } catch (error) {
      errorLog('Error fitting bounds', error);
    }
  }, [map, routeData, pointData, trackerData]);

  return null;
};

// Tracker status overlay
const TrackerStatusOverlay: React.FC<{ data: ProcessedTrackerData }> = ({ data }) => (
  <div className="absolute top-4 left-4 z-[1000]">
    <Card className="p-3 bg-background/95 backdrop-blur-sm shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <motion.div
          animate={data.isInMotion ? {
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0]
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Truck className={`w-4 h-4 ${data.isInMotion ? 'text-green-600' : 'text-gray-600'}`} />
        </motion.div>
        <span className="text-sm font-medium">São Cristóvão</span>
      </div>
      
      <div className="space-y-1 text-xs">
        <div className="flex items-center gap-2">
          <Badge 
            variant={data.isInMotion ? "default" : "outline"}
            className={`text-xs ${data.isInMotion ? 'bg-green-600' : ''}`}
          >
            {data.movementStatus.label}
          </Badge>
          <span className="text-muted-foreground">{data.speedKmh} km/h</span>
        </div>
        
        <div className="text-muted-foreground">
          Atualizado {data.connectionStatus.lastUpdate}
        </div>
        
        {data.needsAttention && (
          <div className="text-amber-600 flex items-center gap-1">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            Atenção necessária
          </div>
        )}
      </div>
    </Card>
  </div>
);

// Main component
const EnhancedProcissaoMap: React.FC<EnhancedProcissaoMapProps> = ({ 
  trackerData, 
  height = "h-[50vh]",
  showControls = true 
}) => {
  const [routeData, setRouteData] = useState<GeoJSONData | null>(null);
  const [pointData, setPointData] = useState<GeoJSONData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  const { toast } = useToast();

  debugLog('Component initializing', { trackerData });

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

  // Fetch GeoJSON data
  const fetchGeoJSON = useCallback(async (url: string): Promise<GeoJSONData | null> => {
    try {
      debugLog(`Fetching GeoJSON from: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      debugLog('GeoJSON fetched successfully', { features: data.features?.length });
      return data;
    } catch (error) {
      errorLog(`Failed to fetch GeoJSON from ${url}`, error);
      return null;
    }
  }, []);

  // Load map data
  useEffect(() => {
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
          fetchGeoJSON('/1.geojson'),
          fetchGeoJSON('/2.geojson')
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

  // Share handler
  const handleShare = async () => {
    try {
      const shareData = {
        title: 'Procissão de São Cristóvão',
        text: `Acompanhe a procissão em tempo real! São Cristóvão está ${trackerData.movementStatus.label}`,
        url: window.location.href
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          `${shareData.title}\n${shareData.text}\n${shareData.url}`
        );
        toast({
          title: "Link copiado!",
          description: "O link da procissão foi copiado para sua área de transferência"
        });
      }
    } catch (error) {
      errorLog('Error sharing', error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`w-full ${height} rounded-lg overflow-hidden`}>
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`w-full ${height} rounded-lg overflow-hidden bg-muted flex items-center justify-center`}>
        <div className="text-center">
          <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-2">{error}</p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.reload()}
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  // Calcula os pontos percorridos e posições de início/fim com base na rota
  let routeCoords: [number, number][] = [];
  let traveledPoints: [number, number][] = [];
  let startLatLng: [number, number] | null = null;
  let endLatLng: [number, number] | null = null;

  if (routeData) {
    const features = routeData.features || [];
    const lineString = features.find((f: any) => f.geometry?.type === 'LineString');
    if (lineString && lineString.geometry?.coordinates) {
      const coords = lineString.geometry.coordinates;
      routeCoords = coords.map((c: any) => [c[1], c[0]] as [number, number]);
      
      if (routeCoords.length > 0) {
        startLatLng = routeCoords[0];
        endLatLng = routeCoords[routeCoords.length - 1];

        // Encontra o índice da rota mais próximo do caminhão
        let closestIdx = 0;
        let minDistance = Infinity;
        
        for (let i = 0; i < routeCoords.length; i++) {
          const [lat, lng] = routeCoords[i];
          const dy = lat - trackerData.latitude;
          const dx = lng - trackerData.longitude;
          const dist = dx * dx + dy * dy;
          if (dist < minDistance) {
            minDistance = dist;
            closestIdx = i;
          }
        }

        traveledPoints = routeCoords.slice(0, closestIdx + 1);
        traveledPoints.push([trackerData.latitude, trackerData.longitude]);
      }
    }
  }

  try {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        {/* Status indicator */}
        {isOffline && (
          <div className="absolute top-0 left-0 right-0 z-[1001] bg-yellow-50 border border-yellow-200 rounded-t-lg p-2 text-center">
            <p className="text-xs text-yellow-800 flex items-center justify-center gap-1">
              <WifiOff className="w-3.5 h-3.5 text-yellow-700" />
              <span>Modo offline - Dados podem estar desatualizados</span>
            </p>
          </div>
        )}

        {/* Map Container */}
        <div className={`w-full ${height} rounded-lg overflow-hidden relative`}>
          <MapContainer
            center={[trackerData.latitude, trackerData.longitude]}
            zoom={15}
            className="w-full h-full"
            zoomControl={true}
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© OpenStreetMap contributors'
            />
            
            {/* Route GeoJSON (Planned - Blue) */}
            {routeData && (
              <GeoJSON
                data={routeData}
                style={{
                  color: '#3b82f6',
                  weight: 6,
                  opacity: 0.7,
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              />
            )}

            {/* Traveled Path (Actual Progress - Red) */}
            {traveledPoints.length > 1 && (
              <Polyline
                positions={traveledPoints}
                pathOptions={{
                  color: '#ef4444',
                  weight: 6,
                  opacity: 0.9,
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              />
            )}

            {/* Church Marker at Start (Partida) */}
            {startLatLng && (
              <Marker position={startLatLng} icon={createChurchIcon()}>
                <Popup>
                  <div className="text-center" style={{ fontFamily: 'inherit' }}>
                    <div className="font-semibold" style={{ fontSize: '13px' }}>Saída da Procissão</div>
                    <div className="text-xs text-gray-500" style={{ marginTop: '2px' }}>Capela Santa Terezinha</div>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Church Marker at End (Chegada) */}
            {endLatLng && (
              <Marker position={endLatLng} icon={createChurchIcon()}>
                <Popup>
                  <div className="text-center" style={{ fontFamily: 'inherit' }}>
                    <div className="font-semibold" style={{ fontSize: '13px' }}>Chegada da Procissão</div>
                    <div className="text-xs text-gray-500" style={{ marginTop: '2px' }}>Paróquia São Sebastião</div>
                  </div>
                </Popup>
              </Marker>
            )}
            
            {/* Point GeoJSON */}
            {pointData && (
              <GeoJSON
                data={{
                  ...pointData,
                  features: pointData.features.filter(
                    (f: any) => !f.properties?.Name?.toLowerCase().includes('saida') && !f.properties?.name?.toLowerCase().includes('saida')
                  )
                }}
                pointToLayer={(feature, latlng) => {
                  try {
                    const isTruck = feature.properties?.type === 'truck';
                    const icon = isTruck ? createLiveTruckIcon() : createChurchIcon();
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
                      const iconSvg = type === 'truck'
                        ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M19 18h2a1 1 0 0 0 1-1v-5.14a1 1 0 0 0-.29-.71l-4.4-4.44A1 1 0 0 0 15.6 6H14"/><circle cx="7.5" cy="18.5" r="2.5"/><circle cx="16.5" cy="18.5" r="2.5"/></svg>`
                        : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;"><path d="m12 3-8 8V21h16V11l-8-8z"/><path d="M12 2v2"/><path d="M11 3h2"/><path d="M10 17v4h4v-4H10z"/><path d="M8 12h8"/></svg>`;
                      
                      layer.bindPopup(`
                        <div class="text-center" style="font-family: inherit;">
                          <div style="margin-bottom: 6px;">${iconSvg}</div>
                          <div class="font-semibold" style="font-size: 13px;">${name || 'Local'}</div>
                          ${description ? `<div class="text-xs text-gray-500" style="margin-top: 2px;">${description}</div>` : ''}
                        </div>
                      `);
                    }
                  } catch (error) {
                    errorLog('Error binding popup', error);
                  }
                }}
              />
            )}
            
            {/* Live tracker position */}
            <Marker
              position={[trackerData.latitude, trackerData.longitude]}
              icon={createLiveTruckIcon(trackerData.course, trackerData.isInMotion)}
            >
              <Popup>
                <div className="text-center flex flex-col items-center">
                  <div className="text-lg mb-2 text-trucker-blue">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div className="font-semibold mb-1">São Cristóvão</div>
                  <div className="text-sm text-gray-600 mb-2">
                    {trackerData.movementStatus.label}
                  </div>
                  <div className="text-xs space-y-1">
                    <div>Velocidade: {trackerData.speedKmh} km/h</div>
                    <div>Precisão: ±{trackerData.accuracyStatus.value.toFixed(1)}m</div>
                    <div>Bateria: {trackerData.batteryStatus.level}%</div>
                    <div>Atualizado: {trackerData.connectionStatus.lastUpdate}</div>
                  </div>
                </div>
              </Popup>
            </Marker>
            
            {/* Auto-fit bounds */}
            <MapBounds 
              routeData={routeData} 
              pointData={pointData} 
              trackerData={trackerData}
            />
          </MapContainer>
 
          {/* Tracker status overlay */}
          <TrackerStatusOverlay data={trackerData} />

          {/* Controls */}
          {showControls && (
            <div className="absolute bottom-4 right-4 z-[1000] space-y-2">
              <Button
                size="sm"
                variant="secondary"
                className="bg-background/90 backdrop-blur-sm shadow-lg"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    );
  } catch (renderError) {
    errorLog('Render error', renderError);
    return (
      <div className={`w-full ${height} rounded-lg overflow-hidden bg-muted flex items-center justify-center`}>
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

export default EnhancedProcissaoMap; 