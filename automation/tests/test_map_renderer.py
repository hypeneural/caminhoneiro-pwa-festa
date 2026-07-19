"""Testes unitários e de integração para o renderizador de mapas."""

import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace

import pytest

from app.tracker.maps.build_vector_basemap import build_vector_basemap
from app.tracker.maps.models import MapJob
from app.tracker.maps.route_repository import RouteRepository
from app.tracker.maps.renderer import LeafletMapRenderer, MapRenderError

# Caminhos dos GeoJSONs reais
ROUTE_PATH = os.path.abspath(
    os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "shared",
        "geodata",
        "procissao-route-v1.geojson"
    )
)
START_PATH = os.path.abspath(
    os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "shared",
        "geodata",
        "procissao-start-v1.geojson"
    )
)

AUTOMATION_DIR = Path(__file__).resolve().parents[1]
MAPS_DIR = AUTOMATION_DIR / 'app' / 'tracker' / 'maps'
BASEMAP_PATH = MAPS_DIR / 'assets' / 'street_network.geojson'
MAP_TEMPLATE_PATH = MAPS_DIR / 'assets' / 'map_collage.html'
GRAPHML_PATH = AUTOMATION_DIR / 'data' / 'tijucas_ruas.graphml'


def test_vector_basemap_geojson_contract():
    document = json.loads(BASEMAP_PATH.read_text(encoding='utf-8'))
    metadata = document['metadata']
    features = document['features']

    assert document['type'] == 'FeatureCollection'
    assert metadata['schema'] == 'tracker-vector-basemap-v1'
    assert metadata['featureCount'] == len(features)
    assert len(features) >= 100
    assert metadata['source'] == GRAPHML_PATH.name
    assert metadata['sourceSha256'] == hashlib.sha256(GRAPHML_PATH.read_bytes()).hexdigest()
    assert len(metadata['bounds']) == 4

    for feature in features:
        assert feature['type'] == 'Feature'
        assert feature['geometry']['type'] == 'LineString'
        assert len(feature['geometry']['coordinates']) >= 2
        assert feature['properties']['highway']


def test_vector_basemap_build_is_deterministic(tmp_path):
    generated_path = tmp_path / 'street_network.geojson'
    generated = build_vector_basemap(GRAPHML_PATH, generated_path)
    checked_in = json.loads(BASEMAP_PATH.read_text(encoding='utf-8'))

    assert generated == checked_in
    assert generated_path.read_bytes() == BASEMAP_PATH.read_bytes()


def test_map_template_uses_only_local_vector_resources():
    html = MAP_TEMPLATE_PATH.read_text(encoding='utf-8')
    normalized = html.lower()

    assert 'l.tilelayer' not in normalized
    assert '/tiles/' not in normalized
    assert 'http://' not in normalized
    assert 'https://' not in normalized
    assert 'src="//' not in normalized
    assert "src='//" not in normalized
    assert 'href="//' not in normalized
    assert "href='//" not in normalized
    assert 'url(//' not in normalized
    assert "performance.getentriesbytype('resource')" in normalized
    assert 'countexternalrequests()' in normalized
    assert "l.latlngbounds([startlatlng, currentlatlng])" in normalized
    assert "progressfocusbounds.extend(snappedlatlng)" in normalized
    assert "map3.fitbounds(progressfocusbounds" in normalized
    assert "color: '#2563eb'" in normalized


def test_renderer_accepts_valid_vector_result():
    LeafletMapRenderer._validate_render_result({
        'ready': True,
        'baseFeatureCount': 100,
        'externalRequests': 0,
    })


def test_renderer_prefers_snapped_coordinates_when_available():
    current_only = SimpleNamespace(latitude=-27.24, longitude=-48.63)
    snapped_none = SimpleNamespace(
        latitude=-27.24,
        longitude=-48.63,
        snapped_lat=None,
        snapped_lng=None,
    )
    snapped = SimpleNamespace(
        latitude=-27.24,
        longitude=-48.63,
        snapped_lat=-27.241,
        snapped_lng=-48.631,
    )

    assert LeafletMapRenderer._snapped_coordinates(current_only) == [-27.24, -48.63]
    assert LeafletMapRenderer._snapped_coordinates(snapped_none) == [-27.24, -48.63]
    assert LeafletMapRenderer._snapped_coordinates(snapped) == [-27.241, -48.631]


