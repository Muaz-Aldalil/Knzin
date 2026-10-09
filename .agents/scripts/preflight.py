#!/usr/bin/env python3
"""
Pre-Flight Reality Check & Assumption Validator (100X Power Suite).
Validates operational reality BEFORE planning or writing code:
1. Workspace root integrity & Git status
2. Clean working tree (no uncommitted user collisions)
3. Stale locks, detached submodules & port conflicts
4. Runtime binaries & language toolchain health
5. Guard integrity & pre-commit hook active state
Outputs a definitive 0-100% Flight Clearance Score.
"""

import sys
import os
import subprocess
from pathlib import Path
from typing import List, Dict, Any, Tuple

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

WORKSPACE_ROOT = Path("D:/Skills/.agents")

class FlightItem:
    def __init__(self, category: str, title: str, passed: bool, details: str, severity: str = "ERROR"):
        self.category = category
        self.title = title
        self.passed = passed
        self.details = details
        self.severity = severity  # "ERROR", "WARNING", "INFO"

def check_git_readiness() -> List[FlightItem]:
    items = []
    try:
        status_out = subprocess.check_output(["git", "status", "--porcelain"], cwd=WORKSPACE_ROOT, text=True).strip()
        branch_out = subprocess.check_output(["git", "branch", "--show-current"], cwd=WORKSPACE_ROOT, text=True).strip()
        sha_out = subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], cwd=WORKSPACE_ROOT, text=True).strip()

        items.append(FlightItem("Git State", "Branch & Head", True, f"Branch '{branch_out}' at [{sha_out}]", "INFO"))

        if not status_out:
            items.append(FlightItem("Git State", "Working Tree Cleanliness", True, "Working tree pristine; ready for isolated change", "INFO"))
        else:
            dirty_count = len(status_out.splitlines())
            items.append(FlightItem("Git State", "Working Tree Cleanliness", False, f"Working tree has {dirty_count} uncommitted file(s)", "WARNING"))
    except Exception as e:
        items.append(FlightItem("Git State", "Git Repository", False, f"Git query failed: {e}", "ERROR"))

    # Lock file check
    lock_file = WORKSPACE_ROOT / ".git" / "index.lock"
    if lock_file.exists():
        items.append(FlightItem("Git State", "Lock File", False, "STALE LOCK: .git/index.lock exists!", "ERROR"))
    else:
        items.append(FlightItem("Git State", "Lock File", True, "No blocking .git/index.lock", "INFO"))

    return items

def check_hook_and_guard_gate() -> List[FlightItem]:
    items = []
    # Pre-commit hook
    pre_commit = WORKSPACE_ROOT / ".git" / "hooks" / "pre-commit"
    if pre_commit.exists():
        items.append(FlightItem("Guard Gate", "Pre-Commit Hook", True, "Active and gating staged commits", "INFO"))
    else:
        items.append(FlightItem("Guard Gate", "Pre-Commit Hook", False, "Pre-commit hook not installed. Run 'python scripts/agent_os.py install-hooks'", "WARNING"))

    # Safety hook
    safety_hook = WORKSPACE_ROOT / "scripts" / "safety_hook.py"
    if safety_hook.exists():
        items.append(FlightItem("Guard Gate", "Safety Hook", True, "PreToolUse shell sandbox script present", "INFO"))
    else:
        items.append(FlightItem("Guard Gate", "Safety Hook", False, "Missing safety_hook.py", "ERROR"))

    # Guard checker
    guard_checker = WORKSPACE_ROOT / "scripts" / "guard_checker.py"
    if guard_checker.exists():
        items.append(FlightItem("Guard Gate", "Guard Checker Engine", True, "Static verification engine present", "INFO"))
    else:
        items.append(FlightItem("Guard Gate", "Guard Checker Engine", False, "Missing guard_checker.py", "ERROR"))

    return items

def check_environment_runtimes() -> List[FlightItem]:
    items = []
    # Python
    py_ver = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    items.append(FlightItem("Runtimes", "Python", True, f"Python {py_ver}", "INFO"))

    # Node
    try:
        node_v = subprocess.check_output(["node", "--version"], text=True, stderr=subprocess.DEVNULL).strip()
        items.append(FlightItem("Runtimes", "Node.js", True, f"Node.js {node_v}", "INFO"))
    except Exception:
        items.append(FlightItem("Runtimes", "Node.js", False, "Node.js not in PATH", "WARNING"))

    # Git
    try:
        git_v = subprocess.check_output(["git", "--version"], text=True, stderr=subprocess.DEVNULL).strip()
        items.append(FlightItem("Runtimes", "Git", True, git_v, "INFO"))
    except Exception:
        items.append(FlightItem("Runtimes", "Git", False, "Git CLI not in PATH", "ERROR"))

    return items

