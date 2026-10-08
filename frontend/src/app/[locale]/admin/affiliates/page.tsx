'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { useAdminAffiliates, useAdminAffiliateLedger, AdminAffiliateItem } from '@/hooks/admin/useAdminAffiliates';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { DataTable, Column } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { MoneyText } from '@/components/admin/MoneyText';
import { formatDate } from '@/lib/admin/format';
import { Users, Search, BookOpen, X, ArrowDownLeft, ArrowUpRight, ShieldAlert } from 'lucide-react';

export default function AdminAffiliatesPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminAffiliateItem | null>(null);

  const { affiliates, meta, isLoading, isError, error } = useAdminAffiliates(page, activeSearch);
  const { ledgerItems, isLoading: isLedgerLoading } = useAdminAffiliateLedger(selectedUser?.user_id ?? null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setActiveSearch(searchTerm);
  };

  const columns: Column<AdminAffiliateItem>[] = [
    {
      key: 'user_id',
      header: isAr ? 'المعرف' : 'User ID',
      render: (item) => <span className="font-mono text-xs text-content-secondary">#{item.user_id}</span>,
    },
    {
      key: 'email',
      header: isAr ? 'البريد الإلكتروني / الحساب' : 'Affiliate Account',
      render: (item) => (
        <div>
          <span className="font-bold text-content-primary block">{item.email}</span>
          <span className="text-xs font-mono text-brand-gold">{item.learner_code}</span>
        </div>
      ),
    },
    {
      key: 'available_cents',
      header: isAr ? 'الرصيد المتاح' : 'Available',
      render: (item) => <MoneyText cents={item.available_cents} />,
    },
    {
      key: 'pending_cents',
      header: isAr ? 'قيد الاستحقاق' : 'Pending',
      render: (item) => (
        <span className="font-mono text-xs text-amber-400">
          <MoneyText cents={item.pending_cents} />
        </span>
      ),
    },
    {
      key: 'lifetime_earned_cents',
      header: isAr ? 'إجمالي الأرباح' : 'Lifetime Earned',
      render: (item) => <MoneyText cents={item.lifetime_earned_cents} />,
    },
    {
      key: 'pending_payout_count',
      header: isAr ? 'طلبات سحب معلقة' : 'Pending Payouts',
      render: (item) =>
        item.pending_payout_count > 0 ? (
          <span className="text-xs font-bold text-amber-500">
            {item.pending_payout_count}
          </span>
        ) : (
          <span className="text-xs text-content-muted">0</span>
        ),
    },
    {
      key: 'actions',
      header: isAr ? 'الإجراءات' : 'Actions',
      render: (item) => (
        <button
          onClick={() => setSelectedUser(item)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-xs font-semibold text-content-primary transition-colors"
          data-testid={`inspect-ledger-${item.user_id}`}
        >
          <BookOpen className="w-3.5 h-3.5 text-brand-gold" />
          <span>{isAr ? 'عرض السجل' : 'View Ledger'}</span>
        </button>
      ),
    },
  ];

  const renderAffiliateMobileCard = (item: AdminAffiliateItem) => {
    return (
      <div className="space-y-3" data-testid={`affiliate-card-${item.user_id}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="font-bold text-content-primary text-sm block truncate">
              {item.email}
            </span>
            <span className="font-mono text-xs text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded border border-brand-gold/20 inline-block mt-0.5">
              {item.referral_code}
            </span>
          </div>
          {item.pending_payout_count > 0 && (
            <span className="text-[11px] font-bold text-amber-500 shrink-0">
              {item.pending_payout_count} {isAr ? 'طلبات معلقة' : 'Pending'}
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-surface-elevated/60 border border-border-subtle text-xs">
          <div>
            <span className="text-[10px] text-content-muted block">{isAr ? 'المتاح' : 'Available'}</span>
            <span className="font-bold text-content-primary text-xs block mt-0.5">
              <MoneyText cents={item.available_cents} />
            </span>
          </div>
          <div>
            <span className="text-[10px] text-content-muted block">{isAr ? 'قيد الاستحقاق' : 'Pending'}</span>
            <span className="font-bold text-amber-400 text-xs block mt-0.5">
              <MoneyText cents={item.pending_cents} />
            </span>
          </div>
          <div>
            <span className="text-[10px] text-content-muted block">{isAr ? 'إجمالي الأرباح' : 'Lifetime'}</span>
            <span className="font-bold text-emerald-400 text-xs block mt-0.5">
              <MoneyText cents={item.lifetime_earned_cents} />
            </span>
          </div>
        </div>

        <div className="pt-1">
          <button
            onClick={() => setSelectedUser(item)}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-xs font-semibold text-content-primary transition-colors"
            data-testid={`inspect-ledger-${item.user_id}`}
          >
            <BookOpen className="w-3.5 h-3.5 text-brand-gold" />
            <span>{isAr ? 'عرض السجل المالي' : 'View Financial Ledger'}</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <AdminGuard requiredCapability={['manage_platform_settings', 'settle_affiliate_payout']}>
      <div className="space-y-6" data-testid="admin-affiliates-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-content-primary flex items-center gap-3">
              <Users className="w-7 h-7 text-brand-gold" />
              <span>{isAr ? 'دليل المسوقين وأرصدة الشركاء' : 'Affiliate Oversight & Balances'}</span>
            </h1>
            <p className="text-sm text-content-secondary mt-1">
              {isAr
                ? 'استعراض الأرصدة التراكمية وسجلات المعاملات المالية الموثقة دون إمكانية التعديل المباشر.'
                : 'Read-only financial balance projections and immutable ledger audit histories.'}
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isAr ? 'بحث بالبريد أو كود الإحالة...' : 'Search by email or code...'}
                className="w-64 ps-10 pe-4 py-2 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-content-primary focus:border-brand-gold focus:outline-hidden transition-colors"
              />
              <Search className="w-4 h-4 text-content-muted absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-brand-gold text-brand-navy font-bold text-xs hover:bg-brand-gold-light transition-colors"
            >
              {isAr ? 'بحث' : 'Search'}
            </button>
            {activeSearch && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setActiveSearch('');
                }}
                className="p-2 rounded-xl border border-border-subtle text-content-muted hover:text-content-primary"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>

        {/* Affiliates Table */}
        <DataTable
          columns={columns}
          data={affiliates}
          keyExtractor={(item) => item.user_id}
          isLoading={isLoading}
          currentPage={meta?.current_page}
          lastPage={meta?.last_page}
          onPageChange={(p) => setPage(p)}
          emptyMessage={isAr ? 'لم يتم العثور على مسوقين مطابقين للبحث.' : 'No affiliates found.'}
          mobileRenderer={renderAffiliateMobileCard}
        />

        {/* Immutable Ledger Drawer / Modal */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-end p-0">
            <div className="w-full max-w-2xl bg-surface-card h-full border-s border-border-subtle shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className="p-6 border-b border-border-subtle flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-content-primary">
                      {isAr ? 'سجل المعاملات الموثق' : 'Immutable Transaction Ledger'}
                    </span>
                    <span className="text-brand-gold text-xs font-mono font-bold">
                      #{selectedUser.user_id}
                    </span>
                  </div>
                  <p className="text-xs text-content-secondary mt-1">{selectedUser.email}</p>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 rounded-xl border border-border-subtle hover:bg-surface-elevated text-content-secondary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Ledger Summary Stats */}
              <div className="p-4 bg-surface-elevated/40 border-b border-border-subtle grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[11px] text-content-secondary block">
                    {isAr ? 'المتاح' : 'Available'}
                  </span>
                  <MoneyText cents={selectedUser.available_cents} className="text-sm" />
                </div>
                <div>
                  <span className="text-[11px] text-content-secondary block">
                    {isAr ? 'قيد الاستحقاق' : 'Pending'}
                  </span>
                  <MoneyText cents={selectedUser.pending_cents} className="text-sm text-amber-400" />
                </div>
                <div>
                  <span className="text-[11px] text-content-secondary block">
                    {isAr ? 'إجمالي الأرباح' : 'Lifetime'}
                  </span>
                  <MoneyText cents={selectedUser.lifetime_earned_cents} className="text-sm" />
                </div>
              </div>

              {/* Ledger Entries List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {isLedgerLoading ? (
                  <p className="text-center py-12 text-sm text-content-muted">
                    {isAr ? 'جارِ تحميل السجل...' : 'Loading ledger entries...'}
                  </p>
                ) : ledgerItems.length === 0 ? (
                  <p className="text-center py-12 text-sm text-content-muted">
                    {isAr ? 'لا توجد حركات مسجلة لهذا الحساب.' : 'No ledger entries for this account.'}
                  </p>
                ) : (
                  ledgerItems.map((entry) => {
                    const isCredit = entry.amount_cents > 0;
                    return (
                      <div
                        key={entry.id}
                        className="p-4 rounded-xl bg-surface-elevated border border-border-subtle flex items-start justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-content-primary">
                              {entry.entry_type}
                            </span>
                            <StatusBadge status={entry.status} />
                          </div>
                          <div className="text-xs text-content-secondary">
                            {entry.order_number && (
                              <span>{isAr ? `طلب: ${entry.order_number}` : `Order: ${entry.order_number}`} • </span>
                            )}
                            {entry.payout_number && (
                              <span>{isAr ? `سحب: ${entry.payout_number}` : `Payout: ${entry.payout_number}`} • </span>
                            )}
                            <span>{formatDate(entry.created_at, locale)}</span>
                          </div>
                        </div>

                        <div className="text-end">
                          <MoneyText cents={entry.amount_cents} showSign className="text-base" />
                          {entry.matures_at && (
                            <span className="text-[10px] text-content-muted block mt-0.5">
                              {isAr ? 'استحقاق: ' : 'Matures: '}
                              {formatDate(entry.matures_at, locale)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}
