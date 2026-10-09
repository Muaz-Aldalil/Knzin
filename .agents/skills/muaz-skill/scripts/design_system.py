#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Design System Generator - Aggregates search results and applies reasoning
to generate comprehensive design system recommendations.

Usage:
    from design_system import generate_design_system
    result = generate_design_system("SaaS dashboard", "My Project")

    # With persistence (Master + Overrides pattern)
    result = generate_design_system("SaaS dashboard", "My Project", persist=True)
    result = generate_design_system("SaaS dashboard", "My Project", persist=True, page="dashboard")
"""

import csv
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from core import search, DATA_DIR


# ============ CONFIGURATION ============
REASONING_FILE = "ui-reasoning.csv"

SEARCH_CONFIG = {
    "product": {"max_results": 1},
    "style": {"max_results": 3},
    "color": {"max_results": 2},
    "landing": {"max_results": 2},
    "typography": {"max_results": 2},
    "motion": {"max_results": 1},
}


# ============ DESIGN SYSTEM GENERATOR ============
class DesignSystemGenerator:
    """Generates design system recommendations from aggregated searches."""

    def __init__(self):
        self.reasoning_data = self._load_reasoning()

    def _load_reasoning(self) -> list:
        """Load reasoning rules from CSV."""
        filepath = DATA_DIR / REASONING_FILE
        if not filepath.exists():
            return []
        with open(filepath, "r", encoding="utf-8") as f:
            return list(csv.DictReader(f))

    def _multi_domain_search(
        self,
        query: str,
        style_priority: list = None,
        color_mood: str = "",
        typography_mood: str = "",
        pattern_hint: str = "",
    ) -> dict:
        """Execute searches across multiple domains, biasing each domain's query
        with curated hints (from products.csv) so results stay coherent."""
        results = {}
        for domain, config in SEARCH_CONFIG.items():
            hints = []
            if domain == "style" and style_priority:
                hints = style_priority[:2]
            elif domain == "color" and color_mood:
                hints = [color_mood]
            elif domain == "typography" and typography_mood:
                hints = [typography_mood]
            elif domain == "landing" and pattern_hint:
                hints = [pattern_hint]
            elif domain == "motion" and style_priority:
                hints = style_priority[:2]
            if hints:
                combined_query = f"{query} {' '.join(hints)}"
                results[domain] = search(combined_query, domain, config["max_results"])
            else:
                results[domain] = search(query, domain, config["max_results"])
        return results

    def _find_reasoning_rule(self, category: str) -> dict:
        """Find matching reasoning rule using BM25 search."""
        from core import search

        result = search(category, "reasoning", max_results=1)
        results = result.get("results", [])
        if results:
            return results[0]
        return {}

    def _apply_reasoning(self, category: str, search_results: dict) -> dict:
        """Apply reasoning rules to search results."""
        rule = self._find_reasoning_rule(category)

        if not rule:
            return {
                "pattern": "Hero + Features + CTA",
                "style_priority": ["Minimalism", "Flat Design"],
                "color_mood": "Professional",
                "typography_mood": "Clean",
                "key_effects": "Subtle hover transitions",
                "anti_patterns": "",
                "decision_rules": {},
                "severity": "MEDIUM",
                "_fallback": True,
            }

        # Parse decision rules JSON
        decision_rules = {}
        try:
            decision_rules = json.loads(rule.get("Decision_Rules", "{}"))
        except json.JSONDecodeError:
            pass

        return {
            "pattern": rule.get("Recommended_Pattern", ""),
            "style_priority": [
                s.strip() for s in rule.get("Style_Priority", "").split("+")
            ],
            "color_mood": rule.get("Color_Mood", ""),
            "typography_mood": rule.get("Typography_Mood", ""),
            "key_effects": rule.get("Key_Effects", ""),
            "anti_patterns": rule.get("Anti_Patterns", ""),
            "decision_rules": decision_rules,
            "severity": rule.get("Severity", "MEDIUM"),
        }

    def _select_best_match(self, results: list, priority_keywords: list) -> dict:
        """Select best matching result based on priority keywords."""
        if not results:
            return {}

        if not priority_keywords:
            return results[0]

        # First: try exact style name match
        for priority in priority_keywords:
            priority_lower = priority.lower().strip()
            for result in results:
                style_name = result.get("Style Category", "").lower()
                if priority_lower in style_name or style_name in priority_lower:
                    return result

        # Second: score by keyword match in all fields
        scored = []
        for result in results:
            result_str = str(result).lower()
            score = 0
            for kw in priority_keywords:
                kw_lower = kw.lower().strip()
                # Higher score for style name match
                if kw_lower in result.get("Style Category", "").lower():
                    score += 10
                # Lower score for keyword field match
                elif kw_lower in result.get("Keywords", "").lower():
                    score += 3
                # Even lower for other field matches
                elif kw_lower in result_str:
                    score += 1
            scored.append((score, result))

        scored.sort(key=lambda x: x[0], reverse=True)
        return scored[0][1] if scored and scored[0][0] > 0 else results[0]

    def _extract_results(self, search_result: dict) -> list:
        """Extract results list from search result dict."""
        return search_result.get("results", [])

    def generate(self, query: str, project_name: str = None) -> dict:
        """Generate complete design system recommendation."""
        # Step 1: First search product to get category
        product_result = search(query, "product", 1)
        product_results = product_result.get("results", [])
        category = "General"
        product_row = {}
        if product_results:
            product_row = product_results[0]
            category = product_row.get("Product Type", "General")

        # Step 2: Get reasoning rules for this category
        reasoning = self._apply_reasoning(category, {})
        style_priority = reasoning.get("style_priority", [])

        # Step 2.5: Bias with curated product columns (products.csv) so every
        # domain search stays coherent with the product's recommended direction.
        curated_style = product_row.get("Primary Style Recommendation", "")
        if curated_style:
            style_priority = [
                s.strip() for s in curated_style.split("+")
            ] + style_priority
        color_mood = product_row.get("Color Palette Focus", "") or reasoning.get(
            "color_mood", ""
        )
        typography_mood = reasoning.get("typography_mood", "")
        pattern_hint = product_row.get("Landing Page Pattern", "")

        # Step 3: Multi-domain search with style priority hints
        search_results = self._multi_domain_search(
            query, style_priority, color_mood, typography_mood, pattern_hint
        )
        search_results["product"] = product_result  # Reuse product search

        # Step 4: Select best matches from each domain using priority
        style_results = self._extract_results(search_results.get("style", {}))
        color_results = self._extract_results(search_results.get("color", {}))
        typography_results = self._extract_results(search_results.get("typography", {}))
        landing_results = self._extract_results(search_results.get("landing", {}))
        motion_results = self._extract_results(search_results.get("motion", {}))

        best_style = self._select_best_match(style_results, style_priority)
        best_color = color_results[0] if color_results else {}
        best_typography = typography_results[0] if typography_results else {}
        best_landing = landing_results[0] if landing_results else {}
        best_motion = motion_results[0] if motion_results else {}

        # Step 5: Build final recommendation
        # Combine effects from both reasoning and style search
        style_effects = best_style.get("Effects & Animation", "")
        reasoning_effects = reasoning.get("key_effects", "")
        combined_effects = style_effects if style_effects else reasoning_effects

        # Collect warnings for silent fallbacks
        warnings = []
        if reasoning.get("_fallback"):
            warnings.append(
                "No reasoning rule matched — using generic defaults. Provide a specific product type for better results."
            )
        if not best_color:
            warnings.append(
                "No color search results — using defaults. Override with user-provided palette."
            )
        if not best_typography:
            warnings.append(
                "No typography search results — using defaults. Override with user-provided fonts."
            )
        if not best_style:
            warnings.append("No style search results — using reasoning defaults.")
        if not best_motion:
            warnings.append(
                "No motion direction matched — using Standard Scroll Reveal default. Extend data/motion.csv for better matches."
            )

        result = {
            "project_name": project_name or query.upper(),
            "category": category,
            "pattern": {
                "name": best_landing.get(
                    "Pattern Name", reasoning.get("pattern", "Hero + Features + CTA")
                ),
                "sections": best_landing.get("Section Order", "Hero > Features > CTA"),
                "cta_placement": best_landing.get(
                    "Primary CTA Placement", "Above fold"
                ),
                "color_strategy": best_landing.get("Color Strategy", ""),
                "conversion": best_landing.get("Conversion Optimization", ""),
            },
            "style": {
                "name": best_style.get("Style Category", "Minimalism"),
                "type": best_style.get("Type", "General"),
                "effects": style_effects,
                "keywords": best_style.get("Keywords", ""),
                "best_for": best_style.get("Best For", ""),
                "performance": best_style.get("Performance", ""),
                "accessibility": best_style.get("Accessibility", ""),
                "light_mode": best_style.get("Light Mode ✓", ""),
                "dark_mode": best_style.get("Dark Mode ✓", ""),
            },
            "colors": {
                "primary": best_color.get("Primary", "#2563EB"),
                "on_primary": best_color.get("On Primary", ""),
                "secondary": best_color.get("Secondary", "#3B82F6"),
                "accent": best_color.get("Accent", "#F97316"),
                "background": best_color.get("Background", "#F8FAFC"),
                "foreground": best_color.get("Foreground", "#1E293B"),
                "muted": best_color.get("Muted", ""),
                "muted_foreground": best_color.get("Muted Foreground", ""),
                "border": best_color.get("Border", ""),
                "destructive": best_color.get("Destructive", ""),
                "ring": best_color.get("Ring", ""),
                "notes": best_color.get("Notes", ""),
                # Keep legacy keys for backward compat in MASTER.md
                "cta": best_color.get("Accent", "#F97316"),
                "text": best_color.get("Foreground", "#1E293B"),
            },
            "typography": {
                "heading": best_typography.get("Heading Font", "Inter"),
                "body": best_typography.get("Body Font", "Inter"),
                "mood": best_typography.get(
                    "Mood/Style Keywords", reasoning.get("typography_mood", "")
                ),
                "best_for": best_typography.get("Best For", ""),
                "google_fonts_url": best_typography.get("Google Fonts URL", ""),
                "css_import": best_typography.get("CSS Import", ""),
            },
            "key_effects": combined_effects,
            "motion": {
                "name": best_motion.get("Motion Name", "Standard Scroll Reveal"),
                "keywords": best_motion.get("Keywords", ""),
                "style_mood": best_motion.get("Style Mood", ""),
                "techniques": best_motion.get("Core Techniques", ""),
                "libraries": best_motion.get("Libraries", ""),
                "tokens": best_motion.get("Tokens", ""),
                "intensity": best_motion.get("Intensity", "1 (CSS tier - default)"),
                "best_for": best_motion.get("Best For", ""),
                "reduced_motion": best_motion.get("Reduced-Motion Treatment", ""),
                "accessibility": best_motion.get("Accessibility Notes", ""),
            },
            "anti_patterns": reasoning.get("anti_patterns", ""),
            "decision_rules": reasoning.get("decision_rules", {}),
            "severity": reasoning.get("severity", "MEDIUM"),
            "_warnings": warnings,
        }
        return result


# ============ OUTPUT FORMATTERS ============
BOX_WIDTH = 90  # Wider box for more content


def hex_to_ansi(hex_color: str) -> str:
    """Convert hex color to ANSI True Color swatch (██) with fallback."""
    if not hex_color or not hex_color.startswith("#"):
        return ""
    colorterm = os.environ.get("COLORTERM", "")
    if colorterm not in ("truecolor", "24bit"):
        return ""
    hex_color = hex_color.lstrip("#")
    if len(hex_color) != 6:
        return ""
    r, g, b = int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16)
    return f"\033[38;2;{r};{g};{b}m██\033[0m "


def ansi_ljust(s: str, width: int) -> str:
    """Like str.ljust but accounts for zero-width ANSI escape sequences."""
    import re

    visible_len = len(re.sub(r"\033\[[0-9;]*m", "", s))
    pad = width - visible_len
    return s + (" " * max(0, pad))


def section_header(name: str, width: int) -> str:
    """Create a Unicode section separator: ├─── NAME ───...┤

    Total line width = width (matches the box borders, which are BOX_WIDTH + 1
    wide: border char + BOX_WIDTH - 1 fill + border char).
    """
    label = f"─── {name} "
    fill = "─" * (width - len(label) - 2)
    return f"├{label}{fill}┤"


def format_ascii_box(design_system: dict) -> str:
    """Format design system as Unicode box with ANSI color swatches."""
    project = design_system.get("project_name", "PROJECT")
    pattern = design_system.get("pattern", {})
    style = design_system.get("style", {})
    colors = design_system.get("colors", {})
    typography = design_system.get("typography", {})
    effects = design_system.get("key_effects", "")
    anti_patterns = design_system.get("anti_patterns", "")

    def wrap_text(text: str, prefix: str, width: int) -> list:
        """Wrap long text into multiple lines."""
        if not text:
            return []
        words = text.split()
        lines = []
        current_line = prefix
        for word in words:
            if len(current_line) + len(word) + 1 <= width - 2:
                current_line += (" " if current_line != prefix else "") + word
            else:
                if current_line != prefix:
                    lines.append(current_line)
                current_line = prefix + word
        if current_line != prefix:
            lines.append(current_line)
        return lines

    # Build sections from pattern. Data may use ">" or "," separators and may
    # already carry "1. " numbering — strip it to avoid "1. 1. Hero" output.
    sections = re.split(r"[>,]", pattern.get("sections", ""))
    sections = [re.sub(r"^\s*\d+\.\s*", "", s).strip() for s in sections if s.strip()]

    # Build output lines
    lines = []
    w = BOX_WIDTH - 1

    # Header with double-line box
    lines.append("╔" + "═" * w + "╗")
    lines.append(
        ansi_ljust(f"║  TARGET: {project} - RECOMMENDED DESIGN SYSTEM", BOX_WIDTH) + "║"
    )
    lines.append("╚" + "═" * w + "╝")
    lines.append("┌" + "─" * w + "┐")

    # Pattern section
    lines.append(section_header("PATTERN", BOX_WIDTH + 1))
    lines.append(f"│  Name: {pattern.get('name', '')}".ljust(BOX_WIDTH) + "│")
    if pattern.get("conversion"):
        for line in wrap_text(
            f"Conversion: {pattern.get('conversion', '')}", "│     ", BOX_WIDTH
        ):
            lines.append(line.ljust(BOX_WIDTH) + "│")
    if pattern.get("cta_placement"):
        for line in wrap_text(
            f"CTA: {pattern.get('cta_placement', '')}", "│     ", BOX_WIDTH
        ):
            lines.append(line.ljust(BOX_WIDTH) + "│")
    if pattern.get("color_strategy"):
        for line in wrap_text(
            f"Color Strategy: {pattern.get('color_strategy', '')}", "│     ", BOX_WIDTH
        ):
            lines.append(line.ljust(BOX_WIDTH) + "│")
    lines.append("│     Sections:".ljust(BOX_WIDTH) + "│")
    for section in sections:
        for line in wrap_text(section, "│       ", BOX_WIDTH):
            lines.append(line.ljust(BOX_WIDTH) + "│")

    # Style section
    lines.append(section_header("STYLE", BOX_WIDTH + 1))
    lines.append(f"│  Name: {style.get('name', '')}".ljust(BOX_WIDTH) + "│")
    light = style.get("light_mode", "")
    dark = style.get("dark_mode", "")
    if light or dark:
        lines.append(
            f"│     Mode Support: Light {light}  Dark {dark}".ljust(BOX_WIDTH) + "│"
        )
    if style.get("keywords"):
        for line in wrap_text(
            f"Keywords: {style.get('keywords', '')}", "│     ", BOX_WIDTH
        ):
            lines.append(line.ljust(BOX_WIDTH) + "│")
    if style.get("best_for"):
        for line in wrap_text(
            f"Best For: {style.get('best_for', '')}", "│     ", BOX_WIDTH
        ):
            lines.append(line.ljust(BOX_WIDTH) + "│")
    if style.get("performance") or style.get("accessibility"):
        perf_a11y = f"Performance: {style.get('performance', '')} | Accessibility: {style.get('accessibility', '')}"
        for line in wrap_text(perf_a11y, "│     ", BOX_WIDTH):
            lines.append(line.ljust(BOX_WIDTH) + "│")

    # Colors section (extended palette with ANSI swatches)
    lines.append(section_header("COLORS", BOX_WIDTH + 1))
    color_entries = [
        ("Primary", "primary", "--color-primary"),
        ("On Primary", "on_primary", "--color-on-primary"),
        ("Secondary", "secondary", "--color-secondary"),
        ("Accent/CTA", "accent", "--color-accent"),
        ("Background", "background", "--color-background"),
        ("Foreground", "foreground", "--color-foreground"),
        ("Muted", "muted", "--color-muted"),
        ("Border", "border", "--color-border"),
        ("Destructive", "destructive", "--color-destructive"),
        ("Ring", "ring", "--color-ring"),
    ]
    for label, key, css_var in color_entries:
        hex_val = colors.get(key, "")
        if not hex_val:
            continue
        swatch = hex_to_ansi(hex_val)
        content = f"│     {swatch}{label + ':':14s} {hex_val:10s} ({css_var})"
        lines.append(ansi_ljust(content, BOX_WIDTH) + "│")
    if colors.get("notes"):
        for line in wrap_text(f"Notes: {colors.get('notes', '')}", "│     ", BOX_WIDTH):
            lines.append(line.ljust(BOX_WIDTH) + "│")

    # Typography section
    lines.append(section_header("TYPOGRAPHY", BOX_WIDTH + 1))
    lines.append(
        f"│  {typography.get('heading', '')} / {typography.get('body', '')}".ljust(
            BOX_WIDTH
        )
        + "│"
    )
    if typography.get("mood"):
        for line in wrap_text(
            f"Mood: {typography.get('mood', '')}", "│     ", BOX_WIDTH
        ):
            lines.append(line.ljust(BOX_WIDTH) + "│")
    if typography.get("best_for"):
        for line in wrap_text(
            f"Best For: {typography.get('best_for', '')}", "│     ", BOX_WIDTH
        ):
            lines.append(line.ljust(BOX_WIDTH) + "│")
    if typography.get("google_fonts_url"):
        url = typography.get("google_fonts_url", "")
        if len(url) > 66:
            url = url[:66] + "..."
        lines.append(f"│     Google Fonts: {url}".ljust(BOX_WIDTH) + "│")
    if typography.get("css_import"):
        css = typography.get("css_import", "")
        if len(css) > 69:
            css = css[:69] + "..."
        lines.append(f"│     CSS Import: {css}".ljust(BOX_WIDTH) + "│")

    # Design Tokens section (foundational values)
    lines.append(section_header("DESIGN TOKENS", BOX_WIDTH + 1))
    lines.append(
        "│     Radius: sm 4px | md 8px | lg 16px | full 9999px".ljust(BOX_WIDTH) + "│"
    )
    lines.append(
        "│     Breakpoints: sm 640 | md 768 | lg 1024 | xl 1440".ljust(BOX_WIDTH) + "│"
    )
    lines.append(
        "│     Motion: 150/250/400ms | ease-premium cubic-bezier(0.16,1,0.3,1)".ljust(
            BOX_WIDTH
        )
        + "│"
    )
    lines.append(
        "│     Focus: visible ring 2px offset - never outline:none".ljust(BOX_WIDTH)
        + "│"
    )
    lines.append(
        "│     Animate transform+opacity only - never width/height/top/left".ljust(
            BOX_WIDTH
        )
        + "│"
    )
    lines.append(
        "│     Icons: SVG set (Heroicons/Lucide) - no emojis".ljust(BOX_WIDTH) + "│"
    )

    # Key Effects section
    if effects:
        lines.append(section_header("KEY EFFECTS", BOX_WIDTH + 1))
        for line in wrap_text(effects, "│     ", BOX_WIDTH):
            lines.append(line.ljust(BOX_WIDTH) + "│")

    # Motion Direction section (style-matched, from data/motion.csv)
    motion = design_system.get("motion", {})
    if motion.get("name"):
        lines.append(section_header("MOTION DIRECTION", BOX_WIDTH + 1))
        motion_lines = [f"Direction: {motion.get('name', '')}"]
        if motion.get("libraries"):
            motion_lines.append(f"Libraries: {motion.get('libraries', '')}")
        if motion.get("techniques"):
            motion_lines.append(f"Techniques: {motion.get('techniques', '')}")
        if motion.get("reduced_motion"):
            motion_lines.append(f"Reduced Motion: {motion.get('reduced_motion', '')}")
        for line in motion_lines:
            for wrapped in wrap_text(line, "│     ", BOX_WIDTH):
                lines.append(wrapped.ljust(BOX_WIDTH) + "│")

    # Anti-patterns section
    if anti_patterns:
        lines.append(section_header("AVOID", BOX_WIDTH + 1))
        for line in wrap_text(anti_patterns, "│     ", BOX_WIDTH):
            lines.append(line.ljust(BOX_WIDTH) + "│")

    # Warnings section (shown when fallbacks were used)
    warnings = design_system.get("_warnings", [])
    if warnings:
        lines.append(section_header("⚠ WARNINGS", BOX_WIDTH + 1))
        for w in warnings:
            for line in wrap_text(w, "│     ", BOX_WIDTH):
                lines.append(line.ljust(BOX_WIDTH) + "│")

    # Pre-Delivery Checklist section
    lines.append(section_header("PRE-DELIVERY CHECKLIST", BOX_WIDTH + 1))
    checklist_items = [
        "[ ] No emojis as icons (use SVG: Heroicons/Lucide)",
        "[ ] cursor-pointer on all clickable elements",
        "[ ] Hover states with smooth transitions (150-300ms)",
        "[ ] Light mode: text contrast 4.5:1 minimum",
        "[ ] Focus states visible for keyboard nav",
        "[ ] prefers-reduced-motion respected",
        "[ ] Responsive: 375px, 768px, 1024px, 1440px",
    ]
    for item in checklist_items:
        lines.append(f"│     {item}".ljust(BOX_WIDTH) + "│")

    lines.append("└" + "─" * (BOX_WIDTH - 1) + "┘")

    return "\n".join(lines)


def format_markdown(design_system: dict) -> str:
    """Format design system as markdown."""
    project = design_system.get("project_name", "PROJECT")
    pattern = design_system.get("pattern", {})
    style = design_system.get("style", {})
    colors = design_system.get("colors", {})
    typography = design_system.get("typography", {})
    effects = design_system.get("key_effects", "")
    anti_patterns = design_system.get("anti_patterns", "")

    lines = []
    lines.append(f"## Design System: {project}")
    lines.append("")

    # Pattern section
    lines.append("### Pattern")
    lines.append(f"- **Name:** {pattern.get('name', '')}")
    if pattern.get("conversion"):
        lines.append(f"- **Conversion Focus:** {pattern.get('conversion', '')}")
    if pattern.get("cta_placement"):
        lines.append(f"- **CTA Placement:** {pattern.get('cta_placement', '')}")
    if pattern.get("color_strategy"):
        lines.append(f"- **Color Strategy:** {pattern.get('color_strategy', '')}")
    lines.append(f"- **Sections:** {pattern.get('sections', '')}")
    lines.append("")

    # Style section
    lines.append("### Style")
    lines.append(f"- **Name:** {style.get('name', '')}")
    light = style.get("light_mode", "")
    dark = style.get("dark_mode", "")
    if light or dark:
        lines.append(f"- **Mode Support:** Light {light} | Dark {dark}")
    if style.get("keywords"):
        lines.append(f"- **Keywords:** {style.get('keywords', '')}")
    if style.get("best_for"):
        lines.append(f"- **Best For:** {style.get('best_for', '')}")
    if style.get("performance") or style.get("accessibility"):
        lines.append(
            f"- **Performance:** {style.get('performance', '')} | **Accessibility:** {style.get('accessibility', '')}"
        )
    lines.append("")

    # Colors section (extended palette)
    lines.append("### Colors")
    lines.append("| Role | Hex | CSS Variable |")
    lines.append("|------|-----|--------------|")
    md_color_entries = [
        ("Primary", "primary", "--color-primary"),
        ("On Primary", "on_primary", "--color-on-primary"),
        ("Secondary", "secondary", "--color-secondary"),
        ("Accent/CTA", "accent", "--color-accent"),
        ("Background", "background", "--color-background"),
        ("Foreground", "foreground", "--color-foreground"),
        ("Muted", "muted", "--color-muted"),
        ("Border", "border", "--color-border"),
        ("Destructive", "destructive", "--color-destructive"),
        ("Ring", "ring", "--color-ring"),
    ]
    for label, key, css_var in md_color_entries:
        hex_val = colors.get(key, "")
        if hex_val:
            lines.append(f"| {label} | `{hex_val}` | `{css_var}` |")
    if colors.get("notes"):
        lines.append(f"\n*Notes: {colors.get('notes', '')}*")
    lines.append("")

    # Typography section
    lines.append("### Typography")
    lines.append(f"- **Heading:** {typography.get('heading', '')}")
    lines.append(f"- **Body:** {typography.get('body', '')}")
    if typography.get("mood"):
        lines.append(f"- **Mood:** {typography.get('mood', '')}")
    if typography.get("best_for"):
        lines.append(f"- **Best For:** {typography.get('best_for', '')}")
    if typography.get("google_fonts_url"):
        lines.append(f"- **Google Fonts:** {typography.get('google_fonts_url', '')}")
    if typography.get("css_import"):
        lines.append(f"- **CSS Import:**")
        lines.append(f"```css")
        lines.append(f"{typography.get('css_import', '')}")
        lines.append(f"```")
    lines.append("")

    # Design tokens sections
    lines.append("### Radius & Borders")
    lines.append("| Token | Value | Usage |")
    lines.append("|-------|-------|-------|")
    lines.append("| `--radius-sm` | `4px` | inputs, tags |")
    lines.append("| `--radius-md` | `8px` | cards, buttons |")
    lines.append("| `--radius-lg` | `16px` | modals, panels |")
    lines.append("| `--radius-full` | `9999px` | pills, avatars |")
    lines.append("")
    lines.append("### Breakpoints & Containers")
    lines.append("| Breakpoint | Min Width | Typical |")
    lines.append("|------------|-----------|---------|")
    lines.append("| `sm` | `640px` | mobile landscape |")
    lines.append("| `md` | `768px` | tablet |")
    lines.append("| `lg` | `1024px` | desktop |")
    lines.append("| `xl` | `1440px` | wide desktop |")
    lines.append(
        "- **Container:** `--container-max: 1200px`; body measure `--content-max: 65ch`"
    )
    lines.append("")
    lines.append("### Motion & Transitions")
    lines.append(
        "- **Durations:** `--duration-fast: 150ms`, `--duration-normal: 250ms`, `--duration-slow: 400ms`"
    )
    lines.append(
        "- **Easing:** `--ease-premium: cubic-bezier(0.16, 1, 0.3, 1)` (fast start, gentle land)"
    )
    lines.append(
        "- **Rule:** animate `transform` + `opacity` only — never `width/height/top/left/margin` (layout shift)"
    )
    lines.append("- Respect `prefers-reduced-motion`")
    motion = design_system.get("motion", {})
    if motion.get("name"):
        lines.append(
            f"- **Direction:** {motion.get('name', '')} — intensity {motion.get('intensity', '')}"
        )
        if motion.get("libraries"):
            lines.append(f"- **Libraries:** {motion.get('libraries', '')}")
        if motion.get("techniques"):
            lines.append(f"- **Techniques:** {motion.get('techniques', '')}")
        if motion.get("reduced_motion"):
            lines.append(f"- **Reduced motion:** {motion.get('reduced_motion', '')}")
    lines.append("")
    lines.append("### Focus & Accessibility")
    lines.append(
        "- Focus ring always visible: `--focus-ring: 0 0 0 2px bg, 0 0 0 4px primary`"
    )
    lines.append("- **Never** `outline: none` without a replacement visible indicator")
    lines.append(
        "- Text contrast `4.5:1` minimum (light mode), `7:1` preferred for body"
    )
    lines.append("")
    lines.append("### Icons")
    lines.append("- One SVG set only (Heroicons or Lucide) — **no emojis as icons**")
    lines.append("- Stroke width consistent (1.5-2px); sizes 16/20/24px")
    lines.append("")
    lines.append("### Dark Mode")
    lines.append(
        '- Override via `@media (prefers-color-scheme: dark)` and `[data-theme="dark"]` (separate selectors)'
    )
    lines.append(
        "- Adjust `bg`, `surface`, `text`, `text-muted`, `border`, and primary for dark contrast"
    )
    lines.append("")

    # Key Effects section
    if effects:
        lines.append("### Key Effects")
        lines.append(f"{effects}")
        lines.append("")

    # Anti-patterns section
    if anti_patterns:
        lines.append("### Avoid (Anti-patterns)")
        newline_bullet = "\n- "
        lines.append(f"- {anti_patterns.replace(' + ', newline_bullet)}")
        lines.append("")

    # Warnings section
    warnings = design_system.get("_warnings", [])
    if warnings:
        lines.append("### ⚠ Warnings")
        for w in warnings:
            lines.append(f"- {w}")
        lines.append("")

    # Pre-Delivery Checklist section
    lines.append("### Pre-Delivery Checklist")
    lines.append("- [ ] No emojis as icons (use SVG: Heroicons/Lucide)")
    lines.append("- [ ] cursor-pointer on all clickable elements")
    lines.append("- [ ] Hover states with smooth transitions (150-300ms)")
    lines.append("- [ ] Light mode: text contrast 4.5:1 minimum")
    lines.append("- [ ] Focus states visible for keyboard nav")
    lines.append("- [ ] prefers-reduced-motion respected")
    lines.append("- [ ] Responsive: 375px, 768px, 1024px, 1440px")
    lines.append("")

    return "\n".join(lines)


# ============ MAIN ENTRY POINT ============
def generate_design_system(
    query: str,
    project_name: str = None,
    output_format: str = "ascii",
    persist: bool = False,
    page: str = None,
    output_dir: str = None,
) -> str:
    """
    Main entry point for design system generation.

    Args:
        query: Search query (e.g., "SaaS dashboard", "e-commerce luxury")
        project_name: Optional project name for output header
        output_format: "ascii" (default) or "markdown"
        persist: If True, save design system to design-system/ folder
        page: Optional page name for page-specific override file
        output_dir: Optional output directory (defaults to current working directory)

    Returns:
        Formatted design system string
    """
    generator = DesignSystemGenerator()
    design_system = generator.generate(query, project_name)

    # Persist to files if requested
    if persist:
        persist_design_system(design_system, page, output_dir, query)

    if output_format == "markdown":
        return format_markdown(design_system)
    return format_ascii_box(design_system)


# ============ PERSISTENCE FUNCTIONS ============
def _legacy_tokens(design_system: dict) -> dict:
    """Standalone token builder (no quality_gate import) — keeps persist working
    even when quality_gate.py isn't on the path."""
    colors = design_system.get("colors") or {}
    typography = design_system.get("typography") or {}
    return {
        "schema_version": 2,
        "project": design_system.get("project_name", ""),
        "category": design_system.get("category", ""),
        "colors": {
            "primary": colors.get("primary", ""),
            "on_primary": colors.get("on_primary", ""),
            "secondary": colors.get("secondary", ""),
            "accent": colors.get("accent", ""),
            "background": colors.get("background", ""),
            "card": colors.get("background", ""),
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


def persist_design_system(
    design_system: dict,
    page: str = None,
    output_dir: str = None,
    page_query: str = None,
) -> dict:
    """
    Persist design system to design-system/<project>/ folder using Master + Overrides pattern.

    Args:
        design_system: The generated design system dictionary
        page: Optional page name for page-specific override file
        output_dir: Optional output directory (defaults to current working directory)
        page_query: Optional query string for intelligent page override generation

    Returns:
        dict with created file paths and status
    """
    base_dir = Path(output_dir) if output_dir else Path.cwd()

    # Use project name for project-specific folder
    project_name = design_system.get("project_name", "default")
    project_slug = project_name.lower().replace(" ", "-")

    design_system_dir = base_dir / "design-system" / project_slug
    pages_dir = design_system_dir / "pages"

    created_files = []

    # Create directories
    design_system_dir.mkdir(parents=True, exist_ok=True)
    pages_dir.mkdir(parents=True, exist_ok=True)

    master_file = design_system_dir / "MASTER.md"

    # Generate and write MASTER.md
    master_content = format_master_md(design_system)
    with open(master_file, "w", encoding="utf-8") as f:
        f.write(master_content)
    created_files.append(str(master_file))

    # Emit machine-checkable tokens.json for the deterministic quality gate.
    tokens_file = design_system_dir / "tokens.json"
    try:
        from quality_gate import tokens_from_design_system

        tokens_content = tokens_from_design_system(design_system)
    except ImportError:
        tokens_content = _legacy_tokens(design_system)
    with open(tokens_file, "w", encoding="utf-8") as f:
        json.dump(tokens_content, f, indent=2, ensure_ascii=False)
    created_files.append(str(tokens_file))

    # If page is specified, create page override file with intelligent content
    if page:
        page_file = pages_dir / f"{page.lower().replace(' ', '-')}.md"
        page_content = format_page_override_md(design_system, page, page_query)
        with open(page_file, "w", encoding="utf-8") as f:
            f.write(page_content)
        created_files.append(str(page_file))

    return {
        "status": "success",
        "design_system_dir": str(design_system_dir),
        "created_files": created_files,
    }


def format_master_md(design_system: dict) -> str:
    """Format design system as MASTER.md with hierarchical override logic."""
    project = design_system.get("project_name", "PROJECT")
    pattern = design_system.get("pattern", {})
    style = design_system.get("style", {})
    colors = design_system.get("colors", {})
    typography = design_system.get("typography", {})
    effects = design_system.get("key_effects", "")
    anti_patterns = design_system.get("anti_patterns", "")

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    lines = []

    # Logic header
    lines.append("# Design System Master File")
    lines.append("")
    lines.append(
        "> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`."
    )
    lines.append("> If that file exists, its rules **override** this Master file.")
    lines.append("> If not, strictly follow the rules below.")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append(f"**Project:** {project}")
    lines.append(f"**Generated:** {timestamp}")
    lines.append(f"**Category:** {design_system.get('category', 'General')}")
    lines.append("")
    lines.append("---")
    lines.append("")

    # Global Rules section
    lines.append("## Global Rules")
    lines.append("")

    # Color Palette
    lines.append("### Color Palette")
    lines.append("")
    lines.append("| Role | Hex | CSS Variable |")
    lines.append("|------|-----|--------------|")
    master_color_entries = [
        ("Primary", "primary", "--color-primary"),
        ("On Primary", "on_primary", "--color-on-primary"),
        ("Secondary", "secondary", "--color-secondary"),
        ("Accent/CTA", "accent", "--color-accent"),
        ("Background", "background", "--color-background"),
        ("Foreground", "foreground", "--color-foreground"),
        ("Muted", "muted", "--color-muted"),
        ("Border", "border", "--color-border"),
        ("Destructive", "destructive", "--color-destructive"),
        ("Ring", "ring", "--color-ring"),
    ]
    for label, key, css_var in master_color_entries:
        hex_val = colors.get(key, "")
        if hex_val:
            lines.append(f"| {label} | `{hex_val}` | `{css_var}` |")
    lines.append("")
    if colors.get("notes"):
        lines.append(f"**Color Notes:** {colors.get('notes', '')}")
        lines.append("")

    # Typography
    lines.append("### Typography")
    lines.append("")
    lines.append(f"- **Heading Font:** {typography.get('heading', 'Inter')}")
    lines.append(f"- **Body Font:** {typography.get('body', 'Inter')}")
    if typography.get("mood"):
        lines.append(f"- **Mood:** {typography.get('mood', '')}")
    if typography.get("google_fonts_url"):
        lines.append(
            f"- **Google Fonts:** [{typography.get('heading', '')} + {typography.get('body', '')}]({typography.get('google_fonts_url', '')})"
        )
    lines.append("")
    if typography.get("css_import"):
        lines.append("**CSS Import:**")
        lines.append("```css")
        lines.append(typography.get("css_import", ""))
        lines.append("```")
        lines.append("")

    # Spacing Variables
    lines.append("### Spacing Variables")
    lines.append("")
    lines.append("| Token | Value | Usage |")
    lines.append("|-------|-------|-------|")
    lines.append("| `--space-xs` | `4px` / `0.25rem` | Tight gaps |")
    lines.append("| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |")
    lines.append("| `--space-md` | `16px` / `1rem` | Standard padding |")
    lines.append("| `--space-lg` | `24px` / `1.5rem` | Section padding |")
    lines.append("| `--space-xl` | `32px` / `2rem` | Large gaps |")
    lines.append("| `--space-2xl` | `48px` / `3rem` | Section margins |")
    lines.append("| `--space-3xl` | `64px` / `4rem` | Hero padding |")
    lines.append("")

    # Shadow Depths
    lines.append("### Shadow Depths")
    lines.append("")
    lines.append("| Level | Value | Usage |")
    lines.append("|-------|-------|-------|")
    lines.append("| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |")
    lines.append("| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |")
    lines.append(
        "| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |"
    )
    lines.append(
        "| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |"
    )
    lines.append("")

    # Border Radius
    lines.append("### Border Radius")
    lines.append("")
    lines.append("| Token | Value | Usage |")
    lines.append("|-------|-------|-------|")
    lines.append("| `--radius-sm` | `4px` / `0.25rem` | Inputs, tags |")
    lines.append("| `--radius-md` | `8px` / `0.5rem` | Cards, buttons |")
    lines.append("| `--radius-lg` | `16px` / `1rem` | Modals, panels |")
    lines.append("| `--radius-xl` | `24px` / `1.5rem` | Hero sections |")
    lines.append("| `--radius-full` | `9999px` | Pills, avatars |")
    lines.append("")

    # Breakpoints & Containers
    lines.append("### Breakpoints & Containers")
    lines.append("")
    lines.append("| Breakpoint | Min Width | Typical |")
    lines.append("|------------|-----------|---------|")
    lines.append("| `sm` | `640px` | Mobile landscape |")
    lines.append("| `md` | `768px` | Tablet |")
    lines.append("| `lg` | `1024px` | Desktop |")
    lines.append("| `xl` | `1440px` | Wide desktop |")
    lines.append("")
    lines.append("- **Container:** `--container-max: 1200px` (page/section)")
    lines.append("- **Content measure:** `--content-max: 65ch` (readability)")
    lines.append(
        "- **Section rhythm:** `--space-section: 96px` (major gaps), `24px` (internal)"
    )
    lines.append("")

    # Motion & Transitions
    lines.append("### Motion & Transitions")
    lines.append("")
    motion = design_system.get("motion", {})
    if motion.get("name"):
        lines.append(
            f"**Direction:** {motion.get('name', '')} — intensity {motion.get('intensity', '')}"
        )
        if motion.get("libraries"):
            lines.append(f"**Libraries:** {motion.get('libraries', '')}")
        if motion.get("techniques"):
            lines.append(f"**Techniques:** {motion.get('techniques', '')}")
        if motion.get("reduced_motion"):
            lines.append(f"**Reduced motion:** {motion.get('reduced_motion', '')}")
        lines.append("")
    lines.append("| Token | Value | Usage |")
    lines.append("|-------|-------|-------|")
    lines.append("| `--duration-fast` | `150ms` | Hover, press, small state changes |")
    lines.append("| `--duration-normal` | `250ms` | Panel, dropdown, color changes |")
    lines.append("| `--duration-slow` | `400ms` | Large reveals, modals |")
    lines.append(
        "| `--ease-premium` | `cubic-bezier(0.16, 1, 0.3, 1)` | Luxury feel — fast start, gentle land |"
    )
    lines.append(
        "| `--ease-smooth` | `cubic-bezier(0.33, 1, 0.68, 1)` | Smooth deceleration |"
    )
    lines.append("| `--stagger-delay` | `40ms` | Sibling animation delay |")
    lines.append("")
    lines.append("**Motion rules:**")
    lines.append(
        "- Animate **`transform` + `opacity`** only — never `width/height/top/left/margin` (causes layout shift)"
    )
    lines.append("- Scroll-reveal rise distance: `--translate-reveal: 24px`")
    lines.append("- Respect `prefers-reduced-motion` (disable non-essential motion)")
    lines.append("")

    # Focus States
    lines.append("### Focus States")
    lines.append("")
    lines.append("```css")
    lines.append(":focus-visible {")
    lines.append(
        f"  box-shadow: 0 0 0 2px {colors.get('background', '#FFFFFF')}, 0 0 0 4px {colors.get('primary', '#2563EB')};"
    )
    lines.append("}")
    lines.append("```")
    lines.append("")
    lines.append(
        "- Focus ring **always visible** — never `outline: none` without a replacement indicator"
    )
    lines.append(
        "- Use `:focus-visible` (keyboard only); keep mouse clicks ring-free where appropriate"
    )
    lines.append("")

    # Z-Index Scale
    lines.append("### Z-Index Scale")
    lines.append("")
    lines.append("| Token | Value | Layer |")
    lines.append("|-------|-------|-------|")
    lines.append("| `--z-base` | `0` | Content |")
    lines.append("| `--z-dropdown` | `10` | Dropdowns |")
    lines.append("| `--z-sticky` | `20` | Sticky headers |")
    lines.append("| `--z-modal` | `30` | Modals, dialogs |")
    lines.append("| `--z-toast` | `40` | Toasts, notifications |")
    lines.append("| `--z-tooltip` | `50` | Tooltips |")
    lines.append("")

    # Icons & Imagery
    lines.append("### Icons & Imagery")
    lines.append("")
    lines.append(
        "- **One SVG icon set only** (Heroicons or Lucide) — consistency over variety"
    )
    lines.append(
        "- **No emojis as icons.** Emojis are content, not UI. Use SVG for all icons."
    )
    lines.append("- Stroke width consistent (`1.5-2px`); sizes `16/20/24px`")
    lines.append(
        "- Imagery: real product/screenshot photography preferred over stock + gradient overlay"
    )
    lines.append("")

    # Semantic Aliases
    lines.append("### Semantic Aliases")
    lines.append("")
    lines.append("| Token | Maps To | Usage |")
    lines.append("|-------|---------|-------|")
    lines.append("| `--color-link` | `var(--color-primary)` | Links |")
    lines.append("| `--color-success-bg` | `success @ 15%` | Success surfaces |")
    lines.append("| `--color-error-bg` | `destructive @ 15%` | Error surfaces |")
    lines.append("| `--space-section` | `96px` | Section vertical gap |")
    lines.append("| `--space-card` | `24px` | Inner card padding |")
    lines.append("")

    # Dark Mode
    lines.append("### Dark Mode")
    lines.append("")
    lines.append(
        '- Override tokens via `@media (prefers-color-scheme: dark)` **and** `[data-theme="dark"]` — separate selectors, they cannot be combined.'
    )
    lines.append(
        "- Adjust `bg`, `surface`, `text`, `text-muted`, `border`; shift primary/accent only for contrast."
    )
    lines.append("- Set `color-scheme: dark` so native form controls match.")
    lines.append("")
    lines.append(
        "**Full token template:** `references/design-tokens.md` (CSS vars, Tailwind config, JS/TS object)."
    )

    # Component Specs section
    lines.append("---")
    lines.append("")
    lines.append("## Component Specs")
    lines.append("")

    # Buttons
    lines.append("### Buttons")
    lines.append("")
    lines.append("```css")
    lines.append("/* Primary Button */")
    lines.append(".btn-primary {")
    lines.append(f"  background: {colors.get('cta', '#F97316')};")
    lines.append("  color: white;")
    lines.append("  padding: 12px 24px;")
    lines.append("  border-radius: 8px;")
    lines.append("  font-weight: 600;")
    lines.append("  transition: opacity 200ms ease, transform 200ms ease;")
    lines.append("  cursor: pointer;")
    lines.append("}")
    lines.append("")
    lines.append(".btn-primary:hover {")
    lines.append("  opacity: 0.9;")
    lines.append("  transform: translateY(-1px);")
    lines.append("}")
    lines.append("")
    lines.append("/* Secondary Button */")
    lines.append(".btn-secondary {")
    lines.append(f"  background: transparent;")
    lines.append(f"  color: {colors.get('primary', '#2563EB')};")
    lines.append(f"  border: 2px solid {colors.get('primary', '#2563EB')};")
    lines.append("  padding: 12px 24px;")
    lines.append("  border-radius: 8px;")
    lines.append("  font-weight: 600;")
    lines.append("  transition: color 200ms ease, border-color 200ms ease;")
    lines.append("  cursor: pointer;")
    lines.append("}")
    lines.append("")
    lines.append("```")
    lines.append("")

    # Cards
    lines.append("### Cards")
    lines.append("")
    lines.append("```css")
    lines.append(".card {")
    lines.append(f"  background: {colors.get('background', '#FFFFFF')};")
    lines.append("  border-radius: 12px;")
    lines.append("  padding: 24px;")
    lines.append("  box-shadow: var(--shadow-md);")
    lines.append("  transition: box-shadow 200ms ease, transform 200ms ease;")
    lines.append("  cursor: pointer;")
    lines.append("}")
    lines.append("")
    lines.append(".card:hover {")
    lines.append("  box-shadow: var(--shadow-lg);")
    lines.append("  transform: translateY(-2px);")
    lines.append("}")
    lines.append("```")
    lines.append("")

    # Inputs
    lines.append("### Inputs")
    lines.append("")
    lines.append("```css")
    lines.append(".input {")
    lines.append("  padding: 12px 16px;")
    lines.append("  border: 1px solid #E2E8F0;")
    lines.append("  border-radius: 8px;")
    lines.append("  font-size: 16px;")
    lines.append("  transition: border-color 200ms ease;")
    lines.append("}")
    lines.append("")
    lines.append(".input:focus {")
    lines.append(f"  border-color: {colors.get('primary', '#2563EB')};")
    lines.append(f"  box-shadow: 0 0 0 3px {colors.get('primary', '#2563EB')}20;")
    lines.append("}")
    lines.append("```")
    lines.append("")

    # Modals
    lines.append("### Modals")
    lines.append("")
    lines.append("```css")
    lines.append(".modal-overlay {")
    lines.append("  background: rgba(0, 0, 0, 0.5);")
    lines.append("  backdrop-filter: blur(4px);")
    lines.append("}")
    lines.append("")
    lines.append(".modal {")
    lines.append("  background: white;")
    lines.append("  border-radius: 16px;")
    lines.append("  padding: 32px;")
    lines.append("  box-shadow: var(--shadow-xl);")
    lines.append("  max-width: 500px;")
    lines.append("  width: 90%;")
    lines.append("}")
    lines.append("```")
    lines.append("")

    # Forms
    lines.append("### Forms & Validation")
    lines.append("")
    lines.append("```css")
    lines.append("/* Label */")
    lines.append(".field-label {")
    lines.append("  font-size: 14px;")
    lines.append("  font-weight: 500;")
    lines.append("  margin-bottom: 6px;")
    lines.append("  display: block;")
    lines.append("}")
    lines.append("")
    lines.append("/* Error state */")
    lines.append(f".input-error {{")
    lines.append(f"  border-color: {colors.get('destructive', '#EF4444')} !important;")
    lines.append(f"  box-shadow: 0 0 0 3px {colors.get('destructive', '#EF4444')}20;")
    lines.append("}")
    lines.append(".field-error {")
    lines.append(f"  color: {colors.get('destructive', '#EF4444')};")
    lines.append("  font-size: 13px;")
    lines.append("  margin-top: 4px;")
    lines.append("}")
    lines.append("")
    lines.append("/* Success state */")
    lines.append(".input-success {")
    lines.append("  border-color: #22C55E;")
    lines.append("  box-shadow: 0 0 0 3px #22C55E20;")
    lines.append("}")
    lines.append("```")
    lines.append("")
    lines.append("- Every field needs: label, placeholder, error message, helper text")
    lines.append(
        "- Validation feedback within 1s of input; never block submit silently"
    )
    lines.append("")

    # Badges
    lines.append("### Badges & Tags")
    lines.append("")
    lines.append("```css")
    lines.append(".badge {")
    lines.append("  display: inline-flex;")
    lines.append("  align-items: center;")
    lines.append("  gap: 4px;")
    lines.append("  padding: 2px 10px;")
    lines.append("  border-radius: var(--radius-full);")
    lines.append("  font-size: 12px;")
    lines.append("  font-weight: 500;")
    lines.append("  line-height: 20px;")
    lines.append("}")
    lines.append(".badge--neutral { background: #F1F5F9; color: #475569; }")
    lines.append(".badge--info    { background: #DBEAFE; color: #1D4ED8; }")
    lines.append(".badge--success { background: #DCFCE7; color: #15803D; }")
    lines.append(".badge--warning { background: #FEF3C7; color: #B45309; }")
    lines.append(".badge--danger  { background: #FEE2E2; color: #B91C1C; }")
    lines.append("```")
    lines.append("")

    # Tables
    lines.append("### Tables")
    lines.append("")
    lines.append("```css")
    lines.append(".table { width: 100%; border-collapse: collapse; font-size: 14px; }")
    lines.append(".table th { text-align: left; font-weight: 600; padding: 10px 16px;")
    lines.append(
        "            color: #64748B; border-bottom: 1px solid var(--color-border); }"
    )
    lines.append(
        ".table td { padding: 12px 16px; border-bottom: 1px solid var(--color-border); }"
    )
    lines.append(".table tbody tr:hover { background: #F8FAFC; }")
    lines.append("```")
    lines.append("")
    lines.append(
        "- Numeric columns right-aligned; header row sticky within scroll containers"
    )
    lines.append("")

    # Tabs
    lines.append("### Tabs")
    lines.append("")
    lines.append("```css")
    lines.append(
        ".tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--color-border); }"
    )
    lines.append(
        ".tab { padding: 8px 16px; font-size: 14px; font-weight: 500; color: #64748B;"
    )
    lines.append("       border-bottom: 2px solid transparent; cursor: pointer; }")
    lines.append(f".tab--active {{ color: {colors.get('primary', '#2563EB')};")
    lines.append(
        f"            border-bottom-color: {colors.get('primary', '#2563EB')}; }}"
    )
    lines.append("```")
    lines.append("")

    # Avatars
    lines.append("### Avatars")
    lines.append("")
    lines.append("```css")
    lines.append(".avatar { border-radius: 50%; object-fit: cover; flex-shrink: 0; }")
    lines.append(".avatar--sm { width: 32px; height: 32px; }")
    lines.append(".avatar--md { width: 40px; height: 40px; }")
    lines.append(".avatar--lg { width: 56px; height: 56px; }")
    lines.append(
        "/* Initials fallback: same dimensions, bg = primary@15%, text = primary, font-weight 600 */"
    )
    lines.append("```")
    lines.append("")

    # Toasts
    lines.append("### Toasts & Notifications")
    lines.append("")
    lines.append("```css")
    lines.append(".toast {")
    lines.append("  display: flex; align-items: center; gap: 8px;")
    lines.append("  padding: 12px 16px; border-radius: var(--radius-md);")
    lines.append("  box-shadow: var(--shadow-lg);")
    lines.append("  font-size: 14px;")
    lines.append("  animation: toast-in 250ms var(--ease-premium);")
    lines.append("}")
    lines.append(
        "@keyframes toast-in { from { opacity: 0; transform: translateY(8px); }"
    )
    lines.append("                       to   { opacity: 1; transform: none; } }")
    lines.append("```")
    lines.append("")
    lines.append(
        "- Success / error / warning / info variants; auto-dismiss success after 3-5s"
    )
    lines.append("")

    # Style section
    lines.append("---")
    lines.append("")
    lines.append("## Style Guidelines")
    lines.append("")
    lines.append(f"**Style:** {style.get('name', 'Minimalism')}")
    lines.append("")
    if style.get("keywords"):
        lines.append(f"**Keywords:** {style.get('keywords', '')}")
        lines.append("")
    if style.get("best_for"):
        lines.append(f"**Best For:** {style.get('best_for', '')}")
        lines.append("")
    if effects:
        lines.append(f"**Key Effects:** {effects}")
        lines.append("")

    # Layout Pattern
    lines.append("### Page Pattern")
    lines.append("")
    lines.append(f"**Pattern Name:** {pattern.get('name', '')}")
    lines.append("")
    if pattern.get("conversion"):
        lines.append(f"- **Conversion Strategy:** {pattern.get('conversion', '')}")
    if pattern.get("cta_placement"):
        lines.append(f"- **CTA Placement:** {pattern.get('cta_placement', '')}")
    lines.append(f"- **Section Order:** {pattern.get('sections', '')}")
    lines.append("")

    # Anti-Patterns section
    lines.append("---")
    lines.append("")
    lines.append("## Anti-Patterns (Do NOT Use)")
    lines.append("")
    if anti_patterns:
        anti_list = [a.strip() for a in anti_patterns.split("+")]
        for anti in anti_list:
            if anti:
                lines.append(f"- ❌ {anti}")
    lines.append("")
    lines.append("### Additional Forbidden Patterns")
    lines.append("")
    lines.append(
        "- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)"
    )
    lines.append(
        "- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer"
    )
    lines.append(
        "- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout"
    )
    lines.append("- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio")
    lines.append("- ❌ **Instant state changes** — Always use transitions (150-300ms)")
    lines.append(
        "- ❌ **Invisible focus states** — Focus states must be visible for a11y"
    )
    lines.append("")

    # Warnings section
    warnings = design_system.get("_warnings", [])
    if warnings:
        lines.append("---")
        lines.append("")
        lines.append("## ⚠ Warnings")
        lines.append("")
        for w in warnings:
            lines.append(f"- {w}")
        lines.append("")

    # Pre-Delivery Checklist
    lines.append("---")
    lines.append("")
    lines.append("## Pre-Delivery Checklist")
    lines.append("")
    lines.append("Before delivering any UI code, verify:")
    lines.append("")
    lines.append("- [ ] No emojis used as icons (use SVG instead)")
    lines.append("- [ ] All icons from consistent icon set (Heroicons/Lucide)")
    lines.append("- [ ] `cursor-pointer` on all clickable elements")
    lines.append("- [ ] Hover states with smooth transitions (150-300ms)")
    lines.append("- [ ] Light mode: text contrast 4.5:1 minimum")
    lines.append("- [ ] Focus states visible for keyboard navigation")
    lines.append("- [ ] `prefers-reduced-motion` respected")
    lines.append("- [ ] Responsive: 375px, 768px, 1024px, 1440px")
    lines.append("- [ ] No content hidden behind fixed navbars")
    lines.append("- [ ] No horizontal scroll on mobile")
    lines.append("")

    return "\n".join(lines)


def format_page_override_md(
    design_system: dict, page_name: str, page_query: str = None
) -> str:
    """Format a page-specific override file with intelligent AI-generated content."""
    project = design_system.get("project_name", "PROJECT")
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    page_title = page_name.replace("-", " ").replace("_", " ").title()

    # Detect page type and generate intelligent overrides
    page_overrides = _generate_intelligent_overrides(
        page_name, page_query, design_system
    )

    lines = []

    lines.append(f"# {page_title} Page Overrides")
    lines.append("")
    lines.append(f"> **PROJECT:** {project}")
    lines.append(f"> **Generated:** {timestamp}")
    lines.append(f"> **Page Type:** {page_overrides.get('page_type', 'General')}")
    lines.append("")
    lines.append(
        "> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/MASTER.md`)."
    )
    lines.append(
        "> Only deviations from the Master are documented here. For all other rules, refer to the Master."
    )
    lines.append("")
    lines.append("---")
    lines.append("")

    # Page-specific rules with actual content
    lines.append("## Page-Specific Rules")
    lines.append("")

    # Layout Overrides
    lines.append("### Layout Overrides")
    lines.append("")
    layout = page_overrides.get("layout", {})
    if layout:
        for key, value in layout.items():
            lines.append(f"- **{key}:** {value}")
    else:
        lines.append("- No overrides — use Master layout")
    lines.append("")

    # Spacing Overrides
    lines.append("### Spacing Overrides")
    lines.append("")
    spacing = page_overrides.get("spacing", {})
    if spacing:
        for key, value in spacing.items():
            lines.append(f"- **{key}:** {value}")
    else:
        lines.append("- No overrides — use Master spacing")
    lines.append("")

    # Typography Overrides
    lines.append("### Typography Overrides")
    lines.append("")
    typography = page_overrides.get("typography", {})
    if typography:
        for key, value in typography.items():
            lines.append(f"- **{key}:** {value}")
    else:
        lines.append("- No overrides — use Master typography")
    lines.append("")

    # Color Overrides
    lines.append("### Color Overrides")
    lines.append("")
    colors = page_overrides.get("colors", {})
    if colors:
        for key, value in colors.items():
            lines.append(f"- **{key}:** {value}")
    else:
        lines.append("- No overrides — use Master colors")
    lines.append("")

    # Component Overrides
    lines.append("### Component Overrides")
    lines.append("")
    components = page_overrides.get("components", [])
    if components:
        for comp in components:
            lines.append(f"- {comp}")
    else:
        lines.append("- No overrides — use Master component specs")
    lines.append("")

    # Page-Specific Components
    lines.append("---")
    lines.append("")
    lines.append("## Page-Specific Components")
    lines.append("")
    unique_components = page_overrides.get("unique_components", [])
    if unique_components:
        for comp in unique_components:
            lines.append(f"- {comp}")
    else:
        lines.append("- No unique components for this page")
    lines.append("")

    # Recommendations
    lines.append("---")
    lines.append("")
    lines.append("## Recommendations")
    lines.append("")
    recommendations = page_overrides.get("recommendations", [])
    if recommendations:
        for rec in recommendations:
            lines.append(f"- {rec}")
    lines.append("")

    return "\n".join(lines)


def _generate_intelligent_overrides(
    page_name: str, page_query: str, design_system: dict
) -> dict:
    """
    Generate intelligent overrides based on page type using layered search.

    Uses the existing search infrastructure to find relevant style, UX, and layout
    data instead of hardcoded page types.
    """
    from core import search

    page_lower = page_name.lower()
    query_lower = (page_query or "").lower()
    combined_context = f"{page_lower} {query_lower}"

    # Search across multiple domains for page-specific guidance
    style_search = search(combined_context, "style", max_results=1)
    ux_search = search(combined_context, "ux", max_results=3)
    landing_search = search(combined_context, "landing", max_results=1)

    # Extract results from search response
    style_results = style_search.get("results", [])
    ux_results = ux_search.get("results", [])
    landing_results = landing_search.get("results", [])

    # Detect page type from search results or context
    page_type = _detect_page_type(combined_context, style_results)

    # Build overrides from search results
    layout = {}
    spacing = {}
    typography = {}
    colors = {}
    components = []
    unique_components = []
    recommendations = []

    # Extract style-based overrides
    if style_results:
        style = style_results[0]
        style_name = style.get("Style Category", "")
        keywords = style.get("Keywords", "")
        best_for = style.get("Best For", "")
        effects = style.get("Effects & Animation", "")

        # Infer layout from style keywords
        if any(kw in keywords.lower() for kw in ["data", "dense", "dashboard", "grid"]):
            layout["Max Width"] = "1400px or full-width"
            layout["Grid"] = "12-column grid for data flexibility"
            spacing["Content Density"] = "High — optimize for information display"
        elif any(
            kw in keywords.lower() for kw in ["minimal", "simple", "clean", "single"]
        ):
            layout["Max Width"] = "800px (narrow, focused)"
            layout["Layout"] = "Single column, centered"
            spacing["Content Density"] = "Low — focus on clarity"
        else:
            layout["Max Width"] = "1200px (standard)"
            layout["Layout"] = "Full-width sections, centered content"

        if effects:
            recommendations.append(f"Effects: {effects}")

    # Extract UX guidelines as recommendations
    for ux in ux_results:
        category = ux.get("Category", "")
        do_text = ux.get("Do", "")
        dont_text = ux.get("Don't", "")
        if do_text:
            recommendations.append(f"{category}: {do_text}")
        if dont_text:
            components.append(f"Avoid: {dont_text}")

    # Extract landing pattern info for section structure
    if landing_results:
        landing = landing_results[0]
        sections = landing.get("Section Order", "")
        cta_placement = landing.get("Primary CTA Placement", "")
        color_strategy = landing.get("Color Strategy", "")

        if sections:
            layout["Sections"] = sections
        if cta_placement:
            recommendations.append(f"CTA Placement: {cta_placement}")
        if color_strategy:
            colors["Strategy"] = color_strategy

    # Add page-type specific defaults if no search results
    if not layout:
        layout["Max Width"] = "1200px"
        layout["Layout"] = "Responsive grid"

    if not recommendations:
        recommendations = [
            "Refer to MASTER.md for all design rules",
            "Add specific overrides as needed for this page",
        ]

    return {
        "page_type": page_type,
        "layout": layout,
        "spacing": spacing,
        "typography": typography,
        "colors": colors,
        "components": components,
        "unique_components": unique_components,
        "recommendations": recommendations,
    }


def _detect_page_type(context: str, style_results: list) -> str:
    """Detect page type from context and search results."""
    context_lower = context.lower()

    # Check for common page type patterns
    page_patterns = [
        (
            [
                "dashboard",
                "admin",
                "analytics",
                "data",
                "metrics",
                "stats",
                "monitor",
                "overview",
            ],
            "Dashboard / Data View",
        ),
        (
            ["checkout", "payment", "cart", "purchase", "order", "billing"],
            "Checkout / Payment",
        ),
        (
            ["settings", "profile", "account", "preferences", "config"],
            "Settings / Profile",
        ),
        (
            ["landing", "marketing", "homepage", "hero", "home", "promo"],
            "Landing / Marketing",
        ),
        (
            ["login", "signin", "signup", "register", "auth", "password"],
            "Authentication",
        ),
        (["pricing", "plans", "subscription", "tiers", "packages"], "Pricing / Plans"),
        (["blog", "article", "post", "news", "content", "story"], "Blog / Article"),
        (["product", "item", "detail", "pdp", "shop", "store"], "Product Detail"),
        (
            ["search", "results", "browse", "filter", "catalog", "list"],
            "Search Results",
        ),
        (["empty", "404", "error", "not found", "zero"], "Empty State"),
    ]

    for keywords, page_type in page_patterns:
        if any(kw in context_lower for kw in keywords):
            return page_type

    # Fallback: try to infer from style results
    if style_results:
        style_name = style_results[0].get("Style Category", "").lower()
        best_for = style_results[0].get("Best For", "").lower()

        if "dashboard" in best_for or "data" in best_for:
            return "Dashboard / Data View"
        elif "landing" in best_for or "marketing" in best_for:
            return "Landing / Marketing"

    return "General"


# ============ CLI SUPPORT ============
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Generate Design System")
    parser.add_argument("query", help="Search query (e.g., 'SaaS dashboard')")
    parser.add_argument(
        "--project-name", "-p", type=str, default=None, help="Project name"
    )
    parser.add_argument(
        "--format",
        "-f",
        choices=["ascii", "markdown"],
        default="ascii",
        help="Output format",
    )

    args = parser.parse_args()

    result = generate_design_system(args.query, args.project_name, args.format)
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except AttributeError:
        pass
    print(result)
