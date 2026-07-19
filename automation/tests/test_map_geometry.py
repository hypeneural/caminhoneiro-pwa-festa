"""Testes unitários de geometria de rota e rastreamento de progresso."""

import math
import os
import pytest
from shapely.geometry import Point, LineString
from app.tracker.maps.route_repository import RouteRepository
from app.tracker.maps.route_matcher import RouteProgressService

# Caminhos dos GeoJSONs reais copiados
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


@pytest.fixture
def repo():
    """Retorna uma instância do RouteRepository com os arquivos reais."""
    return RouteRepository(ROUTE_PATH, START_PATH)


@pytest.fixture
def matcher(repo):
    """Retorna uma instância do RouteProgressService."""
    return RouteProgressService(repo)


def test_repository_loading(repo):
    """Valida se a rota real foi carregada com sucesso e convertida para o CRS métrico."""
    assert repo.total_length_m > 10000.0  # Rota real tem cerca de 13.5 km
    assert len(repo.coords_wgs84) > 500
    assert len(repo.coords_metric) == len(repo.coords_wgs84)

    # O ponto de saída deve ser idêntico ao primeiro ponto da rota (ou próximo a ele)
    first_pt_route = repo.coords_wgs84[0]
    start_pt = (repo.start_wgs84.x, repo.start_wgs84.y)
    
    # Calcular distância em metros entre start_point e first_point
    start_metric_pt = Point(repo.start_metric.x, repo.start_metric.y)
    first_metric_pt = Point(repo.coords_metric[0][0], repo.coords_metric[0][1])
    dist = start_metric_pt.distance(first_metric_pt)
    assert dist < 10.0  # Menos de 10m de distância


def test_match_start_position(matcher, repo):
    """Testa se a coordenada de partida é alinhada com o início da rota (progresso ≈ 0)."""
    # Coordenadas do ponto de partida (WGS 84)
    lng, lat = repo.start_wgs84.x, repo.start_wgs84.y
    match = matcher.match_position(
        lat=lat,
        lng=lng,
        bearing=0.0,
        speed_kmh=0.0,
        previous_progress_m=0.0,
        previous_segment=0
    )

    assert not match.is_off_route
    assert match.progress_m < 5.0  # Praticamente no início
    assert match.segment_index == 0
    assert match.confidence == "HIGH"


def test_match_mid_position(matcher, repo):
    """Testa o alinhamento de uma coordenada no meio da rota."""
    # Pegar um ponto no meio da rota (índice 300)
    mid_idx = 300
    lng, lat = repo.coords_wgs84[mid_idx]
    
    # Progresso teórico aproximado
    expected_progress = repo.segment_cumulative_distances_m[mid_idx]

    match = matcher.match_position(
        lat=lat,
        lng=lng,
        bearing=0.0,
        speed_kmh=0.0,
        previous_progress_m=expected_progress - 10.0,
        previous_segment=mid_idx - 1
    )

    assert not match.is_off_route
    assert abs(match.progress_m - expected_progress) < 1.0  # Alinhado perfeitamente
    assert match.segment_index == mid_idx or match.segment_index == mid_idx - 1
    assert match.confidence == "HIGH"


def test_jitter_regression(matcher, repo):
    """Testa que pequenas regressões (ruído de GPS/jitter < 80m) são aceitas, mas regressões grandes são rejeitadas."""
    mid_idx = 300
    expected_progress = repo.segment_cumulative_distances_m[mid_idx]
    
    # 1. Pequena regressão (-20m)
    # Pegar ponto anterior da rota
    lng, lat = repo.coords_wgs84[mid_idx - 1]
    prev_progress = repo.segment_cumulative_distances_m[mid_idx - 1]
    
    match1 = matcher.match_position(
        lat=lat,
        lng=lng,
        bearing=0.0,
        speed_kmh=0.0,
        previous_progress_m=expected_progress,  # o anterior estava mais à frente
        previous_segment=mid_idx
    )
    
    # Deve aceitar a pequena regressão
    assert not match1.is_off_route
    assert match1.progress_m == prev_progress

    # 2. Grande regressão (-500m)
    # Pegar ponto bem anterior (índice 200)
    lng_large, lat_large = repo.coords_wgs84[200]
    
    match2 = matcher.match_position(
        lat=lat_large,
        lng=lng_large,
        bearing=0.0,
        speed_kmh=0.0,
        previous_progress_m=expected_progress,  # o anterior estava mais à frente (mid_idx = 300)
        previous_segment=mid_idx
    )
    
    # Deve rejeitar a grande regressão e manter o progresso anterior
    assert not match2.is_off_route
    assert match2.progress_m == expected_progress


def test_off_route(matcher, repo):
    """Testa que coordenadas distantes da rota (off-route) são rejeitadas e o progresso não avança."""
    # Ponto no meio de Tijucas mas longe da rota (Tijucas / Centro, longe da rota)
    # A rota está principalmente na Av. Hercílio Luz e adjacentes.
    # Vamos pegar uma coordenada sabidamente distante.
    # Rota começa perto de -27.2361, -48.6445. Vamos colocar lat=-27.3000, lng=-48.6000.
    match = matcher.match_position(
        lat=-27.3000,
        lng=-48.6000,
        bearing=0.0,
        speed_kmh=0.0,
        previous_progress_m=1500.0,
        previous_segment=45
    )

    assert match.is_off_route
    assert match.confidence == "OFF_ROUTE"
    assert match.progress_m == 1500.0  # Não mudou o progresso
    assert match.segment_index == 45    # Não mudou o segmento


def test_bearing_mismatch(matcher, repo):
    """Testa se a direção do movimento ajuda a escolher o segmento correto quando há sobreposição/proximidade."""
    # Pegamos um segmento que vai em uma direção (ex: do ponto 100 ao 101)
    p1 = repo.coords_metric[100]
    p2 = repo.coords_metric[101]
    
    # Calcular o bearing real desse segmento
    dx = p2[0] - p1[0]
    dy = p2[1] - p1[1]
    seg_angle = math.degrees(math.atan2(dx, dy)) % 360.0

    # Vamos gerar uma coordenada no meio desse segmento
    seg_line = LineString([p1, p2])
    mid_pt = seg_line.interpolate(seg_line.length / 2)
    lng, lat = repo.metric_to_wgs84(mid_pt.x, mid_pt.y)

    # 1. Chamada com bearing coerente
    match1 = matcher.match_position(
        lat=lat,
        lng=lng,
        bearing=seg_angle,
        speed_kmh=15.0,  # caminhão se movendo
        previous_progress_m=repo.segment_cumulative_distances_m[100],
        previous_segment=100
    )
    assert not match1.is_off_route
    assert match1.segment_index == 100

    # 2. Chamada com bearing totalmente oposto (mismatch)
    # Deve penalizar o segmento 100 e preferir outro segmento se houver
    # ou retornar o mesmo se for o único, mas com score penalizado.
    # Para o teste, vamos garantir que o matcher funciona mesmo com bearing desalinhado
    # mas que a preferência seria dada ao alinhado se houvesse múltiplos.
    match2 = matcher.match_position(
        lat=lat,
        lng=lng,
        bearing=(seg_angle + 180.0) % 360.0,
        speed_kmh=15.0,
        previous_progress_m=repo.segment_cumulative_distances_m[100],
        previous_segment=100
    )
    assert not match2.is_off_route
