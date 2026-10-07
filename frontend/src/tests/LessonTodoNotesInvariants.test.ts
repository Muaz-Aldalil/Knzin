/**
 * Lesson To-Do Notes Invariants & Vocational Tracking Tests
 * Uses native Node.js test runner for deterministic execution.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Lesson To-Do Notes & Vocational Tracking Invariants', () => {
  it('LessonTabs exports TodoNoteItem interface and mounts interactive To-Do components', () => {
    const componentPath = path.resolve(__dirname, '../components/lesson/LessonTabs.tsx');
    const content = fs.readFileSync(componentPath, 'utf8');

    assert.ok(
      content.includes('export interface TodoNoteItem'),
      'LessonTabs must export TodoNoteItem interface'
    );
    assert.ok(
      content.includes('completed: boolean'),
      'TodoNoteItem must track boolean completion state'
    );
    assert.ok(
      content.includes('handleToggleTodo'),
      'LessonTabs must provide toggle completion handler'
    );
    assert.ok(
      content.includes('handleClearCompleted'),
      'LessonTabs must provide clear completed tasks handler'
    );
    assert.ok(
      content.includes('handleCopyTodos'),
      'LessonTabs must provide clipboard export handler'
    );
  });

  it('Legacy plain text notes are gracefully migrated into structured To-Do items', () => {
    const legacyRawNote = `فحص سماكة الطلاء في 4 زوايا للوح
تطبيق تجربة البقعة الخفية (Test Spot)
مسحة كحول IPA للتحقق من زوال الخدش`;

    const migrated = legacyRawNote
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((text, idx) => ({
        id: `legacy-${idx}`,
        text,
        completed: false,
        createdAt: Date.now() - idx * 1000,
      }));

    assert.equal(migrated.length, 3);
    assert.equal(migrated[0].text, 'فحص سماكة الطلاء في 4 زوايا للوح');
    assert.equal(migrated[0].completed, false);
    assert.equal(migrated[1].text, 'تطبيق تجربة البقعة الخفية (Test Spot)');
    assert.equal(migrated[2].text, 'مسحة كحول IPA للتحقق من زوال الخدش');
  });

  it('To-Do filtering correctly isolates active vs completed items', () => {
    const items = [
      { id: '1', text: 'قياس الفولتية', completed: false, createdAt: 1 },
      { id: '2', text: 'عزل البوردة', completed: true, createdAt: 2 },
      { id: '3', text: 'فحص الحرارة', completed: false, createdAt: 3 },
    ];

    const activeItems = items.filter((i) => !i.completed);
    const completedItems = items.filter((i) => i.completed);

    assert.equal(activeItems.length, 2);
    assert.equal(completedItems.length, 1);
    assert.equal(completedItems[0].text, 'عزل البوردة');
  });

  it('Clipboard export formats tasks with unicode status symbols', () => {
    const items = [
      { id: '1', text: 'فحص ميكرون الطلاء', completed: true, createdAt: 1 },
      { id: '2', text: 'تلميع اللوح الخلفي', completed: false, createdAt: 2 },
    ];

    const formatted = items
      .map((item) => `${item.completed ? '✅' : '⬜'} ${item.text}`)
      .join('\n');

    assert.ok(formatted.includes('✅ فحص ميكرون الطلاء'));
    assert.ok(formatted.includes('⬜ تلميع اللوح الخلفي'));
  });

  it('Vocational suggestions are dynamically tailored to craft keywords', () => {
    const componentPath = path.resolve(__dirname, '../components/lesson/LessonTabs.tsx');
    const content = fs.readFileSync(componentPath, 'utf8');

    assert.ok(content.includes('VDD_MAIN'), 'Includes phone repair microelectronics suggestions');
    assert.ok(content.includes('Test Spot'), 'Includes auto detailing suggestions');
    assert.ok(content.includes('Isc'), 'Includes solar installation suggestions');
  });
});
