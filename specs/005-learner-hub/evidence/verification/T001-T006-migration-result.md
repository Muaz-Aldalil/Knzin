# Evidence: T001-T006 Database Foundations Migrations

Task:
T001, T002, T003, T004, T005, T006

Purpose:
Prove that all Phase 1 migrations create the required tables, virtual generated columns, indexes, and foreign key constraints in MariaDB without regressions to existing data.

Environment:
local (MariaDB 10.11+ / InnoDB)

Action:
Executed `php artisan migrate` and inspected schema with `SHOW CREATE TABLE` and `SHOW COLUMNS`.

Expected:
- `course_entitlements` table created with `scope_key` virtual generated column (`COALESCE(course_part_id, 'BUNDLE')`), foreign keys (`RESTRICT`), and `UNIQUE KEY uq_user_course_scope_status`.
- `tickets` table created with `uq_tickets_serial_number` and `UNIQUE KEY uq_order_ticket_index (order_id, order_ticket_index)`.
- `ticket_sequences` table created with `year` integer primary key and `current_sequence` unsigned bigint.
- `users.learner_code` column added (`VARCHAR(16) NOT NULL UNIQUE`) with backfill logic.
- `orders.tickets_status` (`ENUM('pending', 'completed')`) and `orders.tickets_minted_at` added.

Observed:
- `2026_10_01_000001_create_course_entitlements_table` DONE
- `2026_10_01_000002_create_tickets_table` DONE
- `2026_10_01_000003_create_ticket_sequences_table` DONE
- `2026_10_01_000004_add_learner_code_to_users_table` DONE
- `2026_10_01_000005_add_tickets_status_to_orders_table` DONE
- `SHOW CREATE TABLE course_entitlements` verified `scope_key` virtual column and `uq_user_course_scope_status`.
- `SHOW CREATE TABLE tickets` verified `uq_order_ticket_index` and `uq_tickets_serial_number`.
- `SHOW CREATE TABLE ticket_sequences` verified `year` primary key and counter.
- `php artisan test` passed 27/27 tests (527 assertions).

Result:
PASS

Repository Evidence:
- `backend/database/migrations/2026_10_01_000001_create_course_entitlements_table.php`
- `backend/database/migrations/2026_10_01_000002_create_tickets_table.php`
- `backend/database/migrations/2026_10_01_000003_create_ticket_sequences_table.php`
- `backend/database/migrations/2026_10_01_000004_add_learner_code_to_users_table.php`
- `backend/database/migrations/2026_10_01_000005_add_tickets_status_to_orders_table.php`

Notes:
All financial/entitlement foreign keys enforce `ON DELETE RESTRICT`. Existing catalog data (8 courses, 45 parts) preserved intact.
