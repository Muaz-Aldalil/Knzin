# Data Model: Feature 004 — Front-of-House Trust, Engagement & Social Proof Suite

**Feature**: Front-of-House Trust, Engagement & Social Proof Suite  
**Branch**: `004-front-of-house-trust-engagement`  
**Status**: Ready  
**Date**: 2026-09-30  

---

## 1. Architectural Principles

1. **Zero Database Migrations**: Feature 004 does not alter the database schema or add tables. It queries existing tables (`orders`, `order_items`, `courses`, `course_parts`, `draws`, `prizes`) established in Features 001–003.
2. **Server-Authoritative Non-PII Transformation**: The `ActivityEvent` DTO is strictly constructed server-side. No customer email, name, phone, payment details, or internal database UUIDs are ever serialized.
3. **Immutability & Cacheability**: Activity events and static informational entities are read-only. Responses are cache-friendly with short TTL (e.g. 15–30s) or light database indexing on `orders.status` and `orders.created_at`.

---

## 2. Entities & Data Shapes

### 2.1 Public Activity Event (`ActivityEvent`)

Represents a single announcement, verified completed course enrollment, or draw countdown alarm displayed in the rotating Activity Ticker.

| Field | Type | Nullable | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `string` | No | Masked deterministic event identifier | `"evt_ord_9f8b2c1d3e4a"` |
| `type` | `enum` | No | Event classification: `'enrollment'`, `'countdown_alert'`, `'bulletin'` | `"enrollment"` |
| `text_ar` | `string` | No | Pre-formatted localized Arabic announcement | `"انضمام متعلم جديد إلى كورس غسل السيارات — تم منح تذكرة مجانية!"` |
| `text_en` | `string` | No | Pre-formatted localized English announcement | `"New learner enrolled in Car Detailing — Free promotional ticket granted!"` |
| `highlight_label_ar` | `string` | No | Category badge in Arabic | `"تسجيل جديد"` |
| `highlight_label_en` | `string` | No | Category badge in English | `"New Enrollment"` |
| `timestamp` | `string` | No | ISO 8601 UTC timestamp of the underlying event | `"2026-09-30T02:45:00Z"` |

#### Validation & Invariants
- `type === 'enrollment'`:
  - Must originate from `orders.status === 'completed'`.
  - Must contain zero personal customer identifiers (no first/last names, no governorates, no emails).
  - Must specify the course name and promotional tickets count.
- `type === 'countdown_alert'`:
  - Must originate from `draws.status === 'scheduled'` with `scheduled_at > NOW()`.
- `type === 'bulletin'`:
  - Curated platform milestones and legal transparency facts.
  - Used during low-volume/quiet periods to maintain ticker layout and activity without fabricating orders.

---

### 2.2 Public Activity API Envelope (`ActivityFeedResponse`)

Standard JSend-compliant envelope returned by `GET /api/v1/activity/recent`.

```typescript
export interface ActivityFeedResponse {
  status: 'success';
  data: {
    events: ActivityEvent[];
    meta: {
      total: number;
      has_live_orders: boolean;
      polled_at: string; // ISO 8601 UTC
    };
  };
}
```

---

### 2.3 "How It Works" Onboarding Step (`HowItWorksStep`)

Represents one of the 3 canonical onboarding steps presented in the Header HUD interactive modal dialog.

| Field | Type | Description |
| :--- | :--- | :--- |
| `step_number` | `1 \| 2 \| 3` | Sequential step number (1-indexed). |
| `title_ar` | `string` | Step headline in Arabic. |
| `title_en` | `string` | Step headline in English. |
| `description_ar` | `string` | Detailed step explanation in Arabic. |
| `description_en` | `string` | Detailed step explanation in English. |
| `icon_name` | `string` | Lucide icon identifier (`'BookOpen'`, `'Ticket'`, `'Trophy'`). |
| `badge_text_ar` | `string` | Visual price or reward tag (e.g. `"$2 أو $10"`). |
| `badge_text_en` | `string` | Visual price or reward tag (e.g. `"$2 or $10"`). |

