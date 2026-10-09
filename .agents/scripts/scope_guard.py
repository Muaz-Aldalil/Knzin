#!/usr/bin/env python3
"""
scripts/scope_guard.py
Blast-Radius & Scope Bounding Contract for Agent OS.

Prevents "while I'm here" scope drift by enforcing a declared target file list
and maximum line-budget contract on active git working-tree changes.
"""

import sys
import json
import subprocess
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
SCOPE_FILE = WORKSPACE_ROOT / ".agent_scope.json"

def get_scope() -> Optional[Dict[str, Any]]:
    if not SCOPE_FILE.is_file():
        return None
    try:
        with open(SCOPE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None

def set_scope(task: str, permitted_files: List[str], max_lines: int = 200) -> Dict[str, Any]:
    # Normalize paths relative to workspace root
    normalized_files = []
    for f in permitted_files:
        p = Path(f)
        try:
            if p.is_absolute():
                rel = p.resolve().relative_to(WORKSPACE_ROOT).as_posix()
            else:
                rel = (WORKSPACE_ROOT / p).resolve().relative_to(WORKSPACE_ROOT).as_posix()
            normalized_files.append(rel)
        except ValueError:
            normalized_files.append(p.as_posix())

    scope_data = {
        "task": task.strip(),
        "permitted_files": sorted(list(set(normalized_files))),
        "max_lines": max_lines,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    with open(SCOPE_FILE, "w", encoding="utf-8", newline="\n") as f:
        json.dump(scope_data, f, indent=2, sort_keys=True)
    return scope_data

def clear_scope() -> bool:
    if SCOPE_FILE.is_file():
        SCOPE_FILE.unlink()
        return True
    return False

def get_uncommitted_diff() -> str:
    try:
        # Check both unstaged and staged diffs
        res = subprocess.run(
            ["git", "diff", "HEAD"],
            cwd=WORKSPACE_ROOT,
            capture_output=True,
            text=True,
            check=False
        )
        if res.stdout:
            return res.stdout
        # Fallback to unstaged diff if HEAD fails (e.g. initial commit)
        res_unstaged = subprocess.run(
            ["git", "diff"],
            cwd=WORKSPACE_ROOT,
            capture_output=True,
            text=True,
            check=False
        )
        return res_unstaged.stdout
    except Exception:
        return ""

def check_scope(diff_text: Optional[str] = None) -> Dict[str, Any]:
    scope = get_scope()
    if not scope:
        return {
            "active": False,
            "in_scope": True,
            "violations": [],
            "line_count": 0,
            "max_lines": 0,
            "message": "No active scope contract declared. All files permitted."
        }

    if diff_text is None:
        diff_text = get_uncommitted_diff()

    # Parse modified files and line counts from diff
    modified_files: List[str] = []
    added_lines = 0
    removed_lines = 0

    current_file = None
    for line in diff_text.splitlines():
        if line.startswith("diff --git"):
            parts = line.split()
            if len(parts) >= 4:
                # b/path/to/file
                b_path = parts[3]
                if b_path.startswith("b/"):
                    current_file = b_path[2:]
                else:
                    current_file = b_path
                # Normalize separators
                current_file = Path(current_file).as_posix()
                if current_file not in modified_files:
                    modified_files.append(current_file)
        elif line.startswith("+") and not line.startswith("+++"):
            added_lines += 1
        elif line.startswith("-") and not line.startswith("---"):
            removed_lines += 1

    permitted = set(scope.get("permitted_files", []))
    violations: List[str] = []

    # Files that do not count against scope violations: metadata files
    METADATA_WHITELIST = {
        ".agent_scope.json",
        ".agent_trace.json",
        ".agent_snapshot.json",
        "PROGRESS.md",
        "DECISIONS.md",
        "SESSION_SNAPSHOT.md"
    }

    for f in modified_files:
        if f in METADATA_WHITELIST:
            continue
        # Check direct match or directory match
        matched = False
        for p in permitted:
            if f == p or f.startswith(p.rstrip("/") + "/"):
                matched = True
                break
        if not matched:
            violations.append(f)

    total_changed_lines = added_lines + removed_lines
    max_lines = scope.get("max_lines", 200)
    line_limit_exceeded = total_changed_lines > max_lines

    in_scope = (len(violations) == 0) and not line_limit_exceeded

    return {
        "active": True,
        "task": scope.get("task", ""),
        "in_scope": in_scope,
        "modified_files": modified_files,
        "permitted_files": list(permitted),
        "violations": violations,
        "added_lines": added_lines,
        "removed_lines": removed_lines,
        "total_lines": total_changed_lines,
        "max_lines": max_lines,
        "line_limit_exceeded": line_limit_exceeded
    }

def print_scope_status(result: Dict[str, Any]):
    print("=" * 65)
    print("       ANTIGRAVITY AGENT OS - SCOPE & BLAST-RADIUS AUDIT       ")
    print("=" * 65)
    if not result.get("active"):
        print("[INFO] No active scope contract declared.")
        print("       Declare a scope with: python scripts/agent_os.py scope set <task> <files...>")
        print("=" * 65)
        return

    print(f"Active Task:       {result.get('task')}")
    print(f"Permitted Files:   {', '.join(result.get('permitted_files', []))}")
    print(f"Lines Changed:     {result.get('total_lines')} / max {result.get('max_lines')} (+{result.get('added_lines')}, -{result.get('removed_lines')})")
    print("-" * 65)

    if result.get("in_scope"):
        print("[PASS] Diff strictly satisfies scope contract.")
    else:
        if result.get("violations"):
            print("[FAIL - P1] Scope Creep Detected! Unauthorized files modified:")
            for v in result["violations"]:
                print(f"  * {v}")
        if result.get("line_limit_exceeded"):
            print(f"[FAIL - P1] Line Budget Exceeded! {result.get('total_lines')} lines > limit of {result.get('max_lines')}")
    print("=" * 65)

def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/scope_guard.py <set|check|clear|status> [args...]")
        print("  set <task> <file1> [file2...] [--max-lines N]")
        print("  check [--diff <file>]")
        print("  clear")
        print("  status")
        sys.exit(1)

    cmd = sys.argv[1].lower()
    if cmd == "set":
        if len(sys.argv) < 4:
            print("Error: 'set' requires <task> and at least one <file>")
            sys.exit(1)
        task = sys.argv[2]
        files = []
        max_lines = 200
        idx = 3
        while idx < len(sys.argv):
            arg = sys.argv[idx]
            if arg == "--max-lines" and idx + 1 < len(sys.argv):
                max_lines = int(sys.argv[idx + 1])
                idx += 2
            else:
                files.append(arg)
                idx += 1
        res = set_scope(task, files, max_lines)
        print(f"[SUCCESS] Scope contract locked for task: '{task}'")
        print(f"Permitted files: {res['permitted_files']}")
        print(f"Max lines budget: {res['max_lines']}")
        sys.exit(0)

    elif cmd == "clear":
        if clear_scope():
            print("[SUCCESS] Active scope contract cleared.")
        else:
            print("[INFO] No active scope contract to clear.")
        sys.exit(0)

    elif cmd in ("check", "status"):
        diff_text = None
        if "--diff" in sys.argv:
            idx = sys.argv.index("--diff")
            if idx + 1 < len(sys.argv):
                diff_path = Path(sys.argv[idx + 1])
                if diff_path.is_file():
                    diff_text = diff_path.read_text(encoding="utf-8")
        res = check_scope(diff_text)
        print_scope_status(res)
        if res.get("active") and not res.get("in_scope"):
            sys.exit(1)
        sys.exit(0)
    else:
        print(f"Unknown scope command: '{cmd}'")
        sys.exit(1)

if __name__ == "__main__":
    main()
