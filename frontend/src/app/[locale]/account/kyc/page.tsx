'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { WinnerKycCard } from '@/components/compliance/WinnerKycCard';
import { ArrowLeft, ArrowRight, MessageCircle, Trophy } from 'lucide-react';

export default function WinnerKycPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const whatsappPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+9647800000000';
  const whatsappUrl = `https://wa.me/${whatsappPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    isRtl
      ? 'مرحباً فريق كنزين، لقد فزت بتذكرة في السحب وأرغب في تأكيد بيانات التحقق من الهوية (KYC) لاستلام جائزتي.'
      : 'Hello KNZiN Team, I have a winning draw ticket and would like to complete KYC verification to claim my prize.'
  )}`;

  return (
    <div className="min-h-[75vh] py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Breadcrumb / Back button */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-content-secondary hover:text-content-primary transition-colors"
        >
          {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span>{isRtl ? 'العودة إلى لوحة المتدرب' : 'Back to Learner Dashboard'}</span>
        </Link>
      </div>

      {/* Page Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 mb-4 shadow-xs">
          <Trophy className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight">
          {isRtl ? 'التحقق من هوية الفائز (KYC)' : 'Winner Identity Verification (KYC)'}
        </h1>
        <p className="mt-2 text-sm text-content-secondary max-w-xl mx-auto">
          {isRtl
            ? 'تهانينا على فوزك في سحب كنزين! لضمان الأمان والنزاهة القانونية، يرجى مراجعة شروط استلام الجائزة وتأكيد بيانات هويتك.'
            : 'Congratulations on winning the KNZiN draw! To ensure security and compliance, please review the claim terms and verify your identity.'}
        </p>
      </div>

      {/* Compliance Card */}
      <div className="mb-8">
        <WinnerKycCard variant="standalone" />
      </div>

      {/* Action Card: Direct Concierge Claim via WhatsApp */}
      <div className="bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 text-center shadow-xs">
        <h2 className="text-base sm:text-lg font-bold text-content-primary mb-2">
          {isRtl ? 'تأكيد الهوية واستلام الجائزة مباشرة' : 'Direct KYC Confirmation & Prize Claim'}
        </h2>
        <p className="text-xs sm:text-sm text-content-secondary max-w-lg mx-auto mb-6">
          {isRtl
            ? 'لتقديم صورة البطاقة الموحدة أو إثبات الهوية ومطابقة رقم التذكرة مع مسؤولي خدمة العملاء الرسميين:'
            : 'Submit a copy of your National ID or passport and confirm your winning ticket serial directly with our support desk:'}
        </p>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-sm cursor-pointer"
        >
          <MessageCircle className="w-5 h-5" />
          <span>{isRtl ? 'التواصل مع إدارة التحقق عبر واتساب' : 'Contact KYC Support on WhatsApp'}</span>
        </a>
      </div>
    </div>
  );
}
