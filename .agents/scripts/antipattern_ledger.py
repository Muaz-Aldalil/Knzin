#!/usr/bin/env python3
"""
scripts/antipattern_ledger.py
Post-Mortem & Anti-Pattern Ledger for Agent OS.

Maintains a permanent index of project-specific anti-patterns, rejected designs,
and regression triggers in .agent_antipatterns.json to ensure the agent never
repeats a corrected mistake across sessions.
"""

import sys
import json
import re
import subprocess
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
LEDGER_FILE = WORKSPACE_ROOT / ".agent_antipatterns.json"

DEFAULT_ANTIPATTERNS = [
    {
        "id": "AP-001",
        "trigger": "Raw SQL concatenation in database queries",
        "antipattern_regex": r"(?:f[\"']\s*(?:SELECT|INSERT|UPDATE|DELETE)\b.*?\{|\b(?:execute|query|raw)\s*\(\s*[\"'`].*?(?:\$|\{|\+|%))",
        "replacement": "Use parameterized queries with bindings or ORM query builder",
        "reason": "Eliminates SQL injection vulnerabilities across data layer",
        "added_at": "2026-10-08T23:00:00Z"
    },
    {
        "id": "AP-002",
        "trigger": "Direct server secret access in client bundle",
        "antipattern_regex": r"process\.env\.(?:SECRET|KEY|PASSWORD|TOKEN|DATABASE_URL)",
        "replacement": "Server-side environment derivation only (Next.js server actions / API)",
        "reason": "Prevents leaking infrastructure credentials in client JS bundles",
        "added_at": "2026-10-08T23:00:00Z"
    },
    {
        "id": "AP-003",
        "trigger": "Mutable default argument in Python function definition",
        "antipattern_regex": r"def\s+[a-zA-Z_]\w*\s*\([^)]*?=\s*(?:\[\]|\{\}|set\(\))",
        "replacement": "Use default None and initialize inside function body (item=None)",
        "reason": "Eliminates shared mutable state bugs across function invocations",
        "added_at": "2026-10-08T23:00:00Z"
    }
]

