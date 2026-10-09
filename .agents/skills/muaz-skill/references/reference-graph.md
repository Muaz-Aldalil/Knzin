# Reference Graph

Single source of truth for `references/`. Every file must appear here exactly once (no orphan files). Load order follows `SKILL.md` §2 decision tree; prerequisites are listed per node so no file loads standalone.

## Graph (ASCII)

```\n                        build-mode.md  (root — Phases 1-5)\n                              │\n        ┌─────────────┬───────┼──────────────┬─────────────────┬────────────┐\n        │             │       │              │                 │            │\n   intake-template  search-guide  code-standards  quality-gate  design-tokens\n        │             │       │              │                 │            │\n   (Phase 1)    premium-design └─ Phase 4 ───┴── CHK-delivery ─┘  (Phase 3)\n        │          compositions-detail\n        │          design-reference-workflow\n        │\n   security-levels ──┬── audit-mode        rules.md (root — rules source)\n                    └── build-mode Phase 1.5\n   memory-system ─ project-brief\n   mcp-setup (tooling — independent)\n   Phase 4 sections: seo, error-monitoring, pwa-offline, realtime,\n                     feature-flags, forms, api-patterns, analytics,\n                     i18n, storybook, component-a11y\n                     (all require build-mode Phase 4)\n   absorption ── independent capability (ABSORB trigger)\n                 (references: absorption.md, absorption-phases.md,\n                  absorption-tracking.md)\n   codebase-design ─ vocabulary reference (module, interface, depth,\n                      seam, adapter, leverage, locality + 3 principles)\n   grilling-session ─ user-invoked alignment session (design tree,\n                      frontier rounds) — called by absorption + architecture\n   domain-modeling ─ active domain model discipline (glossary, ADRs)\n                      — called by grilling-session + architecture + build-mode\n   improve-codebase-architecture ─ architecture survey + HTML report\n                      (Tailwind+Mermaid CDN) + grilling follow-up\n                      (calls: codebase-design, grilling-session, domain-modeling)\n```

## Node Registry

