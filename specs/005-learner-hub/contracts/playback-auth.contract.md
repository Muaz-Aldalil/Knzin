# API Contract: Playback Authorization (`POST /api/v1/lessons/{courseSlug}/parts/{partNumber}/playback-auth`)

**Branch**: `005-learner-hub`  
**Endpoint**: `POST /api/v1/lessons/{courseSlug}/parts/{partNumber}/playback-auth`  
**Authentication**: Optional for Part 1 (Free Preview); Required (`auth:sanctum`) for Part 2 and beyond  
**Format**: JSend-compliant JSON  

---

## 1. Description
Authorizes playback for a specific course lesson part:
1. For **Part 1**: Public free preview. Returns the authorized stream URL with zero login or purchase required.
2. For **Part 2 and beyond**: Enforces server-side entitlement verification. If entitled, returns:
   - A signed streaming URL with a maximum validity window of 15 minutes (`expires_at`).
   - The authoritative anti-piracy Canvas watermark identity payload (full normalized email, unique persisted learner code `LRN-XXXXXX`, and current playback timestamp).

---

## 2. Request
- **URL Parameters**:
  - `courseSlug` (string): Course identifier (e.g. `auto-detailing`).
  - `partNumber` (integer): Lesson part number (1-indexed).
- **Headers**:
  - `Authorization: Bearer <sanctum_token>` (Required for parts > 1)
  - `Accept: application/json`

---

## 3. Responses

### 3.1 Success Response — Paid Part with Entitlement (`HTTP 200 OK`)
```json
{
  "status": "success",
  "data": {
    "course_slug": "auto-detailing",
    "part_number": 2,
    "part_title_ar": "التدريب العملي على مكائن الصقل الدوارة والمدارية",
    "part_title_en": "Hands-on Rotary and Dual-Action Polisher Mechanics",
    "duration_seconds": 3300,
    "stream": {
      "stream_url": "https://stream.knzin.com/hls/ad-part-2/master.m3u8?token=eyJhbGciOiJIUzI1NiIs...&expires=1790695200",
      "format": "hls",
      "expires_at": "2026-10-01T14:47:00Z",
      "validity_seconds": 900
    },
    "watermark": {
      "account_email": "muaz@example.com",
      "learner_code": "LRN-7K2M9W",
      "rendered_at": "01 Oct 2026 14:32"
    }
  }
}
```

### 3.2 Success Response — Part 1 Free Introductory Preview (`HTTP 200 OK`)
```json
{
  "status": "success",
  "data": {
    "course_slug": "auto-detailing",
    "part_number": 1,
    "part_title_ar": "التعرف على فسيولوجيا دهان السيارات الحديثة",
    "part_title_en": "Understanding Automotive Clear Coat Physiology",
    "duration_seconds": 2700,
    "stream": {
      "stream_url": "https://stream.knzin.com/hls/ad-part-1/master.m3u8",
      "format": "hls",
      "expires_at": null,
      "validity_seconds": null
    },
    "watermark": null
  }
}
```

### 3.3 Error Response — Part Locked / Unpurchased (`HTTP 403 Forbidden`)
When the learner lacks an active entitlement for this part or the bundle:
```json
{
  "status": "fail",
  "data": {
    "code": "ERR_PART_LOCKED",
    "message": "يجب شراء هذا الجزء التدريبي أو باقة الدورة الكاملة للمشاهدة.",
    "pricing": {
      "part_price_cents": 200,
      "part_promotional_tickets": 1,
      "bundle_price_cents": 1000,
      "bundle_promotional_tickets": 15
    }
  }
}
```

### 3.4 Error Response — Unauthenticated on Paid Part (`HTTP 401 Unauthorized`)
```json
{
  "status": "fail",
  "data": {
    "code": "ERR_UNAUTHORIZED",
    "message": "يرجى تسجيل الدخول أو إدخال بريدك للوصول إلى هذا المحتوى المدفوع."
  }
}
```
