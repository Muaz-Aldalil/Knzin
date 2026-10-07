'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { useAdminUsers, UserItem } from '@/hooks/admin/useAdminUsers';
import { useAdminSession } from '@/hooks/admin/useAdminSession';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { DataTable, Column } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { CapabilityManager } from '@/components/admin/CapabilityManager';
import { formatDate } from '@/lib/admin/format';
import { UserCheck, Search, Shield, X, ShieldAlert } from 'lucide-react';

export default function AdminUsersPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const { user: currentAdmin } = useAdminSession();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  const {
    users,
    meta,
    isLoading,
    grantCapability,
    revokeCapability,
    refetch,
  } = useAdminUsers(page, activeSearch);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setActiveSearch(searchTerm);
  };

  const columns: Column<UserItem>[] = [
    {
      key: 'id',
      header: isAr ? 'المعرف' : 'ID',
      render: (item) => <span className="font-mono text-xs font-bold text-content-primary">#{item.id}</span>,
    },
    {
      key: 'email',
      header: isAr ? 'البريد الإلكتروني' : 'User Email',
      render: (item) => (
        <div>
          <span className="font-bold text-content-primary block">{item.email}</span>
          <span className="font-mono text-xs text-brand-gold">{item.learner_code}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: isAr ? 'الحالة' : 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'capabilities',
      header: isAr ? 'الصلاحيات الإدارية' : 'Admin Capabilities',
      render: (item) => {
        const caps = item.capabilities || [];
        if (caps.length === 0) {
          return <span className="text-xs text-content-muted">{isAr ? 'مستخدم عادي (لا توجد)' : 'None (Regular User)'}</span>;
        }

        return (
          <div className="flex flex-wrap gap-1">
            {caps.map((c) => (
              <span
                key={c}
                className="px-2 py-0.5 rounded-md bg-brand-gold/10 text-brand-gold border border-brand-gold/20 text-[10px] font-mono"
              >
                {c}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'created_at',
      header: isAr ? 'تاريخ التسجيل' : 'Registered At',
      render: (item) => (
        <span className="text-xs text-content-secondary">{formatDate(item.created_at, locale)}</span>
      ),
    },
    {
      key: 'actions',
      header: isAr ? 'الإجراءات' : 'Actions',
      render: (item) => (
        <button
          onClick={() => setSelectedUser(item)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-xs font-bold text-content-primary transition-colors"
          data-testid={`manage-user-caps-${item.id}`}
        >
          <Shield className="w-3.5 h-3.5 text-brand-gold" />
          <span>{isAr ? 'إدارة الصلاحيات' : 'Manage Access'}</span>
        </button>
      ),
    },
  ];

  const renderUserMobileCard = (item: UserItem) => {
    const caps = item.capabilities || [];

    return (
      <div className="space-y-3" data-testid={`user-card-${item.id}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="font-bold text-content-primary text-sm block truncate">{item.email}</span>
            <span className="font-mono text-xs text-brand-gold">{item.learner_code}</span>
          </div>
          <StatusBadge status={item.status} />
        </div>

        <div className="p-2.5 rounded-xl bg-surface-elevated/60 border border-border-subtle text-xs space-y-1.5">
          <span className="text-[11px] text-content-muted block">{isAr ? 'الصلاحيات الإدارية:' : 'Capabilities:'}</span>
          {caps.length === 0 ? (
            <span className="text-xs text-content-muted">{isAr ? 'مستخدم عادي (لا توجد)' : 'None (Regular User)'}</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {caps.map((c: string) => (
                <span
                  key={c}
                  className="px-2 py-0.5 rounded-md bg-brand-gold/10 text-brand-gold border border-brand-gold/20 text-[10px] font-mono"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
          <span className="text-[10px] text-content-muted block pt-1 border-t border-border-subtle">
            {isAr ? 'تاريخ التسجيل: ' : 'Registered: '}{formatDate(item.created_at, locale)}
          </span>
        </div>

        <div className="pt-1">
          <button
            onClick={() => setSelectedUser(item)}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-xs font-bold text-content-primary transition-colors"
            data-testid={`manage-user-caps-${item.id}`}
          >
            <Shield className="w-3.5 h-3.5 text-brand-gold" />
            <span>{isAr ? 'إدارة الصلاحيات' : 'Manage Access'}</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <AdminGuard requiredCapability="manage_admin_capabilities">
      <div className="space-y-6" data-testid="admin-users-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-content-primary flex items-center gap-3">
              <UserCheck className="w-7 h-7 text-brand-gold" />
              <span>{isAr ? 'المستخدمون والصلاحيات الإدارية' : 'Users & Access Control'}</span>
            </h1>
            <p className="text-sm text-content-secondary mt-1">
              {isAr
                ? 'منح وسحب الصلاحيات الإدارية الست للمشرفين بصورة محكمة ومراقبة أمنياً.'
                : 'Grant and revoke specific administrative capabilities with strict anti-self-elevation invariants.'}
            </p>
          </div>

          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isAr ? 'بحث بالبريد أو المعرف...' : 'Search email or ID...'}
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

        {/* Users Table */}
        <DataTable
          columns={columns}
          data={users}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          currentPage={meta?.current_page}
          lastPage={meta?.last_page}
          onPageChange={(p) => setPage(p)}
          emptyMessage={isAr ? 'لم يتم العثور على مستخدمين.' : 'No users found.'}
          mobileRenderer={renderUserMobileCard}
        />

        {/* Capability Manager Dialog */}
        {selectedUser && (
          <CapabilityManager
            user={selectedUser}
            currentUserId={currentAdmin?.id}
            onGrant={async (cap, just) => {
              await grantCapability({ userId: selectedUser.id, capability: cap, justification: just });
              // update local selected user
              setSelectedUser((prev) =>
                prev ? { ...prev, capabilities: [...(prev.capabilities || []), cap as any] } : null
              );
            }}
            onRevoke={async (cap, reason) => {
              await revokeCapability({ userId: selectedUser.id, capability: cap, reason });
              setSelectedUser((prev) =>
                prev ? { ...prev, capabilities: (prev.capabilities || []).filter((c) => c !== cap) } : null
              );
            }}
            onClose={() => setSelectedUser(null)}
          />
        )}
      </div>
    </AdminGuard>
  );
}
