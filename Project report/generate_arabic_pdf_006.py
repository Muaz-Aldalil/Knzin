import os
import subprocess
import re
import shutil

html_content = """<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>تقرير حالة الميزة 006 - منصة كَنزين</title>
<style>
  @page {
    size: A4 portrait;
    margin: 8mm 10mm 8mm 10mm;
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    font-family: "Segoe UI", Tahoma, Arial, sans-serif;
    color: #0f172a;
    background: #ffffff;
    font-size: 8pt;
    line-height: 1.35;
    direction: rtl;
    text-align: right;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    width: 100%;
    min-height: 280mm;
    max-height: 280mm;
    position: relative;
    page-break-after: always;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .page:last-child {
    page-break-after: avoid;
  }
  .page-content {
    flex: 1;
  }
  .header-bar {
    border-bottom: 2px solid #0f172a;
    padding-bottom: 4px;
    margin-bottom: 6px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .brand-title {
    font-size: 14pt;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.01em;
  }
  .brand-sub {
    font-size: 8pt;
    color: #64748b;
    font-weight: 600;
  }
  .doc-meta {
    font-size: 7.5pt;
    color: #475569;
    text-align: left;
    direction: ltr;
    line-height: 1.3;
  }
  .report-title-box {
    margin-bottom: 6px;
  }
  .report-title {
    font-size: 11pt;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 4px;
  }
  .badges-container {
    display: flex;
    gap: 8px;
    margin-bottom: 6px;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 7.5pt;
    font-weight: 700;
  }
  .badge-ready {
    background-color: #ecfdf5;
    color: #047857;
    border: 1px solid #a7f3d0;
  }
  .badge-pending {
    background-color: #fffbeb;
    color: #b45309;
    border: 1px solid #fde68a;
  }
  .section-title {
    font-size: 9pt;
    font-weight: 800;
    color: #0f172a;
    border-bottom: 1px solid #cbd5e1;
    padding-bottom: 2px;
    margin-top: 6px;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
  }
  .section-title::before {
    content: "■";
    font-size: 7pt;
    color: #0284c7;
    margin-left: 5px;
  }
  .executive-box {
    background-color: #f8fafc;
    border-right: 3px solid #0284c7;
    padding: 5px 8px;
    font-size: 7.8pt;
    line-height: 1.35;
    color: #334155;
    margin-bottom: 6px;
    border-radius: 0 4px 4px 0;
  }
  .delivered-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px 8px;
    margin-bottom: 6px;
  }
  .delivered-item {
    font-size: 7.4pt;
    line-height: 1.3;
    color: #1e293b;
    background: #fdfdfd;
    border: 1px solid #f1f5f9;
    padding: 3px 5px;
    border-radius: 3px;
  }
  .delivered-item strong {
    color: #0f172a;
    font-weight: 700;
  }
  table.data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 7.2pt;
    margin-bottom: 4px;
    direction: rtl;
  }
  table.data-table th, table.data-table td {
    border: 1px solid #e2e8f0;
    padding: 3px 5px;
    text-align: right;
  }
  table.data-table th {
    background-color: #f1f5f9;
    color: #0f172a;
    font-weight: 700;
  }
  table.data-table tr:nth-child(even) td {
    background-color: #f8fafc;
  }
  .status-pass {
    color: #047857;
    font-weight: 700;
  }
  .bullet-list {
    list-style: none;
    margin-bottom: 4px;
  }
  .bullet-list li {
    position: relative;
    padding-right: 11px;
    margin-bottom: 3.5px;
    font-size: 7.4pt;
    line-height: 1.35;
    color: #1e293b;
  }
  .bullet-list li::before {
    content: "•";
    position: absolute;
    right: 0;
    color: #0284c7;
    font-weight: bold;
    font-size: 9pt;
    line-height: 1;
  }
  .bullet-list li strong {
    color: #0f172a;
  }
  .info-box {
    background-color: #f0fdf4;
    border-right: 3px solid #16a34a;
    padding: 5px 8px;
    font-size: 7.5pt;
    line-height: 1.35;
    color: #14532d;
    margin-top: 5px;
    margin-bottom: 4px;
    border-radius: 0 4px 4px 0;
  }
  .footer-bar {
    border-top: 1px solid #e2e8f0;
    padding-top: 4px;
    margin-top: 4px;
    display: flex;
    justify-content: space-between;
    font-size: 7pt;
    color: #94a3b8;
  }
  .footer-left {
    direction: ltr;
    text-align: left;
  }
  .footer-right {
    direction: rtl;
    text-align: right;
  }
</style>
</head>
<body>

<!-- PAGE 1 -->
<div class="page">
  <div class="page-content">
    <div class="header-bar">
      <div>
        <div class="brand-title">منصة كَنزين · KNZiN</div>
        <div class="brand-sub">تقرير حالة الإنجاز الفني والاعتماد المعماري للمشروع</div>
      </div>
      <div class="doc-meta">
        <div><strong>Branch:</strong> 006-affiliate-engine</div>
        <div><strong>Commit:</strong> c0042c5 (Frozen & Pushed)</div>
        <div><strong>Date:</strong> October 2, 2026</div>
      </div>
    </div>

    <div class="report-title-box">
      <div class="report-title">الميزة 006: منظومة التسويق بالعمولة وسجل الإحالات والشريك الذكي (Affiliate & Referral Engine)</div>
      <div class="badges-container">
        <div class="badge badge-ready">حالة التنفيذ البرمجي: مكتمل ومجمد ومحقق بالكامل (READY & FROZEN)</div>
        <div class="badge badge-pending">حالة إطلاق الإنتاج: بانتظار بوابات الدفع الإلكتروني ومحرك السحوبات (DEPENDS ON 007 & 008)</div>
      </div>
    </div>

    <div class="section-title">1. الملخص التنفيذي للميزة</div>
    <div class="executive-box">
      أكملت <strong>الميزة 006</strong> كافة مراحل التصميم المعماري والتنفيذ البرمجي والتحقق المالي المتشدد. تؤسس هذه الميزة للنمو التجاري الفيروسي لمنصة كَنزين عبر <strong>نموذج المنفعة المزدوجة</strong>: حفظ كامل حقوق المشتري المحال بنسبة 100% دون أي اقتطاع أو زيادة سعر، مع منح المسوق عمولة مبيعات مباشرة بنسبة 25% تسجل في دفتر أستاذ مالي غير قابل للتعديل، ومكافأة فوز كبرى بنسبة 40% (حصة الشريك الذكي) ممولة بالكامل من صندوق المنصة التسويقي.
    </div>

    <div class="section-title">2. نطاق العمل المنجز المعتمد (Delivered Scope)</div>
    <div class="delivered-grid">
      <div class="delivered-item"><strong>1. حفظ حقوق المشتري 100%:</strong> عدم اقتطاع أي تذكرة أو زيادة السعر ($2 جزء = 1 تذكرة، $10 حزمة = 15 تذكرة).</div>
      <div class="delivered-item"><strong>2. عمولة مبيعات مباشرة 25%:</strong> احتساب خادمي دقيق مع فترة حجز أمان مدتها 24 ساعة لضمان استقرار المعاملات.</div>
      <div class="delivered-item"><strong>3. دفتر أستاذ مالي تراكمي:</strong> جدول <code>affiliate_ledger_entries</code> محمي برمجياً وقاعدياً ضد أي تعديل أو حذف.</div>
      <div class="delivered-item"><strong>4. حصة الشريك 40% (Option C):</strong> حجز العمولة كمعلقة والإفراج عنها حصرياً بعد اعتماد KYC وتدقيق السحب من الإدارة.</div>
      <div class="delivered-item"><strong>5. بوابة الشركاء التفاعلية:</strong> لوحة تحكم كاملة تدعم العربية والإنجليزية (KPIs، مولد الروابط، وسجل الحركات).</div>
      <div class="delivered-item"><strong>6. دورة سحب الأرباح المرنة:</strong> مطابقة طلبات السحب مع الحد الأدنى النشط وتجميده تاريخياً في سجل المعاملة.</div>
      <div class="delivered-item"><strong>7. درع مكافحة الاحتيال والإحالة الذاتية:</strong> منع الشراء عبر الرابط الشخصي على 3 مستويات أمنية متكاملة.</div>
      <div class="delivered-item"><strong>8. استمرارية دمج الحسابات:</strong> نقل آمن للعمولات والتذاكر من حساب الزائر إلى Google مع حفظ كود المتدرب.</div>
      <div class="delivered-item"><strong>9. التسوية اللحظية للأرصدة:</strong> تحديث تلقائي للعمولات المكتملة للأرصدة المتاحة فور قراءة لوحة التحكم.</div>
      <div class="delivered-item"><strong>10. أداة بذر البيانات المعيارية:</strong> أمر <code>knzin:seed-affiliates</code> لتوفير سيناريوهات اختبار حتمية ومباشرة.</div>
    </div>

    <div class="section-title">3. جدول نتائج التحقق والاختبار البرمجي (Verification Results)</div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 28%;">مجال التحقق الفني</th>
          <th style="width: 50%;">النتيجة العددية والتفصيلية الموثقة</th>
          <th style="width: 22%;">الحالة والاعتماد</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>حزمة التسويق بالعمولة (Affiliate)</strong></td>
          <td><strong>61 اختباراً ناجحاً، 0 فاشل، 227 توكيداً</strong> (مدة التشغيل: 25.45 ثانية)</td>
          <td class="status-pass">ناجح تام (PASS)</td>
        </tr>
        <tr>
          <td><strong>حزمة نظام الإحالة (Referral)</strong></td>
          <td><strong>14 اختباراً ناجحاً، 0 فاشل، 39 توكيداً</strong> (تغطي حفظ التذاكر وعزل الطلبات)</td>
          <td class="status-pass">ناجح تام (PASS)</td>
        </tr>
        <tr>
          <td><strong>استمرارية دمج الحسابات (Account Merge)</strong></td>
          <td><strong>6 اختبارات ناجحة، 0 فاشل، 41 توكيداً</strong> (نقل الأستاذ، الملف، والرموز)</td>
          <td class="status-pass">ناجح تام (PASS)</td>
        </tr>
        <tr>
          <td><strong>فحص أنماط الواجهة (TypeScript)</strong></td>
          <td><strong>0 أخطاء برمجية</strong> عبر فحص <code>npx tsc --noEmit</code>، توافق RTL كامل</td>
          <td class="status-pass">ناجح تام (PASS)</td>
        </tr>
        <tr>
          <td><strong>قاعدة البيانات والترحيلات</strong></td>
          <td><strong>5 ترحيلات جديدة</strong> (إعدادات، ملفات، سحوبات، إحالات، أستاذ مالي)</td>
          <td class="status-pass">مؤكد ومطابق</td>
        </tr>
        <tr>
          <td><strong>الاستجابة الحية لنقاط الخادم (API)</strong></td>
          <td>استجابة فورية عبر MariaDB بنجاح: رصيد متاح $2.50، ورصيد معلق $0.50</td>
          <td class="status-pass">مؤكد ومحقق ميدانياً</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="footer-bar">
    <div class="footer-left">KNZiN Platform · Feature 006 Technical Report · Commit c0042c5</div>
    <div class="footer-right">صفحة 1 من 2</div>
  </div>
</div>

<!-- PAGE 2 -->
<div class="page">
  <div class="page-content">
    <div class="header-bar">
      <div>
        <div class="brand-title">منصة كَنزين · KNZiN</div>
        <div class="brand-sub">تقرير حالة الإنجاز الفني — الميزة 006 (الضوابط، التكامل، والاعتماد)</div>
      </div>
      <div class="doc-meta">
        <div><strong>Status:</strong> Implementation Closed & Verified</div>
        <div><strong>Environment:</strong> Local Dev & Integration Tested</div>
      </div>
    </div>

    <div class="section-title">4. الضوابط المالية والأمنية الصارمة (Financial & Security Integrity)</div>
    <ul class="bullet-list">
      <li><strong>عدم قابلية التعديل المالي (Financial Immutability):</strong> يحظر نموذج <code>AffiliateLedgerEntry</code> أي تعديل على مبالغ أو معرفات القيود، وتتم التسويات حصرياً بإضافة قيود تعويضية جديدة معاكسة (<code>reversal_debit</code> / <code>reversal_credit</code>).</li>
      <li><strong>العزل المالي المطلق وتجنب الاقتطاع:</strong> لا تُمول عمولات المسوقين أو جوائز الشريك من أموال المتدرب أو تذاكره، بل تُصرف بالكامل من ميزانية التسويق والتشغيل المعتمدة للمنصة دون المساس بحقوق المشتري.</li>
      <li><strong>الحماية ضد هجمات إعادة الإرسال (Replay Attacks):</strong> استخدام القفل المتزامن على مستوى السطر (<code>lockForUpdate</code>) وقيد الفرادة المركب <code>(order_id, entry_type)</code> يمنع تكرار قيد العمولة تحت أي ظرف من ظروف إعادة بث الويبهوك.</li>
      <li><strong>حماية الخصوصية والامتثال:</strong> تُخزن عناوين IP وسلاسل المتصفح في سجلات الإحالة على شكل تجزئات مشفرة ومملحة (Salted SHA-256 Hashes) لمنع تسريب بيانات المستخدمين الحساسة.</li>
    </ul>

    <div class="section-title">5. استمرارية دمج الحسابات وتجربة التطوير (Account Merge & Dev Experience)</div>
    <ul class="bullet-list">
      <li><strong>نقل متكامل لبيانات الشريك:</strong> عند تسجيل دخول الزائر عبر Google، تتولى خدمة <code>AccountMergeService</code> نقل كافة سجلات الإحالة للمشتري والمحيل، وطلبات السحب، ودفتر الأستاذ إلى الحساب المعتمد.</li>
      <li><strong>تخليد كود المتدرب (Learner Code Preservation):</strong> يضمن النظام نقل كود الإحالة الأصلي (مثل <code>LRN-AFFA01</code>) إلى حساب Google الناجي، مما يحافظ على صلاحية كافة الروابط التسويقية المنشورة مسبقاً.</li>
      <li><strong>شريط الشخصيات التطويرية (Dev Personas):</strong> إضافة شريط أدوات في بيئة التطوير المحلية بداخل <code>AffiliateDashboardView.tsx</code> يتيح الدخول الفوري بضغطة زر واحدة كمسوق أو كعميل لتسهيل الفحص المباشر.</li>
    </ul>

    <div class="section-title">6. حدود الميزة والواجهات البينية النظيفة (Clean Boundaries & Interfaces)</div>
    <ul class="bullet-list">
      <li><strong>الميزة 007 (بوابات الدفع الإلكتروني):</strong> تنتهي حدود الميزة 006 عند إنشاء طلب السحب والتحقق من الرصيد والحد الأدنى داخلياً؛ بينما تتولى الميزة 007 الربط المباشر مع مزودي الدفع (زين كاش، آسيا حوالة، QiCard).</li>
      <li><strong>الميزة 008 (محرك السحوبات والإدارة):</strong> وفرت الميزة 006 خدمة النطاق <code>AffiliateCoPrizeService::awardCoPrize</code>؛ بينما يختص محرك الميزة 008 بتوليد الأرقام العشوائية وتحديد التذاكر الفائزة وتدقيقها الجنائي.</li>
    </ul>

    <div class="section-title">7. متطلبات الإطلاق في بيئة الإنتاج الحية (Production Prerequisites)</div>
    <ul class="bullet-list">
      <li><strong>ترحيل قاعدة البيانات:</strong> تشغيل ترحيلات الميزة 006 الخمسة على قاعدة بيانات الإنتاج لإنشاء جداول الإعدادات، الملفات، السحوبات، والإحالات.</li>
      <li><strong>مجدول المهام التلقائي (Cron Scheduler):</strong> التأكد من تشغيل أمر <code>knzin:mature-commissions</code> كل ساعة لنقل العمولات المنتهية فترة حجزها آلياً.</li>
      <li><strong>تعيين الحد الأدنى النشط للسحب:</strong> ضبط القيمة الأولية للحد الأدنى لسحب الأرباح عبر جدول إعدادات المنصة (القيمة الافتراضية 5,000 سنت = $50.00).</li>
    </ul>

    <div class="section-title">8. الحالة النهائية والاعتماد وخارطة الطريق (Sign-off & Roadmap)</div>
    <div class="info-box">
      <strong>الاعتماد النهائي للميزة:</strong> تم إنجاز وتجميد الميزة 006 بنجاح تام، واجتياز 81+ اختباراً مؤتمتاً، وتحديث التوثيق، ودفع الكود إلى الفرع البعيد <code>origin/006-affiliate-engine</code> بالرمز <code>c0042c5</code>.<br>
      <strong>الخطوة المباشرة التالية:</strong> جاهزون للانتقال الفوري إلى <strong>الميزة 007 (بوابات الدفع الإلكتروني)</strong> أو <strong>الميزة 008 (محرك السحوبات ولوحة الإدارة)</strong>.
    </div>
  </div>

  <div class="footer-bar">
    <div class="footer-left">KNZiN Platform · Feature 006 Technical Report · Commit c0042c5</div>
    <div class="footer-right">صفحة 2 من 2</div>
  </div>
</div>

</body>
</html>
"""

