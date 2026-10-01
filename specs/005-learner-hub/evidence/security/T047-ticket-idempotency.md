# Evidence: Ticket Minting Idempotency, Ratio Enforcement, and Crash Recovery

Task:
T047

Purpose:
Prove that $2 single part orders mint exactly 1 ticket, $10 bundle orders mint exactly 15 tickets, serials conform to canonical Crockford Base32 pattern, `uq_order_ticket_index` prevents duplicate index insertion, partial worker crash resumes cleanly to mint only the missing delta, and duplicate worker invocations mint zero extra tickets.

Environment:
local / test (Laravel 11, MariaDB `knzin_test` with `RefreshDatabase`, BCMath 40-bit permutation)

Action:
Executed automated feature security test suite:
`php artisan test --filter=TicketMintingIdempotencyTest`

Expected:
All 6 tests pass demonstrating zero duplicate ticket creation and exact ratio enforcement.

Observed:
```text
   PASS  Tests\Feature\TicketMintingIdempotencyTest
  ✓ single part order mints exactly 1 ticket                                                                     7.75s  
  ✓ bundle order mints exactly 15 tickets                                                                        0.16s  
  ✓ all serials conform to canonical crockford base32 regex                                                      0.24s  
  ✓ uq order ticket index uniqueness rejects duplicate insert attempts                                           0.21s  
  ✓ simulated worker crash after partial insert resumes and mints exact delta                                    0.16s  
  ✓ concurrent worker execution with order lock produces exactly 15 tickets total                                0.17s  

  Tests:    6 passed (35 assertions)
  Duration: 8.86s
```

Result:
PASS

Repository Evidence:
- [backend/tests/Feature/TicketMintingIdempotencyTest.php](file:///d:/Work%20Projects/Knzin%20Project/backend/tests/Feature/TicketMintingIdempotencyTest.php)
- [backend/app/Services/TicketMintingService.php](file:///d:/Work%20Projects/Knzin%20Project/backend/app/Services/TicketMintingService.php)
- [backend/database/migrations/2026_10_01_000002_create_tickets_table.php](file:///d:/Work%20Projects/Knzin%20Project/backend/database/migrations/2026_10_01_000002_create_tickets_table.php)
- [backend/app/Models/Ticket.php](file:///d:/Work%20Projects/Knzin%20Project/backend/app/Models/Ticket.php)

Attack:
1. Replay attack: Duplicating fulfillment webhook execution for an already minted order.
2. Concurrent race attack: Simultaneous execution of minting workers for the same order.
3. Index collision attack: Direct insertion of duplicate `(order_id, order_ticket_index)` to inflate ticket counts.
4. Partial crash recovery: Worker terminated after 5 of 15 tickets inserted; re-delivery attempting to re-mint all 15.

Target:
- `App\Services\TicketMintingService::mintForOrder`
- MariaDB table `tickets` unique constraint `uq_order_ticket_index`

Expected Defense:
1. Lock on order row serializes execution; delta calculation `entitled - existing = 0` produces 0 new tickets.
2. Second concurrent run observes `delta <= 0` and exits without allocating sequence numbers.
3. Database `UNIQUE KEY (order_id, order_ticket_index)` aborts duplicate index insert.
4. Resumed worker calculates `existingCount = 5`, allocating and inserting only delta indices 6..15, completing exactly 15 tickets total.

Observed Defense:
All defenses operated as designed. Ticket counts remained strictly invariant at 15 for bundles and 1 for parts under all simulated concurrency, retries, and crash states.
