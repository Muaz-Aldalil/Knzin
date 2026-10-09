#!/usr/bin/env python3
"""
scripts/context_telemetry.py
Context Window & Token Budget Telemetry for Agent OS.

Monitors multi-turn conversation depth, estimated token volume,
and cache efficiency, providing early alerts before context degradation occurs.
"""

import sys
import json
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime, timezone

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
TELEMETRY_FILE = WORKSPACE_ROOT / ".agent_telemetry.json"

DEFAULT_TELEMETRY = {
    "turn_count": 0,
    "warning_threshold": 40,
    "critical_threshold": 60,
    "total_input_tokens": 0,
    "cached_input_tokens": 0,
    "last_turn_timestamp": datetime.now(timezone.utc).isoformat()
}

def get_telemetry() -> Dict[str, Any]:
    if not TELEMETRY_FILE.is_file():
        save_telemetry(DEFAULT_TELEMETRY)
        return DEFAULT_TELEMETRY
    try:
        with open(TELEMETRY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return DEFAULT_TELEMETRY

def save_telemetry(data: Dict[str, Any]):
    with open(TELEMETRY_FILE, "w", encoding="utf-8", newline="\n") as f:
        json.dump(data, f, indent=2, sort_keys=True)

def record_turn(fresh_tokens: int = 1200, cached_tokens: int = 26000) -> Dict[str, Any]:
    data = get_telemetry()
    data["turn_count"] = data.get("turn_count", 0) + 1
    data["total_input_tokens"] = data.get("total_input_tokens", 0) + fresh_tokens + cached_tokens
    data["cached_input_tokens"] = data.get("cached_input_tokens", 0) + cached_tokens
    data["last_turn_timestamp"] = datetime.now(timezone.utc).isoformat()
    save_telemetry(data)
    return data

def reset_telemetry() -> Dict[str, Any]:
    save_telemetry(DEFAULT_TELEMETRY)
    return DEFAULT_TELEMETRY

def evaluate_health() -> Dict[str, Any]:
    data = get_telemetry()
    turns = data.get("turn_count", 0)
    warn_t = data.get("warning_threshold", 40)
    crit_t = data.get("critical_threshold", 60)

    total_tokens = data.get("total_input_tokens", 0)
    cached_tokens = data.get("cached_input_tokens", 0)
    cache_rate = (cached_tokens / total_tokens * 100) if total_tokens > 0 else 0.0

    if turns >= crit_t:
        status = "CRITICAL"
        message = f"Context saturation reached ({turns} turns >= limit {crit_t}). Attention degradation likely."
        action = "Freeze state with 'python scripts/agent_os.py snapshot freeze' and start a clean session."
    elif turns >= warn_t:
        status = "WARNING"
        message = f"Session context heavy ({turns} turns >= warning {warn_t})."
        action = "Prepare to checkpoint and compact session."
    else:
        status = "HEALTHY"
        message = f"Context depth is optimal ({turns} turns < warning {warn_t}). Full attention active."
        action = "Continue standard workflow."

    return {
        "status": status,
        "turns": turns,
        "warning_threshold": warn_t,
        "critical_threshold": crit_t,
        "total_tokens": total_tokens,
        "cached_tokens": cached_tokens,
        "cache_rate_percent": round(cache_rate, 1),
        "message": message,
        "recommended_action": action
    }

def print_telemetry_report(health: Dict[str, Any]):
    print("=" * 65)
    print("      ANTIGRAVITY AGENT OS - CONTEXT & TOKEN TELEMETRY         ")
    print("=" * 65)
    status_tag = f"[{health['status']}]"
    print(f"Health Status:        {status_tag} - {health['message']}")
    print(f"Active Turns:         {health['turns']} (Warning: {health['warning_threshold']} | Critical: {health['critical_threshold']})")
    print(f"Total Tokens Read:    {health['total_tokens']:,} tokens")
    print(f"Cached Input Tokens:  {health['cached_tokens']:,} tokens ({health['cache_rate_percent']}% cache hit rate)")
    print("-" * 65)
    print(f"Next Action:          {health['recommended_action']}")
    print("=" * 65)

def main():
    if len(sys.argv) < 2 or sys.argv[1].lower() in ("status", "health"):
        health = evaluate_health()
        print_telemetry_report(health)
        sys.exit(0 if health["status"] != "CRITICAL" else 1)

    cmd = sys.argv[1].lower()
    if cmd == "record":
        data = record_turn()
        print(f"[SUCCESS] Recorded turn #{data['turn_count']}. Health: {evaluate_health()['status']}")
        sys.exit(0)

    elif cmd == "reset":
        reset_telemetry()
        print("[SUCCESS] Session context telemetry reset to 0 turns.")
        sys.exit(0)
    else:
        print(f"Unknown command: '{cmd}'")
        sys.exit(1)

if __name__ == "__main__":
    main()
