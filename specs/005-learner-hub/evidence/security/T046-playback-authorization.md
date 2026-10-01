# Evidence: Playback Authorization and Protected Media Origin Security

Task:
T046

Purpose:
Prove that paid lesson parts strictly require authentication and active entitlement, signed media streaming URLs expire in 15 minutes, tampered signatures are denied with HTTP 403, and cross-user authorization attacks fail.

Environment:
local / test (Laravel 11, MariaDB `knzin_test` with `RefreshDatabase`, private storage disk)

Action:
Executed automated feature security test suite:
`php artisan test --filter=PlaybackAuthorizationTest`

Expected:
All 7 tests pass with 100% rejection of unauthorized playback attempts and signature tampering.

Observed:
```text
   PASS  Tests\Feature\PlaybackAuthorizationTest
  ✓ part 1 returns public stream url with zero authentication                                                    7.64s  
  ✓ part 2 plus without authentication returns http 401                                                          0.13s  
  ✓ part 2 plus with unentitled user returns http 403 err part locked                                            0.20s  
  ✓ part 2 plus with entitled user returns signed stream url and watermark                                       0.31s  
  ✓ url signature tampering or expired timestamp is rejected at media origin                                     0.49s  
  ✓ cross user playback authorization attempt is denied                                                          0.15s  
  ✓ parameter tampering mismatched course slug rejected                                                          0.17s  

  Tests:    7 passed (23 assertions)
  Duration: 9.27s
```

Result:
PASS

Repository Evidence:
- [backend/tests/Feature/PlaybackAuthorizationTest.php](file:///d:/Work%20Projects/Knzin%20Project/backend/tests/Feature/PlaybackAuthorizationTest.php)
- [backend/app/Http/Controllers/LessonPlaybackController.php](file:///d:/Work%20Projects/Knzin%20Project/backend/app/Http/Controllers/LessonPlaybackController.php)
- [backend/app/Services/MediaProtectionService.php](file:///d:/Work%20Projects/Knzin%20Project/backend/app/Services/MediaProtectionService.php)
- [backend/routes/api.php](file:///d:/Work%20Projects/Knzin%20Project/backend/routes/api.php#L55-L71)

Attack:
1. Anonymous user requested paid Part 2 playback authorization.
2. Authenticated user without purchase requested paid Part 2 playback authorization.
3. User B attempted to request playback for User A's purchased lesson part.
4. Attacker modified HMAC signature query parameter on protected media streaming route (`/api/v1/media/stream/{slug}/2?signature=...tampered`).
5. Attacker attempted to replay signed streaming URL after 16 minutes (exceeding 15-minute token TTL).

Target:
- `POST /api/v1/lessons/{courseSlug}/parts/{partNumber}/playback-auth`
- `GET /api/v1/media/stream/{courseSlug}/{partNumber}`

Expected Defense:
1. HTTP 401 with `ERR_UNAUTHORIZED`.
2. HTTP 403 with `ERR_PART_LOCKED` and purchase options pricing.
3. HTTP 403 with `ERR_PART_LOCKED` (cross-user entitlement isolation).
4. HTTP 403 at media streaming origin with `Invalid or expired media signature`.
5. HTTP 403 at media streaming origin due to timestamp expiry.

Observed Defense:
All attempted attacks were rejected with the exact expected status codes and defense mechanisms. Legitimate entitled users receive a signed URL and drifting watermark metadata containing email and `learner_code`.
