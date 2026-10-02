# OpenCode Delegation Brief: تقرير حالة الميزة 005 باللغة العربية (KNZiN Feature 005 Status PDF - Arabic)

<task>
Convert the Feature 005 Status Report (`KNZiN_Feature_005_Status_Report.md`) into a professional, minimal, executive-ready Arabic version suitable for leadership and project stakeholders.

Generate two synchronized deliverables in `Project report/`:
1. `KNZiN_Feature_005_Status_Report_AR.md`: The official Arabic Markdown status report.
2. `KNZiN_Feature_005_Status_Report_AR.pdf`: A clean, minimal, executive 2-page Arabic PDF report (strictly maximum 3 pages) styled according to `/muaz-skill` design principles (RTL layout, clean typography, executive badges, and structured data tables).
</task>

<source_of_truth>
The source file is `Project report/KNZiN_Feature_005_Status_Report.md`.
Every single number, metric, status distinction, security control, and operational prerequisite must be preserved with 100% factual accuracy.
Do not invent or omit metrics. Do not use forbidden marketing buzzwords ("enterprise-grade", "unbypassable", "unforgeable", "zero risk", "100% secure").
</source_of_truth>

<page_budget>
- Maximum page count: strictly <= 3 pages.
- Preferred page budget: exactly 2 pages.
- Page 1: Header, Metadata, Dual Status Badges, Executive Summary, Delivered Scope, Verification Results Table.
- Page 2: Security & Reliability Controls, Production Release Prerequisites (1-7), Verification Boundaries, Review State, Final Sign-off.
</page_budget>

<rtl_styling_rules>
- Language: Arabic (`dir="rtl"`, `lang="ar"`).
- Font family: Clean modern sans-serif suitable for Arabic (Cairo, Tahoma, Arial, system-ui).
- Status Badges:
  - حالة التنفيذ: **جاهز للتطبيق** (IMPLEMENTATION: READY) - Green badge (`#ecfdf5`, `#047857`)
  - حالة الإنتاج: **المتطلبات التشغيلية معلقة** (PRODUCTION: OPERATIONAL PREREQUISITES PENDING) - Amber badge (`#fffbeb`, `#b45309`)
- Table: Right-to-left alignment, crisp borders (`#e2e8f0`), compact padding (3.5px-6px).
</rtl_styling_rules>

<action_safety>
- Do NOT run git add or git commit. Keep all changes in the working tree.
- Keep `KNZiN_Feature_005_Status_Report.md` and `KNZiN_Feature_005_Status_Report.pdf` untouched.
- Only generate `KNZiN_Feature_005_Status_Report_AR.md`, `KNZiN_Feature_005_Status_Report_AR.html`, and `KNZiN_Feature_005_Status_Report_AR.pdf`.
</action_safety>

<structured_output_contract>
End with a concise report:
1. Deliverables created (`.md`, `.html`, `.pdf`).
2. Page count of the generated PDF (must be <= 3, verified via local inspection).
3. Confirmation that all numbers (85 backend, 22 files/classes, 63 frontend, 47 static pages, 24 security scenarios) are preserved.
</structured_output_contract>
