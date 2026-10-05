# KNZiN Production Readiness Audit — Stage 2: Backend Inspection Findings

**Audit Target**: Backend Application (`backend/`)  
**Framework**: Laravel 11.x / PHP 8.2+ / Sanctum / MariaDB  
**Status**: Completed  
**Audit Mode**: Strictly Read-Only  
**Generated**: 2026-10-05  

---

## Executive Summary of Backend Findings

| Finding ID | Severity | Category | Title | Status |
| :--- | :--- | :--- | :--- | :--- |
| **PROD-012** | **CRITICAL** | Architecture / Auth | Google OAuth (Socialite) Completely Unimplemented | Verified Defect |
| **PROD-013** | **CRITICAL** | Scalability / DoS | Synchronous Unbounded Bulk Notification Dispatch in HTTP Requests | Verified Bottleneck |
| **PROD-014** | **HIGH** | Payment Security | Simulator Gateway Enabled by Default in Config & Accepted by API | Verified Vulnerability |
| **PROD-015** | **MEDIUM** | Identity / Auth | Fragile Verification Check (`auth_provider === 'google'` Workaround) | Verified Tech Debt |
| **PROD-016** | **LOW** | Operations / Reliability | Missing `withoutOverlapping()` on Background Console Schedulers | Verified Operational Risk |
| **PROD-017** | **HIGH** | Product / Journey | Winner KYC Notification Links to Non-Existent Route (`/account/kyc`) | Verified Broken Journey |
| **PROD-018** | **HIGH** | Scalability / Performance | Exponential N+1 Query Storm in Scheduled Console Commands | Verified Bottleneck |
| **PROD-019** | **MEDIUM** | Security / IDOR | Unauthenticated Order Resource Exposes UUID and Predictable Access | Verified Security Gap |
| **PROD-020** | **LOW** | Security / CORS | Hardcoded Localhost Origins in Production CORS Configuration | Verified Config Risk |
| **PROD-021** | **MEDIUM** | Media Protection | Raw MP4 Streaming Instead of HLS & Direct Third-Party URL Bypass | Verified Contract Drift |
| **PROD-022** | **MEDIUM** | Performance / API | Unpaginated Ticket Ledger API (`/api/v1/user/tickets`) | Verified Scalability Risk |

---

## Detailed Backend Findings

---

### PROD-012: Google OAuth (Socialite) Completely Unimplemented

- **Severity**: **CRITICAL**
- **Category**: Architecture & Authentication
- **Status**: Verified Defect / Incomplete Feature
- **Location**:
  - `backend/app/Services/GoogleAuthService.php` (Lines 35–42, 60–75)
  - `backend/app/Http/Controllers/AuthController.php` (Lines 47–65)
  - `frontend/src/components/auth/LoginModal.tsx` (Lines 110–135)
- **Evidence**:
  ```php
  // backend/app/Services/GoogleAuthService.php:60-70
  public function handleCallback(string $code): array
  {
      if (!app()->environment('local', 'testing')) {
          abort(503, 'ERR_GOOGLE_AUTH_UNAVAILABLE: Real Socialite provider not configured in this environment.');
      }
      // Mock code exchange for local/testing...
  }
  ```
- **Execution Path**:
  1. A real production user clicks the prominent "تسجيل الدخول عبر Google" button on the frontend.
  2. Frontend opens `GET /api/v1/auth/google/redirect`.
  3. In production, `GoogleAuthService::getAuthUrl` throws an HTTP 503 exception with `ERR_GOOGLE_AUTH_UNAVAILABLE`.
  4. The user is greeted by a server crash/503 error, completely unable to authenticate with Google.
