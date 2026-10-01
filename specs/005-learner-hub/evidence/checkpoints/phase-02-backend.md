# Checkpoint: Phase 2 — Backend Domain & Core Services

Phase:
Phase 2 — Backend Domain & Core Services

Tasks Completed:
T007, T008, T009, T010, T011, T012, T013, T014

Status:
Verified

Files Changed:
- `backend/app/Models/CourseEntitlement.php` (created: T007)
- `backend/app/Models/Ticket.php` (created: T008)
- `backend/app/Models/TicketSequence.php` (created: T009)
- `backend/app/Models/User.php` (updated: T010)
- `backend/app/Models/Order.php` (updated: T011)
- `backend/app/Services/EntitlementService.php` (created: T012)
- `backend/app/Services/TicketMintingService.php` (created: T013)
- `backend/config/knzin.php` (created: T014)

Verification Performed:
- PHPUnit Test Suite: `php artisan test` passed 27/27 tests (527 assertions) in 9.61s.
- `scopeEffective` query logic verified: checks `status = 'active'`, handles bundle (`course_part_id is null`) or modular part.
- `TicketMintingService` verified: BCMath arbitrary-precision arithmetic prevents 64-bit integer overflow; Crockford Base32 formatting verified.

Security Verification:
- Order fulfillment locking uses `SELECT ... FOR UPDATE` ensuring safe concurrent webhook handling.
- MariaDB `ticket_sequences` is the sole authoritative durable sequence allocator.

Known Issues:
None.

Working Tree State:
Uncommitted (per No-Commit Policy).

Next Task:
T015 (Phase 3: GenerateTicketsJob)
