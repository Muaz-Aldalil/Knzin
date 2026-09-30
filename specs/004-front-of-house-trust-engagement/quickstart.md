# Quickstart Validation Guide: Feature 004

**Feature**: Front-of-House Trust, Engagement & Social Proof Suite  
**Branch**: `004-front-of-house-trust-engagement`  
**Date**: 2026-09-30  

---

## 1. Prerequisites

1. **MySQL / MariaDB Service**:
   Running on port `3306` with database `knzin_db` populated with Feature 001–003 migrations.
2. **Laravel Backend API**:
   Running on `http://127.0.0.1:8000` via:
   ```bash
   cd backend && php artisan serve --port=8000
   ```
3. **Next.js Frontend Client**:
   Running on `http://localhost:3000` via:
   ```bash
   cd frontend && npm run dev
   ```

---

## 2. Deterministic Automated Test Execution

### 2.1 Backend API & Non-PII Privacy Invariant Tests
Execute the Laravel test suite to verify endpoint security, query integrity, zero-PII sanitization, and fallback behavior:
```bash
cd backend
php artisan test --filter=ActivityApiTest
```

**Expected Results**:
- `GET /api/v1/activity/recent` returns HTTP 200 with JSend success envelope.
- Completed orders are converted into non-PII enrollment events.
- Response contains zero `email`, `user_id`, `terms_agreed_ip`, or order UUIDs.
- When `orders` table has 0 completed records, endpoint returns verified active draw alarms and curated educational bulletins with `meta.has_live_orders: false`.

### 2.2 Frontend Deterministic Invariant Tests
Execute the frontend Node.js test runner:
```bash
cd frontend
npm test
```

**Expected Results**:
- All existing 32 tests pass.
- New test suite `TrustAndEngagementInvariants.test.ts` passes:
  - Verifies bilingual dictionary parity for all new copy across `messages/ar.json` and `messages/en.json`.
  - Verifies The Hook verbatim founder philosophy quote.
  - Verifies "How It Works" 3-step sequence, icons, and pricing rules.
  - Verifies WhatsApp fallback dialog trigger invariants and URL formatting.
  - Verifies Winner KYC National ID verbatim legal disclaimer matching.

---

## 3. End-to-End Manual & Browser Verification Scenarios

### Scenario 1: Onboarding "How It Works" 1-to-2 Click Verification
1. Navigate to `http://localhost:3000/ar`.
2. **Desktop (&ge;1024px)**:
   - Click the prominent button `«كيف تعمل كَنزين؟»` in the Header HUD navbar (1 click).
   - Verify modal opens instantly, focus is trapped inside the dialog, and all 3 sequential steps render cleanly with icons.
   - Press `Escape` &rarr; verify dialog dismisses and focus restores to the trigger button.
3. **Mobile (<1024px)**:
   - Click the `?` (HelpCircle) shortcut icon in the mobile top HUD (1 click) &rarr; verify dialog opens.
   - Close dialog, open mobile drawer (hamburger menu) &rarr; click `«كيف تعمل كَنزين؟»` (2 clicks) &rarr; verify dialog opens.

### Scenario 2: The Hook Narrative & Anchor Clearance Verification
1. Navigate to `http://localhost:3000/ar`.
2. Scroll below the Hero Grand Prize Countdown &rarr; verify `TheHookSection` is prominently displayed before the course grid.
3. Verify verbatim Arabic text:  
   *«نحن نؤمن بأن الشباب يحتاجون إلى المهارة ورأس المال معاً. لذلك، نحن نعلمك مهارات العمل الحر، ونمنحك فرصة لربح تمويل مشروعك في نفس الوقت.»*
4. Switch language to English via `LanguageToggle` (`/en`) &rarr; verify English translation renders with identical layout balance.
5. In browser address bar, navigate directly to `http://localhost:3000/ar#vision`:
   - Verify page scrolls smoothly to the Hook section.
   - Verify the top of the container maintains &ge;80px clearance below the sticky Header HUD (no text clipping).

### Scenario 3: Real-Time Activity Ticker & Pause Invariant
1. Observe the Activity Ticker mounted below the Header HUD on `http://localhost:3000/ar`.
2. Verify items stream continuously without causing cumulative layout shift (`CLS = 0.00`).
3. Hover mouse pointer over the ticker &rarr; verify animation pauses within 50ms.
4. Move mouse away &rarr; verify animation resumes smoothly.
5. Press `Tab` until ticker receives keyboard focus &rarr; verify animation pauses while focused.

### Scenario 4: Floating WhatsApp Support & Fallback Handling
1. Navigate to any public page (`/ar`, `/en`, `/raffle`).
2. Verify floating WhatsApp button is anchored at `bottom-6 end-6`:
   - In Arabic (`dir="rtl"`): Floats at bottom-left corner.
   - In English (`dir="ltr"`): Floats at bottom-right corner.
3. **With `NEXT_PUBLIC_WHATSAPP_SUPPORT_URL` set**:
   - Click button &rarr; opens WhatsApp Web / App in a new tab with pre-filled greeting.
4. **With `NEXT_PUBLIC_WHATSAPP_SUPPORT_URL` unset or empty**:
   - Click button &rarr; opens in-app fallback dialog explaining WhatsApp chat is offline.
   - Verify zero fabricated emails/phone numbers are shown.
   - Click *"الانتقال إلى الأسئلة الشائعة"* &rarr; dialog closes and page scrolls to `#faq`.

### Scenario 5: Public FAQ Accordion & WAI-ARIA Verification
1. Navigate to `http://localhost:3000/ar#faq`.
2. Verify the FAQ section loads with 5 structured categories.
3. Verify the first question in each category is expanded by default; subsequent questions are collapsed.
4. Test keyboard navigation:
   - Focus an accordion header using `Tab`.
   - Press `Enter` or `Space` &rarr; item collapses or expands smoothly (<250ms).
   - Press `ArrowDown` / `ArrowUp` &rarr; focus moves smoothly to adjacent accordion headers.

### Scenario 6: Winner KYC Legal Compliance Verification
1. Navigate to `http://localhost:3000/ar/raffle`.
2. Verify the Winner KYC Transparency card is prominently displayed.
3. Verify the verbatim legal text is rendered:
   *«شرط تسليم الجوائز: يُلزم الفائز بتقديم إثبات هوية رسمي يطابق البيانات الأساسية (مثل البريد الإلكتروني) التي تم الشراء بها، وللإدارة الحق في حجب الجائزة في حال ثبوت تلاعب أو استخدام بطاقات دفع مسروقة.»*
4. Verify that NO document upload forms, file inputs, or submit buttons appear anywhere on the card.
