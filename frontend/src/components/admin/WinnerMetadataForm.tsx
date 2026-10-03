'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { DrawWinnerRecord } from '@/types/admin';
import { SetWinnerPayload } from '@/hooks/admin/useAdminDraws';
import { formatDate } from '@/lib/admin/format';
import { Trophy, CheckCircle2, Loader2, UserCheck } from 'lucide-react';

interface WinnerMetadataFormProps {
  winner: DrawWinnerRecord | null | undefined;
  isCompleted: boolean;
  onSetWinner: (payload: SetWinnerPayload) => Promise<any>;
}

export function WinnerMetadataForm({ winner, isCompleted, onSetWinner }: WinnerMetadataFormProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [ticketId, setTicketId] = useState('');
  const [maskedName, setMaskedName] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tid = parseInt(ticketId, 10);
    if (isNaN(tid) || tid <= 0) {
      alert(isAr ? 'يرجى إدخال معرف تذكرة صحيح.' : 'Valid ticket ID required.');
      return;
    }

    try {
      setIsLoading(true);
      await onSetWinner({
        ticket_id: tid,
        winner_masked_name: maskedName.trim() || undefined,
        winner_governorate: governorate.trim() || undefined,
      });
      setTicketId('');
      setMaskedName('');
      setGovernorate('');
    } catch (err: any) {
      alert(err?.message || (isAr ? 'فشل تسجيل الفائز.' : 'Failed to record winner.'));
    } finally {
      setIsLoading(false);
    }
  };

  if (winner) {
    return (
      <div className="bg-surface-card border border-border-subtle rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span>{isAr ? 'الفائز المعتمد بالسحب' : 'Canonical Draw Winner'}</span>
        </h3>
        <div className="p-4 rounded-xl bg-surface-elevated border border-border-subtle grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
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
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-card border border-border-subtle rounded-2xl p-6 shadow-xs space-y-4">
      <div>
        <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-brand-gold" />
          <span>{isAr ? 'تسجيل تذكرة الفائز' : 'Record Canonical Winning Ticket'}</span>
        </h3>
        <p className="text-xs text-content-secondary mt-0.5">
          {isAr
            ? 'يشترط وجود فائز معتمد قبل إمكانية إتمام السحب وكشف بذرة التشفير.'
            : 'A canonical winner must exist before the draw can be completed and seed revealed.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-content-primary block mb-1">
              {isAr ? 'معرف التذكرة (Ticket ID):' : 'Ticket ID:'}
            </label>
            <input
              type="number"
              min="1"
              required
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              placeholder="e.g. 101"
              className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-xs text-content-primary font-mono focus:border-brand-gold focus:outline-hidden"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-content-primary block mb-1">
              {isAr ? 'الاسم المحجوب للجمهور:' : 'Masked Name:'}
            </label>
            <input
              type="text"
              value={maskedName}
              onChange={(e) => setMaskedName(e.target.value)}
              placeholder="A*** M***"
              className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-xs text-content-primary focus:border-brand-gold focus:outline-hidden"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-content-primary block mb-1">
              {isAr ? 'المحافظة:' : 'Governorate:'}
            </label>
            <input
              type="text"
              value={governorate}
              onChange={(e) => setGovernorate(e.target.value)}
              placeholder="Baghdad"
              className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-xs text-content-primary focus:border-brand-gold focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isLoading || !ticketId}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-gold text-brand-navy font-bold text-xs shadow-xs disabled:opacity-50"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isAr ? 'تثبيت الفائز بالسجل' : 'Register Winner'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
