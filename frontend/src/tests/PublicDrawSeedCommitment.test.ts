/**
 * Public Draw Seed Commitment Invariants (Feature 008 - Task T115)
 * Verifies that cryptographic seed commitment hashes and revealed proofs
 * are integrated into public consumer draw cards and hero components.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Public Draw Seed Commitment Invariants', () => {
  it('types/draws.ts includes seed_commitment_hash and revealed_server_seed in contracts', () => {
    const filePath = path.resolve(__dirname, '../types/draws.ts');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.ok(
      content.includes('seed_commitment_hash?: string | null;'),
      'DrawItem contract must include optional seed_commitment_hash'
    );
    assert.ok(
      content.includes('revealed_server_seed?: string | null;'),
      'DrawItem contract must include optional revealed_server_seed'
    );
  });

  it('DrawCard.tsx integrates SeedCommitmentBadge', () => {
    const filePath = path.resolve(__dirname, '../components/draws/DrawCard.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.ok(
      content.includes('SeedCommitmentBadge'),
      'DrawCard must import and render SeedCommitmentBadge'
    );
    assert.ok(
      content.includes('commitmentHash={draw.seed_commitment_hash}'),
      'DrawCard must bind draw.seed_commitment_hash'
    );
  });

  it('HeroGrandPrizeCountdown.tsx integrates SeedCommitmentBadge', () => {
    const filePath = path.resolve(__dirname, '../components/draws/HeroGrandPrizeCountdown.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.ok(
      content.includes('SeedCommitmentBadge'),
      'HeroGrandPrizeCountdown must import and render SeedCommitmentBadge'
    );
    assert.ok(
      content.includes('commitmentHash={grandDraw.seed_commitment_hash}'),
      'HeroGrandPrizeCountdown must bind grandDraw.seed_commitment_hash'
    );
  });

  it('ConcludedDrawsList.tsx integrates detailed SeedCommitmentBadge proof', () => {
    const filePath = path.resolve(__dirname, '../components/draws/ConcludedDrawsList.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.ok(
      content.includes('SeedCommitmentBadge'),
      'ConcludedDrawsList must import and render SeedCommitmentBadge'
    );
    assert.ok(
      content.includes('isDetailed={true}'),
      'ConcludedDrawsList must pass isDetailed={true} for mathematical proof verification'
    );
  });
});
