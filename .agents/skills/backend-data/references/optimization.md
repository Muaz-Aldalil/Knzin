# Query Optimization (project-owned reference)

- Index foreign keys, lookup predicates, ordering keys.
- Verify with the database's own plan/explain output before AND after.
- Optimize measured hotspots only; cite the measurement (query, time, rows).
- Re-verify after data growth changes the plan; record the check.

Source: project-authored for FR-017/021. Complements global `database`.
