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
  AlertTriangle,
  Loader2,
  ListTodo,
  Plus,
  Trash2,
  Check,
  Copy,
} from 'lucide-react';
import { LessonResource } from '@/lib/course-content';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';

export interface TodoNoteItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

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
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Vocational checklist state
  const checklistKey = `knzin_checklist_${courseSlug}_part_${partNumber}`;
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  // Local storage for learner's private notes as To-Do items
  const storageKey = `knzin_note_${courseSlug}_part_${partNumber}`;
  const [todoItems, setTodoItems] = useState<TodoNoteItem[]>([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [todoFilter, setTodoFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isCopied, setIsCopied] = useState(false);
  const [isNoteSaved, setIsNoteSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedChecklist = localStorage.getItem(checklistKey);
      if (savedChecklist) {
        try {
          setCheckedItems(JSON.parse(savedChecklist));
        } catch {
          // ignore parsing error
        }
      }

      const rawNotes = localStorage.getItem(storageKey);
      if (rawNotes) {
        try {
          const parsed = JSON.parse(rawNotes);
          if (Array.isArray(parsed)) {
            setTodoItems(parsed);
          } else if (typeof parsed === 'string' && parsed.trim().length > 0) {
            // Legacy single-string note migration
            const migrated: TodoNoteItem[] = parsed
              .split('\n')
              .map((line: string) => line.trim())
              .filter(Boolean)
              .map((text: string, idx: number) => ({
                id: `migrated-${idx}-${Date.now()}`,
                text,
                completed: false,
                createdAt: Date.now() - idx * 1000,
              }));
            setTodoItems(migrated);
          }
        } catch {
          // Legacy plain text note in localStorage
          if (rawNotes.trim().length > 0) {
            const migrated: TodoNoteItem[] = rawNotes
              .split('\n')
              .map((line: string) => line.trim())
              .filter(Boolean)
              .map((text: string, idx: number) => ({
                id: `legacy-${idx}-${Date.now()}`,
                text,
                completed: false,
                createdAt: Date.now() - idx * 1000,
              }));
            setTodoItems(migrated);
          }
        }
      }
    }
  }, [storageKey, checklistKey]);

  const saveTodoItems = (items: TodoNoteItem[]) => {
    setTodoItems(items);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(items));
      setIsNoteSaved(true);
      setTimeout(() => setIsNoteSaved(false), 1500);
    }
  };

  const handleAddTodo = (textToAdd?: string) => {
    const text = (textToAdd ?? newTodoText).trim();
    if (!text) return;
    const newItem: TodoNoteItem = {
      id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text,
      completed: false,
      createdAt: Date.now(),
    };
    const updated = [newItem, ...todoItems];
    saveTodoItems(updated);
    if (!textToAdd) setNewTodoText('');
  };

  const handleToggleTodo = (id: string) => {
    const updated = todoItems.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    saveTodoItems(updated);
  };

  const handleDeleteTodo = (id: string) => {
    const updated = todoItems.filter((item) => item.id !== id);
    saveTodoItems(updated);
  };

  const handleClearCompleted = () => {
    const updated = todoItems.filter((item) => !item.completed);
    saveTodoItems(updated);
  };

  const handleCopyTodos = () => {
    if (todoItems.length === 0) return;
    const formatted = todoItems
      .map((item) => `${item.completed ? '✅' : '⬜'} ${item.text}`)
      .join('\n');
    navigator.clipboard.writeText(formatted);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getVocationalSuggestions = () => {
    if (courseSlug.includes('phone') || courseSlug.includes('smart')) {
      return [
        isRtl ? 'قياس مسار VDD_MAIN وممانعة الدخل' : 'Measure VDD_MAIN diode mode',
        isRtl ? 'حفظ مسامير الشيلدات حسب الأطوال' : 'Map shield screws by length',
        isRtl ? 'فحص حرارة أيسي الشحن (Thermal Heat)' : 'Check charge IC thermal heat',
        isRtl ? 'تنظيف كونكتر البطارية بكحول 99%' : 'Clean battery FPC with 99% IPA',
      ];
    }
    if (courseSlug.includes('detail') || courseSlug.includes('auto')) {
      return [
        isRtl ? 'قياس سماكة الطلاء في 4 نقاط للوح' : 'Measure paint depth in 4 spots',
        isRtl ? 'تطبيق تجربة البقعة الخفية (Test Spot)' : 'Run a 40x40cm test spot',
        isRtl ? 'تغطية الحواف البلاستيكية بشريط العزل' : 'Mask trim with automotive tape',
        isRtl ? 'مسحة كحول IPA للتحقق من زوال الخدش' : 'Perform IPA wipe down inspection',
      ];
    }
    if (courseSlug.includes('solar')) {
      return [
        isRtl ? 'حساب معامل أمان تيار القصر (1.25x Isc)' : 'Apply 1.25x safety factor on Isc',
        isRtl ? 'ضبط فولتية شحن الـ Bulk والـ Float' : 'Configure Bulk/Float voltages',
        isRtl ? 'شد البراغي بمفتاح عزم محدد (Torque)' : 'Torque terminal lugs to spec',
        isRtl ? 'فحص عازلية خطوط الـ DC بالميجر' : 'Megger test DC cabling insulation',
      ];
    }
    return [
      isRtl ? 'تجهيز معدات وأدوات السلامة المهنية' : 'Prepare tools & safety equipment',
      isRtl ? 'مراجعة المخطط والمواصفات الفنية' : 'Review technical diagrams & specs',
      isRtl ? 'تسجيل القراءات والملاحظات الميدانية' : 'Record readings & field measurements',
      isRtl ? 'فحص جودة العمل قبل التسليم' : 'Final quality check before handover',
    ];
  };

  const handleDownloadResource = async (resourceId: string) => {
    setDownloadingId(resourceId);
    setDownloadError(null);

    try {
      const data = await apiClient<{
        resource_id: string;
        download_url: string;
        filename: string;
      }>(`/lessons/${courseSlug}/parts/${partNumber}/downloads/${resourceId}`, {
        method: 'POST',
      });

      if (data?.download_url) {
        window.open(data.download_url, '_blank');
      }
    } catch (err: any) {
      setDownloadError(err?.message || (isRtl ? 'فشل تحميل الملف، يرجى المحاولة لاحقاً.' : 'Failed to download resource.'));
    } finally {
      setDownloadingId(null);
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
            <ListTodo className="w-4 h-4 text-content-secondary" />
            <span>{isRtl ? 'ملاحظاتي ومهامي' : 'My Notes & To-Do'}</span>
            {todoItems.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-surface text-content-secondary border border-border-subtle">
                {todoItems.filter((i) => i.completed).length}/{todoItems.length}
              </span>
            )}
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

          {downloadError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-500/20 text-xs text-red-600">
              {downloadError}
            </div>
          )}

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
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleDownloadResource(res.id)}
                  disabled={downloadingId === res.id}
                  className="p-3 rounded-lg border border-border-subtle bg-surface-primary hover:border-border transition-colors flex items-center justify-between gap-3 group text-start w-full cursor-pointer disabled:opacity-70"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-surface-secondary text-primary">
                      {downloadingId === res.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <FolderArchive className="w-4 h-4" />
                      )}
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
                  <span className="text-[11px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    {isRtl ? 'تحميل' : 'Download'}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-content-muted py-6 text-center">
              {isRtl ? 'لا توجد ملفات مرفقة لهذا الجزء.' : 'No downloadable resources attached to this part.'}
            </p>
          )}
        </TabsContent>

        {/* Tab 4: Private Notes as Interactive To-Do List */}
        <TabsContent value="notes" className="space-y-4 mt-4">
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-primary" />
                <h3 className="text-sm sm:text-base font-bold text-content-primary">
                  {isRtl ? 'قائمة مهام وملاحظات التطبيق العملي' : 'Practical To-Do & Execution Notes'}
                </h3>
                {todoItems.length > 0 && (
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-primary/10 text-primary">
                    {todoItems.filter((i) => i.completed).length} / {todoItems.length} {isRtl ? 'منجز' : 'done'}
                  </span>
                )}
              </div>
              <p className="text-xs text-content-secondary">
                {isRtl
                  ? 'سجّل خطواتك العملية، قياساتك الميدانية، والمهام التي تنوي تطبيقها في ورشتك لهذا الجزء.'
                  : 'Track your practical steps, workshop reminders, and field measurements for this part.'}
              </p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              {isNoteSaved && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 animate-in fade-in">
                  <Check className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'محفوظ تلقائياً' : 'Auto-saved'}</span>
                </span>
              )}
              {todoItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleCopyTodos}
                  className="px-2.5 py-1.5 rounded-lg border border-border-subtle hover:bg-surface-secondary text-content-secondary hover:text-content-primary text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                  title={isRtl ? 'نسخ القائمة' : 'Copy list'}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">{isRtl ? 'تم النسخ!' : 'Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'نسخ' : 'Copy'}</span>
                    </>
                  )}
                </button>
              )}
              {todoItems.some((i) => i.completed) && (
                <button
                  type="button"
                  onClick={handleClearCompleted}
                  className="px-2.5 py-1.5 rounded-lg border border-border-subtle hover:bg-red-50 dark:hover:bg-red-950/20 text-content-muted hover:text-red-600 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'مسح المكتمل' : 'Clear Done'}</span>
                </button>
              )}
            </div>
          </div>

          {/* New Item Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddTodo();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                placeholder={
                  isRtl
                    ? 'أضف مهمة أو ملاحظة تطبيقية... (مثال: قياس الفولتية، درجة الحرارة 350°)'
                    : 'Add a to-do or field note... (e.g. check voltage, set heat to 350°)'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-input-bg text-content-primary text-xs sm:text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-content-muted"
              />
            </div>
            <button
              type="submit"
              disabled={!newTodoText.trim()}
              className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-40 text-white text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              <span>{isRtl ? 'إضافة' : 'Add'}</span>
            </button>
          </form>

          {/* Quick Suggestions Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-content-muted block">
              {isRtl ? 'مقترحات عملية سريعة للإضافة:' : 'Quick vocational prompts:'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {getVocationalSuggestions().map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddTodo(suggestion)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-secondary/70 hover:bg-primary/10 hover:text-primary text-[11px] font-medium text-content-secondary border border-border-subtle transition-all cursor-pointer"
                >
                  <Plus className="w-3 h-3 opacity-60" />
                  <span>{suggestion}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filter Bar */}
          {todoItems.length > 0 && (
            <div className="flex items-center justify-between gap-2 pt-2">
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-surface-secondary/50 border border-border-subtle text-xs">
                {(['all', 'active', 'completed'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setTodoFilter(mode)}
                    className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                      todoFilter === mode
                        ? 'bg-surface text-primary shadow-xs'
                        : 'text-content-secondary hover:text-content-primary'
                    }`}
                  >
                    {mode === 'all'
                      ? isRtl ? 'الكل' : 'All'
                      : mode === 'active'
                      ? isRtl ? 'قيد التنفيذ' : 'Active'
                      : isRtl ? 'المكتملة' : 'Completed'}
                    <span className="ms-1 text-[10px] opacity-75">
                      (
                      {mode === 'all'
                        ? todoItems.length
                        : mode === 'active'
                        ? todoItems.filter((i) => !i.completed).length
                        : todoItems.filter((i) => i.completed).length}
                      )
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* To-Do List Items */}
          {todoItems.filter((item) => {
            if (todoFilter === 'active') return !item.completed;
            if (todoFilter === 'completed') return item.completed;
            return true;
          }).length > 0 ? (
            <div className="space-y-2">
              {todoItems
                .filter((item) => {
                  if (todoFilter === 'active') return !item.completed;
                  if (todoFilter === 'completed') return item.completed;
                  return true;
                })
                .map((item) => (
                  <div
                    key={item.id}
                    className={`group flex items-start gap-3 p-3 rounded-xl border transition-all ${
                      item.completed
                        ? 'bg-surface-secondary/30 border-border-subtle text-content-muted'
                        : 'bg-surface border-border-subtle hover:border-border text-content-primary shadow-2xs'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleTodo(item.id)}
                      className="mt-0.5 shrink-0 text-content-muted hover:text-primary transition-colors cursor-pointer"
                      aria-label={item.completed ? 'Mark pending' : 'Mark completed'}
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950/40" />
                      ) : (
                        <div className="w-5 h-5 rounded-md border-2 border-content-muted/40 hover:border-primary transition-colors flex items-center justify-center" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs sm:text-sm leading-relaxed break-words ${
                          item.completed
                            ? 'line-through text-content-muted'
                            : 'font-medium text-content-primary'
                        }`}
                      >
                        {item.text}
                      </p>
                      <span className="text-[10px] text-content-muted mt-1 block">
                        {new Date(item.createdAt).toLocaleDateString(isRtl ? 'ar-IQ' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteTodo(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-content-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
                      title={isRtl ? 'حذف المهمة' : 'Delete task'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl border border-dashed border-border-subtle text-center space-y-2">
              <ListTodo className="w-8 h-8 text-content-muted/40 mx-auto" />
              <p className="text-xs sm:text-sm font-semibold text-content-secondary">
                {todoFilter === 'all'
                  ? isRtl
                    ? 'لا توجد مهام أو ملاحظات بعد. ابدأ بإضافة مهمتك الأولى أعلاه!'
                    : 'No to-do tasks added yet. Start by adding your first task above!'
                  : todoFilter === 'active'
                  ? isRtl
                    ? 'رائع! لا توجد مهام معلقة قيد التنفيذ.'
                    : 'All caught up! No active tasks pending.'
                  : isRtl
                  ? 'لم تكتمل أي مهمة بعد.'
                  : 'No completed tasks yet.'}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
