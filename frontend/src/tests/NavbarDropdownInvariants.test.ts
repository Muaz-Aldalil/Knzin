/**
 * Navbar Dropdown, Language Placement, and How It Works Invariants Test.
 * Pins the structural contracts and ordering required for:
 * 1. Public Platform Navbar Dropdown (Theme -> Language -> How It Works -> User/Guest Actions)
 * 2. Admin Platform Navbar Shell & Dropdown (Theme -> Language -> How It Works -> Admin Account -> View Platform -> Sign Out)
 * 3. Mobile Sheet and Drawer ordering consistency.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const srcRoot = path.resolve(__dirname, '..');

function read(rel: string): string {
  return fs.readFileSync(path.join(srcRoot, rel), 'utf8');
}

describe('Public Platform Dropdown Invariants', () => {
  const headerHud = read('components/layout/HeaderHUD.tsx');

  it('orders dropdown items strictly: Theme -> Language -> How It Works', () => {
    const themeIdx = headerHud.indexOf('toggleTheme');
    const langIdx = headerHud.indexOf('toggleLanguage');
    const howItWorksIdx = headerHud.indexOf('setIsHowItWorksOpen(true)');

    assert.ok(themeIdx !== -1, 'Theme toggle must be in dropdown');
    assert.ok(langIdx !== -1, 'Language toggle must be in dropdown');
    assert.ok(howItWorksIdx !== -1, 'How It Works trigger must be in dropdown');

    assert.ok(themeIdx < langIdx, 'Language toggle must be placed underneath Theme toggle');
    assert.ok(langIdx < howItWorksIdx, 'How It Works must be placed underneath Language toggle');
  });

  it('mounts HowItWorksModal in HeaderHUD and controls it via isHowItWorksOpen state', () => {
    assert.ok(headerHud.includes('<HowItWorksModal'));
    assert.ok(headerHud.includes('open={isHowItWorksOpen}'));
    assert.ok(headerHud.includes('onOpenChange={setIsHowItWorksOpen}'));
  });

  it('does not expose Admin Dashboard link to non-admins', () => {
    assert.ok(headerHud.includes('{isAdmin && ('));
    assert.ok(headerHud.includes('data-testid="header-admin-dashboard-link"'));
  });
});

describe('Admin Application Shell & Dropdown Invariants', () => {
  const adminShell = read('components/admin/AdminShell.tsx');

  it('provides dedicated Admin Dropdown with testid admin-topbar-profile-trigger', () => {
    assert.ok(adminShell.includes('data-testid="admin-topbar-profile-trigger"'));
  });

  it('Admin dropdown orders items strictly: Theme -> Language -> How It Works -> Admin Details -> View Platform -> Sign Out', () => {
    const themeIdx = adminShell.indexOf('data-testid="admin-dropdown-theme"');
    const langIdx = adminShell.indexOf('data-testid="admin-dropdown-language"');
    const howItWorksIdx = adminShell.indexOf('data-testid="admin-dropdown-how-it-works"');
    const dashboardIdx = adminShell.indexOf('data-testid="admin-dropdown-dashboard"');
    const viewPlatformIdx = adminShell.indexOf('data-testid="admin-dropdown-view-platform"');
    const logoutIdx = adminShell.indexOf('data-testid="admin-dropdown-logout"');

    assert.ok(themeIdx !== -1, 'Admin dropdown must have theme toggle');
    assert.ok(langIdx !== -1, 'Admin dropdown must have language toggle');
    assert.ok(howItWorksIdx !== -1, 'Admin dropdown must have How It Works action');
    assert.ok(dashboardIdx !== -1, 'Admin dropdown must have Dashboard return shortcut');
    assert.ok(adminShell.includes('لوحة التحكم الإدارية'), 'Admin dropdown must use canonical Arabic label');
    assert.ok(viewPlatformIdx !== -1, 'Admin dropdown must have View Platform shortcut');
    assert.ok(logoutIdx !== -1, 'Admin dropdown must have Sign Out action');

    assert.ok(themeIdx < langIdx, 'Language toggle must be directly underneath Theme toggle in Admin dropdown');
    assert.ok(langIdx < howItWorksIdx, 'How It Works must be directly underneath Language toggle in Admin dropdown');
    assert.ok(howItWorksIdx < dashboardIdx, 'Dashboard shortcut must follow How It Works');
    assert.ok(dashboardIdx < viewPlatformIdx, 'View Platform must follow Dashboard shortcut');
    assert.ok(viewPlatformIdx < logoutIdx, 'Sign Out must be at the bottom of the dropdown');
  });

  it('mounts reusable HowItWorksModal in AdminShell for full administrative access', () => {
    assert.ok(adminShell.includes('<HowItWorksModal'));
    assert.ok(adminShell.includes('open={isHowItWorksOpen}'));
    assert.ok(adminShell.includes('onOpenChange={setIsHowItWorksOpen}'));
  });

  it('preserves View Platform actions across desktop and mobile admin viewports', () => {
    assert.ok(adminShell.includes('data-testid="admin-sidebar-view-platform"'));
    assert.ok(adminShell.includes('data-testid="admin-topbar-view-platform"'));
    assert.ok(adminShell.includes('data-testid="admin-mobile-header-view-platform"'));
    assert.ok(adminShell.includes('data-testid="admin-drawer-view-platform"'));
  });

  it('preserves direct Sign Out actions across all admin surfaces', () => {
    assert.ok(adminShell.includes('data-testid="admin-sidebar-logout"'));
    assert.ok(adminShell.includes('data-testid="admin-topbar-logout"'));
    assert.ok(adminShell.includes('data-testid="admin-drawer-logout"'));
    assert.ok(adminShell.includes('data-testid="admin-dropdown-logout"'));
  });
});

describe('Mobile Sheet Preferences Ordering Invariants', () => {
  const mobileSheet = read('components/layout/MobileNavSheet.tsx');

  it('stacks Theme toggle above Language toggle in mobile preferences', () => {
    const themeIdx = mobileSheet.indexOf('data-testid="mobile-sheet-theme-toggle"');
    const langIdx = mobileSheet.indexOf('data-testid="mobile-sheet-language-toggle"');

    assert.ok(themeIdx !== -1, 'Mobile sheet must contain mobile-sheet-theme-toggle');
    assert.ok(langIdx !== -1, 'Mobile sheet must contain mobile-sheet-language-toggle');
    assert.ok(themeIdx < langIdx, 'Language toggle must be placed directly underneath Theme toggle on mobile');
  });
});
