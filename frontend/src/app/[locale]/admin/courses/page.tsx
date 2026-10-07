'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useAdminCourses } from '@/hooks/admin/useAdminCourses';
import { AdminCourse } from '@/types/admin';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { DataTable, Column } from '@/components/admin/DataTable';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useAdminFeedback } from '@/components/admin/AdminFeedbackContext';
import {
  BookOpen,
  Plus,
  Edit3,
  Search,
  Layers,
  CheckCircle,
  PauseCircle,
  Trash2,
  Ticket,
  DollarSign,
  PlayCircle,
  ExternalLink,
} from 'lucide-react';

export default function AdminCoursesPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const { showError } = useAdminFeedback();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const [courseToDelete, setCourseToDelete] = useState<AdminCourse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { courses, pagination, kpis, isLoading, refetch } = useAdminCourses(
    search,
    statusFilter === 'all' ? undefined : statusFilter === 'active',
    page
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/admin/courses/${courseToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      if (!res.ok) {
        throw new Error('Failed to delete/archive course');
      }
      setCourseToDelete(null);
      refetch();
    } catch (err) {
      console.error(err);
      showError(isAr ? 'حدث خطأ أثناء أرشفة أو حذف الدورة.' : 'An error occurred while deleting/archiving course.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (courseId: string) => {
    try {
      const res = await fetch(`/api/v1/admin/courses/${courseId}/toggle-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      if (!res.ok) {
        throw new Error('Failed to toggle course status');
      }
      refetch();
    } catch (err) {
      console.error(err);
      showError(isAr ? 'فشل تغيير حالة الدورة.' : 'Failed to toggle course status.');
    }
  };

  const columns: Column<AdminCourse>[] = [
    {
      key: 'title',
      header: isAr ? 'الدورة التدريبية' : 'Course',
      className: 'min-w-[220px] max-w-[340px]',
      render: (item) => (
        <div className="space-y-1.5 py-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/${locale}/admin/courses/${item.id}`}
              className="font-bold text-content-primary hover:text-brand-gold text-sm transition-colors leading-snug line-clamp-2"
            >
              {isAr ? item.title_ar : item.title_en}
            </Link>
            <Link
              href={`/${locale}/courses/${item.slug}`}
              target="_blank"
              className="p-1 rounded-md text-content-muted hover:text-brand-gold hover:bg-surface-elevated transition-colors shrink-0"
              title={isAr ? 'عرض في الموقع العام' : 'View in public catalog'}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-content-muted flex-wrap">
            <span className="font-mono text-[11px] bg-surface-elevated px-2 py-0.5 rounded-md border border-border-subtle inline-block max-w-[220px] truncate">
              {item.slug}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'pricing',
      header: isAr ? 'السعر والتذاكر' : 'Pricing & Tickets',
      className: 'min-w-[170px] whitespace-nowrap',
      render: (item) => (
        <div className="flex flex-col gap-1.5 whitespace-nowrap py-0.5">
          {/* Price row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-extrabold font-mono"
              dir="ltr"
            >
              <DollarSign className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>{(item.bundle_price_cents / 100).toFixed(2)}</span>
            </span>
            {item.display_price_label && (
              <span className="text-[11px] font-medium text-content-muted whitespace-nowrap" dir={isAr ? 'rtl' : 'ltr'}>
                <bdi>({item.display_price_label})</bdi>
              </span>
            )}
          </div>
          {/* Tickets pill */}
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-semibold w-fit whitespace-nowrap">
            <Ticket className="w-3 h-3 shrink-0" />
            <span>
              {item.bundle_promotional_tickets} {isAr ? 'تذكرة سحب' : 'Tickets'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'parts',
      header: isAr ? 'الأجزاء والدروس' : 'Parts & Lessons',
      className: 'min-w-[140px] whitespace-nowrap',
      render: (item) => {
        const count = item.parts_count ?? item.parts?.length ?? 0;
        const freeCount = item.parts?.filter((p) => p.is_free).length ?? 0;
        return (
          <div className="flex flex-col gap-1.5 whitespace-nowrap py-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-content-primary">
              <Layers className="w-3.5 h-3.5 text-brand-gold shrink-0" />
              <span>
                {count} {isAr ? 'أجزاء تدريبية' : 'Parts'}
              </span>
            </div>
            {freeCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
                <PlayCircle className="w-3 h-3 shrink-0" />
                <span>
                  {freeCount} {isAr ? 'معاينة مجانية' : 'Free Preview'}
                </span>
              </span>
            ) : (
              <span className="text-[10px] text-content-muted font-medium">
                {isAr ? 'مدفوع بالكامل' : 'All Paid'}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: isAr ? 'الحالة' : 'Status',
      className: 'min-w-[125px] whitespace-nowrap',
      render: (item) => (
        <button
          onClick={() => handleToggleStatus(item.id)}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap w-fit cursor-pointer active:scale-95 ${
            item.is_active
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 shadow-2xs'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 shadow-2xs'
          }`}
          title={isAr ? 'انقر لتغيير الحالة' : 'Click to toggle status'}
        >
          {item.is_active ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{isAr ? 'نشط ومتاح' : 'Active'}</span>
            </>
          ) : (
            <>
              <PauseCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{isAr ? 'متوقف مؤقتاً' : 'Paused'}</span>
            </>
          )}
        </button>
      ),
    },
    {
      key: 'actions',
      header: isAr ? 'الإجراءات' : 'Actions',
      className: 'min-w-[145px] whitespace-nowrap text-end',
      render: (item) => (
        <div className="flex items-center gap-2 whitespace-nowrap justify-end">
          <Link
            href={`/${locale}/admin/courses/${item.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-xs font-bold text-content-primary hover:text-brand-gold transition-colors shadow-2xs"
            data-testid={`manage-course-${item.id}`}
          >
            <Edit3 className="w-3.5 h-3.5 text-brand-gold shrink-0" />
            <span>{isAr ? 'إدارة المنهاج' : 'Manage'}</span>
          </Link>
          <button
            onClick={() => setCourseToDelete(item)}
            className="p-1.5 rounded-xl bg-surface-elevated hover:bg-rose-500/10 border border-border-subtle text-content-muted hover:text-rose-400 transition-colors cursor-pointer shadow-2xs"
            title={isAr ? 'أرشفة / حذف الدورة' : 'Archive / Delete Course'}
            aria-label={isAr ? 'أرشفة / حذف الدورة' : 'Archive / Delete Course'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const renderCourseMobileCard = (item: AdminCourse) => {
    const partsCount = item.parts_count ?? item.parts?.length ?? 0;
    const freeCount = item.parts?.filter((p) => p.is_free).length ?? 0;

    return (
      <div className="space-y-3.5" data-testid={`course-card-${item.id}`}>
        {/* Top Header: Title, External Link, and Status Toggle */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-content-primary text-base leading-snug">
                {isAr ? item.title_ar : item.title_en}
              </h3>
              <Link
                href={`/${locale}/courses/${item.slug}`}
                target="_blank"
                className="text-content-muted hover:text-brand-gold transition-colors inline-flex shrink-0 p-1"
                title={isAr ? 'عرض في الموقع العام' : 'View in public catalog'}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="mt-1">
              <span className="font-mono text-xs text-content-muted bg-surface-elevated px-2 py-0.5 rounded border border-border-subtle inline-block">
                {item.slug}
              </span>
            </div>
          </div>

          {/* Status Toggle Button */}
          <button
            onClick={() => handleToggleStatus(item.id)}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              item.is_active
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 active:scale-95'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 active:scale-95'
            }`}
            title={isAr ? 'انقر لتغيير الحالة' : 'Click to toggle status'}
          >
            {item.is_active ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAr ? 'نشط' : 'Active'}</span>
              </>
            ) : (
              <>
                <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>{isAr ? 'متوقف' : 'Paused'}</span>
              </>
            )}
          </button>
        </div>

        {/* Course Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-surface-elevated/60 border border-border-subtle text-xs">
          {/* Pricing */}
          <div className="space-y-1">
            <span className="text-[11px] text-content-muted block">
              {isAr ? 'السعر' : 'Price'}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-extrabold font-mono"
                dir="ltr"
              >
                <DollarSign className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>{(item.bundle_price_cents / 100).toFixed(2)}</span>
              </span>
              {item.display_price_label && (
                <span className="text-[10px] font-medium text-content-muted whitespace-nowrap" dir={isAr ? 'rtl' : 'ltr'}>
                  <bdi>({item.display_price_label})</bdi>
                </span>
              )}
            </div>
          </div>

          {/* Tickets */}
          <div className="space-y-1">
            <span className="text-[11px] text-content-muted block">
              {isAr ? 'تذاكر السحب' : 'Raffle Tickets'}
            </span>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-semibold whitespace-nowrap">
              <Ticket className="w-3.5 h-3.5 shrink-0" />
              <span>
                {item.bundle_promotional_tickets} {isAr ? 'تذكرة' : 'Tickets'}
              </span>
            </div>
          </div>

          {/* Modular Parts */}
          <div className="col-span-2 flex items-center justify-between pt-2 border-t border-border-subtle">
            <div className="flex items-center gap-1.5 text-content-secondary font-medium">
              <Layers className="w-3.5 h-3.5 text-brand-gold shrink-0" />
              <span>
                {partsCount} {isAr ? 'أجزاء تدريبية' : 'Training Parts'}
              </span>
            </div>
            {freeCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <PlayCircle className="w-3 h-3" />
                <span>{isAr ? `${freeCount} معاينة مجانية` : `${freeCount} Free`}</span>
              </span>
            ) : (
              <span className="text-[10px] text-content-muted font-medium">
                {isAr ? 'مدفوع بالكامل' : 'All Paid'}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2 pt-1">
          <Link
            href={`/${locale}/admin/courses/${item.id}`}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-xs font-bold text-content-primary hover:text-brand-gold transition-colors"
            data-testid={`manage-course-${item.id}`}
          >
            <Edit3 className="w-3.5 h-3.5 text-brand-gold" />
            <span>{isAr ? 'إدارة المنهاج والمحتوى' : 'Manage Curriculum'}</span>
          </Link>
          <button
            onClick={() => setCourseToDelete(item)}
            className="p-2 rounded-xl bg-surface-elevated hover:bg-rose-500/10 border border-border-subtle text-content-muted hover:text-rose-400 transition-colors shrink-0 cursor-pointer"
            title={isAr ? 'أرشفة / حذف الدورة' : 'Archive / Delete Course'}
            aria-label={isAr ? 'أرشفة / حذف الدورة' : 'Archive / Delete Course'}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <AdminGuard requiredCapability="manage_platform_settings">
      <div className="space-y-6" data-testid="admin-courses-page">
        {/* Page Title & Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-content-primary flex items-center gap-3">
              <BookOpen className="w-7 h-7 text-brand-gold" />
              <span>{isAr ? 'إدارة الدورات والمناهج التدريبية' : 'Courses & Vocational Curricula'}</span>
            </h1>
            <p className="text-sm text-content-secondary mt-1">
              {isAr
                ? 'إدارة محتوى الدورات، مخرجات التدريب، الدروس والأجزاء، أسعار الاشتراكات والوسائط التعليمية (فيديو و PDF).'
                : 'Manage course catalogs, learning outcomes, modular parts, subscription pricing, and media resources (Video & PDF).'}
            </p>
          </div>

          <Link
            href={`/${locale}/admin/courses/new`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-gold text-brand-navy font-bold text-sm hover:bg-brand-gold-light transition-colors shadow-xs"
            data-testid="create-course-button"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إضافة دورة تدريبية جديدة' : 'Add New Course'}</span>
          </Link>
        </div>

        {/* KPI Cards */}
        {kpis && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface-card border border-border-subtle rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-content-muted">
                  {isAr ? 'إجمالي الدورات' : 'Total Courses'}
                </span>
                <BookOpen className="w-4 h-4 text-brand-gold" />
              </div>
              <p className="text-2xl font-bold text-content-primary mt-2">{kpis.total_courses}</p>
            </div>

            <div className="bg-surface-card border border-border-subtle rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-content-muted">
                  {isAr ? 'الدورات النشطة' : 'Active Courses'}
                </span>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-content-primary mt-2">{kpis.active_courses}</p>
            </div>

            <div className="bg-surface-card border border-border-subtle rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-content-muted">
                  {isAr ? 'إجمالي الأجزاء والدروس' : 'Total Training Parts'}
                </span>
                <Layers className="w-4 h-4 text-brand-gold" />
              </div>
              <p className="text-2xl font-bold text-content-primary mt-2">{kpis.total_parts}</p>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative max-w-sm w-full">
            <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-content-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isAr ? 'ابحث عن دورة أو مسار...' : 'Search courses or slug...'}
              className="w-full ps-9 pe-4 py-2 bg-surface-elevated border border-border-subtle rounded-xl text-sm text-content-primary placeholder:text-content-muted focus:outline-hidden focus:border-brand-gold transition-colors"
            />
          </form>

          <div className="flex items-center gap-1 bg-surface-elevated p-1 rounded-xl border border-border-subtle text-xs w-fit">
            {[
              { id: 'all', labelAr: 'الكل', labelEn: 'All' },
              { id: 'active', labelAr: 'نشط', labelEn: 'Active' },
              { id: 'paused', labelAr: 'متوقف', labelEn: 'Paused' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setStatusFilter(f.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  statusFilter === f.id
                    ? 'bg-brand-gold text-brand-navy shadow-xs'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                {isAr ? f.labelAr : f.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Courses Table */}
        <DataTable
          columns={columns}
          data={courses}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyMessage={isAr ? 'لا توجد دورات تدريبية مطابقة.' : 'No courses found.'}
          mobileRenderer={renderCourseMobileCard}
          breakpoint="lg"
          minWidth="min-w-[840px]"
        />

        {/* Pagination if applicable */}
        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-content-muted">
              {isAr
                ? `عرض صفحة ${pagination.current_page} من ${pagination.last_page}`
                : `Page ${pagination.current_page} of ${pagination.last_page}`}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.current_page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-elevated border border-border-subtle disabled:opacity-50"
              >
                {isAr ? 'السابق' : 'Previous'}
              </button>
              <button
                disabled={pagination.current_page >= pagination.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-elevated border border-border-subtle disabled:opacity-50"
              >
                {isAr ? 'التالي' : 'Next'}
              </button>
            </div>
          </div>
        )}

        {/* Archive/Delete Confirm Dialog */}
        <ConfirmDialog
          isOpen={!!courseToDelete}
          title={isAr ? 'أرشفة أو حذف الدورة' : 'Archive or Delete Course'}
          description={
            isAr
              ? `هل أنت متأكد من رغبتك في حذف أو أرشفة الدورة "${courseToDelete?.title_ar}"؟ إذا كان هناك طلاب مشتركون أو طلبات سابقة، فسيتم إيقاف الدورة وأرشفتها بأمان لحماية سجلات الطلاب وتجنب فقدان البيانات.`
              : `Are you sure you want to delete or archive "${courseToDelete?.title_en}"? If active student enrollments or purchase records exist, it will be safely deactivated and archived to protect student progress.`
          }
          confirmText={isAr ? 'تأكيد الحذف / الأرشفة' : 'Confirm Archive / Delete'}
          cancelText={isAr ? 'إلغاء' : 'Cancel'}
          isDestructive={true}
          isLoading={isDeleting}
          onConfirm={handleDeleteCourse}
          onClose={() => setCourseToDelete(null)}
        />
      </div>
    </AdminGuard>
  );
}
