"""Tests for visual_diff: pixel diff, PNG decode roundtrip, drift threshold."""

import struct
import sys
import unittest
import zlib
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
from visual_diff import decode_png, diff_images, diff_png_files, drift_exceeds, load_png


def _encode_png(width, height, pixels, color_type=6):
    """Encode an 8-bit RGB (type 2) or RGBA (type 6) image as a PNG."""
    channels = 3 if color_type == 2 else 4
    if len(pixels) != width * height:
        raise ValueError("pixel count mismatch")
    raw = b""
    for y in range(height):
        raw += b"\x00"  # filter: None
        for x in range(width):
            px = pixels[y * width + x]
            raw += bytes(px[:channels])
    def chunk(ctype, data):
        return (struct.pack(">I", len(data)) + ctype + data
                + struct.pack(">I", zlib.crc32(ctype + data) & 0xFFFFFFFF))
    ihdr = struct.pack(">IIBBBBB", width, height, 8, color_type, 0, 0, 0)
    return (b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", ihdr)
            + chunk(b"IDAT", zlib.compress(raw))
            + chunk(b"IEND", b""))


class TestPngDecode(unittest.TestCase):
    def test_rgba_roundtrip(self):
        pixels = [(255, 0, 0, 255), (0, 255, 0, 255), (0, 0, 255, 255), (255, 255, 255, 255)]
        data = _encode_png(2, 2, pixels)
        decoded = decode_png(data)
        self.assertEqual((decoded["width"], decoded["height"]), (2, 2))
        self.assertEqual(decoded["rgba"], pixels)

    def test_rgb_adds_alpha(self):
        pixels = [(10, 20, 30), (40, 50, 60)]
        data = _encode_png(2, 1, pixels, color_type=2)
        decoded = decode_png(data)
        self.assertEqual(decoded["rgba"][0], (10, 20, 30, 255))

    def test_rejects_non_png(self):
        with self.assertRaises(ValueError):
            decode_png(b"not a png")


class TestDiffImages(unittest.TestCase):
    def test_identical_images_no_change(self):
        px = [(0, 0, 0, 255)] * 4
        report = diff_images(px, px, 2, 2)
        self.assertEqual(report["changed"], 0.0)
        self.assertIsNone(report["bbox"])

    def test_single_pixel_change(self):
        a = [(255, 255, 255, 255)] * 4
        b = [(255, 255, 255, 255)] * 4
        b[3] = (0, 0, 0, 255)
        report = diff_images(a, b, 2, 2)
        self.assertEqual(report["changed_pixels"], 1)
        self.assertEqual(report["changed"], 0.25)
        self.assertEqual(report["bbox"], (1, 1, 1, 1))

    def test_size_mismatch_raises(self):
        with self.assertRaises(ValueError):
            diff_images([(0, 0, 0, 255)] * 3, [(0, 0, 0, 255)] * 4, 2, 2)


class TestDrift(unittest.TestCase):
    def test_threshold_respected(self):
        self.assertTrue(drift_exceeds({"changed": 0.10}, 0.05))
        self.assertFalse(drift_exceeds({"changed": 0.02}, 0.05))


class TestDiffFiles(unittest.TestCase):
    def test_file_diff(self):
        import tempfile
        a = [(0, 0, 0, 255)] * 4
        b = [(0, 0, 0, 255)] * 4
        b[0] = (255, 255, 255, 255)
        with tempfile.TemporaryDirectory() as tmp:
            p1, p2 = Path(tmp) / "a.png", Path(tmp) / "b.png"
            p1.write_bytes(_encode_png(2, 2, a))
            p2.write_bytes(_encode_png(2, 2, b))
            report = diff_png_files(p1, p2)
            self.assertEqual(report["changed_pixels"], 1)


if __name__ == "__main__":
    unittest.main()
