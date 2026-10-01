# Feature 005 — Test Plan & Verification Strategy

**Branch**: `005-learner-hub`  
**Feature**: Learner Hub, Course Library & Ticket Ledger  
**Date**: 2026-10-01  
**Status**: Complete (Audited against actual repository tests)

---

## 1. Overview & Strategy

This test plan defines the multi-layer automated and runtime verification strategy for Feature 005. Verification is divided into risk-proportional layers:
1. **Database & Invariant Verification**: MariaDB schema integrity, virtual column generation, composite unique constraints, and foreign key `RESTRICT` rules.
2. **Domain Logic & Concurrency**: 40-bit BCMath permutation bijection, sequence exhaustion guards, atomic sequence allocation, and order lock serialization.
3. **Queue Resilience & Self-Healing**: Asynchronous ticket generation, idempotency index protection, partial insert crash recovery, and scheduled reconciliation.
4. **Authorization & Media Security**: Free Part 1 preview vs. gated Part 2+ playback, signed 15-minute streaming/download URLs, tamper rejection, expired replay denial, and forensic canvas watermarking.
5. **Progress & Account Continuity**: Monotonic progress updates, 95% sticky completion, and deterministic guest-to-Google account merging with duplicate entitlement reconciliation.
6. **API Contracts**: JSON payload structure, status codes, and error formats adhering to `specs/005-learner-hub/contracts/`.
7. **Frontend Invariants & Accessibility**: Client untrust enforcement (zero `localStorage` purchase reads), drifting canvas overlay pass-through, Radix UI sliding drawer, and bidirectional RTL/LTR layout.

---

## 2. Requirement & Acceptance Criteria Traceability Matrix

| Requirement / Criteria | Description | Verification Suite / Location | Layer | Status |
| :--- | :--- | :--- | :--- | :--- |
| **FR-001** | Database entitlement creation & lifecycle | `CourseEntitlementTest.php` | Backend Feature | VERIFIED |
| **FR-002** | Bundle vs. modular part access resolution | `CourseEntitlementTest.php` | Backend Feature | VERIFIED |
| **FR-003** | Server-authoritative playback authorization | `PlaybackAuthorizationTest.php` | Backend Feature | VERIFIED |
| **FR-004** | Gated media with 15-minute signed URLs | `PlaybackAuthorizationTest.php`, `DownloadAuthorizationTest.php` | Backend Feature | VERIFIED |
| **FR-005** | Anti-piracy dynamic watermark payload & canvas | `PlaybackAuthorizationTest.php`, `LessonWatermarkOverlay.test.ts` | Full-Stack | VERIFIED |
| **FR-006** | Gated expiring resource downloads | `DownloadAuthorizationTest.php`, `LessonTabs.tsx` | Full-Stack | VERIFIED |
| **FR-007** | Proportional ticket minting ($2=1, $10=15) | `TicketMintingIdempotencyTest.php` | Backend Feature | VERIFIED |
| **FR-008** | Crockford Base32 canonical serial format | `TicketMintingIdempotencyTest.php`, `TicketPermutationTest.php` | Backend Feature / Unit | VERIFIED |
| **FR-009** | Dynamic draw eligibility half-open interval | `TicketEligibilityTest.php` | Backend Feature | VERIFIED |
| **FR-010** | Sliding ticket ledger drawer | `TicketLedgerDrawer.test.ts` | Frontend Component | VERIFIED |
| **FR-011** | Learner dashboard with dual progress metrics | `LearnerDashboardTest.php`, `LearnerDashboardView.tsx` | Full-Stack | VERIFIED |
| **FR-012** | Guest checkout account merge continuity | `AccountMergeEntitlementsTest.php` | Backend Feature | VERIFIED |
| **FR-013** | Monotonic progress persistence | `LessonProgressMonotonicityTest.php` | Backend Feature | VERIFIED |
| **FR-014** | Asynchronous ticket generation & idempotency | `TicketMintingIdempotencyTest.php`, `TicketDispatchFailureRecoveryTest.php` | Backend Feature | VERIFIED |
| **FR-015** | Progress bounds & authorization validation | `LessonProgressMonotonicityTest.php` | Backend Feature | VERIFIED |
| **FR-016** | Elimination of client-side purchase trust | `ClientUntrustInvariants.test.ts` | Frontend Unit | VERIFIED |
| **FR-017** | Sticky 95% completion locking | `LessonProgressMonotonicityTest.php` | Backend Feature | VERIFIED |
| **SC-001** | Unentitled access returns 403; zero client bypass | `PlaybackAuthorizationTest.php`, `ClientUntrustInvariants.test.ts` | Full-Stack | VERIFIED |
| **SC-002** | Ticket ratio ($2=1, $10=15) verified | `TicketMintingIdempotencyTest.php` | Backend Feature | VERIFIED |
| **SC-003** | Canonical serial formatting regex match | `TicketMintingIdempotencyTest.php`, `TicketLedgerDrawer.test.ts` | Full-Stack | VERIFIED |
| **SC-004** | Sliding drawer opens without route navigation | `TicketLedgerDrawer.test.ts` | Frontend Component | VERIFIED |
| **SC-005** | Bidirectional RTL and LTR support | `TicketLedgerDrawer.test.ts`, `LearnerDashboardView.tsx` | Frontend Component | VERIFIED |
| **SC-006** | Monotonic watch time and sticky completion | `LessonProgressMonotonicityTest.php` | Backend Feature | VERIFIED |
| **SC-007** | Idempotency under worker crash & concurrency | `TicketMintingIdempotencyTest.php` | Backend Feature | VERIFIED |
| **SC-008** | Unauthenticated access returns HTTP 401 | `PlaybackAuthorizationTest.php`, `LessonProgressMonotonicityTest.php` | Backend Feature | VERIFIED |

