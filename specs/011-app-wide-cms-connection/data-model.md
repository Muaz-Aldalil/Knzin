# Data Model & Schema Specification: App-Wide Dynamic CMS Integration

**Feature**: `011-app-wide-cms-connection`  
**Date**: 2026-10-08  
**Status**: Specification Complete  

---

## 1. Storage & Persistence Model

CMS content is persisted in the `platform_settings` table:

```sql
CREATE TABLE platform_settings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    key VARCHAR(191) NOT NULL UNIQUE,
    value JSON NOT NULL,
    type VARCHAR(32) NOT NULL DEFAULT 'json',
    is_public BOOLEAN NOT NULL DEFAULT 1,
    updated_by_user_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_platform_settings_key (key),
    FOREIGN KEY (updated_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

Each CMS section maps directly to a record in `platform_settings` with the key prefix `landing.{section}`.

---

## 2. Section Entity Schemas

### 2.1 Global Shell (`landing.site_shell`)
```typescript
interface SiteShellSectionContent {
  ticker_enabled: boolean;
  ticker_speed: string; // e.g. "normal" | "slow" | "fast"
  ticker_announcements: Array<{
    id: string;
    type: string;
    highlight_label_ar: string;
    highlight_label_en: string;
    text_ar: string;
    text_en: string;
  }>;
  whatsapp_enabled: boolean;
  whatsapp_url: string;
  whatsapp_button_label_ar: string;
  whatsapp_button_label_en: string;
  whatsapp_greeting_ar: string;
  whatsapp_greeting_en: string;
  how_it_works_title_ar: string;
  how_it_works_title_en: string;
  how_it_works_subtitle_ar: string;
  how_it_works_subtitle_en: string;
  how_it_works_steps: Array<{
    step: number;
    title_ar: string;
    title_en: string;
    desc_ar: string;
    desc_en: string;
    badge_ar: string;
    badge_en: string;
  }>;
  footer_copyright_ar: string;
  footer_copyright_en: string;
  footer_disclaimer_ar: string;
  footer_disclaimer_en: string;
  header_announcement_badge_ar?: string;
  header_announcement_badge_en?: string;
  header_cta_label_ar?: string;
  header_cta_label_en?: string;
  header_cta_url?: string;
}
```

### 2.2 Hero Section (`landing.hero`)
```typescript
interface HeroSectionContent {
  badge_ar: string;
  badge_en: string;
  heading_ar: string;
  heading_en: string;
  subheading_ar: string;
  subheading_en: string;
  primary_cta_label_ar: string;
  primary_cta_label_en: string;
  primary_cta_url: string;
  secondary_cta_label_ar: string;
  secondary_cta_label_en: string;
  secondary_cta_url: string;
  price_display_override_ar: string;
  price_display_override_en: string;
  timer_active: boolean;
  timer_title_ar: string;
  timer_title_en: string;
  hero_image_url: string;
}
```

### 2.3 Course Display & Catalog (`landing.courses_display`)
```typescript
interface CoursesDisplaySectionContent {
  section_title_ar: string;
  section_title_en: string;
  section_subtitle_ar: string;
  section_subtitle_en: string;
  featured_course_id: string | null;
  show_bundle_discount_badge: boolean;
  bundle_badge_text_ar: string;
  bundle_badge_text_en: string;
  is_visible: boolean;
}
```

### 2.4 Course Detail Page (`landing.course_detail`)
```typescript
interface CourseDetailSectionContent {
  guarantee_badge_ar: string;
  guarantee_badge_en: string;
  guarantee_headline_ar: string;
  guarantee_headline_en: string;
  guarantee_description_ar: string;
  guarantee_description_en: string;
  bundle_promo_badge_ar: string;
  bundle_promo_badge_en: string;
  bundle_promo_title_ar: string;
  bundle_promo_title_en: string;
  bundle_promo_desc_ar: string;
  bundle_promo_desc_en: string;
  learning_outcomes_header_ar: string;
  learning_outcomes_header_en: string;
  is_visible: boolean;
}
```

### 2.5 Lesson Player (`landing.lesson_player`)
```typescript
interface LessonPlayerSectionContent {
  paywall_headline_ar: string;
  paywall_headline_en: string;
  paywall_subheadline_ar: string;
  paywall_subheadline_en: string;
  paywall_perks_ar: string[];
  paywall_perks_en: string[];
  paywall_cta_label_ar: string;
  paywall_cta_label_en: string;
  completion_banner_title_ar: string;
  completion_banner_title_en: string;
  completion_banner_desc_ar: string;
  completion_banner_desc_en: string;
  is_visible: boolean;
}
```

### 2.6 Raffle Arena (`landing.raffle_arena`)
```typescript
interface RaffleArenaSectionContent {
  hero_badge_ar: string;
  hero_badge_en: string;
  hero_title_ar: string;
  hero_title_en: string;
  hero_description_ar: string;
  hero_description_en: string;
  next_draw_title_ar: string;
  next_draw_title_en: string;
  next_draw_date_text_ar: string;
  next_draw_date_text_en: string;
  next_draw_note_ar: string;
  next_draw_note_en: string;
  single_part_title_ar: string;
  single_part_title_en: string;
  single_part_desc_ar: string;
  single_part_desc_en: string;
  single_part_perks_ar: string[];
  single_part_perks_en: string[];
  bundle_title_ar: string;
  bundle_title_en: string;
  bundle_desc_ar: string;
  bundle_desc_en: string;
  bundle_perks_ar: string[];
  bundle_perks_en: string[];
  bundle_badge_ar: string;
  bundle_badge_en: string;
  faq_items: Array<{
    id: string;
    question_ar: string;
    question_en: string;
    answer_ar: string;
    answer_en: string;
  }>;
  is_visible: boolean;
}
```

### 2.7 Checkout & Cart (`landing.checkout_cart`)
```typescript
interface CheckoutCartSectionContent {
  trust_badge_ar: string;
  trust_badge_en: string;
  trust_headline_ar: string;
  trust_headline_en: string;
  trust_description_ar: string;
  trust_description_en: string;
  ticket_gift_notice_ar: string;
  ticket_gift_notice_en: string;
  order_celebration_title_ar: string;
  order_celebration_title_en: string;
  order_celebration_desc_ar: string;
  order_celebration_desc_en: string;
  order_ticket_reassurance_ar: string;
  order_ticket_reassurance_en: string;
  is_visible: boolean;
}
```

### 2.8 Search Page (`landing.search_page`)
```typescript
interface SearchPageSectionContent {
  hero_headline_ar: string;
  hero_headline_en: string;
  hero_subtitle_ar: string;
  hero_subtitle_en: string;
  search_placeholder_ar: string;
  search_placeholder_en: string;
  suggested_queries_ar: string[];
  suggested_queries_en: string[];
  search_tips_title_ar: string;
  search_tips_title_en: string;
  search_tips_items_ar: string[];
  search_tips_items_en: string[];
  empty_title_ar: string;
  empty_title_en: string;
  empty_desc_ar: string;
  empty_desc_en: string;
  is_visible: boolean;
}
```

### 2.9 System Notices (`landing.system_notices`)
```typescript
interface SystemNoticesSectionContent {
  not_found_title_ar: string;
  not_found_title_en: string;
  not_found_desc_ar: string;
  not_found_desc_en: string;
  not_found_home_btn_ar: string;
  not_found_home_btn_en: string;
  not_found_search_btn_ar: string;
  not_found_search_btn_en: string;
  error_title_ar: string;
  error_title_en: string;
  error_desc_ar: string;
  error_desc_en: string;
  error_retry_btn_ar: string;
  error_retry_btn_en: string;
  error_home_btn_ar: string;
  error_home_btn_en: string;
  is_visible: boolean;
}
```
