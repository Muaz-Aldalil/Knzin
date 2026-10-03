/**
 * Admin Confirmation & Justification Invariants (Feature 008)
 * Verifies that critical operations enforce typed confirmation, mandatory reasons,
 * receipt staging, and anti-self-elevation invariants in the UI.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Admin Confirmation & Safeguard Invariants', () => {
  it('SettingsForm requires typed confirmation with word "CONFIRM"', () => {
    const filePath = path.resolve(__dirname, '../components/admin/SettingsForm.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.ok(
      content.includes('confirmWord="CONFIRM"'),
      'SettingsForm must require typing CONFIRM before saving settings'
    );
  });

  it('PayoutSettleDialog enforces mandatory reference number and receipt file', () => {
    const filePath = path.resolve(__dirname, '../components/admin/PayoutSettleDialog.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.ok(
      content.includes('!referenceNumber.trim()'),
      'PayoutSettleDialog must validate non-empty referenceNumber'
    );
    assert.ok(
      content.includes('!receiptFile'),
      'PayoutSettleDialog must validate receiptFile presence'
    );
  });

  it('ReasonDialog validates minimum reason length before enabling submission', () => {
    const filePath = path.resolve(__dirname, '../components/admin/ReasonDialog.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.ok(
      content.includes('reason.trim().length >= 3'),
      'ReasonDialog must enforce at least 3 characters justification'
    );
  });

  it('CapabilityManager enforces anti-self-elevation invariant', () => {
    const filePath = path.resolve(__dirname, '../components/admin/CapabilityManager.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.ok(
      content.includes('currentUserId === user.id'),
      'CapabilityManager must check if the target user is the authenticated actor'
    );
    assert.ok(
      content.includes('Anti-self-elevation'),
      'CapabilityManager must display anti-self-elevation warning'
    );
  });
});
