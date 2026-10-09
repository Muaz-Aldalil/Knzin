#!/usr/bin/env python3
import argparse
import re
import sys
from pathlib import Path

SKIP_DIRS = {
    ".git",
    "node_modules",
    "__pycache__",
    ".next",
    ".venv",
    "venv",
    "dist",
    "build",
    ".pytest_cache",
}

ALL_FILES = "**/*.{css,scss,tsx,jsx,ts,js,html}"
CSS_FILES = "**/*.{css,scss}"
TSX_FILES = "**/*.tsx"
COPY_FILES = "**/*.{tsx,jsx,ts,js,html}"
JSX_FILES = "**/*.{tsx,jsx,html}"

# Severity ladder (CRITICAL > HIGH > MEDIUM). `--fail-on` uses this.
SEVERITY_RANK = {"MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}
FAIL_ON_RANK = dict(SEVERITY_RANK, **{"NONE": 0})

CHECKS = [
    {
        "label": "PURPLE_GRADIENT",
        "severity": "CRITICAL",
        "source": "build-mode.md anti-patterns (no purple-AI-gradient-on-white) + 2026 anti-slop audit",
        "patterns": [
            re.compile(
                r"linear-gradient.*#(7c3aed|8b5cf6|a78bfa|6d28d9|5b21b6|4c1d95|9333ea)",
                re.I,
            ),
            re.compile(r"linear-gradient.*(purple|violet)", re.I),
        ],
        "glob": ALL_FILES,
    },
    {
        "label": "AI_BRAND_GRADIENT",
        "severity": "HIGH",
        "source": "2026 anti-slop audit — classic AI hero gradient (indigo/violet → purple → pink)",
        "patterns": [
            # The classic AI hero gradient: indigo/violet -> purple -> pink/fuchsia.
            re.compile(
                r"linear-gradient[^;]*#(6366f1|818cf8|a5b4fc|8b5cf6|a855f7|ec4899|f472b6)",
                re.I,
            ),
            re.compile(
                r"linear-gradient[^;]*\b(indigo|violet|purple)\b[^;]*\b(purple|violet|pink|fuchsia)\b",
                re.I,
            ),
            re.compile(
                r"\bfrom-(indigo|violet|purple)-[45]00\b.*\b(?:via-(indigo|violet|purple)-[45]00\s+)?to-(purple|violet|pink|fuchsia)-[45]00\b"
            ),
        ],
        "glob": ALL_FILES,
    },
    {
        "label": "INTER_SOLE_FONT",
        "severity": "HIGH",
        "source": "build-mode.md (typography must be a pairing, not Inter + Inter) + quality-gate.md",
        "patterns": [re.compile(r'font-family.*Inter["\']?\s*[;,]', re.I)],
        "glob": CSS_FILES,
    },
    {
        "label": "INTER_TAILWIND",
        "severity": "HIGH",
        "source": "quality-gate.md (no Inter as sole font family)",
        "patterns": [re.compile(r"font-inter", re.I), re.compile(r"fontFamily.*Inter")],
        "glob": ALL_FILES,
    },
    {
        "label": "TAILWIND_DEFAULT_BLUE",
        "severity": "HIGH",
        "source": "glossary.md (default Tailwind palette) + 2026 anti-slop audit",
        "patterns": [
            re.compile(r"\b(bg|text|border|ring|from|to|via)-(blue-[456]00)\b"),
            # Verbatim default Tailwind blue hexes (blue-500 #3b82f6, blue-600 #2563eb, blue-700 #1d4ed8,
            # blue-400 #60a5fa) as raw color values — the #1 AI color signature per 2026 anti-slop audits.
            re.compile(r"#(?:3b82f6|2563eb|1d4ed8|60a5fa)\b", re.I),
        ],
        "glob": ALL_FILES,
    },
    {
        "label": "TAILWIND_DEFAULT_PURPLE",
        "severity": "HIGH",
        "source": "glossary.md (default Tailwind palette) + 2026 anti-slop audit",
        "patterns": [
            re.compile(r"\b(bg|text|border|ring|from|to|via)-(purple-[456]00)\b")
        ],
        "glob": ALL_FILES,
    },
    {
        "label": "PURE_BLACK_BG",
        "severity": "HIGH",
        "source": "premium-design-guide.md (never pure black) + rules.md",
        "patterns": [
            re.compile(r"background(-color)?:\s*(#000000|#000\b|black)", re.I)
        ],
        "glob": CSS_FILES,
    },
    {
        "label": "PURE_BLACK_TAILWIND",
        "severity": "HIGH",
        "source": "premium-design-guide.md (never pure black) + rules.md",
        "patterns": [re.compile(r"bg-black(?![0-9])")],
        "glob": ALL_FILES,
    },
    {
        "label": "AI_BUZZWORDS",
        "severity": "MEDIUM",
        "source": "quality-gate.md (AI buzzwords) + 2026 anti-slop audit",
        "patterns": [
            re.compile(r"seamless(ly)?", re.I),
            re.compile(r"\bleverage[d]?\b", re.I),
            re.compile(r"\bcutting[- ]edge\b", re.I),
            re.compile(r"\bgame[- ]chang(ing|er)?\b", re.I),
            re.compile(r"revolutioniz(ing|ation|ed)?", re.I),
            re.compile(r"\bparadigm[- ]shift\b", re.I),
            re.compile(r"\bempower(ing|ment)?\b", re.I),
            re.compile(r"\bharness(ing)?\b", re.I),
            re.compile(r"\bunlock\b", re.I),
            re.compile(r"\bsupercharge(d)?\b", re.I),
            re.compile(r"\belevate(d)?\b", re.I),
            re.compile(r"\bunleash(ed)?\b", re.I),
            re.compile(r"\bdelve\b", re.I),
            re.compile(r"\beffortless(ly)?\b", re.I),
            re.compile(r"\bstreamline(d)?\b", re.I),
            re.compile(r"\bstate[- ]of[- ]the[- ]art\b", re.I),
            re.compile(r"\bbest[- ]in[- ]class\b", re.I),
            re.compile(r"\bworld[- ]class\b", re.I),
            re.compile(r"\bnext[- ]gen\b", re.I),
            re.compile(r"\bholistic\b", re.I),
            re.compile(r"\bsynerg(y|ies)\b", re.I),
            re.compile(r"\bdisrupt(ive|or)?\b", re.I),
            re.compile(r"\bdive\s+into\b", re.I),
        ],
        "glob": ALL_FILES,
    },
    {
        "label": "GRADIENT_TEXT",
        "severity": "HIGH",
        "source": "glossary.md (gradient text) + 2026 anti-slop audit",
        "patterns": [
            re.compile(r"background.*-clip:\s*text", re.I),
            re.compile(r"text-transparent.*bg-clip"),
        ],
        "glob": ALL_FILES,
    },
    {
        "label": "GLASS_BLUR",
        "severity": "MEDIUM",
        "source": "build-mode.md (no glassmorphism as decorative element) + quality-gate.md",
        "patterns": [
            re.compile(r"backdrop-blur"),
            re.compile(r"backdrop-filter.*blur", re.I),
        ],
        "glob": ALL_FILES,
    },
    {
        "label": "EQUAL_3_COL",
        "severity": "MEDIUM",
        "source": "glossary.md (equal 3-col grid) + 2026 anti-slop audit + deai-ledger.md T20",
        "patterns": [
            re.compile(r"grid-cols-3(?!.*minmax)"),
            re.compile(r"repeat\(\s*3(?![^)]*minmax)"),
            re.compile(r":\s*1fr\s+1fr\s+1fr\s*;"),
        ],
        "glob": ALL_FILES,
    },
    {
        "label": "EM_DASH",
        "severity": "MEDIUM",
        "source": "premium-design-guide.md (no em-dashes — AI tell)",
        "patterns": [re.compile(r"—"), re.compile(r"&#8212;")],
        "glob": TSX_FILES,
    },
    {
        "label": "WELCOME_HERO",
        "severity": "MEDIUM",
        "source": 'glossary.md ("Welcome to" tell) + 2026 anti-slop audit',
        "patterns": [re.compile(r"Welcome\s+to", re.I)],
        "glob": TSX_FILES,
    },
    {
        "label": "SCROLL_LISTENER",
        "severity": "HIGH",
        "source": "quality-gate.md (no scroll listeners) + performance guide",
        "patterns": [
            re.compile(r'window\.addEventListener\(\s*["\']scroll["\']', re.I),
            re.compile(r'document\.addEventListener\(\s*["\']scroll["\']', re.I),
            re.compile(r"\bonscroll\s*="),
        ],
        "glob": ALL_FILES,
    },
    {
        "label": "TRANSITION_ALL",
        "severity": "HIGH",
        "source": "quality-gate.md (no transition-all) + premium-design-guide.md motion",
        "patterns": [
            re.compile(r"transition:\s*all\b", re.I),
            re.compile(r"\btransition-all\b"),
        ],
        "glob": ALL_FILES,
    },
    {
        "label": "TRANSITION_LAYOUT_PROP",
        "severity": "HIGH",
        "source": "quality-gate.md (no layout-property animation) + premium-design-guide.md",
        "patterns": [
            re.compile(
                r"transition:\s*[^;]*\b(width|height|top|left|right|bottom|margin|padding)\b",
                re.I,
            ),
            re.compile(
                r"\btransition-\[(width|height|top|left|right|bottom|margin|padding)\]"
            ),
            re.compile(
                r"@keyframes\s+[\w-]+\s*\{[^}]*\b(width|height|top|left|right|bottom)\s*:",
                re.I,
            ),
        ],
        "glob": ALL_FILES,
    },
    {
        "label": "KEYFRAME_LAYOUT_PROP",
        "severity": "HIGH",
        "source": "quality-gate.md (no layout-property animation) + premium-design-guide.md",
        "mode": "css-keyframes",
        "glob": CSS_FILES,
    },
    {
        "label": "PLACEHOLDER_COPY",
        "severity": "MEDIUM",
        "source": "CHK-delivery.md (no placeholder content) + build-mode.md",
        "patterns": [
            re.compile(r"lorem\s+ipsum", re.I),
            re.compile(r"\bJohn Doe\b|\bJane Doe\b", re.I),
            re.compile(r"\bAcme\s+(Corp|Corporation|Inc)?\b", re.I),
            re.compile(r"\byour[- ](name|username|email|password|company)\b", re.I),
            re.compile(r"via\.placeholder\.(com|net)", re.I),
            re.compile(r"i\.pravatar\.cc", re.I),
            re.compile(r"(?:randomuser\.me|picsum\.photos|placeholder\.com)", re.I),
            re.compile(r"\bexample\.(com|org|net)\b"),
            re.compile(r"\byour_email\b"),
        ],
        "glob": COPY_FILES,
    },
    {
        "label": "HOVER_ONLY_REVEAL",
        "severity": "MEDIUM",
        "source": "quality-gate.md (no hover-only reveal) + component-a11y.md",
        "patterns": [
            re.compile(r"(opacity-0|hidden|invisible)\s+(group-hover|peer-hover)"),
            re.compile(r"\b(hidden|invisible)\s+group-hover:"),
            re.compile(r"group-hover:\s*(opacity-100|block|flex|visible)\b"),
        ],
        "glob": ALL_FILES,
    },
    {
        "label": "SECTION_EYEBROW_NUMBER",
        "severity": "MEDIUM",
        "source": "2026 anti-slop audit — AI section-number eyebrow pattern",
        "patterns": [
            re.compile(r"(?<![0-9A-Za-z])0[0-9]\s*[/·.–—]\s*[A-Z]"),
            re.compile(r"(?<![0-9A-Za-z])0[0-9]\s+\.\s+[A-Z]"),
        ],
        "glob": JSX_FILES,
    },
    {
        "label": "ITALIC_HEADING",
        "severity": "MEDIUM",
        "source": "2026 anti-slop audit — AI italic-heading pattern",
        "mode": "css-heading-italic",
        "glob": CSS_FILES,
    },
    {
        "label": "HERO_CENTERED",
        "severity": "MEDIUM",
        "source": "2026 anti-slop audit — generic centered hero pattern",
        "mode": "file",
        "glob": JSX_FILES,
        "all_of": [
            re.compile(r"\bmin-h-screen\b"),
            re.compile(r"\b(justify-center|items-center)\b"),
            re.compile(r"\btext-center\b"),
        ],
    },
    {
        "label": "SELECTED_STATE_BORDER_ONLY",
        "severity": "MEDIUM",
        "source": "deai-ledger.md T4 — unmodified shadcn selected-state tell",
        "patterns": [re.compile(r"data-\[state=active\]:border-")],
        "glob": ALL_FILES,
    },
    {
        "label": "EYEBROW_CAPS_CRAMPED",
        "severity": "MEDIUM",
        "source": "deai-ledger.md T4 — caps-cramped eyebrow tell",
        "patterns": [
            re.compile(
                r"(uppercase[^\"']{0,80}tracking-(wider|widest)"
                r"|tracking-(wider|widest)[^\"']{0,80}uppercase)"
            )
        ],
        "glob": ALL_FILES,
    },
    {
        "label": "RANDOM_STATUS_PILL",
        "severity": "MEDIUM",
        "source": "deai-ledger.md T4 — decorative status-pill tell",
        "patterns": [
            re.compile(
                r"rounded-full[^>]{0,120}>\s*(●|•|\bLive\b|\bAvailable\b|\bBeta\b)"
            )
        ],
        "glob": JSX_FILES,
    },
    {
        "label": "GLOW_LIGHTS",
        "severity": "MEDIUM",
        "source": "deai-ledger.md T13 — glow-light tell",
        "patterns": [
            re.compile(r"blur-(2xl|3xl)"),
            re.compile(r"radial-gradient[^;]*(purple|violet|pink|indigo)", re.I),
            re.compile(r"drop-shadow[^;\"']*(purple|violet|glow)", re.I),
        ],
        "glob": ALL_FILES,
    },
    {
        "label": "EMOJI_AS_ICON",
        "severity": "MEDIUM",
        "source": "deai-ledger.md T14 — emoji-as-icon tell",
        "patterns": [re.compile(r"[🌀-🫿☀-➿]")],
        "glob": JSX_FILES,
    },
    {
        "label": "THREE_TIER_PRICING",
        "severity": "MEDIUM",
        "source": "deai-ledger.md T17/T20 — highlighted-middle-tier tell",
        "patterns": [
            re.compile(r"\b(Most Popular|Most popular|Best Value|RECOMMENDED)\b")
        ],
        "glob": COPY_FILES,
    },
]


def _expand_braces(pattern: str) -> list:
    if "{" not in pattern:
        return [pattern]
    start, rest = pattern.split("{", 1)
    body, tail = rest.split("}", 1)
    return [start + choice + tail for choice in body.split(",")]


def matches_glob(path: Path, pattern: str) -> bool:
    suffix_part = pattern.split("**/", 1)[1] if "**/" in pattern else pattern
    return any(
        Path(path.name).match(expanded) for expanded in _expand_braces(suffix_part)
    )


def get_candidate_files(target: Path) -> list:
    files = []
    if target.is_file():
        return [target]
    for path in target.rglob("*"):
        if path.is_file() and not any(part in SKIP_DIRS for part in path.parts):
            files.append(path)
    return files


def keyframes_blocks(text: str):
    """Yield (body, start_line) for every @keyframes block in a CSS string."""
    for match in re.finditer(r"@keyframes\s+[\w-]+\s*\{(.*?)\}", text, re.S | re.I):
        body = match.group(1)
        start = text.count("\n", 0, match.start()) + 1
        yield body, start


def heading_rule_blocks(text: str):
    """Yield (selector, body, start_line) for CSS rules whose selector is a heading/eyebrow."""
    for match in re.finditer(r"([^{}@][^{}]*)\{([^{}]*)\}", text, re.S):
        selector = match.group(1).strip()
        body = match.group(2)
        start = text.count("\n", 0, match.start()) + 1
        yield selector, body, start


def scan(target: Path):
    files = get_candidate_files(target)
    results = {}
    for check in CHECKS:
        mode = check.get("mode", "line")
        hits = []
        for path in files:
            if not matches_glob(path, check["glob"]):
                continue
            try:
                text = path.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            if mode == "line":
                for index, line in enumerate(text.splitlines(), start=1):
                    if any(pattern.search(line) for pattern in check["patterns"]):
                        hits.append(f"{path}:{index}:{line.strip()}")
            elif mode == "file":
                if all(pattern.search(text) for pattern in check["all_of"]):
                    hits.append(
                        f"{path}:1:<file-level pattern match: {check['label']}>"
                    )
            elif mode == "css-keyframes":
                for body, start in keyframes_blocks(text):
                    if re.search(
                        r"\b(width|height|top|left|right|bottom)\s*:", body, re.I
                    ):
                        hits.append(
                            f"{path}:{start}:<@keyframes animates a layout property (use transform/opacity)>"
                        )
            elif mode == "css-heading-italic":
                # NOTE: heading_rule_blocks() uses a flat regex that skips @media/@keyframes blocks.
                # Italic headings scoped to a media query will not be detected — known limitation.
                for selector, body, start in heading_rule_blocks(text):
                    if re.search(
                        r"h[1-6]\b|heading|title|eyebrow|kicker", selector, re.I
                    ) and re.search(r"font-style\s*:\s*italic", body, re.I):
                        hits.append(
                            f"{path}:{start}:{selector} uses font-style: italic"
                        )
        if hits:
            results[check["label"]] = hits
    return results


def main(argv=None):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except AttributeError:
        pass
    parser = argparse.ArgumentParser(
        prog="anti-slop.py",
        description="Deterministic AI-slop detection for frontend code",
    )
    parser.add_argument(
        "target", nargs="?", default=".", help="directory or file to scan"
    )
    parser.add_argument(
        "--fail-on",
        choices=["MEDIUM", "HIGH", "CRITICAL", "NONE"],
        default="NONE",
        help="exit non-zero when an issue of at least this severity is found (default: NONE)",
    )
    args = parser.parse_args(argv)

    target = Path(args.target).resolve()
    if not target.exists():
        print(f"ERROR: target does not exist: {target}", file=sys.stderr)
        return 2

    results = scan(target)

    print("=== MUAZ-V3 ANTI-SLOP CHECK ===")
    print(f"Target: {target}")
    print("")

    if not results:
        print("RESULT: CLEAN - no pattern violations detected.")
        print("NOTE: This checks patterns only. Manual review still required for:")
        print("  - Layout balance and whitespace")
        print("  - Typography hierarchy and restraint")
        print("  - Color palette cohesion")
        print("  - Motion quality and timing")
        print("  - Content tone and specificity")
        return 0

    fail_min = FAIL_ON_RANK[args.fail_on]
    grouped = {}
    total = 0
    for check in CHECKS:
        hits = results.get(check["label"])
        if not hits:
            continue
        grouped.setdefault(check["severity"], []).append((check["label"], hits))
        total += len(hits)

    print(f"RESULT: {len(results)} VIOLATION GROUPS / {total} HITS FOUND")
    for sev in ("CRITICAL", "HIGH", "MEDIUM"):
        if sev not in grouped:
            continue
        print(f"\n--- {sev} ---")
        for label, hits in grouped[sev]:
            print(f"FAIL [{label}]:")
            for hit in hits:
                print(f"  {hit}")

    print("\nACTION REQUIRED: Fix all violations before claiming done.")
    print("Run again after fixes to verify.")

    worst = max((SEVERITY_RANK[sev] for sev in grouped), default=1)
    if fail_min and worst >= fail_min:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
