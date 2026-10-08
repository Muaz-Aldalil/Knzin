# API Contracts: App-Wide Dynamic CMS Integration

**Feature**: `011-app-wide-cms-connection`  
**Date**: 2026-10-08  

---

## 1. Public Content Delivery

### `GET /api/v1/content/site-wide`
Retrieves all 20 canonical and customized CMS sections merged with fallback defaults.

**Headers**:
- `Accept: application/json`

**Response `200 OK`**:
```json
{
  "sections": {
    "site_shell": { ... },
    "hero": { ... },
    "skill_capital": { ... },
    "courses_display": { ... },
    "promotional_banner": { ... },
    "promotional_referral": { ... },
    "free_referral_card": { ... },
    "legal_compliance": { ... },
    "referral_faq": { ... },
    "ticket_ladder": { ... },
    "affiliate_referral": { ... },
    "draw_content": { ... },
    "raffle_arena": { ... },
    "course_detail": { ... },
    "lesson_player": { ... },
    "affiliate_portal": { ... },
    "learner_dashboard": { ... },
    "checkout_cart": { ... },
    "search_page": { ... },
    "system_notices": { ... }
  }
}
```

---

## 2. Administrator CMS Management

### `GET /api/v1/admin/cms/landing/{section}`
Retrieves a single section envelope with last updater metadata.

**Headers**:
- `Authorization: Bearer <token>`
- `Accept: application/json`

**Response `200 OK`**:
```json
{
  "section": "hero",
  "content": { ... },
  "updated_at": "2026-10-08T20:00:00Z",
  "updated_by_user_id": 1
}
```

### `PUT /api/v1/admin/cms/landing/{section}`
Updates the content of a single section and invalidates the site-wide public cache.

**Headers**:
- `Authorization: Bearer <token>`
- `Content-Type: application/json`
- `Accept: application/json`

**Payload**:
```json
{
  "heading_ar": "تعلم مهنة المستقبل",
  "heading_en": "Learn Future Skills",
  "secondary_cta_label_ar": "تصفح المسارات",
  "secondary_cta_label_en": "Browse Tracks",
  "secondary_cta_url": "#catalog"
}
```

**Response `200 OK`**:
```json
{
  "section": "hero",
  "content": { ... },
  "updated_at": "2026-10-08T22:30:00Z",
  "updated_by_user_id": 1
}
```
