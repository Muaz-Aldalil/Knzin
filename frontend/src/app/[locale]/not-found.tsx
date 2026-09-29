import React from 'react';
import { Link } from '@/i18n/routing';
import { FileQuestion, Home, Compass } from 'lucide-react';

export default function LocalizedNotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-6">
      <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
        <FileQuestion className="w-10 h-10" />
      </div>

      <div className="space-y-2 max-w-md">
        <h1 className="text-2xl sm:text-3xl font-black text-content-primary">
          الصفحة غير موجودة (404)
        </h1>
        <p className="text-sm text-content-muted leading-relaxed">
          عذراً، المسار أو المحتوى المهني الذي تبحث عنه غير متاح أو تم تحديثه ضمن مسارات المنصة الجديدة.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-md transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>الرئيسية والدورات</span>
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-secondary border border-border-subtle hover:bg-surface-elevated text-content-primary text-sm font-bold transition-colors"
        >
          <Compass className="w-4 h-4" />
          <span>البحث الذكي</span>
        </Link>
      </div>
    </div>
  );
}
