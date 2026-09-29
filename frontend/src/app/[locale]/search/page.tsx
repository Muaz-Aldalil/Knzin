'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import {
  Search,
  SlidersHorizontal,
  Play,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  Check
} from 'lucide-react';
import { SearchResponse, SearchResult, SortOption } from '@/lib/search/types';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/ui/search-input';
import { formatTimestamp } from '@/lib/video';

const SUGGESTED_QUERIES_AR = [
  'علاج خدوش الصبغ بالنانو',
  'حساب أحمال الطاقة الشمسية والإنفرتر',
  'تشخيص شورت الباور والـ VDD',
  'شحن غاز التبريد R410A بالميزان',
  'برمجة كاميرات المراقبة IP عن بعد',
  'تدريج السكين فيد ونحت اللحية',
  'معايرة طاحونة الإسبريسو واللاتيه آرت',
  'تسعير مشاريع الفريلانس بالعراق',
];

const SUGGESTED_QUERIES_EN = [
  'Nano ceramic paint correction',
  'Solar PV inverter sizing & battery bank',
  'Phone board short & VDD power rail',
  'Inverter AC R410A refrigerant charge',
  'IP CCTV PoE camera remote viewing',
  'Skin fade haircut & beard sculpting',
  'Espresso grinder dialing & latte art',
  'Freelance project pricing & contracts',
];

function SearchResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const initialQuery = searchParams.get('q') || '';
  const initialSort = (searchParams.get('sort') as SortOption) || 'relevance';

  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<SortOption>(initialSort);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch search results on query or sort change
  useEffect(() => {
    if (!query.trim()) {
      setData(null);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, sort }),
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error('فشل تحميل نتائج البحث');
        return res.json();
      })
      .then((json: SearchResponse) => {
        setData(json);
        setIsLoading(false);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(err.message || 'حدث خطأ أثناء البحث');
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [query, sort]);

  const handleSearchSubmit = (newQuery: string) => {
    setQuery(newQuery);
    const params = new URLSearchParams(searchParams.toString());
    params.set('q', newQuery);
    params.set('sort', sort);
    router.replace(`/search?${params.toString()}`);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSort(newSort);
    const params = new URLSearchParams(searchParams.toString());
    if (query) params.set('q', query);
    params.set('sort', newSort);
    router.replace(`/search?${params.toString()}`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Top Header & Search Bar */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-secondary dark:text-white">
            {locale === 'ar' ? 'البحث المهني الذكي' : 'Intelligent Vocational Search'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {locale === 'ar'
              ? 'ابحث باللغة الطبيعية عن مهارة، تقنية، أو أداة للوصول مباشرة إلى الدقيقة المحددة في الفيديو.'
              : 'Search in natural language to deep-link directly to precise video timestamps.'}
          </p>
        </div>

        {/* Search Input Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <SearchInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchSubmit(query);
                }
              }}
              placeholder={
                locale === 'ar'
                  ? 'ابحث مثلاً: علاج خدوش الصبغ، شورت الباور، نظام التصميم في فيجما...'
                  : 'Search skills, tools, e.g. nano ceramic, power IC short, figma design...'
              }
              size="lg"
            />
          </div>

          <button
            type="button"
            onClick={() => handleSearchSubmit(query)}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-black transition-all shadow-md shadow-primary/20 shrink-0"
          >
            {locale === 'ar' ? 'بحث' : 'Search'}
          </button>
        </div>

        {/* Suggested Queries Chips */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 font-medium">
            {locale === 'ar' ? 'مقترحات شائعة:' : 'Suggestions:'}
          </span>
          {(locale === 'ar' ? SUGGESTED_QUERIES_AR : SUGGESTED_QUERIES_EN).map((sq, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSearchSubmit(sq)}
              className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-primary-light hover:text-primary dark:hover:bg-primary/10 text-slate-600 dark:text-slate-300 font-medium transition-colors border border-slate-200/60 dark:border-slate-700/60"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header: Count & Sort */}
      {data && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-secondary dark:text-white">
              {locale === 'ar' ? `النتائج (${data.count})` : `Results (${data.count})`}
            </span>
            <span className="text-xs text-slate-400">
              {locale === 'ar'
                ? `عبر ${data.courseCount} دورات تدريبية`
                : `across ${data.courseCount} courses`}
            </span>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">
              {locale === 'ar' ? 'الترتيب حسب:' : 'Sort by:'}
            </span>
            <select
              value={sort}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="relevance">{locale === 'ar' ? 'الأكثر صلة' : 'Most Relevant'}</option>
              <option value="newest">{locale === 'ar' ? 'الأحدث' : 'Newest'}</option>
              <option value="duration">{locale === 'ar' ? 'المدة الزمنية' : 'Duration'}</option>
            </select>
          </div>
        </div>
      )}

      {/* State 1: Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4 py-8">
          <div className="flex items-center justify-center gap-2 text-primary font-bold text-sm">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{locale === 'ar' ? 'جارٍ تحليل واسترجاع اللحظات التدريبية...' : 'Grounding vocational moments...'}</span>
          </div>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse space-y-3"
            >
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* State 2: Error */}
      {error && (
        <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-500/30 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
          <h3 className="text-sm font-bold text-red-900 dark:text-red-200">{error}</h3>
          <button
            type="button"
            onClick={() => handleSearchSubmit(query)}
            className="text-xs text-primary font-bold hover:underline"
          >
            {locale === 'ar' ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      )}

      {/* State 3: Empty State */}
      {!isLoading && data && data.results.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-secondary dark:text-white">
              {locale === 'ar' ? 'لم يتم العثور على نتائج مباشرة' : 'No direct matches found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {locale === 'ar'
                ? 'جرّب البحث بكلمات أخرى أو تصفح الدورات المهنية الشاملة المتاحة في الدليل.'
                : 'Try different keywords or explore our complete vocational courses.'}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors"
            >
              {locale === 'ar' ? 'تصفح جميع الدورات' : 'Explore All Courses'}
            </Link>
          </div>
        </div>
      )}

      {/* State 4: Results List */}
      {!isLoading && data && data.results.length > 0 && (
        <div className="space-y-4">
          {data.results.map((result, idx) => {
            if (result.kind === 'video') {
              return (
                <Link
                  key={idx}
                  href={result.href}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-primary/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 group cursor-pointer block"
                >
                  <div className="space-y-2.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="video">
                        <Play className="w-3 h-3 fill-current rtl:rotate-180" />
                        <span>فيديو تدريبي</span>
                      </Badge>

                      <span className="text-xs font-bold text-primary">
                        {result.courseTitle}
                      </span>

                      <span className="text-xs text-slate-400">•</span>

                      <span className="text-xs text-slate-500 font-semibold">
                        {result.label}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-secondary dark:text-white group-hover:text-primary transition-colors">
                      {result.lessonTitle}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                      {result.reason}
                    </p>

                    {/* Timestamp Deep-link Tag */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-accent/15 border border-accent/30 text-secondary dark:text-accent text-xs font-bold">
                      <Clock className="w-3.5 h-3.5 text-accent" />
                      <span>{result.momentLabel}</span>
                    </div>
                  </div>

                  <div className="shrink-0 self-start md:self-center">
                    <span
                      className="px-5 py-2.5 rounded-xl bg-primary group-hover:bg-primary-hover text-white text-xs font-black shadow-md shadow-primary/20 transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                      <Play className="w-3.5 h-3.5 fill-white rtl:rotate-180" />
                      <span>{locale === 'ar' ? 'مشاهدة اللحظة' : 'Watch Moment'}</span>
                    </span>
                  </div>
                </Link>
              );
            }

            // Lesson Result Card
            return (
              <Link
                key={idx}
                href={result.href}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-primary/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 group cursor-pointer block"
              >
                <div className="space-y-2.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="lesson">
                      <FileText className="w-3 h-3" />
                      <span>درس مهني</span>
                    </Badge>

                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {result.courseTitle}
                    </span>

                    <span className="text-xs text-slate-400">•</span>

                    <span className="text-xs text-slate-500 font-semibold">
                      {result.label}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-secondary dark:text-white group-hover:text-primary transition-colors">
                    {result.lessonTitle}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                    {result.reason}
                  </p>

                  {/* Key Points snippet */}
                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1 text-success font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{result.keyPoints[0] || 'شرح تطبيقي عملي'}</span>
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{Math.round(result.durationSeconds / 60)} دقيقة</span>
                    </span>
                  </div>
                </div>

                <div className="shrink-0 self-start md:self-center">
                  <span
                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 group-hover:border-primary text-secondary dark:text-slate-200 group-hover:text-primary text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap"
                  >
                    <span>{locale === 'ar' ? 'فتح الجزء' : 'Open Part'}</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <SearchResultsContent />
    </Suspense>
  );
}
