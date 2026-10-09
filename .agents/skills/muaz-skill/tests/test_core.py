"""Tests for the BM25 search engine - protects critical paths."""

import unittest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
from core import search, search_stack, detect_domain, BM25, CSV_CONFIG, AVAILABLE_STACKS


class TestSearch(unittest.TestCase):
    def test_product_search_returns_results(self):
        results = search("SaaS dashboard", "product")
        self.assertEqual(results["domain"], "product")
        self.assertGreater(results["count"], 0)
        self.assertIn("Product Type", results["results"][0])

    def test_style_search_returns_results(self):
        results = search("minimalism clean", "style")
        self.assertEqual(results["domain"], "style")
        self.assertGreater(results["count"], 0)

    def test_color_search_returns_results(self):
        results = search("fintech", "color")
        self.assertEqual(results["domain"], "color")
        self.assertGreater(results["count"], 0)
        self.assertIn("Primary", results["results"][0])

    def test_compositions_search_returns_results(self):
        results = search("hero", "compositions")
        self.assertEqual(results["domain"], "compositions")
        self.assertGreater(results["count"], 0)

    def test_typography_search_returns_results(self):
        results = search("elegant serif", "typography")
        self.assertEqual(results["domain"], "typography")
        self.assertGreater(results["count"], 0)

    def test_design_search_returns_results(self):
        results = search("cyberpunk", "design")
        self.assertEqual(results["domain"], "design")
        self.assertGreater(results["count"], 0)

    def test_domain_detection(self):
        self.assertEqual(detect_domain("SaaS dashboard"), "product")
        self.assertEqual(detect_domain("color palette hex"), "color")
        self.assertEqual(detect_domain("hero layout"), "landing")
        self.assertEqual(detect_domain("font pairing"), "typography")
        self.assertEqual(detect_domain("chart graph"), "chart")

    def test_stack_search(self):
        results = search_stack("react", "react")
        self.assertEqual(results["domain"], "stack")
        self.assertEqual(results["stack"], "react")
        self.assertGreater(results["count"], 0)

    def test_unknown_stack_returns_error(self):
        results = search_stack("test", "nonexistent_stack")
        self.assertIn("error", results)

    def test_all_csvs_load(self):
        for domain, config in CSV_CONFIG.items():
            with self.subTest(domain=domain):
                filepath = Path(__file__).parent.parent / "data" / config["file"]
                self.assertTrue(filepath.exists(), f"Missing CSV: {config['file']}")

    def test_bm25_basic(self):
        bm25 = BM25()
        bm25.fit(["hello world", "foo bar baz", "hello foo"])
        scores = bm25.score("hello")
        self.assertEqual(len(scores), 3)
        self.assertGreater(scores[0][1], 0)


class TestSearchResultsStructure(unittest.TestCase):
    def test_search_result_has_required_keys(self):
        result = search("SaaS", "product")
        for key in ["domain", "query", "file", "count", "results"]:
            self.assertIn(key, result, f"Missing key: {key}")

    def test_results_are_dicts(self):
        result = search("minimalism", "style")
        for row in result["results"]:
            self.assertIsInstance(row, dict)


if __name__ == "__main__":
    unittest.main()