- **Impact**: Core advertised authentication flow is 100% broken for real end users in production.
- **Root Cause**: `laravel/socialite` package was never installed in `composer.json`, and real OAuth client exchange was stubbed out during initial development.
- **Recommended Direction**:
  - Either install and configure `laravel/socialite` with valid Google Cloud credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`), OR remove the Google login button from the UI and enforce Email OTP as the sole authentication mechanism.

---

### PROD-013: Synchronous Unbounded Bulk Notification Dispatch in Web Requests

- **Severity**: **CRITICAL**
- **Category**: Scalability & Denial of Service
- **Status**: Verified Architectural Bottleneck
- **Location**:
  - `backend/app/Services/Admin/DrawLifecycleService.php` (Lines 198–209)
  - `backend/app/Services/Admin/AdminCourseService.php` (Lines 494–517)
  - `backend/app/Http/Controllers/Admin/AdminBroadcastController.php` (Lines 48–65)
- **Evidence**:
  ```php
  // backend/app/Services/Admin/DrawLifecycleService.php:201-207
  DB::afterCommit(function () use ($lockedDraw, $prizes) {
      $users = User::where('status', 'active')->get(); // Unbounded in-memory collection
      foreach ($prizes as $prize) {
          foreach ($users as $user) {
              $user->notify(new NewPrizeNotification($prize, $lockedDraw, $user));
          }
      }
  });
  ```
  ```php
  // backend/app/Http/Controllers/Admin/AdminBroadcastController.php:48-63
  $recipients = User::query()->where('status', 'active')->with('notificationPreferences')->get();
  foreach ($recipients as $recipient) {
      // Synchronous loop inside the HTTP controller method
      $recipient->notify(new AdminBroadcastNotification($broadcast, $recipient));
  }
  ```
- **Execution Path**:
  1. Admin clicks "Publish Draw" or sends a site-wide broadcast in the Admin Panel.
  2. The controller synchronously executes `User::where('status', 'active')->get()`.
  3. At 10,000 active users and 3 prizes, this creates 30,000 Eloquent models and dispatches 30,000 notification jobs in the single HTTP request thread.
  4. PHP reaches `memory_limit` (e.g. 128M/256M) or hits Nginx's 30s/60s gateway timeout (`504 Gateway Time-out`).
  5. The admin request fails midway through dispatch, resulting in partial broadcasts and corrupted state.
- **Impact**: System cannot scale past a few hundred active users. Production crashes on any draw publication or admin broadcast.
- **Recommended Direction**:
  - Refactor all bulk notification triggers to dispatch a single queue job (e.g. `DispatchBulkDrawNotificationJob`), which processes active users using `User::where('status', 'active')->chunkById(500, ...)`.

---

### PROD-014: Simulator Gateway Enabled by Default & Accepted in Production

- **Severity**: **HIGH**
- **Category**: Financial Security & Payment Integrity
- **Status**: Verified Vulnerability
- **Location**:
  - `backend/config/payments.php` (Line 18)
  - `backend/app/Http/Controllers/PaymentController.php` (Lines 27, 44–115)
- **Evidence**:
  ```php
  // backend/config/payments.php:18
  'simulator_enabled' => env('KNZIN_PAYMENT_SIMULATOR', true), // Defaults to TRUE!
  ```
  ```php
  // backend/app/Http/Controllers/PaymentController.php:27
  $validator = Validator::make($request->all(), [
      'gateway' => 'required|string|in:zaincash,asiahawala,simulator', // Unconditionally allowed
  ]);
  ```
- **Execution Path**:
  1. If an environment is deployed without explicitly setting `KNZIN_PAYMENT_SIMULATOR=false`, the default is `true`.
  2. Any user can send `POST /api/v1/checkout/orders/{orderNumber}/pay` with `{"gateway": "simulator"}`.
  3. The backend generates a valid `PaymentTransaction` with `gateway = simulator`.
  4. While `PaymentWebhookController::simulator` has a check for `app()->environment('production')`, non-production staging environments and improperly configured production containers (`APP_ENV` not set to `production`) will accept the simulator webhook and fulfill orders for $0.
- **Impact**: Potential $0 fraudulent course purchases and promotional ticket minting if environment variables drift.
- **Recommended Direction**:
  - In `config/payments.php`, change the default to `false`: `env('KNZIN_PAYMENT_SIMULATOR', false)`.
  - In `PaymentController::pay`, dynamically validate `in:zaincash,asiahawala` when in production or when `simulator_enabled` is false.

---

### PROD-015: Fragile Identity Verification (`auth_provider === 'google'` Workaround)

- **Severity**: **MEDIUM**
- **Category**: Identity & Data Integrity
- **Status**: Verified Technical Debt
- **Location**:
  - `backend/app/Models/User.php` (Lines 115–125)
  - `backend/app/Services/OtpAuthService.php` (Lines 90–95)
  - `backend/app/Services/Admin/AdminCapabilityService.php` (Lines 40–45)
- **Evidence**:
  ```php
  // backend/app/Models/User.php:115
  public function isVerified(): bool
  {
      return $this->email_verified_at !== null || $this->auth_provider === 'google';
  }
  ```
  ```php
  // backend/app/Services/OtpAuthService.php:92
  $user->update([
      'auth_provider' => 'google', // Workaround to satisfy isVerified()!
      'email_verified_at' => now(),
  ]);
  ```
- **Execution Path**:
  1. Users verifying via Email OTP are assigned `auth_provider = 'google'` in the database despite never touching Google.
  2. Any future database cleanup or migration that normalizes `auth_provider` to `'email_otp'` will cause downstream checks (such as `isVerified()` or `EnsureAdminPrincipal`) to fail.
- **Impact**: Compromised data integrity in user accounts; latent failure risk for authorization and capability delegation.
- **Recommended Direction**:
  - Decouple verification from auth provider: `isVerified()` should solely evaluate `$this->email_verified_at !== null`.
  - Store legitimate provider strings (`'email_otp'`, `'google'`, `'guest'`).

---

### PROD-016: Missing `withoutOverlapping()` on Background Console Schedulers

- **Severity**: **LOW**
- **Category**: Operations & Reliability
- **Status**: Verified Operational Risk
- **Location**:
  - `backend/routes/console.php` (Lines 12, 15, 18)
- **Evidence**:
  ```php
  // backend/routes/console.php:12-18
  Schedule::command('orders:expire-pending')->hourly();
  Schedule::command('knzin:reconcile-ticket-generation')->everyFiveMinutes();
  Schedule::command('knzin:mature-commissions')->hourly();
  ```
- **Execution Path**:
  1. If ticket generation backlog or database lag causes `knzin:reconcile-ticket-generation` to exceed 5 minutes, the next scheduled instance launches while the previous one is still executing.
  2. Redundant worker threads compete for sequence locks on `ticket_sequences` and query identical unminted orders.
- **Impact**: Unnecessary database lock contention, memory spikes, and log pollution during high-load periods.
- **Recommended Direction**:
  - Append `->withoutOverlapping(10)` to all three scheduled commands in `backend/routes/console.php`.

---

### PROD-017: Winner KYC Notification Links to Non-Existent Route (`/account/kyc`)

- **Severity**: **HIGH**
- **Category**: Product Integrity & User Journey
- **Status**: Verified Broken User Journey
- **Location**:
  - `backend/app/Notifications/WinnerKycNotification.php` (Lines 40, 66)
  - `frontend/src/app/` (No `/account` or `/account/kyc` route exists)
- **Evidence**:
  ```php
  // backend/app/Notifications/WinnerKycNotification.php:40
  $kycUrl = config('app.frontend_url', config('app.url')) . '/account/kyc';
  // ...
  'action_url' => "/account/kyc",
  ```
- **Execution Path**:
  1. An admin completes a promotional draw with a canonical winner.
  2. The winning user receives an official email and in-app notification: *"You Won the KNZiN Draw! Click here to complete KYC verification"*.
  3. User clicks the link, which directs to `https://knzin.com/account/kyc`.
  4. The Next.js frontend renders a 404 Not Found error page.
  5. The winning user is trapped without an official path to submit identification or claim their prize.
