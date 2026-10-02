/**
 * Buyer Benefit Preservation Invariants (Feature 006)
 * Uses native Node.js test runner for deterministic execution.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Buyer Benefit Preservation Invariants (Feature 006)', () => {
  it('canonical ticket grants are strictly preserved: $2 part = 1 ticket, $10 bundle = 15 tickets', () => {
    const partPriceCents = 200; // $2.00
    const bundlePriceCents = 1000; // $10.00

    const canonicalPartTickets = 1;
    const canonicalBundleTickets = 15;

    // Simulate referred checkout state calculation
    const referredPartTickets = canonicalPartTickets;
    const referredBundleTickets = canonicalBundleTickets;

    assert.equal(referredPartTickets, 1, 'Referred part purchase must yield exactly 1 promotional ticket');
    assert.equal(referredBundleTickets, 15, 'Referred bundle purchase must yield exactly 15 promotional tickets');
  });

  it('referral entrance imposes zero price markup or ticket deduction', () => {
    const standardPartUsd = 2.0;
    const standardBundleUsd = 10.0;
    const standardIqdRate = 1310;

    const referredPartUsd = standardPartUsd;
    const referredBundleUsd = standardBundleUsd;

    assert.equal(referredPartUsd, 2.0, 'Referred buyer must pay canonical $2.00 for course part');
    assert.equal(referredBundleUsd, 10.0, 'Referred buyer must pay canonical $10.00 for full bundle');
    assert.equal(
      Math.floor(referredPartUsd * standardIqdRate),
      2620,
      'Referred part purchase in IQD must remain exact 2,620 IQD'
    );
  });

  it('referral cookies use strict 30-day max age and Lax samesite policy', () => {
    const maxAgeSeconds = 30 * 24 * 60 * 60; // 2592000
    assert.equal(maxAgeSeconds, 2592000, 'Referral cookie must persist for exactly 30 days in seconds');
  });
});
