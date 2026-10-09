"""Tests for anti-slop detection patterns - ensures checks work."""

import unittest
import re
import sys
import tempfile
import shutil
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
from anti_slop import scan, CHECKS


class TestAntiSlopScript(unittest.TestCase):
    """Exercises the cross-platform anti-slop.py runner (no bash/rg dependency)."""

    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def _write(self, name, content):
        path = self.tmp / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        return path

    def test_clean_project_scans_clean(self):
        self._write("index.html", "<h1>Fast and reliable</h1>")
        self._write(
            "styles.css",
            "body { background: #0a0a0a; font-family: 'Sora', sans-serif; }",
        )
        results = scan(self.tmp)
        self.assertEqual(results, {})

    def test_purple_gradient_reported(self):
        self._write(
            "hero.css", "background: linear-gradient(135deg, #7c3aed, #8b5cf6);"
        )
        results = scan(self.tmp)
        self.assertIn("PURPLE_GRADIENT", results)
        self.assertEqual(len(results["PURPLE_GRADIENT"]), 1)

    def test_inter_sole_font_reported(self):
        self._write("globals.css", "font-family: 'Inter', sans-serif;")
        results = scan(self.tmp)
        self.assertIn("INTER_SOLE_FONT", results)

    def test_pure_black_background_reported(self):
        self._write("globals.css", "background-color: #000;")
        results = scan(self.tmp)
        self.assertIn("PURE_BLACK_BG", results)

    def test_em_dash_only_in_tsx(self):
        self._write("copy.html", "feature — not a bug")
        results = scan(self.tmp)
        self.assertNotIn("EM_DASH", results)
        self._write("app.tsx", "feature — not a bug")
        results = scan(self.tmp)
        self.assertIn("EM_DASH", results)

    def test_buzzword_reported(self):
        self._write("page.tsx", "Seamlessly integrate and leverage your workflow")
        results = scan(self.tmp)
        self.assertIn("AI_BUZZWORDS", results)

    def test_welcome_to_reported_in_tsx(self):
        self._write("page.tsx", "Welcome to our platform")
        results = scan(self.tmp)
        self.assertIn("WELCOME_HERO", results)

    def test_node_modules_skipped(self):
        self._write(
            "node_modules/pkg/hero.css",
            "background: linear-gradient(135deg, #7c3aed, #8b5cf6);",
        )
        self.assertEqual(scan(self.tmp), {})

    def test_every_check_has_label_and_glob(self):
        for check in CHECKS:
            self.assertTrue(check["label"])
            self.assertIn("glob", check)
            if check.get("mode", "line") == "line":
                self.assertTrue(check["patterns"])
            elif check["mode"] == "file":
                self.assertTrue(check["all_of"])

    def test_single_file_target(self):
        path = self._write(
            "bad.css", "background: linear-gradient(135deg, #7c3aed, #8b5cf6);"
        )
        results = scan(path)
        self.assertIn("PURPLE_GRADIENT", results)

    def test_every_check_has_valid_severity(self):
        for check in CHECKS:
            self.assertIn(check["severity"], ("MEDIUM", "HIGH", "CRITICAL"))

    def test_keyframe_layout_property_reported(self):
        self._write(
            "motion.css", "@keyframes slide { from { left: 0; } to { left: 100%; } }"
        )
        results = scan(self.tmp)
        self.assertIn("KEYFRAME_LAYOUT_PROP", results)

    def test_keyframe_transform_not_reported(self):
        self._write(
            "motion.css",
            "@keyframes fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; } }",
        )
        results = scan(self.tmp)
        self.assertNotIn("KEYFRAME_LAYOUT_PROP", results)

    def test_heading_italic_reported(self):
        self._write(
            "type.css",
            "h2 { font-family: 'Playfair Display', serif; font-style: italic; }",
        )
        results = scan(self.tmp)
        self.assertIn("ITALIC_HEADING", results)

    def test_hero_centered_file_mode(self):
        self._write(
            "hero.tsx",
            'const Hero = () => <section className="min-h-screen flex items-center justify-center text-center">Hi</section>',
        )
        results = scan(self.tmp)
        self.assertIn("HERO_CENTERED", results)

    def test_placeholder_copy_reported(self):
        self._write("page.tsx", "Your Name goes here — via.placeholder.com/300")
        results = scan(self.tmp)
        self.assertIn("PLACEHOLDER_COPY", results)

    def test_transition_all_reported(self):
        self._write("ui.css", ".btn { transition: all 0.3s ease; }")
        results = scan(self.tmp)
        self.assertIn("TRANSITION_ALL", results)

    def test_scroll_listener_reported(self):
        self._write(
            "app.tsx",
            'useEffect(() => window.addEventListener("scroll", onScroll), [])',
        )
        results = scan(self.tmp)
        self.assertIn("SCROLL_LISTENER", results)

    def test_tailwind_default_blue_class_reported(self):
        self._write("hero.tsx", 'className="bg-blue-600 text-white"')
        results = scan(self.tmp)
        self.assertIn("TAILWIND_DEFAULT_BLUE", results)

    def test_tailwind_default_blue_hex_reported(self):
        self._write("hero.css", "background: #3b82f6;")  # blue-500 verbatim default
        results = scan(self.tmp)
        self.assertIn("TAILWIND_DEFAULT_BLUE", results)

    def test_custom_blue_hex_not_reported(self):
        self._write("hero.css", "background: #1e5eff;")  # hand-picked, not a default
        results = scan(self.tmp)
        self.assertNotIn("TAILWIND_DEFAULT_BLUE", results)

    def test_purple_gradient_with_blue_also_flags_blue(self):
        self._write(
            "hero.css", "background: linear-gradient(135deg, #2563eb, #8b5cf6);"
        )
        results = scan(self.tmp)
        self.assertIn("PURPLE_GRADIENT", results)
        self.assertIn("TAILWIND_DEFAULT_BLUE", results)

    def test_selected_state_border_only_reported(self):
        self._write(
            "tabs.tsx",
            'className="data-[state=active]:border-b-2 data-[state=active]:border-primary"',
        )
        results = scan(self.tmp)
        self.assertIn("SELECTED_STATE_BORDER_ONLY", results)

    def test_eyebrow_caps_cramped_reported(self):
        self._write(
            "hero.tsx", 'className="text-xs uppercase tracking-widest text-muted"'
        )
        results = scan(self.tmp)
        self.assertIn("EYEBROW_CAPS_CRAMPED", results)

    def test_eyebrow_normal_case_not_reported(self):
        self._write("hero.tsx", 'className="text-lg font-bold"')
        results = scan(self.tmp)
        self.assertNotIn("EYEBROW_CAPS_CRAMPED", results)

    def test_random_status_pill_reported(self):
        self._write(
            "badge.tsx", '<span className="rounded-full bg-green-100">● Live</span>'
        )
        results = scan(self.tmp)
        self.assertIn("RANDOM_STATUS_PILL", results)

    def test_glow_lights_reported(self):
        self._write(
            "hero.css",
            ".glow { background: radial-gradient(circle, purple, transparent); filter: blur-3xl; }",
        )
        results = scan(self.tmp)
        self.assertIn("GLOW_LIGHTS", results)

    def test_emoji_as_icon_reported(self):
        self._write("card.tsx", "<button>🚀 Launch</button>")
        results = scan(self.tmp)
        self.assertIn("EMOJI_AS_ICON", results)

    def test_plain_text_no_emoji(self):
        self._write("card.tsx", "<button>Launch</button>")
        results = scan(self.tmp)
        self.assertNotIn("EMOJI_AS_ICON", results)

    def test_three_tier_pricing_reported(self):
        self._write("pricing.tsx", "<span>Most Popular</span>")
        results = scan(self.tmp)
        self.assertIn("THREE_TIER_PRICING", results)

    def test_css_three_col_repeat_reported(self):
        self._write(
            "grid.css",
            ".features { display: grid; grid-template-columns: repeat(3, 1fr); }",
        )
        results = scan(self.tmp)
        self.assertIn("EQUAL_3_COL", results)


