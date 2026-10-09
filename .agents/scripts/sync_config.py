#!/usr/bin/env python3
"""
Agent OS Dual-Config Synchronization Engine.
Maintains deterministic parity between:
1. Workspace root: D:/Skills/.agents
2. Global config root: C:/Users/HP/.gemini/config

Detects drift, compares file hashes, and synchronizes skills, rules, scripts, and hooks.
"""

import sys
import os
import hashlib
import shutil
from pathlib import Path
from typing import List, Dict, Tuple, Any

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

WORKSPACE_ROOT = Path("D:/Skills/.agents")
GLOBAL_ROOT = Path(os.path.expanduser("~/.gemini/config"))

EXCLUDE_PATTERNS = {
    ".git",
    "__pycache__",
    ".gitignore",
    "tests",
    "SKILL_INDEX.json",
    "SKILLS_DIRECTORY.md"
}

def file_hash(path: Path) -> str:
    """Computes SHA-256 hash of a file."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def scan_sync_drift() -> List[Dict[str, Any]]:
    """Compares files between workspace and global config."""
    drift_items = []
    
    # Track items to sync from workspace to global
    sync_dirs = ["skills", "rules", "scripts"]
    sync_files = ["hooks.json"]

    for d in sync_dirs:
        ws_dir = WORKSPACE_ROOT / d
        gl_dir = GLOBAL_ROOT / d
        if not ws_dir.exists():
            continue

        for root, dirs, files in os.walk(ws_dir):
            # filter out excluded dirs
            dirs[:] = [sub for sub in dirs if sub not in EXCLUDE_PATTERNS]
            for fname in files:
                if fname.endswith(".pyc") or fname in EXCLUDE_PATTERNS:
                    continue
                ws_file = Path(root) / fname
                rel_path = ws_file.relative_to(WORKSPACE_ROOT)
                gl_file = GLOBAL_ROOT / rel_path

                if not gl_file.exists():
                    drift_items.append({
                        "rel_path": str(rel_path),
                        "status": "MISSING_IN_GLOBAL",
                        "source": ws_file,
                        "target": gl_file
                    })
                elif file_hash(ws_file) != file_hash(gl_file):
                    drift_items.append({
                        "rel_path": str(rel_path),
                        "status": "MODIFIED_IN_WORKSPACE",
                        "source": ws_file,
                        "target": gl_file
                    })

    for f_rel in sync_files:
        ws_f = WORKSPACE_ROOT / f_rel
        gl_f = GLOBAL_ROOT / f_rel
        if ws_f.exists():
            if not gl_f.exists():
                drift_items.append({
                    "rel_path": f_rel,
                    "status": "MISSING_IN_GLOBAL",
                    "source": ws_f,
                    "target": gl_f
                })
            elif file_hash(ws_f) != file_hash(gl_f):
                drift_items.append({
                    "rel_path": f_rel,
                    "status": "MODIFIED_IN_WORKSPACE",
                    "source": ws_f,
                    "target": gl_f
                })

    return drift_items

def apply_sync(drift_items: List[Dict[str, Any]]) -> int:
    """Copies drifting files from workspace to global config."""
    applied = 0
    for item in drift_items:
        target = item["target"]
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(item["source"], target)
        applied += 1
    return applied

def main():
    apply_mode = "--apply" in sys.argv
    drift = scan_sync_drift()

    print("=" * 65)
    print("      ANTIGRAVITY AGENT OS - CONFIG PARITY SYNC        ")
    print("=" * 65)
    print(f"Workspace Root: {WORKSPACE_ROOT}")
    print(f"Global Root:    {GLOBAL_ROOT}")
    print("-" * 65)

    if not drift:
        print("[PASS] Parity verified: Global config is 100% in sync with workspace.")
        print("=" * 65)
        return 0

    print(f"Detected {len(drift)} file drift item(s):")
    for item in drift:
        tag = "[NEW]" if item["status"] == "MISSING_IN_GLOBAL" else "[MOD]"
        print(f"  {tag} {item['rel_path']}")

    print("-" * 65)
    if apply_mode:
        count = apply_sync(drift)
        print(f"[SUCCESS] Applied synchronization: {count} file(s) synced to global config.")
    else:
        print("[NOTICE] Running in dry-run mode. Run with '--apply' to sync changes.")
    print("=" * 65)
    return 0

if __name__ == "__main__":
    sys.exit(main())
