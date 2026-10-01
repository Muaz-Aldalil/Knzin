# Evidence: Ticket Dispatch Failure and Self-Healing Recovery

Task:
T048

Purpose:
Prove that orders are safely committed with `tickets_status = 'pending'` when queue dispatch fails, the scheduled reconciliation command `knzin:reconcile-ticket-generation` detects stale pending orders and dispatches background minting, job execution successfully mints missing tickets, and user drawer access (`GET /api/v1/user/tickets`) triggers self-healing on-demand re-dispatch.

Environment:
local / test (Laravel 11, MariaDB `knzin_test` with `RefreshDatabase`)

Action:
Executed automated feature test suite:
`php artisan test --filter=TicketDispatchFailureRecoveryTest`

Expected:
All 4 feature tests pass proving background recovery and self-healing drawer dispatch.

Observed:
```text
   PASS  Tests\Feature\TicketDispatchFailureRecoveryTest
  ✓ order committed with tickets status pending when queue dispatch fails                                        7.61s  
  ✓ reconcile command detects stale pending orders and dispatches jobs                                           0.15s  
  ✓ reconciled job execution successfully mints tickets                                                          0.17s  
  ✓ opening ticket drawer triggers on demand redispatch for pending orders                                       0.19s  

  Tests:    4 passed (12 assertions)
  Duration: 8.30s
```

Result:
PASS

Repository Evidence:
- [backend/tests/Feature/TicketDispatchFailureRecoveryTest.php](file:///d:/Work%20Projects/Knzin%20Project/backend/tests/Feature/TicketDispatchFailureRecoveryTest.php)
- [backend/app/Console/Commands/ReconcileTicketGenerationCommand.php](file:///d:/Work%20Projects/Knzin%20Project/backend/app/Console/Commands/ReconcileTicketGenerationCommand.php)
- [backend/app/Jobs/GenerateTicketsJob.php](file:///d:/Work%20Projects/Knzin%20Project/backend/app/Jobs/GenerateTicketsJob.php)
- [backend/app/Http/Controllers/TicketController.php](file:///d:/Work%20Projects/Knzin%20Project/backend/app/Http/Controllers/TicketController.php#L26-L35)

Notes:
Both scheduled cron and on-demand trigger patterns verified. Pending orders are never dropped, ensuring learners always receive their promotional tickets.
