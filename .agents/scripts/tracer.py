#!/usr/bin/env python3
"""
Scientific Debugging & Hypothesis Tracer (100X Power Suite).
Enforces the Scientific Method during complex debugging & architectural refactors:
1. Hypothesis: Formal proposition of root cause or expected behavior
2. Prediction: What observable outcome will prove/falsify it
3. Experiment: Executable test command and empirical result
4. Verdict: CONFIRMED / FALSIFIED / IN_PROGRESS
Stores persistent trace history in .agent_trace.json to eliminate circular debugging.
"""

import sys
import os
import json
import subprocess
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

WORKSPACE_ROOT = Path("D:/Skills/.agents")
TRACE_FILE = WORKSPACE_ROOT / ".agent_trace.json"

def load_traces() -> Dict[str, Any]:
    if not TRACE_FILE.exists():
        return {"current_investigation": None, "history": []}
    try:
        with open(TRACE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"current_investigation": None, "history": []}

def save_traces(data: Dict[str, Any]):
    with open(TRACE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def start_investigation(title: str):
    data = load_traces()
    inv = {
        "title": title,
        "started_at": datetime.now().isoformat(),
        "hypotheses": []
    }
    data["current_investigation"] = inv
    save_traces(data)
    print(f"[SUCCESS] Started new investigation: '{title}'")

def add_hypothesis(statement: str, prediction: str = ""):
    data = load_traces()
    inv = data.get("current_investigation")
    if not inv:
        print("[!] No active investigation. Starting default investigation.")
        start_investigation("General Engineering Investigation")
        data = load_traces()
        inv = data.get("current_investigation")

    hypo_id = len(inv["hypotheses"]) + 1
    hypo = {
        "id": hypo_id,
        "statement": statement,
        "prediction": prediction,
        "experiments": [],
        "status": "IN_PROGRESS",
        "verdict": None,
        "notes": ""
    }
    inv["hypotheses"].append(hypo)
    save_traces(data)
    print(f"[HYPOTHESIS #{hypo_id} RECORDED]: {statement}")
    if prediction:
        print(f"  Prediction: {prediction}")

def record_experiment(cmd: str, run_now: bool = False, passed: Optional[bool] = None, notes: str = ""):
    data = load_traces()
    inv = data.get("current_investigation")
    if not inv or not inv["hypotheses"]:
        print("[!] No active hypothesis found. Add a hypothesis first with 'hypo <text>'.")
        return

    active_hypo = inv["hypotheses"][-1]
    
    exit_code = 0
    cmd_output = ""
    if run_now:
        print(f"[*] Executing experiment: {cmd}...")
        res = subprocess.run(cmd, shell=True, text=True, cwd=WORKSPACE_ROOT)
        exit_code = res.returncode
        passed = (exit_code == 0)
    
    exp = {
        "timestamp": datetime.now().isoformat(),
        "command": cmd,
        "exit_code": exit_code,
        "passed": passed if passed is not None else True,
        "notes": notes
    }
    active_hypo["experiments"].append(exp)
    save_traces(data)
    
    status_str = "[PASS]" if exp["passed"] else "[FAIL]"
    print(f"{status_str} Experiment recorded for Hypothesis #{active_hypo['id']}: {cmd}")

def conclude_hypothesis(verdict: str, notes: str = ""):
    data = load_traces()
    inv = data.get("current_investigation")
    if not inv or not inv["hypotheses"]:
        print("[!] No active hypothesis to conclude.")
        return

    v_upper = verdict.upper()
    if v_upper not in ["CONFIRMED", "FALSIFIED", "ABANDONED"]:
        print(f"[!] Invalid verdict: '{verdict}'. Choose CONFIRMED, FALSIFIED, or ABANDONED.")
        return

    active_hypo = inv["hypotheses"][-1]
    active_hypo["status"] = "CONCLUDED"
    active_hypo["verdict"] = v_upper
    active_hypo["notes"] = notes
    save_traces(data)

    print(f"\n[VERDICT: {v_upper}] Hypothesis #{active_hypo['id']}: {active_hypo['statement']}")
    if notes:
        print(f"  Findings: {notes}")

def show_trace_log():
    data = load_traces()
    inv = data.get("current_investigation")
    print("=" * 65)
    print("      ANTIGRAVITY 100X ENGINE - SCIENTIFIC TRACE LOG       ")
    print("=" * 65)
    if not inv:
        print("No active investigation. Start one with 'tracer start <title>'.")
        print("=" * 65)
        return

    print(f"Active Investigation: {inv['title']} (Started {inv['started_at'][:19]})")
    print("-" * 65)
    for h in inv.get("hypotheses", []):
        verdict_tag = f"[{h['verdict']}]" if h['verdict'] else f"[{h['status']}]"
        print(f"Hypothesis #{h['id']} {verdict_tag}: {h['statement']}")
        if h['prediction']:
            print(f"  Prediction: {h['prediction']}")
        for exp in h.get("experiments", []):
            res_tag = "PASS" if exp['passed'] else "FAIL"
            print(f"    - Exp: ({res_tag}) {exp['command']} {exp.get('notes', '')}")
        if h.get("notes"):
            print(f"  Conclusion: {h['notes']}")
        print()
    print("=" * 65)

def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/tracer.py <start <title>|hypo <statement> [--pred <pred>]|exp <cmd> [--run]|conclude <verdict> [--notes <notes>]|log>")
        sys.exit(1)

    cmd = sys.argv[1].lower()
    if cmd == "start":
        title = " ".join(sys.argv[2:]) if len(sys.argv) > 2 else "New Investigation"
        start_investigation(title)
    elif cmd == "hypo":
        if len(sys.argv) < 3:
            print("Error: Specify hypothesis statement.")
            sys.exit(1)
        raw = " ".join(sys.argv[2:])
        pred = ""
        if "--pred" in raw:
            parts = raw.split("--pred", 1)
            raw = parts[0].strip()
            pred = parts[1].strip()
        add_hypothesis(raw, pred)
    elif cmd == "exp":
        if len(sys.argv) < 3:
            print("Error: Specify experiment command.")
            sys.exit(1)
        raw = " ".join(sys.argv[2:])
        run_now = "--run" in raw
        cmd_clean = raw.replace("--run", "").strip()
        record_experiment(cmd_clean, run_now=run_now)
    elif cmd == "conclude":
        if len(sys.argv) < 3:
            print("Error: Specify verdict (CONFIRMED/FALSIFIED/ABANDONED).")
            sys.exit(1)
        verdict = sys.argv[2]
        notes = " ".join(sys.argv[3:]) if len(sys.argv) > 3 else ""
        if notes.startswith("--notes"):
            notes = notes.replace("--notes", "").strip()
        conclude_hypothesis(verdict, notes)
    elif cmd == "log":
        show_trace_log()
    else:
        print(f"Unknown command: '{cmd}'. Available: start, hypo, exp, conclude, log")

if __name__ == "__main__":
    main()
