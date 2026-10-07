'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { UserItem } from '@/hooks/admin/useAdminUsers';
import { AdminCapability } from '@/types/admin';
import { ReasonDialog } from './ReasonDialog';
import { useAdminFeedback } from './AdminFeedbackContext';
import { Shield, ShieldCheck, ShieldAlert, X, Plus, Trash2, Loader2 } from 'lucide-react';

const ALL_CAPABILITIES: { key: AdminCapability; labelAr: string; labelEn: string; descAr: string; descEn: string }[] = [
  {
    key: 'manage_admin_capabilities',
    labelAr: 'إدارة الصلاحيات والمشرفين',
    labelEn: 'Manage Admin Capabilities',
    descAr: 'منح أو سحب الصلاحيات الإدارية للمستخدمين والاطلاع على سجل التدقيق.',
    descEn: 'Grant or revoke administrative capabilities and access audit logs.',
  },
  {
    key: 'manage_platform_settings',
    labelAr: 'إعدادات المنصة والسحوبات',
    labelEn: 'Platform Settings & Draws',
    descAr: 'تعديل نسبة العمولة، وإدارة السحوبات والجوائز والتذاكر الترويجية.',
    descEn: 'Configure commission rates, draw schedules, prizes, and awards.',
  },
  {
    key: 'adjudicate_affiliate_coprize',
    labelAr: 'البت في جوائز الشركاء (40%)',
    labelEn: 'Adjudicate Co-Prizes',
    descAr: 'الموافقة على صرف أو إلغاء حصة المسوق (40%) من الجائزة الكبرى.',
    descEn: 'Release or revoke marketing pool co-prizes for referred grand prize winners.',
  },
  {
    key: 'settle_affiliate_payout',
    labelAr: 'تسوية طلبات السحب',
    labelEn: 'Settle Affiliate Payouts',
    descAr: 'تنفيذ وتأكيد حوالات الأرباح برقم MTCN ووصل التحويل، أو رفضها.',
    descEn: 'Settle affiliate payouts with MTCN reference & receipt, or reject.',
  },
  {
    key: 'issue_kyc_approval',
    labelAr: 'إصدار موافقة هوية الفائز (KYC)',
    labelEn: 'Issue Winner KYC Approval',
    descAr: 'فحص وتوثيق الهوية الوطنية العراقية للفائز بالجائزة الكبرى.',
    descEn: 'Verify and approve National ID of winning tickets.',
  },
  {
    key: 'issue_draw_audit_approval',
    labelAr: 'إصدار موافقة نزاهة السحب',
    labelEn: 'Issue Draw Integrity Audit',
    descAr: 'تدقيق واشتمال الالتزام التشفيري المسبق وسلامة عملية السحب.',
    descEn: 'Audit cryptographic commitment compliance for draw execution.',
  },
];

interface CapabilityManagerProps {
  user: UserItem;
  currentUserId?: number;
  onGrant: (capability: string, justification?: string) => Promise<any>;
  onRevoke: (capability: string, reason: string) => Promise<any>;
  onClose: () => void;
}

export function CapabilityManager({
  user,
  currentUserId,
  onGrant,
  onRevoke,
  onClose,
}: CapabilityManagerProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const { showSuccess, showError } = useAdminFeedback();

  const [revokingCap, setRevokingCap] = useState<string | null>(null);
  const [grantingCap, setGrantingCap] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isSelf = currentUserId === user.id;

  const handleGrant = async (capKey: string) => {
    try {
      setIsLoading(true);
      await onGrant(capKey);
      showSuccess(
        isAr ? 'تم منح الصلاحية بنجاح.' : 'Capability granted successfully.',
        isAr ? 'تم تحديث الصلاحيات' : 'Capabilities Updated'
      );
    } catch (err: any) {
      showError(err?.message || (isAr ? 'فشل منح الصلاحية.' : 'Failed to grant capability.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeConfirm = async (reason: string) => {
    if (!revokingCap) return;
    try {
      setIsLoading(true);
      await onRevoke(revokingCap, reason);
      setRevokingCap(null);
      showSuccess(
        isAr ? 'تم سحب الصلاحية بنجاح وتوثيق السبب في السجل.' : 'Capability revoked successfully and reason logged.',
        isAr ? 'تم سحب الصلاحية' : 'Capability Revoked'
      );
    } catch (err: any) {
      showError(err?.message || (isAr ? 'فشل سحب الصلاحية.' : 'Failed to revoke capability.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface-card border border-border-subtle rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-brand-gold" />
              <h3 className="text-lg font-bold text-content-primary">
                {isAr ? 'إدارة الصلاحيات الإدارية' : 'Manage Administrative Capabilities'}
              </h3>
            </div>
            <p className="text-xs text-content-secondary mt-1">
              {user.email} <span className="font-mono text-brand-gold">({user.learner_code})</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-border-subtle text-content-secondary hover:text-content-primary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSelf && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>
              {isAr
                ? 'لا يمكنك منح أو تعديل صلاحيات حسابك الخاص لحماية نزاهة المنظومة.'
                : 'Anti-self-elevation invariant: You cannot modify your own administrative capabilities.'}
            </span>
          </div>
        )}

        {/* Capabilities Grid */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto px-1">
          {ALL_CAPABILITIES.map((cap) => {
            const hasCap = (user.capabilities || []).includes(cap.key);

            return (
              <div
                key={cap.key}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                  hasCap
                    ? 'bg-brand-gold/5 border-brand-gold/30'
                    : 'bg-surface-elevated/40 border-border-subtle'
                }`}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-content-primary">
                      {isAr ? cap.labelAr : cap.labelEn}
                    </span>
                    <span className="font-mono text-[10px] text-content-muted break-all">({cap.key})</span>
                  </div>
                  <p className="text-xs text-content-secondary leading-relaxed">
                    {isAr ? cap.descAr : cap.descEn}
                  </p>
                </div>

                <div className="shrink-0 self-end sm:self-start pt-1">
                  {hasCap ? (
                    <button
                      type="button"
                      disabled={isSelf || isLoading}
                      onClick={() => setRevokingCap(cap.key)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      data-testid={`revoke-cap-${cap.key}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isAr ? 'سحب' : 'Revoke'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isSelf || isLoading}
                      onClick={() => handleGrant(cap.key)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-brand-navy text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      data-testid={`grant-cap-${cap.key}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAr ? 'منح' : 'Grant'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Revoke Reason Dialog */}
        <ReasonDialog
          isOpen={!!revokingCap}
          title={isAr ? 'سحب الصلاحية الإدارية' : 'Revoke Administrative Capability'}
          description={
            isAr
              ? `سيتم سحب الصلاحية ${revokingCap} فورياً من المستخدم ${user.email}. كتابة تبرير السحب إلزامي للرقابة.`
              : `Capability ${revokingCap} will be revoked from ${user.email}. Justification is mandatory for audit.`
          }
          placeholder={isAr ? 'اكتب سبب سحب الصلاحية...' : 'Specify revocation reason...'}
          isLoading={isLoading}
          onConfirm={handleRevokeConfirm}
          onClose={() => setRevokingCap(null)}
        />
      </div>
    </div>
  );
}
