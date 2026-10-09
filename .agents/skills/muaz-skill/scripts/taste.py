#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Taste Memory — a lightweight persistent profile that biases the search engine
toward what the user/designer actually accepted.

How it works:
  - Corrections are recorded as `record_correction()`: a query, the rejected
    choice, the accepted choice, and a reason.
  - Terms from the *accepted* choice get positive weights; terms from the
    rejected one get negative weights.
  - `bias_dict()` converts the profile into a term->weight map handed to
    `core.search(query, bias=...)`, which re-ranks results accordingly.

Storage: data/taste-profile.json (auto-created, safe to ship empty).
"""

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path

DEFAULT_PROFILE = Path(__file__).parent.parent / "data" / "taste-profile.json"

_TERM_RE = re.compile(r"[a-z0-9][a-z0-9'_-]*")


def _tokenize(text) -> list:
    return [t for t in _TERM_RE.findall(str(text).lower()) if len(t) >= 3]


def _new_profile() -> dict:
    return {
        "version": 1,
        "weights": {},  # term -> float (positive = prefer, negative = avoid)
        "history": [],  # [{date, query, rejected, accepted, reason}]
    }


def load_profile(path: Path = None) -> dict:
    path = path or DEFAULT_PROFILE
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            return _new_profile()
        data.setdefault("weights", {})
        data.setdefault("history", [])
        return data
    except (OSError, json.JSONDecodeError):
        return _new_profile()


def save_profile(profile: dict, path: Path = None) -> None:
    path = path or DEFAULT_PROFILE
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(profile, indent=2, ensure_ascii=False), encoding="utf-8")


def record_correction(profile: dict, query: str, rejected: str, accepted: str,
                      reason: str = "", path: Path = None) -> dict:
    """Record a preference signal and fold it into the term weights."""
    for term in _tokenize(accepted):
        profile["weights"][term] = profile["weights"].get(term, 0.0) + 1.0
    for term in _tokenize(rejected):
        profile["weights"][term] = profile["weights"].get(term, 0.0) - 1.0

    profile["history"].append({
        "date": datetime.now().isoformat(timespec="seconds"),
        "query": query,
        "rejected": rejected,
        "accepted": accepted,
        "reason": reason,
    })
    save_profile(profile, path)
    return profile


def bias_dict(profile: dict) -> dict:
    """Return {term: weight} with only meaningful signals (|weight| >= 1)."""
    return {term: w for term, w in (profile or {}).get("weights", {}).items() if abs(w) >= 1}


def top_preferences(profile: dict, limit: int = 8) -> list:
    """Most preferred terms (positive weight), descending."""
    weights = (profile or {}).get("weights", {})
    return sorted(((t, w) for t, w in weights.items() if w > 0),
                  key=lambda x: x[1], reverse=True)[:limit]


def main(argv=None):
    parser = argparse.ArgumentParser(prog="taste.py", description="Taste memory for the search engine")
    sub = parser.add_subparsers(dest="command", required=True)

    p_show = sub.add_parser("show", help="show current preferences")
    p_show.add_argument("--path", default=None)

    p_add = sub.add_parser("record", help="record a preference correction")
    p_add.add_argument("query")
    p_add.add_argument("accepted")
    p_add.add_argument("rejected", nargs="?", default="")
    p_add.add_argument("--reason", default="")
    p_add.add_argument("--path", default=None)

    p_reset = sub.add_parser("reset", help="clear all learned preferences")
    p_reset.add_argument("--path", default=None)

    args = parser.parse_args(argv)
    path = Path(args.path) if getattr(args, "path", None) else None

    if args.command == "show":
        profile = load_profile(path)
        prefs = top_preferences(profile)
        if not prefs:
            print("No preferences learned yet. Record corrections with: taste.py record ...")
            return 0
        print("=== TASTE PROFILE ===")
        for term, weight in prefs:
            print(f"  +{weight:.1f}  {term}")
        print(f"\n{len(profile['history'])} correction(s) on file.")
        return 0

    if args.command == "record":
        profile = load_profile(path)
        record_correction(profile, args.query, args.rejected or "", args.accepted,
                          args.reason, path)
        print(f"Recorded: accepted '{args.accepted}'"
              + (f" over '{args.rejected}'" if args.rejected else "") + ".")
        return 0

    if args.command == "reset":
        save_profile(_new_profile(), path)
        print("Taste profile reset.")
        return 0

    return 2


if __name__ == "__main__":
    sys.exit(main())
