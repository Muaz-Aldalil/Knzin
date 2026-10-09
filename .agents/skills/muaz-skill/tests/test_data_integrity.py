"""Data integrity tests - protect the search engine's CSV fuel and doc contracts.

Validates:
  - Every CSV in data/ has the columns the search engine expects.
  - Every stack in scripts/core.py has a data/stacks/ file.
  - Every reference file in references/ is registered in reference-graph.md.
  - The anti-slop contract (29 checks) matches README/quality-gate claims.
  - SKILL.md stack list maps to real stack files.
"""

import csv
import re
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).parent.parent
DATA = ROOT / "data"
SCRIPTS = ROOT / "scripts"
REFERENCES = ROOT / "references"

sys.path.insert(0, str(SCRIPTS))
from core import CSV_CONFIG, STACK_CONFIG, AVAILABLE_STACKS  # noqa: E402
from anti_slop import CHECKS, SEVERITY_RANK  # noqa: E402


def _headers(filepath: Path) -> list:
    with open(filepath, "r", encoding="utf-8") as f:
        return list(csv.DictReader(f).fieldnames or [])


class TestCsvSchema(unittest.TestCase):
    def test_every_domain_csv_exists_and_has_expected_columns(self):
        for domain, config in CSV_CONFIG.items():
            filepath = DATA / config["file"]
            self.assertTrue(
                filepath.exists(), f"Missing CSV for domain {domain}: {config['file']}"
            )
            if config.get("parser"):
                continue  # freeform-text parser (design.csv) has no fixed columns
            headers = _headers(filepath)
            for col in config["output_cols"]:
                self.assertIn(
                    col,
                    headers,
                    f"Domain {domain}: missing output col {col!r} in {config['file']}",
                )
            for col in config["search_cols"]:
                self.assertIn(
                    col,
                    headers,
                    f"Domain {domain}: missing search col {col!r} in {config['file']}",
                )

    def test_csvs_are_not_empty(self):
        for config in CSV_CONFIG.values():
            filepath = DATA / config["file"]
            with open(filepath, "r", encoding="utf-8") as f:
                rows = list(csv.DictReader(f))
            self.assertGreater(len(rows), 0, f"{config['file']} has no data rows")


class TestStackData(unittest.TestCase):
    def test_every_stack_has_a_file(self):
        for stack, config in STACK_CONFIG.items():
            filepath = DATA / config["file"]
            self.assertTrue(
                filepath.exists(), f"Stack {stack} missing file: {config['file']}"
            )

    def test_every_stack_file_has_common_columns(self):
        for stack in AVAILABLE_STACKS:
            filepath = DATA / STACK_CONFIG[stack]["file"]
            headers = _headers(filepath)
            for col in ("Category", "Guideline", "Do", "Don't"):
                self.assertIn(col, headers, f"Stack {stack}: missing column {col!r}")


class TestReferenceGraph(unittest.TestCase):
    def test_every_reference_file_is_registered(self):
        graph = (REFERENCES / "reference-graph.md").read_text(encoding="utf-8")
        for path in sorted(REFERENCES.glob("*.md")):
            name = path.name
            self.assertIn(name, graph, f"{name} not registered in reference-graph.md")

    def test_every_registered_file_exists(self):
        graph = (REFERENCES / "reference-graph.md").read_text(encoding="utf-8")
        registered = set(re.findall(r"`([a-z0-9-]+\.md)`", graph))
        for name in registered:
            self.assertTrue(
                (REFERENCES / name).exists(), f"Dangling registry row: {name}"
            )


class TestAntiSlopContract(unittest.TestCase):
    def test_exactly_29_checks(self):
        self.assertEqual(len(CHECKS), 29)

    def test_all_severities_valid(self):
        for check in CHECKS:
            self.assertIn(check["severity"], SEVERITY_RANK)

    def test_all_checks_have_source(self):
        for check in CHECKS:
            self.assertIn(
                "source", check, f"{check['label']} missing provenance source"
            )
            self.assertTrue(
                str(check["source"]).strip(), f"{check['label']} has empty source"
            )

    def test_readme_claims_29_checks(self):
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        self.assertIn("29 AI tell-patterns", readme)
        self.assertIn("29 نمطاً", readme)


class TestGeneratedOutputConsistency(unittest.TestCase):
    """The generator must never emit the AI-gradient signature it flags in user code.

    anti_slop.py flags `linear-gradient` + AI-purple hexes as CRITICAL. The
    generator's own output (solid-color design language) must stay clean.
    """

    def test_generated_output_has_no_ai_gradient_signature(self):
        from design_system import DesignSystemGenerator, format_ascii_box  # noqa: E402

        ds = DesignSystemGenerator().generate("AI agent dashboard", "ConsistencyTest")
        out = format_ascii_box(ds).lower()
        self.assertNotIn("linear-gradient", out)
        self.assertNotIn("from-indigo", out)
        self.assertNotIn("from-violet", out)
        self.assertNotIn("from-purple", out)


class TestSkillFrontmatter(unittest.TestCase):
    def test_skill_stacks_map_to_files(self):
        skill = (ROOT / "SKILL.md").read_text(encoding="utf-8")
        m = re.search(r"^stacks:\s*\[([^\]]+)\]", skill, re.M)
        self.assertIsNotNone(m, "SKILL.md frontmatter missing stacks list")
        stacks = [s.strip() for s in m.group(1).split(",")]
        # aliases: SKILL.md names -> core.py names
        alias = {"next": "nextjs", "nuxt": "nuxtjs"}
        for stack in stacks:
            core_name = alias.get(stack, stack)
            self.assertIn(
                core_name, AVAILABLE_STACKS, f"SKILL stack {stack!r} unknown to core.py"
            )


class TestDocConsistency(unittest.TestCase):
    def test_quality_gate_says_8_dimensions(self):
        qg = (REFERENCES / "quality-gate.md").read_text(encoding="utf-8")
        self.assertIn("8 dimensions", qg)

    def test_component_a11y_registered_everywhere(self):
        self.assertTrue((REFERENCES / "component-a11y.md").exists())
        for base, fname, needle in [
            (ROOT, "SKILL.md", "component-a11y.md"),
            (REFERENCES, "reference-graph.md", "component-a11y.md"),
            (REFERENCES, "checklist-index.md", "CHK-a11y"),
        ]:
            text = (base / fname).read_text(encoding="utf-8")
            self.assertIn(needle, text, f"{fname} does not reference {needle}")

    def test_master_md_contains_design_tokens_sections(self):
        from design_system import DesignSystemGenerator, format_master_md  # noqa: E402

        ds = DesignSystemGenerator().generate("SaaS dashboard", "IntegrityTest")
        master = format_master_md(ds)
        for section in (
            "### Border Radius",
            "### Motion & Transitions",
            "### Dark Mode",
        ):
            self.assertIn(section, master)


if __name__ == "__main__":
    unittest.main()
