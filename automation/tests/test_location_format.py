from __future__ import annotations

import unittest

from app.tracker.location_format import (
    clean_location_text,
    coordinate_fallback,
    display_address,
)


class LocationFormatTests(unittest.TestCase):
    def test_replaces_unknown_labels_with_verifiable_coordinates(self) -> None:
        for label in (
            "Endereço não identificado",
            "LOCAL DESCONHECIDO",
            "unknown address",
            "   ",
            None,
        ):
            with self.subTest(label=label):
                self.assertEqual(
                    display_address(label, -27.24, -48.63),
                    "Coordenadas GPS: -27.240000, -48.630000",
                )

    def test_preserves_and_normalizes_real_address(self) -> None:
        self.assertEqual(
            clean_location_text("  Rua Coronel   Büchele, Tijucas/SC  "),
            "Rua Coronel Büchele, Tijucas/SC",
        )

    def test_invalid_coordinates_use_safe_map_label(self) -> None:
        self.assertEqual(
            coordinate_fallback(0, 0),
            "Posição disponível no mapa",
        )
        self.assertEqual(
            coordinate_fallback(float("nan"), -48.63),
            "Posição disponível no mapa",
        )


if __name__ == "__main__":
    unittest.main()
