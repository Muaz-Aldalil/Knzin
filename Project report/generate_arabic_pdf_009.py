import os
import subprocess
import re
import shutil

html_content = """<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>تقرير حالة وإنجاز الميزة 009 - منصة كَنزين</title>
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
    font-size: 7.3pt;
    line-height: 1.26;
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
    margin-bottom: 5px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .brand-title {
    font-size: 13pt;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.01em;
  }
  .brand-sub {
    font-size: 7.8pt;
    font-weight: 600;
    color: #475569;
    margin-top: 1px;
  }
  .header-meta {
    text-align: left;
    font-size: 6.8pt;
    color: #64748b;
    line-height: 1.25;
    direction: ltr;
  }
  .badge-container {
    display: flex;
    gap: 6px;
    margin-bottom: 5px;
  }
  .status-badge {
    flex: 1;
    border-radius: 4px;
    padding: 3.5px 6px;
    border: 1px solid transparent;
  }
  .badge-ready {
    background: #ecfdf5;
    border-color: #a7f3d0;
  }
  .badge-gold {
    background: #fffbeb;
    border-color: #fde68a;
  }
  .badge-blue {
    background: #eff6ff;
    border-color: #bfdbfe;
  }
  .badge-label {
    font-size: 6.3pt;
    font-weight: 700;
    text-transform: uppercase;
    display: block;
    margin-bottom: 1px;
  }
  .badge-ready .badge-label { color: #047857; }
  .badge-gold .badge-label { color: #b45309; }
  .badge-blue .badge-label { color: #1d4ed8; }
  .badge-val {
    font-size: 7.6pt;
    font-weight: 800;
  }
  .badge-ready .badge-val { color: #065f46; }
  .badge-gold .badge-val { color: #92400e; }
  .badge-blue .badge-val { color: #1e40af; }

  .section-title {
    font-size: 8pt;
    font-weight: 800;
    color: #0f172a;
    background: #f1f5f9;
    padding: 2px 6px;
    border-right: 3px solid #2563eb;
    margin-top: 3.5px;
    margin-bottom: 3px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .section-title-en {
    font-size: 6.4pt;
    font-weight: 600;
    color: #64748b;
    direction: ltr;
  }

  p {
    margin-bottom: 3px;
    color: #334155;
    text-align: justify;
    font-size: 7.1pt;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    margin-bottom: 3.5px;
  }
  .scope-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 3.5px;
    padding: 3px 5px;
  }
  .scope-card-title {
    font-size: 7.1pt;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 1px;
    display: flex;
    align-items: center;
    gap: 3px;
  }
  .scope-card-desc {
    font-size: 6.5pt;
    color: #475569;
    line-height: 1.2;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 2px;
    margin-bottom: 3.5px;
    font-size: 6.6pt;
  }
  th {
    background: #0f172a;
    color: #ffffff;
    font-weight: 700;
    padding: 2.5px 5px;
    text-align: right;
    border: 1px solid #0f172a;
  }
  td {
    padding: 2.2px 5px;
    border: 1px solid #cbd5e1;
    color: #1e293b;
    vertical-align: middle;
  }
  tr:nth-child(even) {
    background: #f8fafc;
  }
  .tag {
    display: inline-block;
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 6.1pt;
    font-weight: 800;
  }
  .tag-pass { background: #dcfce7; color: #15803d; }
  .tag-gold { background: #fef3c7; color: #b45309; }
  .tag-done { background: #e0f2fe; color: #0369a1; }

  .footer-bar {
    border-top: 1px solid #cbd5e1;
    padding-top: 3px;
    margin-top: 3px;
    display: flex;
    justify-content: space-between;
    font-size: 6.4pt;
    color: #64748b;
  }
  .footer-bar span {
    direction: ltr;
  }

  .highlight-box {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 3.5px;
    padding: 3px 5px;
    margin-bottom: 3.5px;
    font-size: 6.6pt;
    color: #1e3a8a;
    line-height: 1.22;
  }
  .highlight-box strong {
    color: #1d4ed8;
  }
</style>
</head>
<body>

<!-- ================= PAGE 1 ================= -->
<div class="page">
  <div class="page-content">
    <div class="header-bar">
      <div>
        <div class="brand-title">منصة كَنزين · KNZiN Platform</div>
        <div class="brand-sub">تقرير الإنجاز الهندسي والاعتماد النهائي · الميزة 009 (نظام الإشعارات متعدد القنوات وتجربة المتدرب اللحظية)</div>
      </div>
      <div class="header-meta">
        <div><strong>Spec:</strong> specs/009-notifications</div>
        <div><strong>Branch:</strong> 009-notifications (ready for main)</div>
        <div><strong>Tasks:</strong> 60/60 Completed (100%)</div>
        <div><strong>Date:</strong> 2026-10-05 · v1.0.0 Final</div>
      </div>
    </div>

    <div class="badge-container">
      <div class="status-badge badge-ready">
        <span class="badge-label">حالة التنفيذ والجاهزية</span>
        <span class="badge-val">مكتمل ومتحقق 100% (READY FOR ACCEPTANCE)</span>
      </div>
      <div class="status-badge badge-gold">
        <span class="badge-label">حالة الفحص والاختبارات</span>
        <span class="badge-val">اجتياز تام لكافة الاختبارات (100% PASSED)</span>
      </div>
      <div class="status-badge badge-blue">
        <span class="badge-label">حالة بيئة الإنتاج</span>
        <span class="badge-val">جاهز تماماً للربط ببوابات الدفع 007</span>
      </div>
    </div>

    <div class="section-title">
      <span>1. الملخص التنفيذي للميزة 009</span>
      <span class="section-title-en">Executive Summary</span>
    </div>
    <p>
      أنجزت الميزة 009 (نظام الإشعارات متعدد القنوات، مركز إشعارات المتدرب التفاعلي داخل التطبيق، شارة التنبيهات اللحظية، محرك استرداد السلات الشرائية المعلقة، تنبيهات السحوبات الحية وتوثيق هوية الفائزين KYC، تنبيهات دورة حياة الدورات والجوائز، تذكير المهام التعليمية، البث الإداري الموجه، وتحديث المحتوى اللحظي دون إعادة تحميل) كافة مراحل التحليل المعماري، والتنفيذ البرمجي، والفحص الأمني المشدد، وتكامل الواجهات الأمامية باللغتين العربية والإنجليزية. يمثل النظام الشريان التواصلي لمنصة كَنزين الذي ينقل الأحداث المرجعية عبر قناتين معتمدتين دستورياً: <strong>الإشعارات داخل التطبيق (In-App Hub)</strong> و<strong>البريد الإلكتروني المباشر (Transactional &amp; Marketing Email)</strong> وفقاً للقرار المعماري <code>DEC-007</code> مع تأجيل الواتساب لمرحلة لاحقة دون أي شيفرة وهمية. تم إغلاق 60 مهمة بنجاح، واجتياز 25 اختبار خادم متخصص (88 توكيداً) و 161 اختبار واجهة أمامية، مع إثبات العزل التام لفشل قنوات الإرسال عن المعاملات المالية الأصلية وحماية Anti-IDOR الصارمة.
    </p>

    <div class="section-title">
      <span>2. نطاق العمل المُنجز المعتمد (10 محاور تفصيلية متكاملة)</span>
      <span class="section-title-en">Delivered Scope - 10 Core Subsystems</span>
    </div>

    <div class="grid-2">
      <div class="scope-card">
        <div class="scope-card-title">1. إيصالات الشراء وصك التذاكر (US1 - Receipts &amp; Tickets)</div>
        <div class="scope-card-desc">إرسال إيصال فوري للشراء وصك التذاكر الترويجية عبر <code>DB::afterCommit</code> وعبر وظيفة الطابور الخلفي <code>GenerateTicketsJob</code> مع كشف الأرقام التسلسلية وفئات السحب.</div>
      </div>
      <div class="scope-card">
        <div class="scope-card-title">2. مركز الإشعارات التفاعلي وشارة الـ HUD (US2 - In-App Center)</div>
        <div class="scope-card-desc">تثبيت جرس التنبيهات التفاعلي في <code>HeaderHUD.tsx</code> مع شارة ديناميكية، ودرج منزلق لعرض الإشعارات، وتحديد فردي أو جماعي كمقروء، وتحديثات متفائلة عبر TanStack Query.</div>
      </div>
      <div class="scope-card">
        <div class="scope-card-title">3. محرك استرداد السلات المعلقة (US3 - Abandoned Order Recovery)</div>
        <div class="scope-card-desc">أمر مجدول يعمل كل 10 دقائق لفحص الطلبات المعلقة لأكثر من ساعتين، مع إرسال بريد استرداد برابط دفع مباشر، وقفل ذري يمنع التكرار نهائياً (<code>recovery_notification_sent_at</code>).</div>
      </div>
      <div class="scope-card">
        <div class="scope-card-title">4. تنبيهات السحوبات 15د وتوثيق KYC (US4 - Draw &amp; Winner Alerts)</div>
        <div class="scope-card-desc">فحص دوري كل 5 دقائق للسحوبات المقتربة من الإغلاق وإشعار حاملي التذاكر برابط البث المباشر (UUIDv5 لمنع التكرار)، مع إشعار فوري للفائزين بتعليمات توثيق الهوية الرسمية.</div>
      </div>
      <div class="scope-card">
        <div class="scope-card-title">5. دورة حياة الدورات وتذكير المهام (US5 - Lifecycle &amp; Missions)</div>
        <div class="scope-card-desc">إشعار تلقائي بالدورات والجوائز الجديدة، مع محرك تذكير للمتدربين المنقطعين عن الدورات غير المكتملة بعد 3 أيام مع فرض فترة تبريد (Cooldown) إلزامية مدتها 7 أيام لمنع الإزعاج.</div>
      </div>
      <div class="scope-card">
        <div class="scope-card-title">6. البث الإداري الموجه وإلغاء الاشتراك (US6 - Broadcasts &amp; Opt-out)</div>
        <div class="scope-card-desc">بث إداري محمي بالصلاحية، ونافذة تفضيلات متقدمة للمستخدم لإلغاء الاشتراك في الفئات التسويقية الثلاث، وروابط إلغاء موقعة مشفرة (Signed URLs) بنقرة واحدة دون الحاجة لتسجيل الدخول.</div>
      </div>
      <div class="scope-card">
        <div class="scope-card-title">7. التحديث اللحظي لمحتوى الدورات (US7 - In-App Course Refresh)</div>
        <div class="scope-card-desc">رصد تعديلات المحتوى الجوهرية إدارياً وزيادة النسخة <code>content_version</code>، وإرسال إشعار للمتدربين المسجلين بزر تفاعلي يُجدد كاش TanStack Query دون الحاجة لإعادة تحميل الصفحة.</div>
      </div>
      <div class="scope-card">
        <div class="scope-card-title">8. البنية التحتية والترحيلات الخمس (Database Schema)</div>
        <div class="scope-card-desc">5 ترحيلات جديدة متوافقة مع UUID (الإشعارات، التفضيلات، البث الإداري، تذكيرات المهام، وأعمدة الدعم الذرية) مطبقة بنجاح مع الفهارس المركبة لحماية الأداء العالي.</div>
      </div>
      <div class="scope-card">
        <div class="scope-card-title">9. الأوامر المجدولة وسياسة الأرشفة (Schedulers &amp; Retention)</div>
        <div class="scope-card-desc">4 أوامر مجدولة تعمل بأقفال عدم التداخل، وتطبيق سياسة الحفظ الذاتي لحذف الإشعارات المقروءة التي تجاوزت 60 يوماً عند 03:00 فجراً مع الاحتفاظ الدائم بالإشعارات غير المقروءة.</div>
      </div>
      <div class="scope-card">
        <div class="scope-card-title">10. العزل البرمجي وتوافق RTL والـ &lt;bdi&gt; (Frontend Invariants)</div>
        <div class="scope-card-desc">توافق تام مع اتجاه اليمين لليسار العربي (RTL)، وعزل الأرقام والرموز التسلسلية <code>KNZ-XXX</code> والمبالغ نقدياً داخل وسوم <code>&lt;bdi&gt;</code> لمنع تشوه الترتيب البصري في النصوص المختلطة.</div>
      </div>
    </div>

    <div class="section-title">
      <span>3. نتائج التحقق والاختبار والفحص الآلي المباشر</span>
      <span class="section-title-en">Verification &amp; Test Results Matrix</span>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 28%;">مجال الفحص والاختبار</th>
          <th style="width: 52%;">الحجم والنتيجة التفصيلية المبرهنة برمجياً</th>
          <th style="width: 20%;">الحالة والاعتماد</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>اختبارات إشعارات الخادم (Backend Suite)</strong></td>
          <td>8 فئات اختبار / 25 اختباراً معقداً (88 توكيداً) تغطي US1-US7 والأرشفة</td>
          <td><span class="tag tag-pass">ناجح تام PASS (19s)</span></td>
        </tr>
        <tr>
          <td><strong>اختبارات استرداد الطلبات المعلقة</strong></td>
          <td>تحقق الفحص بعد ساعتين مع إثبات منع التكرار التام بنسبة 100% في الجولات التالية</td>
          <td><span class="tag tag-pass">ناجح تام PASS</span></td>
        </tr>
        <tr>
          <td><strong>أمان الهوية ومنع التنصت (Anti-IDOR)</strong></td>
          <td>محاولة الوصول أو تعديل إشعارات مستخدم آخر تعيد استجابة 404 صريحة وفورية</td>
          <td><span class="tag tag-pass">مؤمن بالكامل PASS</span></td>
        </tr>
        <tr>
          <td><strong>التحديث اللحظي لمحتوى الدورات</strong></td>
          <td>زيادة رقم النسخة الدورية وتفريغ كاش TanStack Query برمجياً بنجاح تام</td>
          <td><span class="tag tag-pass">ناجح تام (0 Reload)</span></td>
        </tr>
        <tr>
          <td><strong>اختبارات الواجهة الأمامية (Frontend Suite)</strong></td>
          <td>161 اختباراً ناجحاً عبر 46 حزمة تغطي الجرس، الدرج، التفضيلات، وتوافق RTL</td>
          <td><span class="tag tag-pass">ناجح تام (161/161)</span></td>
        </tr>
        <tr>
          <td><strong>سياسة الأرشفة والحفظ (60 Days)</strong></td>
          <td>حذف الإشعارات المقروءة القديمة والإبقاء على غير المقروءة والحديثة دون استثناء</td>
          <td><span class="tag tag-done">متحقق ومجدول</span></td>
        </tr>
        <tr>
          <td><strong>قاعدة البيانات والترحيلات الخمس</strong></td>
          <td>تطبيق 5 ترحيلات جديدة بنجاح تام مع فهارس الأداء وتوافق كامل مع المعرفات</td>
          <td><span class="tag tag-done">مطابق ومؤكد</span></td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="footer-bar">
    <div>منصة كَنزين (KNZiN) · تقرير اعتماد الميزة 009 (نظام الإشعارات متعدد القنوات وتجربة المتدرب اللحظية)</div>
    <div>صفحة 1 من 2</div>
    <span>KNZiN-REP-009-P1 · Confidential &amp; Proprietary</span>
  </div>
</div>

<!-- ================= PAGE 2 ================= -->
<div class="page">
  <div class="page-content">
    <div class="header-bar">
      <div>
        <div class="brand-title">منصة كَنزين · KNZiN Platform</div>
        <div class="brand-sub">تقرير الحالة الهندسية والاعتماد التنفيذي · الميزة 009 (الضوابط والاعتماد النهائي)</div>
      </div>
      <div class="header-meta">
        <div><strong>Status:</strong> Ready for Acceptance &amp; Merge</div>
        <div><strong>Gate:</strong> /speckit-converge PASS (60/60)</div>
        <div><strong>Next:</strong> Feature 007 (Electronic Payment Gateways)</div>
      </div>
    </div>

    <div class="section-title">
      <span>4. الضوابط المعمارية والأمنية ومحددات الحوكمة المشددة</span>
      <span class="section-title-en">Security Matrix &amp; Architectural Invariants</span>
    </div>

    <div class="highlight-box">
      <strong>مبدأ المراقب التابع وعزل فشل القنوات (Downstream Observer &amp; Failure Isolation):</strong> الإشعارات لا تملك أي سلطة لتعديل أو إنشاء أي حقيقة مالية أو نتيجة سحب. كافة عمليات الإرسال مربوطة بخطاف <code>DB::afterCommit</code> لضمان أن أي عطل في شبكة البريد أو خادم الإشعارات يستحيل أن يتسبب في إفشال أو التراجع عن معاملة شراء الدورة أو صك التذاكر.
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 25%;">الضابط المعماري والأمني</th>
          <th style="width: 22%;">المستوى والمكون</th>
          <th style="width: 53%;">الآلية الهندسية والضمانات المحققة برمجياً</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>Failure Isolation</code></td>
          <td>الخادم والمعاملات</td>
          <td>تنفيذ الإرسال عبر <code>DB::afterCommit</code> وطوابير المعالجة المنفصلة لعزل فشل الإرسال عن المعاملات.</td>
        </tr>
        <tr>
          <td><code>Anti-IDOR Scoping</code></td>
          <td>التحكم والوصول</td>
          <td>تقييد الاستعلامات بـ <code>$request-&gt;user()-&gt;notifications()</code> وإرجاع 404 عند محاولة العبث بمعرفات الآخرين.</td>
        </tr>
        <tr>
          <td><code>Atomic Deduping</code></td>
          <td>الطلبات المعلقة</td>
          <td>قفل ذري فوري عبر الحقل <code>recovery_notification_sent_at</code> لمنع التكرار المتزامن نهائياً.</td>
        </tr>
        <tr>
          <td><code>Deterministic UUIDv5</code></td>
          <td>تنبيهات السحوبات والمحتوى</td>
          <td>توليد معرفات قطعية للإشعارات بالاعتماد على معرف السحب والنسخة <code>v{$version}</code> لمنع الازدواجية.</td>
        </tr>
        <tr>
          <td><code>Signed Unsubscribe</code></td>
          <td>الامتثال والخصوصية</td>
          <td>روابط إلغاء اشتراك تسويقي موقعة تشفيرياً (Signed URLs) تتيح الإلغاء الفوري دون طلب تسجيل الدخول.</td>
        </tr>
        <tr>
          <td><code>Semantic BDI Isolation</code></td>
          <td>الواجهة ثنائية الاتجاه</td>
          <td>عزل أرقام التذاكر والعملات بوسوم <code>&lt;bdi&gt;</code> لمنع ارتباك الترتيب البصري في النصوص المختلطة (RTL).</td>
        </tr>
      </tbody>
    </table>

    <div class="section-title">
      <span>5. دورة الاسترداد الذري وتحديث المحتوى وسياسة الحفظ والأرشفة</span>
      <span class="section-title-en">Lifecycle Schedulers &amp; State Persistence</span>
    </div>

    <div class="grid-2">
      <div class="scope-card">
        <div class="scope-card-title">الاسترداد الذري وتحديث المحتوى (US3 &amp; US7)</div>
        <div class="scope-card-desc">
          يمتلك محرك استرداد السلات المعلقة آلية فحص دقيقة تعزل الطلبات غير المدفوعة لأكثر من ساعتين مع ضمان عدم إرسال أكثر من تذكير واحد. وفي المقابل، يتيح نظام تحديث المحتوى للمتدربين تحديث بيانات الدورة لحظياً عبر تفريغ كاش TanStack Query دون فقدان سياق الدرس الحالي أو الحاجة لإعادة تحميل الصفحة.
        </div>
      </div>
      <div class="scope-card">
        <div class="scope-card-title">سياسة الحفظ والأرشفة والتنظيف الذاتي (Phase 10)</div>
        <div class="scope-card-desc">
          تطبيق سياسة صارمة للأرشفة تمنع تراكم البيانات غير المفيدة في جداول الخادم: يتم حذف الإشعارات المقروءة تلقائياً بعد مرور 60 يوماً عبر أمر مجدول ينفذ يومياً عند الساعة 03:00 فجراً، مع الاحتفاظ الدائم بالإشعارات غير المقروءة لضمان عدم ضياع أي مستحقات أو تنبيهات هامة على المستخدم.
        </div>
      </div>
    </div>

    <div class="section-title">
      <span>6. حدود القنوات وخارطة الطريق نحو بوابات الدفع (Roadmap to Feature 007)</span>
      <span class="section-title-en">Channel Boundaries &amp; Integration Seams</span>
    </div>

    <div class="grid-2">
      <div class="scope-card">
        <div class="scope-card-title">الالتزام بالقنوات وتأجيل الواتساب (DEC-007)</div>
        <div class="scope-card-desc">
          امتثالاً للقرار الدستوري <code>DEC-007</code>، تقتصر قنوات الإطلاق على الإشعارات داخل التطبيق والبريد الإلكتروني المباشر. تم تأجيل قنوات واتساب رسمياً لمرحلة تشغيلية مستقبلية دون تحميل المشروع أي شيفرة وهمية أو مكتبات وسيطة غير مستخدمة.
        </div>
      </div>
      <div class="scope-card">
        <div class="scope-card-title">الجاهزية للربط ببوابات الدفع الإلكتروني (007)</div>
        <div class="scope-card-desc">
          تمثل الميزة 009 حلقة الوصل المكتملة التي ستبث إشعارات الدفع الحقيقي والتذاكر فور اكتمال <strong>الميزة 007 (بوابات الدفع ZainCash &amp; AsiaHawala)</strong> عبر خطافات الويبهوك، مما يجعل المنصة على بعد خطوة واحدة من الإطلاق التجاري الكامل.
        </div>
      </div>
    </div>

    <div class="section-title">
      <span>7. قرار الاعتماد النهائي وحالة الفرع البرمجي</span>
      <span class="section-title-en">Final Acceptance &amp; Sign-off</span>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 25%;">معيار الاعتماد الهندسي</th>
          <th style="width: 55%;">الواقع البرمجي المحقق</th>
          <th style="width: 20%;">النتيجة والقرار</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>حالة المهام التنفيذية</strong></td>
          <td>60 من أصل 60 مهمة مكتملة ومطابقة في <code>specs/009-notifications/tasks.md</code></td>
          <td><span class="tag tag-pass">مكتمل 100%</span></td>
        </tr>
        <tr>
          <td><strong>حالة التقارب المعماري</strong></td>
          <td>اجتياز بوابة <code>/speckit-converge</code> بنجاح وتطابق تام مع المواصفات</td>
          <td><span class="tag tag-pass">مطابق CONVERGED</span></td>
        </tr>
        <tr>
          <td><strong>جاهزية الدمج في main</strong></td>
          <td>الفرع <code>009-notifications</code> خالٍ من أي تعارض ومستعد للدمج الفوري</td>
          <td><span class="tag tag-gold">جاهز للدمج MERGE</span></td>
        </tr>
      </tbody>
    </table>

    <div class="highlight-box" style="margin-bottom: 0; background: #f0fdf4; border-color: #bbf7d0; color: #166534;">
      <strong>قرار الاعتماد النهائي (Final Product Acceptance):</strong> أقر الفريق الهندسي بأن الميزة 009 (نظام الإشعارات وتجربة المتدرب اللحظية) مكتملة بنسبة 100% ومتحققة عبر 25 اختبار خادم و 161 اختبار واجهة وخالية من أي ثغرات IDOR، ومطابقة للقرار الدستوري DEC-007. نوصي باعتمادها ودمجها والانتقال الفوري للميزة 007 (بوابات الدفع).
    </div>
  </div>

  <div class="footer-bar">
    <div>منصة كَنزين (KNZiN) · تقرير اعتماد الميزة 009 (نظام الإشعارات متعدد القنوات وتجربة المتدرب اللحظية)</div>
    <div>صفحة 2 من 2</div>
    <span>KNZiN-REP-009-P2 · Final Sign-off Document</span>
  </div>
</div>

</body>
</html>
"""

base_dir = os.path.dirname(os.path.abspath(__file__))
html_path = os.path.join(base_dir, "KNZiN_Feature_009_Status_Report_AR.html")
pdf_path = os.path.join(base_dir, "KNZiN_Feature_009_Status_Report_AR.pdf")
downloads_pdf_path = os.path.join(os.path.expanduser("~"), "Downloads", "KNZiN_Feature_009_Status_Report_AR.pdf")

print(f"Writing HTML report to {html_path}...")
with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

chrome_paths = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Users\HP\AppData\Local\Google\Chrome\Application\chrome.exe",
]

chrome_bin = None
for p in chrome_paths:
    if os.path.exists(p):
        chrome_bin = p
        break

if not chrome_bin:
    raise FileNotFoundError("Google Chrome binary not found!")

print(f"Found Chrome at: {chrome_bin}")

cmd = [
    chrome_bin,
    "--headless",
    "--disable-gpu",
    "--run-all-compositor-stages-before-draw",
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
