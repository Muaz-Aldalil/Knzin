export interface LessonResource {
  id: string;
  title_ar: string;
  title_en: string;
  type: 'pdf' | 'schematic' | 'code' | 'guide';
  size: string;
  url: string;
}

export interface PartExtendedContent {
  part_number: number;
  videoUrl: string;
  duration_seconds: number;
  summary_ar: string;
  summary_en: string;
  keyPoints_ar: string[];
  keyPoints_en: string[];
  proTip_ar: {
    title: string;
    content: string;
  };
  proTip_en: {
    title: string;
    content: string;
  };
  resources: LessonResource[];
}

export interface CourseExtendedData {
  slug: string;
  parts: Record<number, PartExtendedContent>;
}

export const VOCATIONAL_COURSES_CONTENT: Record<string, CourseExtendedData> = {
  'auto-detailing': {
    slug: 'auto-detailing',
    parts: {
      1: {
        part_number: 1,
        videoUrl: 'https://www.youtube.com/watch?v=5VzYg8k9m0M',
        duration_seconds: 2700, // 45m
        summary_ar: 'التعرف على فسيولوجيا دهان السيارات الحديثة، وفحص سماكة طبقة الكليير كوت (Clear Coat) باستخدام أجهزة الميكرون، وتشخيص دوائر الغسيل والخدوش الدقيقة.',
        summary_en: 'Understanding automotive clear coat physiology, measuring paint thickness in microns, and diagnosing swirl marks and micro-scratches.',
        keyPoints_ar: [
          'استخدام جهاز قياس سماكة الطلاء الإلكتروني (Paint Depth Gauge)',
          'تمييز الفرق بين الخدش السطحي وتلف طبقة الأساس (Base Coat)',
          'تحضير سطح السيارة بالغسيل ثنائي المراحل وفك الشوائب بالـ Clay Bar',
          'عزل الحواف والربلات البلاستيكية بشريط الحماية الحراري',
        ],
        keyPoints_en: [
          'Using electronic paint depth gauge correctly across panels',
          'Distinguishing clear coat swirls from base coat damage',
          'Two-stage decontamination wash and clay bar purification',
          'Precision masking of rubbers and trim with thermal tape',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: اختبار البقعة الخفية (Test Spot)',
          content: 'لا تبدأ بصقل سيارة العميل مباشرة؛ دائماً اختر بقعة بمساحة 40×40 سم في أسفل الباب الخلفي لتحديد أنعم توليفة باد وبولش تحقق النتيجة دون إهدار سماكة الورنيش.',
        },
        proTip_en: {
          title: 'Pro Tip: Always Run a Test Spot',
          content: 'Never buff the whole vehicle right away; always test a 40x40 cm section on a lower panel to find the least aggressive pad-compound combo that delivers the desired finish.',
        },
        resources: [
          {
            id: 'ad-r1',
            title_ar: 'جدول قياسات ميكرون الطلاء لسيارات السوق العراقي (PDF)',
            title_en: 'Iraqi Market Vehicle Paint Depth Chart (PDF)',
            type: 'pdf',
            size: '2.4 MB',
            url: '#',
          },
          {
            id: 'ad-r2',
            title_ar: 'قائمة المواد والأدوات الكيميائية المعتمدة للمرحلة الأولى',
            title_en: 'Approved Chemical Equipment & Detailing Checklist',
            type: 'guide',
            size: '1.1 MB',
            url: '#',
          },
        ],
      },
      2: {
        part_number: 2,
        videoUrl: '',
        duration_seconds: 3300, // 55m
        summary_ar: 'التدريب العملي على مكائن الصقل الدوارة (Rotary) والمدارية (Dual Action)، والتعامل مع الخدوش العميقة وحروق الشمس الشائعة في مناخ العراق.',
        summary_en: 'Hands-on rotary and dual-action polisher mechanics, tackling severe scratches and UV clear coat oxidation common in hot climates.',
        keyPoints_ar: [
          'معايرة سرعة مكينة الصقل وضبط زاوية الباد على المنحنيات الحادة',
          'اختيار حبوب الكومباوند الخشن المناسبة لصلابة طلاء السيارات الألمانية والآسيوية',
          'تقنية إزالة الخدوش العميقة بالصنفرة الرطبة (Wet Sanding 2000/3000)',
          'تفادي حرق حواف الصدمات والأجزاء البلاستيكية الحساسة للحرارة',
        ],
        keyPoints_en: [
          'Speed calibration and pad angle control on complex curves',
          'Selecting heavy compounding grits for German vs. Asian paint hardness',
          'Wet sanding deep scratch leveling (2000/3000 grit methodology)',
          'Preventing thermal burn through on plastic bumper edges',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: ميزان حرارة الصاج بالأشعة تحت الحمراء',
          content: 'حافظ على درجة حرارة اللوح المعدني تحت 50 درجة مئوية أثناء استخدام الروتاري. الحرارة المرتفعة تلين الورنيش وتسبب هولوجرام عنيف لا يمكن إزالته بسهولة.',
        },
        proTip_en: {
          title: 'Pro Tip: Infrared Panel Temperature Monitoring',
          content: 'Keep panel temperatures below 50°C during rotary cutting. Excess friction softens clear coat and causes stubborn holograms.',
        },
        resources: [
          {
            id: 'ad-r3',
            title_ar: 'دليل توافق وسائد الصقل (Pads) مع مركبات الكومباوند',
            title_en: 'Polishing Pad & Compound Compatibility Matrix',
            type: 'guide',
            size: '3.8 MB',
            url: '#',
          },
        ],
      },
      3: {
        part_number: 3,
        videoUrl: '',
        duration_seconds: 3000,
        summary_ar: 'مرحلة إنهاء السطح (Finishing) وإزالة آثار الهولوجرام (Holograms) وعلامات البفر للوصول إلى انعكاس نقي وعميق كالمرآة.',
        summary_en: 'Finishing stage mastery: eliminating buffer trails and holograms to achieve flawless optical clarity and deep mirror reflection.',
        keyPoints_ar: [
          'استخدام إضاءة الفحص الموجهة (Scangrip) لكشف الهالات المخفية',
          'تقنيات البولش فائق النعومة مع رغوة الفينيش Microfiber Pad',
          'التخلص النهائي من غبار التلميع في الفواصل وحواف الأبواب',
          'فحص النتيجة تحت ضوء الشمس الطبيعي وتحت الإضاءة البيضاء والصفراء',
        ],
        keyPoints_en: [
          'Inspecting with multi-spectrum inspection lamps (Scangrip)',
          'Ultra-fine finishing compound with micro-pore foam pads',
          'Residual dust extraction from jambs and panel gaps',
          'Dual-spectrum verification under natural and artificial light',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: تنظيف الباد بعد كل نصف لوح',
          content: 'الباد المتسخ ببقايا الورنيش المزال يتحول إلى أداة تخدش بدلاً من الصقل. استخدم فرشاة الهواء المضغوط لتنظيف رغوة الباد بعد كل مقطع.',
        },
        proTip_en: {
          title: 'Pro Tip: Blow Out Your Pads Frequently',
          content: 'Spent compound in pad fibers causes micro-marring. Clean the pad with compressed air after every half-panel.',
        },
        resources: [
          {
            id: 'ad-r4',
            title_ar: 'مخطط فحص الإضاءة واكتشاف عيوب الفينيش',
            title_en: 'Lighting Inspection & Defect Detection Chart',
            type: 'guide',
            size: '1.7 MB',
            url: '#',
          },
        ],
      },
      4: {
        part_number: 4,
        videoUrl: '',
        duration_seconds: 2400,
        summary_ar: 'تطهير وإزالة الزيوت والمواد الشمعية من مسام الطلاء بواسطة محاليل الـ IPA ومذيبات السيليكون لضمان التماسك الذري لطبقة السيراميك.',
        summary_en: 'De-oiling and stripping residual lubricants using IPA and specialized prep solvents for true chemical bonding of ceramic coatings.',
        keyPoints_ar: [
          'تركيب وموازنة محلول الإيزوبروبيل الكحولي (IPA) بنسبة 15-20%',
          'استخدام مناشف مايكروفايبر بدون حواف بوزن 500 GSM لمنع الخدش العكسي',
          'إزالة السيليكون والواكس المتبقي من مركبات التلميع',
          'اختبار التوتر السطحي للماء للتأكد من نظافة المسام 100%',
        ],
        keyPoints_en: [
          'Formulating safe 15-20% isopropyl alcohol wipe-down mixtures',
          'Using edgeless 500 GSM microfibers to prevent secondary marring',
          'Stripping silicone and filler oils from polishing compounds',
          'Water surface tension verification for sterile paint surfaces',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: المسحة الواحدة باتجاه تدفق الهواء',
          content: 'لا تمسح بحركات دائرية أثناء مرحلة مسح الزيوت. امسح بخطوط مستقيمة باتجاه واحد واقلب المنشفة باستمرار لتفادي نقل الزيوت لمكان آخر.',
        },
        proTip_en: {
          title: 'Pro Tip: Straight-line Wipe Pattern',
          content: 'Wipe in straight lines rather than circles, and flip the microfiber frequently to avoid redepositing extracted oils.',
        },
        resources: [
          {
            id: 'ad-r5',
            title_ar: 'معايير نسب خلط مذيبات تنظيف المسام (PDF)',
            title_en: 'IPA & Solvent Dilution Standards (PDF)',
            type: 'pdf',
            size: '1.2 MB',
            url: '#',
          },
        ],
      },
      5: {
        part_number: 5,
        videoUrl: '',
        duration_seconds: 3600,
        summary_ar: 'التطبيق الاحترافي لطبقات النانو سيراميك عالي الصلابة 9H، وتوقيت مسح الفلاش (Flash Time)، والمعالجة بالمصابيح الحرارية تحت الحمراء.',
        summary_en: 'Professional 9H ceramic coating application, timing the flash rainbow effect, and curing with shortwave infrared lamps.',
        keyPoints_ar: [
          'طريقة توزيع قطرات السيراميك على كتلة التطبيق المكسوة بالسويد',
          'قراءة تأثير قوس قزح (Rainbow Effect / Flash) لمعرفة موعد المسح',
          'تقنية المسح المزدوج (منشفة تجميع أولى + منشفة تلميع نهائية)',
          'معالجة الطلاء بمصابيح الـ Shortwave IR عند 60-70 درجة مئوية',
        ],
        keyPoints_en: [
          'Cross-hatch applicator block application pattern',
          'Reading flash time and rainbow sweat under ambient humidity',
          'Dual-towel leveling method (initial leveling + buffing towel)',
          'Shortwave infrared curing cycles at 60-70°C panel temp',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: رطوبة ورشة التطبيق',
          content: 'في صيف العراق الجاف، يتبخر السيراميك بسرعة مضاعفة. حافظ على رطوبة الغرفة بين 40% إلى 55% باستخدام مرطبات الهواء لمنع تجمد السيراميك وظهور High Spots.',
        },
        proTip_en: {
          title: 'Pro Tip: Ambient Humidity Control',
          content: 'In dry summer climates, flash time accelerates rapidly. Keep studio humidity between 40-55% to prevent high spots and premature crystallization.',
        },
        resources: [
          {
            id: 'ad-r6',
            title_ar: 'دليل درجات حرارة وأوقات معالجة النانو سيراميك (PDF)',
            title_en: 'Ceramic Curing Temperature & Flash Time Matrix',
            type: 'pdf',
            size: '2.9 MB',
            url: '#',
          },
        ],
      },
      6: {
        part_number: 6,
        videoUrl: '',
        duration_seconds: 3000,
        summary_ar: 'بناء باقات الاشتراكات الدورية للعملاء، وكتابة شروط الضمان، وتجهيز ورشة العناية المحترفة بالتهوية والإضاءة وتصريف المياه في العراق.',
        summary_en: 'Designing customer retention maintenance plans, warranty terms, and architectural layout for an auto-detailing studio in Iraq.',
        keyPoints_ar: [
          'حساب التكاليف التشغيلية وهوامش الربح لباقات الحماية في بغداد والمحافظات',
          'صياغة بطاقة ضمان النانو سيراميك وسياسة الصيانة الدورية كل 6 أشهر',
          'مخطط الإضاءة الهندسية وتوزيع الكشافات السداسية (Hexagon LEDs)',
          'أنظمة معالجة المياه المفلترة (De-ionized Water) لمنع ترسبات الكلس',
        ],
        keyPoints_en: [
          'Unit economics and profit margins for Iraqi detailing studios',
          'Structuring 6-month ceramic maintenance warranty agreements',
          'Studio lighting geometry and ceiling hexagon array positioning',
          'De-ionized reverse osmosis water filtration to prevent hard spots',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: كسب ثقة العميل بالفيديو التوثيقي',
          content: 'أرسل لمالك السيارة مقطع فيديو عالي الدقة بقياس الميكرون قبل وبعد الصقل. هذا التوثيق يحميك قانونياً ويجعل العميل سفيراً لورشتك دون أي تكلفة تسويقية.',
        },
        proTip_en: {
          title: 'Pro Tip: Video Evidence Builds Trust',
          content: 'Send high-res micron depth readings before and after polishing to the owner. This protects against claims and drives high-ticket word-of-mouth referrals.',
        },
        resources: [
          {
            id: 'ad-r7',
            title_ar: 'نموذج عقد ضمان وعناية بالسيارات قابل للتعديل (Word)',
            title_en: 'Editable Customer Detailing Contract & Warranty Template',
            type: 'guide',
            size: '540 KB',
            url: '#',
          },
        ],
      },
    },
  },
  'phone-repair': {
    slug: 'phone-repair',
    parts: {
      1: {
        part_number: 1,
        videoUrl: 'https://www.youtube.com/watch?v=6v7m3k9Y1Fw',
        duration_seconds: 2400,
        summary_ar: 'تهيئة محطة اللحام المجهري الاحترافية، ضبط الميكروسكوب ثلاثي العيون، وحماية الدوائر الحساسة من التفريغ الكهروستاتيكي (ESD).',
        summary_en: 'Micro-soldering workstation setup, trinocular microscope focal calibration, and anti-static ESD protection protocols.',
        keyPoints_ar: [
          'اختيار كاوية اللحام المناسبة بنظام التسخين السريع (JBC / Aixun)',
          'ضبط درجات حرارة الهوت إير (Hot Air Station) وتدفق الهواء الآمن',
          'معايرة العدسات التكبيرية والإضاءة الحلقية للميكروسكوب المجهري',
          'معايير السلامة المهنية وشفاطات أبخرة الفلكس السامة',
        ],
        keyPoints_en: [
          'Selecting rapid-heating soldering stations (JBC / Aixun systems)',
          'Calibrating hot air temperature curves and safe airflow velocities',
          'Focal plane calibration and ring light optimization on stereo scopes',
          'Safety protocols and toxic rosin flux fume extraction systems',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: جودة الفلكس (Flux) تصنع الفارق',
          content: 'لا تستخدم أبداً فلكس تجاري رديء. الفلكس الأصلي (مثل Amtech NC-559) ينظف الأكسدة دون توصيل كهربائي ويحمي اللوحة الأم من التفحم عند درجات حرارة تتجاوز 350°C.',
        },
        proTip_en: {
          title: 'Pro Tip: Never Skimp on Flux Quality',
          content: 'Cheap flux chars and conducts current. Genuine Amtech NC-559 ensures smooth alloy cohesion without conductive residue.',
        },
        resources: [
          {
            id: 'pr-r1',
            title_ar: 'دليل معدات اللحام والموردين الموثوقين بالعراق (PDF)',
            title_en: 'Micro-soldering Tooling & Iraqi Sourcing Guide (PDF)',
            type: 'pdf',
            size: '1.9 MB',
            url: '#',
          },
        ],
      },
      2: {
        part_number: 2,
        videoUrl: '',
        duration_seconds: 3100,
        summary_ar: 'تشخيص أعطال دائرة الشحن (Hydra/Tigris) وأعطال الباور عبر قياس ممانعات خطوط الإمداد (Diode Mode) واستخدام الباور سبلاي الرقمي.',
        summary_en: 'Diagnosing charging circuits and no-power logic boards using diode mode readings and digital DC bench power supply signatures.',
        keyPoints_ar: [
          'قراءة قيم الممانعة بالميللي فولت (Diode Mode) ومقارنتها باللوحة السليمة',
          'تحديد الشورت الصريح (Dead Short) والشورت الجزئي في خط VDD_MAIN',
          'استخدام الكاميرا الحرارية (Thermal Cam) وحقن الفولت الآمن (Voltage Injection)',
          'استبدال آيسيات الشحن المعطوبة بدقة متناهية',
        ],
        keyPoints_en: [
          'Interpreting diode mode millivolt drop against reference golden boards',
          'Isolating full shorts vs. partial leakages on primary VDD_MAIN lines',
          'Thermal imaging and precision safe voltage injection techniques',
          'Replacing damaged charging management ICs with zero adjacent lift',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: لا تتجاوز فولتية الخط أثناء الحقن',
          content: 'عند حقن الفولت لكشف العنصر الساخن، لا تحقن أكثر من الفولتية الاسمية للخط (مثلاً 1.2V لخط المعالج). تجاوز الفولتية سيحرق المعالج أو الذاكرة فوراً.',
        },
        proTip_en: {
          title: 'Pro Tip: Voltage Injection Limits',
          content: 'Never inject higher than the nominal line voltage (e.g. 1.2V on CPU rails). Over-voltage will instantly incinerate silicon.',
        },
        resources: [
          {
            id: 'pr-r2',
            title_ar: 'جدول ممانعات هواتف آيفون وسامسونج الشائعة (PDF)',
            title_en: 'Diode Mode Reference Tables for iPhone & Samsung (PDF)',
            type: 'schematic',
            size: '4.2 MB',
            url: '#',
          },
        ],
      },
      3: {
        part_number: 3,
        videoUrl: '',
        duration_seconds: 3600,
        summary_ar: 'إتقان فك وتركيب رقاقات BGA والذاكرة والمعالج، وتنظيف الغراء الأسود (Underfill)، وطريقة الـ Reballing بالقوالب الحرارية.',
        summary_en: 'Advanced BGA chip desoldering, black underfill chemical removal, and precision stencil reballing with solder paste alloys.',
        keyPoints_ar: [
          'ضبط زاوية الهواء الساخن لتفادي طيران المقاومات الدقيقة (01005)',
          'كشط الغراء المحيط بالرقاقة تحت حرارة 220°C بدون تجريح المسارات',
          'استخدام شبلونة الـ BGA الموجهة ومعجون قصدير 183°C',
          'تركيب الرقاقة والتحقق من التمركز الذاتي عبر التوتر السطحي للقصدير',
        ],
        keyPoints_en: [
          'Nozzle angle adjustment to safeguard 01005 micro-components',
          'Scraping black underfill at 220°C without severing PCB copper traces',
          'Precision laser stencil reballing using Sn63/Pb37 183°C paste',
          'Surface tension alignment mechanics during BGA reflow',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: حركة اللمسة الخفيفة (The Nudge)',
          content: 'عندما تلحم رقاقة BGA، المس زاوية الرقاقة برأس ملقط ناعم جداً؛ إذا اهتزت وعادت لمكانها، فهذا دليل قاطع على انصهار جميع الكرات تحتها بنجاح.',
        },
        proTip_en: {
          title: 'Pro Tip: The Gentle Tweezers Nudge',
          content: 'A microscopic nudge on the chip corner that springs back confirms every solder sphere has melted into its pad.',
        },
        resources: [
          {
            id: 'pr-r3',
            title_ar: 'مخطط درجات حرارة صهر سبائك القصدير المختلفة (PDF)',
            title_en: 'Solder Paste Alloy Melting Point Guide (PDF)',
            type: 'guide',
            size: '890 KB',
            url: '#',
          },
        ],
      },
      4: {
        part_number: 4,
        videoUrl: '',
        duration_seconds: 2800,
        summary_ar: 'قراءة المخططات الإلكترونية (Schematics) وتتبع الإشارات الرقمية عبر برامج ZXW و XinZhiZao و Wuxinji لتحديد المسارات المقطوعة وعمل البريدجات.',
        summary_en: 'Reading electronic schematics and tracing board buses using ZXW / XinZhiZao dongles to bridge broken micro-traces.',
        keyPoints_ar: [
          'فهم مسارات الإشارة I2C و SPI و UART على المخطط التخطيطي',
          'تحديد مسار الخط المقطوع من نقطة الاختبار (Test Point) إلى الآيسي',
          'استخدام سلك العزل النحاسي 0.01mm لعمل وصلات مجهرية (Jumpers)',
          'تثبيت البريدج بطلاء القناع الأخضر للأشعة فوق البنفسجية (UV Mask)',
        ],
        keyPoints_en: [
          'Deciphering I2C, SPI, and UART digital communication buses',
          'Locating trace breaks from test points directly into ball arrays',
          'Micro-jumper soldering using 0.01mm enameled copper wire',
          'Curing protective UV solder mask for mechanical stability',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: تنظيف سن الكاوية بالسلك النحاسي',
          content: 'لا تستخدم الإسفنجة الرطبة لتنظيف سن الكاوية في العمل المجهري، لأنها تخفض حرارة السن مفاجئاً وتسبب شوك حراري. استخدم الصوف النحاسي الجاف فقط.',
        },
        proTip_en: {
          title: 'Pro Tip: Dry Brass Wool Only',
          content: 'Wet sponges cause rapid thermal shock to micro-soldering tips. Always use dry brass wool coils.',
        },
        resources: [
          {
            id: 'pr-r4',
            title_ar: 'مكتبة مختصرات إشارات المخططات الإلكترونية للهواتف (PDF)',
            title_en: 'Mobile Logic Board Signal Abbreviations Reference (PDF)',
            type: 'schematic',
            size: '3.1 MB',
            url: '#',
          },
        ],
      },
      5: {
        part_number: 5,
        videoUrl: '',
        duration_seconds: 3200,
        summary_ar: 'تجديد شاشات OLED المنحنية والمستوية، فصل الزجاج المكسور بسلك الموليبدينوم 0.028mm، وكبس طبقات الغراء البصري OCA في الغرفة المعقمة.',
        summary_en: 'OLED screen refurbishing, separating broken cover glass with 0.028mm molybdenum wire, and cleanroom OCA optical lamination.',
        keyPoints_ar: [
          'ضبط حرارة سخان الشاشات عند 85°C وزاوية سحب السلك الدقيقة',
          'تنظيف بقايا الغراء القديم بمحاليل إزالة OCA بدون إتلاف المستقطب (Polarizer)',
          'محاذاة زجاج الشاشة الجديد باستخدام قوالب الكبس المعدنية الدقيقة',
          'استخدام جهاز الضغط المفرغ (Autoclave) لإزالة الفقاعات الهوائية نهائياً',
        ],
        keyPoints_en: [
          'Heat plate calibration at 85°C and low-angle wire separation',
          'Stripping residual glue without damaging polarizing filters',
          'Precision screen alignment using custom-milled CNC molds',
          'Autoclave de-bubbling cycles under 0.6 MPa atmospheric pressure',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: سلك الموليبدينوم فائق النحافة',
          content: 'في شاشات Super AMOLED، سلك 0.04mm قد يمزق شريحة العرض بسهولة. استخدم سلك 0.028mm مع سحب بزاوية موازية تماماً للوح الزجاجي.',
        },
        proTip_en: {
          title: 'Pro Tip: 0.028mm Wire Angle',
          content: 'Thicker wires tear AMOLED layers easily. Use 0.028mm molybdenum wire and keep pull angle strictly parallel to the glass plane.',
        },
        resources: [
          {
            id: 'pr-r5',
            title_ar: 'دليل خطوات تشغيل مكبس الـ OCA ومزيل الفقاعات (PDF)',
            title_en: 'OCA Laminator & Autoclave Operating Protocols (PDF)',
            type: 'guide',
            size: '1.6 MB',
            url: '#',
          },
        ],
      },
      6: {
        part_number: 6,
        videoUrl: '',
        duration_seconds: 2900,
        summary_ar: 'إدارة ورشة الصيانة وتسعير الخدمات الإلكترونية، واستيراد قطع الغيار الأصلية والـ OEM من دبي والصين إلى العراق بأسعار تنافسية.',
        summary_en: 'Operating a lucrative phone repair business in Iraq, managing part inventories, and sourcing original OEM components.',
        keyPoints_ar: [
          'حساب تسعيرة الصيانة المجهرية بناءً على نسبة الخطورة وتكلفة القطع',
          'أنظمة تتبع استلام وتسليم أجهزة الزبائن وتوثيق الحالة الأولية',
          'سلاسل إمداد قطع الغيار الموثوقة عبر تجار الجملة في بغداد وأربيل',
          'بناء سمعة احترافية وتوفير ضمان حقيقي يعزز ولاء العملاء',
        ],
        keyPoints_en: [
          'Pricing high-risk board repairs based on replacement cost matrices',
          'Ticket tracking systems and intake condition waivers',
          'Wholesale parts sourcing channels in Baghdad and Erbil',
          'Building repair warranty policies that guarantee customer retention',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: فحص وظائف الهاتف قبل استلامه',
          content: 'احرص دائماً على فحص البصمة والكاميرات ومستشعر التقارب أمام الزبون قبل فتح الجهاز وتدوينها في وصل الاستلام، لتجنب تحمل مسؤولية أعطال سابقة.',
        },
        proTip_en: {
          title: 'Pro Tip: Intake Pre-testing Saves Reputations',
          content: 'Always test Face ID, cameras, and proximity sensors in front of the customer before opening the chassis to avoid false dispute liabilities.',
        },
        resources: [
          {
            id: 'pr-r6',
            title_ar: 'نموذج وصل استلام صيانة معتمد مع الشروط القانونية (PDF)',
            title_en: 'Standard Repair Intake Waiver & Terms Template (PDF)',
            type: 'pdf',
            size: '620 KB',
            url: '#',
          },
        ],
      },
    },
  },
  'freelance-design': {
    slug: 'freelance-design',
    parts: {
      1: {
        part_number: 1,
        videoUrl: 'https://www.youtube.com/watch?v=1F8k3v9Y7mQ',
        duration_seconds: 2500,
        summary_ar: 'مدخل إلى تصميم تجربة المستخدم (UX) الموجهة للمستخدم العراقي والعربي، وفهم سلوك المستهلك في تطبيقات الدفع الإلكتروني والتجارة المحلية.',
        summary_en: 'UX foundations tailored to Iraqi and regional user psychology, consumer behavior in local e-commerce and fintech products.',
        keyPoints_ar: [
          'تحليل احتياجات المستخدم العراقي وبساطة التصفح في تطبيقات الجوال',
          'مبادئ التصميم من اليمين إلى اليسار (RTL First UI Architecture)',
          'بناء شخصيات المستخدمين الحقيقية (User Personas) لقطاع التجزئة العراقي',
          'صياغة مخططات رحلة المستخدم (User Journey Mapping)',
        ],
        keyPoints_en: [
          'Understanding local UX expectations and mobile-first convenience',
          'RTL-first design architecture and Arabic typography hierarchy',
          'Developing contextual user personas for Iraqi retail and delivery',
          'Synthesizing end-to-end user journey and checkout flows',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: تجنب الحشو البصري في التطبيقات الخدمية',
          content: 'المستخدم العراقي يفضل الوصول السريع للخدمة برقم الهاتف بدلاً من استمارات التسجيل المعقدة. صمم شاشات تسجيل الدخول برمز OTP فوري دائماً.',
        },
        proTip_en: {
          title: 'Pro Tip: Frictionless OTP First Onboarding',
          content: 'Regional users strongly prefer instantaneous phone number OTP login over lengthy registration forms. Optimize for single-step auth.',
        },
        resources: [
          {
            id: 'fd-r1',
            title_ar: 'دليل الخطوط العربية الاحترافية المعتمدة لتطبيقات الجوال (PDF)',
            title_en: 'Curated Professional Arabic Typography Guide for UI (PDF)',
            type: 'guide',
            size: '2.1 MB',
            url: '#',
          },
        ],
      },
      2: {
        part_number: 2,
        videoUrl: '',
        duration_seconds: 3400,
        summary_ar: 'بناء أنظمة التصميم القابلة للتوسع في Figma باستخدام Auto Layout v5 والمكونات الذكية (Variables & Design Tokens) لتوحيد الهوية.',
        summary_en: 'Building scalable Figma design systems using advanced Auto Layout, design variables, and tokenized typography and color palettes.',
        keyPoints_ar: [
          'تنظيم لوحات الألوان والتباين اللوني المتوافق مع معايير WCAG 2.2 AA',
          'إتقان شبكات الـ 8pt Grid و Auto Layout المتقدم للتصاميم المتجاوبة',
          'بناء مكتبة أزرار وحقول إدخال ذكية تدعم الحالات (States) والـ Variants',
          'هيكلة ملفات الـ Design Tokens لتصديرها مباشرة للمطورين',
        ],
        keyPoints_en: [
          'Color token architecture compliant with WCAG 2.2 AA contrast standards',
          'Mastering 8pt grid rhythms and nested responsive Auto Layout constraints',
          'Creating polymorphic component sets with interactive component variants',
          'Structuring design token exports for direct frontend integration',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: التصميم ثنائي الوضع (Dark / Light) بالـ Variables',
          content: 'استخدم ميزة Figma Variables لربط ألوان الواجهة بمتغيرات دلالية؛ هذا يتيح لك تحويل التصميم كاملاً من الفاتح إلى الداكن بضغطة زر واحدة أمام العميل.',
        },
        proTip_en: {
          title: 'Pro Tip: Leverage Figma Semantic Color Variables',
          content: 'Define semantic variables so light/dark mode switches can be previewed live in front of stakeholders instantly.',
        },
        resources: [
          {
            id: 'fd-r2',
            title_ar: 'ملف فيجما لأنظمة التصميم الجاهزة للاستخدام (Figma File)',
            title_en: 'Starter Production-Ready Figma Design System Library',
            type: 'code',
            size: '14.5 MB',
            url: '#',
          },
        ],
      },
      3: {
        part_number: 3,
        videoUrl: '',
        duration_seconds: 3200,
        summary_ar: 'تصميم تجربة تسوق متكاملة لتطبيقات التجارة الإلكترونية، سلة المشتريات، الدفع ببطاقات زين كاش والماستركارد، وتتبع الطلبات المباشر.',
        summary_en: 'Designing end-to-end mobile commerce, cart UX, ZainCash / local card checkout bottom sheets, and real-time courier tracking interfaces.',
        keyPoints_ar: [
          'تصميم بطاقات المنتجات مع مؤشرات الأسعار والخصومات الجذابة',
          'واجهة عربة التسوق وتسهيل إجراءات الشراء بنقرة واحدة (Quick Checkout)',
          'دمج بوابات الدفع المحلية (ZainCash, Qi Card) وبطاقات الائتمان',
          'شاشات التتبع الحي لمندوب التوصيل على الخريطة التفاعلية',
        ],
        keyPoints_en: [
          'Product card UI patterns with discount badges and high-contrast pricing',
          'Streamlined cart architecture and single-step bottom-sheet checkout',
          'Integrating local payment methods (ZainCash, Qi Card) and Visa/Mastercard',
          'Live delivery driver map tracking with micro-status indicators',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: تفادي الشاشات الفارغة المملة',
          content: 'عند تصميم السلة الفارغة أو قائمة البحث، لا تكتفِ بعبارة "لا توجد عناصر". ضع رسماً توضيحياً جذاباً وزراً يوجه المستخدم للمنتجات الأكثر طلباً لزيادة المبيعات.',
        },
        proTip_en: {
          title: 'Pro Tip: Actionable Empty States',
          content: 'Never present a dead end. Pair empty cart/search states with cheerful illustrations and direct CTAs to best-selling items.',
        },
        resources: [
          {
            id: 'fd-r3',
            title_ar: 'مجموعة مكونات واجهات التجارة الإلكترونية (UI Kit)',
            title_en: 'Mobile E-Commerce Flow UI Kit & Figma Components',
            type: 'code',
            size: '8.2 MB',
            url: '#',
          },
        ],
      },
      4: {
        part_number: 4,
        videoUrl: '',
        duration_seconds: 2700,
        summary_ar: 'تحويل التصاميم الثابتة إلى نماذج تفاعلية حية (Interactive Prototypes) واختبار قابلية الاستخدام مع مستخدمين حقيقيين لاكتشاف الثغرات.',
        summary_en: 'Converting static mockups into interactive prototypes and conducting real user testing sessions to locate friction points.',
        keyPoints_ar: [
          'استخدام Smart Animate في Figma لإنشاء حركات وانتقالات واقعية',
          'تصميم القوائم السفلية التفاعلية (Interactive Bottom Sheets)',
          'منهجية جلسات اختبار المستخدم وتوثيق معوقات الاستخدام',
          'تحليل البيانات النوعية وتحويلها إلى تحسينات تصميمية مدروسة',
        ],
        keyPoints_en: [
          'Smart animate transitions for native feeling mobile micro-interactions',
          'Frictionless bottom-sheet gesture interactions and drag dismissals',
          'Usability testing protocol design and qualitative observation methods',
          'Synthesizing feedback into prioritized UX iterations',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: سرعة الانتقالات في النماذج (200-300ms)',
          content: 'لا تجعل الحركات بطيئة بدافع الاستعراض. الانتقالات المثالية للهواتف تتراوح بين 200 إلى 300 مللي ثانية مع منحنى Ease-out لتبدو الواجهة سريعة وخفيفة.',
        },
        proTip_en: {
          title: 'Pro Tip: Snappy 200-300ms Easing',
          content: 'Keep mobile UI transitions under 300ms using ease-out curves so the prototype feels instantaneous rather than sluggish.',
        },
        resources: [
          {
            id: 'fd-r4',
            title_ar: 'نموذج خطة اختبار قابلية الاستخدام للمشاريع (PDF)',
            title_en: 'Usability Testing Protocol & Observation Template (PDF)',
            type: 'guide',
            size: '940 KB',
            url: '#',
          },
        ],
      },
      5: {
        part_number: 5,
        videoUrl: '',
        duration_seconds: 2800,
        summary_ar: 'إعداد ملفات التصميم للتسليم النهائي للمطورين (Developer Handoff)، توليد مواصفات Tailwind CSS، وحل مشاكل الخطوط والأبعاد.',
        summary_en: 'Preparing design deliverables for developer handoff, exporting Tailwind CSS token specs, and eliminating layout discrepancies.',
        keyPoints_ar: [
          'تسمية الطبقات والمكونات بمعايير برمجية نظيفة يفهمها المبرمج',
          'تصدير الأيقونات بصيغة SVG نظيفة ومضغوطة خالية من الأخطاء',
          'كتابة توثيق الحالات القصوى (Edge Cases, Long Text Truncation)',
          'استخدام أدوات الفحص وتوليد كود التايلويند المتوافق مع Tailwind v4',
        ],
        keyPoints_en: [
          'Semantic component naming aligned with frontend component architecture',
          'Clean vector SVG icon exports without unnecessary clip paths',
          'Documenting edge cases, error states, and long-text clipping',
          'Generating Tailwind v4 theme specs and design tokens',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: اجتماع التسليم المشترك (Handoff Sync)',
          content: 'لا تكتفِ بإرسال رابط فيجما للمطور؛ رتب مكالمة لمدة 20 دقيقة تشرح فيها المنطق والتفاعلات. هذا يوفر عليك أسابيع من التعديلات وإعادة العمل.',
        },
        proTip_en: {
          title: 'Pro Tip: Live 20-minute Handoff Walkthrough',
          content: 'Never just email a link. A 20-minute live walkthrough explaining logic and interactive constraints saves weeks of refactoring.',
        },
        resources: [
          {
            id: 'fd-r5',
            title_ar: 'قائمة فحص جاهزية التصميم للتسليم البرمجي (Checklist)',
            title_en: 'Design-to-Code Handoff Quality Checklist',
            type: 'guide',
            size: '480 KB',
            url: '#',
          },
        ],
      },
      6: {
        part_number: 6,
        videoUrl: '',
        duration_seconds: 3300,
        summary_ar: 'استراتيجيات الفريلانس، بناء بورتفوليو احترافي يجذب الشركات، وكيفية تسعير المشاريع بالدولار والدينار العراقي والتفاوض مع العملاء.',
        summary_en: 'Freelancing mastery: building a high-converting portfolio, pricing projects in USD/IQD, and landing enterprise clients in Iraq and the Gulf.',
        keyPoints_ar: [
          'بناء دراسات حالة (Case Studies) واقعية تشرح النتائج وعوائد الاستثمار',
          'صيغة تسعير المشاريع: تسعير بالقيمة (Value Pricing) مقابل الأجر بالساعة',
          'كتابة عروض الأسعار الاحترافية (Design Proposals) ونماذج العقود',
          'طرق استلام الأموال من خارج العراق وتوثيق الحقوق الفكرية للتصاميم',
        ],
        keyPoints_en: [
          'Writing ROI-driven UX case studies that win enterprise clients',
          'Value-based project pricing strategies vs. hourly billing',
          'Crafting winning client proposals and intellectual property contracts',
          'Cross-border payment handling and freelance business administration',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: العميل يشتري النتيجة وليس الساعات',
          content: 'لا تقل للعميل "تصميم التطبيق يحتاج 40 ساعة". قل له "هذا التصميم سيسهل عملية الشراء ويزيد مبيعاتك بنسبة 25%". التركيز على القيمة يضاعف أتعابك.',
        },
        proTip_en: {
          title: 'Pro Tip: Sell Outcomes, Not Hours',
          content: 'Never say an app takes 40 hours. Explain how the redesigned checkout boosts conversions by 25%. Framing value commands premium pricing.',
        },
        resources: [
          {
            id: 'fd-r6',
            title_ar: 'نموذج عرض سعر وعقد تصميم واجهات احترافي (Word & PDF)',
            title_en: 'Client Proposal & Design Contract Agreement Template',
            type: 'pdf',
            size: '1.4 MB',
            url: '#',
          },
        ],
      },
    },
  },
};

// Lazy/direct merge with additional realistic courses
import { ADDITIONAL_COURSES_CONTENT } from '@/data/additional-course-content';

Object.assign(VOCATIONAL_COURSES_CONTENT, ADDITIONAL_COURSES_CONTENT);

export function getLessonContent(slug: string, partNumber: number): PartExtendedContent | null {
  const course = VOCATIONAL_COURSES_CONTENT[slug];
  if (!course) return null;
  return course.parts[partNumber] || null;
}

