#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Visual Regression Diff — screenshots a page and diffs it against a reference
shot, so the generation loop *sees* the change it made (the "lookalike test").

Pure pixel-diff core is dependency-free and unit-tested. Screenshot capture
requires `playwright` (pip install playwright && playwright install chromium).

Usage:
  python scripts/visual_diff.py capture <url> <out.png> [--width 1280 --full-page]
  python scripts/visual_diff.py diff <before.png> <after.png> [--threshold 0.05]
  python scripts/visual_diff.py gate  <url> <reference.png> [--threshold 0.05]
    -> captures url and diffs against reference; exit 1 when drift > threshold

A tiny PNG decoder (zlib, stdlib) keeps the diff self-contained; no Pillow needed.
"""

import argparse
import struct
import sys
import zlib
from pathlib import Path


# ============ Pure pixel-diff core (no dependencies) ============

def diff_images(a_rgba: list, b_rgba: list, width: int, height: int,
                tolerance: int = 10) -> dict:
    """Full diff with proper width/height: changed ratio + change bounding box.

    tolerance: per-channel max absolute difference before a pixel counts as changed.
    """
    n = width * height
    if len(a_rgba) != n or len(b_rgba) != n:
        raise ValueError(f"size mismatch: expected {n} pixels, got {len(a_rgba)} and {len(b_rgba)}")
    changed = 0
    min_x = min_y = width  # sentinel: any coordinate is < width
    max_x = max_y = -1
    for i in range(n):
        ar, ag, ab, aa = a_rgba[i]
        br, bg, bb, ba = b_rgba[i]
        if (abs(ar - br) > tolerance or abs(ag - bg) > tolerance
                or abs(ab - bb) > tolerance or abs(aa - ba) > tolerance):
            changed += 1
            x, y = i % width, i // width
            min_x = min(min_x, x)
            min_y = min(min_y, y)
            max_x = max(max_x, x)
            max_y = max(max_y, y)
    return {
        "changed": changed / n if n else 0.0,
        "changed_pixels": changed,
        "bbox": (min_x, min_y, max_x, max_y) if changed else None,
    }


def drift_exceeds(report: dict, threshold: float) -> bool:
    """True when the changed ratio exceeds the allowed threshold."""
    return report["changed"] > threshold


# ============ Minimal PNG decoder (stdlib zlib) ============

def _paeth(a, b, c):
    p = a + b - c
    pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
    return a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)


def decode_png(data: bytes) -> dict:
    """Decode a PNG to RGBA pixels. Supports 8-bit color types 2 (RGB) and 6 (RGBA).

    Returns {"width", "height", "rgba": [(r,g,b,a), ...]} row-major top-to-bottom.
    """
    if not data.startswith(b"\x89PNG\r\n\x1a\n"):
        raise ValueError("not a PNG file")
    pos = 8
    width = height = bit_depth = color_type = None
    idat = b""

    while pos < len(data):
        length = struct.unpack(">I", data[pos:pos + 4])[0]
        chunk_type = data[pos + 4:pos + 8]
        chunk_data = data[pos + 8:pos + 8 + length]
        if chunk_type == b"IHDR":
            width, height, bit_depth, color_type, _, _, _ = struct.unpack(">IIBBBBB", chunk_data)
        elif chunk_type == b"IDAT":
            idat += chunk_data
        elif chunk_type == b"IEND":
            break
        pos += 12 + length

    if bit_depth != 8 or color_type not in (2, 6):
        raise ValueError(f"unsupported PNG format: bit_depth={bit_depth} color_type={color_type}")

    channels = 3 if color_type == 2 else 4
    raw = zlib.decompress(idat)
    stride = width * channels
    rows = []
    offset = 0
    for _ in range(height):
        filter_type = raw[offset]
        offset += 1
        line = bytearray(raw[offset:offset + stride])
        offset += stride
        prev = rows[-1] if rows else bytearray(stride)
        if filter_type == 1:  # Sub
            for i in range(channels, stride):
                line[i] = (line[i] + line[i - channels]) & 0xFF
        elif filter_type == 2:  # Up
            for i in range(stride):
                line[i] = (line[i] + prev[i]) & 0xFF
        elif filter_type == 3:  # Average
            for i in range(stride):
                left = line[i - channels] if i >= channels else 0
                line[i] = (line[i] + ((left + prev[i]) >> 1)) & 0xFF
        elif filter_type == 4:  # Paeth
            for i in range(stride):
                left = line[i - channels] if i >= channels else 0
                up_left = prev[i - channels] if i >= channels else 0
                line[i] = (line[i] + _paeth(left, prev[i], up_left)) & 0xFF
        rows.append(line)

    rgba = []
    for row in rows:
        for i in range(0, stride, channels):
            r, g, b = row[i], row[i + 1], row[i + 2]
            a = row[i + 3] if channels == 4 else 255
            rgba.append((r, g, b, a))
    return {"width": width, "height": height, "rgba": rgba}


def load_png(path: Path) -> dict:
    return decode_png(path.read_bytes())


def diff_png_files(before: Path, after: Path, tolerance: int = 10) -> dict:
    a, b = load_png(before), load_png(after)
    if (a["width"], a["height"]) != (b["width"], b["height"]):
        raise ValueError(f"size mismatch: {a['width']}x{a['height']} vs {b['width']}x{b['height']}")
    return diff_images(a["rgba"], b["rgba"], a["width"], a["height"], tolerance)


# ============ Playwright capture (optional) ============

def capture(url: str, out_path: Path, width: int = 1280, full_page: bool = True,
            timeout: int = 15000) -> Path:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        raise SystemExit("playwright not installed (pip install playwright && playwright install chromium)")
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            page = browser.new_page(viewport={"width": width, "height": 900})
            page.goto(url, wait_until="networkidle", timeout=timeout)
            page.screenshot(path=str(out_path), full_page=full_page)
        finally:
            browser.close()
    return out_path


# ============ CLI ============

def main(argv=None):
    parser = argparse.ArgumentParser(prog="visual-diff.py", description="Screenshot capture + pixel diff for visual regression")
    sub = parser.add_subparsers(dest="command", required=True)

    p_cap = sub.add_parser("capture", help="capture a screenshot")
    p_cap.add_argument("url")
    p_cap.add_argument("out")
    p_cap.add_argument("--width", type=int, default=1280)
    p_cap.add_argument("--no-full-page", action="store_true")

    p_diff = sub.add_parser("diff", help="diff two PNGs")
    p_diff.add_argument("before")
    p_diff.add_argument("after")
    p_diff.add_argument("--tolerance", type=int, default=10)

    p_gate = sub.add_parser("gate", help="capture url and diff against reference")
    p_gate.add_argument("url")
    p_gate.add_argument("reference")
    p_gate.add_argument("--threshold", type=float, default=0.05)
    p_gate.add_argument("--width", type=int, default=1280)
    p_gate.add_argument("--tolerance", type=int, default=10)
    p_gate.add_argument("--out", default=None, help="save the captured screenshot here")

    args = parser.parse_args(argv)

    if args.command == "capture":
        out = capture(args.url, Path(args.out), width=args.width, full_page=not args.no_full_page)
        print(f"Captured: {out}")
        return 0

    if args.command == "diff":
        report = diff_png_files(Path(args.before), Path(args.after), args.tolerance)
        changed_pct = report["changed"] * 100
        print(f"=== VISUAL DIFF ===")
        print(f"Changed pixels: {report['changed_pixels']} ({changed_pct:.2f}%)")
        print(f"Change bbox: {report['bbox']}")
        return 0

    if args.command == "gate":
        shot = Path(args.out) if args.out else Path(args.reference).with_name("_capture.png")
        capture(args.url, shot, width=args.width)
        report = diff_png_files(Path(args.reference), shot, args.tolerance)
        changed_pct = report["changed"] * 100
        fails = drift_exceeds(report, args.threshold)
        print(f"=== VISUAL GATE ===")
        print(f"Drift: {changed_pct:.2f}% (threshold {args.threshold * 100:.2f}%)")
        print(f"Change bbox: {report['bbox']}")
        print("RESULT:", "PASS" if not fails else "FAIL")
        return 1 if fails else 0

    return 2


if __name__ == "__main__":
    sys.exit(main())
