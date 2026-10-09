"""Tests for the deterministic quality gate: contrast math, token schema,
bundle budget, and anti-slop aggregation."""

import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
from quality_gate import (
    contrast_ratio, contrast_pass, relative_luminance,
    validate_tokens, tokens_from_design_system, estimate_bundle,
    aggregate_anti_slop, anti_slop_passes, run_gate, QD_BUDGET,
)


class TestContrast(unittest.TestCase):
    def test_black_on_white_is_high_contrast(self):
        self.assertAlmostEqual(contrast_ratio("#000000", "#FFFFFF"), 21.0, places=1)

    def test_same_color_is_one(self):
        self.assertAlmostEqual(contrast_ratio("#112233", "#112233"), 1.0, places=6)

    def test_relative_luminance_range(self):
        self.assertLess(relative_luminance("#000000"), 0.01)
        self.assertAlmostEqual(relative_luminance("#FFFFFF"), 1.0, places=4)

    def test_short_hex_expands(self):
        self.assertAlmostEqual(contrast_ratio("#fff", "#000"), 21.0, places=1)

    def test_aa_thresholds(self):
        self.assertTrue(contrast_pass(5.0))
        self.assertFalse(contrast_pass(4.0))
        self.assertTrue(contrast_pass(3.0, large_text=True))
        self.assertFalse(contrast_pass(2.5, large_text=True))


class TestTokenSchema(unittest.TestCase):
    def _good_tokens(self):
        return {
            "schema_version": 2,
            "project": "Demo",
            "colors": {
                "primary": "#2563EB", "on_primary": "#FFFFFF",
                "secondary": "#0F172A", "accent": "#C2410C",
                "on_accent": "#FFFFFF", "background": "#FFFFFF",
                "card": "#FFFFFF", "foreground": "#0F172A",
                "muted": "#F1F5F9", "muted_foreground": "#475569",
                "border": "#E2E8F0", "destructive": "#DC2626",
                "ring": "#2563EB",
            },
            "typography": {"heading": "Sora", "body": "Inter"},
            "radius": {"sm": "4px", "md": "8px", "lg": "16px"},
            "motion": {"fast": "150ms", "normal": "250ms", "slow": "400ms"},
            "breakpoints": {"sm": "640px", "md": "768px", "lg": "1024px", "xl": "1440px"},
        }

    def test_good_tokens_pass(self):
        self.assertEqual(validate_tokens(self._good_tokens()), [])

    def test_missing_color_detected(self):
        tokens = self._good_tokens()
        del tokens["colors"]["primary"]
        self.assertTrue(any("colors.primary" in v for v in validate_tokens(tokens)))

    def test_low_contrast_detected(self):
        tokens = self._good_tokens()
        tokens["colors"]["foreground"] = "#BBBBBB"  # grey on white = ~2.1:1
        violations = validate_tokens(tokens)
        self.assertTrue(any("contrast" in v for v in violations))

    def test_invalid_radius_detected(self):
        tokens = self._good_tokens()
        tokens["radius"]["md"] = "lots"
        self.assertTrue(any("radius.md" in v for v in validate_tokens(tokens)))

    def test_non_object_rejected(self):
        self.assertTrue(validate_tokens("not a dict"))


class TestTokensFromDesignSystem(unittest.TestCase):
    def test_builds_valid_tokens(self):
        ds = {
            "project_name": "ACME",
            "category": "SaaS",
            "colors": {
                "primary": "#2563EB", "on_primary": "#FFFFFF",
                "secondary": "#3B82F6", "accent": "#F97316",
                "background": "#F8FAFC", "foreground": "#1E293B",
                "muted": "", "border": "", "destructive": "", "ring": "",
            },
            "typography": {"heading": "Sora", "body": "Inter"},
        }
        tokens = tokens_from_design_system(ds)
        self.assertEqual(tokens["project"], "ACME")
        self.assertEqual(tokens["colors"]["primary"], "#2563EB")
        self.assertEqual(validate_tokens(tokens), [])


class TestBundleBudget(unittest.TestCase):
    def test_html_tailwind_within_budget(self):
        report = estimate_bundle("html-tailwind", component_count=5)
        self.assertFalse(report["violations"])

    def test_heavy_stack_flagged(self):
        report = estimate_bundle("threejs", component_count=40)
        self.assertTrue(any("JS" in v for v in report["violations"]))

    def test_native_stack_skipped(self):
        report = estimate_bundle("swiftui")
        self.assertTrue(report["native"])
        self.assertEqual(report["violations"], [])

    def test_unknown_stack_is_zero(self):
        report = estimate_bundle("does-not-exist")
        self.assertFalse(report["violations"])


class TestAntiSlopGate(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())

    def tearDown(self):
        import shutil
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_clean_source_passes(self):
        (self.tmp / "index.html").write_text("<h1>Fast and reliable</h1>", encoding="utf-8")
        summary = aggregate_anti_slop(self.tmp)
        self.assertTrue(anti_slop_passes(summary))

    def test_purple_gradient_fails_high(self):
        (self.tmp / "hero.css").write_text(
            "background: linear-gradient(135deg, #7c3aed, #8b5cf6);", encoding="utf-8")
        summary = aggregate_anti_slop(self.tmp)
        self.assertIn("PURPLE_GRADIENT", summary["groups"]["CRITICAL"])
        self.assertFalse(anti_slop_passes(summary, fail_min="HIGH"))


class TestRunGate(unittest.TestCase):
    def test_report_shape(self):
        with tempfile.TemporaryDirectory() as tmp:
            (Path(tmp) / "index.html").write_text("<h1>Fast and reliable</h1>", encoding="utf-8")
            tokens = {
                "schema_version": 2, "project": "X",
                "colors": {
                    "primary": "#2563EB", "on_primary": "#FFFFFF",
                    "secondary": "#0F172A", "accent": "#F97316",
                    "background": "#FFFFFF", "card": "#FFFFFF",
                    "foreground": "#0F172A", "muted": "", "border": "",
                    "destructive": "", "ring": "",
                },
                "typography": {"heading": "Sora", "body": "Inter"},
                "radius": {"sm": "4px", "md": "8px", "lg": "16px"},
                "motion": {"fast": "150ms", "normal": "250ms", "slow": "400ms"},
                "breakpoints": {"sm": "640px", "md": "768px", "lg": "1024px", "xl": "1440px"},
            }
            report = run_gate(Path(tmp), tokens, "html-tailwind")
            self.assertTrue(report["ok"])
            self.assertEqual(len(report["checks"]), 3)


if __name__ == "__main__":
    unittest.main()
