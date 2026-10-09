/**
 * Admin Course Media URL Sanitization & XSS Defense Tests
 * Verifies that Cover Image, Lesson Video, and PDF URL inputs strictly sanitize,
 * validate, and neutralize unsafe vectors (javascript:, data:, file:, HTML injection).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isSafeMediaUrl, sanitizeMediaUrl, validateMediaUrlInput } from '../lib/safe-url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Admin Media URL Sanitization & Security Functions', () => {
  it('isSafeMediaUrl allows valid https, http, and relative storage paths', () => {
    assert.equal(isSafeMediaUrl(''), true, 'Empty URL is considered unset/safe');
    assert.equal(isSafeMediaUrl(null), false, 'Null is not a valid URL string');
    assert.equal(isSafeMediaUrl(undefined), false, 'Undefined is not a valid URL string');
    assert.equal(isSafeMediaUrl('https://images.unsplash.com/photo-123.jpg'), true);
    assert.equal(isSafeMediaUrl('http://127.0.0.1:8000/storage/courses/test.webp'), true);
    assert.equal(isSafeMediaUrl('/storage/courses/test.png'), true);
    assert.equal(isSafeMediaUrl('/storage/media/part-1-syllabus.pdf'), true);
  });

  it('isSafeMediaUrl strictly rejects javascript:, data:, vbscript:, and file: schemes', () => {
    assert.equal(isSafeMediaUrl('javascript:alert(1)'), false);
    assert.equal(isSafeMediaUrl('JAVASCRIPT:alert(document.cookie)'), false);
    assert.equal(isSafeMediaUrl('data:text/html,<script>alert(1)</script>'), false);
    assert.equal(isSafeMediaUrl('data:image/svg+xml;base64,PHN2Zz4='), false);
    assert.equal(isSafeMediaUrl('vbscript:msgbox(1)'), false);
    assert.equal(isSafeMediaUrl('file:///etc/passwd'), false);
    assert.equal(isSafeMediaUrl('file:///C:/Windows/win.ini'), false);
  });

  it('isSafeMediaUrl rejects protocol-relative URLs, directory traversal, and HTML markup injection', () => {
    assert.equal(isSafeMediaUrl('//attacker.com/evil.jpg'), false, 'Protocol-relative URL must be rejected');
    assert.equal(isSafeMediaUrl('/storage/../etc/passwd'), false, 'Directory traversal must be rejected');
    assert.equal(isSafeMediaUrl('https://example.com/pic.jpg"<script>'), false, 'HTML tags must be rejected');
    assert.equal(isSafeMediaUrl('https://example.com/pic.jpg\u0000'), false, 'Null bytes must be rejected');
    assert.equal(isSafeMediaUrl('https://example com/space.jpg'), false, 'Whitespace inside URL must be rejected');
  });

  it('sanitizeMediaUrl returns fallback when given malicious or invalid input', () => {
    assert.equal(sanitizeMediaUrl('javascript:alert(1)', ''), '');
    assert.equal(sanitizeMediaUrl('data:text/html,bad', ''), '');
    assert.equal(sanitizeMediaUrl('https://valid.com/cover.png', ''), 'https://valid.com/cover.png');
    assert.equal(sanitizeMediaUrl('/storage/courses/cover.png', ''), '/storage/courses/cover.png');
  });

  it('validateMediaUrlInput produces meaningful localized error messages for Arabic and English', () => {
    // English test
    const enResult = validateMediaUrlInput('javascript:alert(1)', false);
    assert.equal(enResult.isValid, false);
    assert.ok(enResult.error?.includes('Unsafe protocol detected'));

    // Arabic test
    const arResult = validateMediaUrlInput('javascript:alert(1)', true);
    assert.equal(arResult.isValid, false);
    assert.ok(arResult.error?.includes('تم اكتشاف بروتوكول غير آمن'));

    // Markup injection test
    const tagResult = validateMediaUrlInput('https://evil.com/img.png"><script>', false);
    assert.equal(tagResult.isValid, false);
    assert.ok(tagResult.error?.includes('invalid characters') || tagResult.error?.includes('markup'));

    // Safe URL test
    const safeResult = validateMediaUrlInput('https://cdn.knzin.com/cover.webp', false);
    assert.equal(safeResult.isValid, true);
    assert.equal(safeResult.error, null);
    assert.equal(safeResult.cleanUrl, 'https://cdn.knzin.com/cover.webp');
  });
});

describe('Course Management Admin Component Invariants', () => {
  it('admin course edit page ([id]/page.tsx) integrates media URL validation and preview protection', () => {
    const editPagePath = path.resolve(__dirname, '../app/[locale]/admin/courses/[id]/page.tsx');
    assert.ok(fs.existsSync(editPagePath), 'admin/courses/[id]/page.tsx must exist');

    const content = fs.readFileSync(editPagePath, 'utf8');

    // Safe URL import
    assert.ok(
      content.includes("from '@/lib/safe-url'"),
      '[id]/page.tsx must import safe-url sanitizers'
    );
    assert.ok(
      content.includes('validateMediaUrlInput'),
      '[id]/page.tsx must import validateMediaUrlInput'
    );
    assert.ok(
      content.includes('isSafeMediaUrl'),
      '[id]/page.tsx must import isSafeMediaUrl'
    );

    // State declarations
    assert.ok(
      content.includes('coverImageError'),
      '[id]/page.tsx must declare coverImageError state'
    );
    assert.ok(
      content.includes('partVideoUrlError'),
      '[id]/page.tsx must declare partVideoUrlError state'
    );
    assert.ok(
      content.includes('partPdfUrlError'),
      '[id]/page.tsx must declare partPdfUrlError state'
    );

    // Live preview protection
    assert.ok(
      content.includes('isSafeMediaUrl(coverImageUrl)'),
      '[id]/page.tsx must gate image preview behind isSafeMediaUrl check'
    );
    assert.ok(
      content.includes('sanitizeMediaUrl(coverImageUrl)'),
      '[id]/page.tsx preview img src must be wrapped in sanitizeMediaUrl'
    );

    // Form submission validation checks
    assert.ok(
      content.includes('validateMediaUrlInput(coverImageUrl'),
      '[id]/page.tsx handleSaveGeneral must validate coverImageUrl before submit'
    );
    assert.ok(
      content.includes('validateMediaUrlInput(partVideoUrl'),
      '[id]/page.tsx handleSavePart must validate partVideoUrl before submit'
    );
    assert.ok(
      content.includes('validateMediaUrlInput(partPdfUrl'),
      '[id]/page.tsx handleSavePart must validate partPdfUrl before submit'
    );
  });

  it('admin course creation page (new/page.tsx) integrates media URL validation and preview protection', () => {
    const newPagePath = path.resolve(__dirname, '../app/[locale]/admin/courses/new/page.tsx');
    assert.ok(fs.existsSync(newPagePath), 'admin/courses/new/page.tsx must exist');

    const content = fs.readFileSync(newPagePath, 'utf8');

    assert.ok(
      content.includes("from '@/lib/safe-url'"),
      'new/page.tsx must import safe-url sanitizers'
    );
    assert.ok(
      content.includes('coverImageError'),
      'new/page.tsx must declare coverImageError state'
    );
    assert.ok(
      content.includes('isSafeMediaUrl(coverImageUrl)'),
      'new/page.tsx must gate image preview behind isSafeMediaUrl check'
    );
    assert.ok(
      content.includes('sanitizeMediaUrl(coverImageUrl)'),
      'new/page.tsx preview img src must be wrapped in sanitizeMediaUrl'
    );
    assert.ok(
      content.includes('validateMediaUrlInput(coverImageUrl'),
      'new/page.tsx handleSubmit must validate coverImageUrl before submit'
    );
  });
});
