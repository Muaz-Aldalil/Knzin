# Implementation Plan: Feature 005 — Learner Hub, Course Library & Ticket Ledger

**Branch**: `005-learner-hub` | **Date**: 2026-10-01 | **Spec**: [specs/005-learner-hub/spec.md](file:///d:/Work%20Projects/Knzin%20Project/specs/005-learner-hub/spec.md)  
**Input**: Master Roadmap Requirement, Approved Feature 005 Specification & 20-Gate Architectural Audit  

---

## Summary

Feature 005 establishes the educational and promotional core of KNZiN:
1. **The Educational Hub**: Transitions digital learning from an unauthenticated client-side demo (`DEF-05A`, `DEF-05B`, `DEF-05C`) into an authoritative, entitlement-gated experience. Implements `course_entitlements` in MariaDB with cascade-safe `RESTRICT` foreign keys, hardened playback authorization with signed 15-minute expiring streams on private storage, dynamic anti-piracy Canvas watermarking with a persistent opaque learner identifier (`users.learner_code VARCHAR(16) UNIQUE`, e.g. `LRN-XXXXXX`), 15-minute expiring gated downloads, monotonic progress persistence, and a dedicated learner dashboard (`/[locale]/dashboard`).
2. **The Promotional Ticket Ledger**: Implements an asynchronous promotional ticket minting engine (`GenerateTicketsJob` dispatched to Redis strictly after database commit). Utilizes MariaDB `ticket_sequences` as the sole authoritative durable sequence allocator with atomic block allocation, paired with a reversible 40-bit non-sequential permutation into canonical Crockford Base32 serials (`KNZ-YY-XXXX-YYYY`). Guarantees database-level idempotency via `uq_order_ticket_index`, post-commit queue dispatch failure recovery via `orders.tickets_status` and a scheduled reconciliation command, and evaluates dynamic half-open window-based eligibility (`starts_at <= issued_at < ends_at`) across active Hourly, Daily, and Monthly Grand draw tiers without permanent single-draw binding, surfaced through an accessible sliding drawer in the header HUD with live countdown timers.

---

## Technical Context

**Language/Version**: PHP 8.2+ (Laravel 11 backend) & TypeScript 5+ (Next.js 16.3.6 App Router frontend)  
**Primary Dependencies**:
- *Backend*: Laravel 11, Laravel Sanctum, Predis / Redis, Carbon.
- *Frontend*: Next.js 16, React 19, TailwindCSS v4, `next-intl` (RTL/LTR), Radix UI Primitives (`@radix-ui/react-dialog`, `@radix-ui/react-tabs`, `@radix-ui/react-progress`, `@radix-ui/react-dropdown-menu`), Lucide React.  
**Storage**: MariaDB 10.11+ / MySQL 8+ (`utf8mb4_unicode_ci`, InnoDB) with ACID guarantees; Redis 7+ for queue transport; private S3-compatible/local signed object storage for protected media.  
**Testing**: PHPUnit for Laravel backend feature tests; Node native test runner (`node --import tsx --test`) for frontend invariant tests.  
**Target Platform**: Web application supporting modern desktop, tablet, and mobile browsers with strict Arabic RTL primary and English LTR secondary layout parity.  
**Project Type**: Brownfield full-stack web application (REST API backend + SSR/CSR Next.js frontend).  
**Performance & Scalability Principles**:
- High-efficiency indexed queries on `(user_id, course_id, status)` for authorization and `(user_id, issued_at DESC)` for the ticket ledger.
- Sole authoritative durable sequence allocation in MariaDB via `ticket_sequences` (`UPDATE ... SET current_sequence = current_sequence + :count`), holding row locks for ~0.2ms and eliminating sequence deadlocks.
- Non-blocking asynchronous queue offloading via Redis for ticket minting under high-volume draw countdowns.
- Low-overhead Canvas overlay rendering without video frame re-encoding.  
**Constraints**:
- Maximum 15-minute validity for signed video streams and download links.
- Strictly asynchronous ticket generation; HTTP fulfillment request must not block.
- Zero PII leaks in watermarks and ticket serials.
- Zero floating-point monetary arithmetic.
- Zero mock/demo progress fallback in production interfaces.  
**Scale/Scope**: Catalog of modular vocational courses (4, 6, 8+ parts); thousands of daily draw participants; high-concurrency ticket minting.  

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Constitutional Invariant | Status | Plan Compliance Architecture |
| :--- | :--- | :--- |
| **I. Evidence-First & Brownfield** | **PASSED** | Audited active repository reality; preserved existing models (`Course`, `CoursePart`, `Order`, `Draw`) and extended `AccountMergeService` rather than rewriting. |
| **II. Whole-System Scope & Stack Lock** | **PASSED** | Architecture spans database migrations, Laravel services/controllers, Redis jobs, Next.js routes, and Radix UI components using standard repo stack. |
| **IV. Owner Authority Boundary** | **PASSED** | Preserved all 4 settled owner decisions (draw eligibility, Crockford Base32 serials, server watermark identity, complete course bundle scope); recorded Constitution "6 Parts" reconciliation. |
| **V. Arabic-First RTL/LTR & Touch** | **PASSED** | Uses CSS logical properties (`start`/`end`, `ms`/`me`), `<bdi>` semantic isolation, touch target compliance (&ge;44&times;44px), and bidirectional `next-intl` parity. |
| **VI. Legal Shield & Promotional Gift** | **PASSED** | Tickets are awarded as zero-value promotional grants (`promotional_tickets_granted`) tied to vocational course orders; no standalone lottery purchases. |
| **VII. Server Financial Integrity** | **PASSED** | Monetary calculations remain strictly in minor integer units (`cents`); browser state is treated as display-only. Foreign keys on orders/entitlements/tickets use `RESTRICT` to preserve financial auditability. |
| **VIII. Payment & Database Integrity** | **PASSED** | Order fulfillment requires verified webhook or secure backend confirmation; ticket generation is asynchronous via Redis `GenerateTicketsJob` dispatched post-commit with atomic sequence allocations in MariaDB `ticket_sequences` and idempotent delta creation. |
| **X. Server-Enforced Content Protection** | **PASSED** | Paid video streams and attachments protected by signed, short-lived tokens/URLs with a maximum lifespan of 15 minutes; paid videos hosted on private storage; Canvas watermark renders server-authoritative identity. |

---

## Project Structure

### Documentation (Feature 005)

```text
specs/005-learner-hub/
├── spec.md              # Feature specification
├── checklists/          # Quality checklists
│   └── requirements.md  # 22-item reviewed quality gate
├── plan.md              # This implementation plan
├── research.md          # Phase 0: Technical decisions & uncertainties resolved (20 Hard Gates audited)
├── data-model.md        # Phase 1: Entity-relationship schema & invariants
├── quickstart.md        # Phase 1: Validation scenarios & test instructions
├── contracts/           # Phase 1: API cross-layer interface contracts
│   ├── dashboard.contract.md
│   ├── playback-auth.contract.md
│   ├── downloads.contract.md
│   ├── progress.contract.md
│   └── tickets.contract.md
└── tasks.md             # Phase 2: Actionable tasks (created by /speckit-tasks)
```

### Source Code Architecture Layout

```text
backend/
├── app/
│   ├── Console/Commands/
│   │   ├── ReconcileTicketGenerationCommand.php # Scheduled recovery command (knzin:reconcile-ticket-generation)
│   │   └── SimulateFulfillmentCommand.php       # Development test simulator (non-prod only)
│   ├── Http/Controllers/
│   │   ├── DashboardController.php              # GET /api/v1/user/dashboard
│   │   ├── LessonPlaybackController.php         # POST /api/v1/lessons/.../playback-auth & downloads
│   │   ├── ProgressController.php               # Hardened monotonic progress & active learning
│   │   └── TicketController.php                 # GET /api/v1/user/tickets
│   ├── Jobs/
│   │   └── GenerateTicketsJob.php               # Asynchronous Redis-queued ticket minting
│   ├── Models/
│   │   ├── CourseEntitlement.php                # Access entitlement model
│   │   ├── Ticket.php                           # Promotional ticket ledger model
│   │   └── TicketSequence.php                   # Authoritative durable sequence counter model
│   └── Services/
│       ├── AccountMergeService.php              # Extended for entitlements and tickets
│       ├── EntitlementService.php               # Grant, verify, and resolve access
│       ├── MediaProtectionService.php           # 15-minute signed stream/download URLs
│       └── TicketMintingService.php             # Atomic sequence allocation & Crockford Base32
├── database/migrations/
│   ├── 2026_10_01_000001_create_course_entitlements_table.php
│   ├── 2026_10_01_000002_create_tickets_table.php
│   ├── 2026_10_01_000003_create_ticket_sequences_table.php
│   ├── 2026_10_01_000004_add_learner_code_to_users_table.php
│   └── 2026_10_01_000005_add_tickets_status_to_orders_table.php
└── tests/Feature/
    ├── CourseEntitlementTest.php
    ├── PlaybackAuthorizationTest.php
    ├── TicketMintingIdempotencyTest.php
    ├── TicketDispatchFailureRecoveryTest.php
    ├── LessonProgressMonotonicityTest.php
    └── AccountMergeEntitlementsTest.php

frontend/
├── src/
│   ├── app/[locale]/
│   │   └── dashboard/
│   │       └── page.tsx                         # Dedicated Learner Hub & Library route
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── LearnerDashboardView.tsx         # Dashboard layout & summary cards
│   │   │   ├── EnrolledCourseCard.tsx           # Course card with progress meter
│   │   │   └── JumpBackInHero.tsx               # Active continuation card
│   │   ├── layout/
│   │   │   ├── HeaderHUD.tsx                    # Ticket counter trigger integration
│   │   │   └── TicketLedgerDrawer.tsx           # Global sliding sheet for tickets & countdowns
│   │   └── lesson/
│   │       ├── LessonPlayerClientView.tsx       # Stripped of localStorage fake unlocks
│   │       ├── LessonVideoPlayer.tsx            # Protected stream player
│   │       ├── LessonWatermarkOverlay.tsx       # Dynamic anti-piracy Canvas watermark
│   │       └── LessonTabs.tsx                   # 15-minute expiring download links
│   ├── hooks/
│   │   ├── useLearnerDashboard.ts               # Dashboard data fetcher
│   │   ├── useLearnerTickets.ts                 # Ticket drawer fetcher & countdown sync
│   │   └── useLessonPlayback.ts                 # Playback token & watermark fetcher
│   └── lib/
│       ├── course-content.ts                    # Stripped of paid video & download URLs
│       └── progress.ts                          # Stripped of DEMO_ACTIVE_LEARNING fallback
```

---

## Core Subsystem Architectures

### 1. Entitlement Engine & Upgrade Safety (Hard Gates 10 & 11)
- **Model**: `CourseEntitlement` linked to `users`, `courses`, `orders`, and nullable `course_parts` with `ON DELETE RESTRICT`.
- **Precedence & Coexistence**: An active bundle entitlement (`course_part_id = NULL`, `scope_key = 'BUNDLE'`) safely coexists with earlier single-part entitlements (`scope_key = part_id`) because their scope keys differ.
- **Revocation Safety Proof**:
  - *Scenario A (Part 2 $\rightarrow$ Bundle $\rightarrow$ Bundle Revoked)*: If a bundle purchase is later cancelled or charged back (`bundle.status = 'revoked'`), the earlier part entitlement remains `status = 'active'`. The learner retains access to Part 2, completely preventing unfair access loss.
  - *Scenario B (Bundle Active $\rightarrow$ Part 2 Revoked)*: If the single-part order is revoked but the bundle remains active, querying Part 2 returns `true` because the bundle entitlement (`course_part_id IS NULL`) covers all active published parts.
  - *Scenario C (Part 2 Revoked $\rightarrow$ Bundle Purchased)*: Querying Part 2 returns `true` via the active bundle entitlement.
- **Authoritative Authorization Query**:
  ```sql
  SELECT 1 FROM course_entitlements
  WHERE user_id = :userId AND course_id = :courseId AND status = 'active'
    AND (course_part_id IS NULL OR course_part_id = :partId)
  LIMIT 1;
  ```
  Part 1 preview is always free and public without database query.
- **Uniqueness Invariant**: MariaDB `UNIQUE KEY uq_user_course_scope_status (user_id, course_id, scope_key, status)` guarantees at most one active record per user/course/scope. `EntitlementService` uses transactions with pessimistic row locks on `orders` to ensure concurrent fulfillment or account merge cannot insert duplicate active records.

### 2. Durable Ticket Minting & Ledger (Hard Gates 1, 2, 3, 4, 8, 9, 17)
- **Sole Authoritative Durable Allocator (Hard Gate 1)**: MariaDB `ticket_sequences` is the sole authoritative sequence allocator. It survives Redis crashes, flushes, or node restarts. Allocating a block of $N$ sequences (1 for part, 15 for bundle) executes inside an isolated transaction with pessimistic row-locking on the year counter:
  ```sql
  START TRANSACTION;
  INSERT IGNORE INTO ticket_sequences (`year`, `current_sequence`) VALUES (:year, 0);
  SELECT `current_sequence` FROM ticket_sequences WHERE `year` = :year FOR UPDATE;
  -- $start = $current_sequence + 1; $end = $current_sequence + :count;
  -- If ($end >= 1099511627776) throw new SequenceExhaustedException();
  UPDATE ticket_sequences SET `current_sequence` = :end WHERE `year` = :year;
  COMMIT;
  ```
  The row lock on `year` is held only for the duration of the short allocation transaction. Workers are pre-assigned mutually disjoint sequence blocks $[S_{\text{start}}, S_{\text{end}}]$, eliminating row-lock contention and deadlocks on the `tickets` table during insertion.
  - *Yearly Rollover*: Partitioned by `year`. On Jan 1st UTC, `INSERT IGNORE INTO ticket_sequences (year, current_sequence) VALUES (:year, 0)` initializes the year at 0 without race conditions.
  - *Overflow Bound*: Explicit guard check against $2^{40} = 1,099,511,627,776$; throws `SequenceExhaustedException` before mathematical limits.
  - *Unused Sequence Numbers*: Unused sequence numbers caused by worker crashes create harmless gaps but can NEVER create duplicates.
- **Queue Dispatch Failure Recovery (Hard Gate 2)**:
  `orders.tickets_status` tracks `'pending'` vs `'completed'`.
  Recovery chain: `commit -> dispatch failure -> detection -> recovery -> exact ticket total`:
  1. Transaction commits order with `status = 'completed'` and `tickets_status = 'pending'`.
  2. `GenerateTicketsJob(order_id)` is dispatched `->afterCommit()`. If Redis fails at this step, the order remains `tickets_status = 'pending'`.
  3. Detection & Recovery: Scheduled command `php artisan knzin:reconcile-ticket-generation` (running every 5 min) queries stale pending orders (`created_at <= NOW() - 2 min`) and re-dispatches the job. In addition, when the user opens their ticket drawer (`GET /api/v1/user/tickets`), any pending order triggers an immediate on-demand job re-dispatch.
- **Database-Level Idempotency Guarantee (Hard Gate 3)**:
  - Worker acquires pessimistic lock: `Order::where('id', $orderId)->lockForUpdate()->first()`.
  - Database invariant: `UNIQUE KEY uq_order_ticket_index (order_id, order_ticket_index)` where index is $1 \dots N$.
  - *Worker A & Worker B Race Proof*: Even if two workers race and both read 0 existing tickets, Worker A inserts indices $1 \dots 15$. When Worker B attempts to insert, MariaDB rejects with a unique constraint violation on `uq_order_ticket_index`. It is mathematically impossible to produce 30 tickets.
  - *Partial Crash Recovery*: If worker commits 5 tickets and crashes, retry worker reads `COUNT(*) = 5`. It allocates a sequence block for the missing delta ($15 - 5 = 10$) and inserts indices $6 \dots 15$. Total is guaranteed to equal exactly 15.
- **Canonical Serial Properties (Hard Gate 4)**:
  Format strictly matches `^KNZ-[0-9]{2}-[0-9A-HJKMNP-Z]{4}-[0-9A-HJKMNP-Z]{4}$` in Crockford Base32.
  Sequence integer is mapped through a 40-bit affine/Feistel bijection: $P(S) = (S \times M + C) \pmod{2^{40}} \oplus K$, where $M$ is an odd coprime integer ($\gcd(M, 2^{40}) = 1$).
  - *Uniqueness*: Guaranteed by bijective construction over unique sequence integers.
  - *Obfuscation*: Obscures issuance order and platform sales volume from external competitors/scrapers. Parameters $M, C, K$ are public configuration parameters (stored in `config/knzin.php`), NOT cryptographic private keys.
  - *Public Identifier*: The serial is a server-verified public identifier, not a cryptographic signature. Integrity is enforced via server database lookup.
- **Draw Eligibility Boundaries (Hard Gate 8)**:
  - Timezone: Strictly UTC (`Carbon::now('UTC')`).
  - Boundary: Half-open interval:
    $$\text{draw.starts\_at} \le \text{ticket.issued\_at} < \text{draw.ends\_at}$$
    A ticket issued at the exact boundary `ends_at` qualifies for the *next* draw window, not the concluding one.
  - Locked State: If `draw.status == 'locked'`, ticket accumulation for that draw is closed.
  - Monthly Grand Draw: Defined by the **designated calendar month** (e.g. Oct 1 00:00:00 UTC to Oct 31 23:59:59 UTC), never a hardcoded 30-day assumption.
- **Ticket Retention Semantics (Hard Gate 9)**:
  Ticket identity survives draw conclusion and remains permanently recorded in the database ledger for user viewing and regulatory audit according to platform data retention policy. Multi-year cold-storage archiving is an open platform policy. Foreign keys use `ON DELETE RESTRICT` to prevent accidental cascading deletion.
- **Drawer Data Freshness (Hard Gate 17)**:
  `GET /api/v1/user/tickets` returns `total_tickets`, `tickets[]`, `active_draws`, and `server_time_utc`.
  The frontend synchronizes client clocks against `server_time_utc` to eliminate client clock skew. When a countdown timer reaches `00:00:00`, the drawer automatically re-fetches authoritative draw status. SWR/React Query request sequence tags discard stale out-of-order responses.

### 3. Media Security & Dynamic Watermarking (Hard Gates 5, 6, 7)
- **Persistent Opaque Learner Identifier (Hard Gate 5)**:
  Defined as: *persistent opaque learner identifier uniquely assigned to the learner*.
  Stored in `users.learner_code` (`VARCHAR(16) UNIQUE`, e.g. `LRN-7K2M9W`). Generated on user creation via CSPRNG selecting 6 Crockford Base32 characters (keyspace $32^6 = 1,073,741,824$). Handled via 3-attempt collision retry loop in code and enforced by MariaDB `UNIQUE KEY uq_users_learner_code`. Immutable once generated. Deactivated guest accounts retain their code for historical audit; surviving Google accounts retain their verified code. Never exposes database UUIDs or personal data. Legacy users backfilled via migration.
- **Signed URL & Bearer Replay Risk (Hard Gate 7)**:
  Signed stream and download URLs are valid for a maximum of 15 minutes.
  *Explicit Residual Risk*: A signed URL is a bearer capability during its active 15-minute window; if copied and shared, another client can stream until expiration.
  *Mitigation*: The dynamic anti-piracy Canvas watermark rendered across the player displays the buyer's full email, `learner_code`, and playback timestamp, providing visual attribution that deters illicit screen recording and sharing.
- **Origin Security & Media Cutover (Hard Gate 6)**:
  Paid videos (Part 2+) are migrated to private storage (`protected-media` disk on local/S3/Bunny) and served via signed URLs. Part 1 remains public on YouTube.
  *Deployment Prerequisite*: Feature 005 cannot be declared production-secure until private media assets are uploaded and public YouTube URLs for paid parts are set to private or deleted.

### 4. Progress Synchronization & Monotonicity (Hard Gate 15)
- **Endpoint**: `POST /api/v1/progress` (Sanctum auth + entitlement check on parts > 1).
- **Integrity Validation**:
  - `percent_complete`: Integer strictly between `0` and `100` (`min:0|max:100`).
  - `watch_seconds`: Integer capped at part duration: `MIN(part_duration, input.watch_seconds)`.
- **Monotonicity**:
  $$\text{watch\_seconds} = \max(\text{existing.watch\_seconds}, \text{input.watch\_seconds})$$
  $$\text{percent\_complete} = \max(\text{existing.percent\_complete}, \text{input.percent\_complete})$$
- **Sticky Completion**: Reaching 95% permanently sets `is_completed = true`. Subsequent lower reports cannot regress completion status.
- **Authoritative State**: Eliminates `DEMO_ACTIVE_LEARNING` and mock fallbacks in `frontend/src/lib/progress.ts`.

### 5. Extended Account Merge & Concurrency (Hard Gate 3 & 12)
- **Service**: `AccountMergeService::mergeGuestIntoGoogle(User $googleUser)`.
- **Deterministic Lock Ordering**:
  - Lock users in ascending ID order: `User::whereIn('id', [$guestId, $googleId])->orderBy('id')->lockForUpdate()->get();`
  - Lock orders in ascending ID order: `Order::where('user_id', $guestId)->orderBy('id')->lockForUpdate()->get();`
- **Entitlement Reconciliation Matrix**:
  - *Target has bundle, Guest has part*: Guest's part entitlement `user_id` updated to Target; both coexist as `active` under distinct `scope_key`.
  - *Guest has bundle, Target has part*: Guest's bundle `user_id` updated to Target; both coexist as `active`.
  - *Identical scope (both have part or both have bundle)*: Guest's row updated to `status = 'superseded'`, `superseded_by_entitlement_id = $targetEntitlement->id`, and `user_id = $googleId`.
  - *Guest has entitlement Target lacks*: Guest's entitlement `user_id` updated to Target as `active`.
- **Cross-Process Worker Race**:
  Both `GenerateTicketsJob` and `AccountMergeService` acquire pessimistic row locks on `orders` (`lockForUpdate()`).
  - *If merge runs first*: `$order->user_id` updates to `$googleUser->id`. Worker reads `$googleUser->id` and mints directly to Google user.
  - *If worker runs first*: Worker mints tickets to `$guestUser->id` and sets `tickets_status = 'completed'`. Merge updates all `tickets` to `$googleUser->id`.
  - In either order: exact ticket total is preserved, all tickets belong to Google user, zero lost or duplicated tickets.

### 6. Dashboard Curriculum & Scope Semantics (Hard Gate 11 & 16)
- **Curriculum Progress (`overall_progress_percentage`)**: Represents the percentage of the **complete vocational curriculum** completed by the learner:
  $$\text{Curriculum Progress \%} = \frac{\sum_{i=1}^N \text{percent\_complete}(i)}{N}$$
  where $N$ is the total active published parts of the course.
- **Owned Scope Progress (`owned_scope_progress_percentage`)**: Represents the percentage of the parts the learner **actually purchased and owns**:
  $$\text{Owned Scope Progress \%} = \frac{\sum_{p \in \text{owned}} \text{percent\_complete}(p)}{\text{count}(\text{owned})}$$
- **Non-Misleading UI Presentation**:
  - For a single part purchaser ($p=1$ part): `owned_parts_count = 1`, `total_active_parts = 6`. Finishing the part displays `owned_scope_progress_percentage = 100%`, while `overall_progress_percentage = 17%`.
  - UI displays: *"1 of 1 purchased modules completed (100%) • Course Total: 1 of 6 modules completed (17%)"* with an Upgrade CTA to purchase the remaining modules.
  - Surfaces `entitlement_type: 'part'` vs `'bundle'`, displaying locked badges on unpurchased parts.
- The dashboard course card surfaces `entitlement_type: 'part'` vs `'bundle'`, displaying locked badges on unpurchased parts with an upgrade CTA.

---

## Rollout & Migration Sequencing (Hard Gates 6 & 13)

A secure rollout must ensure old clients cannot bypass new security boundaries or access old public videos.

```text
Phase 1: Database Migrations
├── Run 2026_10_01_000001_create_course_entitlements_table.php (RESTRICT FKs)
├── Run 2026_10_01_000002_create_tickets_table.php (RESTRICT FKs, uq_order_ticket_index)
├── Run 2026_10_01_000003_create_ticket_sequences_table.php
├── Run 2026_10_01_000004_add_learner_code_to_users_table.php
└── Run 2026_10_01_000005_add_tickets_status_to_orders_table.php

Phase 2: Private Media Provisioning & Backend API Deployment (MANDATORY PREREQUISITE)
├── Upload private video packages (Part 2+) to private storage bucket (`protected-media` disk)
├── Deploy Laravel models, services, controllers, and jobs
├── Verify signed 15-minute streaming URLs return HTTP 200 for entitled users
└── Run backend automated test suite to confirm authorization gates pass

Phase 3: Public YouTube Paid Media Lockdown
├── Set all YouTube videos for paid parts (Part 2+) to private or unlisted/deleted
├── Confirm direct YouTube playback for paid parts is completely disabled
└── At this point, no external party can stream paid content via old YouTube links

Phase 4: Frontend Cutover & Edge Cache Purge
├── Deploy Next.js frontend with /[locale]/dashboard, TicketLedgerDrawer, and hardened player
├── Purge CDN edge caches (Cloudflare/Vercel) to invalidate cached JavaScript bundles
└── Verify browser localStorage manipulation no longer unlocks content
```

---

## Testing Architecture (Hard Gate 18)

Every critical security boundary is mapped directly to concrete integration tests:

| Security Boundary | Test Suite | Specific Test Method | Verification Target |
| :--- | :--- | :--- | :--- |
| **Authorization** | `CourseEntitlementTest.php` | `test_unentitled_paid_part_denied` | HTTP 403 `ERR_PART_LOCKED` on Part 2+ without entitlement |
| **Upgrade Safety** | `CourseEntitlementTest.php` | `test_bundle_revocation_preserves_single_part` | Revoking bundle does NOT revoke earlier purchased Part 2 |
| **Media Expiry** | `PlaybackAuthorizationTest.php` | `test_signed_stream_expires_after_15_minutes` | Requests beyond 15 min return HTTP 403 / 410 |
| **Media Origin Cutover**| `PlaybackAuthorizationTest.php` | `test_paid_parts_served_from_private_disk` | Paid parts return signed private URLs, not YouTube URLs |
| **Ticket Concurrency** | `TicketMintingIdempotencyTest.php` | `test_concurrent_workers_cannot_duplicate_tickets`| Concurrent workers produce exactly 15 tickets total |
| **Dispatch Recovery** | `TicketDispatchFailureRecoveryTest.php`| `test_reconciliation_command_catches_un_enqueued_orders`| Stale pending orders re-queued and completed |
| **Partial Job Recovery**| `TicketMintingIdempotencyTest.php` | `test_partial_generation_resumes_missing_delta` | 5 existing tickets $\rightarrow$ retry mints exactly remaining 10 |
| **Account Merge** | `AccountMergeEntitlementsTest.php` | `test_merge_transfers_entitlements_and_tickets` | Guest tickets & entitlements transferred to Google user ID |
| **Merge Race** | `AccountMergeEntitlementsTest.php` | `test_merge_during_ticket_generation_race` | Simultaneous worker & merge preserves all tickets under Google user |
| **Draw Boundaries** | `TicketEligibilityTest.php` | `test_half_open_window_and_locked_status` | Half-open interval `starts_at <= issued < ends_at`; locked draws closed |
| **Client Untrust** | `ClientUntrustInvariants.test.ts`| `test_localstorage_cannot_unlock_paid_content` | Server rejects unentitled stream requests regardless of client state |
| **Progress Monotonicity**| `LessonProgressMonotonicityTest.php`| `test_progress_monotonicity_and_sticky_completion` | Lower watch reports cannot regress progress; 95% is permanent |

---

## Complexity Tracking (Hard Gate 19)

| Architectural Choice | Why Needed | Simpler Alternative Rejected Because |
| :--- | :--- | :--- |
| **Dedicated `course_entitlements` Table** | Decouples financial transactions from ongoing access rights. Essential for bundle upgrades, account merges, and revocations. | Direct query on `orders` requires complex joins on every video stream and fails to handle bundle upgrade/revocation cleanly. |
| **MariaDB `ticket_sequences` Allocator** | Guaranteed ACID durability surviving Redis loss; $O(1)$ atomic block allocation eliminates row-lock deadlocks on `tickets`. | Pure Redis counter loses state on cache flush/crash; dual sync causes distributed drift; random retry causes lock contention. |
| **`uq_order_ticket_index` Constraint** | Absolute database-level protection against duplicate ticket creation during concurrent worker races. | Application-level checking alone is vulnerable to race conditions if locking is bypassed or misconfigured. |
| **Persisted `learner_code` on `users`** | Guarantees database-enforced unique learner identity for anti-piracy Canvas watermarks. | 4-character hashes suffer from high birthday-paradox collision rates (~1,000 users), risking ambiguous forensic attribution. |
| **Private Media Storage Migration** | Real media security for paid lessons (Part 2+). Supports 15-minute signed temporary streaming URLs. | Public YouTube cannot enforce time-limited signed access or prevent direct link sharing and scraping. |
