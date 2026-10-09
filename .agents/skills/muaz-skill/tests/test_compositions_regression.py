"""Regression tests for compositions search - ensures expanded data doesn't break known results."""

import unittest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
from core import search

KNOWN_QUERIES = {
    "hero layout": ["Split Hero", "Full Bleed Hero", "Centered Text Hero"],
    "pricing": ["Pricing 3-Tier", "Feature Comparison", "Simple 2-Tier"],
    "dashboard": ["Bento Dashboard", "Sidebar + Content", "Command Palette"],
    "testimonial": ["Social Proof", "Testimonial", "Case Study"],
    "footer": ["Content Footer", "Sticky Footer", "Side CTA"],
}


class TestCompositionsRegression(unittest.TestCase):
    def test_top_queries_return_expected_patterns(self):
        for query, expected_top_patterns in KNOWN_QUERIES.items():
            with self.subTest(query=query):
                results = search(query, "compositions", max_results=3)
                self.assertGreater(results["count"], 0, f"Query '{query}' returned no results")
                returned_names = [r.get("name", "") for r in results["results"]]
                matches = [
                    exp.lower() in name.lower()
                    for name in returned_names
                    for exp in expected_top_patterns
                ]
                self.assertTrue(
                    any(matches),
                    f"Query '{query}' returned {returned_names}, expected one of {expected_top_patterns}"
                )

    def test_compositions_has_all_columns(self):
        results = search("hero", "compositions", max_results=1)
        self.assertEqual(results["domain"], "compositions")
        self.assertGreater(results["count"], 0)
        row = results["results"][0]
        for col in ["name", "category", "style_tags", "description", "use_cases", "anti_patterns", "examples"]:
            self.assertIn(col, row, f"Missing column: {col}")

    def test_content_footer_has_correct_category(self):
        results = search("footer", "compositions", max_results=5)
        self.assertGreater(results["count"], 0)
        names = [r.get("name", "") for r in results["results"]]
        self.assertIn("Content Footer", names, "Content Footer should appear in footer search")
        for r in results["results"]:
            if r.get("name") == "Content Footer":
                self.assertEqual(r.get("category"), "footer", "Content Footer category should be 'footer'")
                self.assertTrue(r.get("style_tags"), "Content Footer style_tags should not be empty")


if __name__ == "__main__":
    unittest.main()