| File | Phase / Trigger | Prerequisites | Notes |
|---|---|---|---|
| `build-mode.md` | Phases 1–5 — BUILD/CREATE/DESIGN/SCAFFOLD | none (root) | Master pipeline; auto-detect (1A), pre-flight (2.5), blueprint (3) |
| `intake-template.md` | Phase 1 — full question list, defaults, confirmation | `build-mode` | Loaded only via build-mode Phase 1 |
| `search-guide.md` | Any `search.py` / `--design-system` query | none (root) | Windows: use `python`, not `python3` |
| `premium-design-guide.md` | Phases 2–3 — affirmative premium standard (13 brand references) | none (root) | Complements `compositions-detail` |
| `compositions-detail.md` | Phases 2–3 — visual structures, spacing, premium signals | `premium-design-guide` | Works with `data/compositions.csv` |
| `design-reference-workflow.md` | REFERENCE/INSPIRED-BY/CLONE/COPY requests | `build-mode`, `search-guide` | Design DNA JSON is field-13 source citation |
| `design-tokens.md` | Phase 3 — token output (3 formats) | `build-mode` | Output immediately after every Decision Brief |
| `security-levels.md` | After L1/L2/L3 detection, before Phase 5 | `build-mode` | Full checklists; also used by `audit-mode` |
| `code-standards.md` | Phase 4 — code generation conventions | `build-mode` | Naming, structure, API conventions, modern CSS |
| `component-a11y.md` | Phase 4 — accessible component patterns | `build-mode` | Modals, tabs, forms, toasts — WCAG AA copy-pasteable |
| `quality-gate.md` | Phase 5 — scoring rubric + enforcement | `build-mode` | Thresholds: 128-160 ship / 96-127 revise / <96 redesign |
| `memory-system.md` | AGENTS.md / PROGRESS.md / DECISIONS.md management | `build-mode` | AGENTS.md cap 60 lines; `LESSONS` block in PROGRESS.md |
| `project-brief.md` | End of Phase 3 — `.context/PROJECT_BRIEF.md` | `build-mode`, `memory-system` | Read first in every future response |
| `tune-mode.md` | TUNE/IMPROVE/FIX/REDESIGN existing UI | `build-mode`, `quality-gate` | Reuses pipeline; Decision Brief on changes |
| `audit-mode.md` | AUDIT/REVIEW/CHECK perf/a11y/security/i18n | `security-levels` | Verify with Lighthouse/Web Vitals |
| `rules.md` | All design rules — single source of truth | none (root) | Load on any quality enforcement question |
| `mcp-setup.md` | MCP configuration — Mobbin, Figma, Higgsfield | none (tooling) | Independent of pipeline |
| `seo.md` | Phase 4k — public-facing sites | `build-mode` | Skip for authenticated-only dashboards |
| `error-monitoring.md` | Phase 4l — external service dependencies | `build-mode` | Error monitoring + RUM |
| `pwa-offline.md` | Phase 4m — offline, installable, push | `build-mode` | Strategy table per use case |
| `realtime.md` | Phase 4n — live updates (chat, dashboards) | `build-mode` | WebSocket / SSE |
| `feature-flags.md` | Phase 4o — gradual rollouts, kill switches | `build-mode` | Unfinished features |
| `forms.md` | Phase 4p — user input beyond single search box | `build-mode` | Validation, wizards, uploads, drafts |
| `api-patterns.md` | Phase 4q — backend beyond simple GET | `build-mode` | Service layer rules |
| `analytics.md` | Phase 4r — engagement tracking, GDPR | `build-mode` | Public-facing sites |
| `i18n.md` | Phase 4s — multi-language, RTL | `build-mode` | Locale-aware formatting |
| `storybook.md` | Component libraries / visual regression | `build-mode` | Storybook + test-runner setup |
| `deai-ledger.md` | Phase 5 — de-AI technique ledger (T1–T108) | `build-mode`, `quality-gate` | Provenance for anti_slop source fields + numeric gates |
| `uxpeak-ledger.md` | Phase 5 — UXpeak technique ledger (U1–U149) | `build-mode`, `quality-gate` | Provenance for ux-guidelines.csv rows 101+ |
| `database.md` | Phase 3 (Full-Stack Addendum) | `build-mode` | Database decision framework + schema patterns + Prisma setup |
| `auth.md` | Phase 3 (Full-Stack Addendum) | `build-mode` | Auth implementation guidance (Clerk, NextAuth, Auth0, custom) |
| `payments.md` | Phase 3 (Full-Stack Addendum) | `build-mode` | Payment integration guidance (Stripe, PayPal, webhooks, PCI-DSS) |
| `backend.md` | Phase 3 (Full-Stack Addendum) | `build-mode` | Backend decision framework + structure + frontend connection |
| `deployment.md` | Phase 3 (Full-Stack Addendum) | `build-mode` | Full-stack deployment topology + env vars + secrets |
| `absorption.md` | ABSORB requests — overview + workflow activation | none (root) | Independent capability; loads absorption-phases.md for detail |
| `absorption-phases.md` | Phase-by-phase checklists (0–5b) | `absorption.md` | Full pipeline checklist; compact version of absorption-skill |
| `absorption-tracking.md` | Tracking file template + status format | `absorption.md` | Copy to absorption-plan.md at start of new absorption |

## Meta Layer (registry files — not loaded on request, but registered)

| File | Role |
|---|---|
| `reference-graph.md` | This registry (self-registered) |
| `glossary.md` | Terminology — single source of truth |
| `checklist-index.md` | CHK registry — which checklist owns which gate |
| `CHK-delivery.md` | Phase 5 pre-claim delivery verification checklist |

## Invariants

1. Every `references/*.md` appears exactly once in the registry (operational rows above or meta rows here) — a file not listed here is an orphan and must be added or deleted.
2. Every registry row maps to an existing file — a row without a file is a dangling reference.
3. Prerequisites are acyclic and point only at files with a lower or equal phase number.
4. README and `SKILL.md` §8 link to this file; they do not duplicate the registry.
