# API Contract: Progress Recording & Continuation (`POST /api/v1/progress` & `GET /api/v1/user/active-learning`)

**Branch**: `005-learner-hub`  
**Authentication**: Required (`auth:sanctum`)  
**Format**: JSend-compliant JSON  

---

## 1. Description
Hardens the progress recording and active-learning continuation endpoints:
- Paid parts (Part 2 and beyond) require an active course entitlement.
- Watch depth and percentage updates enforce **monotonicity** on the server: lower reports never regress higher previously recorded metrics.
- Reaching 95% completion locks `is_completed = true` permanently (**sticky completion**).

---

## 2. Endpoint 1: `POST /api/v1/progress`

### 2.1 Request Body
```json
{
  "course_slug": "auto-detailing",
  "part_number": 2,
  "watch_seconds": 1800,
  "percent_complete": 55
}
```

### 2.2 Success Response (`HTTP 200 OK`)
```json
{
  "status": "success",
  "data": {
    "progress": {
      "course_slug": "auto-detailing",
      "part_number": 2,
      "watch_seconds": 1800,
      "percent_complete": 55,
      "is_completed": false,
      "last_watched_at": "2026-10-01T14:35:00Z"
    }
  }
}
```

### 2.3 Success Response — Monotonicity Guarantee Example
If client sends `percent_complete: 30` when server already has `percent_complete: 55`:
```json
{
  "status": "success",
  "data": {
    "progress": {
      "course_slug": "auto-detailing",
      "part_number": 2,
      "watch_seconds": 1800,
      "percent_complete": 55,
      "is_completed": false,
      "last_watched_at": "2026-10-01T14:36:00Z"
    }
  }
}
```
*(Notice percentage remains 55 while `last_watched_at` refreshes).*

### 2.4 Error Response — Paid Part Locked (`HTTP 403 Forbidden`)
```json
{
  "status": "fail",
  "data": {
    "code": "ERR_PART_LOCKED",
    "message": "يجب شراء هذا الجزء أو الباقة الكاملة لتسجيل التقدم."
  }
}
```

---

## 3. Endpoint 2: `GET /api/v1/user/active-learning`

### 3.1 Success Response (`HTTP 200 OK`)
```json
{
  "status": "success",
  "data": {
    "active_learning": {
      "course_slug": "auto-detailing",
      "course_title_ar": "العناية الفائقة بالسيارات والنانو سيراميك الاحترافي",
      "course_title_en": "Professional Auto Detailing & Nano-Ceramic Coating",
      "cover_image_url": "https://images.unsplash.com/photo-1601362840469-51e4d8d58785",
      "part_number": 2,
      "part_title_ar": "التدريب العملي على مكائن الصقل الدوارة والمدارية",
      "part_title_en": "Hands-on Rotary and Dual-Action Polisher Mechanics",
      "watch_seconds": 1800,
      "percent_complete": 55,
      "is_completed": false,
      "last_watched_at": "2026-10-01T14:35:00Z"
    }
  }
}
```

### 3.2 Empty State Response (`HTTP 200 OK`)
When no active progress exists or user has never started a lesson:
```json
{
  "status": "success",
  "data": {
    "active_learning": null
  }
}
```
*(Zero fallback to demo/mock progress).*
