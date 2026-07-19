import React, { useEffect, useRef, useState } from 'react';
import { TraccarData } from '@/types/common';
import { useRouteHistory } from '@/hooks/useRouteHistory';
import { useMapRenderer } from '@/hooks/useMapRenderer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Share2, Pause, Play, Trash2, Download, Map, Navigation, Radio, AlertCircle, Wifi, WifiOff, Battery, BatteryLow, Gauge, Compass, ChevronDown, ChevronUp } from 'lucide-react';
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
  const plannedPolylineRef = useRef<L.Polyline | null>(null);
  const traveledPolylineRef = useRef<L.Polyline | null>(null);
  const startChurchMarkerRef = useRef<L.Marker | null>(null);
  const endChurchMarkerRef = useRef<L.Marker | null>(null);
  const hasFitBounds = useRef(false);

  const [isMapReady, setIsMapReady] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [routeGeoJson, setRouteGeoJson] = useState<any>(null);

  const { toast } = useToast();
  const { health } = useMapRenderer();
  const {
    routeHistory,
    isRecording,
    clearHistory,
    toggleRecording,
    exportToGeoJSON
  } = useRouteHistory();

  // Custom church icon creator
  const createChurchIcon = () => {
    return L.divIcon({
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
      className: 'church-marker-leaflet',
      iconSize: [36, 40],
      iconAnchor: [18, 34],
      popupAnchor: [0, -30]
    });
  };

  // Carrega GeoJSON da rota oficial
  useEffect(() => {
    fetch('/1.geojson')
      .then(res => res.json())
      .then(data => {
        setRouteGeoJson(data);
      })
      .catch(err => {
        console.error('❌ FullRouteMap: Erro ao carregar GeoJSON da rota:', err);
      });
  }, []);

  // Inicializa o mapa
  useEffect(() => {
    console.log('🗺️ FullRouteMap: Setup do mapa', { data, containerId: MAP_CONTAINER_ID });
    
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
      
      const formattedDate = new Date(data.deviceTime).toLocaleString('pt-BR');
      
      const popupHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; padding: 6px; min-width: 200px; color: #1e293b;">
          <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 14px; margin-bottom: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M19 18h2a1 1 0 0 0 1-1v-5.14a1 1 0 0 0-.29-.71l-4.4-4.44A1 1 0 0 0 15.6 6H14"/><circle cx="7.5" cy="18.5" r="2.5"/><circle cx="16.5" cy="18.5" r="2.5"/></svg>
            <span>Caminhão São Cristóvão</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 4px; font-size: 12px; margin-bottom: 10px;">
            <div><strong>Status:</strong> <span style="font-weight: 600; color: ${data.isInMotion ? '#16a34a' : '#4b5563'};">${data.movementStatus.label}</span></div>
            <div><strong>Velocidade:</strong> ${data.speedKmh} km/h</div>
            <div><strong>Último Movimento:</strong><br/><span style="color: #64748b; font-family: monospace; font-size: 11px;">${formattedDate}</span></div>
          </div>
          <div style="display: flex; gap: 6px; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 8px;">
            <a href="https://www.google.com/maps/search/?api=1&query=${data.latitude},${data.longitude}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; background-color: #3b82f6; color: white; border-radius: 6px; padding: 6px 4px; text-decoration: none; font-size: 11px; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">Google Maps</a>
            <a href="https://waze.com/ul?ll=${data.latitude},${data.longitude}&navigate=yes" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; background-color: #059669; color: white; border-radius: 6px; padding: 6px 4px; text-decoration: none; font-size: 11px; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">Waze</a>
          </div>
        </div>
      `;

      // Remove o marcador anterior para evitar duplicados
      if (markerRef.current) {
        markerRef.current.remove();
      }

      const truckIconHtml = `
        <div style="
          background-color: ${data.isInMotion ? '#22c55e' : '#3b82f6'};
          color: white;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          border: 3px solid white;
          transform: rotate(${data.course}deg);
          transition: transform 0.3s ease, background-color 0.3s ease;
          ${data.isInMotion ? 'animation: live-truck-pulse 2s infinite;' : ''}
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
            <path d="M19 18h2a1 1 0 0 0 1-1v-5.14a1 1 0 0 0-.29-.71l-4.4-4.44A1 1 0 0 0 15.6 6H14"/>
            <circle cx="7.5" cy="18.5" r="2.5"/>
            <circle cx="16.5" cy="18.5" r="2.5"/>
          </svg>
        </div>
        <style>
          @keyframes live-truck-pulse {
            0%, 100% { transform: scale(1) rotate(${data.course}deg); box-shadow: 0 4px 10px rgba(34,197,94,0.4); }
            50% { transform: scale(1.1) rotate(${data.course}deg); box-shadow: 0 4px 18px rgba(34,197,94,0.6); }
          }
        </style>
      `;

      markerRef.current = L.marker([data.latitude, data.longitude] as L.LatLngTuple, {
        icon: L.divIcon({
          html: truckIconHtml,
          className: '',
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        })
      })
      .bindPopup(popupHtml)
      .addTo(mapInstanceRef.current);
      
      // Abre o popup automaticamente para visualização imediata
      markerRef.current.openPopup();

      // Se a rota oficial GeoJSON estiver carregada, calcula o progresso
      if (routeGeoJson) {
        const features = routeGeoJson.features || [];
        const lineString = features.find((f: any) => f.geometry?.type === 'LineString');
        
        if (lineString && lineString.geometry?.coordinates) {
          const coords = lineString.geometry.coordinates;
          const routePoints = coords.map((c: any) => [c[1], c[0]] as L.LatLngTuple);
          
          if (routePoints.length > 0) {
            // Encontra o ponto da rota mais próximo da localização atual do veículo
            let closestIdx = 0;
            let minDistance = Infinity;
            
            for (let i = 0; i < routePoints.length; i++) {
              const [lat, lng] = routePoints[i];
              const dy = lat - data.latitude;
              const dx = lng - data.longitude;
              const dist = dx * dx + dy * dy;
              if (dist < minDistance) {
                minDistance = dist;
                closestIdx = i;
              }
            }
            
            // Fatiar a rota: do início até o ponto mais próximo, e conectar ao caminhão
            const traveledPoints = routePoints.slice(0, closestIdx + 1);
            traveledPoints.push([data.latitude, data.longitude]);
            
            // Renderiza Rota Completa em Azul
            if (plannedPolylineRef.current) {
              plannedPolylineRef.current.remove();
            }
            plannedPolylineRef.current = L.polyline(routePoints, {
              color: "#3b82f6",
              weight: 6,
              opacity: 0.7,
              lineCap: 'round',
              lineJoin: 'round'
            }).addTo(mapInstanceRef.current);

            // Renderiza Trajeto Percorrido em Vermelho
            if (traveledPolylineRef.current) {
              traveledPolylineRef.current.remove();
            }
            traveledPolylineRef.current = L.polyline(traveledPoints, {
              color: "#ef4444",
              weight: 6,
              opacity: 0.9,
              lineCap: 'round',
              lineJoin: 'round'
            }).addTo(mapInstanceRef.current);

            // Adiciona marcador de Igreja no início (Partida)
            if (startChurchMarkerRef.current) {
              startChurchMarkerRef.current.remove();
            }
            startChurchMarkerRef.current = L.marker(routePoints[0], {
              icon: createChurchIcon()
            })
            .bindPopup(`
              <div style="font-family: inherit; font-size: 12px; text-align: center;">
                <strong>Saída da Procissão</strong><br/>
                Capela Santa Terezinha
              </div>
            `)
            .addTo(mapInstanceRef.current);

            // Adiciona marcador de Igreja no fim (Chegada)
            if (endChurchMarkerRef.current) {
              endChurchMarkerRef.current.remove();
            }
            endChurchMarkerRef.current = L.marker(routePoints[routePoints.length - 1], {
              icon: createChurchIcon()
            })
            .bindPopup(`
              <div style="font-family: inherit; font-size: 12px; text-align: center;">
                <strong>Chegada da Procissão</strong><br/>
                Paróquia São Sebastião
              </div>
            `)
            .addTo(mapInstanceRef.current);

            // Ajusta o zoom inicial para englobar toda a rota
            if (!hasFitBounds.current) {
              const bounds = L.latLngBounds([
                ...routePoints,
                [data.latitude, data.longitude]
              ]);
              mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
              hasFitBounds.current = true;
            }
          }
        }
      } else {
        // Fallback usando routeHistory se o GeoJSON não estiver carregado ainda
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

          if (!hasFitBounds.current) {
            const bounds = L.latLngBounds([
              ...routePoints,
              IGREJA_POSITION
            ]);
            mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
            hasFitBounds.current = true;
          }
        }
      }

      console.log('✅ FullRouteMap: Marcadores e rota atualizados');
    } catch (error) {
      console.error('❌ FullRouteMap: Erro ao atualizar marcadores:', error);
    }
  }, [data, routeHistory, isMapReady, routeGeoJson]);

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

      {/* Painel Flutuante do Rodapé */}
      <div className="absolute bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] md:bottom-4 left-4 right-4 z-[1000] max-w-lg mx-auto">
        <Card className="p-3 bg-background/95 backdrop-blur-md shadow-xl border border-border/80 rounded-xl space-y-2">
          {/* Header principal / Compact View */}
          <div 
            className="flex items-center justify-between cursor-pointer select-none"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-2.5 text-xs min-w-0">
              <Radio className="w-3.5 h-3.5 text-muted-foreground shrink-0 animate-pulse" />
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-foreground/90 text-[10px] uppercase tracking-wider">Último Movimento</span>
                <span className="text-muted-foreground font-mono text-[11px] truncate">
                  {new Date(data.deviceTime).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {!isExpanded && (
                <Badge variant={data.isInMotion ? "default" : "secondary"} className={`text-[10px] ${data.isInMotion ? "bg-green-500 hover:bg-green-600 text-white animate-pulse" : ""}`}>
                  {data.movementStatus.label}
                </Badge>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-full hover:bg-muted/50"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
              >
                {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
              </Button>
            </div>
          </div>

          {isExpanded && (
            <div className="space-y-3 pt-2 border-t border-border/40">
              {/* Top Row: Server Status */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      data.connectionStatus.state === 'live' 
                        ? 'bg-green-500 animate-pulse' 
                        : data.connectionStatus.state === 'delayed'
                        ? 'bg-yellow-500'
                        : 'bg-destructive'
                    }`} />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Servidor {data.connectionStatus.state === 'live' ? 'Ativo' : data.connectionStatus.state === 'delayed' ? 'Alerta' : 'Offline'}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    {data.connectionStatus.state === 'offline' ? (
                      <WifiOff className="w-3 h-3 text-destructive" />
                    ) : (
                      <Wifi className="w-3 h-3 text-muted-foreground" />
                    )}
                    Qualidade de Sinal: {health.performanceScore}%
                  </span>
                </div>
                
                <Badge variant={data.isInMotion ? "default" : "secondary"} className={data.isInMotion ? "bg-green-500 hover:bg-green-600 text-white" : ""}>
                  {data.movementStatus.label}
                </Badge>
              </div>

              <div className="border-t border-border/40 my-2" />

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {/* Velocidade & Movimento */}
                <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg border border-border/40">
                  <Gauge className="w-3.5 h-3.5 text-trucker-blue shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-foreground/80 text-[10px]">Velocidade</span>
                    <span className="text-muted-foreground font-mono truncate">{data.speedKmh} km/h</span>
                  </div>
                </div>

                {/* Bateria do Celular */}
                <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg border border-border/40">
                  {data.batteryStatus.state === 'critical' || data.batteryStatus.state === 'low' ? (
                    <BatteryLow className={`w-3.5 h-3.5 shrink-0 text-destructive animate-pulse`} />
                  ) : (
                    <Battery className={`w-3.5 h-3.5 shrink-0 ${data.batteryStatus.level > 0 ? 'text-green-500' : 'text-muted-foreground'}`} />
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-foreground/80 text-[10px]">Bateria Celular</span>
                    <span className="text-muted-foreground font-mono truncate">
                      {data.batteryStatus.level > 0 ? `${data.batteryStatus.level}%` : 'Sem dados'}
                    </span>
                  </div>
                </div>

                {/* Precisão do Sinal */}
                <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg border border-border/40">
                  <Compass className="w-3.5 h-3.5 text-trucker-blue shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-foreground/80 text-[10px]">Precisão GPS</span>
                    <span className="text-muted-foreground font-mono truncate">
                      {data.accuracy && data.accuracy < 1000 ? `±${data.accuracy.toFixed(1)}m` : 'Sem GPS'}
                    </span>
                  </div>
                </div>

                {/* Direção / Curso */}
                <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg border border-border/40">
                  <Navigation className="w-3.5 h-3.5 text-trucker-blue shrink-0 rotate-45" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-foreground/80 text-[10px]">Direção</span>
                    <span className="text-muted-foreground font-mono truncate">
                      {data.course ? `${data.course.toFixed(0)}°` : 'Parado'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-border/40 my-2" />

              {/* Relative Time Info */}
              <div className="text-[11px] text-muted-foreground pl-1 font-mono">
                Atualizado há: {data.lastUpdateRelative}
              </div>

              {/* Bottom Row: Direct Navigation Links */}
              <div className="flex gap-2 pt-1">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 text-xs gap-1.5 h-9" 
                  asChild
                >
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${data.latitude},${data.longitude}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center"
                  >
                    <Map className="w-4 h-4 mr-1.5 text-blue-500" />
                    Google Maps
                  </a>
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 text-xs gap-1.5 h-9" 
                  asChild
                >
                  <a 
                    href={`https://waze.com/ul?ll=${data.latitude},${data.longitude}&navigate=yes`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center"
                  >
                    <Navigation className="w-4 h-4 mr-1.5 text-emerald-600" />
                    Waze
                  </a>
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default FullRouteMap; 