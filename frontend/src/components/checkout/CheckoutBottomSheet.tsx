'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { X, Ticket, Mail, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';
import LegalShieldCheckbox from './LegalShieldCheckbox';
import AntiPiracyQuizModal, { QuizAnswers } from './AntiPiracyQuizModal';
import { useCheckout } from '@/hooks/useCheckout';

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
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [legalAgreed, setLegalAgreed] = useState(false);
  const [legalError, setLegalError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers | null>(null);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  const { createOrder, isLoading, error: apiError } = useCheckout();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLegalError(null);
    setEmailError(null);
    setQuizError(null);

    // 1. Email check
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setEmailError('يرجى إدخال بريد إلكتروني صالح');
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

      // Navigate to order confirmation
      onClose();
      router.push(`/order-summary/${order.order_number}`);
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

            {/* Email Field */}
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
                <p className="mt-1 text-xs font-semibold text-red-600">{emailError}</p>
              )}
              <p className="mt-1 text-[11px] text-slate-500">{t('emailHelp')}</p>
            </div>

            {/* Anti-Piracy 3-Step Quiz Trigger */}
            <div className="p-3.5 rounded-xl border border-primary/20 bg-primary-light/50 dark:bg-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {quizAnswers ? t('quizDone') : t('quizPrompt')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsQuizModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow transition-colors"
              >
                {quizAnswers ? (locale === 'ar' ? 'تعديل الإجابات' : 'Edit Answers') : t('takeQuiz')}
              </button>
            </div>
            {quizError && (
              <p className="text-xs font-semibold text-red-600">{quizError}</p>
            )}

            {/* Mandatory Canonical Legal Shield */}
            <LegalShieldCheckbox
              checked={legalAgreed}
              onChange={(checked) => {
                setLegalAgreed(checked);
                if (checked) setLegalError(null);
              }}
              error={legalError}
            />

            {/* API Error Alert */}
            {apiError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-500/30 text-xs font-semibold text-red-700 dark:text-red-400">
                {apiError}
              </div>
            )}

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-lg shadow-primary/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('submitting')}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span>{t('confirmOrder')}</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-slate-400 leading-relaxed">
              {t('legalNotice')}
            </p>
          </form>
        </div>
      </div>

      {/* Quiz Modal */}
      <AntiPiracyQuizModal
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        initialAnswers={quizAnswers}
        onComplete={(answers) => {
          setQuizAnswers(answers);
          setQuizError(null);
        }}
      />
    </>
  );
}
