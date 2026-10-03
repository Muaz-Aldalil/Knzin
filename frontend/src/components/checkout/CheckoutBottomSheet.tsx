'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { X, Ticket, Mail, ShieldAlert, Sparkles, Loader2, LogIn, UserCheck } from 'lucide-react';
import LegalShieldCheckbox from './LegalShieldCheckbox';
import AntiPiracyQuizModal, { QuizAnswers } from './AntiPiracyQuizModal';
import { useCheckout } from '@/hooks/useCheckout';
import { useAuth } from '@/hooks/useAuth';

export interface CheckoutItemData {
  courseId: string;
  courseTitle: string;
  itemType: 'bundle' | 'part';
  partId?: string;
  partNumber?: number;
  partTitle?: string;
  priceCents: number;
  promotionalTickets: number;
  displayPriceLabel: string;
}

interface CheckoutBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  item: CheckoutItemData;
}

export default function CheckoutBottomSheet({
  isOpen,
  onClose,
  item,
}: CheckoutBottomSheetProps) {
  const t = useTranslations('checkout');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const router = useRouter();

  const { user, isLoggedIn } = useAuth();

  const [email, setEmail] = useState('');
  const [legalAgreed, setLegalAgreed] = useState(false);
  const [legalError, setLegalError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers | null>(null);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  const { createOrder, isLoading, error: apiError } = useCheckout();

  // Pre-fill email with authenticated user email
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  if (!isOpen) return null;

  const handleSignInRedirect = () => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('knzin_pending_checkout', JSON.stringify(item));
      }
    } catch {}
    onClose();
    router.push(`/auth/login?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/')}` as any);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLegalError(null);
    setEmailError(null);
    setQuizError(null);

    // 1. Email check
    const cleanEmail = (isLoggedIn && user?.email ? user.email : email).trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setEmailError(isRtl ? 'يرجى إدخال بريد إلكتروني صالح' : 'Please enter a valid email address');
      return;
    }

    // 2. Anti-Piracy Quiz check
    if (!quizAnswers) {
      setQuizError(t('quizPrompt'));
      setIsQuizModalOpen(true);
      return;
    }

    // 3. Legal Shield affirmative checkbox check
    if (!legalAgreed) {
      setLegalError(t('legalShieldRequired'));
      return;
    }

    try {
      const order = await createOrder({
        email: cleanEmail,
        course_id: item.courseId,
        item_type: item.itemType,
        course_part_id: item.partId || null,
        quiz_answers: quizAnswers,
      });

      // Save email for session continuity
      localStorage.setItem('knzin_guest_email', cleanEmail);

      // Record purchased part or bundle entitlement for immediate session unlock (DEF-05C)
      try {
        const key = `knzin_purchased_parts_${item.courseId}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        if (item.itemType === 'bundle') {
          localStorage.setItem(key, JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
        } else if (item.partNumber) {
          const updated = Array.from(new Set([...existing, item.partNumber]));
          localStorage.setItem(key, JSON.stringify(updated));
        }
      } catch {}

      // Navigate to order confirmation
      onClose();
      router.push(`/order-summary/${order.order_number}` as any);
    } catch {
      // Error handled by hook
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full max-w-lg bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 max-h-[92vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-extrabold text-secondary dark:text-white">
              {t('title')}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-5">
            {/* Item Summary Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="text-xs text-slate-500 font-semibold mb-1">
                {item.itemType === 'bundle' ? t('bundleLabel') : t('partLabel', { number: item.partNumber ?? 1 })}
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {item.courseTitle}
              </div>
              {item.partTitle && (
                <div className="text-xs text-primary font-medium mt-0.5">
                  {item.partTitle}
                </div>
              )}

              {/* Price & Ticket Incentive */}
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">{t('totalUsd')} </span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    ${(item.priceCents / 100).toFixed(2)}
                  </span>
                  <bdi className="text-slate-400 ms-1.5">
                    ({item.displayPriceLabel})
                  </bdi>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/10 text-accent font-bold border border-accent/20">
                  <Ticket className="w-3.5 h-3.5" />
                  <span>{item.promotionalTickets} {tCommon('ticket')}</span>
                </div>
              </div>
            </div>

            {/* Authentication Gate or Verified User Card */}
            {isLoggedIn && user ? (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="min-w-0 truncate text-start">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                      {user.displayName || user.email}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                      {user.email}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0">
                  {isRtl ? 'حساب معتمد' : 'Verified'}
                </span>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                <div className="flex items-start gap-2.5 text-start">
                  <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300">
                      {isRtl ? 'تسجيل الدخول مطلوب لربط مشترياتك وتذاكرك' : 'Sign in to link your purchase & tickets'}
                    </h4>
                    <p className="text-[11px] text-amber-700/90 dark:text-amber-300/80 mt-0.5">
                      {isRtl
                        ? 'يرجى تسجيل الدخول أو إدخال بريدك لضمان إيداع تذاكر السحب ومحتوى الدورة باسمك.'
                        : 'Sign in to ensure your tickets and course access are credited to your account.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSignInRedirect}
                  className="w-full py-2.5 px-3 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isRtl ? 'تسجيل الدخول / إنشاء حساب' : 'Sign In / Register'}</span>
                </button>
              </div>
            )}

            {/* Email Field (Only editable if not logged in) */}
            {!isLoggedIn && (
              <div>
                <label htmlFor="checkout_email" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  {t('emailLabel')}
                </label>
                <div className="relative">
                  <input
                    id="checkout_email"
                    type="email"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    required
                    className={`w-full py-2.5 ps-3.5 pe-10 text-xs rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                      emailError
                        ? 'border-red-500 focus:ring-red-400/40'
                        : 'border-slate-200 dark:border-slate-700 focus:ring-primary/40'
                    }`}
                  />
                  <Mail className="absolute end-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {emailError && (
                  <p className="text-red-500 text-[11px] mt-1 font-semibold">{emailError}</p>
                )}
              </div>
            )}

            {/* Anti-Piracy Quiz Status / Button */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {t('quizHeading')}
                </span>
                {quizAnswers ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    {t('quizPassedBadge')}
                  </span>
                ) : (
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                    {t('quizRequiredBadge')}
                  </span>
                )}
              </div>

              {!quizAnswers ? (
                <button
                  type="button"
                  onClick={() => setIsQuizModalOpen(true)}
                  className="w-full py-2.5 px-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>{t('openQuizButton')}</span>
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>{t('quizExperienceLabel')}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{quizAnswers.experience_level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('quizGoalLabel')}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{quizAnswers.learning_goal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('quizHoursLabel')}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{quizAnswers.weekly_hours}</span>
                  </div>
                </div>
              )}
              {quizError && (
                <p className="text-red-500 text-[11px] mt-1 font-semibold">{quizError}</p>
              )}
            </div>

            {/* Canonical Legal Shield Checkbox */}
            <div>
              <LegalShieldCheckbox
                checked={legalAgreed}
                onChange={setLegalAgreed}
                error={legalError}
              />
            </div>

            {/* Global API Error */}
            {apiError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs">
                {apiError || t('checkoutFailed')}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-extrabold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('processingButton')}</span>
                </>
              ) : (
                <span>
                  {t('confirmAndPayButton', {
                    amount: `$${(item.priceCents / 100).toFixed(2)}`,
                  })}
                </span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Anti-Piracy Diagnostic Quiz Modal */}
      <AntiPiracyQuizModal
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        onComplete={(answers) => {
          setQuizAnswers(answers);
          setQuizError(null);
        }}
      />
    </>
  );
}
