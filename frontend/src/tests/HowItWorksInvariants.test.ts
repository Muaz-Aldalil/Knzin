import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import arMessages from '../../messages/ar.json';
import enMessages from '../../messages/en.json';

describe('User Story 1: How It Works Invariants', () => {
  describe('Bilingual Localization Synchronization', () => {
    it('ar.json and en.json have 100% key parity in howItWorks namespace', () => {
      const ar = (arMessages as any).howItWorks;
      const en = (enMessages as any).howItWorks;

      assert.ok(ar, 'ar.json must have howItWorks namespace');
      assert.ok(en, 'en.json must have howItWorks namespace');

      const arKeys = Object.keys(ar).sort();
      const enKeys = Object.keys(en).sort();

      assert.deepEqual(arKeys, enKeys, 'howItWorks translation keys must be 100% synchronized');
    });

    it('contains trigger, title, and close keys', () => {
      const ar = (arMessages as any).howItWorks;
      const en = (enMessages as any).howItWorks;

      assert.equal(ar.trigger, 'كيف تعمل كَنزين؟');
      assert.equal(en.trigger, 'How It Works');
      assert.ok(ar.title);
      assert.ok(en.title);
      assert.ok(ar.close);
      assert.ok(en.close);
    });
  });

  describe('3-Step Canonical Sequence Invariants', () => {
    it('defines exactly 3 canonical steps with required pricing and reward invariants', () => {
      const ar = (arMessages as any).howItWorks;
      const en = (enMessages as any).howItWorks;

      // Step 1: Pricing ($2 part, $10 bundle)
      assert.ok(ar.step1_title.includes('1'));
      assert.ok(en.step1_title.includes('1'));
      assert.ok(ar.step1_desc.includes('2$') || ar.step1_desc.includes('$2'));
      assert.ok(ar.step1_desc.includes('10$') || ar.step1_desc.includes('$10'));
      assert.ok(en.step1_desc.includes('$2'));
      assert.ok(en.step1_desc.includes('$10'));

      // Step 2: Tickets
      assert.ok(ar.step2_title.includes('2'));
      assert.ok(en.step2_title.includes('2'));
      assert.ok(ar.step2_desc.includes('تذكرة') || ar.step2_desc.includes('تذاكر'));
      assert.ok(en.step2_desc.toLowerCase().includes('ticket'));

      // Step 3: Transparent Live Draw
      assert.ok(ar.step3_title.includes('3'));
      assert.ok(en.step3_title.includes('3'));
      assert.ok(ar.step3_desc.includes('يوتيوب') || ar.step3_desc.includes('سحب'));
      assert.ok(en.step3_desc.toLowerCase().includes('youtube') || en.step3_desc.toLowerCase().includes('draw'));
    });
  });
});
