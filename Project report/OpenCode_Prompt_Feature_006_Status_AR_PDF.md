# OpenCode Delegation Brief: تقرير حالة الميزة 006 باللغة العربية (KNZiN Feature 006 Status PDF - Arabic)

<task>
Generate the official executive Arabic PDF report for Feature 006 (Affiliate & Referral Engine) in `Project report/`.

Deliverables:
1. `KNZiN_Feature_006_Status_Report_AR.html`: Complete, self-contained HTML file styled with `/muaz-skill` design DNA (clean RTL layout, executive badge styling, compact professional typography, and strict 2-page print layout).
2. `KNZiN_Feature_006_Status_Report_AR.pdf`: The compiled 2-page executive Arabic PDF report generated via headless Chrome.
3. Automatically copy the generated PDF to `C:\Users\HP\Downloads\KNZiN_Feature_006_Status_Report_AR.pdf`.
</task>

<source_of_truth>
The source file is `Project report/KNZiN_Feature_006_Status_Report_AR.md`.
Every single number, metric, commit hash (`c0042c5`), branch (`006-affiliate-engine`), and verification result (81 affiliate tests, 14 referral tests, 6 account merge tests, 227 assertions, 0 TypeScript errors) must be rendered with 100% factual accuracy.
</source_of_truth>

<page_budget>
- Maximum page count: strictly 2 pages (no third page overflow).
- Page 1:
  - Header: Brand title (منصة كَنزين · KNZiN), metadata (Branch, Commit, Date, Author).
  - Dual Status Badges:
    - حالة التنفيذ البرمجي: جاهز للتطبيق ومكتمل ومجمد (IMPLEMENTATION: READY & FROZEN) - Green badge (#ecfdf5, #047857)
    - حالة الإنتاج: بانتظار تكامل الدفع والسحوبات (DEPENDS ON 007 & 008) - Amber badge (#fffbeb, #b45309)
  - 1. الملخص التنفيذي (Executive Summary)
  - 2. نطاق العمل المنجز المعتمد (Delivered Scope - 10 core deliverables)
  - 3. جدول نتائج التحقق والاختبار (Verification Results Table)
  - Footer: صفحة 1 من 2
- Page 2:
  - Header Bar (KNZiN Brand & Report Title)
  - 4. الضوابط المالية والأمنية الصارمة (Financial & Security Integrity Controls)
  - 5. استمرارية دمج الحسابات ونظام الهويات (Account Merge & Dev Experience)
  - 6. حدود الميزة والواجهات البينية (Clean Boundaries: Feature 007 & 008)
  - 7. متطلبات الإطلاق في بيئة الإنتاج (Production Prerequisites)
  - 8. الحالة النهائية والاعتماد وخارطة الطريق (Final Sign-off & Roadmap)
  - Footer: صفحة 2 من 2
</page_budget>

<rtl_styling_rules>
- Language: Arabic (`dir="rtl"`, `lang="ar"`).
- Font family: "Segoe UI", Tahoma, Arial, sans-serif.
- Clean compact print styling (`@page { size: A4 portrait; margin: 10mm 12mm; }`).
- Colors: Deep slate `#0f172a`, Emerald `#047857` / `#ecfdf5`, Amber `#b45309` / `#fffbeb`, Slate borders `#e2e8f0`.
- Tables: Compact right-to-left cells with explicit borders and alternating row shading.
</rtl_styling_rules>

<action_safety>
- Do NOT run git add or git commit. Keep changes in working tree.
- Run headless Chrome at `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`.
- Count and verify PDF pages using binary regex `rb'/Type\s*/Page(?![a-zA-Z])'` to ensure exactly 2 pages.
</action_safety>
