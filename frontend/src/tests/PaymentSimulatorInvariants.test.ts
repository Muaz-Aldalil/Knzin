/**
 * Payment Simulator & Financial Testing Engine Invariants Test
 * Uses native Node.js test runner for deterministic execution.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import arMessages from '../../messages/ar.json' with { type: 'json' };
import enMessages from '../../messages/en.json' with { type: 'json' };

describe('Payment Simulator & Financial Testing Invariants', () => {
  it('translation parity exists for all simulator keys between Arabic and English', () => {
    assert.ok(arMessages.simulator, 'Arabic simulator section exists');
    assert.ok(enMessages.simulator, 'English simulator section exists');

    const arKeys = Object.keys(arMessages.simulator).sort();
    const enKeys = Object.keys(enMessages.simulator).sort();

    assert.deepEqual(arKeys, enKeys, 'All simulator translation keys must match 1:1');
  });

  it('verifies all 1-click simulation action deck keys are present', () => {
    const requiredActionKeys = [
      'btnSuccess',
      'btnSuccessDesc',
      'btnFail',
      'btnFailDesc',
      'btnTimeout',
      'btnTimeoutDesc',
      'btnTamper',
      'btnTamperDesc',
      'btnReplay',
      'btnReplayDesc',
      'btnRefund',
      'btnRefundDesc',
      'btnReconcile',
      'btnReconcileDesc',
    ];

    for (const key of requiredActionKeys) {
      assert.ok((arMessages.simulator as Record<string, string>)[key], `Arabic key ${key} must exist`);
      assert.ok((enMessages.simulator as Record<string, string>)[key], `English key ${key} must exist`);
    }
  });

  it('verifies developer sandbox hub scenario keys are present', () => {
    const requiredHubKeys = [
      'seedBundleReferral',
      'seedPartReferral',
      'seedBundleClean',
      'seedSelfReferral',
      'fastForwardTitle',
      'fastForwardBtn',
      'coPrizeTitle',
      'coPrizeBtn',
      'recentTransactionsTitle',
    ];

    for (const key of requiredHubKeys) {
      assert.ok((arMessages.simulator as Record<string, string>)[key], `Arabic hub key ${key} must exist`);
      assert.ok((enMessages.simulator as Record<string, string>)[key], `English hub key ${key} must exist`);
    }
  });

  it('validates 25% sales commission arithmetic and integer cents consistency', () => {
    const commissionBps = 2500; // 25.00%
    const bundlePriceCents = 1000; // $10.00
    const partPriceCents = 200; // $2.00

    const bundleCommissionCents = Math.floor((bundlePriceCents * commissionBps) / 10000);
    const partCommissionCents = Math.floor((partPriceCents * commissionBps) / 10000);

    assert.equal(bundleCommissionCents, 250, 'Bundle commission must be exactly 250 cents ($2.50)');
    assert.equal(partCommissionCents, 50, 'Part commission must be exactly 50 cents ($0.50)');
    assert.equal(Number.isInteger(bundleCommissionCents), true);
    assert.equal(Number.isInteger(partCommissionCents), true);
  });

  it('validates 40% co-prize marketing pool arithmetic', () => {
    const coPrizeRateBps = 4000; // 40.00%
    const grandPrizeValuationCents = 5000000; // $50,000.00

    const coPrizeCents = Math.floor((grandPrizeValuationCents * coPrizeRateBps) / 10000);

    assert.equal(coPrizeCents, 2000000, '40% Co-Prize on $50,000 must equal $20,000 (2,000,000 cents)');
    assert.equal(Number.isInteger(coPrizeCents), true);
  });
});
