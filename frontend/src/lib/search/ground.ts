import { VOCATIONAL_COURSES_CONTENT } from '@/lib/course-content';
import { ModelHit, SearchResult, SearchResponse, SortOption } from './types';
import { formatTimestamp } from '@/lib/video';

const COURSE_TITLES_AR: Record<string, string> = {
  'auto-detailing': 'العناية المتقدمة بالسيارات وحماية النانو سيراميك',
  'phone-repair': 'صيانة الهواتف الذكية واللحام الدقيق للميكروإلكترونيات',
  'solar-installation': 'تصميم وتركيب منظومات الطاقة الشمسية الهجينة والمنفصلة عن الشبكة',
  'freelance-design': 'تصميم الهويات البصرية والواجهات والعمل الحر في العراق',
  'hvac-refrigeration': 'صيانة مكيفات الإنفرتر ومبردات الهواء وتشخيص ضواغط التبريد',
  'cctv-smart-security': 'تمديد كاميرات المراقبة وأنظمة الإنذار',
  'barber-styling': 'فنون الحلاقة الرجالية الحديثة والتدريج وتأسيس الصالون',
  'specialty-coffee-barista': 'فن الباريستا واستخلاص القهوة المختصة',
};

const COURSE_TITLES_EN: Record<string, string> = {
  'auto-detailing': 'Advanced Auto Detailing & Nano-Ceramic Protection',
  'phone-repair': 'Smartphones Hardware Repair & Microsoldering',
  'solar-installation': 'Hybrid & Off-Grid Solar PV Systems Installation',
  'freelance-design': 'Brand Identity, UI Design & Local Freelancing',
  'hvac-refrigeration': 'Inverter Air Conditioning Diagnostics & Compressor Servicing',
  'cctv-smart-security': 'IP CCTV & Smart Security Systems',
  'barber-styling': "Modern Men's Haircutting, Fade Techniques & Barbershop Management",
  'specialty-coffee-barista': 'Specialty Coffee Barista & Espresso Science',
};

/**
 * Deterministic grounding engine that resolves model hits to verified catalog facts
 */
export function groundHits(
  query: string,
  hits: ModelHit[],
  sort: SortOption = 'relevance',
  locale: 'ar' | 'en' = 'ar'
): SearchResponse {
  const verifiedResults: SearchResult[] = [];
  const uniqueCourses = new Set<string>();

  for (const hit of hits) {
    const courseContent = VOCATIONAL_COURSES_CONTENT[hit.courseSlug];
    if (!courseContent) continue;

    const partContent = courseContent.parts[hit.partNumber];
    if (!partContent) continue;

    uniqueCourses.add(hit.courseSlug);

    const courseTitle =
      locale === 'ar'
        ? COURSE_TITLES_AR[hit.courseSlug] || hit.courseSlug
        : COURSE_TITLES_EN[hit.courseSlug] || hit.courseSlug;

    const lessonTitle =
      locale === 'ar'
        ? partContent.summary_ar.split('،')[0] || `الجزء ${hit.partNumber}`
        : partContent.summary_en.split(',')[0] || `Part ${hit.partNumber}`;

    const label = locale === 'ar' ? `الجزء ${hit.partNumber}.0` : `Part ${hit.partNumber}.0`;
    const keyPoints = locale === 'ar' ? partContent.keyPoints_ar : partContent.keyPoints_en;

    const startSeconds = hit.startSeconds || 0;
    const href = `/lessons/${hit.courseSlug}?part=${hit.partNumber}${
      startSeconds > 0 ? `&t=${startSeconds}` : ''
    }`;

    if (hit.kind === 'video') {
      verifiedResults.push({
        kind: 'video',
        lessonTitle,
        label,
        partNumber: hit.partNumber,
        courseTitle,
        courseSlug: hit.courseSlug,
        durationSeconds: partContent.duration_seconds,
        keyPoints,
        reason: hit.reason,
        href,
        rank: hit.rank,
        startSeconds,
        momentLabel:
          hit.momentLabel ||
          (locale === 'ar'
            ? `شاهد ابتداءً من ${formatTimestamp(startSeconds)}`
            : `Watch from ${formatTimestamp(startSeconds)}`),
      });
    } else {
      verifiedResults.push({
        kind: 'lesson',
        lessonTitle,
        label,
        partNumber: hit.partNumber,
        courseTitle,
        courseSlug: hit.courseSlug,
        durationSeconds: partContent.duration_seconds,
        keyPoints,
        reason: hit.reason,
        href,
        rank: hit.rank,
      });
    }
  }

  // Sort
  if (sort === 'newest') {
    verifiedResults.sort((a, b) => b.partNumber - a.partNumber);
  } else if (sort === 'duration') {
    verifiedResults.sort((a, b) => a.durationSeconds - b.durationSeconds);
  } else {
    verifiedResults.sort((a, b) => a.rank - b.rank);
  }

  const reply =
    locale === 'ar'
      ? `تم العثور على ${verifiedResults.length} نتيجة تدريبية موثقة مطابقة لبحثك "${query}".`
      : `Found ${verifiedResults.length} verified vocational training results for "${query}".`;

  return {
    query,
    sort,
    count: verifiedResults.length,
    courseCount: uniqueCourses.size,
    reply,
    results: verifiedResults,
  };
}

