# Checkpoint: Phase 1 — Database Foundations

Phase:
Phase 1 — Database Foundations

Tasks Completed:
T001, T002, T003, T004, T005, T006

Status:
Verified

Files Changed:
- `backend/database/migrations/2026_10_01_000001_create_course_entitlements_table.php` (new)
- `backend/database/migrations/2026_10_01_000002_create_tickets_table.php` (new)
- `backend/database/migrations/2026_10_01_000003_create_ticket_sequences_table.php` (new)
- `backend/database/migrations/2026_10_01_000004_add_learner_code_to_users_table.php` (new)
- `backend/database/migrations/2026_10_01_000005_add_tickets_status_to_orders_table.php` (new)
- `backend/app/Models/User.php` (modified: T010 hook implemented to support T004 NOT NULL constraint)
- `backend/app/Models/CourseEntitlement.php` (new: T007)
- `backend/app/Models/Ticket.php` (new: T008)
- `backend/app/Models/TicketSequence.php` (new: T009)
- `backend/app/Models/Order.php` (modified: T011)

Verification Performed:
- `php artisan migrate:status`: All 18 migrations marked `Ran`.
- MariaDB DDL Inspection:
  - `course_entitlements`: `scope_key` virtual column verified, `uq_user_course_scope_status` verified.
  - `tickets`: `uq_order_ticket_index` verified, `uq_tickets_serial_number` verified.
  - `ticket_sequences`: `year` primary key and `current_sequence` counter verified.
  - `users`: `learner_code` varchar(16) NOT NULL UNIQUE verified.
  - `orders`: `tickets_status` enum('pending','completed') and `tickets_minted_at` verified.
- Full Backend Test Suite:
  - `php artisan test`: 27 passed (527 assertions) in 10.46s. Zero regressions.

Security Verification:
- All foreign keys on user, course, part, and order references use `ON DELETE RESTRICT`, preventing cascading deletion of financial/audit records.
- No PII is exposed in `learner_code`.

Known Issues:
None.

Working Tree State:
Uncommitted (per No-Commit Policy).

Next Task:
T012 (Phase 2: EntitlementService)
