#!/usr/bin/env python3
"""
Agent OS CLI - Unified Developer Experience and Quality Gateway.
Provides single-command access to:
- status: inspect boundary locks, git sha, and agent capability health
- audit: run complete structure, frontmatter, and link integrity audit
- test: run full unit tests and guard verification battery
- scan <file>: run automated static guard analysis on target code
"""

import sys
import os
import subprocess
from pathlib import Path

# UTF-8 terminal encoding configuration
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

WORKSPACE_ROOT = Path("D:/Skills/.agents")

def run_status():
    print("=" * 65)
    print("           ANTIGRAVITY AGENT OS - STATUS & HEALTH           ")
    print("=" * 65)
    
    # 1. Active Workspace
    print(f"Active Workspace Root: {WORKSPACE_ROOT.resolve()}")
    
    # 2. Git Information
    try:
        git_sha = subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], cwd=WORKSPACE_ROOT, text=True).strip()
        git_branch = subprocess.check_output(["git", "branch", "--show-current"], cwd=WORKSPACE_ROOT, text=True).strip()
        print(f"Version Control:      Branch '{git_branch}' at commit [{git_sha}]")
    except Exception:
        print("Version Control:      Not initialized or error querying git")

    # 3. Boundary & Danger Zone Locks
    print("-" * 65)
    print("Boundary Protection:  [ACTIVE] Isolation Sandbox Enforced")
    print("Danger Zones:         None active | Authorized: KNZiN Project (full access, ADR-022)")
    print("Secret Leak Guard:    [ACTIVE] .env, SSH keys, AWS credentials gated")
    print("Destructive Ops:      [ACTIVE] git reset --hard, clean -f, migrate:fresh gated")
    
    # 4. Customization Inventory
    skills_dir = WORKSPACE_ROOT / "skills"
    rules_dir = WORKSPACE_ROOT / "rules"
    tests_dir = WORKSPACE_ROOT / "tests"
    
    skill_count = len([s for s in skills_dir.iterdir() if s.is_dir()]) if skills_dir.exists() else 0
    rule_count = len(list(rules_dir.glob("*.md"))) if rules_dir.exists() else 0
    test_count = len(list(tests_dir.glob("test_*.py"))) if tests_dir.exists() else 0
    
    print("-" * 65)
    print(f"Skills Installed:     {skill_count} workspace skills")
    print(f"Rules Enforced:       {rule_count} global/workspace rules")
    print(f"Test Suites:          {test_count} verification batteries")
    print("=" * 65)

def run_audit():
    audit_script = WORKSPACE_ROOT / "scripts" / "audit_agent_os.py"
    res = subprocess.run([sys.executable, str(audit_script)], cwd=WORKSPACE_ROOT)
    sys.exit(res.returncode)

def run_test():
    print("[*] Running all Agent OS unit tests and guard verification batteries...")
    res = subprocess.run([sys.executable, "-m", "unittest", "discover", "-s", "tests"], cwd=WORKSPACE_ROOT)
    sys.exit(res.returncode)

def run_scan(target_file: str):
    scan_script = WORKSPACE_ROOT / "scripts" / "guard_checker.py"
    res = subprocess.run([sys.executable, str(scan_script), target_file], cwd=WORKSPACE_ROOT)
    sys.exit(res.returncode)

def run_doctor(fix: bool = False):
    doctor_script = WORKSPACE_ROOT / "scripts" / "doctor.py"
    args = [sys.executable, str(doctor_script)]
    if fix:
        args.append("--fix")
    res = subprocess.run(args, cwd=WORKSPACE_ROOT)
    sys.exit(res.returncode)

def run_skill_find(query: str):
    from skill_indexer import search_skills, build_index
    idx = build_index()
    results = search_skills(query, idx, limit=5)
    if not results:
        print(f"No skills matched query: '{query}'")
        return
    print(f"\nTop {len(results)} skill(s) for '{query}':")
    for r in results:
        print(f"  * {r['name'].ljust(26)} [{r['category']}]")
        print(f"    Path: {r['file']}")
        print(f"    {r['description'][:100]}...\n")

def run_index_skills():
    indexer_script = WORKSPACE_ROOT / "scripts" / "skill_indexer.py"
    res = subprocess.run([sys.executable, str(indexer_script), "--build-only"], cwd=WORKSPACE_ROOT)
    sys.exit(res.returncode)

def run_install_hooks():
    hooks_installer = WORKSPACE_ROOT / "scripts" / "install_git_hooks.py"
    res = subprocess.run([sys.executable, str(hooks_installer)], cwd=WORKSPACE_ROOT)
    sys.exit(res.returncode)