#### The 3 Canonical Steps
1. **Step 1: اختر الكورس والمهارة (Choose Course & Skill)**
   - Icon: `BookOpen`
   - Description AR: *اختر جزءاً مهنياً عملياً بقيمة 2$ (2,000 د.ع) أو اشترك في الباقة الكاملة المكونة من 6 أجزاء بقيمة 10$ (13,000 د.ع).*
   - Description EN: *Select a vocational skill part for $2 (2,000 IQD) or enroll in the complete 6-part bundle for $10 (13,000 IQD).*
2. **Step 2: استلم تذكرتك المجانية (Receive Free Promotional Tickets)**
   - Icon: `Ticket`
   - Description AR: *تحصل فورياً ومجاناً على تذكرة سحب ترويجية واحدة مع كل جزء، أو 15 تذكرة مجانية كاملة مع باقة الدورة الشاملة.*
   - Description EN: *Instantly receive 1 free promotional raffle ticket with each part, or 15 free promotional tickets with the complete bundle.*
3. **Step 3: تابع السحب المباشر (Watch Transparent Live Draw)**
   - Icon: `Trophy`
   - Description AR: *تأهل تلقائياً لسحوبات نقدية فورية وسحب الجائزة الكبرى العلني المبثوث مباشرة على يوتيوب بنزاهة رقمية معلنة.*
   - Description EN: *Automatically qualify for instant cash prizes and the Grand Prize draw broadcast publicly on YouTube Live with provable fairness.*

---

### 2.4 FAQ Item & Category (`FaqItem`, `FaqCategory`)

Represents categorized objection-handling entries rendered by the public accordion on the homepage and legal views.

```typescript
export interface FaqItem {
  id: string; // e.g. 'faq-model-1'
  question_ar: string;
  question_en: string;
  answer_ar: string;
  answer_en: string;
}

export interface FaqCategory {
  id: string; // e.g. 'model', 'downloads', 'draws', 'referral', 'kyc'
  title_ar: string;
  title_en: string;
  icon_name: string;
  items: FaqItem[];
}
```

#### Category Breakdown
1. **`model` — آلية المنصة والتذاكر الترويجية (Platform Model & Free Tickets)**:
   - Covers: Why tickets are free gifts, why direct ticket purchases are prohibited, how education forms 100% of the commercial transaction.
2. **`downloads` — الوصول للمواد التعليمية والتحميل (Digital Course Access)**:
   - Covers: Immediate access after checkout, video streaming, downloadable practical PDFs, lifetime access.
3. **`draws` — نزاهة السحوبات والبث المباشر (Draw Transparency & YouTube Live)**:
   - Covers: Provably fair seed hashes, YouTube Live public broadcasts, winner notification via email/WhatsApp.
4. **`referral` — نظام الإحالة والشريك 40% (Referral Co-Prize Model)**:
   - Covers: How inviting friends earns 40% of the Grand Prize if their ticket wins, influencer transparency (informational only; no code implementation).
5. **`kyc` — شروط تسليم الجوائز والتحقق (Winner Verification & KYC Claims)**:
   - Covers: Mandatory National ID (بطاقة وطنية) matching purchase email before major prize disbursement, anti-fraud rules.

---

### 2.5 Winner KYC Disclaimer Entity (`WinnerKycDisclaimer`)

Informational legal compliance definition rendered on `/raffle` and embedded inside the FAQ Prize Claims category.

```typescript
export interface WinnerKycDisclaimer {
  canonical_ar: string;
  canonical_en: string;
  law_citation_ar: string;
  law_citation_en: string;
  claim_threshold_cents: number; // 10000 ($100.00)
}
```

#### Verbatim Canonical Content
- **Arabic**:  
  *«شرط تسليم الجوائز: يُلزم الفائز بتقديم إثبات هوية رسمي يطابق البيانات الأساسية (مثل البريد الإلكتروني) التي تم الشراء بها، وللإدارة الحق في حجب الجائزة في حال ثبوت تلاعب أو استخدام بطاقات دفع مسروقة.»*
- **English**:  
  *«Prize Delivery Requirement: The winner is strictly required to present official national identification matching the primary contact details (such as the verified email) used during checkout. Platform administration reserves the legal right to withhold prizes if fraudulent activity or stolen payment methods are established.»*
- **Citation**:  
  *قانون حماية المستهلك العراقي رقم (1) لسنة 2010 والتعليمات التجارية النافذة.*
