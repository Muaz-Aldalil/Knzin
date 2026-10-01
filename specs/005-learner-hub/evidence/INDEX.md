# Feature 005 — Evidence Index & Verification Map

This index maps all implementation tasks, security audits, failure investigations, and checkpoints for Feature 005 (Learner Hub, Course Library & Ticket Ledger).

---

## 1. Phase Checkpoints

| Phase | Checkpoint File | Scope & Verification | Status |
| :--- | :--- | :--- | :--- |
| **Phase 1: Database Foundations** | [phase-01-database.md](file:///d:/Work%20Projects/Knzin%20Project/specs/005-learner-hub/evidence/checkpoints/phase-01-database.md) | Migrations `000001` through `000005`, InnoDB constraints, `RESTRICT` FKs | VERIFIED |
| **Phase 2: Backend Domain & Core Services** | [phase-02-backend.md](file:///d:/Work%20Projects/Knzin%20Project/specs/005-learner-hub/evidence/checkpoints/phase-02-backend.md) | Models, `EntitlementService`, BCMath 40-bit `TicketMintingService`, `config/knzin.php` | VERIFIED |
| **Phase 3: Fulfillment & Ticket Ledger** | [phase-03-tickets.md](file:///d:/Work%20Projects/Knzin%20Project/specs/005-learner-hub/evidence/checkpoints/phase-03-tickets.md) | `GenerateTicketsJob`, `OrderService` hook, reconciliation command, simulator | VERIFIED |
| **Phase 4: Media Security & Playback** | [phase-04-media.md](file:///d:/Work%20Projects/Knzin%20Project/specs/005-learner-hub/evidence/checkpoints/phase-04-media.md) | `protected-media` private disk, `MediaProtectionService`, signed streaming routes | VERIFIED |
| **Phase 5: Progress & Account Continuity** | [phase-05-progress-merge.md](file:///d:/Work%20Projects/Knzin%20Project/specs/005-learner-hub/evidence/checkpoints/phase-05-progress-merge.md) | Monotonic progress persistence, sticky 95% completion, deterministic account merge | VERIFIED |
| **Phase 6: API Layer & Contracts** | [phase-06-api.md](file:///d:/Work%20Projects/Knzin%20Project/specs/005-learner-hub/evidence/checkpoints/phase-06-api.md) | `DashboardController`, `LessonPlaybackController`, `TicketController`, API routes | VERIFIED |
| **Phase 7: Frontend Learner Hub & UI** | [phase-07-frontend.md](file:///d:/Work%20Projects/Knzin%20Project/specs/005-learner-hub/evidence/checkpoints/phase-07-frontend.md) | Hooks, `/dashboard` page, `TicketLedgerDrawer`, watermark canvas, mock purges | VERIFIED |
| **Phase 8: Automated Verification** | [phase-08-verification.md](file:///d:/Work%20Projects/Knzin%20Project/specs/005-learner-hub/evidence/checkpoints/phase-08-verification.md) | Complete backend (85 tests across 22 test files/classes, 5,739 assertions) & frontend (63 tests across 21 suites) + typecheck (0 errors) | VERIFIED |

---

## 2. Security Evidence Records

| Task | Security Evidence File | Target & Attack Attempt | Defense & Verification Result |
| :--- | :--- | :--- | :--- |
| **T046** | [T046-playback-authorization.md](file:///d:/Work%20Projects/Knzin%20Project/specs/005-learner-hub/evidence/security/T046-playback-authorization.md) | Anonymous / unentitled / cross-user playback request, URL signature tampering, expired replay | HTTP 401 unauth, HTTP 403 `ERR_PART_LOCKED`, HTTP 403 invalid signature at media origin. PASS. |
| **T028** | [T028-download-authorization.md](file:///d:/Work%20Projects/Knzin%20Project/specs/005-learner-hub/evidence/security/T028-download-authorization.md) | Cross-course IDOR, unentitled part download, tampered resource ID, expired URL replay, direct media bypass | HTTP 401 unauth, HTTP 403 locked, HTTP 400 regex whitelist, HTTP 403 signature check. PASS. |
| **T047** | [T047-ticket-idempotency.md](file:///d:/Work%20Projects/Knzin%20Project/specs/005-learner-hub/evidence/security/T047-ticket-idempotency.md) | Duplicate webhook replay, concurrent minting race, duplicate index collision, worker crash | Row-level order locking, `uq_order_ticket_index` DB uniqueness, exact delta minting. PASS. |
| **T050** | [T050-progress-authorization.md](file:///d:/Work%20Projects/Knzin%20Project/specs/005-learner-hub/evidence/security/T050-progress-authorization.md) | Unauthenticated progress write, unentitled write on locked part, progress rewind, percent out-of-bounds | HTTP 401 unauth, HTTP 403 locked, server-side `max()` monotonicity, sticky 95%, 422 bounds. PASS. |
| **T051** | [T051-account-merge-reconciliation.md](file:///d:/Work%20Projects/Knzin%20Project/specs/005-learner-hub/evidence/security/T051-account-merge-reconciliation.md) | Account takeover, duplicate scope uniqueness crash, race condition during ticket minting | Verified Google account guard, `superseded` status linking on collision, ascending lock ordering. PASS. |

---

## 3. Task Verification Records

| Task | Verification Evidence File | What It Proves | Result |
| :--- | :--- | :--- | :--- |
| **T001–T006** | [T001-T006-migration-result.md](file:///d:/Work%20Projects/Knzin%20Project/specs/005-learner-hub/evidence/verification/T001-T006-migration-result.md) | MariaDB schema creation, unique indices, virtual column `scope_key`, foreign key `RESTRICT` rules | PASS |
| **T045** | [T045-course-entitlement.md](file:///d:/Work%20Projects/Knzin%20Project/specs/005-learner-hub/evidence/verification/T045-course-entitlement.md) | Order fulfillment entitlement creation, bundle vs single-part access resolution, coexistence, revocation safety | PASS |
| **T048** | [T048-ticket-dispatch-recovery.md](file:///d:/Work%20Projects/Knzin%20Project/specs/005-learner-hub/evidence/verification/T048-ticket-dispatch-recovery.md) | Pending order retention on queue failure, `knzin:reconcile-ticket-generation` detection, self-healing drawer trigger | PASS |
| **T049** | [T049-ticket-eligibility.md](file:///d:/Work%20Projects/Knzin%20Project/specs/005-learner-hub/evidence/verification/T049-ticket-eligibility.md) | Half-open UTC interval `starts_at <= issued_at < ends_at`, exact `ends_at` rollover, locked draw closure, calendar month math | PASS |
| **T052** | [T052-learner-dashboard.md](file:///d:/Work%20Projects/Knzin%20Project/specs/005-learner-hub/evidence/verification/T052-learner-dashboard.md) | Dashboard metrics aggregation, dual progress formulas (`owned_scope` vs `overall`), continuation hero, zero-mock empty state | PASS |
| **T053** | [T053-ticket-permutation.md](file:///d:/Work%20Projects/Knzin%20Project/specs/005-learner-hub/evidence/verification/T053-ticket-permutation.md) | 40-bit affine bijection strictly 1-to-1 (0 collisions across 1,000 samples), overflow boundary guard at $2^{40}$, yearly rollover | PASS |
| **T054** | [T054-client-untrust-invariants.md](file:///d:/Work%20Projects/Knzin%20Project/specs/005-learner-hub/evidence/verification/T054-client-untrust-invariants.md) | Complete elimination of `localStorage` purchase reads (`DEF-05B`), paid YouTube URLs (`DEF-05C`), and `DEMO_ACTIVE_LEARNING` (`DEF-05D`) | PASS |
| **T055** | [T055-lesson-watermark-overlay.md](file:///d:/Work%20Projects/Knzin%20Project/specs/005-learner-hub/evidence/verification/T055-lesson-watermark-overlay.md) | Anti-piracy drifting canvas watermark formatting `{email, learner_code, timestamp}`, `pointer-events-none` pass-through | PASS |
| **T056** | [T056-ticket-ledger-drawer.md](file:///d:/Work%20Projects/Knzin%20Project/specs/005-learner-hub/evidence/verification/T056-ticket-ledger-drawer.md) | Ticket drawer state trigger without navigation, Crockford Base32 regex validation, bidirectional RTL/LTR positioning | PASS |
| **T063** | [T063-quickstart-validation.md](file:///d:/Work%20Projects/Knzin%20Project/specs/005-learner-hub/evidence/verification/T063-quickstart-validation.md) | Quickstart Scenarios 1–6: fulfillment simulation, ticket minting, reconciliation recovery, gated playback, watermark, monotonic progress, account merge, dashboard | PASS |

---

## 4. Failure Investigations & Root-Cause Resolutions

| Task | Failure Evidence File | Classification & Root Cause | Resolution |
| :--- | :--- | :--- | :--- |
| **T002** | [T002-foreign-key-mismatch.md](file:///d:/Work%20Projects/Knzin%20Project/specs/005-learner-hub/evidence/failures/T002-foreign-key-mismatch.md) | Foreign key type mismatch: `orders.id` is UUID while `order_items.id` is BIGINT | Aligned `tickets.order_item_id` to `foreignId()` referencing `order_items(id)` |
| **T004** | [T004-user-learner-code-constraint.md](file:///d:/Work%20Projects/Knzin%20Project/specs/005-learner-hub/evidence/failures/T004-user-learner-code-constraint.md) | Adding `NOT NULL UNIQUE` column to non-empty brownfield `users` table | Two-step migration: backfill existing users with Crockford Base32 codes, then add unique constraint |

---

## 5. Final Convergence Status

- **Tasks Defined**: 63 tasks (Phases 1–9)
- **Tasks Implemented & Verified**: T001 through T057, and T063 (100% of engineering, test, and verification tasks)
- **Deployment Gates (Phase 9)**: T058 through T062 documented as `OPERATIONAL PREREQUISITE — PENDING` for human operational release
- **Test Plan Artifact**: [test-plan.md](file:///d:/Work%20Projects/Knzin%20Project/specs/005-learner-hub/test-plan.md) (10 backend suites + 3 frontend suites mapped to FR-001..FR-017 & SC-001..SC-008)
- **Automated Tests**:
  - Backend: **85 passed (5,739 assertions)**
  - Frontend: **63 passed (21 test suites)**
  - TypeScript Typecheck: **0 errors**
  - Production Build: **Compiled & 47 static pages generated successfully (`npm run build`)**
- **Git Commit**: **NOT CREATED** (Strict No-Commit Policy Enforced).
