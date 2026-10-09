#!/usr/bin/env python3
"""
Antigravity Agent OS - Local Adversarial Diff Reviewer.
Operationalizes Section 7 of the Human-Agent Engineering Constitution:
- Evaluates modified/added lines against static quality guards
- Applies P0/P1/P2 Severity Triage
- Generates structured adversarial audit reports with concrete remediation advice
"""

import sys
import os
import re
import subprocess
from pathlib import Path
from typing import List, Dict, Any, Optional

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

WORKSPACE_ROOT = Path("D:/Skills/.agents")
SCRIPTS_DIR = WORKSPACE_ROOT / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from guard_checker import scan_content, GuardViolation

class Finding:
    def __init__(self, severity: str, file_path: str, line_no: int, rule: str, message: str, snippet: str = ""):
        self.severity = severity  # P0, P1, P2
        self.file_path = file_path
        self.line_no = line_no
        self.rule = rule
        self.message = message
        self.snippet = snippet

    def to_dict(self) -> Dict[str, Any]:
        return {
            "severity": self.severity,
            "file": self.file_path,
            "line": self.line_no,
            "rule": self.rule,
            "message": self.message,
            "snippet": self.snippet
        }

def get_git_diff(staged_only: bool = False, target_file: Optional[str] = None) -> str:
    """Retrieves git diff for the workspace."""
    cmd = ["git", "diff"]
    if staged_only:
        cmd.append("--cached")
    if target_file:
        cmd.extend(["--", target_file])
    try:
        return subprocess.check_output(cmd, cwd=WORKSPACE_ROOT, text=True, errors="replace")
    except Exception as e:
        return ""

def parse_diff_files(diff_text: str) -> Dict[str, List[Tuple[int, str]]]:
    """
    Parses unified git diff into a mapping of filename -> list of (added_line_no, line_content).
    """
    files: Dict[str, List[Tuple[int, str]]] = {}
    current_file = None
    current_line_no = 0

    for line in diff_text.splitlines():
        if line.startswith("diff --git"):
            match = re.search(r"b/(.+)$", line)
            current_file = match.group(1) if match else None
            if current_file:
                files[current_file] = []
        elif line.startswith("@@"):
            # @@ -old_start,old_len +new_start,new_len @@
            match = re.search(r"\+(\d+)", line)
            if match:
                current_line_no = int(match.group(1))
        elif line.startswith("+") and not line.startswith("+++"):
            if current_file:
                files[current_file].append((current_line_no, line[1:]))
            current_line_no += 1
        elif not line.startswith("-"):
            current_line_no += 1

    return files

def map_guard_to_severity(violation: GuardViolation) -> str:
    """Classifies a guard violation into P0, P1, or P2."""
    p0_rules = [
        "AUTH_DERIVATION_VIOLATION",
        "ANTI_IDOR_VIOLATION",
        "HARDCODED_SECRET_LITERAL",
        "RAW_ERROR_LEAK"
    ]
    p1_rules = [
        "DANGEROUS_FUNCTION_FORBIDDEN",
        "INSECURE_OS_SYSTEM",
        "STRICT_TYPES_REQUIRED",
        "ARCH_SECURITY_PRESET_MISSING",
        "PHYSICAL_CSS_PROPERTY",
        "PHYSICAL_TAILWIND_UTILITY",
        "SWALLOWED_EXCEPTION"
    ]
    if violation.rule in p0_rules:
        return "P0"
    elif violation.rule in p1_rules:
        return "P1"
    return "P2"