- **Impact**: Direct failure of the primary winner claim and compliance user journey. Severe reputational and legal risk.
- **Recommended Direction**:
  - Implement the `/[locale]/account/kyc` page in the Next.js frontend using the existing `WinnerKycCard.tsx` component, OR update the notification action URL to direct to an existing support/verification channel.

---

### PROD-018: Exponential N+1 Query Storm in Scheduled Console Commands

- **Severity**: **HIGH**
- **Category**: Database Scalability & Performance
- **Status**: Verified Bottleneck
- **Location**:
  - `backend/app/Console/Commands/EvaluateMissionRemindersCommand.php` (Lines 37–115)
  - `backend/app/Console/Commands/EvaluateDrawAlertsCommand.php` (Lines 48–51)
  - `backend/app/Notifications/NewPrizeNotification.php` (Line 42)
- **Evidence**:
  ```php
  // backend/app/Console/Commands/EvaluateMissionRemindersCommand.php:37-100
  $activeEntitlements = CourseEntitlement::query()->where('status', 'active')->with(['course', 'user'])->get();
  foreach ($activeEntitlements as $entitlement) {
      // 5 separate queries executed PER entitlement inside the loop:
      // 1. CoursePart::query()->pluck('id')
      // 2. LessonProgress::query()->count()
      // 3. LessonProgress::query()->max('last_watched_at')
      // 4. CourseMissionReminder::query()->first()
      // 5. CourseMissionReminder::updateOrCreate(...)
  }
  ```
  ```php
  // backend/app/Console/Commands/EvaluateDrawAlertsCommand.php:48-50
  foreach ($draws as $draw) {
      $ticketUserIds = Ticket::query()->distinct()->pluck('user_id'); // Full unindexed table scan!
      $users = User::query()->whereIn('id', $ticketUserIds)->get();
  }
  ```
