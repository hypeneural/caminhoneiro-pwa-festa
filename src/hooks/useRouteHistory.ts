
import { useState, useEffect } from 'react';
import { useTraccarData } from './useTraccarData';

export interface RoutePoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  speed: number;
  course: number;
}

// Proper GeoJSON types
interface PointFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    timestamp: string;
    speed: number;
    course: number;
  };
}

interface LineStringFeature {
  type: "Feature";
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
  properties: {
    routeType: string;
  };
}

type GeoJSONFeature = PointFeature | LineStringFeature;

interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
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
  const exportToGeoJSON = (): GeoJSONFeatureCollection => {
    const features: GeoJSONFeature[] = [];

    // Adiciona pontos individuais
    routeHistory.forEach(point => {
      const pointFeature: PointFeature = {
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
      };
      features.push(pointFeature);
    });

    // Adiciona linha conectando os pontos se houver mais de um
    if (routeHistory.length > 1) {
      const lineFeature: LineStringFeature = {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: routeHistory.map(p => [p.longitude, p.latitude] as [number, number])
        },
        properties: {
          routeType: "path"
        }
      };
      features.push(lineFeature);
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
