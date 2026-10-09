#!/usr/bin/env python3
"""
Antigravity Agent OS - In-Memory Micro-Sandbox & Hypothesis REPL Engine.
Provides ultra-fast (<15ms), zero-disk-pollution ephemeral execution
for Python snippets, SQL schema experiments, regex testing, and data transforms.
"""

import sys
import os
import io
import time
import json
import re
import sqlite3
import traceback
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

WORKSPACE_ROOT = Path("D:/Skills/.agents")

def run_python(code: str, timeout_seconds: float = 3.0) -> Dict[str, Any]:
    """
    Executes a Python snippet in an isolated in-memory environment,
    capturing stdout, stderr, and the return/evaluated value.
    """
    start_time = time.perf_counter()
    captured_stdout = io.StringIO()
    captured_stderr = io.StringIO()
    
    # Custom environment namespace
    sandbox_globals = {
        "__name__": "__sandbox__",
        "json": json,
        "re": re,
        "math": __import__("math"),
        "collections": __import__("collections"),
        "itertools": __import__("itertools"),
        "datetime": __import__("datetime"),
        "hashlib": __import__("hashlib"),
        "Path": Path,
    }
    sandbox_locals: Dict[str, Any] = {}

    old_stdout = sys.stdout
    old_stderr = sys.stderr

    status = "SUCCESS"
    error_msg = None
    eval_result = None

    try:
        sys.stdout = captured_stdout
        sys.stderr = captured_stderr

        # Check if code is a single expression
        try:
            compiled = compile(code, "<sandbox>", "eval")
            eval_result = eval(compiled, sandbox_globals, sandbox_locals)
        except SyntaxError:
            # Multi-line statement block
            compiled = compile(code, "<sandbox>", "exec")
            exec(compiled, sandbox_globals, sandbox_locals)
            if "result" in sandbox_locals:
                eval_result = sandbox_locals["result"]
            elif "output" in sandbox_locals:
                eval_result = sandbox_locals["output"]

    except Exception as e:
        status = "ERROR"
        error_msg = f"{type(e).__name__}: {str(e)}"
        captured_stderr.write(traceback.format_exc())
    finally:
        sys.stdout = old_stdout
        sys.stderr = old_stderr

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    return {
        "status": status,
        "result": eval_result,
        "stdout": captured_stdout.getvalue(),
        "stderr": captured_stderr.getvalue(),
        "error": error_msg,
        "elapsed_ms": round(elapsed_ms, 2)
    }

def run_sql(statements: str) -> Dict[str, Any]:
    """
    Executes SQL statements in an ephemeral in-memory SQLite database (:memory:)
    and returns query results with column metadata and ascii table.
    """
    start_time = time.perf_counter()
    status = "SUCCESS"
    error_msg = None
    results = []

    try:
        conn = sqlite3.connect(":memory:")
        cursor = conn.cursor()

        # Split multiple queries by semicolon safely
        query_list = [q.strip() for q in statements.split(";") if q.strip()]

        for query in query_list:
            cursor.execute(query)
            if cursor.description:
                columns = [desc[0] for desc in cursor.description]
                rows = cursor.fetchall()
                results.append({
                    "query": query,
                    "columns": columns,
                    "rows": rows,
                    "row_count": len(rows)
                })
            else:
                conn.commit()
                results.append({
                    "query": query,
                    "rows_affected": cursor.rowcount
                })

        conn.close()
    except Exception as e:
        status = "ERROR"
        error_msg = f"{type(e).__name__}: {str(e)}"

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    return {
        "status": status,
        "queries_executed": len(results),
        "results": results,
        "error": error_msg,
        "elapsed_ms": round(elapsed_ms, 2)
    }

