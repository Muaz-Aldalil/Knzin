"""Tests for token_audit pure logic (computed-style normalization + comparison)."""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
from token_audit import (
    normalize_property, build_assertions, compare_computed, token_role,
)


class TestNormalizeProperty(unittest.TestCase):
    def test_rgb_to_hex(self):
        self.assertEqual(normalize_property("color", "rgb(37, 99, 235)"), "#2563eb")

    def test_short_hex_expands(self):
        self.assertEqual(normalize_property("color", "#fff"), "#ffffff")

    def test_lowercases_hex(self):
        self.assertEqual(normalize_property("background-color", "#1E293B"), "#1e293b")

    def test_radius_takes_first_value(self):
        self.assertEqual(normalize_property("border-radius", "8px 8px 8px 8px"), "8px")

    def test_duration_first_of_list(self):
        self.assertEqual(normalize_property("transition-duration", "0.25s, 0.1s"), "0.25s")


class TestBuildAssertions(unittest.TestCase):
    def _tokens(self):
        return {
            "schema_version": 2, "project": "X",
            "colors": {
                "background": "#FFFFFF", "foreground": "#0F172A",
                "card": "#F8FAFC", "primary": "#2563EB",
            },
            "radius": {"sm": "4px", "md": "8px", "lg": "16px"},
            "motion": {"fast": "150ms", "normal": "250ms", "slow": "400ms"},
            "typography": {"heading": "Sora", "body": "Inter"},
            "breakpoints": {"sm": "640px", "md": "768px", "lg": "1024px", "xl": "1440px"},
        }

    def test_assertions_skip_missing_selectors_and_values(self):
        tokens = self._tokens()
        selectors = {"colors.background": "body", "colors.primary": "a"}
        assertions = build_assertions(tokens, selectors)
        roles = {a["role"] for a in assertions}
        self.assertEqual(roles, {"colors.background", "colors.primary"})

    def test_token_role_resolves_nested(self):
        tokens = self._tokens()
        self.assertEqual(token_role("colors.primary", tokens), "#2563EB")
        self.assertEqual(token_role("motion.fast", tokens), "150ms")


class TestCompareComputed(unittest.TestCase):
    def _tokens(self):
        return {
            "schema_version": 2, "project": "X",
            "colors": {"background": "#FFFFFF", "foreground": "#0F172A", "primary": "#2563EB"},
            "radius": {"sm": "4px", "md": "8px", "lg": "16px"},
            "motion": {"fast": "150ms", "normal": "250ms", "slow": "400ms"},
            "typography": {"heading": "Sora", "body": "Inter"},
            "breakpoints": {"sm": "640px", "md": "768px", "lg": "1024px", "xl": "1440px"},
        }

    def test_matching_computed_passes(self):
        tokens = self._tokens()
        assertions = build_assertions(tokens, {"colors.primary": "a"})
        computed = {("colors.primary", "color"): "rgb(37, 99, 235)"}
        self.assertEqual(compare_computed(assertions, computed), [])

    def test_mismatch_reported(self):
        tokens = self._tokens()
        assertions = build_assertions(tokens, {"colors.primary": "a"})
        computed = {("colors.primary", "color"): "rgb(255, 0, 0)"}
        violations = compare_computed(assertions, computed)
        self.assertEqual(len(violations), 1)
        self.assertIn("colors.primary", violations[0])


if __name__ == "__main__":
    unittest.main()
