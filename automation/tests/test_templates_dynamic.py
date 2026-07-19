from __future__ import annotations

import math
import unittest
from datetime import datetime, timezone
from types import SimpleNamespace

from app.tracker.templates import (
    MESSAGE_TEMPLATES,
    build_location_title,
    build_message_context,
    render_message,
)


FOOTER = "Em tempo real: https://festadoscaminhoneiros.com.br/rota-completa"
SPEED_MESSAGE_TYPES = {
    "moving",
    "stopped",
    "resumed",
    "recovered_moving",
    "recovered_stopped",
}
BATTERY_MESSAGE_TYPES = SPEED_MESSAGE_TYPES | {"offline_tracker"}


class DynamicTemplateTests(unittest.TestCase):
    def setUp(self) -> None:
        self.now = datetime(2026, 7, 17, 12, 0, tzinfo=timezone.utc)

    def context(self, *, speed=0, battery=80) -> dict:
        snapshot = SimpleNamespace(
            name="Procissão de São Cristóvão",
            speed_kmh=speed,
            battery=battery,
            address="Avenida dos Caminhoneiros",
            street_name="Rua São José",
            updated_at=self.now,
            server_time=self.now,
        )
        return build_message_context(snapshot, object(), self.now)

    def snapshot(self, speed) -> SimpleNamespace:
        return SimpleNamespace(speed_kmh=speed)

    def test_battery_threshold_at_19_and_20_percent(self) -> None:
        low = self.context(battery=19)
        normal = self.context(battery=20)

        self.assertEqual(low["battery_emoji"], "🪫")
        self.assertEqual(low["battery_label"], "Bateria fraca")
        self.assertEqual(low["battery_display"], "19%")
        self.assertEqual(normal["battery_emoji"], "🔋")
        self.assertEqual(normal["battery_label"], "Bateria")
        self.assertEqual(normal["battery_display"], "20%")

    def test_battery_threshold_uses_numeric_value_before_rounding(self) -> None:
        context = self.context(battery=19.9)

        self.assertEqual(context["battery_emoji"], "🪫")
        self.assertEqual(context["battery_label"], "Bateria fraca")
        self.assertEqual(context["battery_display"], "20%")

    def test_invalid_battery_is_not_reported_as_a_percentage(self) -> None:
        for value in (
            None,
            True,
            "",
            "inválida",
            math.nan,
            math.inf,
            -1,
            101,
        ):
            with self.subTest(value=value):
                context = self.context(battery=value)
                message = render_message("moving", context)

                self.assertIsNone(context["battery"])
                self.assertEqual(context["battery_emoji"], "🔋")
                self.assertEqual(context["battery_label"], "Bateria")
                self.assertEqual(context["battery_display"], "Não informada")
                self.assertIn("🔋 *Bateria:* *Não informada*", message)
                self.assertNotIn("Não informada%", message)

    def test_speed_boundaries_and_negative_clamp(self) -> None:
        cases = (
            (-7, 0, "🛑", "Parado"),
            (0, 0, "🛑", "Parado"),
            (1, 1, "🐢", "Marcha lenta"),
            (9, 9, "🐢", "Marcha lenta"),
            (10, 10, "🚗", "Em deslocamento"),
        )
        for value, displayed, emoji, label in cases:
            with self.subTest(value=value):
                context = self.context(speed=value)
                self.assertEqual(context["speed_kmh"], displayed)
                self.assertEqual(context["speed_emoji"], emoji)
                self.assertEqual(context["speed_label"], label)
                self.assertEqual(
                    context["speed_display"],
                    f"{displayed} km/h",
                )

    def test_speed_is_rounded_before_dynamic_classification(self) -> None:
        context = self.context(speed=9.6)

        self.assertEqual(context["speed_kmh"], 10)
        self.assertEqual(context["speed_emoji"], "🚗")
        self.assertEqual(context["speed_label"], "Em deslocamento")
        self.assertEqual(context["speed_display"], "10 km/h")

    def test_invalid_speed_has_a_safe_display(self) -> None:
        for value in (None, False, "", "rápida", math.nan, -math.inf):
            with self.subTest(value=value):
                context = self.context(speed=value)
                message = render_message("moving", context)

                self.assertIsNone(context["speed_kmh"])
                self.assertEqual(context["speed_emoji"], "🚗")
                self.assertEqual(context["speed_label"], "Velocidade")
                self.assertEqual(context["speed_display"], "Não informada")
                self.assertIn("🚗 *Velocidade:* *Não informada*", message)
                self.assertNotIn("Não informada km/h", message)

    def test_every_relevant_template_uses_dynamic_fields_directly(self) -> None:
        for message_type, templates in MESSAGE_TEMPLATES.items():
            for template in templates:
                with self.subTest(message_type=message_type):
                    if message_type in SPEED_MESSAGE_TYPES:
                        self.assertIn("{speed_emoji}", template)
                        self.assertIn("{speed_label}", template)
                        self.assertIn("{speed_display}", template)
                        self.assertNotIn("{speed_kmh} km/h", template)
                    if message_type in BATTERY_MESSAGE_TYPES:
                        self.assertIn("{battery_emoji}", template)
                        self.assertIn("{battery_label}", template)
                        self.assertIn("{battery_display}", template)
                        self.assertNotIn("{battery}%", template)

    def test_all_template_variants_render_unicode_and_one_footer(self) -> None:
        context = self.context(speed=9, battery=19)

        for message_type, templates in MESSAGE_TEMPLATES.items():
            for sequence in range(len(templates)):
                with self.subTest(
                    message_type=message_type,
                    sequence=sequence,
                ):
                    message = render_message(message_type, context, sequence)
                    self.assertNotIn("%%", message)
                    self.assertNotIn("{speed_", message)
                    self.assertNotIn("{battery_", message)
                    self.assertEqual(message.count(FOOTER), 1)
                    self.assertEqual(
                        message.encode("utf-8").decode("utf-8"),
                        message,
                    )
                    self.assertIn("às", message)

    def test_location_title_uses_rounded_nonnegative_speed(self) -> None:
        self.assertEqual(
            build_location_title("moving", self.snapshot(-2.6), object()),
            "🚗 Em movimento • 0 km/h",
        )
        self.assertEqual(
            build_location_title("moving", self.snapshot(9.6), object()),
            "🚗 Em movimento • 10 km/h",
        )
        self.assertEqual(
            build_location_title("moving", self.snapshot(None), object()),
            "🚗 Em movimento • Não informada",
        )


if __name__ == "__main__":
    unittest.main()
