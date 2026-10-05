# KNZiN Production Readiness Audit — Stage 1 Frontend Findings & Remediation Ledger

**Document ID:** AUDIT-STAGE-01-FRONTEND  
**Audit Target:** KNZiN Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, `next-intl`  
**Execution Standard:** Strictly Read-Only Investigation  
**Last Updated:** 2026-10-05  

---

## 1. Executive Summary & Inventory

The Stage 1 Frontend Audit evaluated 100% of application-owned frontend code (272 files) encompassing:
- 58 App routes, layouts, and page controllers (`frontend/src/app`)
- 103 User interface components and design system elements (`frontend/src/components`)
- 27 Custom hooks (`frontend/src/hooks`)
- 21 Libraries, state stores, and utilities (`frontend/src/lib`)
- 31 Automated test suites (161 tests, 100% passing) (`frontend/src/tests`)
- 2 Bilingual dictionaries (`frontend/messages/ar.json`, `frontend/messages/en.json`)

### Excluded Directories (Justified)
- `frontend/node_modules/`: Generated third-party dependencies (analyzed at manifest level in Stage 5).
- `frontend/.next/`: Generated build cache and compilation outputs.
- `frontend/public/images/`: Binary image assets (PNG, WebP).

---

## 2. Master Findings Matrix

| Finding ID | Severity | Category | Status | Short Title | Confidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PROD-001** | **CRITICAL** | Security / Auth | Confirmed Defect | Sanctum Token in URL Query Param on OAuth Callback | HIGH |
| **PROD-002** | **HIGH** | Correctness / Data | Confirmed Defect | Silent Completed Order Fallback with Fabricated Tickets | HIGH |
| **PROD-003** | **HIGH** | Public Trust / Legal | Confirmed Defect | Hardcoded Mock Draws & Winners Silently Rendered on API Failure | HIGH |
| **PROD-004** | **HIGH** | Security / Cost | Confirmed Defect | Unauthenticated & Unthrottled Route Calling OpenAI API | HIGH |
| **PROD-005** | **MEDIUM** | Content Security | Confirmed Defect | Unprotected YouTube Video Source Exposed in DOM | HIGH |
| **PROD-006** | **MEDIUM** | Correctness / Progress | Confirmed Defect | Inaccurate Watch Depth Progress When Video is Paused | HIGH |
| **PROD-007** | **MEDIUM** | Auth / UX | Confirmed Defect | Missing Automatic Token Eviction on 401 Unauthorized | HIGH |
| **PROD-008** | **LOW** | State Integrity | Confirmed Defect | Premature Entitlement Write to LocalStorage on Pending Order | HIGH |
| **PROD-009** | **LOW** | Scalability | Confirmed Defect | Static Search Engine Disconnected from Database Catalog | HIGH |
| **PROD-010** | **LOW** | Security | Confirmed Defect | Unset Secure Cookie Flag on Tracking Cookies | HIGH |
| **PROD-011** | **INFO** | Technical Debt | Confirmed Defect | Fallback Catalog Fixtures with Non-UUID Identifiers | HIGH |

---

## 3. Detailed Findings, Proofs & Remediation Blueprints

---

### PROD-001 — Sanctum Bearer Token Transmitted in HTTP GET Query Parameter during OAuth Callback

- **Severity:** CRITICAL
- **Category:** Security / Frontend Authentication
- **Status:** Confirmed Defect
- **Location:** `frontend/src/app/[locale]/auth/callback/page.tsx:24-38`

#### Evidence & Implementation Reality
```typescript
// frontend/src/app/[locale]/auth/callback/page.tsx
const token = searchParams.get('token');
const email = searchParams.get('email');
const name = searchParams.get('name');
const merged = parseInt(searchParams.get('merged_orders') || '0', 10);

if (token && email) {
  processedRef.current = true;
  setMergedCount(merged);
  login(token, {
    id: email, // <-- Inconsistency: user ID is assigned string email instead of database UUID
    email,
    displayName: name,
    authProvider: 'google',
    isVerified: true,
  });
```

