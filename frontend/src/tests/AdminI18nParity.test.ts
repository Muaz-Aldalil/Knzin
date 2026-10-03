/**
 * Admin i18n Dictionary Parity Tests (Feature 008)
 * Asserts 100% key parity between ar.json and en.json for the admin namespace.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getNestedKeys(obj: Record<string, any>, prefix = ''): string[] {
  let keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys = keys.concat(getNestedKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

describe('Admin i18n Localization Parity', () => {
  it('ar.json and en.json contain identical keys in admin namespace', () => {
    const arPath = path.resolve(__dirname, '../../messages/ar.json');
    const enPath = path.resolve(__dirname, '../../messages/en.json');

    const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));
    const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

    assert.ok(ar.admin, 'ar.json must contain admin namespace');
    assert.ok(en.admin, 'en.json must contain admin namespace');

    const arAdminKeys = getNestedKeys(ar.admin).sort();
    const enAdminKeys = getNestedKeys(en.admin).sort();

    assert.deepEqual(
      arAdminKeys,
      enAdminKeys,
      `Key parity mismatch between ar.json and en.json in admin namespace.`
    );
  });

  it('admin.nav keys cover all standard navigation items', () => {
    const enPath = path.resolve(__dirname, '../../messages/en.json');
    const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

    const requiredNavKeys = [
      'dashboard',
      'settings',
      'affiliates',
      'payouts',
      'coprizes',
      'approvals',
      'draws',
      'awards',
      'users',
      'audit',
    ];

    for (const key of requiredNavKeys) {
      assert.ok(
        en.admin.nav[key],
        `admin.nav must define key '${key}'`
      );
    }
  });
});
