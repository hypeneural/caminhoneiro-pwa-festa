import React, { useState, useEffect, useRef } from 'react';
import { TraccarData } from '@/hooks/useTraccarData';
import { Card } from '@/components/ui/card';
import { MapPin, Gauge, AlertTriangle } from 'lucide-react';

export interface MapRendererProps {
  data: TraccarData;
  height?: string;
  showSpeed?: boolean;
}

// Enum para os tipos de renderização
enum MapRenderType {
  LEAFLET = 'leaflet',
  STATIC = 'static', 
  COORDINATES = 'coordinates',
  PLACEHOLDER = 'placeholder'
}

// Interface para o estado do mapa
interface MapState {
  renderType: MapRenderType;
  error: string | null;
  isLoading: boolean;
}

const MapRenderer: React.FC<MapRendererProps> = ({ 
  data, 
  height = "h-32", 
  showSpeed = true 
}) => {
  const [mapState, setMapState] = useState<MapState>({
    renderType: MapRenderType.LEAFLET,
    error: null,
    isLoading: true
  });
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // Health check para Leaflet
  const checkLeafletHealth = (): boolean => {
    try {
      // Verifica se Leaflet está disponível
      return typeof window !== 'undefined' && 
             'L' in window && 
             window.L && 
             typeof window.L.map === 'function';
    } catch {
      return false;
    }
  };

  // Renderização com Leaflet nativo
  const renderLeafletMap = async () => {
    try {
      console.log('🗺️ Tentando renderizar mapa Leaflet...');
      
      if (!mapContainerRef.current) {
        throw new Error('Container não encontrado');
      }

      // Importa Leaflet dinamicamente
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      // Limpa instância anterior
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Cria o mapa
      const map = L.map(mapContainerRef.current, {
        center: [data.latitude, data.longitude],
        zoom: 14,
        zoomControl: false,
        attributionControl: false
      });

      // Adiciona tiles
      L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      // Ícone do caminhão
      const truckIcon = L.divIcon({
        html: `<div style="
          transform: rotate(${data.course || 0}deg);
          font-size: 24px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        ">🚛</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        className: 'custom-truck-icon'
      });

      // Adiciona marcador
      L.marker([data.latitude, data.longitude], { icon: truckIcon }).addTo(map);

      mapInstanceRef.current = map;
      
      setMapState({
        renderType: MapRenderType.LEAFLET,
        error: null,
        isLoading: false
      });

      console.log('✅ Mapa Leaflet renderizado com sucesso');
    } catch (error) {
      console.error('❌ Erro no Leaflet:', error);
      renderStaticMap();
    }
  };

  // Renderização de mapa estático
  const renderStaticMap = () => {
    console.log('📍 Renderizando mapa estático...');
    setMapState({
      renderType: MapRenderType.STATIC,
      error: null,
      isLoading: false
    });
  };

  // Renderização de coordenadas
  const renderCoordinates = () => {
    console.log('📌 Renderizando coordenadas...');
    setMapState({
      renderType: MapRenderType.COORDINATES,
      error: null,
      isLoading: false
    });
  };

  // Renderização de placeholder
  const renderPlaceholder = () => {
    console.log('🔲 Renderizando placeholder...');
    setMapState({
      renderType: MapRenderType.PLACEHOLDER,
      error: 'Mapa indisponível',
      isLoading: false
    });
  };

  // Inicialização do mapa
  useEffect(() => {
    const initializeMap = async () => {
      setMapState(prev => ({ ...prev, isLoading: true }));

      // Tenta renderizar na ordem de prioridade
      if (checkLeafletHealth()) {
        await renderLeafletMap();
      } else {
        renderStaticMap();
      }
    };

    if (data?.latitude && data?.longitude) {
      initializeMap();
    } else {
      renderPlaceholder();
    }

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [data.latitude, data.longitude]);

  // Componente de mapa estático
  const StaticMapView = () => (
    <div className="relative w-full h-full bg-gradient-to-br from-trucker-blue/10 to-trucker-blue/5 rounded-lg flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="text-4xl">🗺️</div>
        <div className="text-sm font-medium text-foreground">
          {data.latitude.toFixed(6)}, {data.longitude.toFixed(6)}
        </div>
        <div className="text-xs text-muted-foreground">
          {data.address || 'Localizando endereço...'}
        </div>
      </div>
      {showSpeed && (
        <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-lg px-2 py-1">
          <span className="text-xs font-bold text-foreground">
            {Math.round((data.speed || 0) * 1.852)} km/h
          </span>
        </div>
      )}
    </div>
  );

  // Componente de coordenadas
  const CoordinatesView = () => (
    <div className="relative w-full h-full bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg flex items-center justify-center">
      <div className="text-center space-y-3">
        <MapPin className="w-8 h-8 text-trucker-blue mx-auto" />
        <div className="space-y-1">
          <div className="text-sm font-bold text-foreground">
            Lat: {data.latitude.toFixed(6)}
          </div>
          <div className="text-sm font-bold text-foreground">
            Lng: {data.longitude.toFixed(6)}
          </div>
        </div>
        {showSpeed && (
          <div className="flex items-center gap-1 justify-center">
            <Gauge className="w-4 h-4 text-trucker-blue" />
            <span className="text-sm font-medium">
              {Math.round((data.speed || 0) * 1.852)} km/h
            </span>
          </div>
        )}
      </div>
    </div>
  );

  // Componente de placeholder
  const PlaceholderView = () => (
    <div className="relative w-full h-full bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-lg flex items-center justify-center">
      <div className="text-center space-y-2">
        <AlertTriangle className="w-6 h-6 text-destructive mx-auto" />
        <div className="text-sm text-destructive font-medium">
          Mapa Indisponível
        </div>
        <div className="text-xs text-muted-foreground">
          Verifique sua conexão
        </div>
      </div>
    </div>
  );

  // Renderização condicional baseada no tipo
  const renderMapContent = () => {
    if (mapState.isLoading) {
      return (
        <div className="w-full h-full bg-muted/30 animate-pulse rounded-lg flex items-center justify-center">
          <div className="text-2xl">🗺️</div>
        </div>
      );
    }

    switch (mapState.renderType) {
      case MapRenderType.LEAFLET:
        return <div ref={mapContainerRef} className="w-full h-full rounded-lg" />;
      case MapRenderType.STATIC:
        return <StaticMapView />;
      case MapRenderType.COORDINATES:
        return <CoordinatesView />;
      case MapRenderType.PLACEHOLDER:
      default:
        return <PlaceholderView />;
    }
  };

  return (
    <div className={`relative w-full ${height} rounded-lg overflow-hidden`}>
      {renderMapContent()}
      
      {/* Debug info em desenvolvimento */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
          {mapState.renderType}
        </div>
      )}
    </div>
  );
};

export default MapRenderer;