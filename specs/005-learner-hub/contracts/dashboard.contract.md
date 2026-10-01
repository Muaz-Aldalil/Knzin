# API Contract: Learner Dashboard (`GET /api/v1/user/dashboard`)

**Branch**: `005-learner-hub`  
**Endpoint**: `GET /api/v1/user/dashboard`  
**Authentication**: Required (`auth:sanctum`)  
**Format**: JSend-compliant JSON  

---

## 1. Description
Returns the authenticated learner's complete personalized dashboard state:
- Summary metrics (enrolled courses count, completed courses count, total active tickets).
- Active continuation item ("Jump Back In" last watched lesson part).
- Enrolled course cards with syllabus progress percentages and completion badges.
- Bilingual course metadata (`title_ar`, `title_en`, etc.).

---

## 2. Request
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
    "summary": {
      "enrolled_courses_count": 2,
      "completed_courses_count": 1,
      "total_tickets_count": 16
    },
    "active_learning": {
      "course_slug": "auto-detailing",
      "course_title_ar": "العناية الفائقة بالسيارات والنانو سيراميك الاحترافي",
      "course_title_en": "Professional Auto Detailing & Nano-Ceramic Coating",
      "cover_image_url": "https://images.unsplash.com/photo-1601362840469-51e4d8d58785",
      "part_number": 2,
      "part_title_ar": "التدريب العملي على مكائن الصقل الدوارة والمدارية",
      "part_title_en": "Hands-on Rotary and Dual-Action Polisher Mechanics",
      "watch_seconds": 1485,
      "percent_complete": 45,
      "is_completed": false,
      "last_watched_at": "2026-10-01T14:32:00Z"
    },
    "enrolled_courses": [
      {
        "course_id": "9d3e8f1b-5e4a-4b2c-9a1d-8f3b2c1a0e9f",
        "slug": "auto-detailing",
        "title_ar": "العناية الفائقة بالسيارات والنانو سيراميك الاحترافي",
        "title_en": "Professional Auto Detailing & Nano-Ceramic Coating",
        "cover_image_url": "https://images.unsplash.com/photo-1601362840469-51e4d8d58785",
        "entitlement_type": "bundle",
        "owned_parts_count": 6,
        "total_active_parts": 6,
        "completed_parts_count": 1,
        "owned_scope_progress_percentage": 24,
        "overall_progress_percentage": 24,
        "is_course_completed": false,
        "last_accessed_at": "2026-10-01T14:32:00Z"
      },
      {
        "course_id": "7b2a1c0e-4d3f-4a1b-8e2c-9f0a1b2c3d4e",
        "slug": "solar-installation",
        "title_ar": "تصميم وتركيب منظومات الطاقة الشمسية الهجينة",
        "title_en": "Design & Installation of Hybrid Solar PV Systems",
        "cover_image_url": "https://images.unsplash.com/photo-1509391365360-2e959784a276",
        "entitlement_type": "bundle",
        "owned_parts_count": 4,
        "total_active_parts": 4,
        "completed_parts_count": 4,
        "owned_scope_progress_percentage": 100,
        "overall_progress_percentage": 100,
        "is_course_completed": true,
        "last_accessed_at": "2026-09-30T18:15:00Z"
      }
    ]
  }
}
```

### 3.2 Empty State Response (`HTTP 200 OK`)
When an authenticated learner has zero course purchases:
```json
{
  "status": "success",
  "data": {
    "summary": {
      "enrolled_courses_count": 0,
      "completed_courses_count": 0,
      "total_tickets_count": 0
    },
    "active_learning": null,
    "enrolled_courses": []
  }
}
```

### 3.3 Error Response — Unauthenticated (`HTTP 401 Unauthorized`)
```json
{
  "status": "fail",
  "data": {
    "code": "ERR_UNAUTHORIZED",
    "message": "Unauthenticated"
  }
}
```
