# OpenCode Delegation Brief: تقرير حالة وإنجاز الميزة 008 باللغة العربية (KNZiN Feature 008 Status PDF - Arabic)

<task>
Generate the official executive Arabic HTML and PDF report for Feature 008 (Admin Panel, Operational Governance, Course Management & Landing CMS) in `Project report/`.

Deliverables:
1. `Project report/KNZiN_Feature_008_Status_Report_AR.html`: Complete, self-contained HTML file styled with clean RTL layout, executive badge styling, compact professional typography, and strict 2-page print layout.
2. `Project report/KNZiN_Feature_008_Status_Report_AR.pdf`: The compiled 2-page executive Arabic PDF report generated via headless Chrome.
3. Automatically copy the generated PDF to `C:\Users\HP\Downloads\KNZiN_Feature_008_Status_Report_AR.pdf`.
4. Verification: Run python script `Project report/generate_arabic_pdf_008.py` (or execute headless Chrome) and verify that the resulting PDF contains EXACTLY 2 pages (zero 3rd page overflow).
</task>

<source_of_truth>
The authoritative source markdown file is `Project report/KNZiN_Feature_008_Status_Report_AR.md`.
Every single metric, capability, and verification result must be rendered with 100% factual accuracy:
- 147 tasks completed and verified (`T001` through `T147`)
- 16 Admin Controllers (Auth, Capabilities, Settings, Affiliates, Payouts, Co-Prize, KYC, Draws, Draw Audits, Activity Logs, Promotional Awards, Audit Reconciliation, Courses, Course Parts, Landing CMS, and Profile)
- 34 protected Admin API routes
- 250 backend tests passing across 60 suites (6,471 assertions)
- 21 Feature 008 test classes (35 admin tests)
- 128 frontend unit tests passing across 38 suites
- 71/71 routes generated in Next.js production build (53s compile, 0 TypeScript errors)
- 6 isolated admin capabilities: `manage_admin_capabilities`, `manage_platform_settings`, `adjudicate_affiliate_coprize`, `issue_kyc_approval`, `issue_draw_audit_approval`, `settle_affiliate_payout`
- 5 new migrations applied to `knzin_test`
- Status: Fully accepted by manual testing, merged into `main` (commit `471fcee`), and ready for Feature 007 / 009.
</source_of_truth>

<page_budget>
- Maximum page count: strictly 2 pages (no third page overflow).
- Page 1:
  - Header: Brand title (منصة كَنزين · KNZiN), metadata (الميزة 008, التاريخ, الفرع main, النسخة v1.0).
  - Status Badges:
    - حالة التنفيذ والدمج: مكتمل ومتحقق ومدمج في main بنجاح (IMPLEMENTATION: READY & MERGED) - Emerald badge (#ecfdf5, #047857)
    - حالة الفحص والاعتماد: تم الفحص اليدوي المباشر بنجاح تام (MANUAL ACCEPTANCE: PASSED) - Amber/Gold badge (#fffbeb, #b45309)
    - حالة الإنتاج: جاهز للربط ببوابات الدفع 007 والإشعارات 009 - Blue badge (#eff6ff, #1d4ed8)
  - 1. الملخص التنفيذي (Executive Summary)
  - 2. نطاق العمل المنجز المعتمد (Delivered Scope - 11 محاور رئيسية شاملة الدورات والـ CMS)
  - 3. جدول نتائج التحقق والاختبار والفحص اليدوي (Verification & Manual Acceptance Table)
  - Footer: صفحة 1 من 2
- Page 2:
  - Header Bar (KNZiN Brand & Report Title)
  - 4. مصفوفة الصلاحيات والحوكمة الأمنية والمالية (Capabilities & Financial Integrity)
  - 5. دورة السحوبات العشوائية وسجل التدقيق الجنائي (RNG Draws & Immutable Audit Logs)
  - 6. حدود الميزة والواجهات البينية وخارطة الطريق (Clean Boundaries & Roadmap to 009 & 007)
  - 7. الاعتماد النهائي وحالة الفرع (Final Sign-off & Commit 471fcee on main)
  - Footer: صفحة 2 من 2
</page_budget>

<rtl_styling_rules>
- Language: Arabic (`dir="rtl"`, `lang="ar"`).
- Font family: "Segoe UI", Tahoma, Arial, sans-serif.
- Clean compact print styling (`@page { size: A4 portrait; margin: 8mm 10mm 8mm 10mm; }`).
- Heights: `.page { min-height: 280mm; max-height: 280mm; }`.
- Colors: Deep slate `#0f172a`, Emerald `#047857` / `#ecfdf5`, Blue `#1d4ed8` / `#eff6ff`, Slate borders `#e2e8f0`.
- Tables: Compact right-to-left cells with explicit borders and alternating row shading.
</rtl_styling_rules>

<action_instructions>
1. Update `Project report/KNZiN_Feature_008_Status_Report_AR.html` or update and run `Project report/generate_arabic_pdf_008.py`.
2. Compile the PDF using headless Google Chrome (`chrome.exe --headless --disable-gpu --run-all-compositor-stages-before-draw --no-pdf-header-footer --print-to-pdf=...`).
3. Verify that the generated PDF contains exactly 2 pages.
4. Copy the generated PDF to `C:\Users\HP\Downloads\KNZiN_Feature_008_Status_Report_AR.pdf`.
5. Do NOT commit or push to Git.
</action_instructions>
