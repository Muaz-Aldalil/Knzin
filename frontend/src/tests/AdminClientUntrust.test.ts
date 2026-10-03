/**
 * Admin Client Untrust Invariants (Feature 008)
 * Verifies that administrative authorization is strictly server-authoritative
 * and zero mock capabilities or client overrides exist.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Admin Client Untrust & Server Authority Invariants', () => {
  it('useAdminSession hook fetches capabilities authoritatively from /admin/me', () => {
    const filePath = path.resolve(__dirname, '../hooks/admin/useAdminSession.ts');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.ok(
      content.includes('/admin/me'),
      'useAdminSession must query /admin/me endpoint'
    );
    assert.ok(
      !content.includes('localStorage.getItem(\'knzin_admin_capabilities'),
      'useAdminSession must not read fake capabilities from localStorage'
    );
  });

  it('AdminGuard renders 403 Forbidden state on empty capabilities or missing capability', () => {
    const filePath = path.resolve(__dirname, '../components/admin/AdminGuard.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.ok(
      content.includes('data-testid="admin-403-state"'),
      'AdminGuard must render 403 state when user has no capabilities'
    );
    assert.ok(
      content.includes('data-testid="admin-missing-capability-state"'),
      'AdminGuard must render missing capability state when route capability is absent'
    );
  });

  it('Admin nav items have zero wildcard capabilities', () => {
    const filePath = path.resolve(__dirname, '../lib/admin/nav.ts');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.ok(
      !content.includes('*'),
      'nav.ts must not contain wildcard capabilities'
    );
    assert.ok(
      !content.includes('all_capabilities'),
      'nav.ts must not contain fake all_capabilities string'
    );
  });
});
