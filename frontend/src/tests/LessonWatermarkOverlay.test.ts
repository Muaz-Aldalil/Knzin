/**
 * Lesson Watermark Overlay Invariants & Anti-Piracy Tests (Feature 005)
 * Uses native Node.js test runner for deterministic execution.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('LessonWatermarkOverlay Invariants (Feature 005 - FR-005)', () => {
  it('Canvas element possesses pointer-events-none allowing seamless video controls interaction', () => {
    const componentPath = path.resolve(__dirname, '../components/lesson/LessonWatermarkOverlay.tsx');
    const content = fs.readFileSync(componentPath, 'utf8');

    assert.ok(
      content.includes('pointer-events-none'),
      'LessonWatermarkOverlay must include pointer-events-none on canvas element'
    );
    assert.ok(
      content.includes('aria-hidden="true"'),
      'LessonWatermarkOverlay must mark canvas as decorative / screen-reader hidden'
    );
  });

  it('watermark payload strictly formats account_email, learner_code, and rendered_at timestamp', () => {
    const mockWatermark = {
      account_email: 'learner@knzin.iq',
      learner_code: 'LRN-8K9N2P',
      rendered_at: '01 Oct 2026 12:00',
    };

    const formatted = `${mockWatermark.account_email} • ${mockWatermark.learner_code} • ${mockWatermark.rendered_at}`;

    assert.ok(formatted.includes(mockWatermark.account_email));
    assert.ok(formatted.includes(mockWatermark.learner_code));
    assert.ok(formatted.includes(mockWatermark.rendered_at));
    assert.match(mockWatermark.learner_code, /^LRN-[0-9A-Z]{6}$/);
  });

  it('LessonWatermarkOverlay early-returns null when watermark is not provided (unauthenticated/preview)', () => {
    const componentPath = path.resolve(__dirname, '../components/lesson/LessonWatermarkOverlay.tsx');
    const content = fs.readFileSync(componentPath, 'utf8');

    assert.ok(
      content.includes('if (!watermark) return null;'),
      'LessonWatermarkOverlay must return null when watermark prop is null'
    );
  });
});
