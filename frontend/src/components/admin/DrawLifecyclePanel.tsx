'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { DrawRecord } from '@/types/admin';
import { StatusBadge } from './StatusBadge';
import { ConfirmDialog } from './ConfirmDialog';
import { useAdminFeedback } from './AdminFeedbackContext';
import { formatDate } from '@/lib/admin/format';
import { ShieldCheck, Lock, Eye, Copy, Check, Sparkles, Loader2, AlertTriangle } from 'lucide-react';

interface DrawLifecyclePanelProps {
  draw: DrawRecord;
  onPublish: () => Promise<any>;
  onComplete: () => Promise<any>;
}

export function DrawLifecyclePanel({ draw, onPublish, onComplete }: DrawLifecyclePanelProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const { showSuccess, showError } = useAdminFeedback();

  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedSeed, setCopiedSeed] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const copyToClipboard = async (text: string, type: 'hash' | 'seed') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'hash') {
        setCopiedHash(true);
        setTimeout(() => setCopiedHash(false), 2000);
      } else {
        setCopiedSeed(true);
        setTimeout(() => setCopiedSeed(false), 2000);
      }
    } catch {
      // Ignore
    }
  };

  const handlePublishConfirm = async () => {
    try {
      setIsLoading(true);
      await onPublish();
      setIsPublishOpen(false);
      showSuccess(isAr ? 'تم نشر السحب للجمهور بنجاح.' : 'Draw published successfully.');
    } catch (err: any) {
      showError(err?.message || (isAr ? 'فشل نشر السحب.' : 'Failed to publish draw.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteConfirm = async () => {
    try {
      setIsLoading(true);
      await onComplete();
      setIsCompleteOpen(false);
      showSuccess(isAr ? 'تم إتمام واختتام السحب بنجاح.' : 'Draw completed successfully.');
    } catch (err: any) {
      showError(err?.message || (isAr ? 'فشل إتمام السحب.' : 'Failed to complete draw.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface-card border border-border-subtle rounded-2xl p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-gold" />
            <span>{isAr ? 'إدارة دورة حياة السحب والالتزام المشفر' : 'Draw Lifecycle & Cryptographic Commitments'}</span>
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={draw.status} />
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                draw.is_published
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
              }`}
            >
              {draw.is_published
                ? isAr
                  ? 'منشور للجمهور'
                  : 'Published'
                : isAr
                ? 'مسودة خاصة (غير مرئي للجمهور)'
                : 'Private Draft'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!draw.is_published && (
            <button
              onClick={() => setIsPublishOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-gold text-brand-navy font-bold text-xs shadow-xs hover:bg-brand-gold-light transition-colors"
              data-testid="publish-draw-button"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isAr ? 'نشر السحب رسمياً للجمهور' : 'Publish Draw'}</span>
            </button>
          )}

          {draw.is_published && draw.status !== 'completed' && draw.winner && (
            <button
              onClick={() => setIsCompleteOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors"
              data-testid="complete-draw-button"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? 'إتمام السحب وكشف بذرة التشفير' : 'Complete & Reveal Seed'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Cryptographic Proof Card */}
      <div className="p-4 rounded-xl bg-surface-elevated/60 border border-border-subtle space-y-3">
        <h4 className="text-xs font-bold text-content-primary flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-brand-gold" />
          <span>{isAr ? 'الالتزام التشفيري المسبق (SHA-256 Seed Commitment)' : 'SHA-256 Cryptographic Commitment'}</span>
        </h4>

        {!draw.is_published ? (
          <p className="text-xs text-content-secondary">
            {isAr
              ? 'السحب حالياً مسودة خاصة. عند النشر، سيقوم النظام تلقائياً بتوليد بذرة عشوائية وتشفيرها ونشر بصمة SHA-256 علناً.'
              : 'Draft draw. Upon publication, an unguessable CSPRNG server seed is committed via public SHA-256 hash.'}
          </p>
        ) : (
          <div className="space-y-2">
            <div>
              <span className="text-[11px] text-content-secondary block mb-1">
                {isAr ? 'بصمة الالتزام المنشورة علناً (Hash):' : 'Public Commitment Hash:'}
              </span>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-surface-card border border-border-subtle rounded-lg px-3 py-1.5 font-mono text-xs text-brand-gold truncate">
                  {draw.server_seed_hash || draw.seed_commitment_hash || '—'}
                </div>
                {(draw.server_seed_hash || draw.seed_commitment_hash) && (
                  <button
                    onClick={() => copyToClipboard((draw.server_seed_hash || draw.seed_commitment_hash)!, 'hash')}
                    className="p-1.5 rounded-lg border border-border-subtle text-content-secondary hover:text-content-primary"
                  >
                    {copiedHash ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            {(draw.server_seed_revealed || draw.revealed_server_seed) ? (
              <div className="pt-2 border-t border-border-subtle">
                <span className="text-[11px] text-emerald-400 font-bold block mb-1">
                  {isAr ? 'بذرة الخادم المكشوفة (البرهان الحسابي):' : 'Revealed Server Seed (Mathematical Proof):'}
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-surface-card border border-border-subtle rounded-lg px-3 py-1.5 font-mono text-xs text-emerald-400 truncate">
                    {draw.server_seed_revealed || draw.revealed_server_seed}
                  </div>
                  <button
                    onClick={() => copyToClipboard((draw.server_seed_revealed || draw.revealed_server_seed)!, 'seed')}
                    className="p-1.5 rounded-lg border border-border-subtle text-content-secondary hover:text-content-primary"
                  >
                    {copiedSeed ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-content-muted mt-1">
                  {isAr
                    ? 'يمكن لأي مدقق التحقق حسابياً من أن sha256(revealed_server_seed) يطابق بدقة بصمة الالتزام المنشورة مسبقاً.'
                    : 'Anyone can independently compute sha256(revealed_server_seed) to verify it matches the pre-published commitment.'}
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-content-muted">
                {isAr
                  ? 'بذرة الخادم الأصلية مشفرة ومحجوبة أمنياً في قاعدة البيانات حتى اكتمال السحب.'
                  : 'Server seed is securely locked and will be revealed upon draw completion.'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={isPublishOpen}
        title={isAr ? 'نشر السحب للجمهور' : 'Publish Draw to Public'}
        description={
          isAr
            ? 'سيؤدي هذا الإجراء إلى توليد بصمة التشفير وتثبيتها ونشر السحب على المنصة العامة للطلاب. لن يمكن التراجع عن بصمة التشفير.'
            : 'This will lock the cryptographic seed commitment hash and make the draw visible to public consumers.'
        }
        isLoading={isLoading}
        onConfirm={handlePublishConfirm}
        onClose={() => setIsPublishOpen(false)}
      />

      <ConfirmDialog
        isOpen={isCompleteOpen}
        title={isAr ? 'إتمام السحب وكشف بذرة التشفير' : 'Complete Draw & Reveal Seed'}
        description={
          isAr
            ? `سيتم وسم السحب كمكتمل وكشف بذرة التشفير علناً لإثبات النزاهة الرياضية للفائز ${draw.winner?.winning_ticket_serial}.`
            : `Mark draw completed and reveal server seed to prove draw mathematical integrity for winner ${draw.winner?.winning_ticket_serial}.`
        }
        isLoading={isLoading}
        onConfirm={handleCompleteConfirm}
        onClose={() => setIsCompleteOpen(false)}
      />
    </div>
  );
}
