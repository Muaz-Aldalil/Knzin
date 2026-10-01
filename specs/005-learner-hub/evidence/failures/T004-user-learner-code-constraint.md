# Failure Evidence: T004 User Learner Code NOT NULL Invariant

Task:
T004 / T010

Failure:
Running the test suite immediately after Phase 1 migration produced `SQLSTATE[HY000]: General error: 1364 Field 'learner_code' doesn't have a default value` during tests that invoke `User::create` (e.g. `GoogleAuthMockTest`, `OrderIdempotencyTest`).

Classification:
Task dependency boundary / Model hook timing

Root Cause:
T004 correctly applied a `NOT NULL` constraint and `UNIQUE KEY uq_users_learner_code` to `users.learner_code`. However, the automatic generation of Crockford Base32 `learner_code` was assigned to T010 on the `User` model. Without the model boot hook in place, any new user creation without an explicit `learner_code` payload violated the database `NOT NULL` constraint.

Fix:
Immediately implemented T010 in `backend/app/Models/User.php`: added `learner_code` to `$fillable`, added `booted()` creating hook that auto-generates `LRN-XXXXXX` via CSPRNG with 3-attempt collision retry loop, and added `courseEntitlements` and `tickets` relationships.

Verification:
Executed `php artisan test`. All 27 tests (527 assertions) passed cleanly with 0 errors.

Final Result:
PASS
