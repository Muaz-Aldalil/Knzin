'use client';

import React from 'react';
import { useAdminSession } from '@/hooks/admin/useAdminSession';
import { AdminCapability } from '@/types/admin';
import { ShieldAlert, LogIn, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';

interface AdminGuardProps {
  children: React.ReactNode;
  requiredCapability?: AdminCapability | AdminCapability[];
}

export function AdminGuard({ children, requiredCapability }: AdminGuardProps) {
  const { session, capabilities, isLoading, isUnauthenticated, isForbidden, can } = useAdminSession();
  const locale = useLocale();
  const isAr = locale === 'ar';

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-content-secondary font-medium">
          {isAr ? 'جارِ التحقق من الصلاحيات الإدارية...' : 'Verifying administrative privileges...'}
        </p>
      </div>
    );
  }

  if (isUnauthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-6">
          <LogIn className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-content-primary mb-2">
          {isAr ? 'تسجيل الدخول الإداري مطلوب' : 'Admin Authentication Required'}
        </h2>
        <p className="text-content-secondary max-w-md mb-6">
          {isAr
            ? 'يرجى تسجيل الدخول بحساب يمتلك صلاحيات إدارية للوصول إلى لوحة التحكم.'
            : 'Please authenticate with an account holding active administrative capabilities.'}
        </p>
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover transition-colors"
        >
          {isAr ? 'العودة للرئيسية وتسجيل الدخول' : 'Return Home & Sign In'}
        </Link>
      </div>
    );
  }

  // If user has zero capabilities or isForbidden
  if (isForbidden || capabilities.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center" data-testid="admin-403-state">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-content-primary mb-2">
          {isAr ? '403 - غير مصرح لك بالوصول' : '403 - Forbidden Access'}
        </h2>
        <p className="text-content-secondary max-w-md mb-6">
          {isAr
            ? 'هذا الحساب لا يمتلك أي صلاحيات إدارية فعالة في المنظومة.'
            : 'This account possesses no active administrative capabilities.'}
        </p>
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-surface-card border border-border-subtle text-content-primary hover:bg-surface-elevated transition-colors text-sm"
        >
          {isAr ? 'العودة للمنصة' : 'Back to Platform'}
        </Link>
      </div>
    );
  }

  // Check specific capability if required
  if (requiredCapability && !can(requiredCapability)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center" data-testid="admin-missing-capability-state">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-content-primary mb-2">
          {isAr ? 'صلاحية غير متوفرة' : 'Missing Capability'}
        </h2>
        <p className="text-content-secondary max-w-md mb-6">
          {isAr
            ? 'لا تمتلك الصلاحية الإدارية اللازمة لعرض هذا القسم المحدد.'
            : 'You lack the specific capability required to access this section.'}
        </p>
        <Link
          href={`/${locale}/admin`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-colors text-sm"
        >
          {isAr ? 'العودة للوحة التحكم' : 'Return to Admin Dashboard'}
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
