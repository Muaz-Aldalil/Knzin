---
name: backend-data
description: >
  Backend data procedures for the Backend Agent: relational/NoSQL modeling,
  caching, search, transactions, migrations, indexing, query optimization,
  database testing practices. Loaded on demand per detected stack.
---

# Backend Data Skill (project-owned)

**Ownership**: this project. Complements (never duplicates) global
`database`. Orphan-consumption: `muaz-skill/references/database.md`
(background only — provenance in `verification/shared-dependencies.json`).

**Boundary — owns**: data modeling, relational/NoSQL procedures, caching and
search procedures, transaction/migration/indexing/optimization practices,
database test practices.
**Boundary — does NOT own**: ORM selection dogma (evidence-driven per
FR-006); product-specific dialect trivia (lives in `references/`).

## 1. Modeling

Model the domain actually present: entities, relationships, constraints.
Prefer the simplest store satisfying consistency needs (relational default
for structured/relational data; document/key-value where shape varies;
cache for ephemeral/hot data alongside — never instead of — the system of
record).

## 2. Transactions and migrations

Multi-step writes that must succeed-or-fail together run in transactions.
Schema changes ship as migrations: forward-only, reviewable, applicable to
empty AND seeded databases; every migration states its blast radius (tables,
rows, downtime) and its rollback story. Never modify production data
manually. Never report migration success from SQL authorship alone — verify
application (and rollback where destructive).

## 3. Indexing and optimization

Index foreign keys, lookup predicates, and ordering keys; verify with the
database's own plan/explain output before and after. Optimize measured
hotspots, not imagined ones; cite the measurement.

## 4. Database testing practice

Contract tests for queries/migrations (seed → migrate → assert shape +
rows); empty-vs-seeded matrix for every migration; destructive migrations
require a backup + restore-verified rollback drill where the environment
permits, or an explicit not-verified statement where it does not.

## References

- `references/modeling.md`, `references/migrations.md`,
  `references/optimization.md` (project-authored).
- Global `database` — composed for selection/schema basics, never duplicated.
