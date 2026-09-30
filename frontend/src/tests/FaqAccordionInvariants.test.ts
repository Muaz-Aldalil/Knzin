import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('User Story 4: FAQ Accordion Invariants', () => {
  const arPath = path.resolve(process.cwd(), 'messages/ar.json');
  const enPath = path.resolve(process.cwd(), 'messages/en.json');

  const arDict = JSON.parse(fs.readFileSync(arPath, 'utf8'));
  const enDict = JSON.parse(fs.readFileSync(enPath, 'utf8'));

  const expectedCategories = ['model', 'downloads', 'draws', 'referral', 'kyc'] as const;
  const expectedDefaultExpandedKeys = [
    'faq-model-1',
    'faq-downloads-1',
    'faq-draws-1',
    'faq-referral-1',
    'faq-kyc-1',
  ];

  it('verifies 100% dictionary parity between ar.json and en.json for faq namespace', () => {
    assert.ok(arDict.faq, 'ar.json must have faq namespace');
    assert.ok(enDict.faq, 'en.json must have faq namespace');

    const arKeys = Object.keys(arDict.faq).sort();
    const enKeys = Object.keys(enDict.faq).sort();

    assert.deepEqual(arKeys, enKeys, 'faq namespace keys must be identical across ar and en');
  });

  it('asserts 5 core objection categories are represented in localization', () => {
    for (const cat of expectedCategories) {
      const catKey = `category${cat.charAt(0).toUpperCase() + cat.slice(1)}`;
      assert.ok(arDict.faq[catKey], `ar.json missing category key: ${catKey}`);
      assert.ok(enDict.faq[catKey], `en.json missing category key: ${catKey}`);
      assert.ok(arDict.faq[catKey].trim().length > 0);
      assert.ok(enDict.faq[catKey].trim().length > 0);
    }
  });

  it('verifies canonical default expanded accordion item keys configuration', () => {
    // Assert all 5 default expanded keys follow the specified naming convention
    assert.equal(expectedDefaultExpandedKeys.length, 5);
    for (const key of expectedDefaultExpandedKeys) {
      assert.match(key, /^faq-(model|downloads|draws|referral|kyc)-1$/);
    }
  });

  it('validates first question and answer exist for every category', () => {
    for (const cat of expectedCategories) {
      const qKey = `q_${cat}_1`;
      const aKey = `a_${cat}_1`;

      assert.ok(arDict.faq[qKey], `ar.json missing ${qKey}`);
      assert.ok(arDict.faq[aKey], `ar.json missing ${aKey}`);
      assert.ok(enDict.faq[qKey], `en.json missing ${qKey}`);
      assert.ok(enDict.faq[aKey], `en.json missing ${aKey}`);
    }
  });
});
