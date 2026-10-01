# Security Evidence: Download Authorization Boundary (T028 / FR-006)

**Target**: Downloadable Trade Attachments (`POST /api/v1/lessons/{courseSlug}/parts/{partNumber}/downloads/{resourceId}`) & Media Stream Origin (`GET /api/v1/media/download/{courseSlug}/{partNumber}/{resourceId}`)  
**Purpose**: Verify the strict server-authoritative entitlement and HMAC signature boundary protecting downloadable course assets (PDF schematics, checklists, wiring diagrams).  
**Environment**: Local MariaDB (`knzin_test` & `knzin_db`), PHP 8.2 / Laravel 11.  
**Result**: PASS (All 8 attack vectors defended)

---

## Adversarial Attacks Performed & Defenses Verified

### 1. Authorized Learner Request
- **Attack**: Authenticated learner with active entitlement requests download token for valid resource.
- **Expected**: HTTP 200 OK returning 15-minute temporary signed download URL (`validity_seconds: 900`). Accessing signed URL streams PDF attachment with HTTP 200.
- **Observed**: HTTP 200 with HMAC signed URL; media origin returns HTTP 200 with `Content-Disposition: attachment; filename="schematic-v1.pdf"`.
- **Result**: PASS

### 2. Unauthenticated Anonymous Access
- **Attack**: Anonymous caller attempts `POST /api/v1/lessons/{courseSlug}/parts/{partNumber}/downloads/{resourceId}` without Authorization header.
- **Expected**: HTTP 401 Unauthorized (`ERR_UNAUTHORIZED`).
- **Observed**: HTTP 401.
- **Result**: PASS

### 3. Cross-Course IDOR Attempt
- **Attack**: Learner who purchased Course B attempts to generate download URL for Course A resource.
- **Expected**: HTTP 403 Forbidden (`ERR_RESOURCE_LOCKED`).
- **Observed**: HTTP 403 Forbidden.
- **Result**: PASS

### 4. Unentitled Part Isolation
- **Attack**: Learner who purchased only Part 1 attempts to download proprietary attachment for Part 2.
- **Expected**: HTTP 403 Forbidden (`ERR_RESOURCE_LOCKED`).
- **Observed**: HTTP 403 Forbidden.
- **Result**: PASS

### 5. Path Traversal & Parameter Tampering
- **Attack**: Caller attempts path traversal using `invalid@resource!id` or `../../secret`.
- **Expected**: HTTP 400 Bad Request (`ERR_INVALID_RESOURCE_ID`) via regex whitelist `^[a-zA-Z0-9_-]+$`.
- **Observed**: HTTP 400.
- **Result**: PASS

### 6. Expired Token Replay
- **Attack**: Caller attempts to access signed download URL after 16 minutes (beyond 15-minute validity window).
- **Expected**: HTTP 403 Forbidden at media origin due to expired HMAC timestamp.
- **Observed**: HTTP 403 Forbidden.
- **Result**: PASS

### 7. Direct Media Origin Bypass
- **Attack**: Caller attempts direct HTTP GET to `/api/v1/media/download/{courseSlug}/{partNumber}/{resourceId}` without signed query parameters.
- **Expected**: HTTP 403 Forbidden via `hasValidSignature()` middleware check.
- **Observed**: HTTP 403 Forbidden.
- **Result**: PASS

### 8. Context / Resource Swapping Attack
- **Attack**: Caller intercepts valid signed URL for `schematic-v1` and alters resourceId parameter in query/path to `other-secret-file` while retaining the signature.
- **Expected**: HTTP 403 Forbidden due to HMAC signature mismatch.
- **Observed**: HTTP 403 Forbidden.
- **Result**: PASS
