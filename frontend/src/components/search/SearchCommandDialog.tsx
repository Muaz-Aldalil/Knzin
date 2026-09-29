'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  Search,
  X,
  Play,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Layers,
  Compass,
  AlertCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { SearchResult, SearchResponse, SortOption } from '@/lib/search/types';
import { formatTimestamp } from '@/lib/video';

const POPULAR_SUGGESTIONS = [
  { ar: 'علاج خدوش الصبغ بالنانو', en: 'Nano scratch removal' },
  { ar: 'تشخيص شورت الباور والـ VDD', en: 'Power IC short diagnosis' },
  { ar: 'فك وتركيب رقاقات BGA', en: 'BGA chip soldering & reballing' },
  { ar: 'إتقان فوتوشوب وإليستريتور', en: 'Photoshop & Illustrator mastery' },
  { ar: 'معالجة جلد السيارات الطبيعي', en: 'Natural leather restoration' },
];

interface SearchCommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchCommandDialog({ open, onOpenChange }: SearchCommandDialogProps) {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [filterKind, setFilterKind] = useState<'all' | 'video' | 'lesson'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SearchResponse | null>(null);

  // Focus input automatically when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setData(null);
      setError(null);
      setFilterKind('all');
    }
  }, [open]);

  // Debounced search effect
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: trimmed, sort: 'relevance' }),
        });

        if (!res.ok) {
          throw new Error('Search failed to fetch results');
        }

        const json: SearchResponse = await res.json();
        setData(json);
      } catch (err: any) {
        setError(isRtl ? 'حدث خطأ أثناء البحث، يرجى المحاولة ثانية' : 'Error retrieving search results');
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, isRtl]);

  const handleSelectSuggestion = (suggestedText: string) => {
    setQuery(suggestedText);
    inputRef.current?.focus();
  };

  const filteredResults = data?.results.filter((result) => {
    if (filterKind === 'all') return true;
    return result.kind === filterKind;
  }) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-3xl overflow-hidden bg-surface-primary border border-border-subtle shadow-2xl rounded-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>
            {isRtl ? 'البحث المهني الذكي في كَنزين' : 'KNZiN Vocational Smart Search'}
          </DialogTitle>
          <DialogDescription>
            {isRtl
              ? 'ابحث فوراً في جميع الدروس، اللحظات التدريبية، وأدوات العمل المهنية'
              : 'Search across all vocational lessons, moments, and practical tools'}
          </DialogDescription>
        </DialogHeader>

        {/* Top Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-border-subtle bg-surface-primary">
          <Search className="w-5 h-5 text-content-muted shrink-0 me-3 transition-colors" />

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isRtl
                ? 'ابحث في المهارات، الأدوات، أو اللحظات التطبيقية...'
                : 'Search skills, moments, tools (e.g. nano ceramic, BGA, figma)...'
            }
            className="flex-1 bg-transparent text-sm sm:text-base font-semibold text-content-primary placeholder:text-content-muted outline-none border-none ring-0 focus:ring-0"
          />

          <div className="flex items-center gap-2 shrink-0 ms-2">
            {isLoading && (
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            )}

            {query && !isLoading && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="p-1 rounded-md text-content-muted hover:text-content-primary hover:bg-surface-secondary transition-colors"
                title={isRtl ? 'مسح البحث' : 'Clear search'}
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-mono font-bold text-content-muted bg-surface-secondary border border-border-subtle rounded-md select-none">
              ESC
            </kbd>
          </div>
        </div>

        {/* Filter Pills when data exists */}
        {data && data.results.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 bg-surface-secondary/50 border-b border-border-subtle text-xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterKind('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  filterKind === 'all'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-content-muted hover:text-content-primary hover:bg-surface-secondary'
                }`}
              >
                {isRtl ? 'الكل' : 'All'} ({data.count})
              </button>

              <button
                type="button"
                onClick={() => setFilterKind('video')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  filterKind === 'video'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-content-muted hover:text-content-primary hover:bg-surface-secondary'
                }`}
              >
                <Play className="w-3 h-3 fill-current rtl:rotate-180" />
                <span>{isRtl ? 'لحظات فيديو' : 'Video Moments'}</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterKind('lesson')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  filterKind === 'lesson'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-content-muted hover:text-content-primary hover:bg-surface-secondary'
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>{isRtl ? 'دروس تطبيقية' : 'Lessons'}</span>
              </button>
            </div>

            <span className="text-[11px] text-content-muted hidden sm:inline">
              {isRtl ? `عبر ${data.courseCount} دورات تدريبية` : `Across ${data.courseCount} courses`}
            </span>
          </div>
        )}

        {/* Scrollable Modal Content Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-5 space-y-3">
          {/* Initial State: Suggestions & Shortcuts */}
          {!query.trim() && (
            <div className="space-y-5 py-2">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-content-muted">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <span>{isRtl ? 'مقترحات بحث شائعة في السوق العراقي:' : 'Popular vocational search queries:'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SUGGESTIONS.map((sug, i) => {
                    const text = isRtl ? sug.ar : sug.en;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectSuggestion(text)}
                        className="px-3 py-1.5 rounded-xl bg-surface-secondary hover:bg-primary-light hover:text-primary dark:hover:bg-primary/10 border border-border-subtle text-xs font-semibold text-content-secondary transition-all hover:scale-[1.02] active:scale-95 text-start"
                      >
                        {text}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-secondary/60 border border-border-subtle flex items-start gap-3">
                <Compass className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <div className="font-extrabold text-content-primary">
                    {isRtl ? 'بحث ذكي وفوري باللحظات التدريبية' : 'Instant In-Place Moments Search'}
                  </div>
                  <div className="text-content-muted leading-relaxed">
                    {isRtl
                      ? 'يمكنك البحث عن أي أداة عملية، عطل إلكتروني، أو تقنية مهنية. اضغط على أي نتيجة للانتقال فوراً إليها بدون مغادرة مسارك الحالي.'
                      : 'Search for any tool, component, or practical skill. Click any result to navigate directly without leaving your current workspace.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && !data && (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
              <div className="text-xs font-bold text-content-muted">
                {isRtl ? 'جارٍ تحليل واسترجاع اللحظات التدريبية المباشرة...' : 'Grounding practical vocational moments...'}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center space-y-2">
              <AlertCircle className="w-6 h-6 text-red-500 mx-auto" />
              <div className="text-xs font-bold text-red-600 dark:text-red-400">{error}</div>
            </div>
          )}

          {/* Empty Results State */}
          {!isLoading && data && filteredResults.length === 0 && (
            <div className="py-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-surface-secondary text-content-muted flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-bold text-content-primary">
                  {isRtl ? 'لم نعثر على نتائج مطابقة' : 'No matching results found'}
                </div>
                <div className="text-xs text-content-muted max-w-sm mx-auto">
                  {isRtl
                    ? `لم نجد نتائج لـ "${query}". جرّب استخدام كلمات مرادفة أو تصفح الدورات العامة.`
                    : `No results for "${query}". Try different terms or browse full courses.`}
                </div>
              </div>
            </div>
          )}

          {/* Results List: 100% Fully Clickable Cards */}
          {filteredResults.map((result, idx) => {
            const isVideo = result.kind === 'video';
            const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

            return (
              <Link
                key={idx}
                href={result.href}
                onClick={() => onOpenChange(false)}
                className="group block p-4 sm:p-4.5 rounded-xl bg-surface-secondary/50 hover:bg-surface-elevated border border-border-subtle hover:border-primary/50 transition-all duration-150 cursor-pointer shadow-xs hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  {/* Left Content */}
                  <div className="space-y-2 flex-1">
                    {/* Tags row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {isVideo ? (
                        <Badge variant="video" size="sm">
                          <Play className="w-2.5 h-2.5 fill-current rtl:rotate-180" />
                          <span>{isRtl ? 'فيديو تدريبي' : 'Video Moment'}</span>
                        </Badge>
                      ) : (
                        <Badge variant="lesson" size="sm">
                          <FileText className="w-2.5 h-2.5" />
                          <span>{isRtl ? 'درس تطبيقي' : 'Lesson'}</span>
                        </Badge>
                      )}

                      <span className="text-xs font-bold text-primary">
                        {result.courseTitle}
                      </span>

                      <span className="text-xs text-content-muted">•</span>

                      <span className="text-xs text-content-muted font-medium">
                        {result.label}
                      </span>

                      {isVideo && result.momentLabel && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/15 text-accent text-[11px] font-bold">
                          <Clock className="w-3 h-3 text-accent" />
                          <span>{result.momentLabel}</span>
                        </span>
                      )}
                    </div>

                    {/* Lesson Title */}
                    <h3 className="text-sm sm:text-base font-extrabold text-content-primary group-hover:text-primary transition-colors">
                      {result.lessonTitle}
                    </h3>

                    {/* Excerpt / Reason */}
                    <p className="text-xs text-content-secondary leading-relaxed line-clamp-2">
                      {result.reason}
                    </p>

                    {/* Key points indicator */}
                    {result.keyPoints && result.keyPoints.length > 0 && (
                      <div className="flex items-center gap-2 text-[11px] text-content-muted">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span className="truncate">{result.keyPoints[0]}</span>
                      </div>
                    )}
                  </div>

                  {/* Right Action Button Visual (Whole Card is Clickable, Button reinforces affordance) */}
                  <div className="shrink-0 self-start sm:self-center pt-1 sm:pt-0">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary/10 group-hover:bg-primary group-hover:text-white text-primary text-xs font-black transition-all shadow-xs group-hover:shadow-md">
                      {isVideo ? (
                        <>
                          <Play className="w-3 h-3 fill-current rtl:rotate-180" />
                          <span>{isRtl ? 'مشاهدة الآن' : 'Watch Now'}</span>
                        </>
                      ) : (
                        <>
                          <Layers className="w-3 h-3" />
                          <span>{isRtl ? 'فتح الدرس' : 'Open Lesson'}</span>
                        </>
                      )}
                      <ArrowIcon className="w-3 h-3 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2.5 bg-surface-secondary border-t border-border-subtle flex items-center justify-between text-[11px] text-content-muted">
          <span>
            {isRtl ? 'استخدم الأسهم أو الفأرة للاختيار' : 'Use arrow keys or mouse to navigate'}
          </span>
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-surface-primary border border-border-subtle font-mono text-[10px]">↵</kbd> {isRtl ? 'للانتقال' : 'to select'}
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-surface-primary border border-border-subtle font-mono text-[10px]">esc</kbd> {isRtl ? 'للإغلاق' : 'to close'}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
