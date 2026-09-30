'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import {
  FileText,
  Lightbulb,
  CheckCircle2,
  FolderArchive,
  Save,
  PenLine,
  Sparkles,
  ClipboardCheck,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { LessonResource } from '@/lib/course-content';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

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
  isUnlocked?: boolean;
}

export function LessonTabs({
  summary,
  keyPoints,
  proTip,
  resources,
  courseSlug,
  partNumber,
  isUnlocked = true,
}: LessonTabsProps) {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const [userNote, setUserNote] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Vocational checklist state
  const checklistKey = `knzin_checklist_${courseSlug}_part_${partNumber}`;
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  // Local storage for learner's private notes
  const storageKey = `knzin_note_${courseSlug}_part_${partNumber}`;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedNote = localStorage.getItem(storageKey);
      if (savedNote) setUserNote(savedNote);

      const savedChecklist = localStorage.getItem(checklistKey);
      if (savedChecklist) {
        try {
          setCheckedItems(JSON.parse(savedChecklist));
        } catch {
          // ignore parsing error
        }
      }
    }
  }, [storageKey, checklistKey]);

  const handleSaveNote = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, userNote);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const toggleChecklistItem = (index: number) => {
    const updated = { ...checkedItems, [index]: !checkedItems[index] };
    setCheckedItems(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(checklistKey, JSON.stringify(updated));
    }
  };

  // Get vocational specific checklist items
  const getChecklistTasks = () => {
    if (courseSlug.includes('phone') || courseSlug.includes('smart')) {
      return [
        {
          title: isRtl ? 'التأريض وتفريغ الشحنات الساكنة (ESD)' : 'ESD Grounding & Static Discharge',
          desc: isRtl ? 'ارتداء سوار تفريغ الشحنة ووضع الجهاز على بساط السيليكون المانع للشحنات.' : 'Wear ESD wristband and place device on heat-resistant antistatic mat.',
        },
        {
          title: isRtl ? 'فصل قطب البطارية أولاً' : 'Disconnect Battery Connector First',
          desc: isRtl ? 'قبل فك أي شيلد أو مسمار في اللوحة، افصل تغذية البطارية بأداة بلاستيكية غير موصلة.' : 'Isolate power with plastic spudger before removing shields or micro-screws.',
        },
        {
          title: isRtl ? 'خريطة المسامير (Screw Map)' : 'Screw Organization Map',
          desc: isRtl ? 'فرز المسامير حسب الأطوال لتجنب تلف مسارات اللوحة بطول خاطئ (Long Screw Damage).' : 'Organize screws by length to prevent motherboard trace damage.',
        },
        {
          title: isRtl ? 'فحص الميكروسكوب والحرارة' : 'Microscope & Thermal Inspection',
          desc: isRtl ? 'التأكد من عدم وجود شوائب لحام أو تماسات قبل إعادة تركيب الهيكل واختبار التشغيل.' : 'Check for solder bridges and ensure no shorts before final assembly.',
        },
      ];
    }
    if (courseSlug.includes('detail') || courseSlug.includes('auto')) {
      return [
        {
          title: isRtl ? 'غسيل العجلات والجنوط مسبقاً' : 'Decontaminate Wheels First',
          desc: isRtl ? 'تنظيف الجنوط بمزيل برادة الحديد لمنع تطاير الراسب الخشن على طلاء الهيكل.' : 'Clean wheels and brake dust before washing body panels to prevent swirling.',
        },
        {
          title: isRtl ? 'طريقة الدلوين مع شبكة العزل' : 'Two-Bucket Method with Grit Guard',
          desc: isRtl ? 'دلو للشامبو ودلو لشطف القفاز مع فلتر قاع لمنع تدوير الأوساخ على الطلاء.' : 'Separate wash and rinse buckets with grit guards to trap abrasive dirt.',
        },
        {
          title: isRtl ? 'قياس سماكة الورنيش (Paint Gauge)' : 'Paint Depth Measurement',
          desc: isRtl ? 'فحص سماكة الطبقة الشفافة بالمايكرون في 4 نقاط على اللوح قبل اختيار درجة الباد والمعجون.' : 'Measure clear coat thickness before selecting compound and cutting pad.',
        },
        {
          title: isRtl ? 'مسحة إزالة الزيوت (IPA Wipe)' : 'Panel Wipe / IPA Degreasing',
          desc: isRtl ? 'إزالة زيوت التلميع بالكامل للتأكد من زوال الخدوش الحقيقي قبل تطبيق حماية السيراميك.' : 'Wipe panel with alcohol to inspect true correction before ceramic coating.',
        },
      ];
    }
    // Default UI/Freelance or general trade
    return [
      {
        title: isRtl ? 'ضبط شبكة المحاذاة (Grid 8pt)' : 'Establish 8pt Spatial Grid',
        desc: isRtl ? 'تطبيق مقياس تباعد موحد لجميع العناصر والحشوات الداخلية والخارجية.' : 'Apply unified spacing multiples for all elements, cards, and layouts.',
      },
      {
        title: isRtl ? 'فحص معايير التباين والسهولة (WCAG AA)' : 'Contrast Ratio Audit (WCAG AA)',
        desc: isRtl ? 'التأكد من أن نسبة تباين النصوص مع الخلفية لا تقل عن 4.5:1 للمحتوى العادي.' : 'Verify text and interactive controls achieve at least 4.5:1 contrast.',
      },
      {
        title: isRtl ? 'تجربة المحاذاة على شاشة الجوال (Mobile Testing)' : 'Real Device Preview',
        desc: isRtl ? 'معاينة الواجهة على شاشات هواتف متعددة واختبار أزرار اللمس بحجم 44px كحد أدنى.' : 'Test tap targets (min 44x44px) and readability on real smartphone displays.',
      },
      {
        title: isRtl ? 'تصدير الرموز والملفات المهنية' : 'Asset & Design Spec Handoff',
        desc: isRtl ? 'تنظيم طبقات الفيجما وتسمية المكونات بالإنجليزية وتصدير الأيقونات بصيغة SVG نظيفة.' : 'Name design tokens, clean up layer hierarchy, and export vector SVGs.',
      },
    ];
  };

  const tasks = getChecklistTasks();
  const completedTasksCount = tasks.filter((_, idx) => checkedItems[idx]).length;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="content" className="w-full">
        {/* shadcn TabsList */}
        <TabsList className="w-full justify-start h-12 p-1 bg-surface-secondary border border-border-subtle rounded-xl overflow-x-auto scrollbar-none">
          <TabsTrigger value="content" className="gap-2 px-4 py-2">
            <FileText className="w-4 h-4 text-primary" />
            <span>{isRtl ? 'محتوى الدرس' : 'Lesson Content'}</span>
          </TabsTrigger>

          <TabsTrigger value="checklist" className="gap-2 px-4 py-2">
            <ClipboardCheck className="w-4 h-4 text-accent" />
            <span>{isRtl ? 'قائمة الفحص المهني' : 'Safety Checklist'}</span>
            <Badge variant="accent" size="sm" className="px-1.5 py-0 text-[10px] font-black">
              {completedTasksCount}/{tasks.length}
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="resources" className="gap-2 px-4 py-2">
            <FolderArchive className="w-4 h-4 text-content-secondary" />
            <span>{isRtl ? 'الملفات والمخططات' : 'Resources'}</span>
            {resources.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-surface text-content-secondary border border-border-subtle">
                {resources.length}
              </span>
            )}
          </TabsTrigger>

          <TabsTrigger value="notes" className="gap-2 px-4 py-2">
            <PenLine className="w-4 h-4 text-content-secondary" />
            <span>{isRtl ? 'ملاحظاتي الخاصة' : 'My Notes'}</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Lesson Content */}
        <TabsContent value="content" className="space-y-6 mt-4">
          {/* Summary */}
          <div className="space-y-2">
            <h3 className="text-sm sm:text-base font-bold text-content-primary">
              {isRtl ? 'ملخص هذا الجزء التدريبي' : 'Training Part Summary'}
            </h3>
            <p className="text-xs sm:text-sm text-content-secondary leading-relaxed">
              {summary}
            </p>
          </div>

          {/* Key Points */}
          {keyPoints && keyPoints.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-border-subtle">
              <h4 className="text-sm font-bold text-content-primary flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{isRtl ? 'المخرجات والمهارات العملية' : 'Hands-on Skills & Takeaways'}</span>
              </h4>
              <ul className="space-y-2.5">
                {keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-xs sm:text-sm text-content-secondary">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-content-primary text-[10px] font-bold mt-0.5">
                      {index + 1}
                    </span>
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pro Tip */}
          {proTip && (
            <div className="p-4 rounded-xl border border-border-subtle bg-surface-secondary/40 text-content-primary flex items-start gap-3.5">
              <div className="p-1.5 rounded-lg bg-surface-primary text-accent shrink-0 mt-0.5">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                  {isRtl ? 'سر المهنة' : 'Pro Trade Secret'}
                </span>
                <h5 className="text-xs sm:text-sm font-bold">{proTip.title}</h5>
                <p className="text-xs text-content-secondary leading-relaxed">
                  {proTip.content}
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Vocational Safety Checklist */}
        <TabsContent value="checklist" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-content-primary flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{isRtl ? 'خطوات الفحص والتطبيق العملي' : 'Vocational Safety & Quality Checklist'}</span>
              </h3>
              <p className="text-xs text-content-secondary mt-0.5">
                {isRtl
                  ? 'تحقق من تنفيذ معايير الجودة والسلامة قبل إنهاء هذا الجزء المهني.'
                  : 'Verify practical quality and safety steps before concluding this part.'}
              </p>
            </div>
            <Badge variant={completedTasksCount === tasks.length ? 'success' : 'outline'} size="sm">
              {completedTasksCount === tasks.length
                ? isRtl ? 'تم التحقق بالكامل ✓' : 'All Checked ✓'
                : `${completedTasksCount} / ${tasks.length} ${isRtl ? 'منجز' : 'Done'}`}
            </Badge>
          </div>

          <div className="space-y-2.5">
            {tasks.map((task, idx) => {
              const isChecked = !!checkedItems[idx];
              return (
                <div
                  key={idx}
                  onClick={() => toggleChecklistItem(idx)}
                  className={`p-3.5 rounded-lg border transition-colors cursor-pointer flex items-start gap-3 select-none ${
                    isChecked
                      ? 'bg-emerald-500/5 border-emerald-500/30'
                      : 'bg-surface-primary border-border-subtle hover:border-border'
                  }`}
                >
                  <div
                    className={`size-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isChecked
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-border-strong bg-surface'
                    }`}
                  >
                    {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>

                  <div className="flex-1">
                    <h5
                      className={`text-xs sm:text-sm font-semibold ${
                        isChecked ? 'line-through text-content-muted' : 'text-content-primary'
                      }`}
                    >
                      {task.title}
                    </h5>
                    <p className="text-xs text-content-secondary mt-0.5 leading-relaxed">
                      {task.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab 3: Resources */}
        <TabsContent value="resources" className="space-y-4 mt-4">
          <h3 className="text-sm sm:text-base font-bold text-content-primary">
            {isRtl ? 'الملفات والمخططات الملحقة' : 'Downloadable Schematics & Resources'}
          </h3>

          {!isUnlocked ? (
            <div className="p-8 rounded-xl border border-dashed border-border-strong text-center space-y-3 bg-surface-secondary/40">
              <FolderArchive className="w-10 h-10 text-content-muted mx-auto" />
              <h4 className="text-xs sm:text-sm font-bold text-content-primary">
                {isRtl ? 'الملفات والمخططات مقفلة' : 'Resources Locked'}
              </h4>
              <p className="text-xs text-content-secondary max-w-sm mx-auto leading-relaxed">
                {isRtl
                  ? 'الملفات الهندسية والمخططات ونماذج العمل قابلة للتحميل بعد شراء هذا الجزء أو الباقة الكاملة.'
                  : 'Downloadable PDFs, schematics, and trade templates become available after unlocking this training part.'}
              </p>
            </div>
          ) : resources && resources.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {resources.map((res, idx) => (
                <a
                  key={idx}
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-lg border border-border-subtle bg-surface-primary hover:border-border transition-colors flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-surface-secondary text-primary">
                      <FolderArchive className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold text-content-primary group-hover:text-primary transition-colors">
                        {isRtl ? res.title_ar : res.title_en}
                      </h5>
                      <span className="text-[10px] font-mono text-content-muted">
                        {res.type.toUpperCase()} • {res.size}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-content-muted py-6 text-center">
              {isRtl ? 'لا توجد ملفات مرفقة لهذا الجزء.' : 'No downloadable resources attached to this part.'}
            </p>
          )}
        </TabsContent>

        {/* Tab 4: Private Notes */}
        <TabsContent value="notes" className="space-y-4 mt-4">
          <div className="flex items-center justify-between gap-3 pb-2 border-b border-border-subtle">
            <h3 className="text-sm sm:text-base font-bold text-content-primary flex items-center gap-2">
              <PenLine className="w-4 h-4 text-primary" />
              <span>{isRtl ? 'دفتر الملاحظات الخاص بك' : 'Your Personal Notes'}</span>
            </h3>
            <button
              type="button"
              onClick={handleSaveNote}
              className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaved ? (isRtl ? 'تم الحفظ!' : 'Saved!') : isRtl ? 'حفظ' : 'Save'}</span>
            </button>
          </div>

          <textarea
            value={userNote}
            onChange={(e) => setUserNote(e.target.value)}
            placeholder={
              isRtl
                ? 'سجّل هنا ملاحظاتك حول هذا الجزء، أطوال المسامير، درجات الحرارة أو خلطات المواد للرجوع إليها لاحقاً...'
                : 'Write your private notes, torque specs, temperatures, or procedural reminders here...'
            }
            rows={6}
            className="w-full p-3.5 rounded-lg border border-border-subtle bg-input-bg text-content-primary text-xs sm:text-sm focus:outline-none focus:border-primary transition-colors resize-y"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
