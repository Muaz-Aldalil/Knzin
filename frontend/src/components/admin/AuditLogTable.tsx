'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { AuditLogItem } from '@/hooks/admin/useAdminAuditLogs';
import { formatDate } from '@/lib/admin/format';
import { ShieldCheck, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Code } from 'lucide-react';

interface AuditLogTableProps {
  logs: AuditLogItem[];
  isLoading: boolean;
}

export function AuditLogTable({ logs, isLoading }: AuditLogTableProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-xs text-content-secondary">
        {isAr ? 'جارِ تحميل سجل العمليات والتدقيق...' : 'Loading audit trail...'}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="p-12 text-center text-xs text-content-muted bg-surface-card border border-border-subtle rounded-2xl">
        {isAr ? 'لا توجد سجلات تدقيق مطابقة للشروط.' : 'No audit records match the selected criteria.'}
      </div>
    );
  }

  return (
    <div className="bg-surface-card border border-border-subtle rounded-2xl overflow-hidden shadow-xs">
      {/* Mobile Audit Cards View (< md) */}
      <div className="md:hidden divide-y divide-border-subtle">
        {logs.map((log) => {
          const isExpanded = expandedId === log.id;
          const isSuccess = log.outcome === 'success';

          return (
            <div key={log.id} className="p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span className="text-content-muted">#{log.id}</span>
                  <span className="text-content-secondary">•</span>
                  <span className="font-bold text-brand-gold">{log.action}</span>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isSuccess
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {isSuccess ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  <span>{log.outcome}</span>
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-content-secondary">
                <span className="truncate max-w-[200px] font-medium text-content-primary">
                  {log.actor?.email || 'System'}
                </span>
                <span className="text-[11px] text-content-muted whitespace-nowrap">
                  {formatDate(log.created_at, locale)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-elevated/60 border border-border-subtle text-xs font-mono">
                <span className="text-content-secondary truncate">
                  {log.target_type}:{log.target_id}
                </span>
                <span className="text-brand-gold/90 text-[10px] bg-brand-gold/10 px-2 py-0.5 rounded border border-brand-gold/20 shrink-0">
                  {log.capability_used}
                </span>
              </div>

              {log.reason && (
                <p className="text-xs text-content-secondary italic">
                  {isAr ? 'السبب: ' : 'Reason: '}{log.reason}
                </p>
              )}

              {log.metadata && (
                <div>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-elevated hover:bg-surface border border-border-subtle text-xs text-content-secondary transition-colors"
                  >
                    <Code className="w-3 h-3 text-brand-gold" />
                    <span>{isExpanded ? (isAr ? 'إخفاء البيانات' : 'Hide Payload') : (isAr ? 'عرض البيانات المشفرة' : 'View Payload')}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  {isExpanded && (
                    <div className="mt-2 p-3 bg-brand-navy/90 rounded-xl border border-border-subtle overflow-x-auto text-[11px] font-mono text-emerald-400">
                      <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-start text-xs">
          <thead className="bg-surface-elevated/70 border-b border-border-subtle text-content-secondary font-semibold">
            <tr>
              <th className="px-4 py-3 text-start">#</th>
              <th className="px-4 py-3 text-start">{isAr ? 'التاريخ والوقت' : 'Timestamp'}</th>
              <th className="px-4 py-3 text-start">{isAr ? 'المشرف المسؤول' : 'Admin Actor'}</th>
              <th className="px-4 py-3 text-start">{isAr ? 'العملية المنفذة' : 'Action'}</th>
              <th className="px-4 py-3 text-start">{isAr ? 'الصلاحية المستخدمة' : 'Capability'}</th>
              <th className="px-4 py-3 text-start">{isAr ? 'الهدف' : 'Target'}</th>
              <th className="px-4 py-3 text-start">{isAr ? 'النتيجة' : 'Outcome'}</th>
              <th className="px-4 py-3 text-start">{isAr ? 'التبرير / البيانات' : 'Details'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {logs.map((log) => {
              const isExpanded = expandedId === log.id;
              const isSuccess = log.outcome === 'success';

              return (
                <React.Fragment key={log.id}>
                  <tr className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-content-muted">#{log.id}</td>
                    <td className="px-4 py-3 text-content-secondary whitespace-nowrap">
                      {formatDate(log.created_at, locale)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-content-primary block">{log.actor?.email || 'System'}</span>
                      <span className="font-mono text-[10px] text-content-muted">{log.ip_address}</span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-brand-gold">{log.action}</td>
                    <td className="px-4 py-3 font-mono text-content-secondary">{log.capability_used}</td>
                    <td className="px-4 py-3 font-mono text-content-primary">
                      {log.target_type}:{log.target_id}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          isSuccess
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {isSuccess ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        <span>{log.outcome}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {log.reason && (
                          <span className="text-content-secondary truncate max-w-[150px]" title={log.reason}>
                            {log.reason}
                          </span>
                        )}
                        {log.metadata && (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : log.id)}
                            className="p-1 rounded-md bg-surface-elevated text-content-secondary hover:text-content-primary"
                            title={isAr ? 'عرض البيانات المشفرة' : 'View Payload'}
                          >
                            <Code className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded JSON details */}
                  {isExpanded && log.metadata && (
                    <tr className="bg-surface-elevated/60">
                      <td colSpan={8} className="p-4">
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-content-secondary block">
                            {isAr ? 'بيانات العملية المنقحة أمنياً (Redacted Metadata):' : 'Audited Metadata:'}
                          </span>
                          <pre className="p-3 rounded-xl bg-app-bg border border-border-subtle font-mono text-[11px] text-content-primary overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