def load_ledger() -> List[Dict[str, Any]]:
    if not LEDGER_FILE.is_file():
        # Initialize with defaults
        save_ledger(DEFAULT_ANTIPATTERNS)
        return DEFAULT_ANTIPATTERNS
    try:
        with open(LEDGER_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return DEFAULT_ANTIPATTERNS

def save_ledger(patterns: List[Dict[str, Any]]):
    with open(LEDGER_FILE, "w", encoding="utf-8", newline="\n") as f:
        json.dump(patterns, f, indent=2, sort_keys=True)

def add_antipattern(trigger: str, pattern: str, replacement: str, reason: str) -> Dict[str, Any]:
    ledger = load_ledger()
    next_id = f"AP-{len(ledger) + 1:03d}"
    entry = {
        "id": next_id,
        "trigger": trigger.strip(),
        "antipattern_regex": pattern.strip(),
        "replacement": replacement.strip(),
        "reason": reason.strip(),
        "added_at": datetime.now(timezone.utc).isoformat()
    }
    ledger.append(entry)
    save_ledger(ledger)
    return entry

def scan_text(content: str, filename: str = "buffer") -> List[Dict[str, Any]]:
    ledger = load_ledger()
    violations: List[Dict[str, Any]] = []

    for item in ledger:
        regex_str = item.get("antipattern_regex", "")
        if not regex_str:
            continue
        try:
            compiled = re.compile(regex_str, re.MULTILINE)
        except re.error:
            continue

        for line_idx, line in enumerate(content.splitlines(), start=1):
            if compiled.search(line):
                violations.append({
                    "id": item["id"],
                    "filename": filename,
                    "line": line_idx,
                    "line_content": line.strip(),
                    "trigger": item["trigger"],
                    "replacement": item["replacement"],
                    "reason": item["reason"]
                })
    return violations

def scan_diff(diff_text: str) -> List[Dict[str, Any]]:
    ledger = load_ledger()
    violations: List[Dict[str, Any]] = []

    current_file = ""
    current_line = 0

    for line in diff_text.splitlines():
        if line.startswith("diff --git"):
            parts = line.split()
            if len(parts) >= 4:
                b_path = parts[3]
                current_file = b_path[2:] if b_path.startswith("b/") else b_path
        elif line.startswith("@@"):
            # @@ -1,4 +1,5 @@
            m = re.search(r"\+(\d+)", line)
            current_line = int(m.group(1)) if m else 0
        elif line.startswith("+") and not line.startswith("+++"):
            added_content = line[1:]
            for item in ledger:
                regex_str = item.get("antipattern_regex", "")
                if not regex_str:
                    continue
                try:
                    if re.search(regex_str, added_content):
                        violations.append({
                            "id": item["id"],
                            "filename": current_file,
                            "line": current_line,
                            "line_content": added_content.strip(),
                            "trigger": item["trigger"],
                            "replacement": item["replacement"],
                            "reason": item["reason"]
                        })
                except re.error as err:
                    continue
            current_line += 1
        elif not line.startswith("-"):
            current_line += 1

    return violations

def get_git_diff() -> str:
    try:
        res = subprocess.run(["git", "diff", "HEAD"], cwd=WORKSPACE_ROOT, capture_output=True, text=True, check=False)
        if res.stdout:
            return res.stdout
        res_unstaged = subprocess.run(["git", "diff"], cwd=WORKSPACE_ROOT, capture_output=True, text=True, check=False)
        return res_unstaged.stdout
    except Exception:
        return ""

def print_scan_report(violations: List[Dict[str, Any]]):
    print("=" * 65)
    print("    ANTIGRAVITY AGENT OS - ANTI-PATTERN REGRESSION AUDIT      ")
    print("=" * 65)
    if not violations:
        print("[PASS] Zero known anti-patterns detected. Code is clean.")
        print("=" * 65)
        return

    print(f"[FAIL - P1] Detected {len(violations)} anti-pattern violation(s):")
    print("-" * 65)
    for v in violations:
        print(f"  * [{v['id']}] {v['filename']}:{v['line']}")
        print(f"    Trigger:     {v['trigger']}")
        print(f"    Line:        {v['line_content']}")
        print(f"    Replacement: {v['replacement']}")
        print(f"    Reason:      {v['reason']}")
        print("-" * 65)
    print("=" * 65)

def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/antipattern_ledger.py <list|scan|audit|add> [args...]")
        print("  list")
        print("  audit [--diff <file>]")
        print("  scan <file>")
        print("  add --trigger \"...\" --pattern \"...\" --replacement \"...\" --reason \"...\"")
        sys.exit(1)

    cmd = sys.argv[1].lower()
    if cmd == "list":
        ledger = load_ledger()
        print("=" * 65)
        print(f"REGISTERED ANTI-PATTERNS ({len(ledger)} total):")
        print("=" * 65)
        for item in ledger:
            print(f"[{item['id']}] {item['trigger']}")
            print(f"  Regex:       {item['antipattern_regex']}")
            print(f"  Replacement: {item['replacement']}")
            print(f"  Reason:      {item['reason']}")
            print("-" * 65)
        sys.exit(0)

    elif cmd == "audit":
        diff_text = ""
        if "--diff" in sys.argv:
            idx = sys.argv.index("--diff")
            if idx + 1 < len(sys.argv):
                p = Path(sys.argv[idx + 1])
                if p.is_file():
                    diff_text = p.read_text(encoding="utf-8")
        if not diff_text:
            diff_text = get_git_diff()
        violations = scan_diff(diff_text)
        print_scan_report(violations)
        sys.exit(1 if violations else 0)

    elif cmd == "scan":
        if len(sys.argv) < 3:
            print("Error: 'scan' requires target file")
            sys.exit(1)
        p = Path(sys.argv[2])
        if not p.is_file():
            print(f"Error: File not found: {p}")
            sys.exit(1)
        content = p.read_text(encoding="utf-8", errors="replace")
        violations = scan_text(content, str(p.relative_to(WORKSPACE_ROOT) if p.is_relative_to(WORKSPACE_ROOT) else p))
        print_scan_report(violations)
        sys.exit(1 if violations else 0)

    elif cmd == "add":
        def get_arg(name: str) -> str:
            if name in sys.argv:
                idx = sys.argv.index(name)
                if idx + 1 < len(sys.argv):
                    return sys.argv[idx + 1]
            return ""
        trigger = get_arg("--trigger")
        pattern = get_arg("--pattern")
        replacement = get_arg("--replacement")
        reason = get_arg("--reason")
        if not (trigger and pattern and replacement and reason):
            print("Error: 'add' requires --trigger, --pattern, --replacement, and --reason")
            sys.exit(1)
        entry = add_antipattern(trigger, pattern, replacement, reason)
        print(f"[SUCCESS] Registered new anti-pattern [{entry['id']}]: '{trigger}'")
        sys.exit(0)
    else:
        print(f"Unknown command: '{cmd}'")
        sys.exit(1)

if __name__ == "__main__":
    main()
