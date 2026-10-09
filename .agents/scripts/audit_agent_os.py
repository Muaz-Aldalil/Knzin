#!/usr/bin/env python3
"""
Agent OS & Guard Infrastructure Automated Audit Suite.
Validates skill frontmatters, rule integrity, markdown link validity,
and global-to-workspace customization parity.
"""

import os
import sys
import re
from pathlib import Path

WORKSPACE_ROOT = Path("D:/Skills/.agents")
GLOBAL_ROOT = Path(os.path.expanduser("~/.gemini/config"))

CRITICAL_GUARDS = [
    "next-server-action-guard",
    "pest-security-guard",
    "rtl-logical-guard",
    "ui-review-loop",
    "debate-review",
    "clean-code-guard",
    "engineering-workflow",
]

def parse_frontmatter(content: str):
    """Extract YAML frontmatter from markdown file."""
    if not content.startswith("---"):
        return None, "Missing opening --- frontmatter delimiter"
    parts = content.split("---", 2)
    if len(parts) < 3:
        return None, "Malformed frontmatter: missing closing --- delimiter"
    
    yaml_text = parts[1]
    data = {}
    for line in yaml_text.strip().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if ":" in line:
            key, val = line.split(":", 1)
            key = key.strip()
            val = val.strip()
            if val.startswith(">-") or val.startswith(">") or val.startswith("|"):
                val = ""
            else:
                val = val.strip("\"'")
            data[key] = val
    return data, None

def check_file_links(file_path: Path):
    """Check for broken file:/// markdown links."""
    broken_links = []
    try:
        content = file_path.read_text(encoding="utf-8")
        links = re.findall(r"\[.*?\]\((file:///[^)#\s]+)", content)
        for link in links:
            # Normalize Windows file URI: file:///D:/... -> D:/...
            clean_path = link.replace("file:///", "")
            # On Windows, path looks like D:/foo or d:/foo
            target = Path(clean_path)
            if not target.exists():
                broken_links.append(link)
    except Exception as e:
        broken_links.append(f"Error reading file: {e}")
    return broken_links

def audit_skills(skills_dir: Path):
    """Audit all skills in a directory."""
    results = {}
    if not skills_dir.exists():
        return results

    for item in sorted(skills_dir.iterdir()):
        if not item.is_dir():
            continue
        skill_name = item.name
        skill_file = item / "SKILL.md"

        if not skill_file.exists():
            results[skill_name] = {
                "valid": False,
                "error": "SKILL.md missing",
                "broken_links": [],
            }
            continue

        try:
            content = skill_file.read_text(encoding="utf-8")
            data, err = parse_frontmatter(content)
            if err:
                results[skill_name] = {
                    "valid": False,
                    "error": err,
                    "broken_links": [],
                }
                continue

            name = data.get("name")
            desc = data.get("description")

            if not name:
                results[skill_name] = {
                    "valid": False,
                    "error": "Missing 'name' in frontmatter",
                    "broken_links": [],
                }
                continue

            if name != skill_name:
                results[skill_name] = {
                    "valid": False,
                    "error": f"Frontmatter name '{name}' does not match directory '{skill_name}'",
                    "broken_links": [],
                }
                continue

            broken = check_file_links(skill_file)

            results[skill_name] = {
                "valid": True,
                "error": None,
                "broken_links": broken,
            }
        except Exception as e:
            results[skill_name] = {
                "valid": False,
                "error": str(e),
                "broken_links": [],
            }

    return results

def main():
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except (AttributeError, Exception):
        sys.stdout = sys.__stdout__
    print("=" * 80)
    print("  AGENT OS & GUARD INFRASTRUCTURE AUTOMATED AUDIT")
    print("=" * 80)

    workspace_skills = WORKSPACE_ROOT / "skills"
    global_skills = GLOBAL_ROOT / "skills"

    ws_results = audit_skills(workspace_skills)
    gl_results = audit_skills(global_skills)

    print(f"\n[1] Workspace Skills Audit ({workspace_skills})")
    print(f"    Total scanned: {len(ws_results)}")
    ws_failed = 0
    for name, res in ws_results.items():
        if not res["valid"]:
            print(f"    [FAIL] {name}: {res['error']}")
            ws_failed += 1
        elif res["broken_links"]:
            print(f"    [WARN] {name}: {len(res['broken_links'])} broken links")
        else:
            # Valid
            pass
    if ws_failed == 0:
        print(f"    [PASS] All {len(ws_results)} workspace skills PASS frontmatter & structure checks.")

    print(f"\n[2] Global Skills Audit ({global_skills})")
    print(f"    Total scanned: {len(gl_results)}")
    gl_failed = 0
    for name, res in gl_results.items():
        if not res["valid"]:
            print(f"    [FAIL] {name}: {res['error']}")
            gl_failed += 1
        elif res["broken_links"]:
            print(f"    [WARN] {name}: {len(res['broken_links'])} broken links")
    if gl_failed == 0:
        print(f"    [PASS] All {len(gl_results)} global skills PASS frontmatter & structure checks.")

    print(f"\n[3] Critical Guard Verification")
    all_guards_ok = True
    for guard in CRITICAL_GUARDS:
        in_ws = guard in ws_results and ws_results[guard]["valid"]
        in_gl = guard in gl_results and gl_results[guard]["valid"]
        status = "[PASS]" if (in_ws and in_gl) else "[FAIL]"
        if not (in_ws and in_gl):
            all_guards_ok = False
        print(f"    {status} - {guard:<30} (Workspace: {'YES' if in_ws else 'NO'}, Global: {'YES' if in_gl else 'NO'})")

    print(f"\n[4] Rules & Constitutional Governance Audit")
    rules_dir = WORKSPACE_ROOT / "rules"
    rules_count = 0
    if rules_dir.exists():
        for r in rules_dir.glob("*.md"):
            rules_count += 1
            print(f"    📄 Rule file: {r.name} ({r.stat().st_size} bytes)")
    print(f"    Total active rules: {rules_count}")

    print(f"\n[5] Prompt Caching & Intake Optimization Audit")
    cache_ok = True
    try:
        from prompt_cache import load_canonical_workspace_assembler
        assembler = load_canonical_workspace_assembler()
        prefix = assembler.build_static_prefix()
        prefix_hash = assembler.compute_static_prefix_hash()
        violations = assembler.audit_cache_leakage()
        if violations:
            cache_ok = False
            for v in violations:
                print(f"    [FAIL] {v}")
        else:
            print(f"    [PASS] Static Prefix Size: {len(prefix):,} bytes (~{len(prefix) // 4:,} tokens)")
            print(f"    [PASS] Prefix SHA-256:     {prefix_hash[:16]}...{prefix_hash[-8:]}")
            print(f"    [PASS] Leakage Scan:       100% CLEAN (Zero early timestamps or git status)")
    except Exception as e:
        cache_ok = False
        print(f"    [FAIL] Prompt cache audit failed: {e}")

    print("\n" + "=" * 80)
    if ws_failed == 0 and gl_failed == 0 and all_guards_ok and cache_ok:
        print("  OVERALL AUDIT RESULT: ALL SYSTEMS OPERATIONAL (GREEN)")
        print("=" * 80)
        return 0
    else:
        print(f"  OVERALL AUDIT RESULT: FAILURES DETECTED (WS: {ws_failed}, GL: {gl_failed}, Guards: {all_guards_ok}, Cache: {cache_ok})")
        print("=" * 80)
        return 1

if __name__ == "__main__":
    sys.exit(main())