class TestFailOn(unittest.TestCase):
    """Exercises the --fail-on severity gate."""

    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def _write(self, name, content):
        path = self.tmp / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        return path

    def test_medium_only_passes_fail_on_high(self):
        self._write("page.tsx", "Seamlessly integrate your workflow")  # MEDIUM
        from anti_slop import main

        rc = main([str(self.tmp), "--fail-on", "HIGH"])
        self.assertEqual(rc, 0)

    def test_medium_fails_fail_on_medium(self):
        self._write("page.tsx", "Seamlessly integrate your workflow")  # MEDIUM
        from anti_slop import main

        rc = main([str(self.tmp), "--fail-on", "MEDIUM"])
        self.assertEqual(rc, 1)

    def test_critical_fails_fail_on_high(self):
        self._write(
            "hero.css", "background: linear-gradient(135deg, #7c3aed, #8b5cf6);"
        )  # CRITICAL
        from anti_slop import main

        rc = main([str(self.tmp), "--fail-on", "HIGH"])
        self.assertEqual(rc, 1)

    def test_clean_passes_always(self):
        self._write("page.tsx", "Fast and reliable tooling.")
        from anti_slop import main

        self.assertEqual(main([str(self.tmp), "--fail-on", "CRITICAL"]), 0)

    def test_default_fail_on_none_never_fails(self):
        # --fail-on defaults to NONE: reports violations but exits 0.
        self._write(
            "hero.css", "background: linear-gradient(135deg, #7c3aed, #8b5cf6);"
        )  # CRITICAL
        from anti_slop import main

        self.assertEqual(main([str(self.tmp)]), 0)