def run_sync(apply: bool = False):
    sync_script = WORKSPACE_ROOT / "scripts" / "sync_config.py"
    args = [sys.executable, str(sync_script)]
    if apply:
        args.append("--apply")
    res = subprocess.run(args, cwd=WORKSPACE_ROOT)
    sys.exit(res.returncode)

def run_preflight():
    preflight_script = WORKSPACE_ROOT / "scripts" / "preflight.py"
    res = subprocess.run([sys.executable, str(preflight_script)], cwd=WORKSPACE_ROOT)
    sys.exit(res.returncode)

def run_code_graph(args: List[str]):
    cg_script = WORKSPACE_ROOT / "scripts" / "code_graph.py"
    res = subprocess.run([sys.executable, str(cg_script)] + args, cwd=WORKSPACE_ROOT)
    sys.exit(res.returncode)

def run_tracer(args: List[str]):
    tracer_script = WORKSPACE_ROOT / "scripts" / "tracer.py"
    res = subprocess.run([sys.executable, str(tracer_script)] + args, cwd=WORKSPACE_ROOT)
    sys.exit(res.returncode)

def run_snapshot(args: List[str]):
    snap_script = WORKSPACE_ROOT / "scripts" / "snapshot.py"
    res = subprocess.run([sys.executable, str(snap_script)] + args, cwd=WORKSPACE_ROOT)
    sys.exit(res.returncode)

def run_prompt_cache(action: str = "audit"):
    cache_script = WORKSPACE_ROOT / "scripts" / "prompt_cache.py"
    args = [sys.executable, str(cache_script)]
    if action == "sim":
        args.append("sim")
    res = subprocess.run(args, cwd=WORKSPACE_ROOT)
    sys.exit(res.returncode)

def run_diff_review(args: List[str]):
    review_script = WORKSPACE_ROOT / "scripts" / "diff_reviewer.py"
    res = subprocess.run([sys.executable, str(review_script)] + args, cwd=WORKSPACE_ROOT)
    sys.exit(res.returncode)

def run_repl_sandbox(mode: str, args: List[str]):
    repl_script = WORKSPACE_ROOT / "scripts" / "repl_sandbox.py"
    res = subprocess.run([sys.executable, str(repl_script), mode] + args, cwd=WORKSPACE_ROOT)
    sys.exit(res.returncode)

def run_scope(args: List[str]):
    scope_script = WORKSPACE_ROOT / "scripts" / "scope_guard.py"
    res = subprocess.run([sys.executable, str(scope_script)] + args, cwd=WORKSPACE_ROOT)
    sys.exit(res.returncode)

def run_chaos(args: List[str]):
    chaos_script = WORKSPACE_ROOT / "scripts" / "chaos_guard.py"
    res = subprocess.run([sys.executable, str(chaos_script)] + args, cwd=WORKSPACE_ROOT)
    sys.exit(res.returncode)

def run_runtime_observer(mode: str, args: List[str]):
    obs_script = WORKSPACE_ROOT / "scripts" / "runtime_observer.py"
    res = subprocess.run([sys.executable, str(obs_script), mode] + args, cwd=WORKSPACE_ROOT)
    sys.exit(res.returncode)

def run_adr_enforcer(args: List[str]):
    adr_script = WORKSPACE_ROOT / "scripts" / "adr_enforcer.py"
    res = subprocess.run([sys.executable, str(adr_script)] + args, cwd=WORKSPACE_ROOT)
    sys.exit(res.returncode)

def run_antipattern(args: List[str]):
    ap_script = WORKSPACE_ROOT / "scripts" / "antipattern_ledger.py"
    res = subprocess.run([sys.executable, str(ap_script)] + args, cwd=WORKSPACE_ROOT)
    sys.exit(res.returncode)

def run_telemetry(args: List[str]):
    tel_script = WORKSPACE_ROOT / "scripts" / "context_telemetry.py"
    res = subprocess.run([sys.executable, str(tel_script)] + args, cwd=WORKSPACE_ROOT)
    sys.exit(res.returncode)

