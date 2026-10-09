#!/usr/bin/env python3
"""
Automated Codemod & Refactoring Engine (100X Power Suite).
Performs deterministic batch transformations across project codebases:
1. strict-types: Automatically inserts declare(strict_types=1); into PHP headers.
2. rtl-css: Converts physical CSS properties into bidirectional CSS logical properties.
3. tailwind-logical: Converts physical Tailwind utility classes (ml/mr/pl/pr) into logical (ms/me/ps/pe).

Supports --dry-run (default) and --apply mode.
"""

import sys
import os
import re
from pathlib import Path
from typing import List, Dict, Any, Tuple

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

WORKSPACE_ROOT = Path("D:/Skills/.agents")

def transform_php_strict_types(content: str) -> Tuple[str, bool]:
    """Adds declare(strict_types=1); to PHP files if missing."""
    if "<?php" not in content:
        return content, False
    if "declare(strict_types=1);" in content:
        return content, False

    # Insert right after <?php
    lines = content.splitlines(keepends=True)
    for idx, line in enumerate(lines):
        if line.strip() == "<?php":
            new_lines = lines[:idx+1] + ["\ndeclare(strict_types=1);\n"] + lines[idx+1:]
            return "".join(new_lines), True
        elif line.strip().startswith("<?php"):
            rest = line[len("<?php"):].lstrip()
            new_lines = ["<?php\n\ndeclare(strict_types=1);\n\n"]
            if rest:
                new_lines.append(rest)
            new_lines.extend(lines[idx+1:])
            return "".join(new_lines), True

    return content, False

def transform_css_logical(content: str) -> Tuple[str, bool]:
    """Converts physical CSS properties to logical properties."""
    replacements = [
        (r"\bmargin-left\s*:", "margin-inline-start:"),
        (r"\bmargin-right\s*:", "margin-inline-end:"),
        (r"\bpadding-left\s*:", "padding-inline-start:"),
        (r"\bpadding-right\s*:", "padding-inline-end:"),
        (r"\btext-align\s*:\s*left\b", "text-align: start"),
        (r"\btext-align\s*:\s*right\b", "text-align: end"),
    ]
    modified = False
    new_content = content
    for pat, rep in replacements:
        if re.search(pat, new_content):
            new_content = re.sub(pat, rep, new_content)
            modified = True
    return new_content, modified

def transform_tailwind_logical(content: str) -> Tuple[str, bool]:
    """Converts physical Tailwind classes to logical classes."""
    replacements = [
        (r"\bml-(\d+|auto)\b", r"ms-\1"),
        (r"\bmr-(\d+|auto)\b", r"me-\1"),
        (r"\bpl-(\d+|auto)\b", r"ps-\1"),
        (r"\bpr-(\d+|auto)\b", r"pe-\1"),
        (r"\btext-left\b", "text-start"),
        (r"\btext-right\b", "text-end"),
    ]
    modified = False
    new_content = content
    for pat, rep in replacements:
        if re.search(pat, new_content):
            new_content = re.sub(pat, rep, new_content)
            modified = True
    return new_content, modified

TRANSFORMERS = {
    "strict-types": (transform_php_strict_types, [".php"]),
    "rtl-css": (transform_css_logical, [".css", ".scss", ".less"]),
    "tailwind-logical": (transform_tailwind_logical, [".tsx", ".jsx", ".html", ".vue", ".blade.php"]),
}

def run_codemod(rule_name: str, target_path: str, apply: bool = False) -> List[Path]:
    if rule_name not in TRANSFORMERS:
        print(f"[!] Unknown rule: '{rule_name}'. Available: {list(TRANSFORMERS.keys())}")
        return []

    fn, extensions = TRANSFORMERS[rule_name]
    p = Path(target_path)
    if not p.is_absolute():
        p = WORKSPACE_ROOT / target_path

    if not p.exists():
        print(f"[!] Path does not exist: {p}")
        return []

    target_files = []
    if p.is_file():
        target_files = [p]
    else:
        for root, _, files in os.walk(p):
            for f in files:
                f_path = Path(root) / f
                if f_path.suffix.lower() in extensions:
                    target_files.append(f_path)

    modified_files = []
    for f in target_files:
        try:
            content = f.read_text(encoding="utf-8", errors="ignore")
            new_content, changed = fn(content)
            if changed:
                modified_files.append(f)
                if apply:
                    f.write_text(new_content, encoding="utf-8")
        except Exception as e:
            print(f"[!] Notice: Failed processing {f}: {e}", file=sys.stderr)

    return modified_files

def main():
    if len(sys.argv) < 3:
        print("Usage: python scripts/codemod.py <strict-types|rtl-css|tailwind-logical> <path> [--apply]")
        sys.exit(1)

    rule = sys.argv[1].lower()
    path_arg = sys.argv[2]
    apply = "--apply" in sys.argv

    print("=" * 65)
    print("      ANTIGRAVITY 100X ENGINE - AUTOMATED CODEMOD       ")
    print("=" * 65)
    print(f"Rule:   {rule}")
    print(f"Target: {path_arg}")
    print(f"Mode:   {'APPLY (in-place modification)' if apply else 'DRY-RUN (preview only)'}")
    print("-" * 65)

    modified = run_codemod(rule, path_arg, apply=apply)
    if not modified:
        print(f"[PASS] No matching files requiring '{rule}' transformation found.")
    else:
        status_tag = "[MODIFIED]" if apply else "[TARGET]"
        print(f"Identified {len(modified)} file(s):")
        for f in modified:
            try:
                rel = f.relative_to(WORKSPACE_ROOT)
            except ValueError:
                rel = f
            print(f"  {status_tag} {rel}")

        if not apply:
            print("-" * 65)
            print("[NOTICE] Run with '--apply' to apply changes.")
    print("=" * 65)

if __name__ == "__main__":
    main()