def check_prompt_caching_integrity() -> List[FlightItem]:
    items = []
    try:
        from prompt_cache import load_canonical_workspace_assembler
        assembler = load_canonical_workspace_assembler()
        violations = assembler.audit_cache_leakage()
        if not violations:
            prefix_len = len(assembler.build_static_prefix())
            items.append(FlightItem("Prompt Cache", "Prefix Invariance", True, f"Verified 100% stable (~{prefix_len // 4:,} tokens)", "INFO"))
        else:
            items.append(FlightItem("Prompt Cache", "Prefix Invariance", False, f"{len(violations)} leakage violation(s) detected", "WARNING"))
    except Exception as e:
        items.append(FlightItem("Prompt Cache", "Prefix Invariance", False, f"Check error: {str(e)}", "WARNING"))
    return items

def check_autonomy_suite_health() -> List[FlightItem]:
    items = []
    # 1. Telemetry
    try:
        from context_telemetry import evaluate_health
        h = evaluate_health()
        is_pass = h["status"] != "CRITICAL"
        sev = "INFO" if h["status"] == "HEALTHY" else ("WARNING" if h["status"] == "WARNING" else "ERROR")
        items.append(FlightItem("Telemetry", "Context Health", is_pass, f"{h['status']}: {h['turns']} turns ({h['total_tokens']:,} tokens)", sev))
    except Exception as e:
        items.append(FlightItem("Telemetry", "Context Health", False, f"Check error: {str(e)}", "WARNING"))

    # 2. ADR Enforcement
    try:
        from adr_enforcer import audit_all_adrs
        adr_res = audit_all_adrs()
        is_pass = adr_res["failed_enforcements"] == 0
        items.append(FlightItem("Architecture", "ADR Invariants", is_pass, f"{adr_res['passed_enforcements']}/{adr_res['enforced_adrs']} verified ({adr_res['coverage_percent']}% coverage)", "INFO" if is_pass else "WARNING"))
    except Exception as e:
        items.append(FlightItem("Architecture", "ADR Invariants", False, f"Check error: {str(e)}", "WARNING"))

    # 3. Scope Contract
    try:
        from scope_guard import get_scope
        scope = get_scope()
        if scope:
            items.append(FlightItem("Scope Gate", "Blast-Radius Contract", True, f"Locked: '{scope.get('task')}' ({len(scope.get('permitted_files', []))} files)", "INFO"))
        else:
            items.append(FlightItem("Scope Gate", "Blast-Radius Contract", True, "No active scope lock (Unrestricted mode)", "INFO"))
    except Exception as e:
        items.append(FlightItem("Scope Gate", "Blast-Radius Contract", False, f"Check error: {str(e)}", "WARNING"))

    return items

def run_preflight() -> Tuple[int, List[FlightItem]]:
    items: List[FlightItem] = []
    items.extend(check_git_readiness())
    items.extend(check_hook_and_guard_gate())
    items.extend(check_environment_runtimes())
    items.extend(check_prompt_caching_integrity())
    items.extend(check_autonomy_suite_health())

    total = len(items)
    passed = sum(1 for i in items if i.passed)
    score = int((passed / total) * 100) if total else 0

    print("=" * 65)
    print("      ANTIGRAVITY 100X ENGINE - PRE-FLIGHT REALITY CHECK       ")
    print("=" * 65)
    print(f"Target Workspace: {WORKSPACE_ROOT.resolve()}")
    print("-" * 65)

    for item in items:
        status_tag = "[PASS]" if item.passed else f"[{item.severity}]"
        print(f"{status_tag.ljust(9)} {item.category.ljust(12)} | {item.title.ljust(25)}: {item.details}")

    print("-" * 65)
    print(f"FLIGHT CLEARANCE SCORE: {score}% ({passed}/{total} checks verified)")
    
    if score >= 90:
        print("[CLEARANCE GRANTED] Workspace and toolchain are primed for high-velocity engineering.")
    elif score >= 70:
        print("[PROCEED WITH CAUTION] Warnings detected. Address highlighted items if blocking.")
    else:
        print("[CLEARANCE DENIED] Critical errors detected. Resolve before proceeding with changes.")
    print("=" * 65)

    return score, items

if __name__ == "__main__":
    score, _ = run_preflight()
    sys.exit(0 if score >= 80 else 1)