#### Execution Path
```text
1. User clicks "Sign in with Google" in login/page.tsx
2. Browser redirects to Laravel Backend: /auth/google/redirect
3. User authorizes Google account -> Google calls backend /auth/google/callback
4. Backend issues HTTP 302 Redirect to Frontend:
   https://knzin.com/en/auth/callback?token=1|abcdef...&email=user@example.com
5. Next.js Client Page extracts ?token=... from window.location.search
6. Token written to localStorage.setItem('knzin_auth_token', token)
```

#### Impact & Attack Surface
1. **Log Exposure:** Full URLs with query strings are recorded in:
   - User's browser history
   - Intermediate HTTP proxy server access logs
   - Edge CDN logs (Cloudflare, AWS CloudFront, etc.)
   - Web server access logs (Nginx / Apache / Caddy)
2. **Referer Leakage:** If the callback page loads any third-party external resource (font, analytics script, tracking pixel) before `router.replace` finishes, the full Sanctum token is transmitted in the `Referer: ...?token=...` request header.
3. **Session Hijacking:** Anyone with access to the proxy logs, network monitoring, or shoulder-surfing the URL bar can capture the raw Sanctum API bearer token and impersonate the user across all API endpoints indefinitely.
4. **Identity Type Mismatch:** Line 33 passes `id: email`. The application models use UUIDs. Components or queries expecting `user.id` to be a valid UUID fail or send corrupted identity state.

#### Recommended Remediation Direction
Do not pass the bearer token in the redirect URL. Instead:
- **Pattern A (HttpOnly Exchange Cookie):** The backend OAuth callback sets a short-lived (e.g. 60 seconds), `SameSite=Lax`, `Secure`, `HttpOnly` cookie containing a temporary authorization code (or the token itself). The frontend callback page issues a `POST /auth/oauth/exchange` request with credentials included; the backend validates the cookie, returns the token in the JSON response payload, and clears the cookie.
- **Pattern B (UUID Correction):** Ensure the backend returns the actual User `uuid` alongside the token so `user.id` is populated with the database UUID.

---

### PROD-002 — Silent Completed Order Fallback with Fabricated Tickets on API Failure

- **Severity:** HIGH
- **Category:** Frontend Correctness & Data Integrity
- **Status:** Confirmed Defect
- **Location:** `frontend/src/app/[locale]/order-summary/[orderNumber]/page.tsx:24-48`

#### Evidence & Implementation Reality
```typescript
// frontend/src/app/[locale]/order-summary/[orderNumber]/page.tsx
queryFn: async () => {
  try {
    return await apiClient<CreatedOrder>(`/checkout/orders/${orderNumber}`);
  } catch {
    // Fallback realistic demo order for inspection and testing
    return {
      id: 'demo-order-123',
      order_number: orderNumber || 'KNZ-782910',
      user_id: 'user-ahmed-demo',
      total_amount_cents: 1000,
      currency: 'USD',
      exchange_rate: '1300.00',
      paid_amount_gateway: 13000,
      display_price_label: '13,000 IQD',
      promotional_tickets_granted: 15,
      status: 'completed',
      idempotency_key: 'idem-demo-99',
      legal_terms_agreed: true,
      terms_agreed_ip: '192.168.1.1',
      terms_agreed_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date().toISOString(),
    };
  }
}
```

#### Execution Path
```text
1. User or visitor navigates to /order-summary/KNZ-INVALID or /order-summary/KNZ-999
2. apiClient calls /checkout/orders/KNZ-INVALID -> Backend returns 404 Not Found or 401 Unauthorized
3. catch block intercepts the error
4. Rather than propagating the error, it returns a synthetic order object with:
   status: "completed"
   promotional_tickets_granted: 15
5. TanStack Query treats the response as a successful fetch (isError remains false)
6. UI renders OrderSummaryCard with "Order Completed! 15 Promotional Tickets Issued!"
```

#### Impact & Production Hazard
- If a customer's payment fails or an order is cancelled or non-existent, the user sees a screen confirming payment success and 15 granted tickets.
- If an attacker probes arbitrary order numbers, the UI masks the server's real response with fabricated success data.
- Violates the foundational rule: *Never turn a mock or stub into a production fallback*.

#### Recommended Remediation Direction
Remove the `catch` block entirely. Let the `apiClient` error reject the `queryFn` promise so that TanStack Query enters `isError = true`. The existing lines 67-87 already implement a clean `Order Not Found` card with return navigation.

