'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import {
  FileText,
  Lightbulb,
  CheckCircle2,
  Download,
  FolderArchive,
  Save,
  PenLine,
  ExternalLink,
  Sparkles,
  Info
} from 'lucide-react';
import { LessonResource } from '@/lib/course-content';

interface LessonTabsProps {
  summary: string;
  keyPoints: string[];
  proTip: {
    title: string;
    content: string;
  };
  resources: LessonResource[];
  courseSlug: string;
  partNumber: number;
}

export function LessonTabs({
  summary,
  keyPoints,
  proTip,
  resources,
  courseSlug,
  partNumber,
}: LessonTabsProps) {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const [activeTab, setActiveTab] = useState<'content' | 'resources' | 'notes'>('content');
  const [userNote, setUserNote] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Local storage for learner's private notes
  const storageKey = `knzin_note_${courseSlug}_part_${partNumber}`;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) setUserNote(saved);
    }
  }, [storageKey]);

  const handleSaveNote = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, userNote);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`py-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'content'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{locale === 'ar' ? 'محتوى الدرس' : 'Lesson Content'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('resources')}
          className={`py-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'resources'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FolderArchive className="w-4 h-4" />
          <span>{locale === 'ar' ? 'الملفات والمخططات' : 'Resources'}</span>
          {resources.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {resources.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notes')}
          className={`py-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'notes'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <PenLine className="w-4 h-4" />
          <span>{locale === 'ar' ? 'ملاحظاتي' : 'My Notes'}</span>
        </button>
      </div>

      {/* Tab 1: Content */}
      {activeTab === 'content' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Overview text */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-secondary dark:text-white">
              {locale === 'ar' ? 'نظرة عامة على الجزء' : 'Part Overview'}
            </h3>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {summary}
            </p>
          </div>

          {/* In this lesson you will learn */}
          <div className="space-y-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <h4 className="text-sm font-black text-secondary dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>{locale === 'ar' ? 'في هذا الدرس ستتعلم وتتقن:' : 'In this lesson you will master:'}</span>
            </h4>

            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {keyPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-normal">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Vocational Pro Tip in Knzin Accent Gold */}
          <div className="p-5 sm:p-6 rounded-2xl bg-accent/10 border-2 border-accent/40 shadow-sm space-y-2 relative overflow-hidden">
            <div className="flex items-center gap-2 text-amber-800 dark:text-accent font-black text-sm">
              <Lightbulb className="w-5 h-5 text-accent fill-accent/20" />
              <span>{proTip.title}</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              {proTip.content}
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Resources */}
      {activeTab === 'resources' && (
        <div className="space-y-4 animate-fadeIn">
          <h3 className="text-base font-bold text-secondary dark:text-white">
            {locale === 'ar' ? 'المخططات والكتيبات المرفقة' : 'Downloadable Resources'}
          </h3>

          {resources.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 text-sm">
              {locale === 'ar' ? 'لا توجد ملفات مرفقة لهذا الجزء.' : 'No downloadable resources for this part.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {resources.map((res) => (
                <div
                  key={res.id}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 hover:border-primary/40 transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-light dark:bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                        {locale === 'ar' ? res.title_ar : res.title_en}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {res.size} • {res.type.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <a
                    href={res.url}
                    download
                    className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white text-slate-600 dark:text-slate-300 transition-colors shrink-0"
                    title={locale === 'ar' ? 'تحميل الملف' : 'Download file'}
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Notes */}
      {activeTab === 'notes' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-secondary dark:text-white">
              {locale === 'ar' ? 'ملاحظاتي التدريبية الخاصة' : 'My Personal Training Notes'}
            </h3>
            {isSaved && (
              <span className="text-xs font-bold text-success flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{locale === 'ar' ? 'تم الحفظ' : 'Saved'}</span>
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500">
            {locale === 'ar'
              ? 'دون ملاحظاتك وأرقام القياسات أثناء متابعة الفيديو، تُحفظ تلقائياً على متصفحك.'
              : 'Write your notes and measurements while watching the video. Saved locally in your browser.'}
          </p>

          <textarea
            value={userNote}
            onChange={(e) => setUserNote(e.target.value)}
            rows={6}
            placeholder={
              locale === 'ar'
                ? 'اكتب ملاحظاتك المهنية هنا (مثل: درجة حرارة الهوت إير المناسبة، رقم البولش، إلخ)...'
                : 'Write your professional notes here...'
            }
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed resize-y"
          />

          <button
            type="button"
            onClick={handleSaveNote}
            className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary-surface text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{locale === 'ar' ? 'حفظ الملاحظات' : 'Save Notes'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
