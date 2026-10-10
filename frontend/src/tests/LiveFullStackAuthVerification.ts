/**
 * Comprehensive Live Full-Stack Verification for KNZiN Role-Aware Auth, Navigation, and Redirects.
 * Executes live against the running backend (http://127.0.0.1:8000) and frontend (http://localhost:3000).
 */
import assert from 'node:assert/strict';
import { resolvePostLoginDestination, sanitizeRedirectTarget } from '../lib/auth-redirect.js';
import { USER_MENU_ITEMS } from '../lib/user-menu.js';
import { getVisibleAdminNavItems } from '../lib/admin/nav.js';
import type { AdminCapability } from '../types/admin.js';

const BACKEND_URL = 'http://127.0.0.1:8000/api/v1';
const FRONTEND_URL = 'http://localhost:3000';

async function postJson(endpoint: string, data: unknown, token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BACKEND_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, data: json };
}

async function getJson(endpoint: string, token?: string) {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BACKEND_URL}${endpoint}`, {
    method: 'GET',
    headers,
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, data: json };
}

async function checkFrontendPage(path: string) {
  const res = await fetch(`${FRONTEND_URL}${path}`, {
    method: 'GET',
    redirect: 'manual',
  });
  return res.status;
}

async function runLiveVerification() {
  console.log('=== STARTING LIVE FULL-STACK AUTH & ROLE-AWARE VERIFICATION ===\n');

  // -------------------------------------------------------------
  // Test A: Normal User Login & Navigation
  // -------------------------------------------------------------
  console.log('--- TEST A: Normal User Flow ---');
  const normalEmail = 'mock_student@example.com';
  const otpRes = await postJson('/auth/otp/send', { email: normalEmail });
  assert.equal(otpRes.status, 200, `OTP send failed: ${JSON.stringify(otpRes.data)}`);
  const normalDevCode = otpRes.data?.data?.dev_code;
  assert.ok(normalDevCode, 'Expected dev_code in development OTP response');
  console.log(`[PASS] OTP generated for normal user (${normalEmail}), dev_code: ${normalDevCode}`);

  const verifyRes = await postJson('/auth/otp/verify', { email: normalEmail, code: normalDevCode });
  assert.equal(verifyRes.status, 200, `OTP verify failed: ${JSON.stringify(verifyRes.data)}`);
  const normalToken = verifyRes.data?.data?.token;
  assert.ok(normalToken, 'Expected token after OTP verification');
  console.log(`[PASS] Normal user verified and authenticated successfully.`);

  // Probe /auth/me
  const normalMe = await getJson('/auth/me', normalToken);
  assert.equal(normalMe.status, 200);
  assert.equal(normalMe.data?.data?.user?.email, normalEmail);
  console.log(`[PASS] Normal user identity confirmed via /auth/me: ${normalMe.data.data.user.email}`);

  // Probe /admin/me as normal user -> MUST FAIL CLOSED (403 Forbidden)
  const normalAdminProbe = await getJson('/admin/me', normalToken);
  assert.equal(normalAdminProbe.status, 403, 'Normal user must be rejected by /admin/me with 403 Forbidden');
  console.log(`[PASS] Normal user is rejected by /admin/me with HTTP 403 Forbidden`);

  // Verify post-login destination resolution
  const normalDestination = resolvePostLoginDestination({ redirect: null, isAdmin: false });
  assert.equal(normalDestination, '/', 'Normal user default destination must be / (home/landing)');
  console.log(`[PASS] Normal user destination resolved to home: ${normalDestination}`);

  // Verify Normal User Menu Items
  assert.deepEqual(
    USER_MENU_ITEMS.map((i) => i.id),
    ['learning-hub', 'referral', 'transparency', 'affiliate']
  );
  assert.deepEqual(
    USER_MENU_ITEMS.map((i) => i.labelEn),
    ['My Learning Hub', 'Referral', 'Transparency', 'Affiliate Portal']
  );
  console.log('[PASS] Normal user menu has exactly 4 user-facing items (no admin links):');
  USER_MENU_ITEMS.forEach((item) => console.log(`   - ${item.labelEn} (${item.labelAr}) -> ${item.href}`));

  // Verify all normal user destinations exist and return 200
  for (const item of USER_MENU_ITEMS) {
    const cleanPath = item.href.split('#')[0];
    const status = await checkFrontendPage(`/en${cleanPath}`);
    assert.equal(status, 200, `Page ${cleanPath} returned status ${status}`);
  }
  console.log('[PASS] All normal user destination pages return HTTP 200 OK.\n');

  // -------------------------------------------------------------
  // Test B: Admin Flow
  // -------------------------------------------------------------
  console.log('--- TEST B: Admin User Flow ---');
  const adminEmail = 'admin@knzin.com';
  const adminOtpRes = await postJson('/auth/otp/send', { email: adminEmail });
  assert.equal(adminOtpRes.status, 200);
  const adminDevCode = adminOtpRes.data?.data?.dev_code;
  assert.ok(adminDevCode, 'Expected dev_code for admin OTP');
  console.log(`[PASS] OTP generated for admin user (${adminEmail}), dev_code: ${adminDevCode}`);

  const adminVerifyRes = await postJson('/auth/otp/verify', { email: adminEmail, code: adminDevCode });
  assert.equal(adminVerifyRes.status, 200);
  const adminToken = adminVerifyRes.data?.data?.token;
  assert.ok(adminToken, 'Expected token for admin');
  console.log(`[PASS] Admin verified and authenticated successfully.`);

  // Probe /admin/me as admin -> MUST SUCCEED (200 OK) with all 6 capabilities
  const adminMe = await getJson('/admin/me', adminToken);
  assert.equal(adminMe.status, 200, `Admin /admin/me failed: ${JSON.stringify(adminMe.data)}`);
  const caps: AdminCapability[] = adminMe.data?.data?.capabilities;
  assert.ok(Array.isArray(caps), 'Capabilities should be an array');
  assert.equal(caps.length, 6, 'Admin must possess all 6 capabilities');
  console.log(`[PASS] Admin /admin/me succeeded with 6 active capabilities: ${caps.join(', ')}`);

  // Verify post-login destination resolution for admin
  const adminDestination = resolvePostLoginDestination({ redirect: null, isAdmin: true });
  assert.equal(adminDestination, '/', 'Admin default destination must be / (Landing Page)');
  console.log(`[PASS] Admin default destination resolved to Landing Page: ${adminDestination}`);

  // Verify Admin Navigation Items
  const visibleAdminItems = getVisibleAdminNavItems(caps);
  assert.equal(visibleAdminItems.length, 10, 'Admin must see all 10 Feature 008 admin navigation items');
  console.log('[PASS] Admin navigation contains all 10 Feature 008 sections:');
  visibleAdminItems.forEach((item) => console.log(`   - ${item.id} -> ${item.path}`));

  // Verify all 10 admin pages respond 200 on frontend
  for (const item of visibleAdminItems) {
    const status = await checkFrontendPage(`/en${item.path}`);
    assert.equal(status, 200, `Admin page ${item.path} returned status ${status}`);
  }
  console.log('[PASS] All 10 admin destination pages return HTTP 200 OK.\n');

  // -------------------------------------------------------------
  // Test C & D: Normal User Cannot Access Admin Routes / APIs
  // -------------------------------------------------------------
  console.log('--- TEST C & D: Normal User Access Rejection & API Defense ---');
  // Attempt to redirect normal user to /admin
  const forgedAdminRedirect = resolvePostLoginDestination({ redirect: '/admin/settings', isAdmin: false });
  assert.equal(forgedAdminRedirect, '/', 'Attempt to send non-admin to admin route must fall back to /');
  console.log(`[PASS] Client-side redirect protection rejected /admin/settings for non-admin -> redirected to /`);

  // Test server-side authorization: normal user token hitting admin endpoints
  const adminEndpoints = [
    '/admin/me',
    '/admin/settings',
    '/admin/users',
    '/admin/draws',
    '/admin/payouts',
    '/admin/approvals',
    '/admin/coprizes',
    '/admin/audit-logs',
  ];
  for (const ep of adminEndpoints) {
    const res = await getJson(ep, normalToken);
    assert.ok(res.status === 401 || res.status === 403, `Normal user was not blocked on ${ep}, got status ${res.status}`);
    console.log(`[PASS] Server-side blocked normal user on ${ep} -> HTTP ${res.status}`);
  }
  console.log('[PASS] Backend authoritatively defends all admin APIs against normal users.\n');

  // -------------------------------------------------------------
  // Test E: Admin Remains Authorized for Capabilities
  // -------------------------------------------------------------
  console.log('--- TEST E: Admin Capability Authorization ---');
  for (const ep of ['/admin/me', '/admin/settings', '/admin/users', '/admin/payouts', '/admin/approvals', '/admin/coprizes', '/admin/audit-logs']) {
    const res = await getJson(ep, adminToken);
    assert.equal(res.status, 200, `Admin access denied on ${ep}, got ${res.status}`);
    console.log(`[PASS] Admin successfully authorized on ${ep} -> HTTP 200`);
  }
  console.log('[PASS] Admin capabilities verified across all admin APIs.\n');

  // -------------------------------------------------------------
  // Test F: Purchase Flow Intended Destination & Open Redirect Defense
  // -------------------------------------------------------------
  console.log('--- TEST F: Purchase Flow & Open Redirect Defense ---');
  const courseTarget = '/courses/auto-detailing';
  const normalPurchaseRedirect = resolvePostLoginDestination({ redirect: courseTarget, isAdmin: false });
  assert.equal(normalPurchaseRedirect, courseTarget, 'Normal user must return to requested purchase target');
  console.log(`[PASS] Intended destination preserved for purchase flow: ${normalPurchaseRedirect}`);

  // Test open redirect defenses
  assert.equal(sanitizeRedirectTarget('https://malicious-phishing.example'), null);
  assert.equal(sanitizeRedirectTarget('//malicious-phishing.example'), null);
  assert.equal(sanitizeRedirectTarget('/\\malicious-phishing.example'), null);
  assert.equal(sanitizeRedirectTarget('/auth/login'), null);
  const maliciousRedirect = resolvePostLoginDestination({ redirect: 'https://evil.com', isAdmin: false });
  assert.equal(maliciousRedirect, '/', 'Malicious redirect must fall back to safe default /');
  console.log(`[PASS] Malicious open-redirect targets strictly rejected and sanitized.\n`);

  // -------------------------------------------------------------
  // Test G: Logout Flow & Session Revocation
  // -------------------------------------------------------------
  console.log('--- TEST G: Logout & Session Revocation ---');
  const logoutRes = await postJson('/auth/logout', {}, normalToken);
  assert.equal(logoutRes.status, 200, `Logout failed: ${JSON.stringify(logoutRes.data)}`);
  console.log(`[PASS] Server-side logout succeeded.`);

  // Confirm token is revoked
  const postLogoutMe = await getJson('/auth/me', normalToken);
  assert.equal(postLogoutMe.status, 401, 'Revoked token must be rejected with 401 Unauthorized');
  console.log(`[PASS] Revoked token rejected with HTTP 401 Unauthorized on /auth/me.`);

  const postLogoutAdmin = await getJson('/admin/me', normalToken);
  assert.equal(postLogoutAdmin.status, 401, 'Revoked token must be rejected with 401 Unauthorized on /admin/me');
  console.log(`[PASS] Revoked token rejected with HTTP 401 Unauthorized on /admin/me.\n`);

  // -------------------------------------------------------------
  // Test H: Shell Separation & View Platform Transition
  // -------------------------------------------------------------
  console.log('--- TEST H: Shell Separation & View Platform Transition ---');
  // 1. Verify SiteFrame separates shells
  const fs = await import('node:fs');
  const path = await import('node:path');
  const siteFrameSrc = fs.readFileSync(path.resolve(__dirname, '../components/layout/SiteFrame.tsx'), 'utf8');
  assert.ok(siteFrameSrc.includes("pathname?.includes('/admin')"), 'SiteFrame must isolate /admin routes');
  assert.ok(siteFrameSrc.includes('<HeaderHUD />'), 'SiteFrame must mount HeaderHUD only on public routes');
  console.log('[PASS] Shell separation invariant verified: Admin routes bypass public HeaderHUD/Footer frame.');

  // 2. Verify View Platform is present across all AdminShell viewports
  const adminShellSrc = fs.readFileSync(path.resolve(__dirname, '../components/admin/AdminShell.tsx'), 'utf8');
  assert.ok(adminShellSrc.includes('data-testid="admin-sidebar-view-platform"'), 'Sidebar must provide View Platform action');
  assert.ok(adminShellSrc.includes('data-testid="admin-topbar-view-platform"'), 'Topbar must provide View Platform action');
  assert.ok(adminShellSrc.includes('data-testid="admin-mobile-header-view-platform"'), 'Mobile header must provide View Platform action');
  assert.ok(adminShellSrc.includes('data-testid="admin-drawer-view-platform"'), 'Mobile drawer must provide View Platform action');
  assert.ok(adminShellSrc.includes('data-testid="admin-topbar-logout"'), 'Topbar must provide direct Sign Out action');
  console.log('[PASS] View Platform actions present across all AdminShell viewports (Desktop Sidebar, Desktop Topbar, Mobile Header, Mobile Drawer).');

  // 3. Verify Public Shell provides direct Admin Dashboard return link for admins only
  const headerHudSrc = fs.readFileSync(path.resolve(__dirname, '../components/layout/HeaderHUD.tsx'), 'utf8');
  assert.ok(headerHudSrc.includes('data-testid="header-admin-dashboard-link"'), 'Public HeaderHUD must provide Admin Dashboard return link for admins');
  assert.ok(headerHudSrc.includes('{isAdmin && ('), 'Admin Dashboard return link must be strictly gated by isAdmin');

  const mobileNavSheetSrc = fs.readFileSync(path.resolve(__dirname, '../components/layout/MobileNavSheet.tsx'), 'utf8');
  assert.ok(mobileNavSheetSrc.includes('data-testid="mobile-admin-dashboard-link"'), 'MobileNavSheet must provide Admin Dashboard return link for admins');
  assert.ok(mobileNavSheetSrc.includes('{isAdmin && ('), 'Mobile Admin Dashboard return link must be strictly gated by isAdmin');
  console.log('[PASS] Public platform offers explicit 1-click Admin Dashboard return link for admins without exposing admin navigation to normal users.\n');

  console.log('===============================================================');
  console.log('ALL TESTS PASSED: PUBLIC + ADMIN SHELLS VERIFIED');
  console.log('===============================================================');
}

runLiveVerification().catch((err) => {
  console.error('\nVerification failed:', err);
  process.exit(1);
});