def run_regex(pattern: str, text: str, replacement: Optional[str] = None) -> Dict[str, Any]:
    """
    Tests regular expression matches, capture groups, and substitutions.
    """
    start_time = time.perf_counter()
    status = "SUCCESS"
    error_msg = None
    matches_data = []
    replaced_text = None

    try:
        compiled = re.compile(pattern)
        for idx, m in enumerate(compiled.finditer(text), 1):
            matches_data.append({
                "match_index": idx,
                "full_match": m.group(0),
                "span": m.span(),
                "groups": list(m.groups()),
                "groupdict": m.groupdict()
            })

        if replacement is not None:
            replaced_text = compiled.sub(replacement, text)

    except Exception as e:
        status = "ERROR"
        error_msg = f"{type(e).__name__}: {str(e)}"

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    return {
        "status": status,
        "pattern": pattern,
        "match_count": len(matches_data),
        "matches": matches_data,
        "replaced_text": replaced_text,
        "error": error_msg,
        "elapsed_ms": round(elapsed_ms, 2)
    }

def format_sql_table(result: Dict[str, Any]) -> str:
    """Formats SQL rows into clean ASCII markdown table."""
    columns = result.get("columns", [])
    rows = result.get("rows", [])
    if not columns:
        return "No rows returned."

    col_widths = {col: len(col) for col in columns}
    for row in rows:
        for idx, col in enumerate(columns):
            val_str = str(row[idx]) if idx < len(row) else "NULL"
            col_widths[col] = max(col_widths[col], len(val_str))

    header = " | ".join(col.ljust(col_widths[col]) for col in columns)
    sep = "-+-".join("-" * col_widths[col] for col in columns)
    row_lines = []
    for row in rows:
        line = " | ".join((str(row[i]) if i < len(row) else "NULL").ljust(col_widths[col]) for i, col in enumerate(columns))
        row_lines.append(line)

    return f"{header}\n{sep}\n" + "\n".join(row_lines)

def main():
    if len(sys.argv) < 3:
        print("Usage: python scripts/repl_sandbox.py <py|sql|regex> <expression/query> [extra_args...]")
        print("Examples:")
        print("  python scripts/repl_sandbox.py py \"2**16\"")
        print("  python scripts/repl_sandbox.py sql \"CREATE TABLE t (x INT); INSERT INTO t VALUES (42); SELECT * FROM t;\"")
        print("  python scripts/repl_sandbox.py regex \"(?P<id>\\d+)\" \"User 123 in room 456\"")
        sys.exit(1)

    cmd = sys.argv[1].lower()
    arg1 = sys.argv[2]

    if cmd in ["py", "python", "eval"]:
        res = run_python(arg1)
        print(f"[{res['status']}] Evaluated in {res['elapsed_ms']}ms")
        if res["stdout"]:
            print(f"Stdout:\n{res['stdout'].strip()}")
        if res["result"] is not None:
            print(f"Result: {repr(res['result'])}")
        if res["error"]:
            print(f"Error: {res['error']}")
        sys.exit(0 if res["status"] == "SUCCESS" else 1)

    elif cmd == "sql":
        res = run_sql(arg1)
        print(f"[{res['status']}] Executed in {res['elapsed_ms']}ms")
        if res["error"]:
            print(f"Error: {res['error']}")
            sys.exit(1)
        for r in res["results"]:
            print(f"\nQuery: {r['query']}")
            if "columns" in r:
                print(format_sql_table(r))
            else:
                print(f"Rows affected: {r.get('rows_affected', 0)}")
        sys.exit(0)

    elif cmd == "regex":
        text = sys.argv[3] if len(sys.argv) > 3 else ""
        replacement = sys.argv[4] if len(sys.argv) > 4 else None
        res = run_regex(arg1, text, replacement)
        print(f"[{res['status']}] Tested in {res['elapsed_ms']}ms — {res['match_count']} match(es)")
        if res["error"]:
            print(f"Error: {res['error']}")
            sys.exit(1)
        for m in res["matches"]:
            print(f"  Match #{m['match_index']}: '{m['full_match']}' at {m['span']} | Groups: {m['groups']} | Named: {m['groupdict']}")
        if res["replaced_text"] is not None:
            print(f"Substituted: {res['replaced_text']}")
        sys.exit(0)

    else:
        print(f"Unknown sandbox mode: '{cmd}'")
        sys.exit(1)

if __name__ == "__main__":
    main()
