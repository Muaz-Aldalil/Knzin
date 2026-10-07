'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAdminDraws, CreateDrawPayload } from '@/hooks/admin/useAdminDraws';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { DrawForm } from '@/components/admin/DrawForm';
import { useAdminFeedback } from '@/components/admin/AdminFeedbackContext';
import { Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function NewDrawPage() {
  const locale = useLocale();
  const router = useRouter();
  const isAr = locale === 'ar';
  const { showError } = useAdminFeedback();
  const ArrowIcon = isAr ? ArrowRight : ArrowLeft;

  const { createDraw, isCreating } = useAdminDraws();

  const handleCreate = async (payload: any) => {
    try {
      const created = await createDraw(payload as CreateDrawPayload);
      router.push(`/${locale}/admin/draws/${created.id}`);
    } catch (err: any) {
      showError(err?.message || (isAr ? 'فشل إنشاء السحب.' : 'Failed to create draw.'));
    }
  };

  return (
    <AdminGuard requiredCapability="manage_platform_settings">
      <div className="space-y-6 max-w-4xl" data-testid="admin-new-draw-page">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/admin/draws`}
            className="p-2 rounded-xl border border-border-subtle text-content-secondary hover:text-content-primary hover:bg-surface-elevated transition-colors"
          >
            <ArrowIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-content-primary flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-gold" />
              <span>{isAr ? 'إنشاء مسودة سحب جديدة' : 'Create New Draw Draft'}</span>
            </h1>
            <p className="text-xs text-content-secondary mt-0.5">
              {isAr
                ? 'يتم إنشاء السحب كمسودة خاصة أولاً، ثم يمكنك إضافة الجوائز ونشره للجمهور.'
                : 'Draws are initially created as private drafts, allowing you to attach prizes before publication.'}
            </p>
          </div>
        </div>

        <DrawForm onSubmit={handleCreate} isLoading={isCreating} />
      </div>
    </AdminGuard>
  );
}
