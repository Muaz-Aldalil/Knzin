"""Tests for taste memory: profile persistence, bias construction, and search re-ranking."""

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
from taste import load_profile, save_profile, record_correction, bias_dict, top_preferences
from core import search, search_stack


class TestTasteProfile(unittest.TestCase):
    def test_missing_profile_returns_empty(self):
        profile = load_profile(Path(tempfile.gettempdir()) / "nope-does-not-exist.json")
        self.assertEqual(profile["weights"], {})
        self.assertEqual(profile["history"], [])

    def test_roundtrip(self):
        with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as f:
            path = Path(f.name)
        try:
            profile = load_profile(path)
            record_correction(profile, "saas dashboard", "boring corporate", "bold modern", "client hates grey", path)
            reloaded = load_profile(path)
            self.assertEqual(reloaded["history"][0]["query"], "saas dashboard")
            self.assertEqual(reloaded["weights"]["modern"], 1.0)
            self.assertEqual(reloaded["weights"]["corporate"], -1.0)
        finally:
            path.unlink(missing_ok=True)

    def test_bias_dict_filters_weak_signals(self):
        profile = {"weights": {"glassmorphism": 1.0, "inter": 0.5, "brutalism": -2.0}, "history": []}
        bias = bias_dict(profile)
        self.assertIn("glassmorphism", bias)
        self.assertNotIn("inter", bias)
        self.assertIn("brutalism", bias)

    def test_top_preferences_sorted(self):
        profile = {"weights": {"a": 2.0, "b": 5.0, "c": 1.0}, "history": []}
        prefs = top_preferences(profile, limit=2)
        self.assertEqual(prefs[0], ("b", 5.0))


class TestSearchBias(unittest.TestCase):
    def test_bias_reranks_results(self):
        # Search for dark style in the styles domain; bias toward "minimal" terms.
        plain = search("dark", domain="style", max_results=5)
        biased = search("dark", domain="style", max_results=5, bias={"minimalism": 50.0})
        self.assertGreater(len(plain["results"]), 0)
        # The top result under bias must mention minimalism somewhere.
        top_biased = biased["results"][0]
        haystack = " ".join(str(v).lower() for v in top_biased.values())
        self.assertIn("minimal", haystack)

    def test_search_stack_accepts_bias(self):
        result = search_stack("animation", "html-tailwind", max_results=3, bias={"transition": 10.0})
        self.assertIn("results", result)


if __name__ == "__main__":
    unittest.main()
