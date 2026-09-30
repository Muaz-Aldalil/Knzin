'use client';

import React, { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  useEffect(() => {
    // Log exception for debugging and telemetry
    console.error('[Application Crash Boundary Caught Error]:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 bg-card border border-border/70 rounded-2xl shadow-xl space-y-6">
        <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            {isRtl ? 'حدث خطأ غير متوقع' : 'Something went wrong'}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isRtl
              ? 'نعتذر، واجهت الصفحة مشكلة تقنية غير متوقعة. يرجى إعادة المحاولة أو العودة للصفحة الرئيسية.'
              : 'An unexpected runtime error occurred. Please try reloading the view or navigate back home.'}
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="p-3 bg-muted/50 rounded-xl text-start text-xs font-mono text-destructive/90 overflow-x-auto max-h-32 border border-border">
            {error.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow hover:bg-primary/90 transition-all active:scale-[0.98]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{isRtl ? 'إعادة المحاولة' : 'Try Again'}</span>
          </button>

          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-muted/60 text-foreground font-semibold text-sm hover:bg-muted transition-all active:scale-[0.98] border border-border/60"
          >
            <Home className="w-4 h-4" />
            <span>{isRtl ? 'الرئيسية' : 'Go Home'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