def test_renderer_formats_timestamp_in_sao_paulo_timezone():
    utc_timestamp = datetime(2026, 7, 18, 18, 30, tzinfo=timezone.utc)

    assert LeafletMapRenderer._display_timestamp(utc_timestamp) == "18/07/2026 às 15:30:00"


@pytest.mark.parametrize('result', [
    None,
    [],
    {},
    {'ready': False, 'baseFeatureCount': 100, 'externalRequests': 0},
    {'ready': True, 'error': 'boom', 'baseFeatureCount': 100, 'externalRequests': 0},
    {'ready': True, 'baseFeatureCount': 99, 'externalRequests': 0},
    {'ready': True, 'baseFeatureCount': 100, 'externalRequests': 1},
])
def test_renderer_rejects_invalid_vector_result(result):
    with pytest.raises(MapRenderError):
        LeafletMapRenderer._validate_render_result(result)


@pytest.fixture
def repo():
    return RouteRepository(ROUTE_PATH, START_PATH)


@pytest.fixture
def renderer():
    # Inicializa o renderer com headless=True e timeouts curtos para testes
    r = LeafletMapRenderer(
        headless=True,
        page_timeout_seconds=15.0,
        max_jpeg_bytes=1_000_000
    )
    yield r
    # Tear down: garante que encerra o Chrome e o servidor de assets local
    r.close()


def test_server_startup(renderer):
    """Valida que o servidor de assets inicia na porta aleatória escolhida pelo SO."""
    port = renderer.server.start()
    assert port > 0
    assert renderer.server.port == port
    assert renderer.server._server.server_address[0] == '127.0.0.1'
    
    # Parar servidor
    renderer.server.stop()
    assert renderer.server._server is None


def test_renderer_collage(renderer, repo):
    """Gera uma imagem de colagem de teste e valida o JPEG de saída."""
    # Criar um job simulado
    job = MapJob(
        vehicle_id="caminhao_test",
        phone="5548996553954",
        latitude=-27.2405,  # Ponto no meio da rota
        longitude=-48.6310,
        bearing=120.0,
        speed_kmh=15.0,
        battery=88,
        address="Av. Hercílio Luz, Tijucas - SC",
        updated_at=datetime.now(timezone.utc),
        requested_at=datetime.now(timezone.utc),
        event_type="moving",
        progress_m=3500.0,
        segment_index=150,
        route_version="procissao-route-v1",
        snapped_lat=-27.2404,
        snapped_lng=-48.6309,
    )

    # Recortar a rota simulada até o progresso atual
    progress_coords = repo.coords_wgs84[:151]

    # Renderizar
    artifact = renderer.render_collage(
        job=job,
        route_wgs84=repo.coords_wgs84,
        progress_wgs84=progress_coords,
        start_coords=(repo.start_wgs84.y, repo.start_wgs84.x),  # lat, lng
        total_length_m=repo.total_length_m
    )

    # Validações do artefato de saída
    assert artifact.jpeg_bytes is not None
    assert len(artifact.jpeg_bytes) > 10000  # Deve ter pelo menos 10KB
    assert artifact.width == 1080
    assert artifact.height == 1350
    assert artifact.progress_m == 3500.0

    # Verifica se os bytes correspondem a um cabeçalho JPEG válido (FF D8)
    assert artifact.jpeg_bytes.startswith(b"\xff\xd8")
    
    # Grava a imagem gerada temporariamente para inspeção visual do desenvolvedor
    output_dir = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), "scratch"))
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, "test_render_collage.jpg")
    with open(output_file, "wb") as f:
        f.write(artifact.jpeg_bytes)
    
    assert os.path.exists(output_file)
    print(f"Imagem de teste salva com sucesso em {output_file}")
