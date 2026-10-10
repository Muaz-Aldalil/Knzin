/**
 * Role-aware post-login destination & open-redirect safety tests.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ADMIN_HOME,
  USER_HOME,
  isAdminPath,
  resolvePostLoginDestination,
  sanitizeRedirectTarget,
} from '../lib/auth-redirect.js';

describe('sanitizeRedirectTarget', () => {
  it('accepts internal paths and strips the locale prefix', () => {
    assert.equal(sanitizeRedirectTarget('/courses/auto-detailing'), '/courses/auto-detailing');
    assert.equal(sanitizeRedirectTarget('/ar/courses/auto-detailing'), '/courses/auto-detailing');
    assert.equal(sanitizeRedirectTarget('/en/dashboard?tab=1#x'), '/dashboard?tab=1#x');
  });

  it('treats root and missing values as no intent', () => {
    assert.equal(sanitizeRedirectTarget('/'), null);
    assert.equal(sanitizeRedirectTarget('/ar'), null);
    assert.equal(sanitizeRedirectTarget(''), null);
    assert.equal(sanitizeRedirectTarget(null), null);
    assert.equal(sanitizeRedirectTarget(undefined), null);
  });

  it('rejects external, protocol-relative and scheme URLs', () => {
    for (const bad of [
      'https://evil.example/phish',
      'http://evil.example',
      '//evil.example',
      '///evil.example',
      '/\\evil.example',
      '\\\\evil.example',
      'javascript:alert(1)',
      'evil.example/path',
      '/redirect?next=https://evil.example',
      '/\t/evil.example',
      '/%0d%0a',
    ]) {
      const result = sanitizeRedirectTarget(bad);
      assert.ok(
        result === null || (!result.startsWith('//') && !result.includes('://')),
        `unsafe target accepted: ${bad} -> ${result}`
      );
    }
    assert.equal(sanitizeRedirectTarget('https://evil.example/phish'), null);
    assert.equal(sanitizeRedirectTarget('//evil.example'), null);
    assert.equal(sanitizeRedirectTarget('/\\evil.example'), null);
    assert.equal(sanitizeRedirectTarget('/\t/evil.example'), null);
  });

  it('rejects auth pages to avoid redirect loops', () => {
    assert.equal(sanitizeRedirectTarget('/auth/login'), null);
    assert.equal(sanitizeRedirectTarget('/ar/auth/callback'), null);
  });

  it('rejects oversized targets', () => {
    assert.equal(sanitizeRedirectTarget('/' + 'a'.repeat(600)), null);
  });
});

describe('resolvePostLoginDestination', () => {
  it('sends an admin with no explicit intent to the landing/home page', () => {
    assert.equal(resolvePostLoginDestination({ redirect: null, isAdmin: true }), USER_HOME);
    assert.equal(resolvePostLoginDestination({ redirect: '/', isAdmin: true }), USER_HOME);
  });

  it('sends a normal user with no intent to the normal landing/home', () => {
    assert.equal(resolvePostLoginDestination({ redirect: null, isAdmin: false }), USER_HOME);
    assert.equal(resolvePostLoginDestination({ redirect: '/', isAdmin: false }), USER_HOME);
  });

  it('returns users to a legitimate intended destination (purchase flow)', () => {
    assert.equal(
      resolvePostLoginDestination({ redirect: '/ar/courses/auto-detailing', isAdmin: false }),
      '/courses/auto-detailing'
    );
    assert.equal(
      resolvePostLoginDestination({ redirect: '/courses/auto-detailing', isAdmin: true }),
      '/courses/auto-detailing'
    );
  });

  it('never sends a non-admin to an admin destination, even when requested', () => {
    assert.equal(resolvePostLoginDestination({ redirect: '/admin', isAdmin: false }), USER_HOME);
    assert.equal(resolvePostLoginDestination({ redirect: '/en/admin/settings', isAdmin: false }), USER_HOME);
  });

  it('lets an admin return to a requested admin page', () => {
    assert.equal(resolvePostLoginDestination({ redirect: '/ar/admin/settings', isAdmin: true }), '/admin/settings');
  });

  it('falls back to the landing page for unsafe redirect values', () => {
    assert.equal(resolvePostLoginDestination({ redirect: 'https://evil.example', isAdmin: false }), USER_HOME);
    assert.equal(resolvePostLoginDestination({ redirect: '//evil.example', isAdmin: true }), USER_HOME);
  });

  it('isAdminPath only matches the admin subtree', () => {
    assert.equal(isAdminPath('/admin'), true);
    assert.equal(isAdminPath('/admin/users'), true);
    assert.equal(isAdminPath('/administrator'), false);
    assert.equal(isAdminPath('/courses/admin'), false);
  });
});