/**
 * Intelligent lexical/semantic catalog matcher used as fallback or direct search
 */
export function searchCatalog(query: string, sort: SortOption = 'relevance', locale: 'ar' | 'en' = 'ar'): SearchResponse {
  const normalizedQuery = query.toLowerCase().trim();
  const hits: ModelHit[] = [];

  const searchTokens = normalizedQuery.split(/\s+/).filter(Boolean);

  let rankCounter = 1;

  for (const [courseSlug, course] of Object.entries(VOCATIONAL_COURSES_CONTENT)) {
    for (const [partNumStr, part] of Object.entries(course.parts)) {
      const partNumber = parseInt(partNumStr, 10);
      const textToSearch = [
        part.summary_ar,
        part.summary_en,
        ...part.keyPoints_ar,
        ...part.keyPoints_en,
        part.proTip_ar.title,
        part.proTip_ar.content,
        courseSlug,
      ]
        .join(' ')
        .toLowerCase();

      // Score matches
      let score = 0;
      for (const token of searchTokens) {
        if (textToSearch.includes(token)) {
          score += 10;
        }
      }

      // Keyword boosts
      if (
        (normalizedQuery.includes('نانو') || normalizedQuery.includes('خدوش') || normalizedQuery.includes('بولش') || normalizedQuery.includes('طلاء') || normalizedQuery.includes('سيار')) &&
        courseSlug === 'auto-detailing'
      ) {
        score += 25;
      }
      if (
        (normalizedQuery.includes('شحن') || normalizedQuery.includes('باور') || normalizedQuery.includes('لحام') || normalizedQuery.includes('شاشة') || normalizedQuery.includes('bga') || normalizedQuery.includes('zxw')) &&
        courseSlug === 'phone-repair'
      ) {
        score += 25;
      }
      if (
        (normalizedQuery.includes('فيجما') || normalizedQuery.includes('figma') || normalizedQuery.includes('واجه') || normalizedQuery.includes('ui') || normalizedQuery.includes('ux') || normalizedQuery.includes('فريلانس') || normalizedQuery.includes('عملا')) &&
        courseSlug === 'freelance-design'
      ) {
        score += 25;
      }
      if (
        (normalizedQuery.includes('شمس') || normalizedQuery.includes('طاق') || normalizedQuery.includes('سولار') || normalizedQuery.includes('solar') || normalizedQuery.includes('إنفرتر') || normalizedQuery.includes('بطاري') || normalizedQuery.includes('لوح') || normalizedQuery.includes('bms')) &&
        courseSlug === 'solar-installation'
      ) {
        score += 25;
      }
      if (
        (normalizedQuery.includes('تكييف') || normalizedQuery.includes('سبلت') || normalizedQuery.includes('غاز') || normalizedQuery.includes('تبريد') || normalizedQuery.includes('ضاغط') || normalizedQuery.includes('hvac') || normalizedQuery.includes('r410')) &&
        courseSlug === 'hvac-refrigeration'
      ) {
        score += 25;
      }
      if (
        (normalizedQuery.includes('كامير') || normalizedQuery.includes('مراقب') || normalizedQuery.includes('cctv') || normalizedQuery.includes('nvr') || normalizedQuery.includes('إنذار') || normalizedQuery.includes('cat6') || normalizedQuery.includes('poe')) &&
        courseSlug === 'cctv-smart-security'
      ) {
        score += 25;
      }
      if (
        (normalizedQuery.includes('حلاق') || normalizedQuery.includes('شعر') || normalizedQuery.includes('لحية') || normalizedQuery.includes('تدريج') || normalizedQuery.includes('صالون') || normalizedQuery.includes('fade') || normalizedQuery.includes('موس')) &&
        courseSlug === 'barber-styling'
      ) {
        score += 25;
      }
      if (
        (normalizedQuery.includes('قهو') || normalizedQuery.includes('باريستا') || normalizedQuery.includes('إسبريسو') || normalizedQuery.includes('لاتيه') || normalizedQuery.includes('حليب') || normalizedQuery.includes('coffee') || normalizedQuery.includes('كافيه')) &&
        courseSlug === 'specialty-coffee-barista'
      ) {
        score += 25;
      }

      if (score > 0 || searchTokens.length === 0) {
        // Distribute timestamp hits for deep links
        const startSeconds = (partNumber * 125) % (part.duration_seconds - 60);

        hits.push({
          courseSlug,
          partNumber,
          kind: rankCounter % 2 === 1 ? 'video' : 'lesson',
          reason:
            locale === 'ar'
              ? `يطابق استفسارك حول المهارات العملية في هذا الجزء.`
              : `Matches practical skills in this module.`,
          rank: rankCounter++,
          startSeconds: startSeconds > 0 ? startSeconds : 60,
          momentLabel:
            locale === 'ar'
              ? `شاهد الشرح العملي ابتداءً من ${formatTimestamp(startSeconds > 0 ? startSeconds : 60)}`
              : `Watch practical guide at ${formatTimestamp(startSeconds > 0 ? startSeconds : 60)}`,
        });
      }
    }
  }

  return groundHits(query, hits, sort, locale);
}
