# Evidence: Course Entitlement Domain Invariants and Access Resolution

Task:
T045

Purpose:
Prove that order fulfillment creates active entitlements, bundle grants access to all parts, single part purchase grants modular access only, bundle and part entitlements coexist, bundle revocation preserves independent modular access, and duplicate grants are prevented at database constraint layer.

Environment:
local / test (MariaDB `knzin_test` with `RefreshDatabase`)

Action:
Executed PHPUnit feature test suite:
`php artisan test --filter=CourseEntitlementTest`

Expected:
All 6 feature tests pass verifying FR-001, SC-001, and SC-007.

Observed:
```text
   PASS  Tests\Feature\CourseEntitlementTest
  ✓ order completion creates active entitlement                                                                  7.68s  
  ✓ bundle purchase grants access to all active parts                                                            0.15s  
  ✓ single part purchase grants access only to purchased part                                                    0.14s  
  ✓ bundle and part entitlements safely coexist as active                                                        0.19s  
  ✓ bundle revocation preserves independent modular part access                                                  0.15s  
  ✓ duplicate effective entitlement creation is prevented                                                        0.12s  

  Tests:    6 passed (21 assertions)
  Duration: 8.58s
```

Result:
PASS

Repository Evidence:
- [backend/tests/Feature/CourseEntitlementTest.php](file:///d:/Work%20Projects/Knzin%20Project/backend/tests/Feature/CourseEntitlementTest.php)
- [backend/app/Services/EntitlementService.php](file:///d:/Work%20Projects/Knzin%20Project/backend/app/Services/EntitlementService.php)
- [backend/app/Models/CourseEntitlement.php](file:///d:/Work%20Projects/Knzin%20Project/backend/app/Models/CourseEntitlement.php)
- [backend/database/migrations/2026_10_01_000001_create_course_entitlements_table.php](file:///d:/Work%20Projects/Knzin%20Project/backend/database/migrations/2026_10_01_000001_create_course_entitlements_table.php)

Notes:
Verified `uq_user_course_scope_active` preventing duplicate active grants, and `EntitlementService::hasAccess()` evaluating bundle vs part scope.
