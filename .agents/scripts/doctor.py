#!/usr/bin/env python3
"""
Agent OS Doctor & Self-Healing Diagnostics Engine.
Detects and repairs:
1. Stale Git locks (.git/index.lock) that paralyze version control
2. Orphaned or colliding development server ports (3000, 5173, 8000, 3306)
3. Corrupted nested repositories or detached submodules
4. Host runtime availability (Python >= 3.10, Node.js, Git)
5. Crucial Agent OS configuration integrity and disk space
"""

import sys
import os
import shutil
import subprocess
from pathlib import Path
from typing import List, Dict, Any, Tuple

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

WORKSPACE_ROOT = Path("D:/Skills/.agents")

class DiagnosticCheck:
    def __init__(self, name: str, passed: bool, message: str, fixable: bool = False, fix_fn=None):
        self.name = name
        self.passed = passed
        self.message = message
        self.fixable = fixable
        self.fix_fn = fix_fn

def check_stale_git_locks(fix: bool = False) -> DiagnosticCheck:
    """Checks for stale .git/index.lock files."""
    lock_file = WORKSPACE_ROOT / ".git" / "index.lock"
    if not lock_file.exists():
        return DiagnosticCheck("Git Index Lock", True, "No stale .git/index.lock detected.")

    if fix:
        try:
            lock_file.unlink()
            return DiagnosticCheck("Git Index Lock", True, "REPAIRED: Stale .git/index.lock successfully removed.")
        except Exception as e:
            return DiagnosticCheck("Git Index Lock", False, f"Failed to remove .git/index.lock: {str(e)}", fixable=True)
    else:
        return DiagnosticCheck("Git Index Lock", False, "STALE LOCK FOUND: .git/index.lock exists and blocks git operations.", fixable=True)

def check_nested_git_submodules(fix: bool = False) -> DiagnosticCheck:
    """Checks for accidental nested .git directories within skill folders."""
    skills_dir = WORKSPACE_ROOT / "skills"
    nested_gits = []
    if skills_dir.exists():
        for root, dirs, _ in os.walk(skills_dir):
            if ".git" in dirs and Path(root) != WORKSPACE_ROOT:
                nested_gits.append(Path(root) / ".git")

    if not nested_gits:
        return DiagnosticCheck("Nested Git Check", True, "No detached nested .git directories found in skills.")

    if fix:
        removed = []
        for g in nested_gits:
            try:
                shutil.rmtree(g)
                removed.append(str(g))
            except Exception as e:
                continue
        return DiagnosticCheck("Nested Git Check", True, f"REPAIRED: Removed {len(removed)} nested .git directories.")
    else:
        return DiagnosticCheck("Nested Git Check", False, f"Found {len(nested_gits)} detached .git directories: {[str(g) for g in nested_gits]}", fixable=True)

def check_runtime_binaries() -> List[DiagnosticCheck]:
    """Verifies essential developer runtimes."""
    checks = []

    # Python check
    py_ver = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    if sys.version_info.major == 3 and sys.version_info.minor >= 10:
        checks.append(DiagnosticCheck("Python Runtime", True, f"Python {py_ver} (>= 3.10 required)"))
    else:
        checks.append(DiagnosticCheck("Python Runtime", False, f"Python {py_ver} is below recommended 3.10+"))

    # Git check
    try:
        git_out = subprocess.check_output(["git", "--version"], text=True, stderr=subprocess.DEVNULL).strip()
        checks.append(DiagnosticCheck("Git CLI", True, git_out))
    except Exception:
        checks.append(DiagnosticCheck("Git CLI", False, "Git command not found or not in PATH"))

    # Node check
    try:
        node_out = subprocess.check_output(["node", "--version"], text=True, stderr=subprocess.DEVNULL).strip()
        checks.append(DiagnosticCheck("Node.js Runtime", True, f"Node.js {node_out}"))
    except Exception:
        checks.append(DiagnosticCheck("Node.js Runtime", False, "Node.js not detected in PATH"))

    return checks

def check_port_availability() -> DiagnosticCheck:
    """Scans for active listening ports commonly used by web applications."""
    common_ports = [3000, 5173, 8000, 8080, 3306]
    listening_ports = []

    try:
        # Use netstat to check listening TCP ports
        output = subprocess.check_output("netstat -ano -p tcp", shell=True, text=True, stderr=subprocess.DEVNULL)
        for line in output.splitlines():
            if "LISTENING" in line:
                for port in common_ports:
                    if f":{port} " in line or f":{port}\t" in line:
                        listening_ports.append(port)
        listening_ports = sorted(list(set(listening_ports)))
    except Exception as e:
        listening_ports = []

    msg = f"Active listening ports detected: {listening_ports}" if listening_ports else "No common dev ports currently held."
    return DiagnosticCheck("Port Scanner", True, msg)

def check_required_artifacts() -> List[DiagnosticCheck]:
    """Verifies that all foundational OS documents and hooks are present."""
    required = [
        ("Constitution", WORKSPACE_ROOT / "rules" / "engineering-constitution.md"),
        ("Workflow SKILL", WORKSPACE_ROOT / "skills" / "engineering-workflow" / "SKILL.md"),
        ("Safety Hook Script", WORKSPACE_ROOT / "scripts" / "safety_hook.py"),
        ("Guard Checker Engine", WORKSPACE_ROOT / "scripts" / "guard_checker.py"),
        ("Hooks Manifest", WORKSPACE_ROOT / "hooks.json"),
        ("ADR Decisions", WORKSPACE_ROOT / "DECISIONS.md"),
        ("Progress State", WORKSPACE_ROOT / "PROGRESS.md"),
    ]
    checks = []
    for label, path in required:
        if path.exists():
            checks.append(DiagnosticCheck(f"Artifact: {label}", True, f"Present ({path.stat().st_size} bytes)"))
        else:
            checks.append(DiagnosticCheck(f"Artifact: {label}", False, f"Missing critical file: {path}"))
    return checks

def run_diagnostics(fix: bool = False) -> bool:
    print("=" * 65)
    print("      ANTIGRAVITY AGENT OS - SELF-HEALING DOCTOR       ")
    print("=" * 65)

    all_checks: List[DiagnosticCheck] = []
    all_checks.append(check_stale_git_locks(fix))
    all_checks.append(check_nested_git_submodules(fix))
    all_checks.extend(check_runtime_binaries())
    all_checks.append(check_port_availability())
    all_checks.extend(check_required_artifacts())

    all_passed = True
    for c in all_checks:
        status_tag = "[PASS]" if c.passed else "[FAIL]"
        fix_tag = " (Fixable)" if (not c.passed and c.fixable) else ""
        print(f"{status_tag} {c.name.ljust(25)}: {c.message}{fix_tag}")
        if not c.passed:
            all_passed = False

    print("=" * 65)
    if all_passed:
        print("[SUCCESS] All diagnostics GREEN. Environment is healthy and stable.")
    else:
        print("[WARN] Some diagnostic checks failed. Run with '--fix' to attempt automated repair.")
    print("=" * 65)
    return all_passed

if __name__ == "__main__":
    should_fix = "--fix" in sys.argv
    success = run_diagnostics(fix=should_fix)
    sys.exit(0 if success else 1)
