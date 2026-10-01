# Evidence: Lesson Progress Authorization and Monotonicity Integrity

Task:
T050

Purpose:
Prove that progress persistence strictly requires authentication, unentitled progress writes on paid parts are rejected with HTTP 403 `ERR_PART_LOCKED`, server-side progress enforces strict monotonicity (lower reports cannot regress higher recorded depth/percentage), reaching 95% sets `is_completed = true` permanently, subsequent rewind reports cannot unset completion, and invalid percentage bounds are rejected with HTTP 422.

Environment:
local / test (Laravel 11, MariaDB `knzin_test` with `RefreshDatabase`)

Action:
Executed automated feature security test suite:
`php artisan test --filter=LessonProgressMonotonicityTest`

Expected:
All 6 feature tests pass enforcing strict authorization, input boundary checks, and monotonic persistence.

Observed:
```text
   PASS  Tests\Feature\LessonProgressMonotonicityTest
  ✓ unauthenticated progress write returns http 401                                                              7.73s  
  ✓ unentitled progress write on paid part returns http 403                                                      0.28s  
  ✓ lower watch depth or percentage cannot regress higher recorded values                                        0.19s  
  ✓ reaching 95 percent sets is completed true permanently                                                       0.14s  
  ✓ subsequent lower watch report does not reset is completed flag                                               0.15s  
  ✓ percent complete rejected if out of bounds                                                                   0.16s  

  Tests:    6 passed (19 assertions)
  Duration: 8.84s
```

Result:
PASS

Repository Evidence:
- [backend/tests/Feature/LessonProgressMonotonicityTest.php](file:///d:/Work%20Projects/Knzin%20Project/backend/tests/Feature/LessonProgressMonotonicityTest.php)
- [backend/app/Http/Controllers/ProgressController.php](file:///d:/Work%20Projects/Knzin%20Project/backend/app/Http/Controllers/ProgressController.php#L23-L108)

Attack:
1. Anonymous client attempted to write lesson progress via `POST /api/v1/progress`.
2. Authenticated user without entitlement attempted to forge completion / progress on locked Part 2.
3. Client attempted to regress progress or reset `is_completed` flag by reporting 0% watch depth after reaching 95%.
4. Client attempted out-of-bounds percentage spoofing (`-5%` and `105%`).

Target:
- `POST /api/v1/progress`
- MariaDB table `lesson_progress`

Expected Defense:
1. HTTP 401 unauthenticated denial.
2. HTTP 403 `ERR_PART_LOCKED` denial.
3. Server-side `max()` retention maintains previous high-water mark; `is_completed` remains sticky once true.
4. HTTP 422 validation failure on out-of-bounds inputs.

Observed Defense:
All attempted manipulations and unentitled writes were completely blocked by server-side middleware and domain validation.
