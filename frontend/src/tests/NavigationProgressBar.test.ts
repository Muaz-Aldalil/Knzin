/**
 * Navigation Progress Bar Invariants & Directionality Tests
 * Verifies LTR/RTL origin mapping, internal vs external URL filtering,
 * keyboard/click modifiers, and trickling invariants.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  shouldTriggerNavigation,
  getTransformOrigin,
  getNextTrickleProgress,
} from '../lib/navigation/progress-utils.js';

describe('Navigation Progress Bar Invariants', () => {
  const currentUrl = new URL('https://knzin.iq/ar/courses');

  describe('Directionality & RTL/LTR Mapping', () => {
    it('maps Arabic (ar) locale to right transform-origin (right-to-left expansion)', () => {
      assert.equal(getTransformOrigin('ar', false), 'right');
      assert.equal(getTransformOrigin('ar', true), 'right');
    });

    it('maps English (en) locale to left transform-origin (left-to-right expansion)', () => {
      assert.equal(getTransformOrigin('en', false), 'left');
    });

    it('honors document RTL direction even when locale is fallback', () => {
      assert.equal(getTransformOrigin('other', true), 'right');
      assert.equal(getTransformOrigin('other', false), 'left');
    });
  });

  describe('Internal Navigation Detection & Exclusion Filters', () => {
    it('accepts genuine internal route changes', () => {
      const allowed = shouldTriggerNavigation({
        currentUrl,
        targetHref: '/ar/courses/freelance-design',
        isModifiedEvent: false,
        button: 0,
        defaultPrevented: false,
      });
      assert.equal(allowed, true);

      const allowedAbsoluteInternal = shouldTriggerNavigation({
        currentUrl,
        targetHref: 'https://knzin.iq/ar/profile',
        isModifiedEvent: false,
        button: 0,
        defaultPrevented: false,
      });
      assert.equal(allowedAbsoluteInternal, true);
    });

    it('rejects external URLs', () => {
      const externalUrl = shouldTriggerNavigation({
        currentUrl,
        targetHref: 'https://youtube.com/watch?v=123',
        isModifiedEvent: false,
        button: 0,
        defaultPrevented: false,
      });
      assert.equal(externalUrl, false);

      const externalDomain = shouldTriggerNavigation({
        currentUrl,
        targetHref: 'https://wa.me/9647800000000',
        isModifiedEvent: false,
        button: 0,
        defaultPrevented: false,
      });
      assert.equal(externalDomain, false);
    });

    it('rejects same-page hash jumps and anchor links', () => {
      const hashJump = shouldTriggerNavigation({
        currentUrl,
        targetHref: '/ar/courses#part-1-curriculum',
        isModifiedEvent: false,
        button: 0,
        defaultPrevented: false,
      });
      assert.equal(hashJump, false);

      const localHash = shouldTriggerNavigation({
        currentUrl,
        targetHref: '#faq',
        isModifiedEvent: false,
        button: 0,
        defaultPrevented: false,
      });
      assert.equal(localHash, false);

      // Protocol Section 10 & 14: Unprefixed relative anchor on home page
      const homeUrl = new URL('https://knzin.iq/ar');
      const unprefixedAnchor = shouldTriggerNavigation({
        currentUrl: homeUrl,
        targetHref: '/#catalog',
        isModifiedEvent: false,
        button: 0,
        defaultPrevented: false,
      });
      assert.equal(unprefixedAnchor, false, 'Unprefixed same-page anchor should not trigger progress');
    });

    it('accepts cross-route section navigation (Protocol Section 10 & 15)', () => {
      const homeUrl = new URL('https://knzin.iq/ar');
      const crossRouteSection = shouldTriggerNavigation({
        currentUrl: homeUrl,
        targetHref: '/ar/raffle#hall-of-fame',
        isModifiedEvent: false,
        button: 0,
        defaultPrevented: false,
      });
      assert.equal(crossRouteSection, true, 'Cross-route section link should trigger progress');

      const raffleToCatalog = shouldTriggerNavigation({
        currentUrl: new URL('https://knzin.iq/ar/raffle'),
        targetHref: '/#catalog',
        isModifiedEvent: false,
        button: 0,
        defaultPrevented: false,
      });
      assert.equal(raffleToCatalog, true, 'Raffle to home catalog link should trigger progress');
    });

    it('accepts locale-switch navigation on the same logical page (Protocol Section 12)', () => {
      const localeSwitch = shouldTriggerNavigation({
        currentUrl: new URL('https://knzin.iq/ar/raffle'),
        targetHref: '/en/raffle',
        isModifiedEvent: false,
        button: 0,
        defaultPrevented: false,
      });
      assert.equal(localeSwitch, true, 'Locale switch must never be classified as a no-op');
    });

    it('rejects clicking the currently active page URL (no-op)', () => {
      const samePageClick = shouldTriggerNavigation({
        currentUrl,
        targetHref: '/ar/courses',
        isModifiedEvent: false,
        button: 0,
        defaultPrevented: false,
      });
      assert.equal(samePageClick, false);
    });

    it('rejects modified clicks (Ctrl, Cmd, Shift, Alt)', () => {
      const ctrlClick = shouldTriggerNavigation({
        currentUrl,
        targetHref: '/ar/courses/phone-repair',
        isModifiedEvent: true, // Ctrl / Cmd was held
        button: 0,
        defaultPrevented: false,
      });
      assert.equal(ctrlClick, false);
    });

    it('rejects non-primary mouse buttons (middle-click, right-click)', () => {
      const middleClick = shouldTriggerNavigation({
        currentUrl,
        targetHref: '/ar/courses/auto-detailing',
        isModifiedEvent: false,
        button: 1, // Middle click
        defaultPrevented: false,
      });
      assert.equal(middleClick, false);

      const rightClick = shouldTriggerNavigation({
        currentUrl,
        targetHref: '/ar/courses/auto-detailing',
        isModifiedEvent: false,
        button: 2, // Right click
        defaultPrevented: false,
      });
      assert.equal(rightClick, false);
    });

    it('rejects downloads, new-tab targets, and external rel links', () => {
      const downloadLink = shouldTriggerNavigation({
        currentUrl,
        targetHref: '/downloads/syllabus.pdf',
        isModifiedEvent: false,
        button: 0,
        defaultPrevented: false,
        downloadAttr: true,
      });
      assert.equal(downloadLink, false);

      const newTabLink = shouldTriggerNavigation({
        currentUrl,
        targetHref: '/ar/terms',
        isModifiedEvent: false,
        button: 0,
        defaultPrevented: false,
        targetAttr: '_blank',
      });
      assert.equal(newTabLink, false);

      const relExternalLink = shouldTriggerNavigation({
        currentUrl,
        targetHref: '/ar/docs',
        isModifiedEvent: false,
        button: 0,
        defaultPrevented: false,
        relAttr: 'external noopener',
      });
      assert.equal(relExternalLink, false);
    });

    it('rejects defaultPrevented events', () => {
      const prevented = shouldTriggerNavigation({
        currentUrl,
        targetHref: '/ar/courses/phone-repair',
        isModifiedEvent: false,
        button: 0,
        defaultPrevented: true,
      });
      assert.equal(prevented, false);
    });
  });

  describe('Trickling Progress Mathematical Invariants', () => {
    it('diminishes rate of progress as value increases and never exceeds 92% cap before completion', () => {
      let p = 0.2;
      for (let i = 0; i < 50; i++) {
        p = getNextTrickleProgress(p);
      }
      assert.ok(p <= 0.92, `Expected progress <= 0.92, got ${p}`);
      assert.ok(p >= 0.90, `Expected progress >= 0.90 after 50 ticks, got ${p}`);
    });

    it('initial increments are noticeably larger than high-progress increments', () => {
      const initialStep = getNextTrickleProgress(0.2) - 0.2;
      const lateStep = getNextTrickleProgress(0.88) - 0.88;
      assert.ok(
        initialStep > lateStep,
        `Expected initial step (${initialStep}) to be larger than late step (${lateStep})`
      );
    });
  });
});