---

## 3. Test Suites Inventory

### 3.1 Backend Feature & Unit Tests (Laravel 11 / PHPUnit)

1. **`CourseEntitlementTest`** (`backend/tests/Feature/CourseEntitlementTest.php`):
   - Order completion creates active entitlement.
   - Bundle purchase grants access to all active parts.
   - Single part purchase grants access only to purchased part.
   - Bundle and part entitlements safely coexist as active.
   - Bundle revocation preserves independent modular part access.
   - Duplicate active entitlement creation is prevented by database unique index `uq_user_course_active_scope`.

2. **`PlaybackAuthorizationTest`** (`backend/tests/Feature/PlaybackAuthorizationTest.php`):
   - Part 1 returns public stream URL with zero authentication.
   - Part 2+ without authentication returns HTTP 401 (`ERR_UNAUTHORIZED`).
   - Part 2+ with unentitled user returns HTTP 403 (`ERR_PART_LOCKED`) with pricing payload.
   - Part 2+ with entitled user returns signed stream URL and dynamic watermark.
   - URL signature tampering or expired timestamp rejected at media origin (HTTP 403).
   - Cross-user playback authorization attempt is denied.
   - Parameter tampering (mismatched course slug / part number) returns HTTP 404.

3. **`DownloadAuthorizationTest`** (`backend/tests/Feature/DownloadAuthorizationTest.php`):
   - Authorized learner requesting correct resource succeeds with signed download URL.
   - Unauthenticated learner is denied (HTTP 401).
   - Learner from another course is denied (HTTP 403 `ERR_RESOURCE_LOCKED`).
   - Learner lacking part entitlement is denied (HTTP 403 `ERR_RESOURCE_LOCKED`).
   - Tampered resource identifier with invalid characters rejected (HTTP 400 `ERR_INVALID_RESOURCE_ID`).
   - Expired signed download URL denied at media origin after 16 minutes (HTTP 403).
   - Direct public access to protected media without signature denied (HTTP 403).
   - Signed download access cannot be reused for different resource/context.

4. **`TicketMintingIdempotencyTest`** (`backend/tests/Feature/TicketMintingIdempotencyTest.php`):
   - Single part order mints exactly 1 ticket.
   - Bundle order mints exactly 15 tickets.
   - All serials conform to canonical Crockford Base32 pattern (`^KNZ-[0-9]{2}-[0-9A-HJKMNP-Z]{4}-[0-9A-HJKMNP-Z]{4}$`).
   - Composite unique index `uq_order_ticket_index` rejects duplicate insert attempts.
   - Simulated worker crash after partial insert (5 of 15) resumes and mints exact delta (10).
   - Concurrent worker execution with order lock produces exactly 15 tickets total.
   - Concurrent sequence allocation slices are strictly disjoint without overlap.

