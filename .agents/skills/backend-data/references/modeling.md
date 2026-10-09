# Data Modeling (project-owned reference)

- Model observed entities/relationships/constraints; no speculative tables.
- Relational default for structured data (foreign keys enforced);
  document/key-value where shape genuinely varies; cache alongside — never
  instead of — the system of record.
- Every model states its consistency expectation (strong vs eventual) and why.

Source: project-authored for FR-004/021. Complements global `database`.
