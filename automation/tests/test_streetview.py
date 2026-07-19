from __future__ import annotations

import io
import unittest
from urllib.parse import parse_qs, urlparse

from PIL import Image, ImageDraw

from app.tracker.streetview import (
    CARDINAL_VIEWS,
    CapturedView,
    PanoramaComposeConfig,
    PillowPanoramaComposer,
    StreetViewCaptureConfig,
    StreetViewCaptureCancelled,
    StreetViewCaptureError,
    SeleniumStreetViewCapture,
    StreetViewPanoramaService,
    build_streetview_url,
    validate_rendered_image,
)


def patterned_image(seed: int, size: tuple[int, int] = (800, 450)) -> Image.Image:
    image = Image.new("RGB", size, (25 + seed * 20, 80, 150))
    draw = ImageDraw.Draw(image)
    for index in range(24):
        x = (index * 71 + seed * 29) % size[0]
        y = (index * 43 + seed * 17) % size[1]
        draw.rectangle(
            (x, y, min(size[0] - 1, x + 80), min(size[1] - 1, y + 45)),
            fill=(
                (seed * 47 + index * 11) % 255,
                (index * 23) % 255,
                (seed * 31 + index * 7) % 255,
            ),
        )
    return image


class StreetViewUrlTests(unittest.TestCase):
    def test_builds_four_cardinal_urls(self) -> None:
        headings = []
        for view in CARDINAL_VIEWS:
            url = build_streetview_url(-27.2412345, -48.6312345, view.heading)
            parsed = urlparse(url)
            query = parse_qs(parsed.query)
            self.assertEqual(parsed.netloc, "www.google.com")
            self.assertEqual(query["map_action"], ["pano"])
            self.assertEqual(query["viewpoint"], ["-27.2412345,-48.6312345"])
            headings.append(int(query["heading"][0]))

        self.assertEqual(headings, [0, 90, 180, 270])

    def test_normalizes_heading(self) -> None:
        query = parse_qs(
            urlparse(build_streetview_url(-27, -48, 450)).query
        )
        self.assertEqual(query["heading"], ["90"])

    def test_rejects_invalid_coordinates(self) -> None:
        with self.assertRaises(ValueError):
            build_streetview_url(91, -48, 0)

    def test_detects_redirect_without_panorama(self) -> None:
        class Driver:
            current_url = "https://www.google.com/maps/@0,0,0a,75y"

        self.assertTrue(SeleniumStreetViewCapture._url_has_no_panorama(Driver()))
        Driver.current_url = "https://www.google.com/maps/@0,0,3a,75y"
        self.assertFalse(SeleniumStreetViewCapture._url_has_no_panorama(Driver()))

class RenderValidationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.config = StreetViewCaptureConfig(
            min_canvas_width=320,
            min_canvas_height=180,
            min_png_bytes=500,
        )

    @staticmethod
    def png_size(image: Image.Image) -> int:
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        return len(buffer.getvalue())

    def test_accepts_detailed_image(self) -> None:
        image = patterned_image(2, (640, 360))
        metrics = validate_rendered_image(
            image,
            png_size=self.png_size(image),
            config=self.config,
        )
        self.assertGreater(metrics["luminance_stddev"], 9)

    def test_rejects_black_frame(self) -> None:
        image = Image.new("RGB", (640, 360), "black")
        with self.assertRaisesRegex(StreetViewCaptureError, "black_frame"):
            validate_rendered_image(
                image,
                png_size=5_000,
                config=self.config,
            )

    def test_rejects_partially_blank_frame(self) -> None:
        image = Image.new("RGB", (640, 360), "black")
        visible_strip = patterned_image(9, (640, 120))
        image.paste(visible_strip, (0, 240))

        with self.assertRaisesRegex(
            StreetViewCaptureError,
            "partial_blank_frame",
        ):
            validate_rendered_image(
                image,
                png_size=self.png_size(image),
                config=self.config,
            )

    def test_rejects_white_frame(self) -> None:
        image = Image.new("RGB", (640, 360), "white")
        with self.assertRaisesRegex(StreetViewCaptureError, "white_frame"):
            validate_rendered_image(
                image,
                png_size=5_000,
                config=self.config,
            )


class CaptureCancellationTests(unittest.TestCase):
    def test_cancelled_capture_does_not_start_browser(self) -> None:
        capture = SeleniumStreetViewCapture(StreetViewCaptureConfig())
        capture.cancel()

        with self.assertRaisesRegex(
            StreetViewCaptureCancelled,
            "capture_cancelled",
        ):
            capture.capture("https://example.test/panorama")


class PillowComposerTests(unittest.TestCase):
    def test_composes_expected_order_and_jpeg(self) -> None:
        views = [
            CapturedView(
                spec=spec,
                image=patterned_image(index),
                source_url=f"https://example.test/{spec.heading}",
            )
            for index, spec in enumerate(CARDINAL_VIEWS, start=1)
        ]
        config = PanoramaComposeConfig(max_jpeg_bytes=1_500_000)
        artifact = PillowPanoramaComposer(config).compose(
            views,
            ("Procissão · visão panorâmica", "Rua de Teste", "GPS: agora"),
        )

        decoded = Image.open(io.BytesIO(artifact.jpeg_bytes))
        self.assertEqual(decoded.format, "JPEG")
        self.assertEqual(
            decoded.size,
            (
                config.tile_width * 2,
                config.header_height
                + (config.label_height + config.tile_height) * 2
                + config.footer_height,
            ),
        )
        self.assertEqual(artifact.headings, (0, 90, 180, 270))
        self.assertLessEqual(len(artifact.jpeg_bytes), config.max_jpeg_bytes)

    def test_rejects_duplicate_headings(self) -> None:
        duplicate = patterned_image(1)
        views = [
            CapturedView(spec=spec, image=duplicate.copy(), source_url="x")
            for spec in CARDINAL_VIEWS
        ]
        with self.assertRaisesRegex(
            StreetViewCaptureError,
            "duplicate_headings",
        ):
            StreetViewPanoramaService._ensure_distinct_views(views)


if __name__ == "__main__":
    unittest.main()
