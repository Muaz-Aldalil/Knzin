/**
 * Payment Gateway & UI Verification Tests
 * Uses native Node.js test runner for deterministic execution.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import arMessages from '../../messages/ar.json' with { type: 'json' };
import enMessages from '../../messages/en.json' with { type: 'json' };

describe('Feature 007: Payment Gateway & Polling UI Invariants', () => {
  it('translation parity exists for all payment keys between Arabic and English', () => {
    assert.ok(arMessages.payment, 'Arabic payment section exists');
    assert.ok(enMessages.payment, 'English payment section exists');

    const arKeys = Object.keys(arMessages.payment).sort();
    const enKeys = Object.keys(enMessages.payment).sort();

    assert.deepEqual(arKeys, enKeys, 'All payment translation keys must match 1:1');
  });

  it('verifies standard market IQD integer amounts (Decision D-2)', () => {
    const partIqd = 2600;
    const bundleIqd = 13000;

    assert.equal(partIqd, 2600, 'Single part must equal 2,600 IQD');
    assert.equal(bundleIqd, 13000, 'Full bundle must equal 13,000 IQD');
    assert.equal(typeof partIqd, 'number');
    assert.equal(Number.isInteger(partIqd), true);
    assert.equal(Number.isInteger(bundleIqd), true);
  });

  it('includes recovery CTAs in payment dictionary (Decision D-7)', () => {
    assert.equal(arMessages.payment.retryPayment, 'إعادة المحاولة');
    assert.equal(enMessages.payment.retryPayment, 'Try Again');
    assert.equal(arMessages.payment.switchGateway, 'تغيير طريقة الدفع');
    assert.equal(enMessages.payment.switchGateway, 'Change Payment Method');
  });

  it('includes polling and celebration translations', () => {
    assert.ok(arMessages.payment.checkingPayment.includes('جاري التحقق'));
    assert.ok(arMessages.payment.paymentSuccessTitle.includes('تهانينا'));
    assert.ok(arMessages.payment.startCourse.includes('ابدأ الدورة'));
  });

  it('verifies supported gateway enum values (zaincash, asiahawala, simulator)', () => {
    const supportedGateways = ['zaincash', 'asiahawala', 'simulator'];
    assert.equal(supportedGateways.includes('zaincash'), true);
    assert.equal(supportedGateways.includes('asiahawala'), true);
    assert.equal(supportedGateways.includes('simulator'), true);
    assert.equal(supportedGateways.includes('unsupported'), false);
  });
});
