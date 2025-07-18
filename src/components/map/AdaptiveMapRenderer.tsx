import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Card } from '@/components/ui/card';
import { MapPin, Gauge, AlertTriangle, Signal, Wifi, WifiOff } from 'lucide-react';
import type { ProcessedTrackerData } from '@/types/tracker';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

export interface AdaptiveMapRendererProps {
  data: ProcessedTrackerData;
  height?: string;
  showSpeed?: boolean;
  showControls?: boolean;
  adaptive?: boolean;
  fallbackStrategy?: RenderStrategy;
}

// Estratégias de renderização disponíveis
export type RenderStrategy = 'auto' | 'leaflet' | 'static' | 'coordinates' | 'minimal';

// Estado do mapa
interface MapState {
  strategy: RenderStrategy;
  isLoading: boolean;
  error: string | null;
  capabilities: DeviceCapabilities;
  networkQuality: NetworkQuality;
}

interface DeviceCapabilities {
  hasWebGL: boolean;
  hasCanvas: boolean;
  memoryLimit: number;
  isMobile: boolean;
  isLowEnd: boolean;
}

interface NetworkQuality {
  isOnline: boolean;
  effectiveType: string;
  downlink: number;
  rtt: number;
}

const AdaptiveMapRenderer: React.FC<AdaptiveMapRendererProps> = ({ 
  data, 
  height = "h-32",
  showSpeed = true,
  showControls = false,
  adaptive = true,
  fallbackStrategy = 'coordinates'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapState, setMapState] = useState<MapState>({
    strategy: 'auto',
    isLoading: true,
    error: null,
    capabilities: {
      hasWebGL: false,
      hasCanvas: false,
      memoryLimit: 0,
      isMobile: false,
      isLowEnd: false
    },
    networkQuality: {
      isOnline: false,
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0
    }
  });

  const { isOnline } = useNetworkStatus();
  const { isMobile } = useDeviceDetection();

  // Teste de capacidades do dispositivo
  const testDeviceCapabilities = useCallback((): DeviceCapabilities => {
    try {
      // Teste de Canvas 2D
      const canvas = document.createElement('canvas');
      const hasCanvas = !!canvas.getContext('2d');
      
      // Teste de WebGL
      const hasWebGL = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      
      // Estimativa de memória (navegadores modernos)
      const memoryLimit = (navigator as any).deviceMemory || 
                         (navigator as any).hardwareConcurrency * 0.5 || 2;
      
      // Detecção de dispositivo low-end
      const isLowEnd = memoryLimit < 2 || 
                      navigator.hardwareConcurrency < 2 ||
                      /Android\s[1-4]/.test(navigator.userAgent);
      
      console.log('🔍 Capacidades do dispositivo:', {
        hasCanvas,
        hasWebGL,
        memoryLimit,
        isMobile,
        isLowEnd,
        hardwareConcurrency: navigator.hardwareConcurrency
      });
      
      return {
        hasCanvas,
        hasWebGL,
        memoryLimit,
        isMobile,
        isLowEnd
      };
    } catch (error) {
      console.error('❌ Erro ao testar capacidades:', error);
      return {
        hasCanvas: false,
        hasWebGL: false,
        memoryLimit: 1,
        isMobile: true,
        isLowEnd: true
      };
    }
  }, [isMobile]);

  // Teste de qualidade da rede
  const testNetworkQuality = useCallback((): NetworkQuality => {
    try {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;
      
      const quality: NetworkQuality = {
        isOnline,
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0
      };
      
      console.log('📶 Qualidade da rede:', quality);
      return quality;
    } catch (error) {
      console.error('❌ Erro ao testar rede:', error);
      return {
        isOnline,
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0
      };
    }
  }, [isOnline]);

  // Determinar a melhor estratégia de renderização
  const determineOptimalStrategy = useCallback((
    capabilities: DeviceCapabilities, 
    networkQuality: NetworkQuality
  ): RenderStrategy => {
    if (!adaptive) return fallbackStrategy;
    
    // Priorizar mapa estático para melhor experiência visual
    if (networkQuality.isOnline) {
      return 'static';
    }
    
    // Se offline, usar coordenadas
    return 'coordinates';
  }, [adaptive, fallbackStrategy]);

  // Inicialização e detecção de capacidades
  useEffect(() => {
    const initialize = async () => {
      setMapState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        const capabilities = testDeviceCapabilities();
        const networkQuality = testNetworkQuality();
        const optimalStrategy = determineOptimalStrategy(capabilities, networkQuality);
        
        console.log('🎯 Estratégia selecionada:', optimalStrategy);
        
        setMapState({
          strategy: optimalStrategy,
          isLoading: false,
          error: null,
          capabilities,
          networkQuality
        });
      } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        setMapState(prev => ({
          ...prev,
          strategy: fallbackStrategy,
          isLoading: false,
          error: 'Erro na detecção de capacidades'
        }));
      }
    };

    initialize();
  }, [testDeviceCapabilities, testNetworkQuality, determineOptimalStrategy, fallbackStrategy]);

  // Re-avaliar estratégia quando rede muda
  useEffect(() => {
    if (!mapState.isLoading) {
      const networkQuality = testNetworkQuality();
      const newStrategy = determineOptimalStrategy(mapState.capabilities, networkQuality);
      
      if (newStrategy !== mapState.strategy) {
        console.log('🔄 Mudando estratégia:', mapState.strategy, '→', newStrategy);
        setMapState(prev => ({
          ...prev,
          strategy: newStrategy,
          networkQuality
        }));
      }
    }
  }, [isOnline, testNetworkQuality, determineOptimalStrategy, mapState.capabilities, mapState.isLoading, mapState.strategy]);

  // Renderização com Leaflet (estratégia mais avançada)
  const LeafletView = () => {
    useEffect(() => {
      if (!mapContainerRef.current) return;
      
      const initLeaflet = async () => {
        try {
          // Importação dinâmica do Leaflet
          const L = await import('leaflet');
          await import('leaflet/dist/leaflet.css');
          
          // Limpar instância anterior
          if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
          }
          
          // Criar novo mapa
          const map = L.map(mapContainerRef.current, {
            center: [data.latitude, data.longitude],
            zoom: 16,
            zoomControl: false,
            attributionControl: false,
            preferCanvas: true
          });
          
          // Adicionar tile layer otimizado
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            detectRetina: true,
            updateWhenIdle: true,
            keepBuffer: 2
          }).addTo(map);
          
          // Adicionar marcador do caminhão
          const truckIcon = L.divIcon({
            html: '🚛',
            className: 'truck-marker',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });
          
          L.marker([data.latitude, data.longitude], { icon: truckIcon })
            .addTo(map);
          
          mapInstanceRef.current = map;
          
        } catch (error) {
          console.error('❌ Erro ao carregar Leaflet:', error);
          setMapState(prev => ({ ...prev, strategy: 'static', error: 'Erro ao carregar mapa' }));
        }
      };
      
      initLeaflet();
      
      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }, [data.latitude, data.longitude]);
    
    return <div ref={mapContainerRef} className="w-full h-full rounded-lg" />;
  };

  // Renderização estática (imagem via API)
  const StaticView = () => {
    const { latitude, longitude, speedKmh } = data;
    const zoom = speedKmh > 0 ? 16 : 15; // Zoom maior se em movimento
    const mapSize = "600x400";
    
    // URL do OpenStreetMap static API alternativo
    const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s-truck+285A98(${longitude},${latitude})/${longitude},${latitude},${zoom}/${mapSize}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw`;
    
    // Fallback para OpenStreetMap básico
    const osmStaticUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.01},${latitude-0.01},${longitude+0.01},${latitude+0.01}&layer=mapnik&marker=${latitude},${longitude}`;
    
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-trucker-blue/10 to-trucker-blue/5 rounded-lg overflow-hidden">
        {/* Iframe do OpenStreetMap */}
        <iframe
          src={osmStaticUrl}
          className="w-full h-full border-0 rounded-lg"
          title="Mapa da localização"
          loading="lazy"
          onError={(e) => {
            console.log('Erro ao carregar mapa, mostrando fallback');
            e.currentTarget.style.display = 'none';
            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        
        {/* Fallback se iframe falhar */}
        <div className="absolute inset-0 hidden items-center justify-center bg-gradient-to-br from-trucker-blue/10 to-trucker-blue/5">
          <div className="text-center space-y-3">
            <div className="text-4xl">📍</div>
            <div className="text-sm font-medium text-foreground">
              {data.coordinatesText}
            </div>
            <div className="text-xs text-muted-foreground">
              {data.address || 'Localizando endereço...'}
            </div>
            <div className="text-xs text-blue-600 underline cursor-pointer"
                 onClick={() => window.open(`https://maps.google.com/maps?q=${latitude},${longitude}`, '_blank')}>
              Ver no Google Maps
            </div>
          </div>
        </div>
        
        {/* Overlays apenas se necessário */}
        {showSpeed && (
          <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
            <span className="text-sm font-bold text-foreground flex items-center gap-2">
              <Gauge className="w-4 h-4 text-trucker-blue" />
              {speedKmh} km/h
            </span>
          </div>
        )}
        
        {/* Centro do mapa (cruz) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-6 h-6 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1 h-6 bg-red-500 opacity-70"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-1 bg-red-500 opacity-70"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Renderização de coordenadas (visual melhorada)
  const CoordinatesView = () => (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-lg overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #3b82f6 2px, transparent 2px),
                           radial-gradient(circle at 75% 75%, #3b82f6 2px, transparent 2px)`,
          backgroundSize: '24px 24px'
        }} />
      </div>
      
      <div className="relative z-10 flex items-center justify-center h-full p-4">
        <div className="text-center space-y-4">
          {/* Icon with animation */}
          <div className="relative">
            <div className="w-16 h-16 bg-trucker-blue/10 rounded-full flex items-center justify-center mx-auto">
              <MapPin className="w-8 h-8 text-trucker-blue" />
            </div>
            {data.speedKmh > 0 && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-white text-xs font-bold">→</span>
              </div>
            )}
          </div>
          
          {/* Coordinates */}
          <div className="space-y-2">
            <div className="text-lg font-bold text-foreground">
              📍 Localização
            </div>
            <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3 space-y-1">
              <div className="text-sm font-mono text-foreground">
                <span className="text-muted-foreground">Lat:</span> {data.latitude.toFixed(6)}
              </div>
              <div className="text-sm font-mono text-foreground">
                <span className="text-muted-foreground">Lng:</span> {data.longitude.toFixed(6)}
              </div>
            </div>
          </div>
          
          {/* Status info */}
          <div className="space-y-2">
            {showSpeed && (
              <div className="flex items-center gap-2 justify-center bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2">
                <Gauge className="w-4 h-4 text-trucker-blue" />
                <span className="text-sm font-medium">
                  {data.speedKmh} km/h
                </span>
                <span className={`w-2 h-2 rounded-full ${
                  data.speedKmh > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`} />
              </div>
            )}
            
            {data.accuracyStatus.showWarning && (
              <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-2 py-1">
                ⚠️ Precisão: ±{data.accuracyStatus.value.toFixed(1)}m
              </div>
            )}
          </div>
          
          {/* Action button */}
          <button
            onClick={() => window.open(`https://maps.google.com/maps?q=${data.latitude},${data.longitude}`, '_blank')}
            className="text-xs text-blue-600 hover:text-blue-800 underline bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 transition-colors"
          >
            🗺️ Abrir no Google Maps
          </button>
        </div>
      </div>
    </div>
  );

  // Renderização mínima (para conexão muito limitada)
  const MinimalView = () => (
    <div className="relative w-full h-full bg-gradient-to-br from-muted/10 to-muted/5 rounded-lg flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <WifiOff className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Modo Offline</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {data.movementStatus.label}
        </div>
      </div>
    </div>
  );

  // Renderização de erro
  const ErrorView = () => (
    <div className="relative w-full h-full bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-lg flex items-center justify-center">
      <div className="text-center space-y-2">
        <AlertTriangle className="w-6 h-6 text-destructive mx-auto" />
        <div className="text-sm text-destructive font-medium">
          Mapa Indisponível
        </div>
        <div className="text-xs text-muted-foreground">
          {mapState.error || 'Erro desconhecido'}
        </div>
      </div>
    </div>
  );

  // Seletor de renderização baseado na estratégia
  const renderMapContent = () => {
    if (mapState.isLoading) {
      return (
        <div className="w-full h-full bg-muted/30 animate-pulse rounded-lg flex items-center justify-center">
          <div className="text-2xl">🗺️</div>
        </div>
      );
    }

    if (mapState.error) {
      return <ErrorView />;
    }

    switch (mapState.strategy) {
      case 'leaflet':
        return <LeafletView />;
      case 'static':
        return <StaticView />;
      case 'coordinates':
        return <CoordinatesView />;
      case 'minimal':
        return <MinimalView />;
      default:
        return <CoordinatesView />;
    }
  };

  // Overlay com informações essenciais
  const MapOverlay = () => (
    <>
      {/* Status de conexão */}
      <div className="absolute top-2 left-2 flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${
          data.connectionStatus.state === 'live' ? 'bg-green-500 animate-pulse' :
          data.connectionStatus.state === 'delayed' ? 'bg-yellow-500' :
          'bg-red-500'
        }`} />
        <span className="text-xs text-foreground bg-background/80 rounded px-1">
          {data.connectionStatus.label}
        </span>
      </div>

      {/* Informações contextuais */}
      {data.needsAttention && (
        <div className="absolute bottom-2 left-2 bg-yellow-500/80 text-black rounded px-2 py-1">
          <span className="text-xs font-medium">⚠️ Atenção</span>
        </div>
      )}
    </>
  );

  return (
    <Card className={`relative w-full ${height} rounded-lg overflow-hidden`}>
      <ErrorBoundary fallback={({ error }) => <ErrorView />}>
        {renderMapContent()}
        <MapOverlay />
        
        {/* Debug info em desenvolvimento */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1 rounded">
            {mapState.strategy} | {mapState.networkQuality.effectiveType}
          </div>
        )}
      </ErrorBoundary>
    </Card>
  );
};

export default AdaptiveMapRenderer; 