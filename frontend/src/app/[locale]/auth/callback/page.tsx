'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const { login } = useAuth();
  const [mergedCount, setMergedCount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(true);
  const processedRef = React.useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const name = searchParams.get('name');
    const merged = parseInt(searchParams.get('merged_orders') || '0', 10);

    if (token && email) {
      processedRef.current = true;
      setMergedCount(merged);
      login(token, {
        id: email,
        email,
        displayName: name,
        authProvider: 'google',
        isVerified: true,
      });

      const target = searchParams.get('redirect') || '/';

      const timer = setTimeout(() => {
        setIsProcessing(false);
        router.replace(target as any);
      }, 1500);

      return () => clearTimeout(timer);
    } else if (!token && !email) {
      processedRef.current = true;
      const target = searchParams.get('redirect') || '/';
      router.replace(target as any);
    }
  }, [searchParams, login, router]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="p-8 max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl space-y-4">
        {isProcessing ? (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
            <h2 className="text-base font-bold text-slate-800 dark:text-white">
              {isRtl ? 'جاري تسجيل الدخول وحفظ الجلسة...' : 'Signing in and establishing session...'}
            </h2>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
            <h2 className="text-lg font-extrabold text-secondary dark:text-white">
              {isRtl ? 'تم تسجيل الدخول بنجاح!' : 'Signed in successfully!'}
            </h2>
          </>
        )}

        {mergedCount > 0 && (
          <div className="p-3.5 rounded-xl bg-primary-light/60 dark:bg-primary/10 border border-primary/20 flex items-center gap-2 text-xs font-semibold text-primary text-start">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <span>
              {isRtl
                ? `تم دمج وتثبيت ${mergedCount} طلب شراء سابق قمت به كزائر مع حسابك الموثق!`
                : `Merged and linked ${mergedCount} previous guest order(s) with your verified account!`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
