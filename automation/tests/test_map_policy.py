"""Testes unitários para as políticas de envio de mapa e seleção de mídia."""

import pytest
from datetime import datetime, timezone, timedelta
from app.tracker.models import VehicleSnapshot, VehicleState
from app.tracker.maps.models import RouteMatch
from app.tracker.maps.policy import MapSendPolicy, VisualContentPolicy


@pytest.fixture
def policy():
    return MapSendPolicy(
        enabled=True,
        min_interval_minutes=15,
        max_interval_minutes=45,
        min_progress_meters=400.0,
        max_accuracy_meters=75.0,
        max_fix_age_seconds=120.0,
        transition_cooldown_minutes=5
    )


@pytest.fixture
def base_snapshot():
    return VehicleSnapshot(
        vehicle_id="truck-1",
        name="São Cristóvão",
        vehicle_type="truck",
        lat=-27.2405,
        lng=-48.6310,
        speed_kmh=15.0,
        bearing=120.0,
        accuracy=10.0,
        battery=90,
        updated_at=datetime.now(timezone.utc),
        server_time=datetime.now(timezone.utc),
        stale=False,
        status="live"
    )


@pytest.fixture
def base_state():
    return VehicleState(
        vehicle_id="truck-1",
        current_status="MOVING",
        previous_status="UNKNOWN"
    )


def test_first_send(policy, base_snapshot, base_state):
    """Verifica que o primeiro envio é sempre elegível."""
    route_match = RouteMatch(
        progress_m=100.0,
        segment_index=5,
        snapped_lat=-27.2405,
        snapped_lng=-48.6310,
        distance_to_route_m=2.0,
        confidence="HIGH",
        is_off_route=False
    )
    decision = policy.check_eligibility(base_snapshot, base_state, route_match, datetime.now(timezone.utc))
    assert decision.eligible
    assert decision.reason == "first_map_send"


def test_poor_gps_accuracy(policy, base_snapshot, base_state):
    """Verifica que GPS com precisão ruim bloqueia o envio."""
    # Modificar snapshot para ter precisão ruim (ex: 150m)
    bad_snap = base_snapshot
    object.__setattr__(bad_snap, "accuracy", 150.0)

    route_match = RouteMatch(
        progress_m=100.0,
        segment_index=5,
        snapped_lat=-27.2405,
        snapped_lng=-48.6310,
        distance_to_route_m=2.0,
        confidence="HIGH",
        is_off_route=False
    )
    decision = policy.check_eligibility(bad_snap, base_state, route_match, datetime.now(timezone.utc))
    assert not decision.eligible
    assert "gps_accuracy_poor" in decision.reason


def test_gps_fix_stale(policy, base_snapshot, base_state):
    """Verifica que dados de GPS muito antigos bloqueiam o envio."""
    now = datetime.now(timezone.utc)
    old_snap = base_snapshot
    object.__setattr__(old_snap, "updated_at", now - timedelta(seconds=300))  # 5 minutos atrás

    route_match = RouteMatch(
        progress_m=100.0,
        segment_index=5,
        snapped_lat=-27.2405,
        snapped_lng=-48.6310,
        distance_to_route_m=2.0,
        confidence="HIGH",
        is_off_route=False
    )
    decision = policy.check_eligibility(old_snap, base_state, route_match, now)
    assert not decision.eligible
    assert "gps_fix_stale" in decision.reason


def test_off_route_blocked(policy, base_snapshot, base_state):
    """Verifica que estar fora da rota bloqueia o envio."""
    route_match = RouteMatch(
        progress_m=100.0,
        segment_index=5,
        snapped_lat=-27.2405,
        snapped_lng=-48.6310,
        distance_to_route_m=300.0,
        confidence="OFF_ROUTE",
        is_off_route=True
    )
    decision = policy.check_eligibility(base_snapshot, base_state, route_match, datetime.now(timezone.utc))
    assert not decision.eligible
    assert decision.reason == "vehicle_off_route"


