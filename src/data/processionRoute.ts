import type { GeoJSONFeatureCollection } from '@/types/common';

const chapel: [number, number] = [-48.646721, -27.24173];

export const processionRouteGeoJson: GeoJSONFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          chapel,
          [-48.6459, -27.2409],
          [-48.6448, -27.2401],
          [-48.6438, -27.2408],
          [-48.6446, -27.2421],
          chapel
        ]
      },
      properties: {
        type: 'route-preview',
        name: 'Previa da procissao',
        description: 'Rota provisoria para visualizacao local. A rota oficial pode ser ajustada pela organizacao.'
      }
    }
  ]
};

export const processionPointsGeoJson: GeoJSONFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: chapel
      },
      properties: {
        type: 'church',
        name: 'Capela Santa Teresinha',
        description: 'Saida e retorno da procissao automotiva'
      }
    }
  ]
};
