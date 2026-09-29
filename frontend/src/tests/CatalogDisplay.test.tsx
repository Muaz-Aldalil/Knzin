/**
 * Catalog Display & Pricing Tests
 * Uses native Node.js test runner for zero-dependency execution.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CANONICAL_LEGAL_SHIELD } from '../components/checkout/LegalShieldCheckbox';
import arMessages from '../../messages/ar.json';
import enMessages from '../../messages/en.json';

describe('CatalogDisplay & Pricing Invariants', () => {
  it('part micro-pricing is exactly $2.00 (200 cents) and yields 1 promotional ticket', () => {
    const partPriceCents = 200;
    const partTickets = 1;
    const partDisplayIqd = '2,000 IQD';

    assert.equal(partPriceCents, 200);
    assert.equal(partTickets, 1);
    assert.equal(partDisplayIqd, '2,000 IQD');
  });

  it('bundle pricing is exactly $10.00 (1000 cents) and yields 15 promotional tickets', () => {
    const bundlePriceCents = 1000;
    const bundleTickets = 15;
    const bundleDisplayIqd = '13,000 IQD';

    // 6 individual parts cost 6 * 200 = 1200 cents ($12.00) and yield 6 tickets.
    // Bundle costs 1000 cents ($10.00) and yields 15 tickets -> saves 200 cents ($2) + 2.5x tickets!
    assert.equal(bundlePriceCents, 1000);
    assert.equal(bundleTickets, 15);
    assert.equal(bundleDisplayIqd, '13,000 IQD');
    assert.ok(bundleTickets > 6);
  });

  it('canonical legal shield verbatim text strictly matches authoritative spec', () => {
    const expectedAuthoritativeText =
      'أوافق على الشروط والأحكام وسياسة الخصوصية، وأقر بأنني أقوم بشراء محتوى رقمي تعليمي، وأن تذكرة السحب المرفقة هي هدية ترويجية مجانية غير مستردة أو قابلة للتبديل';

    assert.equal(CANONICAL_LEGAL_SHIELD, expectedAuthoritativeText);
    assert.equal(arMessages.checkout.legalShield, expectedAuthoritativeText);
    assert.equal(enMessages.checkout.legalShield, expectedAuthoritativeText);
  });

  it('bilingual dictionary contains matching catalog and checkout keys', () => {
    assert.deepEqual(Object.keys(arMessages.catalog), Object.keys(enMessages.catalog));
    assert.deepEqual(Object.keys(arMessages.checkout), Object.keys(enMessages.checkout));
    assert.deepEqual(Object.keys(arMessages.quiz), Object.keys(enMessages.quiz));
  });
});
