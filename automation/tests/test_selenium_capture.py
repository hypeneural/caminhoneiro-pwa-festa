from __future__ import annotations

import os
import unittest
from pathlib import Path

from app.tracker.streetview import (
    SeleniumStreetViewCapture,
    StreetViewCaptureConfig,
)


@unittest.skipUnless(
    os.environ.get("RUN_SELENIUM_TESTS") == "1",
    "Defina RUN_SELENIUM_TESTS=1 para testar o Chrome real.",
)
class SeleniumCaptureTests(unittest.TestCase):
    def test_captures_dynamic_canvas_fixture(self) -> None:
        fixture = (
            Path(__file__).resolve().parent
            / "fixtures"
            / "streetview_canvas.html"
        )
        chrome_binary = os.environ.get(
            "TRACKER_CHROME_BINARY",
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        )
        capture = SeleniumStreetViewCapture(
            StreetViewCaptureConfig(
                headless=True,
                chrome_binary=chrome_binary if Path(chrome_binary).exists() else "",
                page_timeout_seconds=12,
                settle_seconds=1,
                sample_interval_seconds=0.3,
                retries=0,
                use_swiftshader=False,
                min_canvas_width=640,
                min_canvas_height=360,
                require_panorama_semantics=False,
            )
        )
        try:
            image = capture.capture(fixture.as_uri())
            self.assertGreaterEqual(image.width, 900)
            self.assertGreaterEqual(image.height, 500)
        finally:
            capture.close()


if __name__ == "__main__":
    unittest.main()
