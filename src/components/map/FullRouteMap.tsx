import React, { useEffect, useRef, useState } from 'react';
import { TraccarData } from '@/types/common';
import { useRouteHistory } from '@/hooks/useRouteHistory';
import { useMapRenderer } from '@/hooks/useMapRenderer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Share2, Pause, Play, Trash2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Constantes
const IGREJA_POSITION: L.LatLngTuple = [-27.236099, -48.644599];
const MAP_CONTAINER_ID = 'full-route-map';

interface FullRouteMapProps {
  data: TraccarData;
  height?: string;
}

const FullRouteMap: React.FC<FullRouteMapProps> = ({ data, height = "h-full" }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const { toast } = useToast();
  const { health } = useMapRenderer();
  const {
    routeHistory,
    isRecording,
    clearHistory,
    toggleRecording,
    exportToGeoJSON
  } = useRouteHistory();

  // Inicializa o mapa
  useEffect(() => {
    console.log('🗺️ FullRouteMap: Iniciando setup do mapa', { data, containerId: MAP_CONTAINER_ID });
    
    if (!mapContainerRef.current) {
      console.error('❌ FullRouteMap: Container ref não encontrada');
      return;
    }

    try {
      // Limpa instância anterior
      if (mapInstanceRef.current) {
        console.log('🧹 FullRouteMap: Limpando mapa anterior');
        mapInstanceRef.current.remove();
      }

      console.log('🌍 FullRouteMap: Criando nova instância do mapa');
      const map = L.map(mapContainerRef.current, {
        center: [data.latitude, data.longitude] as L.LatLngTuple,
        zoom: 15,
        zoomControl: true,
        attributionControl: true
      });

      // Adiciona camada de tiles com fallback
      const addTileLayer = () => {
        try {
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);
        } catch (error) {
          console.error('❌ FullRouteMap: Erro ao adicionar tiles, tentando fallback');
          L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
            attribution: '© CartoDB'
          }).addTo(map);
        }
      };
      addTileLayer();

      // Adiciona controles
      L.control.scale({ imperial: false }).addTo(map);

      // Salva referência
      mapInstanceRef.current = map;
      setIsMapReady(true);
      console.log('✅ FullRouteMap: Mapa inicializado com sucesso');

    } catch (error) {
      console.error('❌ FullRouteMap: Erro ao inicializar mapa:', error);
      toast({
        title: "Erro no mapa",
        description: "Não foi possível inicializar o mapa completo",
        variant: "destructive"
      });
    }
  }, []);

  // Atualiza marcadores e rota
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady || !data) {
      console.log('⏳ FullRouteMap: Aguardando mapa estar pronto', { isMapReady, hasData: !!data });
      return;
    }

    try {
      console.log('🔄 FullRouteMap: Atualizando marcadores e rota');
      
      // Atualiza marcador do caminhão
      if (markerRef.current) {
        markerRef.current.remove();
      }
      markerRef.current = L.marker([data.latitude, data.longitude] as L.LatLngTuple, {
        icon: L.divIcon({
          html: '🚛',
          className: 'text-2xl',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      }).addTo(mapInstanceRef.current);

      // Atualiza linha da rota
      if (polylineRef.current) {
        polylineRef.current.remove();
      }
      if (routeHistory.length > 1) {
        const routePoints = routeHistory.map(p => [p.latitude, p.longitude] as L.LatLngTuple);
        polylineRef.current = L.polyline(routePoints, {
          color: "#3b82f6",
          weight: 3,
          opacity: 0.8
        }).addTo(mapInstanceRef.current);

        // Ajusta visualização para mostrar toda a rota
        const bounds = L.latLngBounds([
          ...routePoints,
          IGREJA_POSITION
        ]);
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
      }

      console.log('✅ FullRouteMap: Marcadores e rota atualizados');
    } catch (error) {
      console.error('❌ FullRouteMap: Erro ao atualizar marcadores:', error);
    }
  }, [data, routeHistory, isMapReady]);

  // Compartilhar rota
  const handleShare = async () => {
    try {
      const geoJSON = exportToGeoJSON();
      const blob = new Blob([JSON.stringify(geoJSON)], { type: 'application/json' });
      const file = new File([blob], 'rota-sao-cristovao.geojson', { type: 'application/json' });
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Rota São Cristóvão',
          text: 'Rota da procissão de São Cristóvão'
        });
      } else {
        // Fallback: Download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rota-sao-cristovao.geojson';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      toast({
        title: "Erro ao compartilhar",
        description: "Não foi possível compartilhar a rota",
        variant: "destructive"
      });
    }
  };

  return (
    <div className={`relative ${height}`}>
      {/* Mapa */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full rounded-lg overflow-hidden"
        id={MAP_CONTAINER_ID}
      />

      {/* Controles flutuantes */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Card className="p-2 shadow-lg">
          <div className="flex items-center gap-2">
            <Badge variant={isRecording ? "default" : "secondary"}>
              {isRecording ? "Gravando" : "Pausado"}
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleRecording}
              title={isRecording ? "Pausar gravação" : "Retomar gravação"}
            >
              {isRecording ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearHistory}
              title="Limpar rota"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleShare}
              title="Compartilhar rota"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Estatísticas */}
        <Card className="p-2 shadow-lg">
          <div className="text-xs">
            <div>Pontos: {routeHistory.length}</div>
            <div>Qualidade: {health.performanceScore}%</div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FullRouteMap; 