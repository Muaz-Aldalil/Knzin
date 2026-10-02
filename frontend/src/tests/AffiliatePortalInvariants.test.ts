/**
 * Affiliate Portal Invariant Tests (Feature 006 - US4)
 * Uses native Node.js test runner for deterministic execution.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Affiliate Portal Invariants (Feature 006 - US4)', () => {
  const arMessages = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../../messages/ar.json'), 'utf8')
  );
  const enMessages = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../../messages/en.json'), 'utf8')
  );

  it('100% dictionary parity between ar.json and en.json for the affiliate namespace', () => {
    assert.ok(arMessages.affiliate, 'ar.json must contain affiliate namespace');
    assert.ok(enMessages.affiliate, 'en.json must contain affiliate namespace');

    const arKeys = Object.keys(arMessages.affiliate).sort();
    const enKeys = Object.keys(enMessages.affiliate).sort();

    assert.deepEqual(
      arKeys,
      enKeys,
      `Dictionary keys must be identical across locales. Missing in EN: ${arKeys.filter((k) => !enKeys.includes(k))}, Missing in AR: ${enKeys.filter((k) => !arKeys.includes(k))}`
    );
  });

  it('constructs canonical referral URL and UTM campaign query strings correctly', () => {
    const baseUrl = 'https://knzin.com';
    const learnerCode = 'LRN-7K2M';
    const campaignTag = 'tiktok_launch';

    const canonicalUrl = `${baseUrl}?ref=${learnerCode}`;
    const campaignUrl = `${baseUrl}?ref=${learnerCode}&campaign=${campaignTag}`;

    assert.equal(canonicalUrl, 'https://knzin.com?ref=LRN-7K2M');
    assert.equal(campaignUrl, 'https://knzin.com?ref=LRN-7K2M&campaign=tiktok_launch');

    const parsed = new URL(campaignUrl);
    assert.equal(parsed.searchParams.get('ref'), 'LRN-7K2M');
    assert.equal(parsed.searchParams.get('campaign'), 'tiktok_launch');
  });

  it('custom vanity slug builds direct vanity URL path', () => {
    const baseUrl = 'https://knzin.com';
    const slug = 'alifaraj';
    const vanityUrl = `${baseUrl}/${slug}`;

    assert.equal(vanityUrl, 'https://knzin.com/alifaraj');
  });
});
