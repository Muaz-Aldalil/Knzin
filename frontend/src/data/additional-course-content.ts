import { CourseExtendedData } from '@/lib/course-content';

export const ADDITIONAL_COURSES_CONTENT: Record<string, CourseExtendedData> = {
  'solar-installation': {
    slug: 'solar-installation',
    parts: {
      1: {
        part_number: 1,
        videoUrl: 'https://www.youtube.com/watch?v=5VzYg8k9m0M',
        duration_seconds: 3000,
        summary_ar: 'التعرف على فسيولوجيا وسلوك الإشعاع الشمسي في العراق، حساب ساعات الذروة الشمسية (Peak Sun Hours)، وجمع بيانات أحمال الأجهزة المنزلية لتحديد القدرة التوليدية المطلوبة.',
        summary_en: 'Solar irradiance dynamics in Iraqi climate, peak sun hours calculations, and measuring residential peak kilowatt-hour demand.',
        keyPoints_ar: [
          'حساب استهلاك كيلوواط/ساعة اليومي للأجهزة المنزلية ومكيفات السبلت',
          'معامل فقدان الكفاءة بسبب حرارة الصيف فوق 45 درجة مئوية',
          'تحديد مساحة السطح الصافية الخالية من ظلال خزانات المياه والمباني المجاورة',
          'قواعد السلامة الشخصية ومعدات الحماية الفردية (PPE) للعمل على الأسطح',
        ],
        keyPoints_en: [
          'Daily kWh load calculation for appliances and AC start-up surge',
          'De-rating coefficients for extreme summer ambient temperatures (>45°C)',
          'Roof shadow mapping avoiding water tanks and parapet walls',
          'Occupational safety and fall-arrest harness rigging standards',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: لا تعتمد على أرقام لوحة بيانات الأجهزة فقط',
          content: 'مكيف السبلت 2 طن يستهلك لحظياً عند إقلاع الضاغط تياراً يصل إلى 4 أضعاف تيار التشغيل الطبيعي (LRA). احرص دائماً على إضافة هامش أمان 25% على سعة الإنفرتر لتجنب فصل المنظومة.',
        },
        proTip_en: {
          title: 'Pro Tip: Account for AC Locked Rotor Amps (LRA)',
          content: 'A 2-ton rotary AC draws up to 4x rated amps during compressor startup. Always size the inverter with a 25% continuous margin to prevent sudden tripping.',
        },
        resources: [
          {
            id: 'si-r1',
            title_ar: 'شيت إكسل لحساب أحمال المنازل والمزارع في العراق (XLSX)',
            title_en: 'Residential & Agricultural Solar Load Calculator (XLSX)',
            type: 'guide',
            size: '1.2 MB',
            url: '#',
          },
          {
            id: 'si-r2',
            title_ar: 'خريطة الإشعاع الشمسي وساعات الذروة للمحافظات العراقية (PDF)',
            title_en: 'Iraq Solar Irradiance Atlas & Peak Sun Hours Chart (PDF)',
            type: 'pdf',
            size: '3.4 MB',
            url: '#',
          },
        ],
      },
      2: {
        part_number: 2,
        videoUrl: '',
        duration_seconds: 3600,
        summary_ar: 'مقارنة تقنية بين الألواح أحادية البلورة (Monocrystalline) وثنائية الوجه (Bifacial) وتقنية TopCon، وحساب الفولتية في درجات الحرارة القصوى.',
        summary_en: 'Technical comparison between Mono-PERC, TopCon, and Bifacial panels, calculating string voltage under thermal extremes.',
        keyPoints_ar: [
          'فهم معامل الحرارة (Temperature Coefficient) لفولتية الدائرة المفتوحة Voc',
          'تصميم السلاسل (Strings) لضمان بقاء الفولتية داخل نطاق MPPT للإنفرتر',
          'فوائد الألواح ثنائية الوجه على الأسطح المدهونة بمادة عاكسة للضوء (Albedo)',
          'فحص الألواح قبل التثبيت لكشف الشروخ الدقيقة (Micro-cracks)',
        ],
        keyPoints_en: [
          'Understanding temperature coefficients for open circuit voltage Voc',
          'String voltage sizing within optimum inverter MPPT tracking windows',
          'Bifacial yield gains over high-albedo white reflective roof coatings',
          'Pre-installation panel inspection for micro-cracks and glass fractures',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: احسب الفولتية في أبرد صباح شتوي',
          content: 'ترتفع فولتية الألواح مع انخفاض الحرارة. إذا صممت السلسلة عند الحد الأقصى للإنفرتر صيفاً، فقد تحترق دوائر الـ MPPT في صباح شتوي بارد عندما تصل الفولتية لذروتها.',
        },
        proTip_en: {
          title: 'Pro Tip: Design for Coldest Winter Morning Voc',
          content: 'Panel Voc increases as temperatures drop. Sizing strings too close to the inverter maximum will blow MPPT capacitors on a freezing winter dawn.',
        },
        resources: [
          {
            id: 'si-r3',
            title_ar: 'دليل مطابقة الألواح مع إنفرترات الهايبرد العالمية (PDF)',
            title_en: 'PV String Matching Guide for Global Inverter Brands (PDF)',
            type: 'pdf',
            size: '2.8 MB',
            url: '#',
          },
        ],
      },
      3: {
        part_number: 3,
        videoUrl: '',
        duration_seconds: 2700,
        summary_ar: 'تصميم وبناء الهياكل الحديدية المجلفنة على الساخن، ضبط زاوية الميل المناسبة لموقع التركيب، وحماية الألواح من العواصف الترابية والرياح العاتية.',
        summary_en: 'Hot-dip galvanized steel framing, tilt angle calibration, and aerodynamic anchoring against desert dust storms.',
        keyPoints_ar: [
          'تحديد زاوية الميل (28-32 درجة) في وسط وجنوب العراق لتحقيق أقصى إنتاج سنوي',
          'استخدام مسامير الستانلس ستيل SS304 والعوازل لمنع التآكل الكلفاني',
          'تثبيت قواعد التثبيت الميكانيكية والكيميائية (Hilti Chemical Anchor)',
          'تصميم ممرات الصيانة لسهولة غسيل الألواح دون الدوس على الخلايا',
        ],
        keyPoints_en: [
          'Calibrating 28-32 degree tilt angle for optimal annual yield in Iraq',
          'SS304 stainless steel hardware to prevent galvanic aluminum corrosion',
          'Mechanical and chemical adhesive anchoring on reinforced concrete slabs',
          'Dedicated maintenance corridors preventing foot traffic on PV glass',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: العزل المطاطي بين الحديد والألمنيوم',
          content: 'ملامسة إطار الألمنيوم للحديد المجلفن بدون فاصل مطاطي تسبب تآكلاً كيميائياً سريعاً في الشتاء. استخدم دائماً فواصل EPDM للحفاظ على عمر الهيكل 25 سنة.',
        },
        proTip_en: {
          title: 'Pro Tip: EPDM Isolation Pads Prevent Galvanic Rust',
          content: 'Direct contact between aluminum panel frames and galvanized steel initiates galvanic corrosion. Always sandwich EPDM rubber washers at clamp points.',
        },
        resources: [
          {
            id: 'si-r4',
            title_ar: 'مخططات هندسية أوتوكاد لهياكل الأسطح الخرسانية (CAD & PDF)',
            title_en: 'Structural Roof Mounting Frame Schematics (AutoCAD & PDF)',
            type: 'schematic',
            size: '4.5 MB',
            url: '#',
          },
        ],
      },
      4: {
        part_number: 4,
        videoUrl: '',
        duration_seconds: 4200,
        summary_ar: 'برمجة وإعداد إنفرترات الهايبرد الحديثة (Deye, Growatt, Voltronic)، ضبط مسارات الطاقة، وإعدادات الشحن الذكي من الألواح والشبكة والمولد.',
        summary_en: 'Programming modern hybrid inverters (Deye, Growatt), energy flow automation, and multi-source charging logic.',
        keyPoints_ar: [
          'ضبط أوضاع التشغيل: SBU (شمس ثم بطارية ثم شبكة) مقابل SUB',
          'معايرة تيار الشحن الأقصى لحماية بنك البطاريات من التيارات العالية',
          'برمجة تشغيل وإيقاف المولد الأهلي أوتوماتيكياً عبر مخرج Dry Contact',
          'ربط شريحة الـ Wi-Fi ومراقبة الإنتاج والأعطال عبر تطبيق الهاتف الذكي',
        ],
        keyPoints_en: [
          'Configuring priority modes: SBU vs SUB for grid-challenged regions',
          'Calibrating maximum charging amperage to protect battery chemistry',
          'Automatic generator start/stop scheduling via dry contact relays',
          'Wi-Fi dongle telemetry and mobile app dashboard monitoring',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: عزل تأريض الإنفرتر عن نترال المولد الأهلي',
          content: 'المولدات الأهلية في العراق قد تحتوي على نترال عائم أو كهرباء راجعة تحرق كارت الإنفرتر فوراً. تأكد دائماً من تركيب ريليهات فصل رباعية الأقطاب (4-Pole).',
        },
        proTip_en: {
          title: 'Pro Tip: Isolate Neutral Lines with 4-Pole ATS',
          content: 'Neighborhood diesel generators often carry floating neutrals. Never share neutral return lines; always isolate with 4-pole changeover contactors.',
        },
        resources: [
          {
            id: 'si-r5',
            title_ar: 'دليل رموز وأكواد أعطال إنفرترات Deye و Growatt الشائعة (PDF)',
            title_en: 'Deye & Growatt Hybrid Fault Codes Diagnostic Manual (PDF)',
            type: 'guide',
            size: '2.1 MB',
            url: '#',
          },
        ],
      },
      5: {
        part_number: 5,
        videoUrl: '',
        duration_seconds: 3900,
        summary_ar: 'تجميع وتوصيل بطاريات فوسفات الحديد الليثيوم LiFePO4، برمجة نظام إدارة البطارية (BMS)، وتوصيل كوابل الاتصال CAN/RS485 مع الإنفرتر.',
        summary_en: 'Assembling LiFePO4 battery banks, programming Smart BMS units, and synchronizing CAN/RS485 communication protocols.',
        keyPoints_ar: [
          'فهم كيمياء LiFePO4 وعمرها الافتراضي المتجاوز 6000 دورة شحن',
          'موازنة الخلايا النشطة (Active Balancing) لمنع انهيار الفولتية',
          'ضبط حدود الجهد الأدنى (Cut-off Voltage) لمنع التفريغ العميق القاتل',
          'برمجة بروتوكولات Pylontech و Voltronic في شاشة الإنفرتر',
        ],
        keyPoints_en: [
          'LiFePO4 chemistry endurance exceeding 6000+ deep discharge cycles',
          'Active cell balancing methods to prevent premature string degradation',
          'Setting low-voltage cut-offs to guard against irreversible cell death',
          'Configuring Pylontech / Voltronic protocol handshakes over CAN bus',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: العزم الصحيح لربط براغي الأقطاب (Torque Spec)',
          content: 'ربط أقطاب خلايا الليثيوم بمفتاح عزم محدد بـ 5-6 نيوتن/متر هو الفارق بين منظومة تدوم 10 سنوات ومنظومة تحترق بسبب نقطة مقاومة حرارية عالية.',
        },
        proTip_en: {
          title: 'Pro Tip: Calibrated Torque Prevents Thermal Runaway',
          content: 'Torque cell terminals strictly to 5-6 Nm using an insulated torque wrench. Under-torquing produces micro-arcing and destructive terminal heat.',
        },
        resources: [
          {
            id: 'si-r6',
            title_ar: 'مخطط توصيل بنوك البطاريات 48V وبروتوكولات BMS (PDF)',
            title_en: '48V LiFePO4 Battery Bank & BMS Communication Wiring (PDF)',
            type: 'schematic',
            size: '3.1 MB',
            url: '#',
          },
        ],
      },
      6: {
        part_number: 6,
        videoUrl: '',
        duration_seconds: 3300,
        summary_ar: 'تصميم لوحة القواطع DC/AC، اختيار سعة الفيوزات، تركيب موانع الصواعق SPD، وبناء منظومة تأريض قياسية بمقاومة أقل من 5 أوم.',
        summary_en: 'Designing DC/AC distribution panels, sizing thermal fuses, surge protection devices, and grounding earthing pit engineering.',
        keyPoints_ar: [
          'الفرق بين قواطع التيار المستمر DC وقواطع التيار المتناوب AC ولماذا يحظر الخلط',
          'حساب سعة مانع الصواعق (Type II DC SPD 600V/1000V)',
          'دق وتد النحاس النقي وإضافة البنتونايت لخفض مقاومة التربة الجافة',
          'فحص استمرارية التأريض بمقياس Megger للتأكد من تصريف الشحنات',
        ],
        keyPoints_en: [
          'Why AC circuit breakers catastrophically fail when used on DC circuits',
          'Sizing Type II DC Surge Protective Devices (600V/1000V ratings)',
          'Driving pure copper earthing rods with bentonite soil conditioning',
          'Earth resistance testing with 3-pole digital earth ground testers',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: كوابل الطاقة الشمسية المخصصة للأشعة فوق البنفسجية',
          content: 'استخدم فقط كابلات سولار معتمدة (PV1-F 4mm²/6mm²) ذات غلاف مزدوج مقاوم للشمس والحرارة. الكابلات المنزلية العادية تتشقق وتحدث ماساً كهربائياً خلال أشهر.',
        },
        proTip_en: {
          title: 'Pro Tip: Strict Adherence to Double-Insulated PV1-F Cables',
          content: 'Never run conventional PVC building wire on rooftops. Only cross-linked double-jacketed PV1-F solar cables withstand 10+ years of UV radiation.',
        },
        resources: [
          {
            id: 'si-r7',
            title_ar: 'مخطط لوحة التوزيع والحماية المتكاملة DC/AC Box (PDF)',
            title_en: 'Complete DC/AC Combiner Box Electrical Schematic (PDF)',
            type: 'schematic',
            size: '2.5 MB',
            url: '#',
          },
        ],
      },
      7: {
        part_number: 7,
        videoUrl: '',
        duration_seconds: 3600,
        summary_ar: 'دمج منظومة الطاقة الشمسية مع سحب المولد الأهلي والكهرباء الوطنية عبر مفاتيح التحويل التلقائي ATS، ومنع ارتداد التيار.',
        summary_en: 'Interfacing solar arrays with diesel neighborhood generators and utility grid via ATS switchboards without backfeed.',
        keyPoints_ar: [
          'برمجة تأخير زمني (Timer) عند دخول الكهرباء الوطنية لمنع الصدمات',
          'عزل خطوط المولد الأهلي تماماً لضمان عدم تلف الإنفرتر عند تذبذب التردد',
          'استخدام محولات التيار (Current Transformers - CT) لتحديد صفر تصدير',
          'توزيع خطوط الأحمال الحرجة (Essential Loads) مثل الثلاجة والإنارة والمكيفات',
        ],
        keyPoints_en: [
          'Configuring delay timers to absorb grid surge spikes upon reconnection',
          'Diesel generator backfeed interlocking and frequency stabilization',
          'Zero-export current clamp sensors (CT) calibration for legal compliance',
          'Subpanel segregation of essential loads vs non-backed up heavy loads',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: ريليه الحماية من ارتفاع وانخفاض الفولتية',
          content: 'ركب دائماً جهاز حماية (Voltage Protector) قبل دخول خط الوطنية إلى الإنفرتر. الفولتية في العراق قد تقفز فجأة إلى 280V وتحرق كارت الدخول.',
        },
        proTip_en: {
          title: 'Pro Tip: Over/Under Voltage Guards on Utility Inputs',
          content: 'Grid power in Iraq can spike beyond 280V AC during transformer switching. Place an adjustable voltage monitor relay upstream of the inverter.',
        },
        resources: [
          {
            id: 'si-r8',
            title_ar: 'مخطط ربط ATS ثلاثي الخطوط (شمس + وطنية + مولد) (PDF)',
            title_en: 'Three-Way ATS Wiring Diagram: Solar, Grid & Generator (PDF)',
            type: 'schematic',
            size: '3.7 MB',
            url: '#',
          },
        ],
      },
      8: {
        part_number: 8,
        videoUrl: '',
        duration_seconds: 3000,
        summary_ar: 'الفحص الدوري بالكاميرات الحرارية لكشف النقاط الساخنة، صيانة كوابل الربط، غسيل الألواح الدوري، وتأسيس عقود الصيانة المربحة للزبائن.',
        summary_en: 'Preventative maintenance with thermal infrared imaging, array cleaning protocols, and drafting lucrative enterprise maintenance contracts.',
        keyPoints_ar: [
          'تشخيص الدايودات المكسورة والوصلات المتآكلة بواسطة التصوير الحراري',
          'جدول غسيل الألواح بمياه منزوعة الأملاح في الصباح الباكر لتفادي الصدمة الحرارية',
          'فحص شد البراغي والتوصيلات الكهربائية سنوياً بكاميرا حرارية تحت الحمل الكامل',
          'نموذج تسعير عقود الصيانة السنوية للمزارع والمصانع والمنازل',
        ],
        keyPoints_en: [
          'Locating bypassed diodes and high-resistance joints with thermal cameras',
          'De-ionized water cleaning schedules early morning to prevent thermal shock',
          'Annual electrical connection torquing audits under peak solar loading',
          'Commercial pricing models for annual maintenance service contracts',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: لا تغسل الألواح تحت شمس الظهيرة الحارقة',
          content: 'رش الماء البارد على زجاج الألواح وهو في حرارة 65 مئوية يسبب صدمة حرارية (Thermal Shock) تكسر الزجاج فوراً أو تفكك طبقات السيليكون الداخلية.',
        },
        proTip_en: {
          title: 'Pro Tip: Never Wash Panels in Direct Midday Heat',
          content: 'Spraying cold water on 65°C PV glass causes catastrophic thermal shock fractures. Always wash panels before sunrise or after dusk.',
        },
        resources: [
          {
            id: 'si-r9',
            title_ar: 'نموذج عقد صيانة منظومات شمسية وجدول الفحص الدوري (Word & PDF)',
            title_en: 'Solar System Preventative Maintenance Agreement & SLA (PDF)',
            type: 'guide',
            size: '1.6 MB',
            url: '#',
          },
        ],
      },
    },
  },

  'hvac-refrigeration': {
    slug: 'hvac-refrigeration',
    parts: {
      1: {
        part_number: 1,
        videoUrl: 'https://www.youtube.com/watch?v=5VzYg8k9m0M',
        duration_seconds: 2700,
        summary_ar: 'دراسة الدورة التبريدية الانضغاطية، العلاقة بين الضغط ودرجة الغليان، والتعامل مع الغازات الحديثة الصديقة للبيئة.',
        summary_en: 'Thermodynamics of vapor-compression refrigeration, pressure-temperature charts, and handling modern refrigerants.',
        keyPoints_ar: [
          'المراحل الأربع: الانضغاط، التكثيف، التمدد، والتبخير',
          'قراءة عدادات المانيفولد الرقمية وحساب درجات التبريد الفائق (Subcooling) والتحميص (Superheat)',
          'خصائص غاز R410A وضغوطه المرتفعة مقارنة بالغاز القديم R22',
          'معايير السلامة المهنية عند التعامل مع أسطوانات الغاز المضغوطة',
        ],
        keyPoints_en: [
          'Four thermodynamic stages: Compression, Condensation, Expansion, Evaporation',
          'Digital manifold gauges: Subcooling and Superheat calculations',
          'R410A high pressure operating characteristics vs legacy R22',
          'Pressurized gas cylinder transport and safety valve protocols',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: غاز R410A خليط يجب شحنه سائلاً فقط',
          content: 'غاز R410A مركب من غازين مختلفي الكثافة. شحنه في الحالة الغازية يخل بتوازن الخليط ويفقد التكييف 30% من كفاءته. اقلب الأسطوانة دائماً أثناء الشحن.',
        },
        proTip_en: {
          title: 'Pro Tip: Liquid-State Charging for Blended Refrigerants',
          content: 'R410A is a near-azeotropic blend. Vapour charging alters component fractionation. Always invert the bottle and meter liquid with a throttle valve.',
        },
        resources: [
          {
            id: 'hr-r1',
            title_ar: 'جدول درجات الضغط والحرارة (PT Chart) لغازات التبريد (PDF)',
            title_en: 'Universal Pressure-Temperature (PT) Chart for R410A/R32/R22 (PDF)',
            type: 'guide',
            size: '1.8 MB',
            url: '#',
          },
        ],
      },
      2: {
        part_number: 2,
        videoUrl: '',
        duration_seconds: 3000,
        summary_ar: 'الكشف الميداني عن التسريبات الدقيقة في أنابيب النحاس ومفاصل الفلير باستخدام غاز النيتروجين الجاف ورغوة المايكرو.',
        summary_en: 'Field diagnostics for microscopic refrigerant leaks in copper line sets and flare fittings using dry nitrogen.',
        keyPoints_ar: [
          'عزل الوحدة الداخلية عن الخارجية لتحديد مصدر التسريب بدقة',
          'ضغط شبكة الأنابيب تدريجياً بغاز النيتروجين الجاف حتى 450 PSI',
          'فحص نقاط التوصيل (Flare Nuts) وأكواع المبخر برغوة المايكرو للكشف',
          'استخدام كواشف التسريب الإلكترونية الحساسة لرائحة الهالوجينات',
        ],
        keyPoints_en: [
          'Isolating indoor evaporator coil from outdoor condensing unit',
          'Step-wise nitrogen pressure holding test up to 450 PSI for 24 hours',
          'Testing copper flare joints and U-bends with micro-bubble solution',
          'Calibrating heated-diode electronic refrigerant sniffer probes',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: لا تستخدم الأكسجين أو الهواء المضغوط أبداً',
          content: 'ضغط شبكة التكييف بالأكسجين مع وجود بقايا زيت الضاغط يسبب انفجاراً كارثياً. استخدم حصراً النيتروجين الجاف الخامل مع منظم ضغط معتمد.',
        },
        proTip_en: {
          title: 'Pro Tip: Strictly Never Use Compressed Air or Oxygen',
          content: 'Mixing oxygen with polyolester (POE) compressor oil creates an explosive fuel-air bomb. Only use dry nitrogen with a high-pressure regulator.',
        },
        resources: [
          {
            id: 'hr-r2',
            title_ar: 'دليل ضغوط الفحص ومعايير شد فليرات النحاس بالعزم (PDF)',
            title_en: 'Copper Flare Torquing Specs & Pressure Testing Standards (PDF)',
            type: 'pdf',
            size: '2.0 MB',
            url: '#',
          },
        ],
      },
      3: {
        part_number: 3,
        videoUrl: '',
        duration_seconds: 3300,
        summary_ar: 'سحب الرطوبة والهواء بمضخة الفاكيوم ثنائية المراحل والوصول إلى 500 ميكرون، وشحن الغاز بدقة الجرام بالميزان الرقمي.',
        summary_en: 'Dehydration with two-stage rotary vane vacuum pumps down to 500 microns, and precision digital scale charging.',
        keyPoints_ar: [
          'أهمية سحب الرطوبة لمنع تشكل حمض الهيدروفلوريك الذي يدمر عزل ملفات الضاغط',
          'استخدام جهاز قياس الفاكيوم الرقمي (Micron Gauge) للتأكد من ثبات التفريغ',
          'قراءة ملصق بيانات المكيف لمعرفة كمية الغاز بالجرام المحددة من المصنع',
          'حساب كمية الغاز الإضافية عند تجاوز طول أنابيب النحاس 5 أمتار (15-20 جم/متر)',
        ],
        keyPoints_en: [
          'Moisture extraction preventing hydrofluoric acid formation in POE oil',
          'Digital micron gauge monitoring confirming decay hold below 500 microns',
          'Reading factory nameplate charge specifications in grams',
          'Compensating line set extension beyond 5 meters (15-20 grams per meter)',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: تفريغ الفاكيوم لا يقاس بالدقائق بل بالميكرون',
          content: 'لا تعتمد على "تشغيل المضخة لمدة 15 دقيقة". بدون مقياس ميكرون رقمي، قد تترك رطوبة غير مرئية تتفاعل مع الزيت وتخنق أنبوب الكابيلري بالثلج.',
        },
        proTip_en: {
          title: 'Pro Tip: Evacuation is Measured in Microns, Not Minutes',
          content: 'Running a vacuum pump for 15 minutes proves nothing. Only a digital micron gauge verifies whether non-condensable moisture remains inside.',
        },
        resources: [
          {
            id: 'hr-r3',
            title_ar: 'جدول حساب وزن الغاز الإضافي حسب أقطار أنابيب النحاس (PDF)',
            title_en: 'Refrigerant Line Set Additional Weight Chart (PDF)',
            type: 'guide',
            size: '1.4 MB',
            url: '#',
          },
        ],
      },
      4: {
        part_number: 4,
        videoUrl: '',
        duration_seconds: 3900,
        summary_ar: 'تشخيص أعطال كروت الإنفرتر الإلكترونية (PCB)، فحص موديلات IPM بالدايود، وتتبع إشارات حساسات الحرارة ومحركات المراوح BLDC.',
        summary_en: 'Diagnostics of inverter split PCB electronics, testing IPM power transistors, and troubleshooting BLDC DC fan motors.',
        keyPoints_ar: [
          'فك رموز الخطأ الشائعة (E1, E6, F3, P4) في مكيفات جنرال وميديا وتوسوت',
          'فحص موديول القدرة الذكي (IPM) باستخدام وضع الدايود على الملتيميتر',
          'قياس ممانعة حساسات الحرارة (Thermistors) عند 25 درجة مئوية',
          'فحص محرك مروحة المكثف المستمر (BLDC DC Fan) وخط إشارة التغذية الراجعة',
        ],
        keyPoints_en: [
          'Decoding manufacturer error codes (E1, E6, F3, P4) on leading brands',
          'Testing Intelligent Power Modules (IPM) using multimeter diode check mode',
          'Measuring thermistor resistance values at calibrated 25°C baseline',
          'Testing brushless DC condenser fan motors and hall-effect feedback circuits',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: تفريغ مكثفات التيار المستمر الكبيرة قبل الفحص',
          content: 'مكثفات كارت الإنفرتر تحتفظ بجهد 380V DC خطير حتى بعد فصل الكهرباء. فرغ الشحنة بمقاومة حرارية 100 أوم قبل لمس البورد لحماية نفسك ومعداتك.',
        },
        proTip_en: {
          title: 'Pro Tip: Discharge DC Bus Capacitors Before Touching PCBs',
          content: 'Inverter filter capacitors retain lethal 380V DC charges after unplugging. Safely discharge using a 100-ohm power resistor before probing.',
        },
        resources: [
          {
            id: 'hr-r4',
            title_ar: 'دليل أكواد أعطال مكيفات السبلت الإنفرتر الشائعة في العراق (PDF)',
            title_en: 'Inverter AC Troubleshooting Codes & IPM Diagnostic Manual (PDF)',
            type: 'guide',
            size: '3.2 MB',
            url: '#',
          },
        ],
      },
      5: {
        part_number: 5,
        videoUrl: '',
        duration_seconds: 3600,
        summary_ar: 'خطوات استبدال ضاغط السبلت المحترق، تقنية اللحام بأكسي-أسيتيلين تحت تدفق النيتروجين لمنع التفحم، وغسيل الدورة بمذيب R141b.',
        summary_en: 'Burnout compressor overhaul, nitrogen-purge oxy-acetylene silver brazing, and system decontamination flush with R141b.',
        keyPoints_ar: [
          'تشخيص احتراق ملفات الضاغط واختبار العزل بالميجر ومقارنة المقاومات',
          'غسيل المبخر وشبكة المواسير بسائل التنظيف R141b لإزالة رواسب الكربون الحمضية',
          'اللحام بأسياخ الفضة تحت سريان خفيف للنيتروجين (Nitrogen Sweep)',
          'تركيب فلتر مجفف (Filter Drier) لحماية الضاغط الجديد من الشوائب',
        ],
        keyPoints_en: [
          'Motor winding burnout diagnosis with megohmmeter insulation resistance',
          'Chemical line set flushing with R141b solvent to remove acidic sludge',
          'Oxy-acetylene silver alloy brazing under continuous low-pressure nitrogen purge',
          'Installing liquid-line bi-directional filter driers for burnout recovery',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: اللحام بدون نيتروجين يدمر الضاغط الجديد في شهر',
          content: 'تسخين النحاس في وجود الهواء يولد قشور أكسيد نحاسي سوداء داخل الأنبوب. تنجرف هذه القشور لتسد مصفاة الزيت وتتلف الضاغط الجديد. مرر دائماً نفخة نيتروجين أثناء اللحام.',
        },
        proTip_en: {
          title: 'Pro Tip: Brazing Without Nitrogen Destroys Compressors',
          content: 'Heating copper in open air creates black copper oxide flake inside tubes. These flakes scour bearings and plug expansion valves. Always sweep dry nitrogen.',
        },
        resources: [
          {
            id: 'hr-r5',
            title_ar: 'دليل إجراءات استبدال الضاغط وبروتوكول تنظيف الاحتراق (PDF)',
            title_en: 'Compressor Burnout Recovery & System Clean-up Protocol (PDF)',
            type: 'pdf',
            size: '2.6 MB',
            url: '#',
          },
        ],
      },
    },
  },

  'cctv-smart-security': {
    slug: 'cctv-smart-security',
    parts: {
      1: {
        part_number: 1,
        videoUrl: 'https://www.youtube.com/watch?v=5VzYg8k9m0M',
        duration_seconds: 2400,
        summary_ar: 'التعرف على معايير شبكات المراقبة، كبس كابلات Cat6 حسب ترتيب T568B، حساب ميزانية طاقة سويتشات PoE، وتوزيع زوايا الكاميرات.',
        summary_en: 'Surveillance networking fundamentals, T568B Cat6 termination, PoE switch power budget calculations, and camera focal placement.',
        keyPoints_ar: [
          'ترتيب الألوان القياسي T568B واستخدام التيستر لفحص سلامة الأزواج الثمانية',
          'حساب استهلاك الواط لكاميرات الرؤية الليلية بالأشعة تحت الحمراء وPTZ',
          'اختيار العدسات: 2.8 ملم للزوايا الواسعة مقابل 4 ملم و6 ملم للممرات الطويلة',
          'عزل كابلات الشبكة عن كابلات الكهرباء ذات الجهد العالي لمنع التشويش الكهرومغناطيسي',
        ],
        keyPoints_en: [
          'T568B color code pinout standard and multi-conductor wiremap testing',
          'Wattage budgeting for IR night vision illuminators and motorized PTZ heads',
          'Lens selection optics: 2.8mm wide angle vs 4mm/6mm telephoto corridors',
          'EMI separation guidelines keeping Cat6 away from 220V power conduits',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: استخدم كابلات النحاس الصافي (Pure Copper)',
          content: 'احذر من كابلات CCA (ألمنيوم مطلي بالنحاس) الرخيصة. تفقد الفولتية على مسافة 40 متراً وتتسبب في إعادة تشغيل الكاميرا عند اشتغال إضاءة الـ IR ليلاً.',
        },
        proTip_en: {
          title: 'Pro Tip: Strictly Use Pure Bare Copper Cat6, Never CCA',
          content: 'Copper-clad aluminum (CCA) cables suffer severe voltage drops beyond 40 meters, causing cameras to brownout and reboot when night vision LEDs kick in.',
        },
        resources: [
          {
            id: 'cctv-r1',
            title_ar: 'دليل حساب مسافات واستهلاك كاميرات PoE وعدسات المراقبة (PDF)',
            title_en: 'PoE Distance Budget & Camera Lens Selection Guide (PDF)',
            type: 'guide',
            size: '1.5 MB',
            url: '#',
          },
        ],
      },
      2: {
        part_number: 2,
        videoUrl: '',
        duration_seconds: 2700,
        summary_ar: 'تهيئة مسجل الفيديو الشبكي (NVR)، تخصيص نطاقات الـ IP الثابتة عبر أدوات البحث الشبكي، وضبط ضغط الفيديو H.265+ لحفظ مساحة الهارد.',
        summary_en: 'NVR initialization, static IP allocation via SADP/ConfigTool, and configuring advanced H.265+ smart video compression codecs.',
        keyPoints_ar: [
          'تفعيل الكاميرات وإعطاء عناوين IP ثابتة على شبكة الـ Subnet',
          'تهيئة الهارد ديسك المخصص للمراقبة (WD Purple / Seagate SkyHawk)',
          'تفعيل كودك H.265+ الذكي لتوفير أكثر من 60% من مساحة التخزين',
          'جدولة التسجيل المستمر والتسجيل عند استشعار الحركة لإطالة مدة الأرشفة',
        ],
        keyPoints_en: [
          'Batch camera activation and static subnet IP reservation via SADP tool',
          'Surveillance-grade HDD formatting and partition sector verification',
          'Enabling H.265+ intelligent compression to save over 60% storage bandwidth',
          'Continuous vs motion-triggered recording schedules for extended archives',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: احسب مساحة التخزين قبل شراء الهارد ديسك',
          content: 'لكل 4 كاميرات بدقة 4K بترميز H.265+، تحتاج 2 تيرابايت لتخزين 30 يوماً بالحركة. استخدم حاسبة السعة لتحديد التكلفة الدقيقة للزبون وتفادي الخلافات.',
        },
        proTip_en: {
          title: 'Pro Tip: Always Calculate Bitrate Capacity Before Ordering HDDs',
          content: 'Four 4K cameras on H.265+ require roughly 2TB for 30 days of motion recording. Use vendor bandwidth calculators to quote accurately.',
        },
        resources: [
          {
            id: 'cctv-r2',
            title_ar: 'أداة حساب مساحة التخزين وعدد الأيام لكاميرات المراقبة (XLSX)',
            title_en: 'Surveillance Storage & Bandwidth Sizing Calculator (XLSX)',
            type: 'guide',
            size: '1.1 MB',
            url: '#',
          },
        ],
      },
      3: {
        part_number: 3,
        videoUrl: '',
        duration_seconds: 3000,
        summary_ar: 'برمجة خوارزميات الذكاء الاصطناعي AcuSense و WizSense لكشف الأشخاص والسيارات، رسم خطوط التسلل الوهمية، والتعرف على لوحات السيارات.',
        summary_en: 'Programming AcuSense and WizSense AI analytics for vehicle/pedestrian filtering, virtual tripwires, and automatic license plate recognition.',
        keyPoints_ar: [
          'عزل التنبيهات الكاذبة الناتجة عن حركة الأشجار والحيوانات وظلال الغيوم',
          'رسم خط العبور الافتراضي (Line Crossing Detection) ومناطق الدخول المحظورة',
          'ضبط زوايا الكاميرا وسرعة الغالق لالتقاط لوحات السيارات (LPR/ANPR)',
          'ربط الإشعارات الفورية مع صافرات الإنذار والضوء الوامض (Strobe Light)',
        ],
        keyPoints_en: [
          'False-alarm filtering suppressing swaying foliage, small animals, and rain',
          'Virtual perimeter tripwire boundary setup and forbidden zone polygons',
          'Camera shutter speed calibration for night-time vehicle license plate capture',
          'Interfacing event triggers with active deterrence strobe lights and sirens',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: سرعة الغالق في كاميرات اللوحات الليلية',
          content: 'لالتقاط لوحة سيارة تسير بسرعة 40 كم/س في الظلام، يجب ضبط سرعة الشتر يدوياً على 1/1000 ثانية على الأقل، وإلا ستظهر اللوحة كبقعة ضوء مطموسة.',
        },
        proTip_en: {
          title: 'Pro Tip: Manual Shutter Speeds for Night License Plates',
          content: 'To read plates of cars moving at 40 km/h at night, manually lock the shutter to at least 1/1000s. Default auto exposure causes headlight glare blur.',
        },
        resources: [
          {
            id: 'cctv-r3',
            title_ar: 'دليل ضبط قواعد الذكاء الاصطناعي وتحليل الفيديو VCA (PDF)',
            title_en: 'Smart AI VCA Video Analytics Setup & Rule Configuration (PDF)',
            type: 'guide',
            size: '2.4 MB',
            url: '#',
          },
        ],
      },
      4: {
        part_number: 4,
        videoUrl: '',
        duration_seconds: 2100,
        summary_ar: 'تفعيل خدمة السحابة P2P وتطبيقات الهواتف الذكية (Hik-Connect / DMSS)، إدارة صلاحيات المستخدمين، وحماية المنظومة من الاختراق الشبكي.',
        summary_en: 'P2P cloud remote viewing setup (Hik-Connect / DMSS), multi-tier user permission management, and cybersecurity hardening against brute-force attacks.',
        keyPoints_ar: [
          'تفعيل الباركود QR Code للربط السحابي بدون الحاجة لعنوان IP حقيقي ثابت (Public IP)',
          'إنشاء حسابات فرعية للزبون لمنعه من العبث بإعدادات التسجيل والشبكة',
          'تغيير المنافذ الافتراضية وتعطيل خدمات UPnP لمنع الثغرات الأمنية',
          'تسليم المنظومة وتوقيع محضر الاستلام مع المالك وضمان التركيب',
        ],
        keyPoints_en: [
          'QR code P2P cloud pairing eliminating need for expensive public static IPs',
          'Creating restricted operator accounts protecting system settings from tampering',
          'Changing default management ports and disabling UPnP against cyber threats',
          'Commissioning handover protocol, warranty sign-off, and customer training',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: لا تترك كلمة المرور الافتراضية أبداً',
          content: 'ترك كلمة المرور admin12345 يعرض شبكة الزبون للاختراق في دقائق عبر محركات البحث عن الأجهزة المتصلة مثل Shodan. اختر دائماً كلمة مرور معقدة وسلمها لصاحب المكان.',
        },
        proTip_en: {
          title: 'Pro Tip: Never Leave Default Passwords on Connected Devices',
          content: 'Leaving default credentials exposes client cameras to automated bots within minutes on Shodan. Enforce complex 12+ character passphrases on handover.',
        },
        resources: [
          {
            id: 'cctv-r4',
            title_ar: 'استمارة تسليم منظومة كاميرات مراقبة وتعهد الأمان والضمان (Word & PDF)',
            title_en: 'CCTV Installation Commissioning Handover & Warranty SLA (PDF)',
            type: 'pdf',
            size: '1.2 MB',
            url: '#',
          },
        ],
      },
    },
  },

  'barber-styling': {
    slug: 'barber-styling',
    parts: {
      1: {
        part_number: 1,
        videoUrl: 'https://www.youtube.com/watch?v=5VzYg8k9m0M',
        duration_seconds: 2700,
        summary_ar: 'تشريح عظام الجمجمة، نظرية التدريج وتوزيع الظلال، ومعايرة شفرات الماكينات الاحترافية على الصفر الدقيق (Zero Gap).',
        summary_en: 'Cranial bone anatomy, fade transition geometry, and zero-gapping professional magnetic clipper blades.',
        keyPoints_ar: [
          'تحديد بروز العظم القذالي (Occipital Bone) وعظم الصدغ لبناء خط التدريج المتناسق',
          'معايرة شفرات الماكينة بالفك والمحاذاة للحصول على خط قطع فائق الدقة بدون جرح الجلد',
          'التعرف على درجات الأمشاط المغناطيسية (#0.5، #1، #1.5) ودورها في مزج الظلال',
          'طريقة مسك الماكينة واستخدام زوايا الشفرة للتحكم في المساحات الضيقة',
        ],
        keyPoints_en: [
          'Locating occipital and temporal bone landmarks to anchor fade lines',
          'Zero-gapping clipper blades safely for micro-close cutting without pinching',
          'Magnetic guard increments (#0.5, #1, #1.5) and their role in shadow blending',
          'Ergonomic clipper grip techniques using outer corners for narrow transitions',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: اختبر شفرة الزيرو غاب على ساعد يدك أولاً',
          content: 'بعد ضبط الشفرة، اضغطها بزاوية قائمة على جلد ساعدك. إذا شعرت بأي وخز أو خدش، فهذا يعني أن الشفرة المتحركة بارزة وستجرح زبائنك. أعد ضبطها فوراً.',
        },
        proTip_en: {
          title: 'Pro Tip: Test Zero-Gapped Blades on Your Forearm',
          content: 'Press adjusted blades perpendicularly against your forearm. Any stinging indicates the moving blade overhangs the stationary blade. Readjust immediately.',
        },
        resources: [
          {
            id: 'bs-r1',
            title_ar: 'دليل تشريح الجمجمة وتوزيع درجات أمشاط الحلاقة (PDF)',
            title_en: 'Cranial Topography & Clipper Guard Progression Chart (PDF)',
            type: 'guide',
            size: '2.2 MB',
            url: '#',
          },
        ],
      },
      2: {
        part_number: 2,
        videoUrl: '',
        duration_seconds: 3600,
        summary_ar: 'إتقان تدريج الجلد (Skin Fade) بأنواعه: المنخفض (Low)، المتوسط (Mid)، والعالي (High Fade)، وتقنية حركة الـ Flick-out السريعة.',
        summary_en: 'Mastering Skin Fade variations: Low, Mid, and High Fades, leveraging the wrist flick-out blending motion.',
        keyPoints_ar: [
          'رسم خط البداية (Baseline) بالماكينة الدقيقة التريمر وتفريغ أسفله بماكينة الفويل',
          'فتح ذراع الماكينة تدريجياً (Open, Half, Closed Lever) لإزالة الخطوط الفاصلة',
          'تنعيم وتدرج الظلال من الأبيض (الجلد) إلى الرمادي إلى الأسود الكثيف',
          'التعامل مع انحناءات الرأس غير المنتظمة واستخدام زوايا الشفرة فقط (Corner Work)',
        ],
        keyPoints_en: [
          'Carving pristine baselines with detail trimmers and clearing with foil shavers',
          'Progressive lever modulation (Open, Half, Closed) to erase harsh lines',
          'Shading value spectrum: Seamless transition from skin to shadow to bulk',
          'Navigating head indentations using single-corner blade techniques',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: انظر إلى القصة من خلال المرآة',
          content: 'النظر المباشر للرأس قد يخدع عينك بسبب إضاءة السقف. المرآة تعكس الصورة المسطحة للقصة وتكشف فوراً البقع الداكنة أو الخطوط غير الممسوحة.',
        },
        proTip_en: {
          title: 'Pro Tip: Step Back and Assess Through the Mirror',
          content: 'Direct ceiling lighting can mask uneven density. Looking through the mirror flattens the silhouette, instantly highlighting unblended weight lines.',
        },
        resources: [
          {
            id: 'bs-r2',
            title_ar: 'مخطط خطوات تدريج السكين فيد خطوة بخطوة (PDF)',
            title_en: 'Step-by-Step Visual Protocol: The Master Skin Fade (PDF)',
            type: 'guide',
            size: '2.8 MB',
            url: '#',
          },
        ],
      },
      3: {
        part_number: 3,
        videoUrl: '',
        duration_seconds: 3000,
        summary_ar: 'القص الكلاسيكي بالمقص، تقنية المقص فوق المشط (Scissor Over Comb)، نحت الطبقات وتوزيع الكثافة بمقص التخفيف (Thinning Shears).',
        summary_en: 'Scissor work precision, scissor-over-comb blending, sectioning hair crowns, and weight reduction with thinning shears.',
        keyPoints_ar: [
          'تقسيم الشعر الرطب إلى قطاعات هندسية (Sectioning) متناسقة مع اتجاه النمو',
          'ضبط زوايا سحب الخصلات للأعلى (Elevation 90° vs 45°) للتحكم في طول الشعر',
          'دمج الجوانب المدرجة مع الشعر الطويل في الأعلى بواسطة المقص فوق المشط',
          'إعطاء مظهر عصري طبيعي (Texture) بواسطة القص المائل برؤوس المقص (Point Cutting)',
        ],
        keyPoints_en: [
          'Horseshoe parting and geometric sectioning respecting natural growth spirals',
          'Fingers elevation angles (90° vertical vs 45° horizontal graduation)',
          'Bridging faded temples with top length using scissor-over-comb mastery',
          'Point cutting texturizing creating shattered separation and natural flow',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: لا تقص بالمقص بعد المفصل الثاني لإصبعك',
          content: 'قص الشعر بعد عقلة الإصبع الثانية يعرض يدك للجرح ويقلل تحكمك في شد الخصلة. حافظ دائماً على القص بين العقلة الأولى والثانية فقط.',
        },
        proTip_en: {
          title: 'Pro Tip: Never Cut Past the Second Knuckle',
          content: 'Cutting beyond your second finger knuckle significantly increases risk of severe cuts and loses hair tension. Keep all scissor travel between first two joints.',
        },
        resources: [
          {
            id: 'bs-r3',
            title_ar: 'دليل تقسيم الشعر وزوايا القص الاحترافي بالمقص (PDF)',
            title_en: 'Hair Sectioning Geometries & Scissor Elevation Blueprint (PDF)',
            type: 'guide',
            size: '1.9 MB',
            url: '#',
          },
        ],
      },
      4: {
        part_number: 4,
        videoUrl: '',
        duration_seconds: 2700,
        summary_ar: 'نحت وتحديد اللحية بالشفرة الكلاسيكية (Straight Razor)، تطبيق المناشف البخارية الحارة، والعناية بالبشرة ومساج الوجه بالزيوت.',
        summary_en: 'Traditional straight razor beard sculpting, hot towel thermal conditioning, and facial skin rejuvenation oils.',
        keyPoints_ar: [
          'شد الجلد باليد العكسية وتوجيه الموس بزاوية 30 درجة لتفادي الجروح',
          'رسم خطوط الخدين المتماثلة بدقة وتحديد خط الرقبة الطبيعي فوق تفاحة آدم',
          'استخدام المناشف الساخنة المشبعة بالزيوت العطرية لفتح المسام وتليين الشعيرات القاسية',
          'تطبيق كولونيا ما بعد الحلاقة ومستحضرات تهدئة البشرة ومنع تهيج الحبيبات',
        ],
        keyPoints_en: [
          'Stretching skin taut with non-dominant hand; holding blade at strict 30° angle',
          'Cheek line symmetry mapping and anchoring the neck line 2 fingers above Adam’s apple',
          'Eucalyptus hot towel steaming relaxing coarse follicles and opening pores',
          'Post-shave astringents and soothing balms preventing razor burn pseudofolliculitis',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: خط الرقبة يحدد جمال قصة اللحية بأكملها',
          content: 'أكبر خطأ هو رفع خط اللحية السفلي إلى الفك. اطلب من الزبون النظر للأمام مستقيماً، وضع إصبعين فوق تفاحة آدم، وارسم قوساً نظيفاً يصل إلى زوايا الفك.',
        },
        proTip_en: {
          title: 'Pro Tip: The Neckline Defines the Beard Silhouette',
          content: 'Never carve the beard line directly on the jawbone. Measure two fingers above the Adam’s apple and shape a natural curve connecting smoothly to ears.',
        },
        resources: [
          {
            id: 'bs-r4',
            title_ar: 'مخطط أشكال اللحى المتناسقة مع ملامح الوجه المختلفة (PDF)',
            title_en: 'Beard Sculpting Architectures Matching Face Shapes (PDF)',
            type: 'guide',
            size: '2.1 MB',
            url: '#',
          },
        ],
      },
      5: {
        part_number: 5,
        videoUrl: '',
        duration_seconds: 2100,
        summary_ar: 'معايير النظافة والتعقيم العالمية في الصالون، استخدام محاليل بارباسايد الطبية، وأجهزة الأشعة فوق البنفسجية UV لمنع انتقال العدوى.',
        summary_en: 'Clinical sanitation standards, hospital-grade Barbicide immersion, and UV sterilization cabinets preventing fungal infections.',
        keyPoints_ar: [
          'بروتوكول تعقيم أمشاط ومقصات الحلاقة بمحلول بارباسايد لمدة 10 دقائق بين كل زبون',
          'استخدام شفرات الموس ذات الاستخدام الواحد (Single-use) والتخلص منها في صندوق الأدوات الحادة (Sharps Container)',
          'استخدام أطواق العنق الورقية الطبية لمنع ملامسة رداء الحلاقة لجلد الزبائن',
          'تنظيف فلاتر هواء الماكينات وتزييتها بزيت التشحيم الأبيض بعد كل يوم عمل',
        ],
        keyPoints_en: [
          '10-minute full submersion protocol in hospital-grade Barbicide between clients',
          'Single-use disposable razor blades disposed in puncture-proof sharps biohazard bins',
          'Medical hygienic neck strips preventing cape cross-contamination with skin',
          'Disassembling clipper housings, cleaning air vents, and lubricating blade teeth',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: التعقيم أمام الزبون هو أفضل تسويق لصالونك',
          content: 'عندما تخرج المشط والمقص من جهاز التعقيم أو سائل بارباسايد الأزرق أمام عيني الزبون، فإنك تبني ثقة فورية تجعله يدفع ضعف السعر وهو مطمئن تماماً.',
        },
        proTip_en: {
          title: 'Pro Tip: Visible Sanitation is Your Highest ROI Marketing',
          content: 'Pulling sanitized shears directly from blue Barbicide jars in front of the customer builds subconscious medical trust, justifying premium service rates.',
        },
        resources: [
          {
            id: 'bs-r5',
            title_ar: 'دليل معايير السلامة المهنية والتعقيم في صالونات الحلاقة (PDF)',
            title_en: 'Barbershop Occupational Health & Disinfection Standards (PDF)',
            type: 'pdf',
            size: '1.4 MB',
            url: '#',
          },
        ],
      },
      6: {
        part_number: 6,
        videoUrl: '',
        duration_seconds: 2700,
        summary_ar: 'دراسة جدوى تأسيس صالون حلاقة عصري، حساب تكلفة المعدات والديكور، أنظمة مشاركة الأرباح مع الحلاقين، والتسويق الرقمي لجذب الزبائن.',
        summary_en: 'Financial feasibility of opening a modern barbershop, equipment capex, barber commission split structures, and Instagram transformation marketing.',
        keyPoints_ar: [
          'حساب التكاليف التشغيلية (إيجار، كهرباء، مواد استهلاكية، رواتب)',
          'مقارنة أنظمة الأجور: الراتب الثابت مقابل تأجير الكرسي (Chair Rental) أو نسبة 50/50',
          'تصميم إضاءة الصالون (CRI > 90) لالتقاط صور وفيديوهات تحول عالية الجودة على تيك توك',
          'بناء قاعدة زبائن أوفياء عبر نظام الحجز الإلكتروني وبرامج النقاط',
        ],
        keyPoints_en: [
          'Calculating fixed monthly opex (rent, commercial power, disposables)',
          'Remuneration structures: Flat salary vs chair rental vs 50/50 commission split',
          'Lighting architecture (CRI > 90 ring lights) tailored for viral transformation reels',
          'Retaining high-value clientele through digital booking apps and loyalty perks',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: لا تبيع قصة شعر، بل بع تجربة متكاملة',
          content: 'الزبون يدفع 3 آلاف دينار مقابل قصة عادية، لكنه يدفع 15 ألف دينار بكل سرور مقابل منشفة ساخنة، قهوة ضيافة، كرسي مريح، واستقبال محترم.',
        },
        proTip_en: {
          title: 'Pro Tip: You Are Selling an Experience, Not a Haircut',
          content: 'Clients pay standard rates for basic cuts, but happily pay triple when greeted with specialty coffee, hot aromatherapy towels, and immaculate service hospitality.',
        },
        resources: [
          {
            id: 'bs-r6',
            title_ar: 'دراسة جدوى مالية متكاملة لفتح صالون حلاقة رجالي في العراق (XLSX)',
            title_en: 'Comprehensive Modern Barbershop Financial Model & Business Plan (XLSX)',
            type: 'guide',
            size: '2.5 MB',
            url: '#',
          },
        ],
      },
    },
  },

  'specialty-coffee-barista': {
    slug: 'specialty-coffee-barista',
    parts: {
      1: {
        part_number: 1,
        videoUrl: 'https://www.youtube.com/watch?v=5VzYg8k9m0M',
        duration_seconds: 2400,
        summary_ar: 'كيمياء حبوب البن المختص، الفوارق البيولوجية بين سلالات الأرابيكا والروبوستا، طرق المعالجة (المجففة والمغسولة والعسلية)، وتأثير الارتفاع على النكهة.',
        summary_en: 'Specialty coffee botanical origins, Arabica vs Robusta taxonomy, processing methods (Natural, Washed, Honey), and terroir elevation dynamics.',
        keyPoints_ar: [
          'معايير جمعية القهوة المختصة (SCA) وتقييم الجودة فوق 80 نقطة',
          'تأثير الارتفاع ومناخ المزارع على كثافة الحبة وتعقيد الإيحاءات الفاكهية والحمضية',
          'الفرق بين المعالجة المغسولة (نظافة ونقاء النكهة) والمعالجة المجففة (حلاوة وقوام ثقيل)',
          'طرق حفظ حبوب البن بعد التحميص وتفادي الأكسدة عبر صمامات تفريغ الغازات',
        ],
        keyPoints_en: [
          'Specialty Coffee Association (SCA) cupping protocol and 80+ point scoring',
          'Farm elevation effects on bean density, complex fruit acidity, and sugar storage',
          'Processing profiles: Washed clarity vs natural sweetness and heavy body',
          'Degassing dynamics and one-way valve packaging preventing aromatic oxidation',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: لا تستخدم البن فور خروجه من المحمصة',
          content: 'تحتاج حبوب القهوة فترة راحة (Degassing) من 7 إلى 14 يوماً بعد التحميص للتخلص من غاز ثاني أكسيد الكربون الزائد الذي يفسد استخلاص الإسبريسو.',
        },
        proTip_en: {
          title: 'Pro Tip: Rest Roasted Beans 7-14 Days Before Pulling Shots',
          content: 'Freshly roasted beans retain excessive trapped carbon dioxide that creates erratic channeling and sour, foamy crema. Always allow sufficient degassing.',
        },
        resources: [
          {
            id: 'sc-r1',
            title_ar: 'عجلة النكهات الرسمية لتذوق القهوة المختصة SCA (PDF)',
            title_en: 'Official SCA Coffee Taster’s Flavor Wheel & Evaluation Guide (PDF)',
            type: 'guide',
            size: '3.6 MB',
            url: '#',
          },
        ],
      },
      2: {
        part_number: 2,
        videoUrl: '',
        duration_seconds: 2700,
        summary_ar: 'معايرة طاحونة الإسبريسو المسطحة والمخروطية، توزيع البن بأداة WDT، الكبس المتوازن، وتحقيق نسبة الاستخلاص الذهبية (Brew Ratio 1:2).',
        summary_en: 'Dialing-in flat and conical burr grinders, WDT puck distribution, precision tamping, and mastering the golden 1:2 espresso extraction ratio.',
        keyPoints_ar: [
          'ضبط درجات نعومة الطحن ميكرونياً لتحقيق تدفق 36 جرام إسبريسو في 26-30 ثانية',
          'تفتيت التكتلات بأداة توزيع الإبر (WDT) لمنع التجاويف وممرات المياه السريعة (Channeling)',
          'الكبس بمكبس عيار 58.5 ملم مع التأكد من استواء السطح تماماً تحت ضغط 15 كجم',
          'تشخيص الاستخلاص الناقص (حامض ولاذع) مقابل الاستخلاص الزائد (مر وجاف)',
        ],
        keyPoints_en: [
          'Micrometric burr adjustment targeting 36g liquid yield within 26-30 seconds',
          'Weiss Distribution Technique (WDT) puck prep preventing catastrophic channeling',
          'Level tamping with 58.5mm precision bases applying consistent perpendicular pressure',
          'Diagnosing under-extraction (sour, saline) vs over-extraction (bitter, astringent)',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: اعتمد على الميزان وليس على وقت الماكينة',
          content: 'رطوبة الجو في المقهى تتغير على مدار اليوم وتغير سرعة التدفق. اضبط طاحونتك بوزن البن المطحون ووزن الإسبريسو المستخلص على الميزان الذكي مع كل تغيير طقس.',
        },
        proTip_en: {
          title: 'Pro Tip: Always Dose and Yield on Scales, Not Volume',
          content: 'Crema density varies wildly with roast age. Volumetric buttons mislead; only brew scales measuring exact grams deliver repeatable cup consistency.',
        },
        resources: [
          {
            id: 'sc-r2',
            title_ar: 'جدول معايرة وصفات استخلاص الإسبريسو وتصحيح العيوب (PDF)',
            title_en: 'Espresso Extraction Calibration Log & Recipe Troubleshooting (PDF)',
            type: 'guide',
            size: '1.7 MB',
            url: '#',
          },
        ],
      },
      3: {
        part_number: 3,
        videoUrl: '',
        duration_seconds: 3000,
        summary_ar: 'ديناميكا تبخير الحليب، إدخال الهواء وتحويل بروتينات الحليب إلى رغوة مايكروفوم حريرية، وتقنيات الرسم الاحترافي باللاتيه آرت.',
        summary_en: 'Milk steaming fluid dynamics, microfoam texturing chemistry, temperature control, and free-pour latte art patterns.',
        keyPoints_ar: [
          'تعديل زاوية عصا التبخير لإنشاء دوامة (Vortex) سريعة تمزج الفقاعات بالكامل',
          'وقف إدخال الهواء عند وصول حرارة الحليب إلى 37 مئوية وإكمال التدوير حتى 60-65 مئوية',
          'تحضير سطح الفنجان بصب الأساس المتجانس بدون كسر الكريما الذهبية',
          'تقنيات صب الأشكال الكلاسيكية: القلب (Heart)، التوليب (Tulip)، والروزيتا (Rosetta)',
        ],
        keyPoints_en: [
          'Pitcher steam wand positioning to create an aggressive swirling vortex',
          'Stopping air stretching at body temperature (37°C) and texturizing up to 60-65°C',
          'Building the crema canvas with low-flow milk integration without washing out',
          'Free-pour mechanics for core foundation patterns: Heart, Tulip, and Rosetta',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: لا تسخن الحليب فوق 70 درجة مئوية أبداً',
          content: 'تسخين الحليب فوق 70 مئوية يكسر سلاسل البروتين واللاكتوز، ويفقد الحليب حلاوته الطبيعية وتتحول رائحته إلى حليب مغلي منفر للزبون.',
        },
        proTip_en: {
          title: 'Pro Tip: Never Steam Milk Beyond 70°C (158°F)',
          content: 'Exceeding 70°C denatures whey proteins and scalds natural sugars, destroying silky microfoam stability and leaving a flat, sulfurous cooked flavor.',
        },
        resources: [
          {
            id: 'sc-r3',
            title_ar: 'دليل ميكانيكا حركة اليد وسرعة الصب لفنون اللاتيه آرت (PDF)',
            title_en: 'Latte Art Hand Motion, Elevation & Pour Flow Rate Blueprint (PDF)',
            type: 'guide',
            size: '2.9 MB',
            url: '#',
          },
        ],
      },
      4: {
        part_number: 4,
        videoUrl: '',
        duration_seconds: 2100,
        summary_ar: 'تنظيم مسار العمل (Workflow) خلف بار القهوة، سرعة تلبية الطلبات في ساعات الذروة، صيانة وتنظيف ماكينة الإسبريسو بالباك فلاش، وإدارة هدر البن.',
        summary_en: 'Espresso bar workflow ergonomics, rush hour speed, daily chemical backflushing maintenance, and commercial waste reduction logs.',
        keyPoints_ar: [
          'ترتيب محطة العمل لتقليل الحركات غير الضرورية بين الطاحونة وماكينة الإسبريسو ومحطة الحليب',
          'تنظيف رؤوس المجموعات (Group Heads) بمسحوق كافيزا لإزالة زيوت القهوة المحروقة',
          'فحص واستبدال جلدات رأس المجموعة (Gaskets) وشاشات التوزيع (Shower Screens)',
          'حساب تكلفة الكوب ونسبة الهدر اليومي في البن والحليب لتعظيم أرباح الكافيه',
        ],
        keyPoints_en: [
          'Triangular station layout minimizing redundant footsteps between grinder, machine, and milk',
          'Daily chemical backflushing with Cafiza detergent stripping rancid coffee oils',
          'Preventative maintenance swapping group gaskets and precision shower screens',
          'Cost per cup calculations and tracking daily waste variance logs',
        ],
        proTip_ar: {
          title: 'نصيحة المهنة: امسح عصا التبخير فوراً ونفخ البخار (Purge)',
          content: 'ترك الحليب ليجف على عصا التبخير يسمح للحليب بدخول مواسير الغلاية الداخلية مسبباً تلوثاً بكتيرياً وروائح كريهة في كل مشروب لاحق.',
        },
        proTip_en: {
          title: 'Pro Tip: Immediate Wipe & Purge of the Steam Wand',
          content: 'Never delay wiping the steam wand. Milk siphons backwards into the boiler as the wand cools, contaminating your steam supply with sour bacteria.',
        },
        resources: [
          {
            id: 'sc-r4',
            title_ar: 'جدول الفحص والصيانة الدورية لماكينات الإسبريسو التجارية (PDF)',
            title_en: 'Commercial Espresso Machine Daily & Monthly Preventative SLA (PDF)',
            type: 'guide',
            size: '1.3 MB',
            url: '#',
          },
        ],
      },
    },
  },
};
