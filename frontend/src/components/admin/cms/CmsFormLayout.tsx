'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Save, AlertCircle, ExternalLink } from 'lucide-react';

interface CmsFormLayoutProps {
  title: string;
  description: string;
  icon: React.ElementType;
  isSaving: boolean;
  isSaved?: boolean;
  errorMessage?: string | null;
  updatedAt?: string | null;
  targetRoute?: string;
  onSave: () => void;
  children: React.ReactNode;
}

export function CmsFormLayout({
  title,
  description,
  icon: Icon,
  isSaving,
  isSaved,
  errorMessage,
  updatedAt,
  targetRoute,
  onSave,
  children,
}: CmsFormLayoutProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const BackArrow = isAr ? ArrowRight : ArrowLeft;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-content-muted mb-1.5">
            <Link
              href={`/${locale}/admin/landing`}
              className="hover:text-primary flex items-center gap-1 transition-colors"
            >
              <BackArrow className="w-3.5 h-3.5" />
              <span>{isAr ? 'إدارة الواجهة الرئيسية' : 'Landing CMS Hub'}</span>
            </Link>
            <span>/</span>
            <span className="text-content-secondary">{title}</span>
          </div>

          <h1 className="text-2xl font-bold text-content-primary flex items-center gap-2.5">
            <Icon className="w-6 h-6 text-primary shrink-0" />
            <span>{title}</span>
          </h1>
          <p className="text-sm text-content-secondary mt-1">{description}</p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          {targetRoute && (
            <Link
              href={targetRoute.startsWith('/') && !targetRoute.startsWith(`/${locale}`) ? `/${locale}${targetRoute}` : targetRoute}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle hover:border-primary/50 text-content-primary hover:text-primary text-xs font-semibold transition-all shadow-xs"
              title={isAr ? 'معاينة الواجهة الحية' : 'View Live Surface'}
            >
              <ExternalLink className="w-3.5 h-3.5 text-primary" />
              <span>{isAr ? 'معاينة الواجهة الحية' : 'View Live Surface'}</span>
            </Link>
          )}

          {updatedAt && (
            <span className="text-xs text-content-muted hidden sm:inline-block">
              {isAr ? 'آخر تحديث: ' : 'Updated: '}
              {new Date(updatedAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}

          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isAr ? 'جارِ الحفظ...' : 'Saving...'}</span>
              </>
            ) : isSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                <span>{isAr ? 'تم الحفظ بنجاح' : 'Saved!'}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isAr ? 'حفظ التعديلات' : 'Save Changes'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error alert banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Form Body */}
      <div className="space-y-6">{children}</div>
    </div>
  );
}
