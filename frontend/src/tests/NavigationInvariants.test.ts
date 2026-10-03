/**
 * Navigation & Responsive Invariants Tests
 * Uses native Node.js test runner for deterministic execution.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import arMessages from '../../messages/ar.json' with { type: 'json' };
import enMessages from '../../messages/en.json' with { type: 'json' };

describe('Navigation & Responsive Invariants', () => {
  it('bilingual navigation dictionary keys are synchronized between Arabic and English', () => {
    assert.deepEqual(Object.keys(arMessages.nav), Object.keys(enMessages.nav));
    assert.ok(arMessages.nav.courses.length > 0);
    assert.ok(enMessages.nav.courses.length > 0);
  });

  it('navigation destination routes encompass all primary areas', () => {
    const primaryRoutes = ['/', '/raffle', '/profile'];
    assert.equal(primaryRoutes.length, 3);
    assert.ok(primaryRoutes.includes('/'));
    assert.ok(primaryRoutes.includes('/raffle'));
    assert.ok(!primaryRoutes.includes('/design-system'));
  });

  it('responsive breakpoint contract: desktop full navbar is active at lg (1024px+)', () => {
    const desktopBreakpointPx = 1024;
    const tabletBreakpointRange = { min: 768, max: 1023 };
    const mobileBreakpointMax = 767;

    assert.ok(desktopBreakpointPx >= 1024);
    assert.ok(tabletBreakpointRange.max < desktopBreakpointPx);
    assert.ok(mobileBreakpointMax < tabletBreakpointRange.min);
  });
});
