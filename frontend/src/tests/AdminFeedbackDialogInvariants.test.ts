/**
 * Admin Feedback Dialog Invariants
 * Verifies that all admin notifications and feedback use modern accessible modal dialogs
 * instead of native window.alert(), providing high UX, RTL support, and keyboard accessibility.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '..');

describe('Admin Feedback Dialog Invariants', () => {
  it('AdminShell wraps the admin surface with AdminFeedbackProvider', () => {
    const shellPath = path.resolve(srcDir, 'components/admin/AdminShell.tsx');
    const content = fs.readFileSync(shellPath, 'utf8');

    assert.ok(
      content.includes('AdminFeedbackProvider'),
      'AdminShell must wrap children with AdminFeedbackProvider'
    );
  });

  it('FeedbackDialog implements accessible modal attributes and keyboard handlers', () => {
    const dialogPath = path.resolve(srcDir, 'components/admin/FeedbackDialog.tsx');
    const content = fs.readFileSync(dialogPath, 'utf8');

    assert.ok(content.includes('role="dialog"'), 'FeedbackDialog must specify role="dialog"');
    assert.ok(content.includes('aria-modal="true"'), 'FeedbackDialog must specify aria-modal="true"');
    assert.ok(content.includes("'Escape'"), 'FeedbackDialog must handle Escape key');
  });

  it('AdminFeedbackContext exports standard feedback dispatchers', () => {
    const contextPath = path.resolve(srcDir, 'components/admin/AdminFeedbackContext.tsx');
    const content = fs.readFileSync(contextPath, 'utf8');

    assert.ok(content.includes('showSuccess'), 'Must export showSuccess helper');
    assert.ok(content.includes('showError'), 'Must export showError helper');
    assert.ok(content.includes('showWarning'), 'Must export showWarning helper');
    assert.ok(content.includes('showInfo'), 'Must export showInfo helper');
  });

  it('Admin course detail editor uses showSuccess for part updates instead of native alert', () => {
    const courseEditPath = path.resolve(srcDir, 'app/[locale]/admin/courses/[id]/page.tsx');
    const content = fs.readFileSync(courseEditPath, 'utf8');

    assert.ok(
      !content.includes('alert('),
      'Course detail page must not use native alert()'
    );
    assert.ok(
      content.includes('showSuccess(isAr ? \'تم تحديث الجزء التدريبي بنجاح.\' : \'Training part updated successfully.\')'),
      'Course detail page must use showSuccess for training part update'
    );
  });

  it('Guarantees ZERO native alert() calls across all frontend/src production code', () => {
    function findAlertsInDir(dir: string, results: string[] = []): string[] {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          findAlertsInDir(fullPath, results);
        } else if (
          (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) &&
          !fullPath.includes(path.join('tests', 'AuthRedirect.test.ts')) && // XSS security test fixture
          !fullPath.includes(path.join('tests', 'AdminMediaUrlSanitization.test.ts')) && // XSS security test fixture
          !fullPath.includes('AdminFeedbackDialogInvariants.test.ts') // this test file itself
        ) {
          const fileContent = fs.readFileSync(fullPath, 'utf8');
          // Match alert(...) as a function call
          if (/\balert\(/.test(fileContent)) {
            results.push(fullPath);
          }
        }
      }
      return results;
    }

    const offendingFiles = findAlertsInDir(srcDir);
    assert.deepEqual(
      offendingFiles,
      [],
      `Found native alert() calls in production files: ${offendingFiles.join(', ')}`
    );
  });
});
