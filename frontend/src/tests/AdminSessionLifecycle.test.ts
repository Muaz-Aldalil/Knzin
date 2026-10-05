/**
 * Admin Session Lifecycle, Expiration Invariants, and Draft Preservation Test Suite.
 *
 * Pins the structural contracts and behavior for:
 * 1. Admin Dropdown Dashboard Link (TestID and canonical Arabic label)
 * 2. AdminSessionTimeoutModal Component & 60-Second Warning
 * 3. Authoritative Session Expiration & Multi-Tab Synchronization
 * 4. Client-Side Form Draft Preservation and Safe Login Redirection
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const srcRoot = path.resolve(__dirname, '..');

function read(rel: string): string {
  return fs.readFileSync(path.join(srcRoot, rel), 'utf8');
}

describe('Admin Dropdown Dashboard Invariants', () => {
  const adminShell = read('components/admin/AdminShell.tsx');
  const navTs = read('lib/admin/nav.ts');
  const arJson = read('../messages/ar.json');

  it('renders dashboard link with testid and canonical Arabic label in AdminShell', () => {
    assert.ok(
      adminShell.includes('data-testid="admin-dropdown-dashboard"'),
      'Admin dropdown must include data-testid="admin-dropdown-dashboard"'
    );
    assert.ok(
      adminShell.includes('لوحة التحكم الإدارية'),
      'Admin dropdown must use canonical Arabic label لوحة التحكم الإدارية'
    );
    assert.ok(
      !adminShell.includes('لوحة المراقبة'),
      'AdminShell must not use mistranslated phrase لوحة المراقبة for the dashboard'
    );
  });

  it('synchronizes canonical Arabic label across nav.ts and ar.json', () => {
    assert.ok(
      navTs.includes("dashboard: { ar: 'لوحة التحكم الإدارية'"),
      'ADMIN_NAV_LABELS.dashboard.ar must be لوحة التحكم الإدارية'
    );
    assert.ok(
      arJson.includes('"dashboard": "لوحة التحكم الإدارية"'),
      'messages/ar.json must map admin.nav.dashboard to لوحة التحكم الإدارية'
    );
  });
});

describe('Admin Session Timeout Modal & Warning Invariants', () => {
  const adminShell = read('components/admin/AdminShell.tsx');
  const modalSrc = read('components/admin/AdminSessionTimeoutModal.tsx');
  const hookSrc = read('hooks/admin/useAdminSession.ts');

  it('mounts AdminSessionTimeoutModal in AdminShell layout', () => {
    assert.ok(
      adminShell.includes('<AdminSessionTimeoutModal'),
      'AdminShell must mount AdminSessionTimeoutModal'
    );
    assert.ok(
      adminShell.includes('isOpen={isWarning}'),
      'AdminShell must pass isWarning to modal isOpen state'
    );
  });

  it('enforces exactly 60 seconds (1 minute) warning threshold in useAdminSession', () => {
    assert.ok(
      hookSrc.includes('WARNING_THRESHOLD_SECONDS = 60'),
      'useAdminSession must define WARNING_THRESHOLD_SECONDS = 60 (1 minute)'
    );
    assert.ok(
      hookSrc.includes('remainingSeconds <= WARNING_THRESHOLD_SECONDS'),
      'isWarning must trigger when remainingSeconds <= 60'
    );
  });

  it('modal provides countdown display, extend session, and signout buttons', () => {
    assert.ok(
      modalSrc.includes('data-testid="admin-session-timeout-modal"'),
      'Modal must provide root testid admin-session-timeout-modal'
    );
    assert.ok(
      modalSrc.includes('data-testid="admin-session-countdown-display"'),
      'Modal must provide countdown display testid'
    );
    assert.ok(
      modalSrc.includes('data-testid="admin-session-extend-btn"'),
      'Modal must provide extend button with testid'
    );
    assert.ok(
      modalSrc.includes('data-testid="admin-session-signout-btn"'),
      'Modal must provide sign out button with testid'
    );
  });

  it('modal includes bilingual 1-minute expiration copy', () => {
    assert.ok(
      modalSrc.includes('جلسة الإدارة على وشك الانتهاء خلال دقيقة واحدة'),
      'Modal must include canonical Arabic 1-minute warning title'
    );
    assert.ok(
      modalSrc.includes('Admin Session Will Expire in 1 Minute'),
      'Modal must include English 1-minute warning title'
    );
  });
});

describe('Multi-Tab Session Synchronization & Extension Invariants', () => {
  const hookSrc = read('hooks/admin/useAdminSession.ts');
  const accessSrc = read('lib/admin/access.ts');

  it('provides extendAdminSession API calling POST /admin/session/extend', () => {
    assert.ok(
      accessSrc.includes("'/admin/session/extend'"),
      'access.ts must call /admin/session/extend'
    );
    assert.ok(
      accessSrc.includes("method: 'POST'"),
      'extendAdminSession must perform a POST request'
    );
  });

  it('broadcasts extension timestamp to localStorage and listens on storage events', () => {
    assert.ok(
      hookSrc.includes('ADMIN_SESSION_EXTENDED_KEY'),
      'hook must define ADMIN_SESSION_EXTENDED_KEY'
    );
    assert.ok(
      hookSrc.includes("addEventListener('storage'"),
      'hook must register storage event listener for cross-tab sync'
    );
    assert.ok(
      hookSrc.includes('query.refetch()'),
      'hook must refetch session on cross-tab extension notification'
    );
  });
});

describe('Client-Side Draft Preservation & Safe Redirection Invariants', () => {
  const draftSrc = read('lib/admin/draft-preservation.ts');
  const bannerSrc = read('components/admin/DraftRestoreBanner.tsx');
  const adminShell = read('components/admin/AdminShell.tsx');

  it('preserves form fields client-side without touching the backend database', () => {
    assert.ok(
      draftSrc.includes('saveCurrentPageDraft'),
      'draft-preservation.ts must export saveCurrentPageDraft'
    );
    assert.ok(
      draftSrc.includes('sessionStorage.setItem'),
      'draft preservation must store into browser sessionStorage'
    );
    assert.ok(
      draftSrc.includes(':not([type="password"])'),
      'draft preservation must never capture password fields'
    );
  });

  it('AdminShell captures draft and redirects to login with return target on expiry', () => {
    assert.ok(
      adminShell.includes('saveCurrentPageDraft(window.location.pathname)'),
      'AdminShell must save current page draft when session expires'
    );
    assert.ok(
      adminShell.includes('/auth/login?redirect='),
      'AdminShell must redirect to login with sanitized redirect target on expiry'
    );
  });

  it('mounts DraftRestoreBanner in AdminShell main container', () => {
    assert.ok(
      adminShell.includes('<DraftRestoreBanner />'),
      'AdminShell must mount DraftRestoreBanner inside main content area'
    );
    assert.ok(
      bannerSrc.includes('data-testid="admin-draft-restore-banner"'),
      'DraftRestoreBanner must include testid admin-draft-restore-banner'
    );
    assert.ok(
      bannerSrc.includes('data-testid="admin-draft-restore-btn"'),
      'DraftRestoreBanner must include restore action button'
    );
  });
});
