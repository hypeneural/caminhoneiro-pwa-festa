"""Script para baixar dados geográficos de Tijucas/SC (ruas e bairros)."""

import os
from pathlib import Path
import osmnx as ox
import geopandas as gpd

# Direcionar logs para console
ox.settings.log_console = True
ox.settings.use_cache = True

DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)

# Coordenadas de Tijucas no formato (left, bottom, right, top)
# longitude oeste, latitude sul, longitude leste, latitude norte
TIJUCAS_BBOX = (
    -48.75,  # left (oeste)
    -27.35,  # bottom (sul)
    -48.55,  # right (leste)
    -27.15,  # top (norte)
)


def download_streets():
    print("[INFO] 1. Baixando malha viária de Tijucas/SC...")
    try:
        # No OSMnx 2.x, bbox é um argumento posicional único: (left, bottom, right, top)
        graph = ox.graph.graph_from_bbox(
            TIJUCAS_BBOX,
            network_type="drive",
            retain_all=True,
        )
        
        # Projeta o grafo para coordenadas métricas (UTM da região de Santa Catarina)
        graph_projected = ox.projection.project_graph(graph)
        
        # Salva o arquivo GraphML
        graph_path = DATA_DIR / "tijucas_ruas.graphml"
        ox.io.save_graphml(graph_projected, filepath=str(graph_path))
        print(f"[OK] Malha viária salva com sucesso em: {graph_path}")
        
    except Exception as e:
        print(f"[ERROR] Erro ao baixar malha viária: {str(e)}")
        raise


def download_neighborhoods():
    print("\n[INFO] 2. Baixando polígonos dos bairros de Tijucas/SC...")
    bairros_path = DATA_DIR / "bairros_tijucas.geojson"
    try:
        # Consulta feições administrativas correspondentes a bairros em Tijucas
        tags = {
            "place": ["suburb", "neighbourhood", "quarter"],
            "admin_level": "10"
        }
        
        gdf = ox.features_from_place("Tijucas, Santa Catarina, Brazil", tags=tags)
        
        # Filtrar apenas feições poligonais (bairros desenhados como polígonos/multipolígonos)
        gdf = gdf[gdf.geometry.type.isin(["Polygon", "MultiPolygon"])]
        
        # Seleciona apenas as colunas necessárias para o GeoJSON
        if "name" in gdf.columns:
            gdf_bairros = gdf[["name", "geometry"]]
        else:
            gdf_bairros = gdf[["geometry"]].copy()
            gdf_bairros["name"] = "Bairro sem nome"
            
        # Exporta como GeoJSON no SRC de coordenadas geográficas padrão (EPSG:4326)
        gdf_bairros = gdf_bairros.to_crs(epsg=4326)
        gdf_bairros.to_file(str(bairros_path), driver="GeoJSON")
        print(f"[OK] Bairros de Tijucas salvos em: {bairros_path}")
        print(f"  Total de bairros encontrados: {len(gdf_bairros)}")
        for idx, row in gdf_bairros.iterrows():
            print(f"    - {row['name']}")
            
    except Exception as e:
        print(f"[WARNING] Erro ao baixar bairros: {str(e)}")
        print("Criando arquivo de bairros de fallback vazio para evitar erros em execução...")
        
        # Fallback para um GeoDataFrame vazio
        fallback_gdf = gpd.GeoDataFrame(columns=["name", "geometry"], geometry="geometry", crs="EPSG:4326")
        fallback_gdf.to_file(str(bairros_path), driver="GeoJSON")
        print(f"[OK] Arquivo de fallback vazio criado em: {bairros_path}")


def main():
    download_streets()
    download_neighborhoods()
    print("\n[OK] Download de todos os assets geográficos concluído com sucesso!")


if __name__ == "__main__":
    main()