base_dir = r"D:\Work Projects\Knzin Project\Project report"
html_path = os.path.join(base_dir, "KNZiN_Feature_006_Status_Report_AR.html")
pdf_path = os.path.join(base_dir, "KNZiN_Feature_006_Status_Report_AR.pdf")
downloads_pdf_path = r"C:\Users\HP\Downloads\KNZiN_Feature_006_Status_Report_AR.pdf"

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"HTML template written: {html_path}")

chrome_exe = r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
cmd = [
    chrome_exe,
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    f"--print-to-pdf={pdf_path}",
    html_path
]

print("Executing Chrome headless print-to-pdf...")
res = subprocess.run(cmd, capture_output=True, text=True)
print(f"Chrome exit code: {res.returncode}")

if os.path.exists(pdf_path):
    size = os.path.getsize(pdf_path)
    print(f"Generated PDF: {pdf_path} ({size} bytes)")
    
    # Copy to downloads folder
    try:
        shutil.copyfile(pdf_path, downloads_pdf_path)
        print(f"Copied to downloads: {downloads_pdf_path}")
    except Exception as e:
        print(f"Downloads copy warning: {e}")

    # Verify exact page count
    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()
    pages = re.findall(rb'/Type\s*/Page(?![a-zA-Z])', pdf_bytes)
    page_count = len(pages)
    print(f"PDF Page count: {page_count}")
    if page_count == 2:
        print("PERFECT: Exact 2-page budget satisfied with zero overflow!")
    else:
        print(f"WARNING: Page count is {page_count}, expected exactly 2 pages.")
else:
    print("ERROR: PDF was not generated!")
