#!/usr/bin/env python3
"""
scripts/runtime_observer.py
Runtime Log Ingestion & Server Health Probe for Agent OS.

Bridges the gap between static code inspection and live runtime observability.
Provides log tailing with stack trace extraction and zero-dependency HTTP server health probing.
"""

import sys
import re
import time
import urllib.request
import urllib.error
from pathlib import Path
from typing import Dict, Any, List, Optional

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent

COMMON_LOG_GLOBS = [
    "storage/logs/*.log",
    "logs/*.log",
    ".next/*.log",
    "var/log/*.log",
    "*.log"
]

def find_latest_log_file(custom_path: Optional[str] = None) -> Optional[Path]:
    if custom_path:
        p = Path(custom_path)
        if not p.is_absolute():
            p = WORKSPACE_ROOT / p
        return p if p.is_file() else None

    candidates: List[Path] = []
    for pattern in COMMON_LOG_GLOBS:
        for p in WORKSPACE_ROOT.glob(pattern):
            if p.is_file() and p.stat().st_size > 0:
                candidates.append(p)

    if not candidates:
        return None

    # Return most recently modified log file
    candidates.sort(key=lambda x: x.stat().st_mtime, reverse=True)
    return candidates[0]

def tail_log(log_path: Path, lines_count: int = 50) -> Dict[str, Any]:
    try:
        content = log_path.read_text(encoding="utf-8", errors="replace")
    except Exception as e:
        return {"error": f"Failed to read log file: {e}", "lines": [], "errors_detected": 0}

    all_lines = content.splitlines()
    recent = all_lines[-lines_count:] if len(all_lines) > lines_count else all_lines

    # Detect errors / stack traces
    error_patterns = [
        re.compile(r"\b(?:FATAL|ERROR|CRITICAL|EXCEPTION|Exception|Traceback)\b"),
        re.compile(r"^\s*at\s+[\w\.<>]+(?:\s*\(.*?\))?"), # JS / Node stack trace
        re.compile(r"^\s*#\d+\s+"), # PHP stack trace
        re.compile(r"^\s*File \".*?\", line \d+"), # Python stack trace
    ]

    error_lines = []
    for idx, l in enumerate(recent):
        for pat in error_patterns:
            if pat.search(l):
                error_lines.append(l)
                break

    return {
        "file": str(log_path.relative_to(WORKSPACE_ROOT) if log_path.is_relative_to(WORKSPACE_ROOT) else log_path),
        "total_file_lines": len(all_lines),
        "lines_returned": len(recent),
        "lines": recent,
        "errors_detected": len(error_lines),
        "error_snippets": error_lines[:15]
    }

def probe_endpoint(url: str, timeout: float = 3.0) -> Dict[str, Any]:
    start_time = time.perf_counter()
    headers = {"User-Agent": "Antigravity-AgentOS-Probe/1.0"}
    req = urllib.request.Request(url, headers=headers)

    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
            status_code = response.getcode()
            headers_dict = dict(response.info())
            raw_body = response.read(1024)
            body_preview = raw_body.decode("utf-8", errors="replace")

            return {
                "url": url,
                "reachable": True,
                "status_code": status_code,
                "latency_ms": latency_ms,
                "headers": {k: headers_dict[k] for k in list(headers_dict.keys())[:5]},
                "body_preview": body_preview[:300]
            }
    except urllib.error.HTTPError as e:
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        raw_body = e.read(1024) if hasattr(e, "read") else b""
        body_preview = raw_body.decode("utf-8", errors="replace") if raw_body else ""
        return {
            "url": url,
            "reachable": True,
            "status_code": e.code,
            "latency_ms": latency_ms,
            "error": f"HTTP {e.code}: {e.reason}",
            "body_preview": body_preview[:300]
        }
    except Exception as e:
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return {
            "url": url,
            "reachable": False,
            "status_code": 0,
            "latency_ms": latency_ms,
            "error": str(e),
            "body_preview": ""
        }

def print_log_summary(res: Dict[str, Any]):
    print("=" * 65)
    print("      ANTIGRAVITY AGENT OS - RUNTIME LOG INGESTION REPORT     ")
    print("=" * 65)
    if "error" in res:
        print(f"[ERROR] {res['error']}")
        print("=" * 65)
        return

    print(f"Log File:        {res.get('file')}")
    print(f"Total Lines:     {res.get('total_file_lines')} lines")
    print(f"Errors Found:    {res.get('errors_detected')} error lines in last {res.get('lines_returned')} lines")
    print("-" * 65)

    if res.get("error_snippets"):
        print("[CRITICAL STACK TRACES & EXCEPTIONS DETECTED]:")
        for snip in res["error_snippets"]:
            print(f"  > {snip}")
    else:
        print("[INFO] Zero recent stack traces or fatal errors detected.")
        print("[RECENT LOG TAIL]:")
        for l in res.get("lines", [])[-10:]:
            print(f"  | {l}")
    print("=" * 65)

def print_probe_summary(res: Dict[str, Any]):
    print("=" * 65)
    print("       ANTIGRAVITY AGENT OS - RUNTIME SERVER HEALTH PROBE     ")
    print("=" * 65)
    print(f"Target URL:    {res.get('url')}")
    print(f"Reachable:     {res.get('reachable')}")
    print(f"Latency:       {res.get('latency_ms')} ms")
    if res.get("reachable"):
        print(f"Status Code:   {res.get('status_code')}")
        if res.get("error"):
            print(f"Notice:        {res.get('error')}")
        print("-" * 65)
        print("[RESPONSE PREVIEW]:")
        print(res.get("body_preview", "")[:200])
    else:
        print(f"[CONNECTION FAILED]: {res.get('error')}")
    print("=" * 65)

def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/runtime_observer.py <logs|probe> [args...]")
        print("  logs [--tail N] [--file <path>]")
        print("  probe <url> [--timeout S]")
        sys.exit(1)

    cmd = sys.argv[1].lower()
    if cmd == "logs":
        lines_count = 50
        file_path = None
        idx = 2
        while idx < len(sys.argv):
            if sys.argv[idx] == "--tail" and idx + 1 < len(sys.argv):
                lines_count = int(sys.argv[idx + 1])
                idx += 2
            elif sys.argv[idx] == "--file" and idx + 1 < len(sys.argv):
                file_path = sys.argv[idx + 1]
                idx += 2
            else:
                idx += 1

        log_file = find_latest_log_file(file_path)
        if not log_file:
            print("[INFO] No log files found in workspace (checked storage/logs, logs/, *.log).")
            sys.exit(0)
        res = tail_log(log_file, lines_count)
        print_log_summary(res)
        sys.exit(0)

    elif cmd == "probe":
        if len(sys.argv) < 3:
            print("Error: 'probe' requires a URL (e.g. http://localhost:3000)")
            sys.exit(1)
        url = sys.argv[2]
        timeout = 3.0
        if "--timeout" in sys.argv:
            t_idx = sys.argv.index("--timeout")
            if t_idx + 1 < len(sys.argv):
                timeout = float(sys.argv[t_idx + 1])
        res = probe_endpoint(url, timeout)
        print_probe_summary(res)
        sys.exit(0 if res.get("reachable") and res.get("status_code", 0) < 500 else 1)
    else:
        print(f"Unknown command: '{cmd}'")
        sys.exit(1)

if __name__ == "__main__":
    main()
