import os
import subprocess
import re

html_content = """<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>تقرير حالة الميزة 005 - منصة كنزين</title>
<style>
  @page {
    size: A4 portrait;
    margin: 10mm 12mm 10mm 12mm;
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
    font-size: 8.5pt;
    line-height: 1.4;
    direction: rtl;
    text-align: right;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    width: 100%;
    min-height: 277mm;
    max-height: 277mm;
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
    padding-bottom: 6px;
    margin-bottom: 8px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .brand-title {
    font-size: 15pt;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.01em;
  }
  .brand-subtitle {
    font-size: 8.5pt;
    font-weight: 600;
    color: #475569;
    margin-top: 2px;
  }
  .doc-meta {
    text-align: left;
    font-size: 7.5pt;
    color: #64748b;
    line-height: 1.35;
    direction: ltr;
  }
  .status-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 8px;
  }
  .status-box {
    border-radius: 4px;
    padding: 6px 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .status-box.ready {
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
  }
  .status-box.pending {
    background: #fffbeb;
    border: 1px solid #fde68a;
  }
  .status-label {
    font-size: 7.5pt;
    font-weight: 700;
  }
  .ready .status-label { color: #047857; }
  .pending .status-label { color: #b45309; }
  .status-val {
    font-size: 9pt;
    font-weight: 800;
  }
  .ready .status-val { color: #065f46; }
  .pending .status-val { color: #92400e; }

  .section {
    margin-bottom: 8px;
  }
  .section-title {
    font-size: 9pt;
    font-weight: 700;
    color: #1e293b;
    border-bottom: 1px solid #cbd5e1;
    padding-bottom: 2px;
    margin-bottom: 5px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .lead-text {
    font-size: 8pt;
    color: #334155;
    line-height: 1.4;
    background: #f8fafc;
    border-right: 3px solid #64748b;
    padding: 5px 8px;
    border-radius: 4px 0 0 4px;
    margin-bottom: 8px;
  }

  .scope-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px 10px;
    margin-bottom: 8px;
  }
  .scope-item {
    font-size: 7.5pt;
    line-height: 1.35;
    display: flex;
    align-items: flex-start;
    color: #334155;
  }
  .scope-bullet {
    color: #2563eb;
    margin-left: 5px;
    font-weight: bold;
  }

  table.data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 7.5pt;
    margin-top: 2px;
  }
  table.data-table th, table.data-table td {
    padding: 3.5px 6px;
    border: 1px solid #e2e8f0;
    text-align: right;
  }
  table.data-table th {
    background: #f1f5f9;
    color: #1e293b;
    font-weight: 700;
    font-size: 7.5pt;
  }
  table.data-table tr:nth-child(even) td {
    background: #f8fafc;
  }
  table.data-table td.metric {
    font-weight: 700;
    color: #0f172a;
    white-space: nowrap;
  }
  .badge-pass {
    display: inline-block;
    padding: 1px 5px;
    background: #dcfce7;
    color: #166534;
    border-radius: 2px;
    font-size: 6.5pt;
    font-weight: 700;
  }
  .badge-boundary {
    display: inline-block;
    padding: 1px 5px;
    background: #f1f5f9;
    color: #475569;
    border-radius: 2px;
    font-size: 6.5pt;
    font-weight: 600;
  }

  .list-stack {
    display: flex;
    flex-direction: column;
    gap: 3.5px;
  }
  .list-row {
    display: flex;
    font-size: 7.5pt;
    line-height: 1.35;
    color: #334155;
  }
  .list-num {
    font-weight: 700;
    color: #0f172a;
    min-width: 16px;
  }
  .list-title {
    font-weight: 700;
    color: #1e293b;
    margin-left: 4px;
  }

  .highlight-box {
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    padding: 6px 8px;
    margin-bottom: 6px;
  }
  .highlight-title {
    font-size: 7.5pt;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 3px;
  }

  .footer-bar {
    border-top: 1px solid #cbd5e1;
    padding-top: 4px;
    font-size: 7pt;
    color: #94a3b8;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .footer-left {
    font-weight: 500;
  }
  .footer-right {
    font-weight: 600;
    color: #64748b;
  }
</style>
</head>
<body>

<!-- PAGE 1 -->
<div class="page">
  <div class="page-content">
    <div class="header-bar">
      <div>
        <div class="brand-title">تقرير حالة الميزة 005 - منصة كنزين</div>
        <div class="brand-subtitle">بوابة المتدرب / مكتبة الدورات / سجل التذاكر الترويجية</div>
      </div>
      <div class="doc-meta">
        <div><strong>Branch:</strong> <code>005-learner-hub</code></div>
        <div><strong>Date:</strong> 01 أكتوبر 2026</div>
        <div><strong>Audience:</strong> إدارة المشروع والاعتماد الفني</div>
      </div>
    </div>

    <div class="status-container">
      <div class="status-box ready">
        <span class="status-label">حالة التنفيذ البرمجي</span>
        <span class="status-val">جاهز للتطبيق (READY)</span>
      </div>
      <div class="status-box pending">
        <span class="status-label">حالة الإطلاق في الإنتاج</span>
        <span class="status-val">المتطلبات التشغيلية معلقة</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">الملخص التنفيذي</div>
      <div class="lead-text">
        أكملت الميزة 005 كافة مراحل التنفيذ البرمجي، والتحقق عبر بيئة التشغيل المحلية، والتدقيق الأمني، وسلامة ترحيل قاعدة البيانات من الصفر، والمطابقة النهائية. الكود البرمجي جاهز بالكامل للمراجعة والتحضير للإطلاق. لا تزال الموافقة على الإطلاق في بيئة الإنتاج الحية معلقة حصرياً لحين استكمال المتطلبات التشغيلية السبعة المحددة في الصفحة الثانية.
      </div>
    </div>

    <div class="section">
      <div class="section-title">نطاق العمل المُنجز (Delivered Scope)</div>
      <div class="scope-grid">
        <div class="scope-item"><span class="scope-bullet">■</span><div><strong>لوحة تحكم المتدرب:</strong> واجهة <code>/[locale]/dashboard</code> لعرض المنهج ونسبة إنجاز النطاق المملوك.</div></div>
        <div class="scope-item"><span class="scope-bullet">■</span><div><strong>استحقاقات موثوقة:</strong> استحقاقات وصول من الخادم تدعم الأجزاء الفردية وحزم الدورات الكاملة.</div></div>
        <div class="scope-item"><span class="scope-bullet">■</span><div><strong>معاينة ووصول مقيد:</strong> وصول مجاني للجزء 1 ووصول مقيد ومشروط بالأذونات للأجزاء المدفوعة.</div></div>
        <div class="scope-item"><span class="scope-bullet">■</span><div><strong>حماية الوسائط المدفوعة:</strong> تخزين سحابي خاص وروابط مؤقتة موقعة بصلاحية 15 دقيقة كحد أقصى.</div></div>
        <div class="scope-item"><span class="scope-bullet">■</span><div><strong>توليد المعرفات:</strong> أكواد المتدربين وأرقام التذاكر بصيغة Crockford Base32 المعيارية الموثوقة.</div></div>
        <div class="scope-item"><span class="scope-bullet">■</span><div><strong>سجل التذاكر:</strong> إصدار غير متزامن، ضمان عدم التكرار، معالجة الأعطال، وأهلية السحوبات التلقائية.</div></div>
        <div class="scope-item"><span class="scope-bullet">■</span><div><strong>درج سجل التذاكر:</strong> درج جانبي متجاوب يدعم الواجهتين العربية (RTL) والإنجليزية (LTR).</div></div>
        <div class="scope-item"><span class="scope-bullet">■</span><div><strong>تقدم تراكمي دائم:</strong> تتبع تصاعدي للدروس مع تثبيت دائم لحالة الاكتمال عند بلوغ نسبة 95%.</div></div>
        <div class="scope-item"><span class="scope-bullet">■</span><div><strong>استمرارية دمج الحسابات:</strong> دمج حسابات الزوار مع Google مع حفظ الطلبات والتذاكر والتقدم.</div></div>
        <div class="scope-item"><span class="scope-bullet">■</span><div><strong>أداة المحاكاة:</strong> أمر محاكاة تنفيذ الطلبات للتحقق المحلي واختبارات التكامل دون بوابات دفع.</div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">نتائج التحقق والاختبار (Verification Results)</div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 28%;">مجال التحقق</th>
            <th style="width: 47%;">النتيجة والمؤشرات الرقمية الموثقة</th>
            <th style="width: 25%;">الحالة والحدود</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>اختبارات الواجهة الخلفية</strong></td>
            <td class="metric">85 اختباراً ناجحاً، 0 فاشل، 5,739 توكيداً (Assertions)</td>
            <td><span class="badge-pass">ناجح (PASS)</span> مدة التشغيل 34.57 ثانية</td>
          </tr>
          <tr>
            <td><strong>حصر ملفات وفئات الاختبار</strong></td>
            <td class="metric">22 ملفاً / 22 فئة برمجية (20 ميزة + 2 وحدة)</td>
            <td><span class="badge-pass">مؤكد ومطابق</span> للمستودع</td>
          </tr>
          <tr>
            <td><strong>اختبارات الواجهة الأمامية</strong></td>
            <td class="metric">63 اختباراً ناجحاً، 0 فاشل عبر 21 حزمة اختبار</td>
            <td><span class="badge-pass">ناجح (PASS)</span> حزم Jest DOM</td>
          </tr>
          <tr>
            <td><strong>بناء بيئة الإنتاج</strong></td>
            <td class="metric">تم بنجاح تام عبر أمر <code>npm run build</code></td>
            <td><span class="badge-pass">ناجح (PASS)</span> 0 أخطاء TypeScript</td>
          </tr>
          <tr>
            <td><strong>الصفحات الثابتة المُولدة</strong></td>
            <td class="metric">47 صفحة ثابتة تم توليدها بالكامل</td>
            <td><span class="badge-pass">مؤكد</span> تشمل لوحة المتدرب</td>
          </tr>
          <tr>
            <td><strong>ترحيل قاعدة بيانات نظيفة</strong></td>
            <td>تشغيل 5 ترحيلات للميزة 005 على قاعدة <code>knzin_test</code> المعزولة</td>
            <td><span class="badge-pass">مؤكد</span> من الصفر بدون إصلاح يدوي</td>
          </tr>
          <tr>
            <td><strong>سلامة التراجع عن الترحيل</strong></td>
            <td>التراجع 5 خطوات وإعادة الترحيل تمت بنجاح وبنية سليمة</td>
            <td><span class="badge-pass">مؤكد</span> استقرار مخطط البيانات</td>
          </tr>
          <tr>
            <td><strong>سيناريوهات الهجوم الأمني</strong></td>
            <td>24 سيناريو هجوم واختراق محددة تم اختبارها وتأكيد صدها بالكامل</td>
            <td><span class="badge-pass">ناجح (PASS)</span> تحصين كامل عبر الخادم</td>
          </tr>
          <tr>
            <td><strong>التحقق من التزامن (Concurrency)</strong></td>
            <td>ضمانات التصميم وقاعدة البيانات + محاكاة تسلسلية دقيقة</td>
            <td><span class="badge-boundary">لا يُدعى اختبار متوازي</span></td>
          </tr>
          <tr>
            <td><strong>التحقق من التكامل (Integration)</strong></td>
            <td>تشغيل محلي شامل (MariaDB 3306، API 8000، Web 3000) وطلبات curl</td>
            <td><span class="badge-boundary">لا يُدعى اختبار متصفح آلي</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="footer-bar">
    <div class="footer-left">تقرير الإدارة الفنية لمشروع كنزين · الميزة 005 (بوابة المتدرب)</div>
    <div class="footer-right">صفحة 1 من 2</div>
  </div>
</div>

<!-- PAGE 2 -->
<div class="page">
  <div class="page-content">
    <div class="header-bar">
      <div>
        <div class="brand-title">تقرير حالة الميزة 005 - منصة كنزين</div>
        <div class="brand-subtitle">ضوابط الأمان، متطلبات الإطلاق وحدود التحقق الفنية</div>
      </div>
      <div class="doc-meta">
        <div><strong>Branch:</strong> <code>005-learner-hub</code></div>
        <div><strong>Section:</strong> تدقيق الجاهزية للإنتاج</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">ضوابط الأمان والموثوقية (Security & Reliability)</div>
      <div class="list-stack">
        <div class="list-row"><span class="list-num">1.</span><div><span class="list-title">التحقق من جانب الخادم:</span>يتم التحقق من الوصول للموارد المدفوعة عبر استحقاقات معتمدة؛ حالة الشراء في المتصفح (<code>localStorage</code>) غير موثوقة نهائياً.</div></div>
        <div class="list-row"><span class="list-num">2.</span><div><span class="list-title">حماية وسائط المحتوى:</span>تُقدم الوسائط المدفوعة حصرياً من تخزين سحابي خاص وروابط موقعة، وليست روابط YouTube عامة أو غير مدرجة.</div></div>
        <div class="list-row"><span class="list-num">3.</span><div><span class="list-title">صلاحية الروابط المؤقتة:</span>روابط التشغيل والتنزيل الموقعة تعمل كصلاحيات مؤقتة (Bearer capabilities) بمدة صلاحية قصوى 15 دقيقة فقط (900 ثانية).</div></div>
        <div class="list-row"><span class="list-num">4.</span><div><span class="list-title">منع تكرار إصدار التذاكر:</span>تخصيص تسلسلي ذري، قفل حصري على مستوى الصف (<code>lockForUpdate</code>)، وقيد فرادة في قاعدة البيانات (<code>uq_order_ticket_index</code>).</div></div>
        <div class="list-row"><span class="list-num">5.</span><div><span class="list-title">مسار تقدم تصاعدي دائم:</span>التحقق التراكمي التصاعدي (<code>GREATEST</code>) يمنع التراجع في التقدم، ونسبة 95% تثبت حالة الاكتمال نهائياً.</div></div>
        <div class="list-row"><span class="list-num">6.</span><div><span class="list-title">دمج الحسابات التلقائي:</span>دمج حسابات الزوار مع Google يحفظ بيانات المتدرب ويعالج تضارب الاستحقاقات بربط السجلات المكررة كـ <code>superseded</code>.</div></div>
        <div class="list-row"><span class="list-num">7.</span><div><span class="list-title">العلامة المائية المتحركة:</span>طبقة Canvas عائمة تعرض بريد المتدرب وكوده والوقت، وتعمل كوسيلة ردع وتوثيق جنائي وليست حماية مطلقة من التسجيل.</div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">متطلبات الإطلاق في بيئة الإنتاج (Phase 9 Gates)</div>
      <div class="list-stack">
        <div class="list-row"><span class="list-num">1.</span><div><span class="list-title">T058 (التخزين السحابي الخاص):</span>توفير مساحة تخزين خاصة لمقاطع الفيديو المدفوعة على مزود التخزين المعتمد (AWS S3 / Cloudflare R2 / Bunny Storage).</div></div>
        <div class="list-row"><span class="list-num">2.</span><div><span class="list-title">T059 (أمان نقطة التخزين):</span>التحقق من رفض التخزين السحابي لأي وصول عام مجهول عبر HTTP (تأكيد إرجاع HTTP 403 بدون توقيع).</div></div>
        <div class="list-row"><span class="list-num">3.</span><div><span class="list-title">T060 (إغلاق YouTube القديم):</span>ضبط مقاطع YouTube السابقة للأجزاء المدفوعة على <strong>خاص أو محذوف</strong>؛ <strong>الوضع غير المدرج مرفوض تماماً</strong>.</div></div>
        <div class="list-row"><span class="list-num">4.</span><div><span class="list-title">T061 (ترحيلات قاعدة البيانات):</span>تشغيل ترحيلات قاعدة البيانات للميزة 005 (من <code>000001</code> إلى <code>000005</code>) في بيئة الإنتاج الحية.</div></div>
        <div class="list-row"><span class="list-num">5.</span><div><span class="list-title">T062 (نشر الواجهة وتفريغ CDN):</span>نشر بناء الواجهة وتفريغ كاش الشبكة (Cloudflare / Vercel) لإلغاء أي كود قديم مخزن في المتصفحات.</div></div>
        <div class="list-row"><span class="list-num">6.</span><div><span class="list-title">بنية طوابير الانتظار (Queue):</span>تهيئة اتصال Redis في بيئة الإنتاج وتشغيل عامل معالجة نشط لتنفيذ <code>GenerateTicketsJob</code>.</div></div>
        <div class="list-row"><span class="list-num">7.</span><div><span class="list-title">مجدول المهام التلقائي (Cron):</span>تشغيل <code>php artisan schedule:run</code> كل دقيقة؛ وتعمل معالجة تذاكر الانتظار <strong>كل 5 دقائق</strong>.</div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">حدود التحقق والقيود الفنية (Technical Scope Limitations)</div>
      <div class="highlight-box">
        <div class="highlight-title">الحدود المعيارية والملاحظات الفنية</div>
        <div style="font-size: 7.5pt; color: #475569; line-height: 1.35;">
          • <strong>التزامن (Concurrency):</strong> لم يتم تشغيل اختبار تزامن متوازي حقيقي متعدد العمليات تحت PHPUnit؛ يعتمد النظام على عزل معاملات MariaDB والقفل الحصري للأسطر والقيود الفريدة، مع محاكاة تسلسلية للتعافي.<br>
          • <strong>أتمتة المتصفح (Browser E2E):</strong> لم يتم تنفيذ حزمة اختبارات متصفح آلية شاملة عبر Playwright أو Cypress.<br>
          • <strong>اعتمادات التشغيل:</strong> التخزين السحابي، وعامل Redis، ومجدول المهام، والترحيل في الإنتاج، وتفريغ CDN هي شروط إطلاق مسبقة إلزامية.<br>
          • <strong>تطور الكتالوج:</strong> الشمول التلقائي للأجزاء التدريبية المستقبلية لحزم الدورات المشتراة سابقاً يظل قراراً تجارياً مفتوحاً للمنتج.
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">حالة المستودع والمراجعة (Repository State)</div>
      <div style="font-size: 7.5pt; color: #334155; line-height: 1.4; display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
        <div><strong>الفرع البرمجي:</strong> <code>005-learner-hub</code></div>
        <div><strong>حالة العمل:</strong> تم التثبيت والمراجعة من قبل مالك المشروع</div>
        <div><strong>فهرس أدلة الإثبات:</strong> <code>specs/005-learner-hub/evidence/INDEX.md</code></div>
        <div><strong>خطة الاختبار:</strong> <code>specs/005-learner-hub/test-plan.md</code></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">مسار الميزات القادمة (خارطة طريق المنصة)</div>
      <div style="font-size: 7.2pt; color: #334155; line-height: 1.4; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 4px 8px;">
        <div><strong>المكتمل والمحقق:</strong> 001 واجهة كنزين · 002 المصادقة والكتالوج · 003 ساحة السحوبات · 004 الثقة والتفاعل · 005 بوابة المتدرب</div>
        <div style="margin-top: 2px;"><strong>المرحلة التالية المجدولة:</strong> <span style="color: #2563eb; font-weight: 700;">006 محرك التسويق بالعمولة (Affiliate)</span> ← 007 بوابات الدفع الإلكتروني ← 008 لوحة الإدارة والعمليات ← 009 الإشعارات متعددة القنوات</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">الحالة النهائية والاعتماد</div>
      <div class="lead-text" style="margin-bottom: 0; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong>الميزة 005 مكتملة التنفيذ ومحققة بالكامل على مستوى المستودع وبيئة التشغيل المحلية.</strong><br>
          الإطلاق في بيئة الإنتاج الحية يظل معلقاً حتى استكمال المتطلبات التشغيلية السبعة وتوقيع الاعتماد النهائي.
        </div>
        <div style="font-weight: 800; color: #0f172a; white-space: nowrap; margin-right: 14px; border-right: 2px solid #cbd5e1; padding-right: 10px; font-size: 10pt;">
          معاذ الدليل
        </div>
      </div>
    </div>
  </div>

  <div class="footer-bar">
    <div class="footer-left">تقرير الإدارة الفنية لمشروع كنزين · الميزة 005 (بوابة المتدرب)</div>
    <div class="footer-right">صفحة 2 من 2</div>
  </div>
</div>

</body>
</html>
"""

