# Technical Research: Feature 005 — Learner Hub, Course Library & Ticket Ledger

**Branch**: `005-learner-hub`  
**Date**: 2026-10-01  
**Status**: Complete (Audited Across All 20 Hard Gates)  

---

## 1. Entitlement Schema, Uniqueness & Upgrade Safety (Hard Gates 10 & 11)

### Problem
How to model course entitlements in MariaDB to enforce the core business rules:
1. Only a completed/fulfilled order can create or activate an effective entitlement.
2. At most one effective bundle entitlement per learner per course.
3. At most one effective part entitlement per learner per course part.
4. A bundle covers all active published parts of the selected course.
5. Zero duplicate effective access states may exist.
6. A learner who buys Part 2 for $2 and later buys the $10 bundle must NEVER lose their Part 2 access if the bundle purchase is subsequently refunded, charged back, or administratively revoked.

### Architecture & Coexistence Proof
- Table `course_entitlements` includes:
  - `user_id` (foreignUuid -> users.id, `ON DELETE RESTRICT`)
  - `course_id` (foreignUuid -> courses.id, `ON DELETE RESTRICT`)
  - `course_part_id` (foreignUuid -> course_parts.id, nullable, `ON DELETE RESTRICT`)
  - `order_id` (foreignUuid -> orders.id, `ON DELETE RESTRICT`)
  - `status` (`'active'`, `'superseded'`, `'revoked'`)
  - `scope_key` (VIRTUAL: `COALESCE(course_part_id, 'BUNDLE')`)
  - `UNIQUE KEY uq_user_course_scope_status (user_id, course_id, scope_key, status)`

### Proof of Upgrade & Revocation Cases
Because `scope_key` is `'BUNDLE'` for a full course bundle and `part_id` for a single modular part:
1. **Case 1: Part 2 active $\rightarrow$ Bundle purchase $\rightarrow$ Bundle revoked**:
   - Initial state: Row A `(user_1, course_1, part_2_id, 'active')`.
   - Bundle purchase: Row B `(user_1, course_1, 'BUNDLE', 'active')` is inserted. Both rows coexist as `'active'` without index collision.
   - Effective query evaluates: `(course_part_id IS NULL OR course_part_id = :partId) AND status = 'active'`. Returns `true` for all parts.
   - Bundle revocation: Row B transitions to `status = 'revoked'`. Row A remains `status = 'active'`.
   - Querying Part 2 returns `true` (Row A matches). Querying Part 3 returns `false`.
   - **Conclusion**: The learner's legitimate original purchase is 100% preserved.
2. **Case 2: Bundle active $\rightarrow$ Part 2 revoked**:
   - Row B is `'active'`, Row A is `'revoked'`. Querying Part 2 returns `true` because Row B (`course_part_id IS NULL`) matches and covers all active parts.
3. **Case 3: Part 2 revoked $\rightarrow$ Bundle purchase**:
   - Row A is `'revoked'`, Row B is `'active'`. Querying Part 2 returns `true` via Row B.

### Effective Authorization Semantics
The authoritative answer to *"Does learner $U$ have access to course part $P$ of course $C$ right now?"* is a pure boolean disjunction:
$$\text{hasAccess}(U, C, P) \iff (P.\text{part\_number} == 1) \lor \exists E \in \text{entitlements}(U, C, \text{'active'}) : (E.\text{part\_id} \text{ IS NULL} \lor E.\text{part\_id} == P.\text{id})$$
This rule is simple, stateless, and requires no client-side precedence logic or complex state machines.

---

## 2. Durable Ticket Sequence Allocation vs Constitution (Hard Gate 1)

### Problem / Constitutional Mandate
Constitution Section VIII mandates: *"Purchases MUST dispatch a queued `GenerateTicketsJob` to Redis, utilizing atomic sequence allocations to prevent database deadlocks."*
A purely Redis-backed sequence counter is not inherently durable across Redis crashes, restarts, or cache flushes. Dual synchronization between Redis and MariaDB introduces distributed state drift.