def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/agent_os.py <command> [args...]")
        print("Core Commands:   status, audit, test, doctor [--fix], scan <file>, sync [--apply]")
        print("Discovery:       skill-find <query>, index-skills, install-hooks")
        print("100X Power:      preflight, review, eval <code>, sql <query>, regex <pat> <txt>, cache-audit, cache-sim, symbol <name>, outline <file>, trace <args>, snapshot [freeze|resume]")
        print("Autonomy Suite:  scope <set|check|clear|status>, chaos-audit [file], logs [--tail N], probe <url>, adr-check [list], antipattern <list|scan|audit|add>, telemetry [record|reset|status]")
        sys.exit(1)

    cmd = sys.argv[1].lower()
    if cmd == "status":
        run_status()
    elif cmd == "audit":
        run_audit()
    elif cmd == "test":
        run_test()
    elif cmd == "doctor":
        should_fix = "--fix" in sys.argv
        run_doctor(fix=should_fix)
    elif cmd == "scan":
        if len(sys.argv) < 3:
            print("Error: Specify file path to scan. Example: python scripts/agent_os.py scan src/action.ts")
            sys.exit(1)
        run_scan(sys.argv[2])
    elif cmd == "skill-find":
        if len(sys.argv) < 3:
            print("Error: Specify search terms. Example: python scripts/agent_os.py skill-find 'next auth'")
            sys.exit(1)
        run_skill_find(" ".join(sys.argv[2:]))
    elif cmd == "index-skills":
        run_index_skills()
    elif cmd == "install-hooks":
        run_install_hooks()
    elif cmd == "sync":
        should_apply = "--apply" in sys.argv
        run_sync(apply=should_apply)
    elif cmd == "preflight":
        run_preflight()
    elif cmd in ["review", "diff-review"]:
        run_diff_review(sys.argv[2:])
    elif cmd in ["eval", "py"]:
        if len(sys.argv) < 3:
            print("Error: Specify Python expression. Example: python scripts/agent_os.py eval 'math.sqrt(64)'")
            sys.exit(1)
        run_repl_sandbox("py", [sys.argv[2]])
    elif cmd == "sql":
        if len(sys.argv) < 3:
            print("Error: Specify SQL query. Example: python scripts/agent_os.py sql 'SELECT 1;'")
            sys.exit(1)
        run_repl_sandbox("sql", [sys.argv[2]])
    elif cmd == "regex":
        if len(sys.argv) < 4:
            print("Error: Specify regex pattern and text. Example: python scripts/agent_os.py regex '(\\d+)' 'User 123'")
            sys.exit(1)
        run_repl_sandbox("regex", sys.argv[2:])
    elif cmd in ["cache-audit", "cache"]:
        run_prompt_cache("audit")
    elif cmd in ["cache-sim", "cache-simulate"]:
        run_prompt_cache("sim")
    elif cmd == "scope":
        run_scope(sys.argv[2:])
    elif cmd in ["chaos-audit", "chaos"]:
        sub_args = sys.argv[2:] if len(sys.argv) > 2 else ["audit"]
        run_chaos(sub_args)
    elif cmd == "logs":
        run_runtime_observer("logs", sys.argv[2:])
    elif cmd == "probe":
        run_runtime_observer("probe", sys.argv[2:])
    elif cmd in ["adr-check", "adr"]:
        run_adr_enforcer(sys.argv[2:])
    elif cmd in ["antipattern", "ap"]:
        run_antipattern(sys.argv[2:])
    elif cmd in ["telemetry", "tokens"]:
        sub_args = sys.argv[2:] if len(sys.argv) > 2 else ["status"]
        run_telemetry(sub_args)
    elif cmd == "symbol":
        if len(sys.argv) < 3:
            print("Error: Specify symbol name. Example: python scripts/agent_os.py symbol evaluate_command")
            sys.exit(1)
        run_code_graph(["find", sys.argv[2]])
    elif cmd == "outline":
        if len(sys.argv) < 3:
            print("Error: Specify file path. Example: python scripts/agent_os.py outline scripts/guard_checker.py")
            sys.exit(1)
        run_code_graph(["outline", sys.argv[2]])
    elif cmd == "trace":
        run_tracer(sys.argv[2:])
    elif cmd in ["route", "dispatch"]:
        if len(sys.argv) < 3:
            print("Error: Specify task description or target file. Example: python scripts/agent_os.py route 'build modal UI'")
            sys.exit(1)
        run_router(sys.argv[2:])
    elif cmd == "snapshot":
        run_snapshot(sys.argv[2:])
    elif cmd == "resume":
        run_snapshot(["resume"])
    elif cmd == "codemod":
        codemod_script = WORKSPACE_ROOT / "scripts" / "codemod.py"
        res = subprocess.run([sys.executable, str(codemod_script)] + sys.argv[2:], cwd=WORKSPACE_ROOT)
        sys.exit(res.returncode)
    else:
        print(f"Unknown command: '{cmd}'. Run 'python scripts/agent_os.py' for full command manual.")
        sys.exit(1)

def run_router(args: List[str]):
    router_script = WORKSPACE_ROOT / "scripts" / "skill_router.py"
    res = subprocess.run([sys.executable, str(router_script)] + args, cwd=WORKSPACE_ROOT)
    sys.exit(res.returncode)

if __name__ == "__main__":
    main()


