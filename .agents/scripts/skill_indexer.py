#!/usr/bin/env python3
"""
Agent OS Skill Indexer & Cognitive Search Engine.
Parses, indexes, and categorizes all 43 Agent skills to enable:
1. Instant semantic search (< 20 tokens) instead of reading full SKILL.md files
2. Auto-generated SKILL_INDEX.json for fast machine lookup
3. Human-readable categorized SKILLS_DIRECTORY.md index
"""

import sys
import os
import json
import re
from pathlib import Path
from typing import List, Dict, Any, Optional

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

WORKSPACE_ROOT = Path("D:/Skills/.agents")
SKILLS_DIR = WORKSPACE_ROOT / "skills"

CATEGORIES = {
    "Quality & Security Guards": [
        "next-server-action-guard",
        "pest-security-guard",
        "rtl-logical-guard",
        "clean-code-guard",
        "test-guard",
        "docs-guard",
        "woo-guard",
        "wp-guard"
    ],
    "Core Architecture & Workflow": [
        "engineering-workflow",
        "debate-review",
        "ui-review-loop",
        "delegate-setup",
        "opencode-delegate",
        "find-skills",
        "project-documentation"
    ],
    "Backend & Data Systems": [
        "laravel-mastery",
        "backend-api",
        "backend-data",
        "backend-http",
        "backend-identity",
        "backend-ops",
        "database",
        "devops-deploy"
    ],
    "Frontend & User Experience": [
        "nextjs-fullstack",
        "muaz-skill"
    ],
    "Testing & QA Automation": [
        "testing-qa"
    ],
    "Specification-Driven Development (Spec-Kit)": [
        "spec-kit",
        "glopale",
        "speckit-constitution",
        "speckit-specify",
        "speckit-clarify",
        "speckit-plan",
        "speckit-tasks",
        "speckit-checklist",
        "speckit-analyze",
        "speckit-implement",
        "speckit-converge",
        "speckit-taskstoissues"
    ],
    "Simplicity & Anti-Bloat (Ponytail)": [
        "ponytail",
        "ponytail-audit",
        "ponytail-debt",
        "ponytail-gain",
        "ponytail-help",
        "ponytail-review",
        "caveman"
    ]
}

def parse_frontmatter(content: str):
    if not content.startswith("---"):
        return {}, content
    parts = content.split("---", 2)
    if len(parts) < 3:
        return {}, content
    
    yaml_text = parts[1]
    body = parts[2]
    data = {}
    current_key = None
    current_val_lines = []

    for line in yaml_text.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue

        # If indented, it's a continuation of current_key
        if line.startswith("  ") or line.startswith("\t"):
            if current_key:
                current_val_lines.append(stripped)
            continue

        # If new key-value pair
        if ":" in line:
            if current_key:
                data[current_key] = " ".join(current_val_lines).strip("\"' ")
            k, v = line.split(":", 1)
            current_key = k.strip()
            v_clean = v.strip().strip("\"'")
            if v_clean in [">-", ">", "|", "|-"]:
                current_val_lines = []
            else:
                current_val_lines = [v_clean] if v_clean else []

    if current_key and current_val_lines:
        data[current_key] = " ".join(current_val_lines).strip("\"' ")

    return data, body

def build_index() -> Dict[str, Any]:
    skills = []
    
    for skill_path in sorted(SKILLS_DIR.iterdir()):
        if not skill_path.is_dir():
            continue
        skill_file = skill_path / "SKILL.md"
        if not skill_file.exists():
            continue
        
        content = skill_file.read_text(encoding="utf-8", errors="ignore")
        fm, body = parse_frontmatter(content)
        name = fm.get("name", skill_path.name)
        description = fm.get("description", "")
        
        # Determine category
        cat = "General Customizations"
        for category_name, member_skills in CATEGORIES.items():
            if name in member_skills or skill_path.name in member_skills:
                cat = category_name
                break
        
        # Token extraction for search
        search_corpus = f"{name} {description} {cat}".lower()
        
        skills.append({
            "name": name,
            "category": cat,
            "description": description,
            "file": f"skills/{skill_path.name}/SKILL.md",
            "search_corpus": search_corpus
        })
    
    # Sort skills alphabetically by name for deterministic prompt caching
    skills.sort(key=lambda s: s["name"])
    
    return {
        "skills": skills,
        "total_skills": len(skills)
    }

def generate_markdown_directory(index_data: Dict[str, Any]) -> str:
    md = ["# Antigravity Agent OS - Skills Directory\n"]
    md.append(f"> Auto-indexed registry of **{index_data['total_skills']} production skills** categorized by operational domain.\n")
    
    # Group by category (sorted category names)
    by_cat = {}
    for item in index_data["skills"]:
        c = item["category"]
        by_cat.setdefault(c, []).append(item)
        
    for cat_name in sorted(by_cat.keys()):
        items = by_cat[cat_name]
        md.append(f"## {cat_name}\n")
        for s in sorted(items, key=lambda x: x["name"]):
            md.append(f"- **[`{s['name']}`](file:///D:/Skills/.agents/{s['file']})**: {s['description']}")
        md.append("")
        
    return "\n".join(md)

def search_skills(query: str, index_data: Optional[Dict[str, Any]] = None, limit: int = 5) -> List[Dict[str, Any]]:
    if not index_data:
        index_data = build_index()

    # Split on whitespace and common punctuation (. , - _)
    raw_terms = re.findall(r"[a-zA-Z0-9]+", query.lower())
    matches = []

    for s in index_data["skills"]:
        score = 0
        corpus = s["search_corpus"]
        name = s["name"].lower()

        for t in raw_terms:
            if len(t) < 2:
                continue
            if t == name:
                score += 20
            elif t in name:
                score += 10
            elif t in corpus:
                score += 3

        if score > 0:
            matches.append((score, s))

    matches.sort(key=lambda x: x[0], reverse=True)
    return [m[1] for m in matches[:limit]]

def main():
    index_data = build_index()
    
    # 1. Save SKILL_INDEX.json with sorted keys and normalized LF endings
    json_path = WORKSPACE_ROOT / "SKILL_INDEX.json"
    json_text = json.dumps(index_data, indent=2, sort_keys=True, ensure_ascii=False) + "\n"
    json_path.write_text(json_text.replace("\r\n", "\n"), encoding="utf-8", newline="\n")
        
    # 2. Save SKILLS_DIRECTORY.md with LF endings
    md_content = generate_markdown_directory(index_data)
    md_path = WORKSPACE_ROOT / "SKILLS_DIRECTORY.md"
    md_path.write_text(md_content.replace("\r\n", "\n"), encoding="utf-8", newline="\n")
    
    print(f"[SUCCESS] Indexed {index_data['total_skills']} skills.")
    print(f"  - Machine index: {json_path}")
    print(f"  - Human catalog: {md_path}")
    
    if len(sys.argv) > 1 and sys.argv[1] != "--build-only":
        q = " ".join(sys.argv[1:])
        results = search_skills(q, index_data)
        print(f"\nSearch results for '{q}':")
        for r in results:
            print(f"  * {r['name']} ({r['category']}): {r['description'][:90]}...")

if __name__ == "__main__":
    main()
