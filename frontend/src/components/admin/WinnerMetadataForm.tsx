'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { DrawWinnerRecord } from '@/types/admin';
import { SetWinnerPayload } from '@/hooks/admin/useAdminDraws';
import { Trophy, CheckCircle2, Loader2, Edit3, ShieldAlert } from 'lucide-react';

interface WinnerMetadataFormProps {
  winner: DrawWinnerRecord | null | undefined;
  isCompleted: boolean;
  onSetWinner: (payload: SetWinnerPayload) => Promise<any>;
}

export function WinnerMetadataForm({ winner, isCompleted, onSetWinner }: WinnerMetadataFormProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [isEditing, setIsEditing] = useState(false);
  const [maskedName, setMaskedName] = useState(winner?.winner_masked_name || '');
  const [governorate, setGovernorate] = useState(winner?.winner_governorate || '');
  const [prizeDelivered, setPrizeDelivered] = useState<boolean>(winner?.prize_delivered || false);
  const [streamRecordingUrl, setStreamRecordingUrl] = useState(winner?.stream_recording_url || '');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    try {
      setIsLoading(true);
      await onSetWinner({
        winner_masked_name: maskedName.trim() || undefined,
        winner_governorate: governorate.trim() || undefined,
        prize_delivered: prizeDelivered,
        stream_recording_url: streamRecordingUrl.trim() || undefined,
      });
      setStatusMsg({
        type: 'success',
        text: isAr ? 'تم تحديث بيانات الفائز بنجاح.' : 'Winner metadata updated successfully.',
      });
      setIsEditing(false);
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err?.message || (isAr ? 'فشل تحديث بيانات الفائز.' : 'Failed to update winner metadata.'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (winner) {
    return (
      <div className="bg-surface-card border border-border-subtle rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>{isAr ? 'الفائز المعتمد بالسحب' : 'Canonical Draw Winner'}</span>
          </h3>
          {!isEditing && (
            <button
              type="button"
              onClick={() => {
                setMaskedName(winner.winner_masked_name || '');
                setGovernorate(winner.winner_governorate || '');
                setPrizeDelivered(winner.prize_delivered || false);
                setStreamRecordingUrl(winner.stream_recording_url || '');
                setIsEditing(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-xs font-semibold text-content-primary transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-brand-gold" />
              <span>{isAr ? 'تعديل بيانات العرض' : 'Edit Display Metadata'}</span>
            </button>
          )}
        </div>

        {statusMsg && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
            }`}
          >
            <span>{statusMsg.text}</span>
          </div>
        )}

        <div className="p-4 rounded-xl bg-surface-elevated border border-border-subtle grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-content-secondary block">{isAr ? 'رقم التذكرة الرابحة:' : 'Winning Ticket Serial:'}</span>
            <span className="font-mono font-bold text-brand-gold text-sm">{winner.winning_ticket_serial}</span>
          </div>
          <div>
            <span className="text-content-secondary block">{isAr ? 'اسم الفائز (المحجوب):' : 'Masked Name:'}</span>
            <span className="font-bold text-content-primary">{winner.winner_masked_name || '—'}</span>
          </div>
          <div>
            <span className="text-content-secondary block">{isAr ? 'المحافظة / المدينة:' : 'Governorate:'}</span>
            <span className="font-semibold text-content-primary">{winner.winner_governorate || '—'}</span>
          </div>
          <div>
            <span className="text-content-secondary block">{isAr ? 'حالة استلام الجائزة:' : 'Prize Delivery:'}</span>
            <span className={`font-bold ${winner.prize_delivered ? 'text-emerald-400' : 'text-amber-400'}`}>
              {winner.prize_delivered ? (isAr ? 'تم التسليم' : 'Delivered') : (isAr ? 'قيد الانتظار' : 'Pending')}
            </span>
          </div>
        </div>

        {isEditing && (
          <form onSubmit={handleUpdate} className="pt-3 border-t border-border-subtle space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-content-primary block mb-1">
                  {isAr ? 'الاسم المحجوب للجمهور:' : 'Masked Name for Public Display:'}
                </label>
                <input
                  type="text"
                  value={maskedName}
                  onChange={(e) => setMaskedName(e.target.value)}
                  placeholder="e.g. A*** M***"
                  className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-xs text-content-primary focus:border-brand-gold focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-content-primary block mb-1">
                  {isAr ? 'المحافظة / المدينة:' : 'Governorate / City:'}
                </label>
                <input
                  type="text"
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  placeholder="e.g. Baghdad"
                  className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-xs text-content-primary focus:border-brand-gold focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-content-primary block mb-1">
                  {isAr ? 'رابط تسجيل البث المباشر (اختياري):' : 'Stream Recording URL (Optional):'}
                </label>
                <input
                  type="url"
                  value={streamRecordingUrl}
                  onChange={(e) => setStreamRecordingUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-xs text-content-primary focus:border-brand-gold focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="prizeDeliveredCheck"
                  checked={prizeDelivered}
                  onChange={(e) => setPrizeDelivered(e.target.checked)}
                  className="w-4 h-4 rounded-sm border-border-subtle text-brand-gold focus:ring-brand-gold"
                />
                <label htmlFor="prizeDeliveredCheck" className="text-xs font-semibold text-content-primary cursor-pointer">
                  {isAr ? 'تم تسليم الجائزة رسمياً للفائز' : 'Prize officially delivered to winner'}
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-xl border border-border-subtle text-xs text-content-secondary hover:text-content-primary"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-brand-gold text-brand-navy font-bold text-xs shadow-xs disabled:opacity-50"
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isAr ? 'حفظ التعديلات' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="bg-surface-card border border-border-subtle rounded-2xl p-6 shadow-xs space-y-3">
      <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
        <Trophy className="w-5 h-5 text-content-muted" />
        <span>{isAr ? 'سجل الفائز المعتمد' : 'Canonical Draw Winner'}</span>
      </h3>
      <div className="p-4 rounded-xl bg-surface-elevated/50 border border-border-subtle flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
        <div className="text-xs text-content-secondary leading-relaxed">
          <p className="font-semibold text-content-primary">
            {isAr ? 'لا يوجد فائز معتمد مسجل حتى الآن' : 'No Canonical Winner Recorded Yet'}
          </p>
          <p className="mt-1">
            {isAr
              ? 'يتم تحديد الفائز عبر خوارزمية HMAC-SHA256 المشفرة فور إتمام السحب. لا يمكن تزوير أو إنشاء سجلات فائزين يدوياً لضمان النزاهة الدستورية المطلقة.'
              : 'The canonical winner is selected cryptographically via HMAC-SHA256 upon draw execution. Winner records cannot be manually forged, ensuring absolute constitutional integrity.'}
          </p>
        </div>
      </div>
    </div>
  );
}
