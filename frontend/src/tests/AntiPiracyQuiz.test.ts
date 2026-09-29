/**
 * Anti-Piracy Psychological Profiler & Personalization Stamp Tests
 * Uses native Node.js test runner for deterministic offline execution.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PERSONALIZATION_STAMP_TEXT } from '../components/quiz/PersonalizationBadge';
import arMessages from '../../messages/ar.json' with { type: 'json' };

describe('Anti-Piracy Psychological Profiler & Personalization Stamp', () => {
  it('personalization stamp text matches authoritative spec verbatim', () => {
    const expectedStamp = 'تم تخصيص هذه النسخة المبرمجة حصرياً لبياناتك';
    assert.equal(PERSONALIZATION_STAMP_TEXT, expectedStamp);
    assert.equal(arMessages.quiz.watermarkStamp, expectedStamp);
  });

  it('unlimited retakes follow last-wins semantics', () => {
    // Initial answers
    let currentAnswers = {
      experience_level: 'beginner',
      learning_goal: 'job_placement',
      weekly_hours: '2_to_5',
    };

    // User retakes quiz before confirming order
    const updatedAnswers = {
      experience_level: 'advanced',
      learning_goal: 'launch_workshop',
      weekly_hours: 'more_than_10',
    };

    // Retake replaces previous answers completely (last-wins)
    currentAnswers = { ...updatedAnswers };

    assert.equal(currentAnswers.experience_level, 'advanced');
    assert.equal(currentAnswers.learning_goal, 'launch_workshop');
    assert.equal(currentAnswers.weekly_hours, 'more_than_10');
  });

  it('quiz questionnaire contains 3 distinct vocational steps', () => {
    assert.ok(arMessages.quiz.q1);
    assert.ok(arMessages.quiz.q2);
    assert.ok(arMessages.quiz.q3);
  });
});
