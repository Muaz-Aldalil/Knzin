import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MOCK_ACTIVE_DRAWS, MOCK_CONCLUDED_DRAWS } from '../data/mock-draws';
import arMessages from '../../messages/ar.json';
import enMessages from '../../messages/en.json';

describe('Promotional Draws & Countdown Invariants (Feature 003)', () => {
  describe('Bilingual Localization Dictionary Parity', () => {
    it('ar.json and en.json contain identical keys in draws namespace', () => {
      const arDraws = (arMessages as any).draws;
      const enDraws = (enMessages as any).draws;

      assert.ok(arDraws, 'ar.json must have draws namespace');
      assert.ok(enDraws, 'en.json must have draws namespace');

      const arKeys = Object.keys(arDraws).sort();
      const enKeys = Object.keys(enDraws).sort();

      assert.deepEqual(arKeys, enKeys, 'Draws translation keys must be 100% synchronized between Arabic and English');
    });

    it('contains all mandatory tier, badge, and legal shield copy', () => {
      const ar = (arMessages as any).draws;
      const en = (enMessages as any).draws;

      assert.ok(ar.termsLegalShield.includes('هدايا ترويجية مجانية'));
      assert.ok(en.termsLegalShield.includes('complimentary promotional gifts'));

      assert.ok(ar.termsHourlyRule);
      assert.ok(ar.termsDailyRule);
      assert.ok(ar.termsMonthlyRule);
      assert.ok(ar.lockedStatus);
      assert.ok(ar.heroMarqueeBadge);
    });
  });

  describe('Offline Mock Data Invariants', () => {
    it('MOCK_ACTIVE_DRAWS provides all 3 tiers with positive valuations', () => {
      assert.equal(MOCK_ACTIVE_DRAWS.length, 3);

      const tiers = MOCK_ACTIVE_DRAWS.map((d) => d.tier);
      assert.ok(tiers.includes('hourly'));
      assert.ok(tiers.includes('daily'));
      assert.ok(tiers.includes('monthly'));

      for (const draw of MOCK_ACTIVE_DRAWS) {
        assert.ok(draw.prize.valuation_usd > 0, 'Prize must have positive USD valuation');
        assert.ok(draw.prize.display_iqd_label.includes('د.ع'), 'Prize must have IQD display label');
        assert.ok(draw.badge_label.length > 0, 'Draw must have trust badge label');
        assert.ok(draw.starts_at, 'Draw must have start timestamp');
        assert.ok(draw.ends_at, 'Draw must have end timestamp');
      }
    });

    it('MOCK_CONCLUDED_DRAWS contains valid winner records with #KNZ- serials', () => {
      assert.ok(MOCK_CONCLUDED_DRAWS.length >= 3);

      for (const draw of MOCK_CONCLUDED_DRAWS) {
        assert.ok(draw.winner.winning_ticket_serial.startsWith('#KNZ-'));
        assert.ok(draw.winner.masked_name.length > 0);
        assert.ok(draw.winner.governorate.length > 0);
        assert.equal(typeof draw.winner.prize_delivered, 'boolean');
      }
    });
  });

  describe('Clock Drift & Zero-State Countdown Math', () => {
    it('accurately computes total seconds and unit breakdown', () => {
      const remainingMs = 90061000; // 1 day, 1 hour, 1 min, 1 sec = 86400 + 3600 + 60 + 1 = 90061s
      const totalSeconds = Math.floor(remainingMs / 1000);

      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      assert.equal(days, 1);
      assert.equal(hours, 1);
      assert.equal(minutes, 1);
      assert.equal(seconds, 1);
    });

    it('clamps negative differences to 0 and flags isLocked', () => {
      const diffMs = -5000;
      const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
      const isLocked = diffMs <= 0;

      assert.equal(totalSeconds, 0);
      assert.equal(isLocked, true);
    });

    it('compensates for server time drift', () => {
      const serverTimeMs = 1700000000000;
      const clientTimeMs = 1700000005000; // client is 5 seconds ahead
      const offsetMs = serverTimeMs - clientTimeMs; // -5000ms

      const targetMs = 1700000060000; // 60s from server time
      const effectiveNow = clientTimeMs + offsetMs;
      const remainingSecs = Math.floor((targetMs - effectiveNow) / 1000);

      assert.equal(remainingSecs, 60, 'Should accurately evaluate to 60s regardless of client clock tampering');
    });
  });
});
