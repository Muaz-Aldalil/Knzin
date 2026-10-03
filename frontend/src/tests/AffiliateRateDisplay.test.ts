/**
 * Affiliate Rate Display Invariants (Feature 008 - Task T063)
 * Verifies that literal 25% references are removed from affiliate screens
 * in favor of dynamic configuration from public policy / platform settings.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Affiliate Dynamic Rate Display Invariants', () => {
  it('AffiliateLedgerTable has zero hardcoded 25% references', () => {
    const filePath = path.resolve(__dirname, '../components/affiliate/AffiliateLedgerTable.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.ok(
      !content.includes('25%'),
      'AffiliateLedgerTable must not contain hardcoded 25% commission labels'
    );
  });

  it('Affiliate page metadata has zero hardcoded 25% references', () => {
    const filePath = path.resolve(__dirname, '../app/[locale]/affiliate/page.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.ok(
      !content.includes('25%'),
      'Affiliate page metadata must not hardcode 25% commission rate'
    );
  });

  it('Affiliate localization subtitles contain dynamic {rate} placeholder', () => {
    const enPath = path.resolve(__dirname, '../../messages/en.json');
    const arPath = path.resolve(__dirname, '../../messages/ar.json');

    const enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    const arJson = JSON.parse(fs.readFileSync(arPath, 'utf8'));

    assert.ok(
      enJson.affiliate.subtitle.includes('{rate}'),
      'en.json affiliate.subtitle must contain {rate} placeholder'
    );
    assert.ok(
      !enJson.affiliate.subtitle.includes('25%'),
      'en.json affiliate.subtitle must not hardcode 25%'
    );

    assert.ok(
      arJson.affiliate.subtitle.includes('{rate}'),
      'ar.json affiliate.subtitle must contain {rate} placeholder'
    );
    assert.ok(
      !arJson.affiliate.subtitle.includes('25%'),
      'ar.json affiliate.subtitle must not hardcode 25%'
    );
  });
});
