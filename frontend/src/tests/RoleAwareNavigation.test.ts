/**
 * Role-aware navigation invariants.
 * The menus are presentation over server-side authorization; these tests pin the contract
 * between the menu models, the real route tree, and the "no client-side authority" rules.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ADMIN_NAV_ITEMS, getAdminNavLabel, getVisibleAdminNavItems } from '../lib/admin/nav.js';
import { USER_MENU_ITEMS } from '../lib/user-menu.js';
import type { AdminCapability } from '../types/admin.js';

const srcRoot = path.resolve(__dirname, '..');
const localeAppDir = path.join(srcRoot, 'app', '[locale]');

function routeDirExists(routePath: string): boolean {
  const clean = routePath.split('#')[0].split('?')[0];
  const segments = clean.split('/').filter(Boolean);
  return fs.existsSync(path.join(localeAppDir, ...segments, 'page.tsx'));
}

function read(rel: string): string {
  return fs.readFileSync(path.join(srcRoot, rel), 'utf8');
}

describe('Normal user menu', () => {
  it('contains exactly the four learner links', () => {
    assert.deepEqual(
      USER_MENU_ITEMS.map((i) => i.id),
      ['learning-hub', 'referral', 'transparency', 'affiliate']
    );
    assert.deepEqual(
      USER_MENU_ITEMS.map((i) => i.labelEn),
      ['My Learning Hub', 'Referral', 'Transparency', 'Affiliate Portal']
    );
  });

  it('only links to routes that already exist (no invented routes)', () => {
    for (const item of USER_MENU_ITEMS) {
      assert.ok(routeDirExists(item.href), `route missing for ${item.id}: ${item.href}`);
    }
  });

  it('never exposes admin destinations', () => {
    for (const item of USER_MENU_ITEMS) {
      assert.ok(!item.href.startsWith('/admin'), `${item.id} points at admin`);
    }
  });
});

describe('Admin menu', () => {
  it('uses the real Feature 008 admin routes', () => {
    assert.deepEqual(
      ADMIN_NAV_ITEMS.map((i) => i.id).sort(),
      ['affiliates', 'approvals', 'audit', 'awards', 'coprizes', 'courses', 'dashboard', 'draws', 'payouts', 'settings', 'users']
    );
    for (const item of ADMIN_NAV_ITEMS) {
      assert.ok(item.path === '/admin' || item.path.startsWith('/admin/'), `${item.id} outside /admin`);
      assert.ok(routeDirExists(item.path), `admin route missing for ${item.id}: ${item.path}`);
    }
  });

  it('has an Arabic and English label for every item', () => {
    for (const item of ADMIN_NAV_ITEMS) {
      assert.notEqual(getAdminNavLabel(item.id, 'en'), item.id);
      assert.notEqual(getAdminNavLabel(item.id, 'ar'), item.id);
    }
  });

  it('filters by capability without granting anything', () => {
    const all: AdminCapability[] = [
      'manage_admin_capabilities',
      'manage_platform_settings',
      'adjudicate_affiliate_coprize',
      'issue_kyc_approval',
      'issue_draw_audit_approval',
      'settle_affiliate_payout',
    ];
    assert.equal(getVisibleAdminNavItems(all).length, ADMIN_NAV_ITEMS.length);

    const payoutOnly = getVisibleAdminNavItems(['settle_affiliate_payout']).map((i) => i.id);
    assert.ok(payoutOnly.includes('dashboard'));
    assert.ok(payoutOnly.includes('payouts'));
    assert.ok(!payoutOnly.includes('users'));
    assert.ok(!payoutOnly.includes('settings'));

    // No capabilities => only unrestricted items; never a privileged one.
    const none = getVisibleAdminNavItems([]).map((i) => i.id);
    assert.deepEqual(none, ['dashboard']);
  });
});

describe('No client-side authorization authority', () => {
  const files = [
    'lib/auth-redirect.ts',
    'lib/admin/access.ts',
    'lib/admin/nav.ts',
    'lib/user-menu.ts',
    'hooks/admin/useAdminAccess.ts',
    'components/layout/HeaderHUD.tsx',
    'components/layout/MobileNavSheet.tsx',
    'app/[locale]/auth/login/page.tsx',
    'app/[locale]/auth/callback/page.tsx',
  ];

  it('does not branch on any email address in navigation/redirect code', () => {
    for (const file of files) {
      const content = read(file);
      const stripped = content.replace(/placeholder="[^"]*"/g, '');
      assert.ok(
        !/(?:===|!==|==|!=)\s*['"][^'"]*@[^'"]*['"]/.test(stripped),
        `${file} compares against an email literal`
      );
      assert.ok(!/\.email\s*(?:===|==)/.test(stripped), `${file} branches on user.email`);
    }
  });

  it('derives admin state from the backend /admin/me probe, not from stored user data', () => {
    const access = read('lib/admin/access.ts');
    assert.ok(access.includes("'/admin/me'"));

    const header = read('components/layout/HeaderHUD.tsx');
    assert.ok(header.includes('useAdminAccess'));
    assert.ok(!/isAdmin\s*=\s*.*(?:localStorage|authUser\.|user\.)/.test(header));
    assert.ok(!/localStorage/.test(header), 'HeaderHUD must not read identity from localStorage directly');
  });

  it('login and callback use the shared sanitizing destination resolver', () => {
    for (const file of ['app/[locale]/auth/login/page.tsx', 'app/[locale]/auth/callback/page.tsx']) {
      const content = read(file);
      assert.ok(content.includes('resolvePostLoginDestination'), `${file} must use the resolver`);
      assert.ok(!/router\.replace\(\s*(?:redirectTarget|target)\b/.test(content), `${file} replaces with a raw redirect`);
    }
  });

  it('admin sign out revokes the session through the shared logout', () => {
    const shell = read('components/admin/AdminShell.tsx');
    assert.ok(shell.includes('useAuth'));
    assert.ok(/await logout\(\)/.test(shell));
  });
});
