# Evidence: Multi-Tier Promotional Draw Eligibility Interval Invariants

Task:
T049

Purpose:
Prove that promotional ticket draw eligibility adheres strictly to the half-open interval `starts_at <= issued_at < ends_at` in UTC, tickets issued at the exact boundary second `ends_at` roll into the subsequent draw window, locked draws close ticket accumulation, the monthly grand draw evaluates designated calendar months rather than static 30-day assumptions, and historical tickets remain queryable in the learner ledger after draw conclusion.

Environment:
local / test (Laravel 11, MariaDB `knzin_test` with `RefreshDatabase`, Carbon test clocks)

Action:
Executed automated feature test suite:
`php artisan test --filter=TicketEligibilityTest`

Expected:
All 5 feature tests pass verifying interval boundaries and status transitions across hourly, daily, and monthly tiers.

Observed:
```text
   PASS  Tests\Feature\TicketEligibilityTest
  ✓ half open interval starts at lte issued at lt ends at in utc                                                 7.81s  
  ✓ ticket issued at exact ends at qualifies for next draw window                                                0.15s  
  ✓ draw with status locked closes ticket accumulation                                                           0.15s  
  ✓ monthly grand draw evaluates designated calendar month                                                       0.23s  
  ✓ tickets remain queryable in ledger after draw conclusion                                                     0.15s  

  Tests:    5 passed (25 assertions)
  Duration: 8.66s
```

Result:
PASS

Repository Evidence:
- [backend/tests/Feature/TicketEligibilityTest.php](file:///d:/Work%20Projects/Knzin%20Project/backend/tests/Feature/TicketEligibilityTest.php)
- [backend/app/Http/Controllers/TicketController.php](file:///d:/Work%20Projects/Knzin%20Project/backend/app/Http/Controllers/TicketController.php#L69-L130)
- [backend/app/Models/Draw.php](file:///d:/Work%20Projects/Knzin%20Project/backend/app/Models/Draw.php#L123-L137)

Notes:
Half-open UTC evaluation prevents boundary collisions and double-counting across back-to-back promotional draw periods.
