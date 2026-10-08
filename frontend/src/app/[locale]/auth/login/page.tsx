'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { ApiError, getApiBaseUrl } from '@/lib/api-client';
import { fetchAdminCapabilities } from '@/lib/admin/access';
import { resolvePostLoginDestination, sanitizeRedirectTarget } from '@/lib/auth-redirect';
import { Mail, ArrowLeft, ArrowRight, ShieldCheck, Sparkles, Loader2, KeyRound, UserCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { DeveloperAttribution } from '@/components/layout/DeveloperAttribution';
import GoogleIdentityButton from '@/components/auth/GoogleIdentityButton';

function LoginContent() {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRedirect = searchParams.get('redirect');

  const { isLoggedIn, sendOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const [isRedirecting, setIsRedirecting] = useState(false);
  const navigatedRef = useRef(false);

  // Single post-authentication navigation path (fresh login or already-signed-in visit).
  // Admin status comes from the backend (/admin/me); the redirect value is sanitized and
  // can never send a non-admin to /admin or anyone to an external origin.
  const goToDestination = useCallback(async () => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    setIsRedirecting(true);

    const capabilities = await fetchAdminCapabilities();
    const destination = resolvePostLoginDestination({
      redirect: requestedRedirect,
      isAdmin: capabilities !== null,
    });
    router.replace(destination as any);
  }, [requestedRedirect, router]);

  useEffect(() => {
    if (isLoggedIn) {
      void goToDestination();
    }
  }, [isLoggedIn, goToDestination]);

  const backendUrl = getApiBaseUrl();

  const handleSendOtp = async (e?: React.FormEvent, customEmail?: string) => {
    if (e) e.preventDefault();
    const targetEmail = (customEmail || email).trim().toLowerCase();

    if (!targetEmail || !targetEmail.includes('@') || !targetEmail.includes('.')) {
      setError(isRtl ? 'يرجى إدخال عنوان بريد إلكتروني صالح.' : 'Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const res = await sendOtp(targetEmail);
      setEmail(targetEmail);
      if (res.dev_code) {
        setDevCode(res.dev_code);
        setCode(res.dev_code);
      } else if (isDemoLoginEnabled) {
        setDevCode('123456');
        setCode('123456');
      }
      setStep('otp');
      setInfoMessage(
        isRtl
          ? `تم إرسال رمز التحقق إلى ${targetEmail}`
          : `Verification code sent to ${targetEmail}`
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || (isRtl ? 'فشل إرسال الرمز. يرجى المحاولة لاحقاً.' : 'Failed to send code. Please try again.'));
      } else {
        setError(isRtl ? 'حدث خطأ في الاتصال بالخادم.' : 'A network connection error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim();

    if (cleanCode.length !== 6) {
      setError(isRtl ? 'رمز التحقق يجب أن يتكون من 6 أرقام.' : 'Verification code must be 6 digits.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await verifyOtp(email, cleanCode);
      // Navigation is handled by the isLoggedIn effect (role-aware destination).
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || (isRtl ? 'رمز التحقق غير صحيح أو انتهت صلاحيته.' : 'Invalid or expired verification code.'));
      } else {
        setError(isRtl ? 'حدث خطأ أثناء التحقق. يرجى المحاولة مرة أخرى.' : 'Error during verification. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDemoLoginEnabled =
    process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === 'true' ||
    process.env.NODE_ENV !== 'production' ||
    (mounted && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.endsWith('netlify.app')
    ));

  const isGoogleAuthEnabled =
    process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === 'true' ||
    process.env.NODE_ENV !== 'production' ||
    (mounted && window.location.hostname.endsWith('netlify.app'));

  const handleGoogleLogin = () => {
    if (!isGoogleAuthEnabled) {
      setError(
        isRtl
          ? 'تسجيل الدخول عبر Google غير متاح حالياً. يرجى استخدام رمز التحقق عبر البريد الإلكتروني.'
          : 'Google sign-in is currently unavailable. Please sign in using email verification code.'
      );
      return;
    }
    const safeRedirect = sanitizeRedirectTarget(requestedRedirect);
    const googleRedirectUrl = safeRedirect
      ? `${backendUrl}/auth/google/redirect?redirect=${encodeURIComponent(safeRedirect)}`
      : `${backendUrl}/auth/google/redirect`;
    window.location.href = googleRedirectUrl;
  };

  const handleDevQuickLogin = (quickEmail: string) => {
    setEmail(quickEmail);
    handleSendOtp(undefined, quickEmail);
  };

  if (isRedirecting) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3 px-4" role="status" aria-live="polite">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-semibold text-content-secondary">
          {isRtl ? 'جارِ تسجيل دخولك...' : 'Signing you in...'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-surface border border-border-subtle rounded-3xl p-8 shadow-sm">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-xs">
              <span className="text-white font-extrabold text-base">K</span>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-content-primary">
              {isRtl ? 'كَنزين' : 'KNZiN'}
            </span>
          </Link>

          <h1 className="text-2xl font-bold text-content-primary">
            {step === 'email'
              ? (isRtl ? 'تسجيل الدخول أو إنشاء حساب' : 'Sign In or Sign Up')
              : (isRtl ? 'تأكيد رمز التحقق' : 'Enter Verification Code')}
          </h1>

          <p className="mt-2 text-sm text-content-secondary">
            {step === 'email'
              ? (isRtl
                  ? 'أدخل بريدك الإلكتروني لتسجيل الدخول السريع برمز الأمان المباشر.'
                  : 'Enter your email address to receive an instant verification code.')
              : (isRtl
                  ? `أدخل الرمز المكون من 6 أرقام المرسل إلى ${email}`
                  : `Enter the 6-digit code sent to ${email}`)}
          </p>
        </div>

        {/* Alerts / Error feedback */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-sm text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-start gap-3 text-sm text-primary">
            <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Step 1: Email Form */}
        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label htmlFor="auth-email" className="block text-xs font-semibold text-content-secondary mb-2">
                {isRtl ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <div className="relative" dir="ltr">
                <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-content-muted pointer-events-none" />
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  dir="ltr"
                  className="w-full ps-11 pe-4 py-3 rounded-xl bg-surface-secondary border border-border-subtle text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm font-medium transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isRtl ? 'جارِ الإرسال...' : 'Sending code...'}</span>
                </>
              ) : (
                <>
                  <span>{isRtl ? 'إرسال رمز التحقق' : 'Send Verification Code'}</span>
                  {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </>
              )}
            </button>

            {/* Social Divider & Google Identity Services Button */}
            {isGoogleAuthEnabled && (
              <>
                <div className="relative my-6 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border-subtle" />
                  </div>
                  <span className="relative bg-surface px-3 text-xs font-semibold text-content-muted">
                    {isRtl ? 'أو الدخول عبر' : 'OR CONTINUE WITH'}
                  </span>
                </div>

                <GoogleIdentityButton
                  redirectUrl={requestedRedirect || undefined}
                  onSuccess={goToDestination}
                  onError={(err) => setError(err)}
                />
              </>
            )}

            {/* Development Mode Quick Shortcuts (Local Development & Netlify Demo) */}
            {isDemoLoginEnabled && (
              <div className="mt-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-start">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <KeyRound className="w-4 h-4" />
                  <span>{isRtl ? 'حسابات بيئة التطوير (Dev Only)' : 'Development Quick Login'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => handleDevQuickLogin('admin@knzin.com')}
                    className="py-1.5 px-3 rounded-lg bg-surface border border-border-subtle hover:bg-surface-elevated text-xs font-semibold text-content-primary flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-primary" />
                    <span>{isRtl ? 'مشرف (Admin)' : 'Admin User'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDevQuickLogin('mock_student@example.com')}
                    className="py-1.5 px-3 rounded-lg bg-surface border border-border-subtle hover:bg-surface-elevated text-xs font-semibold text-content-primary flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{isRtl ? 'متدرب (Student)' : 'Student User'}</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        ) : (
          /* Step 2: OTP Verification Form */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {/* Dev Code Helper Hint in development */}
            {devCode && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {isRtl ? 'رمز التحقق (بيئة التطوير): ' : 'Dev Verification Code: '}
                <span className="font-mono text-sm tracking-widest">{devCode}</span>
              </div>
            )}

            <div>
              <label htmlFor="auth-code" className="block text-xs font-semibold text-content-secondary mb-2">
                {isRtl ? 'رمز التحقق (6 أرقام)' : '6-Digit Verification Code'}
              </label>
              <input
                id="auth-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full text-center tracking-[0.5em] font-mono text-2xl px-4 py-3 rounded-xl bg-surface-secondary border border-border-subtle text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || code.trim().length !== 6}
              className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isRtl ? 'جارِ التحقق...' : 'Verifying...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isRtl ? 'تأكيد ودخول' : 'Confirm & Sign In'}</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setCode('');
                  setError(null);
                }}
                className="text-content-secondary hover:text-content-primary transition-colors cursor-pointer"
              >
                {isRtl ? 'تغيير البريد الإلكتروني' : 'Change Email'}
              </button>

              <button
                type="button"
                onClick={() => handleSendOtp()}
                disabled={isLoading}
                className="text-primary hover:underline font-semibold cursor-pointer disabled:opacity-50"
              >
                {isRtl ? 'إعادة إرسال الرمز' : 'Resend Code'}
              </button>
            </div>
          </form>
        )}

        {/* Developer Attribution at bottom of login dialog */}
        <div className="w-full border-t border-border-subtle mt-8 pt-6">
          <DeveloperAttribution logoSize={56} />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
