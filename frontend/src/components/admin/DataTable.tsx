'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  isLoading?: boolean;
  emptyMessage?: string;
  currentPage?: number;
  lastPage?: number;
  onPageChange?: (page: number) => void;
  mobileRenderer?: (item: T) => React.ReactNode;
  breakpoint?: 'sm' | 'md' | 'lg' | 'xl';
  minWidth?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage,
  currentPage,
  lastPage,
  onPageChange,
  mobileRenderer,
  breakpoint = 'lg',
  minWidth = 'min-w-[780px]',
}: DataTableProps<T>) {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const mobileHiddenClass =
    breakpoint === 'lg'
      ? 'lg:hidden'
      : breakpoint === 'sm'
      ? 'sm:hidden'
      : breakpoint === 'xl'
      ? 'xl:hidden'
      : 'md:hidden';

  const desktopBlockClass =
    breakpoint === 'lg'
      ? 'hidden lg:block'
      : breakpoint === 'sm'
      ? 'hidden sm:block'
      : breakpoint === 'xl'
      ? 'hidden xl:block'
      : 'hidden md:block';

  return (
    <div className="bg-surface-card border border-border-subtle rounded-2xl overflow-hidden shadow-xs">
      {/* Mobile Responsive Cards View when mobileRenderer is supplied */}
      {mobileRenderer && (
        <div className={mobileHiddenClass}>
          {isLoading ? (
            <div className="px-6 py-12 text-center text-content-secondary">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span>{isAr ? 'جارِ تحميل البيانات...' : 'Loading data...'}</span>
              </div>
            </div>
          ) : data.length === 0 ? (
            <div className="px-6 py-12 text-center text-content-muted">
              {emptyMessage || (isAr ? 'لا توجد بيانات متاحة حالياً.' : 'No records found.')}
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {data.map((item) => (
                <div key={keyExtractor(item)} className="p-4 hover:bg-surface-elevated/30 transition-colors">
                  {mobileRenderer(item)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Desktop / Tablet Table View */}
      <div className={`overflow-x-auto ${mobileRenderer ? desktopBlockClass : ''}`}>
        <table className={`w-full text-start text-sm ${minWidth} border-collapse`}>
          <thead className="bg-surface-elevated/60 border-b border-border-subtle text-content-secondary font-semibold">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={`px-4 py-3.5 text-start font-medium text-xs ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-content-secondary">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span>{isAr ? 'جارِ تحميل البيانات...' : 'Loading data...'}</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-content-muted">
                  {emptyMessage || (isAr ? 'لا توجد بيانات متاحة حالياً.' : 'No records found.')}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  className="hover:bg-surface-elevated/40 transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3.5 align-middle ${col.className || ''}`}>
                      {col.render ? col.render(item) : (item as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {currentPage !== undefined && lastPage !== undefined && lastPage > 1 && (
        <div className="px-4 py-3 border-t border-border-subtle bg-surface-elevated/20 flex items-center justify-between text-xs text-content-secondary">
          <span>
            {isAr
              ? `صفحة ${currentPage} من ${lastPage}`
              : `Page ${currentPage} of ${lastPage}`}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-border-subtle disabled:opacity-30 disabled:pointer-events-none hover:bg-surface-elevated"
            >
              {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage >= lastPage}
              className="p-1.5 rounded-lg border border-border-subtle disabled:opacity-30 disabled:pointer-events-none hover:bg-surface-elevated"
            >
              {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
