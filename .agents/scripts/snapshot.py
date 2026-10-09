#!/usr/bin/env python3
"""
Cognitive Memory & State Snapshot Engine (100X Power Suite).
Eliminates context compaction amnesia by capturing and restoring
high-density session state:
- Git branch, commit, dirty files, diff statistics
- Active scientific hypotheses & trace ledger
- Flight clearance status
- Immediate next actions
Stores persistent snapshot in .agent_snapshot.json and SESSION_SNAPSHOT.md.
"""

import sys
import os
import json
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Dict, Any

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

WORKSPACE_ROOT = Path("D:/Skills/.agents")
SNAPSHOT_JSON = WORKSPACE_ROOT / ".agent_snapshot.json"
SNAPSHOT_MD = WORKSPACE_ROOT / "SESSION_SNAPSHOT.md"

def freeze_session(label: str = "Active Working State") -> Dict[str, Any]:
    print("[*] Freezing cognitive state and active session snapshot...")
    
    # 1. Git State
    branch = "unknown"
    sha = "unknown"
    dirty_files = []
    diff_stat = ""
    try:
        branch = subprocess.check_output(["git", "branch", "--show-current"], cwd=WORKSPACE_ROOT, text=True).strip()
        sha = subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], cwd=WORKSPACE_ROOT, text=True).strip()
        status_out = subprocess.check_output(["git", "status", "--porcelain"], cwd=WORKSPACE_ROOT, text=True).strip()
        if status_out:
            dirty_files = sorted([line.strip() for line in status_out.splitlines()])
        diff_stat = subprocess.check_output(["git", "diff", "--stat"], cwd=WORKSPACE_ROOT, text=True).strip()
    except Exception as err:
        print(f"[!] Notice: Git status query failed during snapshot: {err}", file=sys.stderr)

    # 2. Active Traces
    active_trace = None
    trace_path = WORKSPACE_ROOT / ".agent_trace.json"
    if trace_path.exists():
        try:
            with open(trace_path, "r", encoding="utf-8") as f:
                trace_data = json.load(f)
                active_trace = trace_data.get("current_investigation")
        except Exception as err:
            print(f"[!] Notice: Failed to parse trace ledger during snapshot: {err}", file=sys.stderr)

    snapshot_data = {
        "active_trace": active_trace,
        "git": {
            "branch": branch,
            "commit": sha,
            "diff_stat": diff_stat,
            "dirty_files": dirty_files
        },
        "label": label,
        "timestamp": datetime.now().isoformat()
    }

    # Save JSON with deterministic key sorting and LF line endings
    json_text = json.dumps(snapshot_data, indent=2, sort_keys=True, ensure_ascii=False) + "\n"
    SNAPSHOT_JSON.write_text(json_text.replace("\r\n", "\n"), encoding="utf-8", newline="\n")

    # Generate Markdown
    md_lines = [
        f"# Session Cognitive Snapshot ({label})",
        f"- **Captured At**: {snapshot_data['timestamp']}",
        f"- **Git Status**: Branch `{branch}` at commit `[{sha}]`",
        f"- **Dirty Files**: {len(dirty_files)} modified/untracked file(s)",
        ""
    ]
    if dirty_files:
        md_lines.append("### Working Tree Diff State")
        for df in dirty_files:
            md_lines.append(f"- `{df}`")
        md_lines.append("")
    
    if diff_stat:
        md_lines.append("```text")
        md_lines.append(diff_stat)
        md_lines.append("```\n")

    if active_trace:
        md_lines.append(f"### Active Investigation: {active_trace.get('title')}")
        for h in active_trace.get("hypotheses", []):
            v_str = f"[{h.get('verdict')}]" if h.get("verdict") else f"[{h.get('status')}]"
            md_lines.append(f"- **Hypothesis #{h.get('id')} {v_str}**: {h.get('statement')}")
            if h.get("notes"):
                md_lines.append(f"  * Conclusion: {h.get('notes')}")
        md_lines.append("")

    md_content = "\n".join(md_lines).replace("\r\n", "\n") + "\n"
    SNAPSHOT_MD.write_text(md_content, encoding="utf-8", newline="\n")
    
    print(f"[SUCCESS] Cognitive state frozen successfully.")
    print(f"  - Machine: {SNAPSHOT_JSON}")
    print(f"  - Markdown: {SNAPSHOT_MD}")
    return snapshot_data

def restore_session():
    if not SNAPSHOT_JSON.exists():
        print("[!] No active session snapshot found. Run 'snapshot freeze' first.")
        return

    with open(SNAPSHOT_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)

    git = data.get("git", {})
    trace = data.get("active_trace", {})

    print("=" * 65)
    print("      ANTIGRAVITY 100X ENGINE - SESSION STATE RESUME        ")
    print("=" * 65)
    print(f"Snapshot Label:  {data.get('label')}")
    print(f"Captured:        {data.get('timestamp')[:19]}")
    print(f"Git Head:        Branch '{git.get('branch')}' at [{git.get('commit')}]")
    print(f"Uncommitted:     {len(git.get('dirty_files', []))} file(s)")
    print("-" * 65)

    if git.get("dirty_files"):
        print("Active Changes:")
        for df in git["dirty_files"][:5]:
            print(f"  * {df}")
        if len(git["dirty_files"]) > 5:
            print(f"  ... and {len(git['dirty_files']) - 5} more")

    if trace:
        print("\nActive Investigation:")
        print(f"  Title: {trace.get('title')}")
        for h in trace.get("hypotheses", []):
            v = h.get("verdict") or h.get("status")
            print(f"  * Hypo #{h.get('id')} [{v}]: {h.get('statement')[:70]}...")

    print("=" * 65)
    print("[READY] Cognitive context restored. Zero amnesia.")
    print("=" * 65)

def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/snapshot.py <freeze [label]|resume>")
        sys.exit(1)

    cmd = sys.argv[1].lower()
    if cmd == "freeze":
        label = " ".join(sys.argv[2:]) if len(sys.argv) > 2 else "Active Working State"
        freeze_session(label)
    elif cmd in ["resume", "restore"]:
        restore_session()
    else:
        print(f"Unknown command: '{cmd}'. Available: freeze [label], resume")

if __name__ == "__main__":
    main()
