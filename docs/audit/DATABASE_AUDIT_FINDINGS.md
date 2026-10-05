# KNZiN Production Readiness Audit — Stage 3: Database & Migrations Findings

**Audit Target**: Database Schema & Migrations (`backend/database/migrations/`)  
**Database Engines**: MariaDB 10.11+ / MySQL 8.0+ / SQLite (Tests)  
**Status**: Completed  
**Audit Mode**: Strictly Read-Only  
**Generated**: 2026-10-05  

---

## Executive Summary of Database Findings

| Finding ID | Severity | Category | Title | Status |
| :--- | :--- | :--- | :--- | :--- |
| **PROD-023** | **MEDIUM** | Schema / Integrity | Non-Unique `email` on `users` Table Permitting Multi-Row Duplication | Verified Schema Gap |
| **PROD-024** | **MEDIUM** | Indexing / Performance | Missing Composite Index on `lesson_progress` and Standalone on `tickets(issued_at)` | Verified Performance Gap |
| **PROD-025** | **HIGH** | Referential Integrity | `draw_winners` Stores Loose String `winning_ticket_serial` Without Foreign Key | Verified Integrity Risk |
| **PROD-026** | **LOW** | DDL / Portability | Raw MySQL DDL Constraints Fragile Across DB Engines & Migrations | Verified Maintenance Risk |

---

## Detailed Database Findings

---

### PROD-023: Non-Unique `email` on `users` Table Permitting Multi-Row Duplication

- **Severity**: **MEDIUM**
- **Category**: Schema Design & Data Integrity
- **Status**: Verified Schema Gap
- **Location**:
  - `backend/database/migrations/2026_09_29_000001_create_users_table.php` (Line 16)
  - `backend/app/Models/User.php`
- **Evidence**:
  ```php
  // backend/database/migrations/2026_09_29_000001_create_users_table.php:16
  $table->string('email', 255)->index('idx_users_email'); // Non-unique index!
  ```
- **Execution Path**:
  1. The schema permits multiple user records with identical email addresses because guest checkout creates a new `guest` user row on each purchase if an active row isn't found.
  2. While `AccountMergeService` was designed to consolidate guest rows upon Google login, if a user signs up with multiple guest purchases or multiple OTP attempts, duplicate active user rows with the exact same email can proliferate in the database.
  3. Subsequent queries using `User::where('email', $email)->first()` become non-deterministic when multiple active rows exist.
- **Impact**: Non-deterministic user resolution, potential race conditions during account merge, and risk of orphaned entitlements or orders under shadowed user IDs.
- **Recommended Direction**:
  - Enforce a partial unique index in MariaDB/MySQL (`CREATE UNIQUE INDEX uq_active_verified_user_email ON users(email) WHERE status = 'active' AND merged_into_user_id IS NULL`), or enforce strict email uniqueness on the `users` table while tracking guest checkouts by order email rather than phantom user rows.

---

### PROD-024: Missing Composite Index on `lesson_progress` and Standalone Index on `tickets(issued_at)`

- **Severity**: **MEDIUM**
- **Category**: Database Indexing & Query Performance
- **Status**: Verified Performance Gap
- **Location**:
  - `backend/database/migrations/2026_09_29_000006_create_lesson_progress_table.php` (Lines 16–26)
  - `backend/database/migrations/2026_10_01_000002_create_tickets_table.php` (Lines 26–28)
- **Evidence**:
  ```php
  // lesson_progress only has single-column indexes:
  $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete()->index('idx_progress_user');
  $table->foreignUuid('course_id')->constrained('courses')->cascadeOnDelete()->index('idx_progress_course');
  // No composite index on (user_id, course_id)!
  ```
  ```php
  // tickets only indexes issued_at composite with user_id:
  $table->index(['user_id', 'issued_at'], 'idx_tickets_user_issued');
  // No standalone index on issued_at for time-window queries across all users!
  ```
