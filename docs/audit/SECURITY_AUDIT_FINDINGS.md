# KNZiN Production Readiness Audit — Stage 4: Security & Protection Findings

**Audit Target**: Security Architecture, Secrets, Auth Boundaries, and Attack Surface  
**Status**: Completed  
**Audit Mode**: Strictly Read-Only  
**Generated**: 2026-10-05  

---

## Executive Summary of Security Findings

| Finding ID | Severity | Category | Title | Status |
| :--- | :--- | :--- | :--- | :--- |
| **PROD-027** | **MEDIUM** | Frontend / Assets | Next.js Image `remotePatterns` Restricts to Unsplash, Crashing S3/CDN Images | Verified Asset Risk |
| **PROD-028** | **HIGH** | Config / Operations | Production Default Fallbacks to `sync` Queue and `file` Sessions | Verified Deployment Risk |
| **PROD-029** | **MEDIUM** | Network / DoS | Public Read API Endpoints (Catalog, Draws, CMS) Lack Rate Limiting | Verified DoS Risk |

---

## Detailed Security Findings

---

### PROD-027: Next.js Image `remotePatterns` Restricts to Unsplash, Crashing S3/CDN Images

- **Severity**: **MEDIUM**
- **Category**: Frontend Asset Security & Content Delivery
- **Status**: Verified Asset Risk
- **Location**:
  - `frontend/next.config.ts` (Lines 8–18)
  - `frontend/src/components/courses/CourseCard.tsx`
  - `frontend/src/components/draws/DrawCard.tsx`
- **Evidence**:
  ```typescript
  // frontend/next.config.ts:8-18
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
      },
    ],
  },
  ```
- **Execution Path**:
  1. An admin creates or updates a course, prize, or landing CMS banner using an image hosted on AWS S3, Cloudflare R2, or a custom CDN (`https://cdn.knzin.com/...` or `https://knzin-assets.s3.amazonaws.com/...`).
  2. The frontend attempts to render the image using Next.js `<Image src={cover_image_url} />`.
  3. Next.js image optimization security policy blocks the image request because the hostname is not configured in `remotePatterns`.
  4. The image component throws an unhandled client-side runtime exception or displays a broken image icon.
- **Impact**: Broken visual interface on public catalog, landing page, and learner dashboard when non-Unsplash images are deployed.
- **Recommended Direction**:
  - In `next.config.ts`, expand `remotePatterns` to include the project's production S3/storage bucket hostnames, OR use a wildcard/fallback wrapper or unoptimized image rendering for admin-provided media URLs.

---

### PROD-028: Production Default Fallbacks to `sync` Queue and `file` Sessions

- **Severity**: **HIGH**
- **Category**: Environment Security & Production Configuration
- **Status**: Verified Deployment Risk
- **Location**:
  - `backend/.env.example` (Lines 30, 38, 40)
  - `backend/config/queue.php`
  - `backend/config/session.php`
- **Evidence**:
  ```env
  SESSION_DRIVER=file
  QUEUE_CONNECTION=sync
  CACHE_STORE=file
  ```
- **Execution Path**:
  1. When deploying to a containerized or multi-instance environment (e.g. AWS ECS, Kubernetes, DigitalOcean App Platform), if `QUEUE_CONNECTION` is not set to `redis` or `database`, it defaults to `sync`.
  2. Heavy asynchronous tasks (ticket minting, bulk notifications, email delivery) execute synchronously within the user's web request, causing request timeouts.
  3. If `SESSION_DRIVER` and `CACHE_STORE` remain `file`, multi-node deployments cannot share session state, causing users to get randomly logged out across load-balanced requests.
- **Impact**: Horizontal scaling impossible; severe request latency spikes under real traffic.
- **Recommended Direction**:
  - In production deployment manifests, mandate `QUEUE_CONNECTION=redis` (or `database`), `SESSION_DRIVER=redis` (or `database`), and `CACHE_STORE=redis`.

---

### PROD-029: Public Read API Endpoints Lack Rate Limiting

- **Severity**: **MEDIUM**
- **Category**: Network Protection & Availability
- **Status**: Verified DoS Risk
- **Location**:
  - `backend/routes/api.php` (Lines 39–52)
- **Evidence**:
  ```php
  // backend/routes/api.php:39-52
  Route::get('/catalog/courses', [CatalogController::class, 'index']);
  Route::get('/catalog/courses/{slug}', [CatalogController::class, 'show']);
  Route::get('/draws/active', [DrawController::class, 'active']);
  Route::get('/draws/concluded', [DrawController::class, 'concluded']);
  Route::get('/activity/recent', [ActivityController::class, 'recent']);
  Route::get('/content/landing', [\App\Http\Controllers\PublicLandingCmsController::class, 'index']);
  Route::get('/content/site-wide', [\App\Http\Controllers\PublicLandingCmsController::class, 'siteWide']);
  // Zero throttle middleware assigned!
  ```
- **Execution Path**:
  1. Automated bots or malicious actors send high-volume HTTP floods (10,000 req/sec) to `/api/v1/content/landing` or `/api/v1/catalog/courses`.
  2. Because no rate limiting middleware is attached to these public routes, every request hits the PHP worker processes and database.
  3. Server connection pools are exhausted, starving authenticated checkout, payment, and playback requests.
- **Impact**: Application vulnerability to application-layer denial of service (L7 HTTP flood).
- **Recommended Direction**:
  - Apply standard global rate limiting (`middleware('throttle:120,1')`) to all public routes under `Route::prefix('v1')`.
