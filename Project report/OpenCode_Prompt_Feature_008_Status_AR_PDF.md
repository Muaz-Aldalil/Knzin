# OpenCode Delegation Brief: تقرير حالة الميزة 008 باللغة العربية (KNZiN Feature 008 Status PDF - Arabic)

<task>
Generate the official executive Arabic PDF report for Feature 008 (Admin Panel & Operational Governance) in `Project report/`.

Deliverables:
1. `KNZiN_Feature_008_Status_Report_AR.html`: Complete, self-contained HTML file styled with `/muaz-skill` design DNA (clean RTL layout, executive badge styling, compact professional typography, and strict 2-page print layout).
2. `KNZiN_Feature_008_Status_Report_AR.pdf`: The compiled 2-page executive Arabic PDF report generated via headless Chrome.
3. Automatically copy the generated PDF to `C:\Users\HP\Downloads\KNZiN_Feature_008_Status_Report_AR.pdf`.
</task>

<source_of_truth>
The source file is `Project report/KNZiN_Feature_008_Status_Report_AR.md`.
Every single number, metric, and verification result must be rendered with 100% factual accuracy:
- 147 tasks completed and verified (`T001` through `T147`)
- 250 backend tests passing across 60 suites (6,471 assertions)
- 21 Feature 008 test classes (35 admin tests)
- 128 frontend unit tests passing across 38 suites
- 71/71 routes generated in Next.js production build (53s compile, 0 TypeScript errors)
- 6 isolated admin capabilities: `manage_admin_capabilities`, `manage_platform_settings`, `adjudicate_affiliate_coprize`, `issue_kyc_approval`, `issue_draw_audit_approval`, `settle_affiliate_payout`
- 5 new migrations applied to `knzin_test`
</source_of_truth>

<page_budget>
- Maximum page count: strictly 2 pages (no third page overflow).
- Page 1:
  - Header: Brand title (منصة كَنزين · KNZiN), metadata (Feature 008, Date, Author, Version).
  - Dual Status Badges:
    - حالة التنفيذ البرمجي: مكتمل ومتحقق ومطابق 100% (IMPLEMENTATION: READY & CONVERGED) - Emerald badge (#ecfdf5, #047857)
    - حالة بيئة الإنتاج: جاهز للربط ببوابات الدفع (OPERATIONAL: READY FOR 007) - Blue/Slate badge (#eff6ff, #1d4ed8)
  - 1. الملخص التنفيذي (Executive Summary)
  - 2. نطاق العمل المنجز المعتمد (Delivered Scope - 9 core modules)
  - 3. جدول نتائج التحقق والاختبار (Verification Results Table)
  - Footer: صفحة 1 من 2
- Page 2:
  - Header Bar (KNZiN Brand & Report Title)
  - 4. مصفوفة الصلاحيات والحوكمة الأمنية والمالية (Capabilities & Financial Integrity)
  - 5. دورة السحوبات العشوائية وسجل التدقيق الجنائي (RNG Draws & Immutable Audit Logs)
  - 6. حدود الميزة والواجهات البينية (Clean Boundaries: Features 004, 005, 006, 007)
  - 7. الحالة النهائية والاعتماد وخارطة الطريق (Final Sign-off & Roadmap to Feature 007)
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

<action_safety>
- Do NOT run git add or git commit. Keep changes in working tree.
- Run headless Chrome at `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe` (or `C:\Program Files\Google\Chrome\Application\chrome.exe`).
- Count and verify PDF pages using binary regex `rb'/Type\s*/Page(?![a-zA-Z])'` to ensure exactly 2 pages.
</action_safety>
