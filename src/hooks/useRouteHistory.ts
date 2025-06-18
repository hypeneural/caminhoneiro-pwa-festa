import { useState, useEffect } from 'react';
import { useTraccarData } from './useTraccarData';

export interface RoutePoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  speed: number;
  course: number;
}

export const useRouteHistory = () => {
  const { data } = useTraccarData();
  const [routeHistory, setRouteHistory] = useState<RoutePoint[]>([]);
  const [isRecording, setIsRecording] = useState(true);

  useEffect(() => {
    if (!data) return;

    // Só adiciona ponto se estiver gravando e o ponto for válido
    if (isRecording && data.valid !== false) {
      setRouteHistory(prev => {
        // Evita duplicatas pelo timestamp
        if (prev.some(p => p.timestamp === data.fixTime)) {
          return prev;
        }

        // Adiciona novo ponto
        const newPoint: RoutePoint = {
          latitude: data.latitude,
          longitude: data.longitude,
          timestamp: data.fixTime,
          speed: data.speed || 0,
          course: data.course || 0
        };

        return [...prev, newPoint];
      });
    }
  }, [data, isRecording]);

  // Limpa histórico
  const clearHistory = () => {
    setRouteHistory([]);
  };

  // Toggle gravação
  const toggleRecording = () => {
    setIsRecording(prev => !prev);
  };

  // Exporta rota como GeoJSON
  const exportToGeoJSON = () => {
    const features = routeHistory.map(point => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [point.longitude, point.latitude]
      },
      properties: {
        timestamp: point.timestamp,
        speed: point.speed,
        course: point.course
      }
    }));

    // Adiciona linha conectando os pontos
    if (routeHistory.length > 1) {
      features.push({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: routeHistory.map(p => [p.longitude, p.latitude])
        },
        properties: {
          type: "route"
        }
      });
    }

    return {
      type: "FeatureCollection",
      features
    };
  };

  return {
    routeHistory,
    isRecording,
    clearHistory,
    toggleRecording,
    exportToGeoJSON
  };
}; 