def test_interval_and_progress_met(policy, base_snapshot, base_state):
    """Testa a regra principal (AND): intervalo mínimo E avanço mínimo de progresso."""
    now = datetime.now(timezone.utc)
    
    # Simular que enviou um mapa há 20 minutos com progresso de 1000m
    state = base_state
    state.last_map_sent_at = now - timedelta(minutes=20)
    state.last_map_sent_progress_m = 1000.0

    # Cenário 1: Avançou 500m (suficiente)
    route_match_ok = RouteMatch(
        progress_m=1500.0,
        segment_index=20,
        snapped_lat=-27.2405,
        snapped_lng=-48.6310,
        distance_to_route_m=2.0,
        confidence="HIGH",
        is_off_route=False
    )
    decision = policy.check_eligibility(base_snapshot, state, route_match_ok, now)
    assert decision.eligible
    assert decision.reason == "interval_and_progress_met"

    # Cenário 2: Avançou apenas 100m (insuficiente)
    route_match_low = RouteMatch(
        progress_m=1100.0,
        segment_index=20,
        snapped_lat=-27.2405,
        snapped_lng=-48.6310,
        distance_to_route_m=2.0,
        confidence="HIGH",
        is_off_route=False
    )
    decision2 = policy.check_eligibility(base_snapshot, state, route_match_low, now)
    assert not decision2.eligible
    assert decision2.reason == "policy_not_met"


def test_safety_timeout(policy, base_snapshot, base_state):
    """Testa a regra de safety timeout (45 minutos) com algum progresso básico (> 50m)."""
    now = datetime.now(timezone.utc)
    
    state = base_state
    state.last_map_sent_at = now - timedelta(minutes=50)
    state.last_map_sent_progress_m = 1000.0

    # Cenário 1: Avançou 80m (suficiente sob a regra de safety timeout)
    route_match_ok = RouteMatch(
        progress_m=1080.0,
        segment_index=20,
        snapped_lat=-27.2405,
        snapped_lng=-48.6310,
        distance_to_route_m=2.0,
        confidence="HIGH",
        is_off_route=False
    )
    decision = policy.check_eligibility(base_snapshot, state, route_match_ok, now)
    assert decision.eligible
    assert decision.reason == "safety_timeout_met"

    # Cenário 2: Avançou apenas 10m (insuficiente)
    route_match_low = RouteMatch(
        progress_m=1010.0,
        segment_index=20,
        snapped_lat=-27.2405,
        snapped_lng=-48.6310,
        distance_to_route_m=2.0,
        confidence="HIGH",
        is_off_route=False
    )
    decision2 = policy.check_eligibility(base_snapshot, state, route_match_low, now)
    assert not decision2.eligible
    assert decision2.reason == "policy_not_met"


def test_stopped_transition(policy, base_snapshot, base_state):
    """Testa a regra de transição de parada (STOPPED)."""
    now = datetime.now(timezone.utc)
    
    # Transição de MOVING para STOPPED
    state = base_state
    state.previous_status = "MOVING"
    state.current_status = "STOPPED"
    state.last_map_sent_at = now - timedelta(minutes=6)  # passou o cooldown de transição
    state.last_map_sent_progress_m = 1000.0

    # Caso 1: Está parado a uma distância relevante (+60m de onde enviou o último mapa)
    route_match_ok = RouteMatch(
        progress_m=1060.0,
        segment_index=20,
        snapped_lat=-27.2405,
        snapped_lng=-48.6310,
        distance_to_route_m=2.0,
        confidence="HIGH",
        is_off_route=False
    )
    decision = policy.check_eligibility(base_snapshot, state, route_match_ok, now)
    assert decision.eligible
    assert decision.reason == "transition_state_stopped"


def test_visual_content_selection():
    """Valida a prioridade de mídias do VisualContentPolicy."""
    # 1. Mapa elegível (alta prioridade)
    assert VisualContentPolicy.select_best_media(
        map_eligible=True,
        panorama_eligible=True
    ) == "map"

    # 2. Apenas panorama elegível
    assert VisualContentPolicy.select_best_media(
        map_eligible=False,
        panorama_eligible=True
    ) == "panorama"

    # 3. Nenhum elegível (texto)
    assert VisualContentPolicy.select_best_media(
        map_eligible=False,
        panorama_eligible=False
    ) == "text"
