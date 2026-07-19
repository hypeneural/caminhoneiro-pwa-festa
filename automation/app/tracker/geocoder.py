"""Geocodificação reversa local (offline) usando OSMnx e GeoPandas."""

import os
import time
import logging
import unicodedata
from functools import lru_cache
from typing import Optional, Any
import httpx

from .location_format import display_address

logger = logging.getLogger(__name__)


def _normalize(text: Optional[str]) -> str:
    """Normaliza texto para comparação (remove acentos, lowercase)."""
    if not text:
        return ""
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c)).lower().strip()


def normalize(text: Optional[str]) -> str:
    """Exporta a normalização para uso externo (ex: comparação de ruas)."""
    return _normalize(text)


class ReverseGeocoder:
    """Resolve coordenadas → endereço localmente (offline) usando OSMnx/GeoPandas.
    
    Caso os arquivos locais não existam, cai de volta de forma defensiva para
    o Nominatim (online) ou para strings genéricas, sem quebrar a execução.
    """

    def __init__(
        self,
        user_agent: str = "festadoscaminhoneiros-tracker/1.0",
        graph_path: str = "data/tijucas_ruas.graphml",
        bairros_path: str = "data/bairros_tijucas.geojson"
    ):
        self.user_agent = user_agent
        self.graph_path = graph_path
        self.bairros_path = bairros_path
        
        self.has_local_streets = False
        self.has_local_bairros = False
        
        self.graph = None
        self.transformer = None
        self.bairros_gdf = None
        
        self._last_online_request_at: float = 0.0
        
        # Inicializa se os arquivos já existirem
        self._init_local_data()

    def _init_local_data(self):
        """Carrega os dados espaciais de Tijucas do disco."""
        try:
            if os.path.exists(self.graph_path):
                import osmnx as ox
                from pyproj import Transformer
                
                logger.info(f"Carregando grafo viário local de: {self.graph_path}...")
                self.graph = ox.io.load_graphml(self.graph_path)
                
                graph_crs = self.graph.graph["crs"]
                self.transformer = Transformer.from_crs("EPSG:4326", graph_crs, always_xy=True)
                self.has_local_streets = True
            else:
                logger.warning(f"Grafo viário local '{self.graph_path}' não encontrado. Fallback online ativado.")

            if os.path.exists(self.bairros_path):
                import geopandas as gpd
                
                logger.info(f"Carregando polígonos dos bairros de: {self.bairros_path}...")
                self.bairros_gdf = gpd.read_file(self.bairros_path)
                self.bairros_gdf = self.bairros_gdf.to_crs(epsg=4326)
                self.has_local_bairros = True
            else:
                logger.warning(f"GeoJSON dos bairros '{self.bairros_path}' não encontrado.")

        except Exception as e:
            logger.error(f"Erro ao inicializar geocodificador local: {e}", exc_info=True)
            self.has_local_streets = False
            self.has_local_bairros = False

    def _throttle_online(self):
        """Garante pelo menos 1 segundo entre chamadas Nominatim online."""
        elapsed = time.monotonic() - self._last_online_request_at
        if elapsed < 1.1:
            time.sleep(1.1 - elapsed)

    def _online_fallback(self, lat: float, lng: float) -> dict:
        """Fallback online usando Nominatim HTTP."""
        self._throttle_online()
        self._last_online_request_at = time.monotonic()
        
        try:
            with httpx.Client(timeout=5.0) as client:
                response = client.get(
                    "https://nominatim.openstreetmap.org/reverse",
                    params={
                        "lat": lat,
                        "lon": lng,
                        "format": "jsonv2",
                        "zoom": 18,
                        "addressdetails": 1,
                    },
                    headers={"User-Agent": self.user_agent},
                )
                data = response.json()
                
                addr = data.get("address", {})
                road = addr.get("road", addr.get("pedestrian", ""))
                bairro = addr.get("suburb", addr.get("neighbourhood", ""))
                city = addr.get("city", addr.get("town", "Tijucas"))
                state = addr.get("state", "SC")
                
                parts = [p for p in [road, bairro] if p]
                address = ", ".join(parts) + f", {city}/{state}" if parts else data.get("display_name", "")
                
                return {
                    "address": display_address(address, lat, lng),
                    "street_name": road or None,
                    "city": city,
                    "state": state
                }
        except Exception as e:
            logger.warning(
                "Geocoder Online Fallback falhou (%s)",
                type(e).__name__,
            )
            return {
                "address": display_address(None, lat, lng),
                "street_name": None,
                "city": "Tijucas",
                "state": "SC"
            }

    def _resolve_street_local(self, latitude: float, longitude: float) -> Optional[dict]:
        """Localiza a rua mais próxima no grafo do OSM local."""
        if not self.has_local_streets or self.graph is None:
            return None
            
        try:
            import osmnx as ox
            # Reprojeta coordenadas WGS84 (lon, lat) para o CRS do grafo
            x, y = self.transformer.transform(longitude, latitude)
            
            # Encontra a aresta mais próxima e a distância em metros
            edge_res = ox.distance.nearest_edges(
                self.graph,
                X=x,
                Y=y,
                return_dist=True
            )
            
            edge, distance = edge_res
            u, v, key = edge
            edge_data = self.graph.edges[u, v, key]
            
            # Normalizar o nome da rua ou referência
            street = edge_data.get("name")
            if isinstance(street, list):
                street = " / ".join([str(item).strip() for item in street if item])
                
            ref = edge_data.get("ref")
            if isinstance(ref, list):
                ref = " / ".join([str(item).strip() for item in ref if item])
                
            road = street or ref
            return {
                "street": road,
                "distance_m": float(distance)
            }
        except Exception as e:
            logger.error(f"Erro na resolução de rua local: {e}")
            return None

    def _resolve_bairro_local(self, latitude: float, longitude: float) -> Optional[str]:
        """Verifica qual polígono de bairro contém o ponto."""
        if not self.has_local_bairros or self.bairros_gdf is None or self.bairros_gdf.empty:
            return None
            
        try:
            from shapely.geometry import Point
            point = Point(longitude, latitude)
            
            # Point in polygon
            matches = self.bairros_gdf[
                self.bairros_gdf.geometry.contains(point) |
                self.bairros_gdf.geometry.touches(point)
            ]
            
            if not matches.empty:
                return str(matches.iloc[0].get("name", "")).strip() or None
        except Exception as e:
            logger.error(f"Erro na resolução de bairro local: {e}")
            
        return None

    def reverse_geocode(self, lat: float, lng: float) -> dict:
        """Resolve latitude e longitude para endereço composto (offline/online fallback)."""
        # Se os dados não estiverem carregados, tenta inicializar (caso os arquivos tenham sido baixados agora)
        if not self.has_local_streets or not self.has_local_bairros:
            self._init_local_data()

        # Tentativa local
        street = None
        dist_m = 999.0
        
        street_res = self._resolve_street_local(lat, lng)
        if street_res:
            street = street_res["street"]
            dist_m = street_res["distance_m"]
            
        bairro = self._resolve_bairro_local(lat, lng)
        
        # Se falhar a rua local mas tiver internet, tenta o fallback online
        if not street and not self.has_local_streets:
            return self._online_fallback(lat, lng)
            
        # Constrói descrição do endereço
        city = "Tijucas"
        state = "SC"
        
        if street and dist_m <= 80:
            address_parts = [street]
            if bairro:
                address_parts.append(bairro)
            address_parts.append(f"{city}/{state}")
            full_address = ", ".join(address_parts)
            street_name = street
        else:
            street_name = None
            if bairro:
                full_address = f"Próximo a {bairro}, {city}/{state}"
            else:
                full_address = f"Próximo às coordenadas informadas, {city}/{state}"
                
        return {
            "address": full_address,
            "street_name": street_name,
            "city": city,
            "state": state
        }
