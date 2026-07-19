"""Repositório de rotas do sistema de rastreamento."""

import json
import logging
import os
from typing import List, Tuple, Optional
from pyproj import Transformer
from shapely.geometry import shape, LineString, Point
from shapely.ops import transform

logger = logging.getLogger(__name__)


class RouteRepository:
    """Carrega, valida e gerencia as representações métricas e geográficas da rota."""

    def __init__(self, route_geojson_path: str, start_geojson_path: str):
        self.route_geojson_path = route_geojson_path
        self.start_geojson_path = start_geojson_path
        self.version = "v1"  # Padrão básico, derivado do nome do arquivo se possível

        # Geometrias originais (WGS 84 - EPSG:4326)
        self.route_wgs84: Optional[LineString] = None
        self.start_wgs84: Optional[Point] = None

        # Geometrias métricas (SIRGAS 2000 / UTM 22S - EPSG:31982)
        self.route_metric: Optional[LineString] = None
        self.start_metric: Optional[Point] = None

        # Dados da rota e segmentos
        self.coords_wgs84: List[Tuple[float, float]] = []  # [(lon, lat), ...]
        self.coords_metric: List[Tuple[float, float]] = []  # [(x, y), ...]
        self.segment_cumulative_distances_m: List[float] = []  # Distância acumulada no início de cada segmento
        self.segment_lengths_m: List[float] = []  # Comprimento de cada segmento
        self.total_length_m: float = 0.0

        # Inicializa o repositório
        self._load_and_initialize()

    def _load_and_initialize(self):
        """Carrega os arquivos e realiza as transformações geométricas."""
        # 1. Carregar Rota
        if not os.path.exists(self.route_geojson_path):
            raise FileNotFoundError(f"Arquivo de rota não encontrado: {self.route_geojson_path}")

        with open(self.route_geojson_path, "r", encoding="utf-8") as f:
            route_data = json.load(f)

        features = route_data.get("features", [])
        if not features:
            raise ValueError("O GeoJSON de rota não possui features.")

        # Encontra a primeira LineString na FeatureCollection
        route_geom = None
        for feat in features:
            geom_type = feat.get("geometry", {}).get("type")
            if geom_type == "LineString":
                route_geom = shape(feat["geometry"])
                break

        if route_geom is None or not isinstance(route_geom, LineString):
            raise ValueError("Nenhuma LineString válida encontrada no GeoJSON de rota.")

        self.route_wgs84 = route_geom
        self.coords_wgs84 = list(route_geom.coords)

        # Determina a versão a partir do nome do arquivo
        self.version = os.path.basename(self.route_geojson_path).replace(".geojson", "")

        # 2. Carregar Ponto de Partida
        if not os.path.exists(self.start_geojson_path):
            raise FileNotFoundError(f"Arquivo de ponto de partida não encontrado: {self.start_geojson_path}")

        with open(self.start_geojson_path, "r", encoding="utf-8") as f:
            start_data = json.load(f)

        start_features = start_data.get("features", [])
        start_geom = None
        for feat in start_features:
            geom_type = feat.get("geometry", {}).get("type")
            if geom_type == "Point":
                start_geom = shape(feat["geometry"])
                break

        if start_geom is None or not isinstance(start_geom, Point):
            # Fallback para o primeiro ponto da rota
            self.start_wgs84 = Point(self.coords_wgs84[0][0], self.coords_wgs84[0][1])
            logger.warning("Nenhum ponto de partida válido encontrado no GeoJSON. Usando início da rota.")
        else:
            # Garante apenas x, y (remove z se existir)
            self.start_wgs84 = Point(start_geom.x, start_geom.y)

        # 3. Transformadores de CRS (WGS 84 -> SIRGAS 2000 / UTM 22S)
        to_metric = Transformer.from_crs("EPSG:4326", "EPSG:31982", always_xy=True)

        self.route_metric = transform(to_metric.transform, self.route_wgs84)
        self.start_metric = transform(to_metric.transform, self.start_wgs84)
        self.coords_metric = list(self.route_metric.coords)

        # 4. Calcular comprimentos de segmentos e distâncias acumuladas
        current_cumulative = 0.0
        self.segment_cumulative_distances_m = []
        self.segment_lengths_m = []

        for i in range(len(self.coords_metric) - 1):
            p1 = self.coords_metric[i]
            p2 = self.coords_metric[i+1]
            # Distância euclidiana no plano projetado (UTM metros)
            seg_len = Point(p1).distance(Point(p2))
            
            self.segment_cumulative_distances_m.append(current_cumulative)
            self.segment_lengths_m.append(seg_len)
            current_cumulative += seg_len

        self.total_length_m = current_cumulative
        logger.info(
            f"Rota '{self.version}' carregada com sucesso. "
            f"Comprimento total: {self.total_length_m:.2f}m em {len(self.coords_metric)} pontos."
        )

    def wgs84_to_metric(self, lon: float, lat: float) -> Tuple[float, float]:
        """Converte longitude/latitude para coordenadas métricas UTM 22S."""
        to_metric = Transformer.from_crs("EPSG:4326", "EPSG:31982", always_xy=True)
        return to_metric.transform(lon, lat)

    def metric_to_wgs84(self, x: float, y: float) -> Tuple[float, float]:
        """Converte coordenadas métricas UTM 22S para longitude/latitude."""
        to_wgs84 = Transformer.from_crs("EPSG:31982", "EPSG:4326", always_xy=True)
        return to_wgs84.transform(x, y)