---

### PROD-003 — Hardcoded Mock Draws and Concluded Winners Silently Rendered on API Failure

- **Severity:** HIGH
- **Category:** Public Trust, Regulatory & Correctness
- **Status:** Confirmed Defect
- **Location:** `frontend/src/hooks/useDraws.ts:21-32, 60-65`, `frontend/src/data/mock-draws.ts:19-140`

#### Evidence & Implementation Reality
```typescript
// frontend/src/hooks/useDraws.ts
export function useActiveDraws(initialData?: ActiveDrawsData) {
  const query = useQuery<ActiveDrawsData>({
    queryKey: ['draws', 'active'],
    queryFn: async () => {
      try {
        const result = await apiClient<ActiveDrawsData>('/draws/active');
        if (result && Array.isArray(result.draws)) return result;
        return { server_time_utc: getMockServerTimeUtc(), draws: MOCK_ACTIVE_DRAWS };
      } catch (err) {
        console.warn('Backend active draws endpoint unreachable, using offline fallback', err);
        return { server_time_utc: getMockServerTimeUtc(), draws: MOCK_ACTIVE_DRAWS };
      }
    },
    initialData: initialData ?? {
      server_time_utc: getMockServerTimeUtc(),
      draws: MOCK_ACTIVE_DRAWS,
    },
```

#### Execution Path
```text
1. User visits /raffle or the Homepage
2. Because initialData is MOCK_ACTIVE_DRAWS, the UI renders the mock data immediately before any network request completes
3. If the backend is under maintenance, deploying, or returning an error, MOCK_ACTIVE_DRAWS and MOCK_CONCLUDED_DRAWS remain permanently on screen
4. Synthetic draws include:
   - "السحب الساعي السريع (100$ كاش)" with 420 tickets
   - "السحب اليومي الذهبي (iPhone 16 Pro Max)" with 2450 tickets
   - Fictitious winners in ConcludedDrawsList
```

#### Impact & Production Hazard
- Under Iraqi consumer protection laws and promotional contest regulations, advertising fake draws or displaying fabricated winners when an API is unreachable creates severe legal liability.
- Displays phantom prize countdowns that do not exist in the database.

#### Recommended Remediation Direction
- Change `initialData` to `undefined` or `{ server_time_utc: '', draws: [] }`.
- In `catch`, do not return mock fixtures; allow TanStack Query to record the error or return an empty array `{ server_time_utc: new Date().toISOString(), draws: [] }`.
- Display real skeleton states while loading, and genuine empty states when no active draws are scheduled.

---

### PROD-004 — Unauthenticated & Unthrottled Next.js Server Route Calling OpenAI API

- **Severity:** HIGH
- **Category:** Security / Resource Exhaustion & Financial Denial of Service
- **Status:** Confirmed Defect
- **Location:** `frontend/src/app/api/search/route.ts:10-61`

#### Evidence & Implementation Reality
```typescript
// frontend/src/app/api/search/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parseResult = SearchRequestSchema.safeParse(rawBody);
    ...
    if (process.env.OPENAI_API_KEY) {
      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          ...
```

#### Execution Path
```text
1. Attacker sends scripted HTTP POST requests to https://knzin.com/api/search
   Payload: { "query": "random string 123", "sort": "relevance" }
2. No auth token, session cookie, or CSRF token is required
3. No IP rate limiter or Turnstile verification exists
4. Route handler invokes OpenAI API gpt-4o-mini synchronously using server's OPENAI_API_KEY
5. Attacker sends 1,000 concurrent requests/min -> Exhausts OpenAI quota, runs up billing
```

#### Impact
- Direct financial drain on the project owner's OpenAI billing account.
- Exhaustion of organization TPM/RPM limits, disabling search across the platform for real learners.

#### Recommended Remediation Direction
1. Add an IP-based sliding window rate limiter (e.g. max 10 requests per minute per IP via `@upstash/ratelimit` or local token bucket).
2. Integrate Cloudflare Turnstile bot verification on the search request if query volume exceeds threshold.
3. Fall back directly to the fast local deterministic grounding engine (`groundHits`) if the OpenAI budget or rate limit is exceeded.

---

### PROD-005 — Unprotected YouTube Video Source Exposed in Client DOM

