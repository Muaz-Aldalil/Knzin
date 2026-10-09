#!/usr/bin/env python3
"""
PreToolUse Safety Hook for Antigravity Agent.
Intercepts run_command tool calls to enforce:
1. Workspace Boundary & Danger Zone isolation (e.g., Knzin project protection)
2. Secret Leak prevention (.env, SSH keys, cloud credentials)
3. Destructive command gating (hard git resets, directory wipeouts, force pushes, DB drops)
4. Malicious remote pipe-to-shell execution (curl | bash, iex (iwr))
"""

import sys
import json
import re
import os

# Ensure clean UTF-8 encoding across Windows console environments
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Patterns indicating attempts to dump sensitive secrets
SECRET_LEAK_PATTERNS = [
    (r"\b(cat|type|Get-Content|gc|head|tail|more|less)\s+.*(\.env|\.env\.local|\.env\.production)\b", "Attempt to dump plaintext environment file containing secrets or API tokens"),
    (r"\b(cat|type|Get-Content|gc)\s+.*(id_rsa|id_ed25519|id_ecdsa|\.pem|\.key)\b", "Attempt to dump private SSH or TLS encryption keys"),
    (r"\b(cat|type|Get-Content|gc)\s+.*(\.aws[\\/]credentials|\.docker[\\/]config\.json)\b", "Attempt to dump cloud provider authentication credentials"),
]

# Patterns for destructive or dangerous system/git operations
DESTRUCTIVE_PATTERNS = [
    (r"\bgit\s+reset\s+--hard\b", "Hard git reset would discard all uncommitted changes and modified files"),
    (r"\bgit\s+clean\s+-[a-zA-Z]*f", "Untracked file wipeout would permanently delete new files"),
    (r"\brmdir\s+/[sS]\s+/[qQ]\s+\.git\b", "Deleting .git directory destroys version control history"),
    (r"\brm\s+-rf\s+\.git\b", "Deleting .git directory destroys version control history"),
    (r"\brm\s+-rf\s+[/~*]", "Recursive root or wild card file deletion destroys filesystem data"),
    (r"\bgit\s+push\s+.*(-f\b|--force\b)", "Force-pushing may overwrite remote team commit history"),
    (r"\bmigrate:fresh\b", "migrate:fresh drops all tables and wipes application data"),
    (r"\bmigrate:reset\b", "migrate:reset rolls back all database migrations"),
    (r"\bDROP\s+(DATABASE|SCHEMA)\b", "Drop database will destroy all application schemas and data"),
    (r"\b(curl|wget)\s+.*\|\s*(bash|sh|zsh|powershell|cmd)\b", "Piping unverified remote web script directly into shell interpreter"),
    (r"\b(iex|Invoke-Expression)\s*\(.*(iwr|Invoke-WebRequest|curl)\b", "Executing unverified remote download directly in PowerShell"),
]

# Authorized projects (owner-granted full access; boundary lock lifted, 2026-10-06, ADR-022):
#   - KNZiN Project (D:\Work Projects\Knzin Project)
# Secret-leak and destructive-command guards below STILL apply inside authorized projects.
# Danger Zones - strictly isolated foreign paths / projects (add (regex, reason) tuples here)
DANGER_ZONE_KEYWORDS = []

def evaluate_command(cmd: str, cwd: str) -> tuple:
    """
    Evaluates command line and current working directory against security rules.
    Returns (decision, reason).
    """
    normalized_cmd = cmd.strip()
    normalized_cwd = os.path.normpath(cwd) if cwd else ""

    # 1. Check Cwd for Danger Zone isolation
    for keyword_regex, reason in DANGER_ZONE_KEYWORDS:
        if re.search(keyword_regex, normalized_cwd, re.IGNORECASE):
            return ("force_ask", f"WORKSPACE BOUNDARY VIOLATION: Execution directory '{normalized_cwd}' is restricted. {reason}")
        if re.search(keyword_regex, normalized_cmd, re.IGNORECASE):
            return ("force_ask", f"WORKSPACE BOUNDARY VIOLATION: Command references restricted entity. {reason}")

    # 2. Check Secret Leak Patterns
    for pattern, reason in SECRET_LEAK_PATTERNS:
        if re.search(pattern, normalized_cmd, re.IGNORECASE):
            return ("force_ask", f"SECRET LEAK PREVENTION: {reason} ('{normalized_cmd}')")

    # 3. Check Destructive Patterns
    for pattern, reason in DESTRUCTIVE_PATTERNS:
        if re.search(pattern, normalized_cmd, re.IGNORECASE):
            return ("force_ask", f"SAFETY GUARD BLOCKED: {reason} ('{normalized_cmd}')")

    return ("allow", "")

def main():
    try:
        raw_input = sys.stdin.read()
        if not raw_input.strip():
            print(json.dumps({"decision": "allow"}))
            return 0

        data = json.loads(raw_input)
        tool_call = data.get("toolCall", {})
        tool_name = tool_call.get("name")
        args = tool_call.get("args", {})

        if tool_name == "run_command":
            cmd = args.get("CommandLine", "")
            cwd = args.get("Cwd", "")
            decision, reason = evaluate_command(cmd, cwd)
            if decision != "allow":
                print(json.dumps({
                    "decision": decision,
                    "reason": reason
                }))
                return 0

        print(json.dumps({"decision": "allow"}))
        return 0
    except Exception as e:
        # In case of hook error, allow with log to prevent blocking regular operation
        print(json.dumps({
            "decision": "allow",
            "reason": f"Safety hook evaluation error: {str(e)}"
        }))
        return 0

if __name__ == "__main__":
    sys.exit(main())