### Selected Architecture: MariaDB Authoritative Durable Allocator
- **Authoritative Durable Store**: MariaDB table `ticket_sequences`:
  ```sql
  CREATE TABLE `ticket_sequences` (
      `year` INT NOT NULL,
      `current_sequence` BIGINT UNSIGNED NOT NULL DEFAULT 0,
      `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (`year`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  ```
- **Exact Transaction Semantics for Block Allocation**:
  To guarantee that range allocation and derivation occur from the same locked state without any interleaving, allocating a block of $N$ sequences (1 for part, 15 for bundle) executes within an isolated database transaction with pessimistic row locking:
  ```sql
  START TRANSACTION;
  -- 1. Ensure the year counter row exists without race conditions
  INSERT IGNORE INTO ticket_sequences (`year`, `current_sequence`) VALUES (:year, 0);
  
  -- 2. Lock the specific year row and read the authoritative base
  SELECT `current_sequence` 
  FROM ticket_sequences 
  WHERE `year` = :year 
  FOR UPDATE;
  
  -- 3. In application memory:
  -- $start = $current_sequence + 1;
  -- $end = $current_sequence + :count;
  
  -- 4. 40-Bit Overflow Guard:
  -- If ($end >= 1099511627776) {
  --     ROLLBACK;
  --     throw new SequenceExhaustedException("Annual ticket sequence exhausted for year {$year}");
  -- }
  
  -- 5. Advance counter and commit
  UPDATE ticket_sequences 
  SET `current_sequence` = :end 
  WHERE `year` = :year;
  
  COMMIT;
  ```
- **Concurrency & Elimination of Lock Contention**:
  The row lock on `ticket_sequences` for the given `year` is held only for the duration of the short allocation transaction. Another worker calling this method will wait on `SELECT ... FOR UPDATE` until the active worker commits, guaranteeing that workers receive strictly disjoint, non-overlapping sequence intervals $[S_{\text{start}}, S_{\text{end}}]$. This completely eliminates lock contention and deadlocks on the `tickets` table during insertion.
- **Durability**: Guaranteed by MariaDB InnoDB write-ahead redo log (WAL). Survives worker crashes, Redis node restarts, and host reboots.
- **Yearly Rollover**: Rows are partitioned by `year` (e.g. `2026`). On January 1st UTC, `INSERT IGNORE INTO ticket_sequences (year, current_sequence) VALUES (:year, 0)` initializes the new year at 0 in a race-safe manner.
- **Unused Numbers on Worker Failure**: If a worker allocates a block $[S_{\text{start}}, S_{\text{end}}]$ and crashes before committing tickets, those allocated sequence numbers remain unused (creating a gap in sequence values). Gaps are mathematically harmless; they can NEVER produce duplicate serials because `current_sequence` is monotonically increasing and never rewinds.

---

## 3. Canonical Serial Generation & Obfuscation (Hard Gate 4 & 5)

### Problem & Invariants
Format: `^KNZ-[0-9]{2}-[0-9A-HJKMNP-Z]{4}-[0-9A-HJKMNP-Z]{4}$` using Crockford Base32 (`0123456789ABCDEFGHJKMNPQRSTVWXYZ`).
The serial must be unique, immutable, non-PII, and auditable.

### Distinction of Properties
- **Bijective Uniqueness**: Every integer sequence $S \in [1, 2^{40}-1]$ is mapped through a deterministic mathematical bijection into Crockford Base32. Because the sequence allocator guarantees unique integers, serials are guaranteed unique by bijective construction.
- **Non-Sequential Obfuscation**: To prevent business competitors or external scrapers from inferring platform order volumes or predicting neighboring serials, the 40-bit sequence integer is permuted via an affine bijection over $\mathbb{Z}_{2^{40}}$:
  $$P(S) = (S \times M + C) \pmod{2^{40}} \oplus K$$
  where $M$ is a coprime multiplier (an odd integer, guaranteeing $\gcd(M, 2^{40}) = 1$ and invertibility modulo $2^{40}$), $C$ is a constant, and $K$ is a 40-bit mask.
- **Public Obfuscation, NOT Cryptographic Secrecy**: The parameters $M$, $C$, and $K$ are platform configuration parameters stored in `config/knzin.php`. They are NOT cryptographic private keys. Serials are public identifiers printed on customer receipts and entered into promotional draws. Tamper resistance is enforced exclusively by server-side database lookups in MariaDB, NEVER by the serial string alone.

---

## 4. Queue Dispatch Failure, Idempotency & Account Merge (Hard Gates 2, 3 & 12)

### Queue Dispatch Failure Recovery (Hard Gate 2)
If the database transaction commits the order as `completed`, but the post-commit Redis queue dispatch fails:
1. **Persistent State**: Table `orders` tracks `tickets_status ENUM('pending', 'completed') NOT NULL DEFAULT 'pending'` and `tickets_minted_at TIMESTAMP NULL`.
2. **Transaction Boundary**: The order fulfillment transaction commits with `status = 'completed'` and `tickets_status = 'pending'`.
3. **Queue Dispatch**: Dispatches `GenerateTicketsJob(order_id)->afterCommit()`. If Redis fails, the order remains `tickets_status = 'pending'`.
4. **Detection & Recovery**:
   - Scheduled command `php artisan knzin:reconcile-ticket-generation` (running every 5 minutes) queries:
     ```sql
     SELECT id FROM orders 
     WHERE status = 'completed' 
       AND tickets_status = 'pending' 
       AND created_at <= NOW() - INTERVAL 2 MINUTE;
     ```
   - Stale orders are automatically re-dispatched to the queue.
   - On-demand check: When a learner opens the ticket drawer (`GET /api/v1/user/tickets`), any pending ticket orders trigger immediate queue re-dispatch.

### Ticket Minting Concurrency & Database-Level Idempotency (Hard Gate 3)
Can concurrent workers produce 30 tickets for a 15-ticket order?
1. **Pessimistic Order Lock**:
   In `GenerateTicketsJob`:
   ```php
   DB::transaction(function () use ($orderId) {
       $order = Order::where('id', $orderId)->lockForUpdate()->first();
       if ($order->tickets_status === 'completed') {
           return; // Already fulfilled by another worker
       }
   ```
2. **Database Invariant Protection (`uq_order_ticket_index`)**:
   Table `tickets` contains:
   `order_ticket_index TINYINT UNSIGNED NOT NULL` (values $1 \dots 15$) and:
   `UNIQUE KEY uq_order_ticket_index (order_id, order_ticket_index)`.
   Even if application locks were completely bypassed, Worker B attempting to insert duplicate tickets for the same order will trigger a MariaDB `Duplicate entry for key uq_order_ticket_index` error and abort!
3. **Partial Crash Recovery**:
   If a worker commits 5 tickets and crashes, the retry worker reads `SELECT COUNT(*) FROM tickets WHERE order_id = :id` (which returns 5). The worker allocates sequence numbers for the remaining delta ($15 - 5 = 10$) and inserts indices $6 \dots 15$. Total is guaranteed to equal exactly 15.

### Account Merge Reconciliation Algorithm & Lock Ordering (Hard Gate 12)
When an unverified guest logs in with Google, `AccountMergeService` reconciles their identity:
1. **Deterministic Lock Ordering**:
   To prevent deadlocks between concurrent merges and ticket generation workers:
   - Lock users in ascending ID order: `User::whereIn('id', [$guestId, $googleId])->orderBy('id')->lockForUpdate()->get();`
   - Lock orders in ascending ID order: `Order::where('user_id', $guestId)->orderBy('id')->lockForUpdate()->get();`
2. **Entitlement Reconciliation Matrix**:
   - *Case 1 (Target has bundle, Guest has part)*: Target already has full course access. Guest's part entitlement has `user_id` updated to Target. It safely coexists as `active` because `scope_key` differs (`part_id` vs `'BUNDLE'`). If Target's bundle is ever revoked later, the part remains active.
   - *Case 2 (Guest has bundle, Target has part)*: Guest's bundle has `user_id` updated to Target. Both coexist as `active`. Target gains full course access.
   - *Case 3 (Identical Scope: both have same part or both have bundle)*: Updating `user_id` directly would cause a duplicate key error on `uq_user_course_scope_status`. Guest's row is updated to `status = 'superseded'`, `superseded_by_entitlement_id = $targetEntitlement->id`, and `user_id = $googleId`.
   - *Case 4 (Guest has entitlements Target lacks)*: Guest's entitlement has `user_id` updated to Target with `status = 'active'`.
3. **Tickets & Progress Reconciliation**:
   - `Ticket::where('user_id', $guestId)->update(['user_id' => $googleId]);`
   - For progress: updates unrecorded parts to Target; for overlapping parts, retains `MAX(watch_seconds)`, `MAX(percent_complete)`, `is_completed = target || guest`, and deletes guest progress row.
4. **Token Revocation & Deactivation**:
   - `$guestUser->tokens()->delete();`
   - `$guestUser->update(['status' => 'deactivated', 'merged_into_user_id' => $googleUser->id]);`

---

## 5. Persistent Opaque Learner Identifier Semantics (Hard Gate 5)

### Definition & Semantics
- **Definition**: Persistent opaque learner identifier uniquely assigned to the learner account.
- **Format**: `LRN-` + 6 uppercase Crockford Base32 characters (e.g. `LRN-7K2M9W`).
- **Generation Method**: Generated upon user creation using CSPRNG (`random_int(0, 31)` selecting 6 Crockford Base32 characters).
- **Collision Handling & Uniqueness**:
  - Keyspace is $32^6 = 1,073,741,824$ (~1.07 billion distinct identifiers).
  - Application checks candidate existence with up to 3 retries.
  - Final authority is MariaDB: `UNIQUE KEY uq_users_learner_code (learner_code)` on `users`. Any concurrent generation race triggers a database unique constraint violation, prompting an immediate retry with a fresh candidate.
- **Immutability**: Once assigned, `learner_code` is immutable.
- **Account Merge**: Upon Google OAuth merge, the surviving Google account retains its own persistent `learner_code`. The deactivated guest account retains its historical `learner_code` for audit traceability of prior sessions.
- **Legacy User Migration**: Database migration `add_learner_code_to_users_table` adds the column initially nullable, backfills existing users in chunks with unique generated codes, and then applies the `NOT NULL` constraint and `UNIQUE` index.
- **Privacy Boundary**: Does not expose internal database UUIDs, emails, phone numbers, or tokens.

---

## 6. Actual Paid Media Security, Storage & Cutover (Hard Gates 6 & 7)

### Comprehensive Answers to Hard Gate 6 Questions

1. **Where do current paid video assets physically exist?**
   - In the initial codebase, `course-content.ts` points to public YouTube embeds.
2. **Who/what uploads them to private storage?**
   - The platform content/video operations pipeline uploads encrypted/private video assets (`.mp4` / HLS packages) to the private media storage bucket as a mandatory deployment prerequisite.
3. **What is the development storage path?**
   - Laravel local private disk (`storage/app/protected-media/{courseSlug}/part-{partNumber}.mp4`) served via an authenticated, signed stream route: `GET /api/v1/media/stream/{courseSlug}/{partNumber}?signature=...&expires=...`.
4. **What is the production storage abstraction?**
   - Laravel `Storage::disk('protected-media')` supporting S3-compatible private storage (AWS S3, Cloudflare R2, or Bunny Storage) with time-limited signed URLs.
5. **What URL reaches the browser?**
   - A signed streaming URL valid for at most 15 minutes, returned by `POST /api/v1/lessons/{courseSlug}/parts/{partNumber}/playback-auth`.
6. **How is authorization enforced at the actual media origin?**
   - The media origin (or Laravel proxy in dev) validates the cryptographic HMAC signature and expiration timestamp. Requests without a valid signature or with expired timestamps return HTTP 403 / 410.
7. **Can a copied URL be used by another person during its valid window? (Hard Gate 7)**
   - **Residual Risk (Explicitly Acknowledged)**: A signed URL is a bearer capability during its remaining active minutes. If a user copies the active URL and shares it, another browser can fetch segments until `expires_at` is reached.
   - **Mitigation & Deterrence**: The dynamic Canvas watermark prominently renders the purchaser's full email and unique `learner_code`, creating an immediate visual trace that deters illicit screen recording and public sharing.
8. **What happens after 15 minutes?**
   - The signed URL expires. The media origin rejects subsequent chunk/byte requests with HTTP 403 / 410. The player must call `/playback-auth` to refresh its session.
9. **What happens after entitlement revocation?**
   - When the current 15-minute token expires, the player's refresh request to `/playback-auth` is rejected with HTTP 403 `ERR_PART_LOCKED`, terminating playback.
10. **What happens to the old public YouTube URLs?**
    - They are marked private or deleted on YouTube once private assets are verified.
11. **When are old URLs removed from public accessibility?**
    - Prior to frontend cutover.
12. **Can an old frontend still play the old public videos after cutover?**
    - No. Once the YouTube videos are made private or removed, any cached or old frontend attempting to play them receives an error.
13. **Deployment Prerequisite**:
    - Feature 005 cannot be declared production-secure until private media assets are uploaded and public links are disabled.

---

## 7. Draw Eligibility Boundary Semantics (Hard Gate 8)

### Boundary Rules
- **Timezone**: Strictly UTC (`Carbon::now('UTC')`).
- **Half-Open Interval**:
  $$\text{Eligible} \iff \text{draw.starts\_at} \le \text{ticket.issued\_at} < \text{draw.ends\_at}$$
  A ticket issued at the exact boundary `ends_at` belongs to the *next* draw window, not the concluding one.
- **Locked State**: If `draw.status == 'locked'` (draw is locked for RNG certified winner execution under Feature 008), ticket accumulation for that draw is closed.
- **Monthly Grand Draw**: Defined by the **designated calendar month** (e.g. `2026-10-01 00:00:00 UTC` to `2026-10-31 23:59:59 UTC`), NOT a hardcoded 30-day assumption.

---

## 8. Ticket Retention Semantics (Hard Gate 9)

- **Clarification**: Do NOT claim records survive "indefinitely".
- **Semantics**: Ticket identity survives draw conclusion and remains in the database ledger for historical user viewing and audit verification according to platform data retention policy. Long-term multi-year cold-storage archiving is an unresolved platform-level policy.
- **Foreign Keys**: `ON DELETE RESTRICT` on `orders` and `users` ensures tickets are not deleted prematurely.

---

## 9. Progress Validation & Semantics (Hard Gate 15)

- `watch_seconds`: Validated non-negative integer, capped at lesson duration (`MIN(part_duration, input)`).
- `percent_complete`: Validated integer strictly between `0` and `100` (`min:0|max:100`).
- Monotonicity: `watch_seconds = MAX(existing.watch_seconds, input.watch_seconds)` and `percent_complete = MAX(existing.percent_complete, input.percent_complete)`.
- Sticky 95%: Once `is_completed` is `true`, it cannot be regressed by any subsequent lower report.
- Authorization: Writes on Part 2+ require active entitlement verified via `EntitlementService`. Unentitled writes return HTTP 403 `ERR_PART_LOCKED`.

---

## 10. Dashboard Syllabus Progress Semantics (Hard Gate 11 & 16)

When a learner owns a single part vs a full bundle:
- **Curriculum-Level Progress (`overall_progress_percentage`)**: Represents the percentage of the **complete vocational curriculum** completed by the learner:
  $$\text{Curriculum Progress \%} = \frac{\sum_{i=1}^N \text{percent\_complete}(i)}{N}$$
  where $N$ is the total active published parts of the course.
- **Owned Scope Progress (`owned_scope_progress_percentage`)**: Represents the percentage of the parts the learner **actually purchased and owns**:
  $$\text{Owned Scope Progress \%} = \frac{\sum_{p \in \text{owned}} \text{percent\_complete}(p)}{\text{count}(\text{owned})}$$
- **Non-Misleading UI Presentation**:
  - For a bundle purchaser ($N=6$ parts): `owned_parts_count = 6`, `total_active_parts = 6`. Both progress metrics align.
  - For a single part purchaser ($p=1$ part): `owned_parts_count = 1`, `total_active_parts = 6`. If they complete their owned part, `owned_scope_progress_percentage = 100%`, while `overall_progress_percentage = 17%`.
  - The UI transparently presents: *"1 of 1 purchased modules completed (100%) • Course Total: 1 of 6 modules completed (17%)"* with an Upgrade CTA to purchase the remaining modules. The learner is never presented with a misleading denominator that devalues their purchased progress.
