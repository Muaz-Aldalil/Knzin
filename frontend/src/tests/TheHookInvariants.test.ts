import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import arMessages from '../../messages/ar.json';
import enMessages from '../../messages/en.json';

describe('User Story 2: The Hook / Vision Narrative Invariants', () => {
  it('verbatim matches the canonical Arabic founder quote (SC-002)', () => {
    const ar = (arMessages as any).theHook;
    assert.ok(ar, 'ar.json must have theHook namespace');

    const expectedArQuote =
      'نحن نؤمن بأن الشباب يحتاجون إلى المهارة ورأس المال معاً. لذلك، نحن نعلمك مهارات العمل الحر، ونمنحك فرصة لربح تمويل مشروعك في نفس الوقت.';
    assert.equal(ar.quote.trim(), expectedArQuote.trim(), 'Canonical Arabic founder quote must match verbatim');
  });

  it('verbatim matches the canonical English founder quote', () => {
    const en = (enMessages as any).theHook;
    assert.ok(en, 'en.json must have theHook namespace');

    const expectedEnQuote =
      'We believe youth need both skill and capital together. Therefore, we teach you freelance skills, while giving you the chance to win funding for your project at the same time.';
    assert.equal(en.quote.trim(), expectedEnQuote.trim(), 'Canonical English founder quote must match verbatim');
  });

  it('has 100% key parity across all theHook keys', () => {
    const arKeys = Object.keys((arMessages as any).theHook).sort();
    const enKeys = Object.keys((enMessages as any).theHook).sort();

    assert.deepEqual(arKeys, enKeys, 'theHook keys must have 100% parity');
  });
});
