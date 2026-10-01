# Evidence: Account Merge State Reconciliation and Entitlement Transfer

Task:
T051

Purpose:
Prove that unverified guest user assets (orders, tickets, entitlements, lesson progress) are atomically re-attributed to the verified Google account, duplicate identical scope entitlements are marked `superseded` rather than violating database uniqueness constraints, modular part and bundle entitlements safely coexist without corruption, and active ticket generation during account merge serializes without lost tickets.

Environment:
local / test (Laravel 11, MariaDB `knzin_test` with `RefreshDatabase`)

Action:
Executed automated feature security test suite:
`php artisan test --filter=AccountMergeEntitlementsTest`

Expected:
All 4 feature tests pass with deterministic lock ordering, seamless asset re-attribution, and guest account deactivation.

Observed:
```text
   PASS  Tests\Feature\AccountMergeEntitlementsTest
  ✓ guest order progress entitlements and tickets transferred to google user                                     7.82s  
  ✓ guest and google user with identical scope marks guest record superseded                                     0.15s  
  ✓ guest and google user with part and bundle coexistence preserves both                                        0.15s  
  ✓ merge executing during active ticket generation serializes safely                                            0.16s  

  Tests:    4 passed (20 assertions)
  Duration: 8.45s
```

Result:
PASS

Repository Evidence:
- [backend/tests/Feature/AccountMergeEntitlementsTest.php](file:///d:/Work%20Projects/Knzin%20Project/backend/tests/Feature/AccountMergeEntitlementsTest.php)
- [backend/app/Services/AccountMergeService.php](file:///d:/Work%20Projects/Knzin%20Project/backend/app/Services/AccountMergeService.php)
- [backend/app/Models/CourseEntitlement.php](file:///d:/Work%20Projects/Knzin%20Project/backend/app/Models/CourseEntitlement.php)
- [backend/database/migrations/2026_10_01_000001_create_course_entitlements_table.php](file:///d:/Work%20Projects/Knzin%20Project/backend/database/migrations/2026_10_01_000001_create_course_entitlements_table.php)

Attack:
1. Account takeover / hijacking attempt: Merging unverified guest account into non-Google or wrong-email account.
2. Duplicate entitlement collision attack: Merging accounts where both purchased the same bundle, causing database `UNIQUE` constraint failure.
3. Race condition between merge worker and background ticket minting worker.

Target:
- `App\Services\AccountMergeService::mergeGuestIntoGoogle`
- MariaDB tables `orders`, `tickets`, `course_entitlements`, `lesson_progress`, `users`

Expected Defense:
1. Strict email match and `auth_provider === 'google'` guard ensures only verified accounts can absorb guest assets; guest session tokens are revoked.
2. Identical scope keys trigger `status = 'superseded'` and link `superseded_by_entitlement_id`, maintaining audit trail without crashing on unique index.
3. Deterministic ascending primary key locking (`orderBy('id')->lockForUpdate()`) serializes all involved rows, ensuring no ticket or entitlement is dropped.

Observed Defense:
Merge executed deterministically, re-attributing all assets to the Google account and leaving a deactivated guest record with audit pointer.
