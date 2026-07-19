"""CLI de diagnóstico para gerar um mosaico sem enviar à Z-API."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .streetview import (
    PanoramaComposeConfig,
    PillowPanoramaComposer,
    SeleniumStreetViewCapture,
    StreetViewCaptureConfig,
    StreetViewCaptureError,
    StreetViewUnavailable,
    StreetViewPanoramaService,
)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Gera um mosaico 2x2 do Street View para uma coordenada.",
    )
    parser.add_argument("--lat", type=float, required=True)
    parser.add_argument("--lng", type=float, required=True)
    parser.add_argument("--output", type=Path, default=Path("panorama.jpg"))
    parser.add_argument("--title", default="Visão panorâmica do local")
    parser.add_argument("--address", default="")
    parser.add_argument("--chrome-binary", default="")
    parser.add_argument("--chromedriver", default="")
    parser.add_argument("--headed", action="store_true")
    parser.add_argument("--no-swiftshader", action="store_true")
    parser.add_argument("--timeout", type=float, default=25.0)
    args = parser.parse_args()

    capture = SeleniumStreetViewCapture(
        StreetViewCaptureConfig(
            headless=not args.headed,
            chrome_binary=args.chrome_binary,
            chromedriver_path=args.chromedriver,
            page_timeout_seconds=args.timeout,
            use_swiftshader=not args.no_swiftshader,
        )
    )
    service = StreetViewPanoramaService(
        capture,
        PillowPanoramaComposer(PanoramaComposeConfig()),
    )

    try:
        artifact = service.generate(
            latitude=args.lat,
            longitude=args.lng,
            header_lines=(
                args.title,
                args.address,
            ),
        )
        destination = args.output.expanduser().resolve()
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(artifact.jpeg_bytes)
        print(
            f"Panorama salvo em {destination} "
            f"({artifact.width}x{artifact.height}, "
            f"{len(artifact.jpeg_bytes)} bytes)"
        )
    except StreetViewUnavailable:
        print("Não há cobertura Street View para esta coordenada.", file=sys.stderr)
        raise SystemExit(2) from None
    except StreetViewCaptureError as exc:
        print(f"Falha ao gerar panorama: {exc}", file=sys.stderr)
        raise SystemExit(1) from None
    finally:
        service.close()


if __name__ == "__main__":
    main()

