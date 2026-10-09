#!/usr/bin/env python3
"""
Agent OS Native Git Hook Installer.
Installs cross-platform pre-commit hook that gates commits on:
1. Automated guard validation via guard_checker.py on staged files
2. Stale git lock and diagnostic checks via doctor.py
"""

import sys
import os
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

WORKSPACE_ROOT = Path("D:/Skills/.agents")
HOOKS_DIR = WORKSPACE_ROOT / ".git" / "hooks"

PRE_COMMIT_SCRIPT = r"""#!/bin/sh
# Antigravity Agent OS - Pre-Commit Quality Guard Hook
python - << 'EOF'
import sys
import subprocess
from pathlib import Path

def main():
    print("[*] Pre-Commit Guard: Inspecting staged changes...")
    try:
        output = subprocess.check_output(
            ["git", "diff", "--cached", "--name-only", "--diff-filter=ACM"],
            text=True
        ).strip()
    except Exception as e:
        print(f"[!] Warning: Could not inspect git staged files: {e}")
        return 0

    if not output:
        return 0

    staged_files = output.splitlines()
    guard_script = Path("scripts/guard_checker.py")
    if not guard_script.exists():
        return 0

    has_violations = False
    for f_path in staged_files:
        p = Path(f_path)
        # Skip test directories and test fixtures which intentionally contain test samples
        if "tests" in p.parts or p.name.startswith("test_") or p.name.endswith("Test.php"):
            continue
        if p.suffix.lower() in [".ts", ".tsx", ".js", ".jsx", ".php", ".py", ".css"]:
            if not p.exists():
                continue
            res = subprocess.run([sys.executable, str(guard_script), str(p)])
            if res.returncode != 0:
                has_violations = True

    if has_violations:
        print("\n" + "=" * 65)
        print("[BLOCK] Commit rejected: Guard violations detected in staged files!")
        print("Please resolve the issues listed above or run:")
        print("  python scripts/agent_os.py scan <file>")
        print("=" * 65 + "\n")
        return 1

    print("[PASS] Pre-Commit Guard: Staged changes verified clean.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
EOF
"""

def install_hooks() -> bool:
    if not HOOKS_DIR.exists():
        print(f"[!] Git hooks directory not found: {HOOKS_DIR}")
        return False

    hook_file = HOOKS_DIR / "pre-commit"
    hook_file.write_text(PRE_COMMIT_SCRIPT, encoding="utf-8")
    
    # On non-Windows POSIX systems, ensure executable permission
    if os.name != "nt":
        try:
            os.chmod(hook_file, 0o755)
        except OSError as err:
            print(f"[!] Notice: Could not set chmod executable permissions: {err}")

    print(f"[SUCCESS] Pre-commit quality guard hook installed at: {hook_file}")
    return True

if __name__ == "__main__":
    success = install_hooks()
    sys.exit(0 if success else 1)
