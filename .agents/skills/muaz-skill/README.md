# Muaz-v3 — Frontend Blueprint Engineer

---

## English

**Muaz-v3** is a Senior Frontend Architect & Design Systems Engineer skill for
[OpenCode](https://opencode.ai). It combines a structured design pipeline
(phases 1-5) with a powerful search engine to generate production-ready UI code.

### Features

- **5-Phase Pipeline**: Intake -> Design System -> Blueprint -> Code -> Delivery
- **Search Engine**: BM25-powered design system generator (84 styles, 161 color palettes, 73 font pairings, 161 product types, 49 composition patterns)
- **200+ Rules**: Prioritized accessibility, interaction, performance, and UX rules
- **Multi-Platform**: Web, iOS (SwiftUI), Android (Jetpack Compose), React Native, Flutter
- **Memory System**: AGENTS.md + PROJECT_BRIEF.md for project context persistence across sessions
- **Design Tokens**: CSS variables, Tailwind config, and JS/TS tokens from every blueprint
- **Security Detection**: Auto-detects 3 levels (Public / Authenticated / Sensitive) with full checklists
- **Stack Support**: React, Next.js, Vue, Nuxt, Svelte, Astro, Angular, HTML+Tailwind, SwiftUI, Flutter, React Native, Laravel, Three.js
- **Premium Design Guide**: Affirmative standard for what "good" looks like (spacing, typography, color, motion, layout)
- **Quality Gate**: 8-dimension scoring rubric (0-160) with enforcement flow
- **Anti-Slop Script**: Deterministic checks for 29 AI tell-patterns across 3 severity tiers (CRITICAL/HIGH/MEDIUM) with `--fail-on` gate
- **Deterministic Quality Gate**: Pure-Python `scripts/quality_gate.py` — WCAG 2.2 contrast math, token schema validation, per-stack bundle budget vs QD; single `--fail-on` exit code for CI
- **Taste Memory**: `scripts/taste.py` records A/B style corrections and re-ranks future searches
- **Token Audit**: `scripts/token_audit.py` (optional Playwright) asserts computed CSS matches `tokens.json`
- **Visual Diff**: `scripts/visual_diff.py` (optional Playwright) screenshot capture + pixel diff + drift gate for regressions
- **Design Intelligence**: Mobbin MCP integration for 600k+ real product screen references

### Extended References

The full reference inventory — every file, its phase, and its prerequisites — lives in
[`references/reference-graph.md`](references/reference-graph.md) (single source of truth).
Terminology: [`references/glossary.md`](references/glossary.md). Checklists:
[`references/checklist-index.md`](references/checklist-index.md).

### Templates

| File | Purpose |
|---|---|
| `templates/user-prompt-template.md` | Structured project brief for users to fill |
| `templates/AGENTS.md` | Project memory file template |
| `templates/github-actions.yml` | CI/CD pipeline (lint -> tsc -> test -> build -> deploy) |
| `templates/Dockerfile` | Multi-stage Docker build with nginx |
| `templates/nginx.conf` | SPA nginx config with security headers + caching |
| `templates/lighthouserc.json` | Lighthouse CI budget enforcement |

### Pipeline Enhancements

- **Strict Phase 1 Intake**: Classifies user input as template-filled / detailed / vague. Presents a template for vague prompts. Gate blocks Phase 3 until 6+ fields are answered.
- **Persistent Project Brief**: After blueprint confirmation, writes `.context/PROJECT_BRIEF.md`. AI reads it on every response, flags contradictions.
- **Phase 4 Sections**: 4k (SEO), 4l (Error Monitoring), 4m (PWA), 4n (Real-Time), 4o (Feature Flags), 4p (Forms), 4q (API Patterns), 4r (Analytics), 4s (i18n)
- **Phase 5 Checklist**: Extended deployment checklist covering CI/CD, Docker, error monitoring, SEO, PWA, Storybook, forms, analytics, i18n.

### Usage

The skill activates automatically when you request UI/UX work.

For best results, fill the user prompt template first:
[`templates/user-prompt-template.md`](templates/user-prompt-template.md)

Otherwise, just chat naturally:

```
Build a landing page for my SaaS product
Create a dashboard for healthcare analytics
Design a portfolio website with dark mode
```

### Requirements

- Python 3.x (for the search engine scripts)
- The skill auto-detects if Python is available and falls back gracefully

### Search Commands

```bash
# Generate complete design system
python scripts/search.py "<query>" --design-system -p "Project Name"

# Search specific domain
python scripts/search.py "<keyword>" --domain <domain>

# Stack-specific guidelines
python scripts/search.py "<keyword>" --stack <stack>

# Persist design system to project
python scripts/search.py "<query>" --design-system --persist -p "Project"
```

### Structure

```
muaz-v3/
├── SKILL.md              # Core skill file (pipeline + rules)
├── data/                 # CSV databases (styles, colors, fonts, products, compositions)
│   └── stacks/           # Per-stack best practices
├── scripts/              # Search engine + verification (search.py, core.py, design_system.py, anti_slop.py, quality_gate.py, taste.py, token_audit.py, visual_diff.py)
├── references/           # 31 reference files (tokens, security, memory, code standards, premium design, quality gate, MCP, a11y patterns)
├── templates/            # 6 templates (AGENTS.md, Dockerfile, CI/CD, nginx, Lighthouse, prompt)
├── tests/                # Python test suite (search, design system, anti-slop, quality gate, taste, token audit, visual diff, data integrity)
└── README.md
```

### Credits

Powered by the [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
database and search engine (84 styles, 161 color palettes, 161 product types,
73 font pairings, 200+ UX rules). Built for OpenCode.

---

## العربية

**Muaz-v3** هي مهارة مهندس واجهات أمامية أول ومهندس أنظمة تصميم
لـ [OpenCode](https://opencode.ai). تجمع بين منهجية تصميم منظمة
(5 مراحل) ومحرك بحث قوي لإنتاج كود واجهات جاهز للإنتاج.

### المميزات

- **منهجية 5 مراحل**: استقبال الطلب -> نظام التصميم -> المخطط -> الكود -> التسليم
- **محرك بحث**: مولّد أنظمة تصميم بتقنية BM25 (84 نمط، 161 لوحة ألوان، 73 زوج خطوط، 161 نوع منتج، 49 نمط تخطيط)
- **200+ قاعدة**: قواعد أولوية لإتاحة الوصول، التفاعل، الأداء، وتجربة المستخدم
- **متعدد المنصات**: ويب، iOS (SwiftUI)، Android (Jetpack Compose)، React Native، Flutter
- **نظام الذاكرة**: AGENTS.md + PROJECT_BRIEF.md لحفظ سياق المشروع عبر الجلسات
- **رموز التصميم**: متغيرات CSS، إعدادات Tailwind، كائنات JS/TS من كل مخطط
- **كشف الأمان**: يكتشف تلقائياً 3 مستويات (عام / تسجيل دخول / حساس) مع قوائم كاملة
- **دعم التقنيات**: Next.js، React، Vue، Nuxt، Svelte، Astro، Angular، Flutter، وغيرها
- **دليل التصميم المميز**: معيار إيجابي لما يبدو "جيداً" (التباعد، الطباعة، الألوان، الحركة، التخطيط)
- **بوابة الجودة**: نظام تقييم 8 أبعاد (0-160) مع تدفق الإنفاذ
- **سكريبت مكافحة الركاكة**: فحوصات حتمية لـ 29 نمطاً من أنماط الذكاء الاصطناعي عبر 3 مستويات خطورة (حرج/عالٍ/متوسط) مع بوابة `--fail-on`
- **ذكاء التصميم**: تكامل Mobbin MCP للوصول إلى أكثر من 600k شاشة منتج حقيقية

### المراجع الموسعة

القائمة الكاملة للمراجع — كل ملف ومرحلته ومتطلباته المسبقة — موجودة في
[`references/reference-graph.md`](references/reference-graph.md) (المصدر الوحيد).
المصطلحات: [`references/glossary.md`](references/glossary.md). القوائم:
[`references/checklist-index.md`](references/checklist-index.md).

### القوالب

| الملف | الغرض |
|---|---|
| `templates/user-prompt-template.md` | قالب ملخص المشروع للمستخدم |
| `templates/AGENTS.md` | قالب ملف الذاكرة |
| `templates/github-actions.yml` | سير عمل CI/CD |
| `templates/Dockerfile` | بناء Docker متعدد المراحل مع nginx |
| `templates/nginx.conf` | إعدادات nginx لتطبيقات SPA |
| `templates/lighthouserc.json` | معايير أداء Lighthouse |

### تحسينات المنهجية

- **استقبال صارم**: يصنف إدخال المستخدم ويعرض قالباً عند الحاجة. لا يتجاوز المرحلة 3 قبل اكتمال 6+ حقول.
- **ملخص المشروع الدائم**: يكتب `.context/PROJECT_BRIEF.md` بعد تأكيد المخطط. يقرأه الذكاء الاصطناعي في كل رد.
- **المرحلة 4 الموسعة**: أقسام جديدة لتحسين محركات البحث، مراقبة الأخطاء، التطبيق دون اتصال، الاتصال المباشر، أعلام الميزات، النماذج، أنماط API، التحليلات، التدويل.
- **قائمة التسليم**: نقاط إضافية لتغطية CI/CD، Docker، المراقبة، تحسين محركات البحث، التطبيق دون اتصال، Storybook، النماذج، التحليلات، التدويل.

### الاستخدام

لأفضل النتائج، استخدم قالب ملخص المشروع أولاً:
[`templates/user-prompt-template.md`](templates/user-prompt-template.md)

أو فقط تحدث طبيعياً:

```
بناء صفحة هبوط لمنتج SaaS
إنشاء لوحة تحكم للرعاية الصحية
تصميم موقع شخصي بالوضع المظلم
```

### المتطلبات

- Python 3.x (لمحرك البحث)
- المهارة تكتشف وجود Python وتعمل بديل في حالة عدم وجوده

### أوامر البحث

```bash
# إنشاء نظام تصميم كامل
python scripts/search.py "<استعلام>" --design-system -p "اسم المشروع"

# البحث في مجال محدد
python scripts/search.py "<كلمة>" --domain <domain>

# إرشادات تقنية محددة
python scripts/search.py "<كلمة>" --stack <stack>

# حفظ نظام التصميم في المشروع
python scripts/search.py "<استعلام>" --design-system --persist -p "المشروع"
```

### الهيكل

```
muaz-v3/
├── SKILL.md              # ملف المهارة الأساسي (المنهجية + القواعد)
├── data/                 # قواعد بيانات CSV (أنماط، ألوان، خطوط، منتجات، تخطيطات)
│   └── stacks/           # أفضل الممارسات لكل تقنية
├── scripts/              # محرك البحث + أدوات التحقق (search.py, core.py, design_system.py, anti_slop.py, quality_gate.py, taste.py, token_audit.py, visual_diff.py)
├── references/           # 31 ملف مرجعي (الرموز، الأمان، الذاكرة، معايير الكود، التصميم المميز، بوابة الجودة، إعداد MCP، أنماط الإتاحة)
├── templates/            # 6 قوالب (AGENTS.md، Dockerfile، CI/CD، nginx، Lighthouse، ملخص المشروع)
├── tests/                # اختبارات بايثون (البحث، نظام التصميم، مكافحة الركاكة، بوابة الجودة، التفضيلات، تدقيق الرموز، مقارنة الصور، سلامة البيانات)
└── README.md
```

### المصادر

مدعوم بقاعدة بيانات ومحرك بحث
[ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
(84 نمط، 161 لوحة ألوان، 161 نوع منتج، 73 زوج خطوط، 200+ قاعدة تجربة مستخدم).
مبني لـ OpenCode.