class TestAntiSlopPatterns(unittest.TestCase):
    """Test regex patterns directly (no bash dependency)."""

    def _create_temp_file(self, content, suffix=".css"):
        tmp = tempfile.NamedTemporaryFile(mode="w", suffix=suffix, delete=False)
        tmp.write(content)
        tmp.close()
        return Path(tmp.name)

    def test_purple_gradient_detection(self):
        pattern = re.compile(
            r"linear-gradient.*#(7c3aed|8b5cf6|a78bfa|6d28d9|5b21b6|4c1d95|9333ea)|linear-gradient.*(purple|violet)"
        )
        self.assertTrue(
            pattern.search("background: linear-gradient(135deg, #7c3aed, #8b5cf6)")
        )
        self.assertTrue(
            pattern.search("background: linear-gradient(to right, purple, violet)")
        )
        self.assertFalse(
            pattern.search("background: linear-gradient(135deg, #2563eb, #3b82f6)")
        )

    def test_inter_sole_font_detection(self):
        pattern = re.compile(r"font-family.*Inter[\"']?\s*[;,]|fontFamily.*Inter")
        self.assertTrue(pattern.search("font-family: 'Inter', sans-serif;"))
        self.assertTrue(pattern.search('fontFamily: "Inter"'))
        self.assertFalse(pattern.search("font-family: 'Sora', sans-serif;"))

    def test_ai_buzzword_detection(self):
        pattern = re.compile(
            r"seamless(ly)?|leverage|cutting[- ]edge|game[- ]chang|revolutioniz|paradigm|empower|harness"
        )
        self.assertTrue(pattern.search("seamlessly integrate"))
        self.assertTrue(pattern.search("leverage your workflow"))
        self.assertTrue(pattern.search("cutting-edge technology"))
        self.assertFalse(pattern.search("fast and reliable"))

    def test_gradient_text_detection(self):
        pattern = re.compile(r"background.*-clip:\s*text|text-transparent.*bg-clip")
        self.assertTrue(
            pattern.search(
                "background: linear-gradient(...); -webkit-background-clip: text;"
            )
        )
        self.assertTrue(pattern.search("text-transparent bg-clip-text"))
        self.assertFalse(pattern.search("color: #1a1a1a;"))

    def test_pure_black_bg_detection(self):
        pattern = re.compile(r"background(-color)?:\s*(#000000|#000\b|black)")
        self.assertTrue(pattern.search("background: #000000;"))
        self.assertTrue(pattern.search("background-color: black;"))
        self.assertFalse(pattern.search("background: #0a0a0a;"))

    def test_em_dash_detection(self):
        pattern = re.compile(r"\u2014|&#8212;")
        self.assertTrue(pattern.search("feature \u2014 not a bug"))
        self.assertTrue(pattern.search("line one &#8212; line two"))
        self.assertFalse(pattern.search("feature - not a bug"))

    def test_welcome_hero_detection(self):
        pattern = re.compile(r"Welcome\s+to")
        self.assertTrue(pattern.search("Welcome to our platform"))
        self.assertFalse(pattern.search("Start building today"))

    def test_equal_3_col_detection(self):
        pattern = re.compile(r"grid-cols-3(?!.*minmax)")
        self.assertTrue(pattern.search("grid-cols-3"))
        self.assertFalse(pattern.search("grid-cols-3 minmax(280px, 1fr)"))


if __name__ == "__main__":
    unittest.main()