html_path = r"D:\Work Projects\Knzin Project\Project report\report_template_ar.html"
pdf_path = r"D:\Work Projects\Knzin Project\Project report\KNZiN_Feature_005_Status_Report_AR.pdf"
downloads_pdf_path = r"C:\Users\HP\Downloads\KNZiN_Feature_005_Status_Report_AR.pdf"

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print("Arabic HTML template written:", html_path)

chrome_exe = r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
cmd = [
    chrome_exe,
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    f"--print-to-pdf={pdf_path}",
    html_path
]

print("Running Chrome print-to-pdf for Arabic report...")
res = subprocess.run(cmd, capture_output=True, text=True)
print("Chrome exit code:", res.returncode)

if os.path.exists(pdf_path):
    size = os.path.getsize(pdf_path)
    print(f"Generated Arabic PDF: {pdf_path} ({size} bytes)")
    
    # Copy to downloads
    try:
        import shutil
        shutil.copyfile(pdf_path, downloads_pdf_path)
        print("Copied Arabic PDF to downloads:", downloads_pdf_path)
    except Exception as e:
        print("Downloads copy error:", e)

    # Count pages
    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()
    pages = re.findall(rb'/Type\s*/Page(?![a-zA-Z])', pdf_bytes)
    print(f"Arabic PDF Page count: {len(pages)}")
else:
    print("Arabic PDF was not created!")