5. **`TicketDispatchFailureRecoveryTest`** (`backend/tests/Feature/TicketDispatchFailureRecoveryTest.php`):
   - Order committed with `tickets_status = 'pending'` when queue dispatch fails.
   - `knzin:reconcile-ticket-generation` detects stale pending orders and successfully mints tickets.
   - Opening ticket drawer triggers on-demand re-dispatch for pending orders.

6. **`TicketEligibilityTest`** (`backend/tests/Feature/TicketEligibilityTest.php`):
   - Half-open interval `starts_at <= issued_at < ends_at` in UTC.
   - Ticket issued at exact `ends_at` qualifies for next draw window.
   - Draw with `status = 'locked'` closes ticket accumulation.
   - Monthly grand draw evaluates designated calendar month.
   - Tickets remain queryable in ledger after draw conclusion.

7. **`LessonProgressMonotonicityTest`** (`backend/tests/Feature/LessonProgressMonotonicityTest.php`):
   - Unauthenticated progress write returns HTTP 401.
   - Unentitled progress write on paid part returns HTTP 403.
   - Lower watch depth or percentage report cannot regress higher recorded values.
   - Reaching 95% sets `is_completed = true` permanently.
   - Subsequent lower watch report does not reset `is_completed` flag.
   - `percent_complete` rejected if < 0 or > 100 (HTTP 422).

8. **`AccountMergeEntitlementsTest`** (`backend/tests/Feature/AccountMergeEntitlementsTest.php`):
   - Guest order, progress, entitlements, and tickets are transferred to Google user ID.
   - Guest and Google user with identical entitlement scope marks guest record `superseded`.
   - Guest and Google user with part + bundle coexistence preserves both records.
   - Merge executing during active ticket generation serializes safely without lost tickets.

9. **`LearnerDashboardTest`** (`backend/tests/Feature/LearnerDashboardTest.php`):
   - `GET /api/v1/user/dashboard` returns enrolled courses, progress meters, and continuation hero.
   - Single part owner displays `owned_scope_progress_percentage` and `overall_progress_percentage` accurately.
   - Empty state returns empty enrolled list with zero mock data.

10. **`TicketPermutationTest`** (`backend/tests/Unit/TicketPermutationTest.php`):
    - Affine permutation bijection is strictly 1-to-1 across 1,000 sequence samples (zero collisions).
    - Sequence allocation overflow guard throws exception at $2^{40}$.
    - Yearly rollover resets sequence cleanly for new calendar year.

---

### 3.2 Frontend Verification Tests (Node.js Test Runner / TSX)

1. **`ClientUntrustInvariants.test.ts`** (`frontend/src/tests/ClientUntrustInvariants.test.ts`):
   - Modifying browser `localStorage` does NOT unlock paid video playback in player view.
   - Player requests server authorization token via `/playback-auth` before playback.

2. **`LessonWatermarkOverlay.test.ts`** (`frontend/src/tests/LessonWatermarkOverlay.test.ts`):
   - Canvas renders learner email, `learner_code`, and formatted timestamp.
   - Canvas element has `pointer-events: none` allowing video interaction pass-through.

3. **`TicketLedgerDrawer.test.ts`** (`frontend/src/tests/TicketLedgerDrawer.test.ts`):
   - Ticket counter badge click opens sliding drawer without page navigation.
   - Tickets display formatted Crockford serials and live draw countdown timers.
   - Drawer layout adheres to Arabic RTL and English LTR alignment using CSS logical properties.

---

## 4. Execution Commands

```bash
# Run all backend tests
cd backend
php artisan test

# Run focused Feature 005 backend tests
php artisan test --filter=CourseEntitlementTest
php artisan test --filter=PlaybackAuthorizationTest
php artisan test --filter=DownloadAuthorizationTest
php artisan test --filter=TicketMintingIdempotencyTest
php artisan test --filter=TicketDispatchFailureRecoveryTest
php artisan test --filter=TicketEligibilityTest
php artisan test --filter=LessonProgressMonotonicityTest
php artisan test --filter=AccountMergeEntitlementsTest
php artisan test --filter=LearnerDashboardTest
php artisan test --filter=TicketPermutationTest

# Run all frontend tests
cd ../frontend
npm test

# Run frontend typecheck & production build
npx tsc --noEmit
npm run build
```
