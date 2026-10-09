#!/usr/bin/env python3
"""
scripts/skill_router.py
Deterministic Task-to-Skill & Tool Routing Engine for Agent OS.

Guarantees that every task is paired with its required implementation skills
while in-flight and its mandatory verification guards when completed.
"""

import sys
import re
from pathlib import Path
from typing import Dict, Any, List, Optional

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent

# Domain definitions mapping intent keywords and file patterns to skills/tools
DOMAIN_PROFILES = {
    "FRONTEND_UI": {
        "description": "User Interface, Frontend Components, Design & Layout",
        "file_patterns": [r"\.tsx$", r"\.jsx$", r"\.vue$", r"\.svelte$", r"\.css$", r"\.scss$", r"components[\\/]", r"app[\\/].*?page\."],
        "keywords": ["ui", "component", "button", "layout", "design", "css", "tailwind", "modal", "page", "frontend", "bilingual", "rtl", "navbar", "form"],
        "implementation_skills": ["muaz-skill", "nextjs-fullstack"],
        "in_flight_tools": ["code_graph outline", "repl_sandbox regex", "playwright browser_navigate"],
        "completion_guards": ["rtl-logical-guard", "clean-code-guard", "browser_console_messages", "chaos-audit"]
    },
    "NEXTJS_SERVER_ACTIONS": {
        "description": "Next.js Server Actions & App Router Endpoints",
        "file_patterns": [r"actions\.(?:ts|js)$", r"actions[\\/]", r"route\.(?:ts|js)$"],
        "keywords": ["server action", "use server", "safeParse", "idor", "auth derivation", "action"],
        "implementation_skills": ["next-server-action-guard", "backend-api"],
        "in_flight_tools": ["code_graph find", "repl_sandbox py"],
        "completion_guards": ["next-server-action-guard", "clean-code-guard", "chaos-audit"]
    },
    "BACKEND_LARAVEL_PHP": {
        "description": "Laravel 11+ & PHP 8 Modern Backend Services",
        "file_patterns": [r"\.php$", r"\.phtml$", r"app[\\/]Http[\\/]", r"routes[\\/]"],
        "keywords": ["laravel", "php", "artisan", "pest", "eloquent", "blade", "controller"],
        "implementation_skills": ["laravel-mastery", "backend-http"],
        "in_flight_tools": ["code_graph outline", "repl_sandbox sql"],
        "completion_guards": ["pest-security-guard", "clean-code-guard", "chaos-audit"]
    },
    "DATABASE_PERSISTENCE": {
        "description": "Database Schemas, Migrations, Indexes & Queries",
        "file_patterns": [r"\.sql$", r"migrations[\\/]", r"schema\.prisma$", r"models[\\/]"],
        "keywords": ["database", "sql", "migration", "prisma", "table", "index", "schema", "foreign key", "acid"],
        "implementation_skills": ["database", "backend-data"],
        "in_flight_tools": ["repl_sandbox sql (in-memory SQLite sandbox)"],
        "completion_guards": ["antipattern AP-001 (raw SQL injection)", "clean-code-guard"]
    },
    "PYTHON_SYSTEMS": {
        "description": "Python Utilities, Agent OS Scripts & Automation",
        "file_patterns": [r"\.py$"],
        "keywords": ["python", "script", "agent", "daemon", "cli", "regex", "repl"],
        "implementation_skills": ["clean-code-guard", "engineering-workflow"],
        "in_flight_tools": ["repl_sandbox eval", "code_graph symbol"],
        "completion_guards": ["python-security-guard", "clean-code-guard", "chaos-audit"]
    }
}

def resolve_task_routing(input_target: str) -> Dict[str, Any]:
    matched_domains: List[str] = []
    lower_input = input_target.lower()

    for domain_key, profile in DOMAIN_PROFILES.items():
        # Check file pattern match
        pattern_match = any(re.search(pat, input_target, re.IGNORECASE) for pat in profile["file_patterns"])
        # Check keyword match
        keyword_match = any(re.search(r"\b" + re.escape(kw) + r"\b", lower_input) for kw in profile["keywords"])

        if pattern_match or keyword_match:
            matched_domains.append(domain_key)

    if not matched_domains:
        # Default to general engineering workflow
        matched_domains = ["PYTHON_SYSTEMS"] if input_target.endswith(".py") else ["FRONTEND_UI" if any(input_target.endswith(ext) for ext in [".tsx", ".css", ".jsx"]) else "GENERAL_ENGINEERING"]

    impl_skills = set()
    tools = set()
    guards = set()

    for d in matched_domains:
        prof = DOMAIN_PROFILES.get(d)
        if prof:
            impl_skills.update(prof["implementation_skills"])
            tools.update(prof["in_flight_tools"])
            guards.update(prof["completion_guards"])

    if not guards:
        guards = {"clean-code-guard", "chaos-audit"}

    return {
        "input": input_target,
        "domains": matched_domains,
        "implementation_skills": sorted(list(impl_skills)),
        "in_flight_tools": sorted(list(tools)),
        "completion_guards": sorted(list(guards))
    }

def print_routing_manifest(result: Dict[str, Any]):
    print("=" * 65)
    print("      ANTIGRAVITY AGENT OS - TASK & TOOL ROUTING MANIFEST      ")
    print("=" * 65)
    print(f"Target Input:        {result['input']}")
    print(f"Matched Domain(s):   {', '.join(result['domains'])}")
    print("-" * 65)
    print("[1. WHILE IMPLEMENTING - ACTIVE SKILLS TO CONSULT]:")
    for s in result["implementation_skills"]:
        print(f"  * {s}")
    print("\n[2. WHILE IMPLEMENTING - IN-FLIGHT TOOLS]:")
    for t in result["in_flight_tools"]:
        print(f"  * {t}")
    print("\n[3. WHEN FINISHED - MANDATORY COMPLETION GUARDS]:")
    for g in result["completion_guards"]:
        print(f"  * {g}")
    print("=" * 65)

def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/skill_router.py <task description or file path>")
        sys.exit(1)

    input_target = " ".join(sys.argv[1:])
    result = resolve_task_routing(input_target)
    print_routing_manifest(result)
    sys.exit(0)

if __name__ == "__main__":
    main()
