#!/usr/bin/env python3
"""
scripts/chaos_guard.py
Adversarial & Negative Test Gate for Agent OS.

Guards against the "Green Test Fallacy" by scanning test files to ensure
the presence of negative boundary tests, exception expectations, and error state assertions.
"""

import sys
import re
from pathlib import Path
from typing import Dict, Any, List, Optional

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent

# Patterns indicating negative, error, or adversarial assertions
NEGATIVE_PATTERNS = [
    # Python unittest / pytest exceptions
    r"assertRaises",
    r"pytest\.raises",
    r"with\s+self\.assertRaises",
    r"assert\s+not\b",
    r"assertFalse",
    r"assertIsNone",
    r"assertNotIn",
    # JavaScript / TypeScript / Jest / Vitest
    r"\.toThrow",
    r"\.rejects",
    r"\.toBeNull",
    r"\.toBeUndefined",
    r"\.not\.",
    r"expect\(.*?\)\.toHaveLength\(0\)",
    # PHP / Pest / PHPUnit
    r"expectException",
    r"->toThrow",
    r"->toBeNull",
    r"assertThrows",
    # HTTP error status codes (4xx, 5xx)
    r"(?:status|status_code|statusCode|assertStatus)\s*(?:==|===|[(,\s])\s*(?:400|401|403|404|409|422|500)",
    r"toBe\((?:400|401|403|404|409|422|500)\)",
    # Malformed / boundary test words
    r"(?:invalid|malformed|unauthorized|forbidden|expired|corrupted|tampered|rate_limit)",
]

# Patterns indicating general / happy assertions
GENERAL_ASSERT_PATTERNS = [
    r"assert\s+",
    r"self\.assert[A-Za-z0-9_]+",
    r"expect\(",
    r"\$this->assert[A-Za-z0-9_]+",
]

COMPILED_NEGATIVE = [re.compile(p, re.IGNORECASE) for p in NEGATIVE_PATTERNS]
COMPILED_GENERAL = [re.compile(p) for p in GENERAL_ASSERT_PATTERNS]

def analyze_test_content(content: str, filename: str = "test") -> Dict[str, Any]:
    lines = content.splitlines()
    total_assertions = 0
    negative_hits: List[Dict[str, Any]] = []

    for line_idx, line in enumerate(lines, start=1):
        stripped = line.strip()
        if not stripped or stripped.startswith(("#", "//", "/*", "*")):
            continue

        # Count general assertions
        is_assert = any(pat.search(line) for pat in COMPILED_GENERAL)
        if is_assert:
            total_assertions += 1

        # Check negative/adversarial markers
        for pat in COMPILED_NEGATIVE:
            match = pat.search(line)
            if match:
                negative_hits.append({
                    "line": line_idx,
                    "content": stripped,
                    "pattern": pat.pattern
                })
                break

    negative_count = len(negative_hits)
    # Ratio of adversarial assertions
    ratio = (negative_count / total_assertions) if total_assertions > 0 else 0.0
    passed = negative_count > 0 or total_assertions == 0

    return {
        "filename": filename,
        "total_assertions": total_assertions,
        "negative_assertions": negative_count,
        "adversarial_ratio": round(ratio, 3),
        "passed": passed,
        "findings": negative_hits
    }

def analyze_test_file(file_path: Path) -> Dict[str, Any]:
    try:
        content = file_path.read_text(encoding="utf-8", errors="replace")
        rel_path = file_path.resolve().relative_to(WORKSPACE_ROOT).as_posix()
        return analyze_test_content(content, rel_path)
    except Exception as e:
        return {
            "filename": str(file_path),
            "total_assertions": 0,
            "negative_assertions": 0,
            "adversarial_ratio": 0.0,
            "passed": False,
            "error": str(e),
            "findings": []
        }

def audit_directory(dir_path: Path) -> List[Dict[str, Any]]:
    results = []
    test_files = list(dir_path.rglob("test_*.py")) + list(dir_path.rglob("*_test.py")) + \
                 list(dir_path.rglob("*.test.ts")) + list(dir_path.rglob("*.test.js")) + \
                 list(dir_path.rglob("*Test.php"))
    for tf in sorted(test_files):
        results.append(analyze_test_file(tf))
    return results

def print_audit_report(results: List[Dict[str, Any]]):
    print("=" * 65)
    print("      ANTIGRAVITY AGENT OS - ADVERSARIAL TEST GATE AUDIT       ")
    print("=" * 65)
    total_files = len(results)
    passed_files = sum(1 for r in results if r["passed"])
    failed_files = total_files - passed_files

    print(f"Scanned Test Files:  {total_files}")
    print(f"Adversarial Green:   {passed_files}")
    print(f"Happy-Path Only:     {failed_files}")
    print("-" * 65)

    for r in results:
        status = "[PASS]" if r["passed"] else "[FAIL - P1]"
        print(f"{status} {r['filename']:<40} Ratio: {r['adversarial_ratio'] * 100:>5.1f}% ({r['negative_assertions']}/{r['total_assertions']})")
        if not r["passed"]:
            print("       ⚠️  Zero negative/adversarial assertions found! Prone to Green Test Fallacy.")

    print("=" * 65)
    if failed_files == 0:
        print("[SUCCESS] All test suites contain verified negative/boundary tests.")
    else:
        print(f"[ACTION REQUIRED] {failed_files} test file(s) lack negative edge case verification.")
    print("=" * 65)

def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/chaos_guard.py <audit|scan> [path]")
        sys.exit(1)

    cmd = sys.argv[1].lower()
    if cmd == "audit":
        test_dir = WORKSPACE_ROOT / "tests"
        results = audit_directory(test_dir)
        print_audit_report(results)
        # Non-zero exit if any failed
        if any(not r["passed"] for r in results):
            sys.exit(1)
        sys.exit(0)

    elif cmd == "scan":
        if len(sys.argv) < 3:
            print("Error: 'scan' requires a file path")
            sys.exit(1)
        target = Path(sys.argv[2])
        if not target.is_file():
            print(f"Error: File not found: {target}")
            sys.exit(1)
        res = analyze_test_file(target)
        print_audit_report([res])
        sys.exit(0 if res["passed"] else 1)
    else:
        print(f"Unknown command: '{cmd}'")
        sys.exit(1)

if __name__ == "__main__":
    main()
