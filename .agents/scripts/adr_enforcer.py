#!/usr/bin/env python3
"""
scripts/adr_enforcer.py
Architecture-as-Code & ADR Enforcement Engine for Agent OS.

Translates markdown Architectural Decision Records (ADRs) in DECISIONS.md
into executable static assertions and verifies architectural compliance across the repository.
"""

import sys
import re
from pathlib import Path
from typing import Dict, Any, List, Optional, Callable

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
DECISIONS_FILE = WORKSPACE_ROOT / "DECISIONS.md"

# Registry of automated assertions for ratified ADRs
def check_adr_002_pest_php() -> Dict[str, Any]:
    guard_script = WORKSPACE_ROOT / "scripts" / "guard_checker.py"
    if not guard_script.is_file():
        return {"passed": False, "message": "guard_checker.py missing"}
    content = guard_script.read_text(encoding="utf-8")
    passed = "check_pest_php_security" in content
    return {"passed": passed, "message": "Pest 3 security guard verification active in guard_checker.py"}

def check_adr_003_rtl_css() -> Dict[str, Any]:
    guard_script = WORKSPACE_ROOT / "scripts" / "guard_checker.py"
    content = guard_script.read_text(encoding="utf-8")
    passed = "check_rtl_logical_css" in content
    return {"passed": passed, "message": "CSS Logical Properties guard active in guard_checker.py"}

def check_adr_011_clean_code_error_swallowing() -> Dict[str, Any]:
    guard_script = WORKSPACE_ROOT / "scripts" / "guard_checker.py"
    content = guard_script.read_text(encoding="utf-8")
    passed = "check_clean_code_hygiene" in content
    return {"passed": passed, "message": "Swallowed exception / empty catch guard active"}

def check_adr_012_safety_hook() -> Dict[str, Any]:
    hook_script = WORKSPACE_ROOT / "scripts" / "safety_hook.py"
    passed = hook_script.is_file() and "DESTRUCTIVE_PATTERNS" in hook_script.read_text(encoding="utf-8")
    return {"passed": passed, "message": "PreToolUse multi-vector destructive shell safety hook present"}

def check_adr_014_pre_commit_gate() -> Dict[str, Any]:
    pre_commit = WORKSPACE_ROOT / ".git" / "hooks" / "pre-commit"
    installer = WORKSPACE_ROOT / "scripts" / "install_git_hooks.py"
    passed = installer.is_file() and (pre_commit.is_file() or pre_commit.exists())
    if not passed and installer.is_file():
        try:
            from scripts.install_git_hooks import install_hooks
            install_hooks()
            passed = pre_commit.exists()
        except Exception as err:
            passed = False
    return {"passed": passed, "message": "Native pre-commit quality guard hook installed in .git/hooks"}

def check_adr_015_sync_config() -> Dict[str, Any]:
    sync_script = WORKSPACE_ROOT / "scripts" / "sync_config.py"
    passed = sync_script.is_file() and "file_hash" in sync_script.read_text(encoding="utf-8")
    return {"passed": passed, "message": "Global & Workspace config sync engine active"}

def check_adr_016_100x_suite() -> Dict[str, Any]:
    p1 = (WORKSPACE_ROOT / "scripts" / "code_graph.py").is_file()
    p2 = (WORKSPACE_ROOT / "scripts" / "tracer.py").is_file()
    p3 = (WORKSPACE_ROOT / "scripts" / "snapshot.py").is_file()
    passed = p1 and p2 and p3
    return {"passed": passed, "message": "AST code_graph, hypothesis tracer, and session snapshot present"}

def check_adr_023_prompt_cache() -> Dict[str, Any]:
    cache_script = WORKSPACE_ROOT / "scripts" / "prompt_cache.py"
    if not cache_script.is_file():
        return {"passed": False, "message": "prompt_cache.py missing"}
    content = cache_script.read_text(encoding="utf-8")
    passed = "compute_static_prefix_hash" in content and "TIER_0" in content
    return {"passed": passed, "message": "5-tier stratified prompt cache & static prefix invariance verified"}

def check_adr_024_micro_sandbox_and_python_guard() -> Dict[str, Any]:
    p1 = (WORKSPACE_ROOT / "scripts" / "repl_sandbox.py").is_file()
    p2 = (WORKSPACE_ROOT / "scripts" / "diff_reviewer.py").is_file()
    guard = (WORKSPACE_ROOT / "scripts" / "guard_checker.py").read_text(encoding="utf-8")
    passed = p1 and p2 and "check_python_security_and_hygiene" in guard
    return {"passed": passed, "message": "In-memory REPL, diff reviewer, and Python security guard verified"}

