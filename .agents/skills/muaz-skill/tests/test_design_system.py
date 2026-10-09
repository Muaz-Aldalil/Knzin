"""Tests for design system generator - protects the generation pipeline."""

import unittest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
from design_system import (
    generate_design_system,
    DesignSystemGenerator,
    format_master_md,
)


class TestDesignSystemGeneration(unittest.TestCase):
    def test_generate_returns_string(self):
        result = generate_design_system("SaaS dashboard", "TestProject")
        self.assertIsInstance(result, str)
        self.assertGreater(len(result), 100)

    def test_generate_markdown_format(self):
        result = generate_design_system(
            "SaaS dashboard", "TestProject", output_format="markdown"
        )
        self.assertIn("## Design System", result)
        self.assertIn("TestProject", result)

    def test_generate_contains_required_sections(self):
        result = generate_design_system("SaaS dashboard", "TestProject")
        self.assertIn("PATTERN", result)
        self.assertIn("STYLE", result)
        self.assertIn("COLORS", result)
        self.assertIn("TYPOGRAPHY", result)
        self.assertIn("PRE-DELIVERY CHECKLIST", result)

    def test_generator_returns_dict_with_all_keys(self):
        gen = DesignSystemGenerator()
        ds = gen.generate("SaaS dashboard", "TestProject")
        required_keys = [
            "project_name",
            "category",
            "pattern",
            "style",
            "colors",
            "typography",
            "key_effects",
            "anti_patterns",
        ]
        for key in required_keys:
            self.assertIn(key, ds, f"Missing key: {key}")

    def test_colors_have_required_fields(self):
        gen = DesignSystemGenerator()
        ds = gen.generate("SaaS dashboard", "TestProject")
        colors = ds["colors"]
        for field in ["primary", "secondary", "accent", "background", "foreground"]:
            self.assertIn(field, colors, f"Missing color field: {field}")

    def test_typography_has_required_fields(self):
        gen = DesignSystemGenerator()
        ds = gen.generate("SaaS dashboard", "TestProject")
        typo = ds["typography"]
        for field in ["heading", "body"]:
            self.assertIn(field, typo, f"Missing typography field: {field}")

    def test_products_curated_style_is_consumed(self):
        # products.csv row 2 (Micro SaaS) recommends "Flat Design + Vibrant & Block";
        # ui-reasoning.csv row 2 says "Motion-Driven + Vibrant & Block". The curated
        # product column must win, proving design_system.py consumes it.
        gen = DesignSystemGenerator()
        ds = gen.generate("micro saas", "MicroTest")
        self.assertIn("Flat Design", ds["style"]["name"])

    def test_motion_direction_selected(self):
        # data/motion.csv is a searchable domain; a cinematic query must route
        # to the Cinematic Hero row (governance: consumer -> trigger -> test).
        gen = DesignSystemGenerator()
        ds = gen.generate("cinematic hero marketing site", "MotionTest")
        self.assertIn("motion", ds, "Missing motion key")
        self.assertEqual(ds["motion"]["name"], "Cinematic Hero / Scroll-Scrubbed")
        self.assertIn("GSAP", ds["motion"]["libraries"])

    def test_ascii_box_has_motion_direction_section(self):
        # The ASCII box must surface the style-matched motion direction.
        from design_system import format_ascii_box

        gen = DesignSystemGenerator()
        ds = gen.generate("SaaS dashboard", "TestProject")
        box = format_ascii_box(ds)
        self.assertIn("MOTION DIRECTION", box)
        self.assertIn(ds["motion"]["name"], box)

    def test_ascii_box_lines_stay_within_91_chars(self):
        # The box width is a manual contract (verified at v5.2.0); lock it so a
        # regression cannot silently widen the layout.
        from design_system import format_ascii_box

        gen = DesignSystemGenerator()
        ds = gen.generate("SaaS dashboard", "TestProject")
        box = format_ascii_box(ds)
        self.assertLessEqual(max(len(line) for line in box.splitlines()), 91)

    def test_uxpeak_rows_route_through_intelligent_overrides(self):
        # ux-guidelines.csv rows 101+ (uxpeak, 2026-09) must be reachable:
        # a bottom-nav page query routes to the new Navigation rows through
        # _generate_intelligent_overrides (governance: consumer -> trigger -> test).
        from design_system import _generate_intelligent_overrides

        overrides = _generate_intelligent_overrides(
            "mobile app", "bottom mobile navigation bar", {}
        )
        recs = "\n".join(overrides.get("recommendations", []))
        self.assertIn("Keep 3-5 tabs", recs)
        self.assertIn("Place one high-value action", recs)
        self.assertIn("Reserve the nav height", recs)

    def test_master_md_has_design_token_sections(self):
        gen = DesignSystemGenerator()
        ds = gen.generate("SaaS dashboard", "TestProject")
        master = format_master_md(ds)
        required_sections = [
            "### Border Radius",
            "### Breakpoints & Containers",
            "### Motion & Transitions",
            "### Focus States",
            "### Z-Index Scale",
            "### Icons & Imagery",
            "### Semantic Aliases",
            "### Dark Mode",
            "### Forms & Validation",
            "### Badges & Tags",
            "### Tables",
            "### Tabs",
            "### Avatars",
            "### Toasts & Notifications",
        ]
        for section in required_sections:
            self.assertIn(section, master, f"Missing section: {section}")
        self.assertIn("never `outline: none`", master)


if __name__ == "__main__":
    unittest.main()
