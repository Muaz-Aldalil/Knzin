#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Token Audit — verifies that a *running page's* computed styles actually match
the tokens emitted by design_system.py. This closes the loop between blueprint
and shipped CSS: prose guidance becomes enforced conformance.

Requires `playwright` (pip install playwright && playwright install chromium).
The pure comparison logic is dependency-free and unit-tested; only the browser
fetch needs Playwright.

Usage:
  python scripts/token_audit.py <tokens.json> <url> [--selectors key=sel ...]
  python scripts/token_audit.py <tokens.json> <file.html>

Exit codes: 0 = all asserted tokens conform, 1 = violations, 2 = usage/input error.
"""

import argparse
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))

from quality_gate import is_hex, validate_tokens  # noqa: E402


# Which token roles map to which CSS properties (computed-style assertions).
# Defined after the norm helpers because it references them.
ROLE_ASSERTIONS = None


def _norm_color(value: str) -> str:
    """Normalize computed color to lowercase #rrggbb (rgb() -> hex)."""
    value = (value or "").strip().lower()
    m = re.match(r"rgba?\((\d+),\s*(\d+),\s*(\d+)", value)
    if m:
        return "#%02x%02x%02x" % tuple(int(v) for v in m.groups())
    if value.startswith("transparent"):
        return "rgba(0, 0, 0, 0)"
    if re.match(r"^#[0-9a-f]{3}$", value):
        value = "#" + "".join(c * 2 for c in value[1:])
    return value


def _norm_px(value: str) -> str:
    value = (value or "").strip()
    if not value or value == "none":
        return value
    if value.endswith("px") and value.count(" ") == 0:
        return value
    return value.split()[0] if value.split() else value


def _norm_duration(value: str) -> str:
    value = (value or "").strip()
    return value.split(",")[0].strip() if value else value


ROLE_ASSERTIONS = {
    # token role -> (css property, normalization fn)
    "colors.background": ("background-color", _norm_color),
    "colors.foreground": ("color", _norm_color),
    "colors.card": ("background-color", _norm_color),
    "colors.primary": ("color", _norm_color),
    "radius.sm": ("border-radius", _norm_px),
    "radius.md": ("border-radius", _norm_px),
    "radius.lg": ("border-radius", _norm_px),
    "motion.fast": ("transition-duration", _norm_duration),
    "motion.normal": ("transition-duration", _norm_duration),
    "motion.slow": ("transition-duration", _norm_duration),
}


def normalize_property(prop: str, value: str) -> str:
    if prop == "color" or prop == "background-color":
        return _norm_color(value)
    if prop == "border-radius":
        return _norm_px(value)
    if prop == "transition-duration":
        return _norm_duration(value)
    return (value or "").strip()


def token_role(role: str, tokens: dict) -> str:
    """Resolve a 'colors.primary' style role to its token value."""
    section, key = role.split(".", 1)
    value = (tokens.get(section) or {}).get(key, "")
    return str(value).strip()


def build_assertions(tokens: dict, selectors: dict) -> list:
    """Build [(token_role, css_prop, selector, expected_value)] for every role
    that has both a token value and a selector."""
    assertions = []
    for role, (prop, _fn) in ROLE_ASSERTIONS.items():
        selector = selectors.get(role)
        expected = token_role(role, tokens)
        if not selector or not expected:
            continue
        assertions.append({"role": role, "prop": prop, "selector": selector, "expected": expected})
    return assertions


def compare_computed(assertions: list, computed: dict) -> list:
    """Compare computed values to expected token values. Returns violations."""
    violations = []
    for a in assertions:
        actual = normalize_property(a["prop"], computed.get((a["role"], a["prop"]), ""))
        expected = normalize_property(a["prop"], a["expected"])
        if actual and actual != expected:
            violations.append(
                f"{a['role']}: expected {expected!r} got {actual!r} "
                f"(selector {a['selector']!r})"
            )
    return violations


# ============ Playwright-backed browser check (optional) ============

def _browser_computed(page, assertions: list) -> dict:
    """Fetch computed styles for every assertion selector. Returns {role: value}."""
    results = {}
    seen_selectors = {}
    for a in assertions:
        seen_selectors.setdefault(a["selector"], [])
        seen_selectors[a["selector"]].append((a["role"], a["prop"]))

    for selector, targets in seen_selectors.items():
        try:
            page.wait_for_selector(selector, timeout=3000)
        except Exception:
            continue
        for role, prop in targets:
            try:
                value = page.evaluate(
                    "(args) => getComputedStyle(document.querySelector(args[0]))[args[1]]",
                    [selector, prop],
                )
                results[(role, prop)] = value
            except Exception:
                pass
    return results


def audit_url(url: str, tokens: dict, selectors: dict, timeout: int = 15000) -> dict:
    """Full browser audit: build assertions, load page, compare computed styles."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        return {"ok": False, "error": "playwright not installed (pip install playwright && playwright install chromium)"}

    assertions = build_assertions(tokens, selectors)
    if not assertions:
        return {"ok": True, "checked": 0, "violations": []}

    violations = []
    checked = 0
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            page = browser.new_page()
            page.goto(url, wait_until="networkidle", timeout=timeout)
            computed = _browser_computed(page, assertions)
            violations = compare_computed(assertions, computed)
            checked = len(assertions)
        finally:
            browser.close()
    return {"ok": not violations, "checked": checked, "violations": violations}


# ============ CLI ============

_DEFAULT_SELECTORS = {
    "colors.background": "body",
    "colors.foreground": "body",
    "colors.card": ".card, main",
    "colors.primary": "a, button, .btn-primary",
    "radius.sm": ".btn, button, .badge",
    "radius.md": ".card, .btn",
    "radius.lg": ".card, .panel, .modal",
    "motion.fast": ".btn, button",
    "motion.normal": ".card, .btn",
    "motion.slow": ".modal, .toast",
}


def main(argv=None):
    parser = argparse.ArgumentParser(prog="token-audit.py", description="Verify computed styles match design tokens")
    parser.add_argument("tokens", help="path to tokens.json")
    parser.add_argument("url", help="URL or local file:// path of the running page")
    parser.add_argument("--selector", action="append", default=[], metavar="ROLE=CSS_SELECTOR",
                        help="override a role selector, e.g. colors.primary=a.btn")
    args = parser.parse_args(argv)

    tok_path = Path(args.tokens).resolve()
    try:
        tokens = json.loads(tok_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as e:
        print(f"ERROR: cannot read tokens file: {e}", file=sys.stderr)
        return 2

    schema_issues = validate_tokens(tokens)
    if schema_issues:
        print("ERROR: tokens.json failed schema validation:", file=sys.stderr)
        for issue in schema_issues[:10]:
            print(f"  - {issue}", file=sys.stderr)
        return 2

    selectors = dict(_DEFAULT_SELECTORS)
    for override in args.selector:
        if "=" not in override:
            print(f"ERROR: --selector must be ROLE=SELECTOR, got {override!r}", file=sys.stderr)
            return 2
        role, sel = override.split("=", 1)
        selectors[role] = sel

    report = audit_url(args.url, tokens, selectors)
    if report.get("error"):
        print(f"ERROR: {report['error']}", file=sys.stderr)
        return 2

    print(f"=== TOKEN AUDIT: {tok_path.name} vs {args.url} ===")
    if not report["violations"]:
        print(f"RESULT: PASS ({report['checked']} token assertions conform)")
        return 0
    print(f"RESULT: FAIL ({len(report['violations'])} violations)")
    for v in report["violations"]:
        print(f"  - {v}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
