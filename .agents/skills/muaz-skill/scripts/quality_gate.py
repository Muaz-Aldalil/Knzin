#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Deterministic Quality Gate — converts the skill's design rules from prose into
enforced constraints. Pure Python, no third-party dependencies.

Checks:
  1. Contrast      — WCAG 2.2 contrast math on every fg/bg pair in the palette.
  2. Tokens        — token JSON schema conformance (colors, radius, motion, type).
  3. Budget        — bundle size estimate per stack vs the QD budget.
  4. Anti-Slop     — runs anti_slop.py scan over the generated source.

Exit codes:
  0 = pass, 1 = gate failure, 2 = usage/input error.
"""

import argparse
import json
import re
import sys
from pathlib import Path

# Keep importable alongside the other scripts (used by tests and CLI).
HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))

from anti_slop import CHECKS, SEVERITY_RANK, scan  # noqa: E402


# ============ 1. WCAG CONTRAST (WCAG 2.2 / 1.4.3) ============

_HEX_RE = re.compile(r"^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$")


def is_hex(color) -> bool:
    return isinstance(color, str) and bool(_HEX_RE.match(color.strip()))


def _expand_hex(color: str) -> tuple:
    color = color.strip().lstrip("#")
    if len(color) == 3:
        color = "".join(c * 2 for c in color)
    return int(color[0:2], 16), int(color[2:4], 16), int(color[4:6], 16)


def relative_luminance(color: str) -> float:
    """WCAG relative luminance of an sRGB hex color (0..1)."""
    r, g, b = _expand_hex(color)

    def linear(c):
        c = c / 255.0
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

    return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)


def contrast_ratio(fg: str, bg: str) -> float:
    """WCAG contrast ratio between two hex colors (>= 1.0)."""
    l1 = relative_luminance(fg)
    l2 = relative_luminance(bg)
    lighter, darker = max(l1, l2), min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)


def contrast_pass(ratio: float, large_text: bool = False) -> bool:
    """AA thresholds: 4.5:1 normal text, 3:1 large text (>=24px or >=18.66px bold)."""
    threshold = 3.0 if large_text else 4.5
    return ratio >= threshold


# ============ 2. TOKEN SCHEMA ============

TOKEN_SCHEMA = {
    "required_colors": ["primary", "secondary", "accent", "background", "foreground"],
    "optional_colors": ["muted", "muted_foreground", "border", "destructive", "ring", "on_primary", "on_secondary"],
    "color_roles": {
        # (fg, bg, large_text) — pairs validated for WCAG AA contrast.
        # "muted" is a surface (shadcn semantics); "muted_foreground" is its text.
        "body text on background": ("foreground", "background", False),
        "body text on card": ("foreground", "card", False),
        "muted text on background": ("muted_foreground", "background", False),
        "muted text on card": ("muted_foreground", "card", False),
        "on-primary on primary": ("on_primary", "primary", False),
        "on-accent on accent": ("on_accent", "accent", False),
        "on-destructive on destructive": ("on_destructive", "destructive", False),
    },
    "required_radius": ["sm", "md", "lg"],
    "required_motion": ["fast", "normal", "slow"],
    "required_breakpoints": ["sm", "md", "lg", "xl"],
    "required_typography": ["heading", "body"],
}

_RADIUS_RE = re.compile(r"^\d+(\.\d+)?(px|rem|em)$")
_DURATION_RE = re.compile(r"^\d+(\.\d+)?ms$")
_BP_RE = re.compile(r"^\d+(\.\d+)?px$")


def validate_tokens(tokens: dict) -> list:
    """Return a list of violation strings for a token dict (empty == valid)."""
    violations = []
    if not isinstance(tokens, dict):
        return ["tokens root must be a JSON object"]
    if tokens.get("schema_version", 1) not in (1, 2):
        violations.append(f"unsupported schema_version: {tokens.get('schema_version')}")

    colors = tokens.get("colors") or {}
    for field in TOKEN_SCHEMA["required_colors"]:
        if field not in colors or not is_hex(str(colors[field])):
            violations.append(f"colors.{field}: missing or invalid hex ({colors.get(field)})")
    for field, role in TOKEN_SCHEMA["color_roles"].items():
        fg_key, bg_key, large = role
        fg, bg = colors.get(fg_key), colors.get(bg_key)
        # Optional pairs (muted/border/destructive/on_*) are validated only when
        # both members are present; required roles are covered by required_colors.
        if not is_hex(str(fg)) or not is_hex(str(bg)):
            continue
        ratio = contrast_ratio(str(fg), str(bg))
        if not contrast_pass(ratio, large):
            violations.append(
                f"contrast '{role}': {ratio:.2f}:1 < {3.0 if large else 4.5}:1 "
                f"({fg} on {bg})"
            )

    for field in TOKEN_SCHEMA["required_radius"]:
        val = (tokens.get("radius") or {}).get(field, "")
        if not _RADIUS_RE.match(str(val)):
            violations.append(f"radius.{field}: expected px/rem length, got {val!r}")
    for field in TOKEN_SCHEMA["required_motion"]:
        val = (tokens.get("motion") or {}).get(field, "")
        if not _DURATION_RE.match(str(val)):
            violations.append(f"motion.{field}: expected ms duration, got {val!r}")
    for field in TOKEN_SCHEMA["required_breakpoints"]:
        val = (tokens.get("breakpoints") or {}).get(field, "")
        if not _BP_RE.match(str(val)):
            violations.append(f"breakpoints.{field}: expected px, got {val!r}")
    for field in TOKEN_SCHEMA["required_typography"]:
        val = (tokens.get("typography") or {}).get(field, "")
        if not val:
            violations.append(f"typography.{field}: required")
    if not tokens.get("project"):
        violations.append("project: required")

    return violations


def tokens_from_design_system(ds: dict) -> dict:
    """Build the token JSON from a DesignSystemGenerator output dict."""
    colors = ds.get("colors") or {}
    typography = ds.get("typography") or {}
    return {
        "schema_version": 2,
        "project": ds.get("project_name", ""),
        "category": ds.get("category", ""),
        "colors": {
            "primary": colors.get("primary", ""),
            "on_primary": colors.get("on_primary", ""),
            "secondary": colors.get("secondary", ""),
            "accent": colors.get("accent", ""),
            "on_accent": colors.get("on_accent", ""),
            "background": colors.get("background", ""),
            "card": colors.get("card", colors.get("background", "")),
            "foreground": colors.get("foreground", ""),
            "muted": colors.get("muted", ""),
            "muted_foreground": colors.get("muted_foreground", ""),
            "border": colors.get("border", ""),
            "destructive": colors.get("destructive", ""),
            "ring": colors.get("ring", ""),
        },
        "typography": {
            "heading": typography.get("heading", ""),
            "body": typography.get("body", ""),
        },
        "radius": {"sm": "4px", "md": "8px", "lg": "16px"},
        "motion": {"fast": "150ms", "normal": "250ms", "slow": "400ms"},
        "breakpoints": {"sm": "640px", "md": "768px", "lg": "1024px", "xl": "1440px"},
    }


# ============ 3. BUNDLE BUDGET ============

QD_BUDGET = {"js_gzip_kb": 200, "css_gzip_kb": 50, "initial_gzip_kb": 500}

# Approximate gzipped base bundle (KB) per stack — engineering constants, not search data.
_STACK_JS_BASE = {
    "react": 45, "nextjs": 85, "vue": 35, "nuxtjs": 65, "nuxt-ui": 85,
    "svelte": 15, "astro": 10, "angular": 70, "html-tailwind": 3,
    "shadcn": 75, "laravel": 45, "threejs": 170, "react-native": 0,
    "flutter": 0, "swiftui": 0, "jetpack-compose": 0,
}
_STACK_CSS_BASE = {
    "html-tailwind": 15, "shadcn": 25, "nuxt-ui": 20, "nextjs": 12, "react": 10,
    "vue": 10, "nuxtjs": 12, "svelte": 8, "astro": 6, "angular": 14,
    "laravel": 10, "threejs": 8, "react-native": 0, "flutter": 0,
    "swiftui": 0, "jetpack-compose": 0,
}
_PER_COMPONENT_JS_KB = 2
_PER_COMPONENT_CSS_KB = 1


def estimate_bundle(stack: str, component_count: int = 12) -> dict:
    """Estimate gzipped bundle size for a stack. Native stacks return 0 (non-web)."""
    js = _STACK_JS_BASE.get(stack, 0)
    css = _STACK_CSS_BASE.get(stack, 0)
    if js == 0 and css == 0:
        return {"stack": stack, "native": True, "js_gzip_kb": 0, "css_gzip_kb": 0,
                "initial_gzip_kb": 0, "violations": []}
    js += _PER_COMPONENT_JS_KB * component_count
    css += _PER_COMPONENT_CSS_KB * component_count
    initial = js + css
    violations = []
    if js > QD_BUDGET["js_gzip_kb"]:
        violations.append(f"JS {js:.0f}KB > {QD_BUDGET['js_gzip_kb']}KB budget")
    if css > QD_BUDGET["css_gzip_kb"]:
        violations.append(f"CSS {css:.0f}KB > {QD_BUDGET['css_gzip_kb']}KB budget")
    if initial > QD_BUDGET["initial_gzip_kb"]:
        violations.append(f"initial {initial:.0f}KB > {QD_BUDGET['initial_gzip_kb']}KB budget")
    return {"stack": stack, "native": False, "js_gzip_kb": js, "css_gzip_kb": css,
            "initial_gzip_kb": initial, "violations": violations}


# ============ 4. ANTI-SLOP AGGREGATION ============

def aggregate_anti_slop(target: Path) -> dict:
    """Run the anti-slop scan and group hits by severity."""
    results = scan(target)
    grouped = {"CRITICAL": {}, "HIGH": {}, "MEDIUM": {}}
    total = 0
    for check in CHECKS:
        hits = results.get(check["label"])
        if not hits:
            continue
        grouped[check["severity"]][check["label"]] = hits
        total += len(hits)
    return {"groups": grouped, "total_hits": total}


def anti_slop_passes(summary: dict, fail_min: str = "MEDIUM") -> bool:
    """True when no violations at or above the fail threshold exist."""
    min_rank = SEVERITY_RANK.get(fail_min, 1)
    for severity, rank in (("CRITICAL", 3), ("HIGH", 2), ("MEDIUM", 1)):
        if rank >= min_rank and summary["groups"][severity]:
            return False
    return True


# ============ CLI ============

def _fmt_groups(groups: dict) -> str:
    out = []
    for severity in ("CRITICAL", "HIGH", "MEDIUM"):
        if not groups[severity]:
            continue
        out.append(f"--- {severity} ---")
        for label, hits in groups[severity].items():
            out.append(f"FAIL [{label}]: {len(hits)} hit(s)")
    return "\n".join(out)


def run_gate(source_dir: Path, tokens: dict = None, stack: str = None,
             component_count: int = 12, fail_min: str = "MEDIUM") -> dict:
    """Run all gate checks; returns report dict with 'ok' boolean."""
    checks = []

    slop = aggregate_anti_slop(source_dir)
    slop_ok = anti_slop_passes(slop, fail_min)
    checks.append({
        "name": "anti-slop",
        "ok": slop_ok,
        "detail": (f"{slop['total_hits']} hits "
                   f"({len(slop['groups']['CRITICAL'])} CRITICAL, "
                   f"{len(slop['groups']['HIGH'])} HIGH, "
                   f"{len(slop['groups']['MEDIUM'])} MEDIUM)") if slop["total_hits"] else "clean",
    })

    token_violations = validate_tokens(tokens) if tokens is not None else []
    checks.append({
        "name": "tokens",
        "ok": not token_violations,
        "detail": "; ".join(token_violations) if token_violations else "schema + contrast pass",
    })

    budget = estimate_bundle(stack, component_count) if stack else None
    if budget:
        checks.append({
            "name": "budget",
            "ok": not budget["violations"] and not budget["native"],
            "detail": (f"{budget['js_gzip_kb']}KB JS + {budget['css_gzip_kb']}KB CSS "
                       f"= {budget['initial_gzip_kb']}KB initial; " +
                       ("; ".join(budget["violations"]) if budget["violations"] else "within QD budget")),
        })

    ok = all(c["ok"] for c in checks)
    return {"ok": ok, "checks": checks}


def main(argv=None):
    parser = argparse.ArgumentParser(prog="quality-gate.py", description="Deterministic quality gate (contrast, tokens, budget, anti-slop)")
    parser.add_argument("source_dir", help="directory of generated code to gate")
    parser.add_argument("--tokens", default=None, help="path to tokens.json (emitted by design_system.py)")
    parser.add_argument("--stack", default=None, help="stack name for bundle estimate (e.g. react, html-tailwind)")
    parser.add_argument("--components", type=int, default=12, help="estimated component count (default 12)")
    parser.add_argument("--fail-on", choices=["MEDIUM", "HIGH", "CRITICAL"], default="MEDIUM")
    args = parser.parse_args(argv)

    source = Path(args.source_dir).resolve()
    if not source.exists():
        print(f"ERROR: source dir not found: {source}", file=sys.stderr)
        return 2

    tokens = None
    if args.tokens:
        tok_path = Path(args.tokens).resolve()
        try:
            tokens = json.loads(tok_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as e:
            print(f"ERROR: cannot read tokens file {tok_path}: {e}", file=sys.stderr)
            return 2

    report = run_gate(source, tokens, args.stack, args.components, args.fail_on)

    print("=== MUAZ-V3 DETERMINISTIC QUALITY GATE ===")
    for check in report["checks"]:
        status = "PASS" if check["ok"] else "FAIL"
        print(f"[{status}] {check['name']}: {check['detail']}")
    print("RESULT:", "PASS" if report["ok"] else "FAIL")
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
