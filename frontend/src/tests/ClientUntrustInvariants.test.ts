/**
 * Client Untrust Invariants & Anti-Bypass Security Tests (Feature 005)
 * Uses native Node.js test runner for deterministic offline execution.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VOCATIONAL_COURSES_CONTENT } from '../lib/course-content.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Client Untrust & Security Invariants (Feature 005)', () => {
  it('all paid parts (Part 2+) across courses have zero hardcoded public video streaming URLs (DEF-05C)', () => {
    for (const [courseSlug, courseData] of Object.entries(VOCATIONAL_COURSES_CONTENT)) {
      for (const [partNumberStr, partContent] of Object.entries(courseData.parts)) {
        const partNumber = Number(partNumberStr);
        if (partNumber === 1) {
          // Part 1 is free introductory preview and may contain a public URL
          assert.ok(partContent.videoUrl.length > 0, `Course ${courseSlug} Part 1 should have a preview URL`);
        } else {
          // Part 2 and beyond MUST NOT have hardcoded video URLs in static code
          assert.equal(
            partContent.videoUrl,
            '',
            `Course ${courseSlug} Part ${partNumber} must have empty videoUrl, received: ${partContent.videoUrl}`
          );
        }
      }
    }
  });

  it('LessonPlayerClientView strictly forbids reading fake purchase state from localStorage (DEF-05B)', () => {
    const playerViewPath = path.resolve(__dirname, '../components/lesson/LessonPlayerClientView.tsx');
    const content = fs.readFileSync(playerViewPath, 'utf8');

    // Ensure no client-side mock enrollment / purchase overrides exist
    assert.ok(
      !content.includes('localStorage.getItem'),
      'LessonPlayerClientView must not read authorization or ownership state from localStorage'
    );
    assert.ok(
      !content.includes('knzin_enrolled_courses'),
      'LessonPlayerClientView must not inspect knzin_enrolled_courses'
    );
    assert.ok(
      !content.includes('purchased_parts'),
      'LessonPlayerClientView must not inspect purchased_parts mock array'
    );
  });

  it('useLessonPlayback hook requires server authorization via playback-auth endpoint', () => {
    const hookPath = path.resolve(__dirname, '../hooks/useLessonPlayback.ts');
    const content = fs.readFileSync(hookPath, 'utf8');

    assert.ok(
      content.includes('/playback-auth'),
      'useLessonPlayback must dispatch to /playback-auth endpoint for server authorization'
    );
    assert.ok(
      content.includes('watermark'),
      'useLessonPlayback must maintain authoritative watermark state from server response'
    );
    assert.ok(
      content.includes('ERR_PART_LOCKED'),
      'useLessonPlayback must handle ERR_PART_LOCKED paywall status'
    );
  });

  it('progress.ts has zero mock fallbacks or DEMO_ACTIVE_LEARNING stubs (DEF-05D)', () => {
    const progressPath = path.resolve(__dirname, '../lib/progress.ts');
    const content = fs.readFileSync(progressPath, 'utf8');

    assert.ok(
      !content.includes('DEMO_ACTIVE_LEARNING'),
      'progress.ts must not contain DEMO_ACTIVE_LEARNING mock fallback'
    );
    assert.ok(
      !content.includes('auto-detailing-part-2'),
      'progress.ts must not hardcode demo continuation courses'
    );
  });
});
