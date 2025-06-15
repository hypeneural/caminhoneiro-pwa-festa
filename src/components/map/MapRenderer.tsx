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

  // Sistema híbrido de tiles gratuitos
  const TILE_PROVIDERS = [
    {
      name: 'CartoDB Light',
      url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
      attribution: '© CartoDB'
    },
    {
      name: 'OpenStreetMap',
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap'
    },
    {
      name: 'CartoDB Voyager',
      url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}.png',
      attribution: '© CartoDB'
    }
  ];

  // Teste de conectividade com tile provider
  const testTileProvider = (provider: typeof TILE_PROVIDERS[0]): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        resolve(false);
      }, 3000);
      
      img.onload = () => {
        clearTimeout(timeout);
        resolve(true);
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
      
      // Testa um tile específico da região
      const testUrl = provider.url
        .replace('{s}', 'a')
        .replace('{z}', '10')
        .replace('{x}', '612')
        .replace('{y}', '391');
      
      img.src = testUrl;
    });
  };

  // Encontra o melhor provider disponível
  const findBestTileProvider = async () => {
    for (const provider of TILE_PROVIDERS) {
      console.log(`🧪 Testando provider: ${provider.name}`);
      const isAvailable = await testTileProvider(provider);
      if (isAvailable) {
        console.log(`✅ Provider disponível: ${provider.name}`);
        return provider;
      }
    }
    console.log('❌ Nenhum provider de tiles disponível');
    return null;
  };

  // Renderização com Leaflet nativo híbrido
  const renderLeafletMap = async () => {
    try {
      console.log('🗺️ Iniciando sistema híbrido de mapas...');
      
      if (!mapContainerRef.current) {
        throw new Error('Container não encontrado');
      }

      // Testa conectividade e encontra melhor provider
      const bestProvider = await findBestTileProvider();
      if (!bestProvider) {
        throw new Error('Nenhum tile provider disponível');
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
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
        preferCanvas: true
      });

      // Adiciona tiles com o melhor provider
      const tileLayer = L.tileLayer(bestProvider.url, {
        maxZoom: 19,
        attribution: bestProvider.attribution,
        errorTileUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2Y5ZmFmYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjM3M2VjIj7wn5aPPC90ZXh0Pjwvc3ZnPg=='
      });
      
      tileLayer.addTo(map);

      // Ponto de partida (Igreja)
      const startIcon = L.divIcon({
        html: `<div style="
          background: hsl(var(--trucker-blue)); 
          color: white; 
          border-radius: 50%; 
          width: 28px; 
          height: 28px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          font-size: 14px;
        ">⛪</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        className: 'custom-start-icon'
      });

      // Ícone do caminhão
      const truckIcon = L.divIcon({
        html: `<div style="
          transform: rotate(${data.course || 0}deg);
          font-size: 28px;
          filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4));
          transition: transform 0.3s ease;
        ">🚛</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        className: 'custom-truck-icon'
      });

      // Coordenadas do ponto de partida
      const START_POINT: [number, number] = [-27.236099, -48.644599];
      
      // Adiciona marcadores
      L.marker(START_POINT, { icon: startIcon }).addTo(map);
      L.marker([data.latitude, data.longitude], { icon: truckIcon }).addTo(map);

      // Linha de rota
      const routeLine = L.polyline([
        START_POINT,
        [data.latitude, data.longitude]
      ], {
        color: 'hsl(var(--trucker-blue))',
        weight: 3,
        opacity: 0.8,
        dashArray: '5, 5'
      }).addTo(map);

      // Ajusta zoom para mostrar ambos os pontos
      const group = L.featureGroup([
        L.marker(START_POINT),
        L.marker([data.latitude, data.longitude])
      ]);
      map.fitBounds(group.getBounds(), { 
        padding: [20, 20],
        maxZoom: 16 
      });

      mapInstanceRef.current = map;
      
      setMapState({
        renderType: MapRenderType.LEAFLET,
        error: null,
        isLoading: false
      });

      console.log(`✅ Mapa híbrido renderizado com ${bestProvider.name}`);
    } catch (error) {
      console.error('❌ Erro no sistema híbrido:', error);
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
      console.log('🚀 MapRenderer: Iniciando inicialização do mapa');
      console.log('📍 MapRenderer: Dados recebidos:', {
        latitude: data?.latitude,
        longitude: data?.longitude,
        address: data?.address,
        speed: data?.speed,
        fixTime: data?.fixTime
      });
      
      setMapState(prev => ({ ...prev, isLoading: true }));

      // Health check do Leaflet
      console.log('🏥 MapRenderer: Verificando saúde do Leaflet...');
      const leafletHealthy = checkLeafletHealth();
      console.log('🏥 MapRenderer: Leaflet disponível:', leafletHealthy);

      // Tenta renderizar na ordem de prioridade
      if (leafletHealthy) {
        console.log('✅ MapRenderer: Tentando renderizar com Leaflet');
        await renderLeafletMap();
      } else {
        console.log('⚠️ MapRenderer: Leaflet indisponível, usando mapa estático');
        renderStaticMap();
      }
    };

    if (data?.latitude && data?.longitude) {
      console.log('🗺️ MapRenderer: Coordenadas válidas encontradas, inicializando mapa');
      initializeMap();
    } else {
      console.log('❌ MapRenderer: Coordenadas inválidas, renderizando placeholder');
      console.log('📊 MapRenderer: Dados inválidos:', { data });
      renderPlaceholder();
    }

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        console.log('🧹 MapRenderer: Limpando instância do mapa');
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