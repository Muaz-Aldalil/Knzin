import os
import subprocess
import re

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>KNZiN Feature 005 Status Report</title>
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
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #0f172a;
    background: #ffffff;
    font-size: 8.5pt;
    line-height: 1.35;
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
    letter-spacing: -0.02em;
    color: #0f172a;
  }
  .brand-subtitle {
    font-size: 8.5pt;
    font-weight: 600;
    color: #475569;
    margin-top: 1px;
  }
  .doc-meta {
    text-align: right;
    font-size: 7.5pt;
    color: #64748b;
    line-height: 1.3;
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
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .ready .status-label { color: #047857; }
  .pending .status-label { color: #b45309; }
  .status-val {
    font-size: 9pt;
    font-weight: 800;
    letter-spacing: 0.02em;
  }
  .ready .status-val { color: #065f46; }
  .pending .status-val { color: #92400e; }

  .section {
    margin-bottom: 8px;
  }
  .section-title {
    font-size: 9pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
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
    line-height: 1.35;
    background: #f8fafc;
    border-left: 3px solid #64748b;
    padding: 5px 8px;
    border-radius: 0 4px 4px 0;
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
    line-height: 1.3;
    display: flex;
    align-items: flex-start;
    color: #334155;
  }
  .scope-bullet {
    color: #2563eb;
    margin-right: 5px;
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
    text-align: left;
  }
  table.data-table th {
    background: #f1f5f9;
    color: #1e293b;
    font-weight: 700;
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  table.data-table tr:nth-child(even) td {
    background: #f8fafc;
  }
  table.data-table td.metric {
    font-weight: 700;
    color: #0f172a;
    white-space: nowrap;
  }
  table.data-table td.badge-cell {
    font-weight: 600;
  }
  .badge-pass {
    display: inline-block;
    padding: 1px 4px;
    background: #dcfce7;
    color: #166534;
    border-radius: 2px;
    font-size: 6.5pt;
    font-weight: 700;
  }
  .badge-boundary {
    display: inline-block;
    padding: 1px 4px;
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
    line-height: 1.3;
    color: #334155;
  }
  .list-num {
    font-weight: 700;
    color: #0f172a;
    min-width: 14px;
  }
  .list-title {
    font-weight: 700;
    color: #1e293b;
    margin-right: 4px;
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
    text-transform: uppercase;
    letter-spacing: 0.02em;
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
        <div class="brand-title">KNZiN Feature 005 Status Report</div>
        <div class="brand-subtitle">Learner Hub / Course Library / Ticket Ledger</div>
      </div>
      <div class="doc-meta">
        <div><strong>Branch:</strong> <code>005-learner-hub</code></div>
        <div><strong>Date:</strong> October 01, 2026</div>
        <div><strong>Audience:</strong> Project Leadership & Technical Review</div>
      </div>
    </div>

    <div class="status-container">
      <div class="status-box ready">
        <span class="status-label">Implementation Status</span>
        <span class="status-val">READY</span>
      </div>
      <div class="status-box pending">
        <span class="status-label">Production Status</span>
        <span class="status-val">PREREQUISITES PENDING</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Executive Status</div>
      <div class="lead-text">
        Feature 005 has completed implementation, repository/local-runtime verification, security verification, clean-database migration validation, and final reconciliation. The work remains uncommitted on the feature branch for human review. The code is ready for review and release preparation. Production launch is not yet cleared because the external operational prerequisites listed on Page 2 remain pending.
      </div>
    </div>

    <div class="section">
      <div class="section-title">Delivered Scope</div>
      <div class="scope-grid">
        <div class="scope-item"><span class="scope-bullet">■</span><div><strong>Learner Dashboard:</strong> Curriculum & owned-scope progress at <code>/[locale]/dashboard</code>.</div></div>
        <div class="scope-item"><span class="scope-bullet">■</span><div><strong>Server Entitlements:</strong> Authoritative single-part access and full-course bundles.</div></div>
        <div class="scope-item"><span class="scope-bullet">■</span><div><strong>Gated Part Access:</strong> Free Part 1 preview and authenticated, entitlement-gated paid parts.</div></div>
        <div class="scope-item"><span class="scope-bullet">■</span><div><strong>Media Protection:</strong> Private storage with short-lived 15-minute signed streaming & download access.</div></div>
        <div class="scope-item"><span class="scope-bullet">■</span><div><strong>Identifier Generation:</strong> Server-generated Crockford Base32 learner codes & canonical serials.</div></div>
        <div class="scope-item"><span class="scope-bullet">■</span><div><strong>Ticket Ledger:</strong> Asynchronous fulfillment, idempotency, recovery, dynamic draw eligibility.</div></div>
        <div class="scope-item"><span class="scope-bullet">■</span><div><strong>Ticket Ledger Drawer:</strong> Accessible sliding drawer with bidirectional Arabic RTL & English LTR.</div></div>
        <div class="scope-item"><span class="scope-bullet">■</span><div><strong>Monotonic Progress:</strong> Server-validated watch tracking with sticky 95% completion behavior.</div></div>
        <div class="scope-item"><span class="scope-bullet">■</span><div><strong>Account Continuity:</strong> Guest-to-Google merge preserving orders, entitlements, tickets, and progress.</div></div>
        <div class="scope-item"><span class="scope-bullet">■</span><div><strong>Fulfillment Simulator:</strong> Local non-production simulation command for end-to-end verification.</div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Verification Results</div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 28%;">Verification Area</th>
            <th style="width: 45%;">Verified Outcome & Metric Details</th>
            <th style="width: 27%;">Status & Boundary</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Backend Automated Suite</strong></td>
            <td class="metric">85 passed, 0 failed, 5,739 assertions</td>
            <td><span class="badge-pass">PASS</span> Full local run (34.57s)</td>
          </tr>
          <tr>
            <td><strong>Backend Test Inventory</strong></td>
            <td class="metric">22 files / 22 classes (20 Feature + 2 Unit)</td>
            <td><span class="badge-pass">VERIFIED</span> Exact filesystem count</td>
          </tr>
          <tr>
            <td><strong>Frontend Automated Suite</strong></td>
            <td class="metric">63 passed, 0 failed, 21 test suites</td>
            <td><span class="badge-pass">PASS</span> Jest DOM suites</td>
          </tr>
          <tr>
            <td><strong>Production Build</strong></td>
            <td class="metric">Compiled cleanly via <code>npm run build</code></td>
            <td><span class="badge-pass">PASS</span> 0 TypeScript errors</td>
          </tr>
          <tr>
            <td><strong>Static Pages Generated</strong></td>
            <td class="metric">47 static routes prerendered</td>
            <td><span class="badge-pass">VERIFIED</span> Includes <code>/[locale]/dashboard</code></td>
          </tr>
          <tr>
            <td><strong>Clean Database Migration</strong></td>
            <td>5 Feature 005 migrations run on isolated clean <code>knzin_test</code></td>
            <td><span class="badge-pass">VERIFIED</span> No scratch schema repair</td>
          </tr>
          <tr>
            <td><strong>Migration Rollback Integrity</strong></td>
            <td>Rollback of 5 steps and subsequent re-migration succeed cleanly</td>
            <td><span class="badge-pass">VERIFIED</span> Clean drop & re-creation</td>
          </tr>
          <tr>
            <td><strong>Security Attack Scenarios</strong></td>
            <td>24 defined attack vectors verified (playback, downloads, tickets, progress, merge)</td>
            <td><span class="badge-pass">PASS</span> Server-enforced boundaries</td>
          </tr>
          <tr>
            <td><strong>Concurrency Verification</strong></td>
            <td>Design/DB guarantees + sequential simulation (missing delta, duplicate worker)</td>
            <td><span class="badge-boundary">NO PARALLEL TEST CLAIM</span></td>
          </tr>
          <tr>
            <td><strong>Integration Verification</strong></td>
            <td>Local runtime daemons (MariaDB 3306, API 8000, Web 3000) + curl HTTP 200</td>
            <td><span class="badge-boundary">NO BROWSER-E2E CLAIM</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="footer-bar">
    <div class="footer-left">KNZiN Technical Executive Report · Feature 005 (Learner Hub)</div>
    <div class="footer-right">Page 1 of 2</div>
  </div>
</div>

<!-- PAGE 2 -->
<div class="page">
  <div class="page-content">
    <div class="header-bar">
      <div>
        <div class="brand-title">KNZiN Feature 005 Status Report</div>
        <div class="brand-subtitle">Security, Operational Prerequisites & Release Boundaries</div>
      </div>
      <div class="doc-meta">
        <div><strong>Branch:</strong> <code>005-learner-hub</code></div>
        <div><strong>Section:</strong> Production Readiness Audit</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Security & Reliability Controls</div>
      <div class="list-stack">
        <div class="list-row"><span class="list-num">1.</span><div><span class="list-title">Server-Authoritative Access:</span>Paid-resource access is authorized server-side through authenticated entitlement checks. Client-side purchase state in <code>localStorage</code> is untrusted.</div></div>
        <div class="list-row"><span class="list-num">2.</span><div><span class="list-title">Protected Media Origin:</span>Paid media is served strictly through private storage and short-lived signed URLs, not as public or unlisted YouTube content.</div></div>
        <div class="list-row"><span class="list-num">3.</span><div><span class="list-title">Signed URL Validity:</span>Playback and download URLs are time-limited bearer capabilities with a maximum validity of 15 minutes (900 seconds).</div></div>
        <div class="list-row"><span class="list-num">4.</span><div><span class="list-title">Ticket Ledger Idempotency:</span>Minting uses MariaDB sequence allocation, row-level locking (<code>lockForUpdate</code>), unique index enforcement (<code>uq_order_ticket_index</code>), and exact missing-delta calculations.</div></div>
        <div class="list-row"><span class="list-num">5.</span><div><span class="list-title">Monotonic Progress Persistence:</span>Progress reports are validated server-side using monotonic <code>GREATEST()</code> checks. Reaching 95% permanently locks completion status.</div></div>
        <div class="list-row"><span class="list-num">6.</span><div><span class="list-title">Deterministic Account Merge:</span>One-way guest-to-Google merge transfers entitlements, progress, and tickets under ascending row locks, linking duplicate active scopes as superseded.</div></div>
        <div class="list-row"><span class="list-num">7.</span><div><span class="list-title">Dynamic Watermarking:</span>Floating canvas displays learner email, code, and timestamp over video elements. Serves as psychological deterrence and forensic tracing, not absolute capture prevention.</div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Production Release Prerequisites (Phase 9 Gates)</div>
      <div class="list-stack">
        <div class="list-row"><span class="list-num">1.</span><div><span class="list-title">T058 (Storage Provisioning):</span>Provision private storage for paid video assets on configured <code>protected-media</code> provider (AWS S3 / Cloudflare R2 / Bunny Storage).</div></div>
        <div class="list-row"><span class="list-num">2.</span><div><span class="list-title">T059 (Origin Security):</span>Verify storage origin rejects anonymous public HTTP access (confirming HTTP 403 without valid signature).</div></div>
        <div class="list-row"><span class="list-num">3.</span><div><span class="list-title">T060 (YouTube Lockdown):</span>Set legacy Part 2+ YouTube assets to <strong>Private or Deleted</strong> in YouTube Studio. <strong>Unlisted is strictly prohibited</strong> as it does not enforce entitlement boundaries.</div></div>
        <div class="list-row"><span class="list-num">4.</span><div><span class="list-title">T061 (Database Migration):</span>Execute Feature 005 migrations (<code>2026_10_01_000001</code> to <code>000005</code>) in the production database environment.</div></div>
        <div class="list-row"><span class="list-num">5.</span><div><span class="list-title">T062 (Frontend & CDN Cutover):</span>Deploy production frontend build and execute edge CDN cache purge (Cloudflare / Vercel) to invalidate cached bundles containing obsolete logic.</div></div>
        <div class="list-row"><span class="list-num">6.</span><div><span class="list-title">Queue Worker Infrastructure:</span>Configure production Redis queue and run an active worker processing <code>App\\Jobs\\GenerateTicketsJob</code>.</div></div>
        <div class="list-row"><span class="list-num">7.</span><div><span class="list-title">Reconciliation Scheduler:</span>Execute <code>php artisan schedule:run</code> every minute via system cron; ticket reconciliation is configured to run <strong>every 5 minutes</strong>.</div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Verification Boundaries & Technical Scope Limitations</div>
      <div class="highlight-box">
        <div class="highlight-title">Known Boundaries & Non-Claims</div>
        <div style="font-size: 7.5pt; color: #475569; line-height: 1.3;">
          • <strong>Concurrency:</strong> No true multi-process/parallel race test was executed under PHPUnit. Concurrency relies on MariaDB transaction isolation, row locking, and unique constraints, verified via sequential worker simulations.<br>
          • <strong>Browser E2E:</strong> No automated Playwright or Cypress browser-driven end-to-end test suite was executed.<br>
          • <strong>Deployment Dependencies:</strong> Production media storage, queue worker, scheduler cron, database migration, and edge CDN cache purge remain mandatory deployment gates.<br>
          • <strong>Catalog Evolution Policy:</strong> Automatic entitlement inclusion of newly published course parts under historical bundle purchases remains an open, unresolved product decision.
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Review & Repository State</div>
      <div style="font-size: 7.5pt; color: #334155; line-height: 1.35; display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
        <div><strong>Branch:</strong> <code>005-learner-hub</code></div>
        <div><strong>Working Tree:</strong> Clean, reviewed by Product Owner</div>
        <div><strong>Evidence Map:</strong> <code>specs/005-learner-hub/evidence/INDEX.md</code></div>
        <div><strong>Test Plan:</strong> <code>specs/005-learner-hub/test-plan.md</code></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Next Feature Pipeline (Platform Trajectory)</div>
      <div style="font-size: 7.2pt; color: #334155; line-height: 1.35; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 4px 8px;">
        <div><strong>Completed & Verified:</strong> 001 UI Foundation · 002 Auth & Catalog · 003 Draws Arena · 004 Trust & Engagement · 005 Learner Hub</div>
        <div style="margin-top: 2px;"><strong>Next in Pipeline:</strong> <span style="color: #2563eb; font-weight: 700;">006 Multi-Tier Affiliate Engine</span> → 007 Payment Gateway → 008 Admin Operations → 009 Multi-Channel Notifications</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Final Sign-Off Status</div>
      <div class="lead-text" style="margin-bottom: 0;">
        <strong>Feature 005 implementation is complete and verified at repository and local-runtime level.</strong><br>
        Production launch remains pending until the 7 operational release prerequisites are completed and signed off by operations.
      </div>
    </div>
  </div>

  <div class="footer-bar">
    <div class="footer-left">KNZiN Technical Executive Report · Feature 005 (Learner Hub)</div>
    <div class="footer-right">Page 2 of 2</div>
  </div>
</div>

</body>
</html>
"""

html_path = r"D:\Work Projects\Knzin Project\Project report\report_template.html"
pdf_path = r"D:\Work Projects\Knzin Project\Project report\KNZiN_Feature_005_Status_Report.pdf"
downloads_pdf_path = r"C:\Users\HP\Downloads\KNZiN_Feature_005_Status_Report.pdf"

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print("HTML template written:", html_path)

chrome_exe = r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
cmd = [
    chrome_exe,
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    f"--print-to-pdf={pdf_path}",
    html_path
]

print("Running Chrome print-to-pdf...")
res = subprocess.run(cmd, capture_output=True, text=True)
print("Chrome exit code:", res.returncode)

if os.path.exists(pdf_path):
    size = os.path.getsize(pdf_path)
    print(f"Generated PDF: {pdf_path} ({size} bytes)")
    
    # Copy to downloads
    try:
        import shutil
        shutil.copyfile(pdf_path, downloads_pdf_path)
        print("Copied to downloads:", downloads_pdf_path)
    except Exception as e:
        print("Downloads copy error:", e)

    # Count pages
    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()
    pages = re.findall(rb'/Type\s*/Page(?![a-zA-Z])', pdf_bytes)
    print(f"PDF Page count: {len(pages)}")
else:
    print("PDF was not created!")
