# Evidence: 40-Bit Affine Ticket Permutation Invariants and Overflow Guards

Task:
T053

Purpose:
Prove that the 40-bit affine permutation $P(S) = (S \times M + C) \pmod{2^{40}} \oplus K$ is strictly injective (bijection with zero collisions across sequence blocks), produces valid canonical Crockford Base32 serials, sequence allocation overflow throws `\RuntimeException` at $2^{40}$, and annual rollover resets sequence counters cleanly.

Environment:
local / test (Laravel 11, MariaDB `knzin_test` with `RefreshDatabase`, PHP BCMath)

Action:
Executed automated unit test suite:
`php artisan test --filter=TicketPermutationTest`

Expected:
All 3 unit tests pass demonstrating 0 collisions across 1,000 sequence samples and exact boundary enforcement.

Observed:
```text
   PASS  Tests\Unit\TicketPermutationTest
  ✓ affine permutation bijection is strictly one to one across sample sequences                                  8.34s  
  ✓ sequence allocation overflow guard throws exception at boundary                                              0.07s  
  ✓ yearly rollover resets sequence cleanly for new year                                                         0.04s  

  Tests:    3 passed (5009 assertions)
  Duration: 8.62s
```

Result:
PASS

Repository Evidence:
- [backend/tests/Unit/TicketPermutationTest.php](file:///d:/Work%20Projects/Knzin%20Project/backend/tests/Unit/TicketPermutationTest.php)
- [backend/app/Services/TicketMintingService.php](file:///d:/Work%20Projects/Knzin%20Project/backend/app/Services/TicketMintingService.php#L54-L91)
- [backend/database/migrations/2026_10_01_000003_create_ticket_sequences_table.php](file:///d:/Work%20Projects/Knzin%20Project/backend/database/migrations/2026_10_01_000003_create_ticket_sequences_table.php)

Notes:
BCMath arbitrary precision arithmetic eliminates integer overflow bugs on 64-bit platforms while preserving full permutation dispersion.