- **Severity:** MEDIUM
- **Category:** Content Protection & DRM
- **Status:** Confirmed Defect
- **Location:** `frontend/src/lib/video.ts:22-41`, `frontend/src/components/lesson/LessonVideoPlayer.tsx:171-178`

#### Evidence & Implementation Reality
```typescript
// frontend/src/lib/video.ts
if (ytMatch && ytMatch[1]) {
  const id = ytMatch[1];
  ...
  return {
    provider: 'youtube',
    id,
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`,
  };
}

// frontend/src/components/lesson/LessonVideoPlayer.tsx
<iframe
  src={parsedVideo.embedUrl}
  title={partTitle}
  className="w-full h-full border-0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  allowFullScreen
/>
```

#### Impact
- Unlisted YouTube videos have no cryptographic access control on YouTube's servers.
- Any customer can open DevTools, copy the `iframe src` or video ID, and watch/download the course outside KNZiN without paying.
- The canvas watermark overlay (`LessonWatermarkOverlay`) only runs in KNZiN's DOM; viewing the video on YouTube renders it completely unwatermarked.

#### Recommended Remediation Direction
For commercial production, transition paid video hosting to private streaming infrastructure with signed token URLs (e.g., Cloudflare Stream with signed playback tokens or Bunny Stream with signed DRM).

---

### PROD-006 — Inaccurate Watch Depth Progress Accumulation When Video is Paused

- **Severity:** MEDIUM
- **Category:** Frontend Correctness & Analytics
- **Status:** Confirmed Defect
- **Location:** `frontend/src/components/analytics/use-watch-depth.ts:37-78`

#### Evidence & Implementation Reality
```typescript
// frontend/src/components/analytics/use-watch-depth.ts
const interval = setInterval(() => {
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
    lastTickRef.current = Date.now();
    return;
  }
  const now = Date.now();
  if (lastTickRef.current) {
    const deltaSeconds = (now - lastTickRef.current) / 1000;
    accumulatedSecondsRef.current += deltaSeconds;
    ...
```
`isPlaying` is set to `true` when the user clicks the play button on the poster. After that, the `setInterval` ticks every 1 second, adding time unconditionally as long as the tab is visible.

#### Impact
- If a user pauses the video in YouTube or steps away from their computer, the timer keeps running.
- After several minutes, the hook fires milestones 25%, 50%, 75%, and 95%, marks the lesson completed, and calls `saveLessonProgress` on the backend.
- Users can fake course completion without ever watching the lessons.

#### Recommended Remediation Direction
Integrate with the YouTube/Vimeo IFrame API (`onStateChange`) or HTML5 `<video>` events (`onPlay`, `onPause`, `onEnded`) to ensure `accumulatedSeconds` only increments when media is actively playing.

---

### PROD-007 — Missing Automatic Session Logout or Token Eviction on 401 Unauthorized

- **Severity:** MEDIUM
- **Category:** Frontend Authentication & UX Resilience
- **Status:** Confirmed Defect
- **Location:** `frontend/src/lib/api-client.ts:74-102`, `frontend/src/hooks/useAuth.ts:40-60`

#### Evidence & Implementation Reality
```typescript
// frontend/src/lib/api-client.ts
if (!response.ok) {
  throw new ApiError(
    (data as any)?.message || `HTTP Error ${response.status}`,
    (data as any)?.code || 'ERR_HTTP',
    response.status
  );
}
```
When a Sanctum token expires or is revoked on the backend, `apiClient` throws an `ApiError` with `httpStatus = 401`. However, it does not evict `knzin_auth_token` or `knzin_user` from `localStorage` or trigger a global logout.

#### Impact
- The user remains in a "zombie" logged-in state in `localStorage`.
- Header HUD continues displaying the user's name and unread badge, while all data requests fail with 401 errors until the user manually signs out.

#### Recommended Remediation Direction
Add a centralized response interceptor in `apiClient`: if `response.status === 401`, clear `knzin_auth_token` and `knzin_user` from `localStorage`, emit a `storage` event, and redirect to `/auth/login?expired=1`.

---

### PROD-008 — Premature Entitlement Write to LocalStorage on Pending Unpaid Order Creation

- **Severity:** LOW
- **Category:** State Integrity / Technical Debt
- **Status:** Confirmed Defect
- **Location:** `frontend/src/components/checkout/CheckoutBottomSheet.tsx:150-159`

#### Evidence & Implementation Reality
```typescript
// frontend/src/components/checkout/CheckoutBottomSheet.tsx
const order = await createOrder({ ... });
// Record purchased part or bundle entitlement for immediate session unlock (DEF-05C)
try {
  const key = `knzin_purchased_parts_${item.courseId}`;
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  if (item.itemType === 'bundle') {
    localStorage.setItem(key, JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
  } else if (item.partNumber) {
    const updated = Array.from(new Set([...existing, item.partNumber]));
    localStorage.setItem(key, JSON.stringify(updated));
  }
} catch {}
```

#### Impact
- `createOrder` only creates a **pending** order before payment. Storing purchased parts in `localStorage` here is dead legacy code from DEF-05C that reflects uncommitted financial state.
- While playback now checks the server `/playback-auth`, leaving fake entitlement keys in localStorage creates risk if any future component relies on local storage.

#### Recommended Remediation Direction
Delete lines 150-159 in `CheckoutBottomSheet.tsx`. Entitlements must be governed strictly by server-side verification after webhook payment confirmation (DEC-003).

---

### PROD-009 — Static Search Engine Disconnected from Database Catalog

- **Severity:** LOW
- **Category:** Scalability & Maintainability
- **Status:** Confirmed Defect
- **Location:** `frontend/src/lib/search/ground.ts:1-25`, `frontend/src/lib/course-content.ts`

#### Evidence & Implementation Reality
`groundHits` references `VOCATIONAL_COURSES_CONTENT`, a static dictionary of 8 hardcoded courses.

#### Impact
Courses created dynamically by administrators via the Feature 008 Admin Panel will not appear in natural language search results.

#### Recommended Remediation Direction
Refactor `groundHits` and `searchCatalog` to load course metadata from the Laravel catalog API (with Redis/memory cache) rather than static TypeScript constants.

---

### PROD-010 — Unset Secure Flag on Tracking Cookies in Next.js Middleware

- **Severity:** LOW
- **Category:** Frontend Security
- **Status:** Confirmed Defect
- **Location:** `frontend/src/middleware.ts:12-25`

#### Evidence & Implementation Reality
```typescript
// frontend/src/middleware.ts
response.cookies.set("knzin_ref", ref.trim(), {
  maxAge: 30 * 24 * 60 * 60,
  path: "/",
  sameSite: "lax",
});
```

#### Impact
The cookie is set without `secure: true`. In mixed-protocol environments, referral attribution cookies could be sent over cleartext HTTP before TLS redirect.

#### Recommended Remediation Direction
Add `secure: process.env.NODE_ENV === 'production'` to cookie configuration.

---

### PROD-011 — Fallback Catalog Fixtures with Non-UUID Identifiers

- **Severity:** INFO
- **Category:** Technical Debt
- **Location:** `frontend/src/data/mock-courses.ts:7`

#### Evidence & Implementation Reality
`DETAILED_COURSES_MOCK` uses slug strings for IDs (`id: 'course-auto-detailing'`). In the database, course IDs are UUIDs.

#### Impact
If the backend is down and fallback courses are rendered, clicking purchase attempts to create an order with a non-UUID ID, failing validation.

#### Recommended Remediation Direction
Replace mock course IDs with standard RFC 4122 UUID strings or disable checkout buttons when running in fallback mode.

---

## 4. Suggested Architectural Improvements

1. **Centralized 401 Interceptor in `api-client.ts`:**
   Implement an event-driven token eviction handler that unifies authentication error handling across all TanStack queries and mutations.
2. **HttpOnly Cookie Architecture for Sanctum Authentication:**
   Transition the SPA from storing bearer tokens in `localStorage` to using Laravel Sanctum's first-party SPA cookie authentication (`laravel_session` + `XSRF-TOKEN`). This completely eliminates XSS token-theft risks and resolves PROD-001 at the root.
3. **Dedicated Video CDN Tokenization:**
   Before running high-spend paid ad campaigns, replace direct YouTube embeds with Cloudflare Stream or Bunny Stream DRM player embeds with signed URLs to protect IP and ensure tamper-proof watermarking.
