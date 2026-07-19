"""Testes de fluxo de integração ponta a ponta para o rastreamento com mapa."""

import pytest
import sqlite3
import threading
from datetime import datetime, timezone, timedelta
from typing import Optional

from app.tracker.models import VehicleSnapshot, VehicleState
from app.tracker.tracker_db import TrackerDB
from app.tracker.geocoder import ReverseGeocoder
from app.tracker.engine import TrackerEngine
from app.tracker.zapi_client import ZAPIClient

from app.tracker.maps.route_repository import RouteRepository
from app.tracker.maps.route_matcher import RouteProgressService
from app.tracker.maps.policy import MapSendPolicy, VisualContentPolicy
from app.tracker.maps.dispatcher import MapDispatcher
from app.tracker.maps.renderer import LeafletMapRenderer


class MockZAPIClient(ZAPIClient):
    def __init__(self):
        self.sent_messages = []
        self.sent_locations = []
        self.sent_images = []

    def send_text(self, phone: str, message: str):
        self.sent_messages.append({"phone": phone, "message": message})
        return {"messageId": f"msg-txt-{len(self.sent_messages)}"}

    def send_location(self, phone: str, lat: float, lng: float, title: str, address: str):
        self.sent_locations.append({"phone": phone, "lat": lat, "lng": lng, "title": title, "address": address})
        return {"messageId": f"msg-loc-{len(self.sent_locations)}"}

    def send_image_bytes(self, phone: str, image_bytes: bytes, caption: str, mime_type: str = "image/jpeg"):
        self.sent_images.append({"phone": phone, "bytes_len": len(image_bytes), "caption": caption})
        return {"messageId": f"msg-img-{len(self.sent_images)}"}


class MockMapRenderer(LeafletMapRenderer):
    def __init__(self):
        pass

    def render_collage(self, job, route_wgs84, progress_wgs84, start_coords, total_length_m):
        from app.tracker.maps.models import MapArtifact
        return MapArtifact(
            jpeg_bytes=b"fake-jpeg-collage-data",
            width=1080,
            height=1350,
            progress_m=total_length_m,
            captured_at=datetime.now()
        )

    def close(self):
        pass


@pytest.fixture
def mock_db(tmp_path):
    # Cria banco temporário em arquivo
    db_path = tmp_path / "test_tracker.db"
    db = TrackerDB(str(db_path))
    return db


@pytest.fixture
def zapi():
    return MockZAPIClient()


@pytest.fixture
def geocoder():
    class DummyGeocoder:
        def reverse_geocode(self, lat, lng):
            return {
                "address": "Rua Oficial, Tijucas, SC",
                "street_name": "Rua Oficial",
                "city": "Tijucas",
                "state": "SC"
            }
    return DummyGeocoder()


@pytest.fixture
def route_repo():
    # Carrega o GeoJSON real de procissao-route-v1.geojson para ter coordenadas reais para o teste
    import os
    test_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.dirname(os.path.dirname(test_dir))
    route_path = os.path.join(repo_root, "shared", "geodata", "procissao-route-v1.geojson")
    start_path = os.path.join(repo_root, "shared", "geodata", "procissao-start-v1.geojson")
    
    return RouteRepository(
        route_geojson_path=route_path,
        start_geojson_path=start_path
    )


@pytest.fixture
def route_matcher(route_repo):
    return RouteProgressService(repository=route_repo)


@pytest.fixture
def map_policy():
    # Política configurada com limites baixos para facilitar testes
    return MapSendPolicy(
        enabled=True,
        min_interval_minutes=15,
        max_interval_minutes=45,
        min_progress_meters=400.0,
        max_accuracy_meters=75.0,
        max_fix_age_seconds=120.0,
        transition_cooldown_minutes=5
    )


def test_tracker_engine_enqueues_map_on_movement(mock_db, zapi, geocoder, route_repo, route_matcher, map_policy):
    """Garante que quando o veículo se move na rota, a imagem de mapa é enfileirada no dispatcher."""
    
    renderer = MockMapRenderer()
    
    # Criar dispatcher
    dispatcher = MapDispatcher(
        db=mock_db,
        renderer=renderer,
        zapi=zapi,
        route_repo=route_repo,
        lease_seconds=30.0,
        max_job_age_seconds=300.0,
        idle_poll_seconds=0.1,
        send_attempts=1,
        instance_id="test-inst"
    )
    dispatcher.stop()
    
    engine = TrackerEngine(
        zapi=zapi,
        db=mock_db,
        geocoder=geocoder,
        phone="5548996553954",
        panorama_dispatcher=None,
        map_dispatcher=dispatcher,
        map_policy=map_policy,
        route_progress_service=route_matcher,
        combined_message_enabled=True
    )
    
    # Primeiro ponto de telemetria na largada (aproximadamente -27.24838, -48.63223)
    start_pt = route_repo.coords_wgs84[0] # lat, lng
    
    now = datetime.now(timezone.utc)
    snapshot1 = VehicleSnapshot(
        vehicle_id="sao-cristovao",
        name="São Cristóvão",
        vehicle_type="truck",
        lat=start_pt[1],
        lng=start_pt[0],
        speed_kmh=10.0,
        bearing=180.0,
        accuracy=5.0,
        battery=85,
        updated_at=now,
        server_time=now,
        stale=False,
        status="live"
    )
    
    state = mock_db.load_state("sao-cristovao")
    engine.process_snapshot(snapshot1, state, now)
    
    # Verifica que registrou e enfileirou o primeiro envio (first_map_send)
    state = mock_db.load_state("sao-cristovao")
    assert state.last_route_progress_m is not None
    assert state.last_route_progress_m >= 0.0
    
    # Consultar outbox do banco de dados
    with mock_db._connect() as conn:
        conn.row_factory = sqlite3.Row
        job_row = conn.execute("SELECT * FROM notification_outbox WHERE channel = 'map'").fetchone()
        
    assert job_row is not None
    assert job_row["status"] == "queued"
    
    # Executar processamento em background de um job no dispatcher
    dispatcher._recover_abandoned()
    
    # Reclamar e processar
    claimed = mock_db.claim_notification(channel="map", lease_owner=dispatcher._owner, lease_seconds=30.0)
    assert claimed is not None
    
    dispatcher._process(claimed, dispatcher._owner, lease_lost=threading.Event())
    
    # Garante que enviou a imagem com sucesso pela ZAPI e completou a transação no SQLite
    assert len(zapi.sent_images) == 1
    assert zapi.sent_images[0]["bytes_len"] == len(b"fake-jpeg-collage-data")
    assert "Progresso estimado na rota oficial" in zapi.sent_images[0]["caption"]
    
    state_after = mock_db.load_state("sao-cristovao")
    assert state_after.last_map_sent_at is not None
    assert state_after.last_map_sent_progress_m == state.last_route_progress_m
    
    # Limpeza
    dispatcher.stop()