- **Execution Path**:
  1. `DashboardController::index` executes `LessonProgress::where('user_id', $user->id)->where('course_id', $course->id)->get()` for every enrolled course. Because `user_id` and `course_id` are separate indexes, MySQL must perform index merge or rely solely on `user_id`, causing unnecessary row lookups.
  2. Background scheduled commands (such as draw eligibility queries or ticket reconciliation) query tickets created within specific time windows. Without `issued_at` as the leading column, these queries trigger expensive index full scans or table scans across millions of ticket rows.
- **Impact**: Increased query latency on the learner dashboard and degraded performance for background cron tasks under high ticket volume.
- **Recommended Direction**:
  - Add `$table->index(['user_id', 'course_id'], 'idx_progress_user_course');` to `lesson_progress`.
  - Add `$table->index('issued_at', 'idx_tickets_issued_at');` to `tickets`.

---

### PROD-025: `draw_winners` Stores Loose String `winning_ticket_serial` Without Foreign Key

- **Severity**: **HIGH**
- **Category**: Referential Integrity & Legal Auditability
- **Status**: Verified Referential Integrity Risk
- **Location**:
  - `backend/database/migrations/2026_09_29_000009_create_draw_winners_table.php` (Lines 17–19)
  - `backend/database/migrations/2026_09_30_000001_enforce_financial_and_draw_invariants.php` (Lines 50–55)
  - `backend/app/Services/Admin/DrawLifecycleService.php` (Lines 263–265)
- **Evidence**:
  ```php
  // backend/database/migrations/2026_09_29_000009_create_draw_winners_table.php:17
  $table->string('winning_ticket_serial', 50)->index('idx_draw_winners_serial'); // Loose VARCHAR!
  // No $table->foreignUuid('ticket_id') or foreignUuid('user_id')!
  ```
- **Execution Path**:
  1. The canonical winner record stores only the string serial: `'winning_ticket_serial' => 'KNZ-26-XXXX-YYYY'`.
  2. In `DrawLifecycleService::complete`, the backend resolves the winner's user account via:
     `$ticket = Ticket::where('serial_number', $winner->winning_ticket_serial)->first();`
     `$winnerUser = $ticket->user;`
  3. If an administrative script, CLI command, or data patch inserts a mistyped serial number or an unminted promotional serial, the database engine accepts the record without validation.
  4. At completion time, `$ticket` is `null`, so `$winnerUser` is not notified, and the draw concludes with an unresolvable orphan winner record that cannot claim their prize.
- **Impact**: Critical breakdown of prize fulfillment and legal transparency in promotional draws.
- **Recommended Direction**:
  - Add an explicit foreign key column `$table->foreignUuid('ticket_id')->constrained('tickets')->restrictOnDelete();` and `$table->foreignUuid('user_id')->constrained('users')->restrictOnDelete();` to `draw_winners` to enforce absolute database-level referential integrity.

---

### PROD-026: Raw MySQL DDL Constraints Fragile Across DB Engines & Migrations

- **Severity**: **LOW**
- **Category**: DDL Portability & Operational Maintenance
- **Status**: Verified Maintenance Risk
- **Location**:
  - `backend/database/migrations/2026_09_30_000001_enforce_financial_and_draw_invariants.php` (Lines 20–48)
- **Evidence**:
  ```php
  // Uses direct DB::statement with MySQL-specific syntax:
  DB::statement('ALTER TABLE courses ADD CONSTRAINT chk_courses_bundle_price_non_negative CHECK (bundle_price_cents >= 0)');
  ```
- **Execution Path**:
  1. In local or testing environments running SQLite memory databases, raw `ALTER TABLE ... ADD CONSTRAINT` fails unless wrapped in driver detection guards.
  2. Reverting migrations (`php artisan migrate:rollback`) executes `ALTER TABLE DROP CONSTRAINT`, which exhibits syntactic differences across MySQL 8.0.16+, older MariaDB releases, and SQLite.
- **Impact**: Testing pipeline fragility when switching database drivers and potential migration rollback failure in staging/CI.
- **Recommended Direction**:
  - Wrap raw DDL constraints in database driver checks (`if (DB::getDriverName() === 'mysql' || DB::getDriverName() === 'mariadb')`).
