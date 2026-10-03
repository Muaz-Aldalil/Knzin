/**
 * Admin Navigation & Capability Matrix Tests (Feature 008 - Task T046)
 * Verifies that each capability strictly controls nav visibility and access rules.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ADMIN_NAV_ITEMS } from '../lib/admin/nav.js';
import { hasCapability, hasAllCapabilities } from '../lib/admin/capabilities.js';
import { AdminCapability } from '../types/admin.js';

describe('Admin Navigation & Capability Invariants', () => {
  it('hasCapability handles single, multiple, and empty capability sets correctly', () => {
    const granted: AdminCapability[] = ['settle_affiliate_payout', 'manage_platform_settings'];

    assert.equal(hasCapability(granted, 'settle_affiliate_payout'), true);
    assert.equal(hasCapability(granted, 'manage_platform_settings'), true);
    assert.equal(hasCapability(granted, 'manage_admin_capabilities'), false);

    // Any-of array check
    assert.equal(
      hasCapability(granted, ['manage_admin_capabilities', 'settle_affiliate_payout']),
      true
    );
    assert.equal(
      hasCapability(granted, ['manage_admin_capabilities', 'adjudicate_affiliate_coprize']),
      false
    );

    // Empty or undefined
    assert.equal(hasCapability([], 'settle_affiliate_payout'), false);
    assert.equal(hasCapability(undefined, 'settle_affiliate_payout'), false);
  });

  it('nav item for Payouts strictly requires settle_affiliate_payout', () => {
    const payoutsItem = ADMIN_NAV_ITEMS.find((item) => item.id === 'payouts');
    assert.ok(payoutsItem, 'payouts nav item must exist');
    assert.deepEqual(payoutsItem.requiredCapabilities, ['settle_affiliate_payout']);
  });

  it('nav item for Settings strictly requires manage_platform_settings', () => {
    const settingsItem = ADMIN_NAV_ITEMS.find((item) => item.id === 'settings');
    assert.ok(settingsItem, 'settings nav item must exist');
    assert.deepEqual(settingsItem.requiredCapabilities, ['manage_platform_settings']);
  });

  it('nav item for CoPrizes strictly requires adjudicate_affiliate_coprize', () => {
    const coprizesItem = ADMIN_NAV_ITEMS.find((item) => item.id === 'coprizes');
    assert.ok(coprizesItem, 'coprizes nav item must exist');
    assert.deepEqual(coprizesItem.requiredCapabilities, ['adjudicate_affiliate_coprize']);
  });

  it('nav item for Users strictly requires manage_admin_capabilities', () => {
    const usersItem = ADMIN_NAV_ITEMS.find((item) => item.id === 'users');
    assert.ok(usersItem, 'users nav item must exist');
    assert.deepEqual(usersItem.requiredCapabilities, ['manage_admin_capabilities']);
  });

  it('filtering ADMIN_NAV_ITEMS isolates operator with single capability', () => {
    const settleOnly: AdminCapability[] = ['settle_affiliate_payout'];

    const visibleItems = ADMIN_NAV_ITEMS.filter((item) => {
      if (!item.requiredCapabilities || item.requiredCapabilities.length === 0) return true;
      return hasCapability(settleOnly, item.requiredCapabilities);
    }).map((item) => item.id);

    // Must see dashboard, affiliates (since affiliates allows settle_affiliate_payout), payouts
    assert.ok(visibleItems.includes('dashboard'));
    assert.ok(visibleItems.includes('affiliates'));
    assert.ok(visibleItems.includes('payouts'));

    // Must NOT see settings, coprizes, approvals, draws, awards, users, audit
    assert.equal(visibleItems.includes('settings'), false);
    assert.equal(visibleItems.includes('coprizes'), false);
    assert.equal(visibleItems.includes('approvals'), false);
    assert.equal(visibleItems.includes('draws'), false);
    assert.equal(visibleItems.includes('awards'), false);
    assert.equal(visibleItems.includes('users'), false);
    assert.equal(visibleItems.includes('audit'), false);
  });
});
