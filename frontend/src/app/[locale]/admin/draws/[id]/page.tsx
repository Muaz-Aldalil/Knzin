'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { useAdminDrawDetail } from '@/hooks/admin/useAdminDraws';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { DrawLifecyclePanel } from '@/components/admin/DrawLifecyclePanel';
import { PrizeEditor } from '@/components/admin/PrizeEditor';
import { WinnerMetadataForm } from '@/components/admin/WinnerMetadataForm';
import { DrawForm } from '@/components/admin/DrawForm';
import { Loader2, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

export default function AdminDrawDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const locale = useLocale();
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowRight : ArrowLeft;

  const {
    draw,
    isLoading,
    isError,
    error,
    updateDraw,
    isUpdating,
    publishDraw,
    completeDraw,
    addPrize,
    deletePrize,
    setWinner,
  } = useAdminDrawDetail(id);

  if (isLoading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-gold" />
        <p className="text-xs text-content-secondary">{isAr ? 'جارِ تحميل السحب...' : 'Loading draw details...'}</p>
      </div>
    );
  }

  if (isError || !draw) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
        {error?.message || (isAr ? 'تعذر العثور على السحب.' : 'Draw not found.')}
      </div>
    );
  }

  const isLocked = draw.status === 'locked' || draw.status === 'completed';

  return (
    <AdminGuard requiredCapability="manage_platform_settings">
      <div className="space-y-8 max-w-5xl" data-testid="admin-draw-detail-page">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/admin/draws`}
            className="p-2 rounded-xl border border-border-subtle text-content-secondary hover:text-content-primary hover:bg-surface-elevated transition-colors"
          >
            <ArrowIcon className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-brand-gold font-bold">#{draw.id}</span>
              <span className="text-content-muted">•</span>
              <span className="text-xs font-semibold text-content-secondary capitalize">
                {draw.tier} • {draw.execution_type}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-content-primary">
              {isAr ? draw.title_ar : draw.title_en}
            </h1>
          </div>
        </div>

        {/* Lifecycle & Cryptographic Seed Commitment Panel */}
        <DrawLifecyclePanel
          draw={draw}
          onPublish={publishDraw}
          onComplete={completeDraw}
        />

        {/* Prize Inventory Management */}
        <PrizeEditor
          prizes={draw.prizes || []}
          isLocked={isLocked}
          onAddPrize={addPrize}
          onDeletePrize={deletePrize}
        />

        {/* Winner Recording */}
        <WinnerMetadataForm
          winner={draw.winner}
          isCompleted={draw.status === 'completed'}
          onSetWinner={setWinner}
        />

        {/* Edit Draw Form */}
        {!isLocked && (
          <DrawForm
            initialDraw={draw}
            onSubmit={async (payload) => {
              await updateDraw(payload);
              alert(isAr ? 'تم حفظ التعديلات بنجاح.' : 'Changes saved successfully.');
            }}
            isLoading={isUpdating}
          />
        )}
      </div>
    </AdminGuard>
  );
}
