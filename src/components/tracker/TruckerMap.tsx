import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import { DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TraccarData } from '@/hooks/useTraccarData';

interface TruckerMapProps {
  data: TraccarData;
}

// Coordenadas do ponto de partida (Igreja)
const START_POINT: LatLngExpression = [-27.236099, -48.644599];

// Ícone customizado da igreja (ponto de partida)
const startIcon = new DivIcon({
  html: `
    <div style="
      background: #1e3a8a; 
      color: white; 
      border-radius: 50%; 
      width: 32px; 
      height: 32px; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      font-size: 16px;
    ">⛪</div>
  `,
  className: 'custom-start-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

// Ícone customizado do caminhão
const createTruckIcon = (course: number = 0) => new DivIcon({
  html: `
    <div style="
      transform: rotate(${course}deg);
      transition: transform 0.3s ease;
      width: 32px; 
      height: 32px; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
      font-size: 24px;
    ">🚛</div>
  `,
  className: 'custom-truck-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

// Componente para ajustar automaticamente o bounds do mapa
const AutoBounds: React.FC<{ truckPosition: LatLngExpression }> = ({ truckPosition }) => {
  const map = useMap();
  
  useEffect(() => {
    const bounds: [[number, number], [number, number]] = [
      [START_POINT[0] as number, START_POINT[1] as number],
      [truckPosition[0] as number, truckPosition[1] as number]
    ];
    map.fitBounds(bounds, { 
      padding: [20, 20],
      maxZoom: 16 
    });
  }, [map, truckPosition]);
  
  return null;
};

export const TruckerMap: React.FC<TruckerMapProps> = ({ data }) => {
  console.log('🗺️ Renderizando TruckerMap com dados:', data);
  
  const truckPosition: LatLngExpression = [data.latitude, data.longitude];
  const truckIcon = createTruckIcon(data.course || 0);
  
  // Simulação de rastro recente (últimos pontos)
  // Em uma implementação real, isso viria de uma API histórica
  const recentTrail: LatLngExpression[] = [
    START_POINT,
    [-27.235, -48.645],
    [-27.240, -48.646],
    truckPosition
  ];

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      <MapContainer
        center={truckPosition}
        zoom={14}
        className="w-full h-full"
        zoomControl={false}
        attributionControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
        />
        
        <Marker position={START_POINT} icon={startIcon} />
        
        <Marker position={truckPosition} icon={truckIcon} />
        
        <Polyline 
          positions={recentTrail}
          pathOptions={{
            color: "#1e3a8a",
            weight: 4,
            opacity: 0.8
          }}
        />
        
        <AutoBounds truckPosition={truckPosition} />
      </MapContainer>
      
      {/* Overlay com velocidade */}
      <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-lg px-2 py-1 z-[1000]">
        <span className="text-xs font-bold text-foreground">
          {Math.round((data.speed || 0) * 1.852)} km/h
        </span>
      </div>
    </div>
  );
};