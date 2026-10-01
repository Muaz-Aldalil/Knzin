# API Contract: Expiring Downloads (`POST /api/v1/lessons/{courseSlug}/parts/{partNumber}/downloads/{resourceId}`)

**Branch**: `005-learner-hub`  
**Endpoint**: `POST /api/v1/lessons/{courseSlug}/parts/{partNumber}/downloads/{resourceId}`  
**Authentication**: Required (`auth:sanctum`)  
**Format**: JSend-compliant JSON  

---

## 1. Description
Generates a temporary signed download URL for high-value vocational schematics, checklists, wiring diagrams, and trade attachments.
- Enforces course entitlement authorization on the backend.
- Signed URLs have a strict maximum lifespan of **15 minutes** (900 seconds) in accordance with the project Constitution.
- Rejects requests if entitlement is missing, expired, or revoked.

---

## 2. Request
- **URL Parameters**:
  - `courseSlug` (string): Course slug (e.g. `auto-detailing`).
  - `partNumber` (integer): Lesson part number (1-indexed).
  - `resourceId` (string): Attachment identifier (e.g. `ad-r1`).
- **Headers**:
  - `Authorization: Bearer <sanctum_token>`
  - `Accept: application/json`

---

## 3. Responses

### 3.1 Success Response (`HTTP 200 OK`)
```json
{
  "status": "success",
  "data": {
    "resource_id": "ad-r1",
    "filename": "iraqi_market_vehicle_paint_depth_chart.pdf",
    "mime_type": "application/pdf",
    "size_bytes": 2516582,
    "download_url": "https://storage.knzin.com/protected/schematics/ad-r1.pdf?signature=a1b2c3d4e5f6...&expires=1790695200",
    "expires_at": "2026-10-01T14:47:00Z",
    "validity_seconds": 900
  }
}
```

### 3.2 Error Response — Missing Entitlement (`HTTP 403 Forbidden`)
```json
{
  "status": "fail",
  "data": {
    "code": "ERR_RESOURCE_LOCKED",
    "message": "الملفات المرفقة متاحة حصرياً للمتدربين المشتركين في هذا الجزء أو باقة الدورة."
  }
}
```

### 3.3 Error Response — Resource Not Found (`HTTP 404 Not Found`)
```json
{
  "status": "fail",
  "data": {
    "code": "ERR_RESOURCE_NOT_FOUND",
    "message": "الملف المطلوب غير موجود."
  }
}
```
