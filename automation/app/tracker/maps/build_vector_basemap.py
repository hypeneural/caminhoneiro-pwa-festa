"""Build the deterministic, offline street basemap used by the map renderer.

The source GraphML is an OSMnx export already stored in ``automation/data``.
This build step performs no network access.  Parallel/reversed graph edges are
collapsed so the browser draws each physical road only once.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Iterable

from pyproj import Transformer


GRAPHML_NS = "http://graphml.graphdrawing.org/xmlns"
LINESTRING_RE = re.compile(r"^LINESTRING\s*\((?P<coordinates>.+)\)$", re.I)


def _data(element: ET.Element, key_names: dict[str, str]) -> dict[str, str]:
    values: dict[str, str] = {}
    for child in element.findall(f"{{{GRAPHML_NS}}}data"):
        name = key_names.get(child.attrib.get("key", ""))
        if name and child.text is not None:
            values[name] = child.text.strip()
    return values


def _parse_linestring(value: str) -> list[tuple[float, float]]:
    match = LINESTRING_RE.match(value.strip())
    if not match:
        raise ValueError("geometria GraphML nao e LINESTRING")
    coordinates: list[tuple[float, float]] = []
    for item in match.group("coordinates").split(","):
        parts = item.strip().split()
        if len(parts) < 2:
            raise ValueError("coordenada invalida na geometria GraphML")
        coordinates.append((float(parts[0]), float(parts[1])))
    return coordinates


def _normalized_highway(value: str | None) -> str:
    raw = str(value or "road").strip().lower()
    # OSMnx may serialize a list when an edge has multiple classifications.
    for name in (
        "motorway",
        "trunk",
        "primary",
        "secondary",
        "tertiary",
        "residential",
        "unclassified",
        "living_street",
        "service",
        "track",
        "path",
        "footway",
    ):
        if name in raw:
            return name
    return "road"


def _canonical_coordinates(
    coordinates: Iterable[tuple[float, float]],
) -> tuple[tuple[float, float], ...]:
    rounded = tuple((round(lng, 6), round(lat, 6)) for lng, lat in coordinates)
    reverse = tuple(reversed(rounded))
    return min(rounded, reverse)


def build_vector_basemap(source: Path, destination: Path) -> dict:
    source = source.resolve()
    destination = destination.resolve()
    tree = ET.parse(source)
    root = tree.getroot()

    key_names = {
        element.attrib["id"]: element.attrib.get("attr.name", element.attrib["id"])
        for element in root.findall(f"{{{GRAPHML_NS}}}key")
    }
    graph = root.find(f"{{{GRAPHML_NS}}}graph")
    if graph is None:
        raise ValueError("GraphML sem elemento graph")

    graph_data = _data(graph, key_names)
    source_crs = graph_data.get("crs")
    if not source_crs:
        raise ValueError("GraphML sem CRS declarado")
    transformer = Transformer.from_crs(source_crs, "EPSG:4326", always_xy=True)

    nodes: dict[str, tuple[float, float]] = {}
    for node in graph.findall(f"{{{GRAPHML_NS}}}node"):
        values = _data(node, key_names)
        try:
            nodes[node.attrib["id"]] = (float(values["x"]), float(values["y"]))
        except (KeyError, TypeError, ValueError) as exc:
            raise ValueError(f"node GraphML invalido: {node.attrib.get('id')}") from exc

    unique_edges: dict[tuple[tuple[float, float], ...], dict] = {}
    for edge in graph.findall(f"{{{GRAPHML_NS}}}edge"):
        values = _data(edge, key_names)
        geometry = values.get("geometry")
        if geometry:
            metric_coordinates = _parse_linestring(geometry)
        else:
            try:
                metric_coordinates = [
                    nodes[edge.attrib["source"]],
                    nodes[edge.attrib["target"]],
                ]
            except KeyError as exc:
                raise ValueError("edge GraphML referencia node inexistente") from exc

        wgs84 = [transformer.transform(x, y) for x, y in metric_coordinates]
        canonical = _canonical_coordinates(wgs84)
        if len(canonical) < 2 or len(set(canonical)) < 2:
            continue

        candidate = {
            "type": "Feature",
            "properties": {
                "highway": _normalized_highway(values.get("highway")),
                "name": str(values.get("name") or "").strip(),
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [list(point) for point in canonical],
            },
        }
        existing = unique_edges.get(canonical)
        # Prefer the duplicate carrying a street name; otherwise first wins.
        if existing is None or (
            not existing["properties"]["name"] and candidate["properties"]["name"]
        ):
            unique_edges[canonical] = candidate

    features = [unique_edges[key] for key in sorted(unique_edges)]
    if not features:
        raise ValueError("GraphML nao produziu nenhuma rua valida")

    longitudes = [point[0] for key in unique_edges for point in key]
    latitudes = [point[1] for key in unique_edges for point in key]
    source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
    document = {
        "type": "FeatureCollection",
        "metadata": {
            "schema": "tracker-vector-basemap-v1",
            "source": source.name,
            "sourceCrs": source_crs,
            "sourceSha256": source_hash,
            "attribution": "© OpenStreetMap contributors",
            "featureCount": len(features),
            "bounds": [
                round(min(longitudes), 6),
                round(min(latitudes), 6),
                round(max(longitudes), 6),
                round(max(latitudes), 6),
            ],
        },
        "features": features,
    }

    destination.parent.mkdir(parents=True, exist_ok=True)
    serialized = json.dumps(
        document,
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=True,
    ) + "\n"
    destination.write_text(serialized, encoding="utf-8", newline="\n")
    return document


def _default_paths() -> tuple[Path, Path]:
    module_dir = Path(__file__).resolve().parent
    source = module_dir.parents[2] / "data" / "tijucas_ruas.graphml"
    destination = module_dir / "assets" / "street_network.geojson"
    return source, destination


def main() -> None:
    default_source, default_destination = _default_paths()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=default_source)
    parser.add_argument("--destination", type=Path, default=default_destination)
    args = parser.parse_args()
    document = build_vector_basemap(args.source, args.destination)
    print(
        f"vector basemap: {document['metadata']['featureCount']} ruas -> "
        f"{args.destination}"
    )


if __name__ == "__main__":
    main()
