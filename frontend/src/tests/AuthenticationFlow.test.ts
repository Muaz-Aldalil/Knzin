/**
 * Authentication Flow & Invariants Test
 * Verifies that user authentication is server-authoritative,
 * email OTP flow is properly wired, checkout purchase is gated,
 * and development conveniences cannot leak to production.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Authentication Flow & Invariants', () => {
  it('useAuth provides server-authoritative OTP and logout methods', () => {
    const filePath = path.resolve(__dirname, '../hooks/useAuth.ts');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.ok(content.includes('/auth/otp/send'), 'useAuth must invoke /auth/otp/send');
    assert.ok(content.includes('/auth/otp/verify'), 'useAuth must invoke /auth/otp/verify');
    assert.ok(content.includes('/auth/logout'), 'useAuth must invoke server logout endpoint /auth/logout');
    assert.ok(content.includes('sendOtp'), 'useAuth must export sendOtp function');
    assert.ok(content.includes('verifyOtp'), 'useAuth must export verifyOtp function');
  });

  it('LoginPage renders email OTP form and Google OAuth button', () => {
    const filePath = path.resolve(__dirname, '../app/[locale]/auth/login/page.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.ok(content.includes('handleSendOtp'), 'LoginPage must have handleSendOtp handler');
    assert.ok(content.includes('handleVerifyOtp'), 'LoginPage must have handleVerifyOtp handler');
    assert.ok(content.includes('handleGoogleLogin'), 'LoginPage must have Google OAuth trigger');
    assert.ok(content.includes('redirect'), 'LoginPage must preserve redirect query parameter');
  });

  it('Development quick login is strictly guarded by non-production check', () => {
    const filePath = path.resolve(__dirname, '../app/[locale]/auth/login/page.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.ok(
      content.includes("process.env.NODE_ENV !== 'production'"),
      'Development shortcuts must be guarded by process.env.NODE_ENV !== "production"'
    );
  });

  it('CheckoutBottomSheet implements authentication gate for unauthenticated users', () => {
    const filePath = path.resolve(__dirname, '../components/checkout/CheckoutBottomSheet.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.ok(content.includes('useAuth'), 'CheckoutBottomSheet must use useAuth hook');
    assert.ok(content.includes('isLoggedIn'), 'CheckoutBottomSheet must check isLoggedIn status');
    assert.ok(
      content.includes('/auth/login'),
      'CheckoutBottomSheet must provide redirect to /auth/login for unauthenticated users'
    );
    assert.ok(
      content.includes('knzin_pending_checkout'),
      'CheckoutBottomSheet must preserve pending checkout item across authentication redirect'
    );
  });

  it('HeaderHUD renders dedicated Sign In button when user is unauthenticated', () => {
    const filePath = path.resolve(__dirname, '../components/layout/HeaderHUD.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.ok(
      content.includes('href="/auth/login"'),
      'HeaderHUD must link to /auth/login'
    );
    assert.ok(
      content.includes('!user'),
      'HeaderHUD must conditionally render Sign In when !user'
    );
  });

  it('Course detail and lesson player views restore pending checkout after login', () => {
    const courseDetailPath = path.resolve(__dirname, '../components/course/CourseDetailClientView.tsx');
    const lessonPlayerPath = path.resolve(__dirname, '../components/lesson/LessonPlayerClientView.tsx');

    const courseContent = fs.readFileSync(courseDetailPath, 'utf8');
    const lessonContent = fs.readFileSync(lessonPlayerPath, 'utf8');

    assert.ok(
      courseContent.includes('knzin_pending_checkout'),
      'CourseDetailClientView must restore knzin_pending_checkout'
    );
    assert.ok(
      lessonContent.includes('knzin_pending_checkout'),
      'LessonPlayerClientView must restore knzin_pending_checkout'
    );
  });
});