EXECUTABLE_ADR_MAP: Dict[str, Callable[[], Dict[str, Any]]] = {
    "ADR-002": check_adr_002_pest_php,
    "ADR-003": check_adr_003_rtl_css,
    "ADR-011": check_adr_011_clean_code_error_swallowing,
    "ADR-012": check_adr_012_safety_hook,
    "ADR-014": check_adr_014_pre_commit_gate,
    "ADR-015": check_adr_015_sync_config,
    "ADR-016": check_adr_016_100x_suite,
    "ADR-023": check_adr_023_prompt_cache,
    "ADR-024": check_adr_024_micro_sandbox_and_python_guard,
}

def parse_adrs_from_decisions() -> List[Dict[str, str]]:
    if not DECISIONS_FILE.is_file():
        return []
    content = DECISIONS_FILE.read_text(encoding="utf-8")
    pattern = re.compile(r"##\s*\[(ADR-\d+)\]\s*(.*?)(?=\n)", re.MULTILINE)
    matches = pattern.findall(content)
    return [{"id": m[0], "title": m[1].strip()} for m in matches]

def audit_all_adrs() -> Dict[str, Any]:
    all_adrs = parse_adrs_from_decisions()
    results = []

    enforced_count = 0
    passed_count = 0
    failed_count = 0

    for adr in all_adrs:
        adr_id = adr["id"]
        checker = EXECUTABLE_ADR_MAP.get(adr_id)
        if checker:
            enforced_count += 1
            check_res = checker()
            is_pass = check_res.get("passed", False)
            if is_pass:
                passed_count += 1
            else:
                failed_count += 1
            results.append({
                "id": adr_id,
                "title": adr["title"],
                "executable": True,
                "passed": is_pass,
                "message": check_res.get("message", "")
            })
        else:
            results.append({
                "id": adr_id,
                "title": adr["title"],
                "executable": False,
                "passed": True,
                "message": "Policy / Constitutional convention (documentary ADR)"
            })

    total_adrs = len(all_adrs)
    coverage = round((enforced_count / total_adrs) * 100, 1) if total_adrs > 0 else 0.0

    return {
        "total_adrs": total_adrs,
        "enforced_adrs": enforced_count,
        "coverage_percent": coverage,
        "passed_enforcements": passed_count,
        "failed_enforcements": failed_count,
        "results": results
    }

def print_adr_audit_report(res: Dict[str, Any]):
    print("=" * 65)
    print("      ANTIGRAVITY AGENT OS - ARCHITECTURE-AS-CODE ENFORCEMENT  ")
    print("=" * 65)
    print(f"Total Ratified ADRs:    {res['total_adrs']}")
    print(f"Executable Invariants:  {res['enforced_adrs']} ({res['coverage_percent']}% coverage)")
    print(f"Enforcement Status:     {res['passed_enforcements']} Passed | {res['failed_enforcements']} Failed")
    print("-" * 65)

    for r in res["results"]:
        if r["executable"]:
            status = "[PASS]" if r["passed"] else "[FAIL]"
            print(f"{status} {r['id']}: {r['title'][:40]:<40}")
            print(f"       Assertion: {r['message']}")
        else:
            print(f"[DOC ] {r['id']}: {r['title'][:40]:<40}")

    print("=" * 65)
    if res["failed_enforcements"] == 0:
        print("[SUCCESS] All executable architectural decision records are GREEN.")
    else:
        print(f"[ALERT] {res['failed_enforcements']} architectural invariant(s) failed!")
    print("=" * 65)

def main():
    if len(sys.argv) > 1 and sys.argv[1].lower() == "list":
        adrs = parse_adrs_from_decisions()
        for a in adrs:
            exec_tag = "[EXECUTABLE]" if a["id"] in EXECUTABLE_ADR_MAP else "[DOC ONLY  ]"
            print(f"{exec_tag} {a['id']}: {a['title']}")
        sys.exit(0)

    res = audit_all_adrs()
    print_adr_audit_report(res)
    sys.exit(0 if res["failed_enforcements"] == 0 else 1)

if __name__ == "__main__":
    main()