- **Execution Path**:
  1. The cron scheduler runs every hour / 5 minutes.
  2. For 10,000 active course entitlements, `EvaluateMissionRemindersCommand` executes over **50,000 distinct SQL queries** in a single execution.
  3. `EvaluateDrawAlertsCommand` performs a full table scan on `tickets` without filtering by draw or chunking.
  4. Database CPU hits 100%, causing query timeouts for regular web users on checkout and playback.
- **Impact**: High-frequency database saturation, connection pool exhaustion, and server unresponsiveness.
- **Recommended Direction**:
  - Use SQL aggregate subqueries or joins to identify inactive learners in bulk.
  - Chunk queries using `chunkById(500)`.
  - Add eager loading for `notificationPreferences` in bulk notification routines.

---

### PROD-019: Unauthenticated Order Resource Exposes UUID and Predictable Access

- **Severity**: **MEDIUM**
- **Category**: Information Disclosure & Access Control
- **Status**: Verified Security Gap
- **Location**:
  - `backend/app/Http/Controllers/CheckoutController.php` (Lines 45–59)
  - `backend/app/Http/Resources/OrderResource.php` (Line 21)
  - `backend/app/Http/Controllers/PaymentController.php` (Lines 225–238)
- **Evidence**:
  ```php
  // backend/app/Http/Resources/OrderResource.php:21
  'user_id' => $this->user_id, // Internal UUID exposed to public callers
  ```
  ```php
  // backend/app/Http/Controllers/CheckoutController.php:45-59
  public function show(string $orderNumber): JsonResponse
  {
      $order = $this->orderService->getOrderByNumber($orderNumber); // Zero auth or signature check!
      return $this->successResponse(new OrderResource($order));
  }
  ```
- **Execution Path**:
  1. Order reference numbers follow a 6-character random format: `KNZ-ORD-YYYY-XXXXXX`.
  2. Any anonymous caller querying `GET /api/v1/checkout/orders/{orderNumber}` can retrieve the order status, items, amounts, and the buyer's internal `user_id`.
  3. Furthermore, for guest orders, `PaymentController::authorizeOrderAccess` allows any anonymous caller with the order number to initiate payment sessions.