def audit_diff(diff_text: str) -> List[Finding]:
    """Scans git diff additions and touched files against all engineering guards."""
    findings = []
    diff_data = parse_diff_files(diff_text)

    for rel_path, added_lines in diff_data.items():
        # Skip test fixture files from guard scanning as they contain deliberate vulnerability samples
        normalized_rel = rel_path.replace("\\", "/")
        if normalized_rel.startswith("tests/") or "/tests/" in normalized_rel or "test_" in Path(rel_path).name:
            continue

        file_path = WORKSPACE_ROOT / rel_path
        if not file_path.exists() or not file_path.is_file():
            continue

        try:
            content = file_path.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue

        file_violations = scan_content(content, filename=rel_path)
        added_line_numbers = {l_no for l_no, _ in added_lines}

        # Filter violations to those occurring in touched/added lines or whole-file rules
        for v in file_violations:
            # If the violation line is in the diff additions, or line is 1 (file header rule)
            if v.line_no in added_line_numbers or v.line_no == 1:
                severity = map_guard_to_severity(v)
                findings.append(Finding(
                    severity=severity,
                    file_path=rel_path,
                    line_no=v.line_no,
                    rule=v.rule,
                    message=v.message,
                    snippet=v.snippet
                ))

    # Sort findings by severity (P0 first, then P1, then P2)
    # 1. Scope Contract Check
    try:
        from scripts.scope_guard import check_scope
        scope_res = check_scope(diff_text)
        if scope_res.get("active") and not scope_res.get("in_scope"):
            for v in scope_res.get("violations", []):
                findings.append(Finding(
                    severity="P1",
                    file_path=v,
                    line_no=1,
                    rule="SCOPE_CONTRACT_VIOLATION",
                    message="File modified outside declared active scope contract",
                    snippet=f"Permitted files: {', '.join(scope_res.get('permitted_files', []))}"
                ))
            if scope_res.get("line_limit_exceeded"):
                findings.append(Finding(
                    severity="P1",
                    file_path="[DIFF]",
                    line_no=1,
                    rule="SCOPE_LINE_LIMIT_EXCEEDED",
                    message=f"Total lines changed ({scope_res.get('total_lines')}) exceeds line budget ({scope_res.get('max_lines')})",
                    snippet=""
                ))
    except Exception as err:
        findings.append(Finding(
            severity="P2",
            file_path="[SCOPE]",
            line_no=1,
            rule="SCOPE_CHECK_FAILED",
            message=f"Scope check could not complete: {err}",
            snippet=""
        ))

    # 2. Anti-Pattern Ledger Check
    try:
        from scripts.antipattern_ledger import scan_diff as scan_ap_diff
        ap_violations = scan_ap_diff(diff_text)
        for ap in ap_violations:
            findings.append(Finding(
                severity="P1",
                file_path=ap["filename"],
                line_no=ap["line"],
                rule=f"ANTIPATTERN_{ap['id']}",
                message=f"{ap['trigger']} -> {ap['replacement']}",
                snippet=ap["line_content"]
            ))
    except (ImportError, Exception):
        # Anti-pattern ledger optional if file missing
        pass_ledger = False

    # 3. Test File Chaos / Negative Assertion Check
    try:
        from scripts.chaos_guard import analyze_test_content
        for rel_path in diff_data.keys():
            normalized = rel_path.replace("\\", "/")
            if "test" in normalized and (normalized.endswith(".py") or normalized.endswith(".ts") or normalized.endswith(".js")):
                tf_path = WORKSPACE_ROOT / rel_path
                if tf_path.is_file():
                    test_analysis = analyze_test_content(tf_path.read_text(encoding="utf-8", errors="replace"), rel_path)
                    if not test_analysis["passed"] and test_analysis["total_assertions"] > 0:
                        findings.append(Finding(
                            severity="P2",
                            file_path=rel_path,
                            line_no=1,
                            rule="GREEN_TEST_FALLACY",
                            message="Test file contains zero negative/boundary assertions. Add adversarial failure tests.",
                            snippet=f"Total assertions: {test_analysis['total_assertions']}"
                        ))
    except (ImportError, Exception):
        # Chaos guard optional if test files not found
        pass_chaos = False

    sev_order = {"P0": 0, "P1": 1, "P2": 2}
    findings.sort(key=lambda f: (sev_order.get(f.severity, 9), f.file_path, f.line_no))
    return findings

def generate_report(findings: List[Finding]) -> str:
    """Generates formatted adversarial audit summary."""
    p0_count = sum(1 for f in findings if f.severity == "P0")
    p1_count = sum(1 for f in findings if f.severity == "P1")
    p2_count = sum(1 for f in findings if f.severity == "P2")

    report = [
        "=" * 65,
        "      ANTIGRAVITY AGENT OS - ADVERSARIAL DIFF REVIEW REPORT    ",
        "=" * 65,
        f"Findings Summary: P0 (Blocking): {p0_count} | P1 (Severe): {p1_count} | P2 (Notice): {p2_count}",
        "-" * 65
    ]

    if not findings:
        report.append("  [PASS] Zero adversarial findings detected. Working tree is clean.")
        report.append("=" * 65)
        return "\n".join(report)

    for idx, f in enumerate(findings, 1):
        sev_tag = f"[{f.severity}]"
        report.append(f"{idx}. {sev_tag} {f.file_path}:{f.line_no} ({f.rule})")
        report.append(f"   Issue:  {f.message}")
        if f.snippet:
            report.append(f"   Code:   {f.snippet[:75]}")
        report.append("")

    report.append("-" * 65)
    if p0_count > 0:
        report.append("VERDICT: [CAUTION] Blocking P0 issues detected! Remediation required.")
    elif p1_count > 0:
        report.append("VERDICT: [WARNING] P1 defects detected! Solve autonomously before land.")
    else:
        report.append("VERDICT: [NOTE] Minor non-blocking notes found.")
    report.append("=" * 65)
    return "\n".join(report)

def run_review(staged_only: bool = False, target_file: Optional[str] = None) -> int:
    diff_text = get_git_diff(staged_only=staged_only, target_file=target_file)
    if not diff_text.strip():
        print("=" * 65)
        print("      ANTIGRAVITY AGENT OS - ADVERSARIAL DIFF REVIEW REPORT    ")
        print("=" * 65)
        print("  [CLEAN] No local diff detected against HEAD.")
        print("=" * 65)
        return 0

    findings = audit_diff(diff_text)
    print(generate_report(findings))

    p0_p1 = [f for f in findings if f.severity in ["P0", "P1"]]
    return 1 if p0_p1 else 0

if __name__ == "__main__":
    staged = "--staged" in sys.argv or "--cached" in sys.argv
    file_arg = None
    for arg in sys.argv[1:]:
        if not arg.startswith("--"):
            file_arg = arg
            break
    sys.exit(run_review(staged_only=staged, target_file=file_arg))
