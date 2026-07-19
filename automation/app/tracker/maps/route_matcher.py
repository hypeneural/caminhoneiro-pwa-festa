"""Módulo de alinhamento e rastreamento de progresso na rota."""

import math
import logging
from typing import Optional, List, Tuple
from shapely.geometry import Point, LineString
from .models import RouteMatch
from .route_repository import RouteRepository

logger = logging.getLogger(__name__)

# Configurações de alinhamento
MAX_OFF_ROUTE_M = 200.0        # Distância máxima da rota para considerar "na rota"
STRICT_ON_ROUTE_M = 30.0       # Distância sob a qual é considerado perfeito (na rota)
MAX_GPS_JITTER_M = 80.0        # Regressões menores que esta tolerância são ignoradas


def calculate_segment_bearing(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
    """Calcula o ângulo do segmento em graus (0 = Norte, 90 = Leste, sentido horário)."""
    dx = p2[0] - p1[0]
    dy = p2[1] - p1[1]
    # Em coordenadas métricas UTM, X é Leste e Y é Norte.
    # math.atan2(dx, dy) nos dá o ângulo em relação ao eixo Y (Norte), sentido horário.
    angle_rad = math.atan2(dx, dy)
    angle_deg = math.degrees(angle_rad)
    return angle_deg % 360.0


def calculate_bearing_difference(b1: float, b2: float) -> float:
    """Calcula a menor diferença angular em graus entre duas direções."""
    diff = abs(b1 - b2)
    return min(diff, 360.0 - diff)


class RouteProgressService:
    """Resolve a posição do veículo alinhando-a com a rota e gerenciando o progresso histórico."""

    def __init__(
        self,
        repository: RouteRepository,
        max_off_route_m: float = MAX_OFF_ROUTE_M,
    ):
        max_off_route_m = float(max_off_route_m)
        if not math.isfinite(max_off_route_m) or max_off_route_m <= 0:
            raise ValueError("max_off_route_m must be a positive finite value")

        self.repo = repository
        self.max_off_route_m = max_off_route_m

    def match_position(
        self,
        lat: float,
        lng: float,
        bearing: float,
        speed_kmh: float,
        previous_progress_m: Optional[float] = None,
        previous_segment: Optional[int] = None,
        elapsed_seconds: Optional[float] = None,
    ) -> RouteMatch:
        """
        Encontra o melhor ponto de alinhamento na rota para a coordenada GPS atual,
        considerando a direção e o progresso histórico para evitar saltos.
        """
        # Converter GPS para métrico
        x, y = self.repo.wgs84_to_metric(lng, lat)
        gps_point = Point(x, y)

        candidates = []

        # 1. Avaliar cada segmento da rota
        for i in range(len(self.repo.coords_metric) - 1):
            p1 = self.repo.coords_metric[i]
            p2 = self.repo.coords_metric[i+1]
            seg_line = LineString([p1, p2])

            # Projetar ponto no segmento
            projected_dist = seg_line.project(gps_point)
            snapped_point = seg_line.interpolate(projected_dist)
            
            # Distância perpendicular à rota
            distance_to_route = gps_point.distance(snapped_point)

            if distance_to_route > self.max_off_route_m:
                continue

            # Progresso acumulado se escolhermos este candidato
            candidate_progress = self.repo.segment_cumulative_distances_m[i] + projected_dist

            # Calcular bearing do segmento
            seg_bearing = calculate_segment_bearing(p1, p2)
            bearing_diff = calculate_bearing_difference(bearing, seg_bearing)

            candidates.append({
                "segment_index": i,
                "projected_dist": projected_dist,
                "snapped_point": snapped_point,
                "distance_to_route": distance_to_route,
                "progress_m": candidate_progress,
                "seg_bearing": seg_bearing,
                "bearing_diff": bearing_diff,
            })

        if not candidates:
            # Fora da rota (nenhum segmento próximo)
            # Retorna o próprio GPS sem alterar o progresso histórico (ou 0.0 se não houver histórico)
            fallback_progress = previous_progress_m if previous_progress_m is not None else 0.0
            fallback_seg = previous_segment if previous_segment is not None else 0
            return RouteMatch(
                progress_m=fallback_progress,
                segment_index=fallback_seg,
                snapped_lat=lat,
                snapped_lng=lng,
                distance_to_route_m=999.0,
                confidence="OFF_ROUTE",
                is_off_route=True,
            )

        # 2. Avaliar e pontuar os candidatos com base em restrições físicas e histórico
        best_candidate = None
        best_score = float("inf")  # Menor score (penalidade) é melhor

        for cand in candidates:
            score = 0.0

            # Penalidade 1: Distância perpendicular à rota (queremos estar o mais perto possível)
            score += cand["distance_to_route"] * 1.5

            if previous_progress_m is not None:
                delta_progress = cand["progress_m"] - previous_progress_m

                # Penalidade 2: Regressão
                if delta_progress < 0:
                    abs_regress = abs(delta_progress)
                    if abs_regress > MAX_GPS_JITTER_M:
                        # Regressão pesada (> 80m) - muito improvável para o caminhão
                        score += 5000.0 + (abs_regress * 10.0)
                    else:
                        # Pequena regressão de jitter/ruído - permitida com penalidade leve
                        score += abs_regress * 0.5

                # Penalidade 3: Saltos grandes demais para frente
                if delta_progress > 0:
                    # Se tivermos tempo decorrido, podemos validar a velocidade física
                    if elapsed_seconds is not None and elapsed_seconds > 0:
                        max_speed_mps = max(speed_kmh, 40.0) / 3.6  # mínimo 40kmh para tolerar jitter
                        max_possible_dist = max_speed_mps * elapsed_seconds * 1.5
                        if delta_progress > max_possible_dist:
                            score += (delta_progress - max_possible_dist) * 5.0
                    else:
                        # Sem tempo decorrido, penaliza saltos maiores de 500m
                        if delta_progress > 500.0:
                            score += (delta_progress - 500.0) * 3.0

            # Penalidade 4: Direção inconsistente (somente se estiver em velocidade > 3 km/h)
            if speed_kmh >= 3.0:
                if cand["bearing_diff"] > 90.0:
                    # Direção oposta ao fluxo da rota
                    score += cand["bearing_diff"] * 8.0
                else:
                    score += cand["bearing_diff"] * 1.0

            # Escolher o melhor candidato
            if score < best_score:
                best_score = score
                best_candidate = cand

        if best_candidate is None:
            # Fallback seguro
            best_candidate = min(candidates, key=lambda c: c["distance_to_route"])

        # 3. Determinar confiança e retorno
        dist_to_route = best_candidate["distance_to_route"]
        is_off_route = dist_to_route > self.max_off_route_m
        
        if is_off_route:
            confidence = "OFF_ROUTE"
            # Se está fora da rota, o progresso não avança, mantém o histórico
            prog = previous_progress_m if previous_progress_m is not None else 0.0
            seg = previous_segment if previous_segment is not None else 0
            snapped_lat, snapped_lng = lat, lng
        else:
            if dist_to_route <= STRICT_ON_ROUTE_M:
                confidence = "HIGH"
            elif dist_to_route <= 100.0:
                confidence = "MEDIUM"
            else:
                confidence = "LOW"
            
            prog = best_candidate["progress_m"]
            seg = best_candidate["segment_index"]
            # Converter snapped metric de volta para WGS84
            p_snap = best_candidate["snapped_point"]
            snapped_lng, snapped_lat = self.repo.metric_to_wgs84(p_snap.x, p_snap.y)

        # Regressões não devem ser salvas no progresso oficial se forem grandes,
        # mas pequenas regressões (jitter) são mantidas para precisão.
        if previous_progress_m is not None and not is_off_route:
            delta = prog - previous_progress_m
            if delta < -MAX_GPS_JITTER_M:
                # Rejeita a regressão pesada, mantém o progresso anterior
                prog = previous_progress_m
                seg = previous_segment if previous_segment is not None else seg

        return RouteMatch(
            progress_m=prog,
            segment_index=seg,
            snapped_lat=snapped_lat,
            snapped_lng=snapped_lng,
            distance_to_route_m=dist_to_route,
            confidence=confidence,
            is_off_route=is_off_route,
        )