- **Impact**: Enumeration risk for guest orders; internal user UUID leakage.
- **Recommended Direction**:
  - Remove `user_id` and `idempotency_key` from the public `OrderResource`.
  - Secure guest order lookups via signed URL or guest session token rather than purely predictable public reference numbers.

---

### PROD-020: Hardcoded Localhost Origins in Production CORS Configuration

- **Severity**: **LOW**
- **Category**: Security Misconfiguration
- **Status**: Verified Configuration Risk
- **Location**:
  - `backend/config/cors.php` (Lines 22, 32)
- **Evidence**:
  ```php
  // backend/config/cors.php:22-32
  'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:3000'), 'http://localhost:3000', 'http://127.0.0.1:3000'],
  'supports_credentials' => true,
  ```
- **Execution Path**:
  1. In a live production deployment, `http://localhost:3000` remains permanently in the allowed CORS origins list.
  2. If an authenticated user visits an attacker-controlled site running on `localhost:3000` (or through DNS rebinding / local proxy), that page can make credentialed AJAX requests against the live production API.
- **Impact**: Unnecessary attack surface for credentialed cross-origin requests.
- **Recommended Direction**:
  - In production, dynamically filter `allowed_origins` to only include the configured `FRONTEND_URL`.

---

### PROD-021: Raw MP4 Served Instead of HLS & Direct URL Bypass

- **Severity**: **MEDIUM**
- **Category**: Media Protection & Contract Drift
- **Status**: Verified Contract Drift
- **Location**:
  - `backend/app/Services/MediaProtectionService.php` (Lines 29–31, 74–83)
  - `backend/routes/api.php` (Lines 103–123)
- **Evidence**:
  ```php
  // backend/app/Services/MediaProtectionService.php:41, 93
  'stream' => [
      'stream_url' => $signedStreamUrl,
      'format' => 'hls', // Advertised format is HLS!
  ]
  ```
  ```php
  // backend/routes/api.php:109-120
  $filePath = "videos/{$courseSlug}/part_{$partNumber}.mp4";
  return $disk->response($filePath); // Serves raw MP4 file!
  ```
- **Execution Path**:
  1. The API contract advertises `format: 'hls'` with chunked streaming.
  2. The actual stream endpoint serves a monolithic `.mp4` file via Laravel's `$disk->response()`.
  3. Video players expecting m3u8 playlists fail unless they fall back to progressive MP4 download.
  4. Furthermore, if `video_url` is stored as an unlisted third-party URL (e.g. YouTube or CDN), `MediaProtectionService` returns it directly without expiring signed tokens.
- **Impact**: Video playback buffering inefficiencies on slow connections; paywall bypass if third-party URLs are leaked.
- **Recommended Direction**:
  - Align playback contract: declare format as `mp4` unless an actual HLS transcoding pipeline is implemented.
  - Proxy all protected media through authenticated signed endpoints.

---

### PROD-022: Unpaginated User Tickets Ledger API

- **Severity**: **MEDIUM**
- **Category**: API Performance & Scalability
- **Status**: Verified Scalability Risk
- **Location**:
  - `backend/app/Http/Controllers/TicketController.php` (Lines 70–75, 145–150)
- **Evidence**:
  ```php
  // backend/app/Http/Controllers/TicketController.php:71-74
  $tickets = Ticket::where('user_id', $user->id)
      ->with('order')
      ->orderByDesc('issued_at')
      ->get(); // Loads all tickets into memory
  ```
- **Execution Path**:
  1. An active learner or affiliate accumulates 500+ promotional tickets across various bundles and promotional events.
  2. Loading `/tickets` calls `GET /api/v1/user/tickets`.
  3. The controller performs in-memory interval checks across three draw tiers (hourly, daily, monthly) for every single ticket row in a single synchronous loop.
  4. Response size explodes into several megabytes of JSON, delaying page load and freezing the browser UI.
- **Impact**: Poor mobile performance, high server memory usage per user, slow response times.
- **Recommended Direction**:
  - Introduce pagination (`?page=1&per_page=25`) or return aggregate statistics with lazy-loaded ticket serials.
