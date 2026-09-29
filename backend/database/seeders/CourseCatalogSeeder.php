<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CoursePart;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CourseCatalogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $courses = [
            [
                'slug' => 'auto-detailing',
                'title_ar' => 'العناية المتقدمة بالسيارات وحماية النانو سيراميك',
                'title_en' => 'Advanced Auto Detailing & Nano-Ceramic Protection',
                'description_ar' => 'دورة مهنية تطبيقية شاملة لإتقان تلميع وتفصيل هياكل السيارات وتطبيق طبقات الحماية النانو سيراميك في السوق العراقي، من الصفر حتى فتح ورشتك الخاصة.',
                'description_en' => 'Comprehensive vocational course for mastering automotive paint correction and nano-ceramic protection in the Iraqi market, from basics to starting your own shop.',
                'cover_image_url' => '/images/courses/auto-detailing.jpg',
                'bundle_price_cents' => 1000,
                'bundle_promotional_tickets' => 15,
                'display_price_label' => '13,000 IQD',
                'is_active' => true,
                'parts' => [
                    [
                        'part_number' => 1,
                        'title_ar' => 'أساسيات الغسيل الكيميائي وإزالة الشوائب',
                        'title_en' => 'Chemical Decontamination Fundamentals',
                        'syllabus_ar' => 'معادلة الحموضة، استخدام رغوة الثلج، إزالة برادة الحديد وقضيب الطين (Clay Bar).',
                        'syllabus_en' => 'PH neutrality, snow foam pre-wash, iron fallout removal, and clay bar treatment.',
                        'part_price_cents' => 200,
                        'part_promotional_tickets' => 1,
                        'display_price_label' => '2,000 IQD',
                        'resource_types' => ['video', 'pdf'],
                        'duration_minutes' => 45,
                    ],
                    [
                        'part_number' => 2,
                        'title_ar' => 'تقييم الطلاء واستخدام مقياس السمك الرقمي',
                        'title_en' => 'Paint Assessment & Digital Gauge Metering',
                        'syllabus_ar' => 'قياس الميكرون، تشخيص طبقة الكليير كوت، وتحديد الخدوش القابلة للمعالجة دون إتلاف الصبغ.',
                        'syllabus_en' => 'Micron measurement, clear coat health inspection, and identifying corrective scratch limits.',
                        'part_price_cents' => 200,
                        'part_promotional_tickets' => 1,
                        'display_price_label' => '2,000 IQD',
                        'resource_types' => ['video', 'pdf'],
                        'duration_minutes' => 50,
                    ],
                    [
                        'part_number' => 3,
                        'title_ar' => 'معالجة الخدوش والتلميع بمرحلة واحدة ومرحلتين',
                        'title_en' => 'One-Step & Two-Step Paint Correction',
                        'syllabus_ar' => 'العمل بأجهزة الروتاري والديوال أكشن، اختيار الوسائد والمعاجين المناسبة لحرارة الصيف العراقية.',
                        'syllabus_en' => 'Rotary and dual-action polishers, pad and compound matching for Iraqi summer climate.',
                        'part_price_cents' => 200,
                        'part_promotional_tickets' => 1,
                        'display_price_label' => '2,000 IQD',
                        'resource_types' => ['video', 'pdf'],
                        'duration_minutes' => 60,
                    ],
                    [
                        'part_number' => 4,
                        'title_ar' => 'تجهيز السطح الكحولي وتطبيق النانو سيراميك',
                        'title_en' => 'Alcohol Prep & Nano-Ceramic Application',
                        'syllabus_ar' => 'مسح الإيزوبروبيل IPA، فرد طبقات السيراميك 9H، ومراقبة الوميض ومسح الزوائد بدقة.',
                        'syllabus_en' => 'IPA wipe-down, 9H ceramic coating leveling, flash-time detection, and buffing.',
                        'part_price_cents' => 200,
                        'part_promotional_tickets' => 1,
                        'display_price_label' => '2,000 IQD',
                        'resource_types' => ['video', 'pdf'],
                        'duration_minutes' => 55,
                    ],
                    [
                        'part_number' => 5,
                        'title_ar' => 'العناية بالفرش الداخلي والجلود والمعالجة بالبخار',
                        'title_en' => 'Interior Upholstery & Steam Sanitization',
                        'syllabus_ar' => 'تنظيف الجلد الطبيعي، ترطيب الأسطح، غسيل المقاعد بالحقن والاستخلاص والتعقيم الحراري.',
                        'syllabus_en' => 'Leather rejuvenation, deep extraction washing, and pressurized steam sanitization.',
                        'part_price_cents' => 200,
                        'part_promotional_tickets' => 1,
                        'display_price_label' => '2,000 IQD',
                        'resource_types' => ['video', 'pdf'],
                        'duration_minutes' => 40,
                    ],
                    [
                        'part_number' => 6,
                        'title_ar' => 'تسويق خدمات التلميع وإدارة ورشة ديتيلينغ في العراق',
                        'title_en' => 'Detailing Workshop Management & Marketing',
                        'syllabus_ar' => 'حساب تكلفة المواد، تسعير الباقات للزبائن العراقيين، وتصوير فيديوهات التحول لإنستغرام وتيك توك.',
                        'syllabus_en' => 'Material cost accounting, package pricing in IQD, and social media reels marketing.',
                        'part_price_cents' => 200,
                        'part_promotional_tickets' => 1,
                        'display_price_label' => '2,000 IQD',
                        'resource_types' => ['video', 'pdf'],
                        'duration_minutes' => 45,
                    ],
                ],
            ],
            [
                'slug' => 'phone-repair',
                'title_ar' => 'صيانة الهواتف الذكية واللحام الدقيق للميكروإلكترونيات',
                'title_en' => 'Smartphones Hardware Repair & Microsoldering',
                'description_ar' => 'دورة احترافية لتشخيص أعطال البورد وتتبع المخططات وتغيير آيسيات الشحن والباور والشاشات باحترافية.',
                'description_en' => 'Professional course for board diagnostics, schematic tracing, and IC chip micro-soldering.',
                'cover_image_url' => '/images/courses/phone-repair.jpg',
                'bundle_price_cents' => 1000,
                'bundle_promotional_tickets' => 15,
                'display_price_label' => '13,000 IQD',
                'is_active' => true,
                'parts' => [
                    [
                        'part_number' => 1,
                        'title_ar' => 'قراءة المخططات الإلكترونية وتتبع خطوط VDD/VCC',
                        'title_en' => 'Schematic Reading & Power Rail Tracing',
                        'syllabus_ar' => 'استخدام برامج ZXW و XinZhiZao لفحص خطوط التغذية الرئيسية واكتشاف انقطاع المسارات.',
                        'syllabus_en' => 'Using ZXW and XinZhiZao for schematic analysis and primary rail fault isolation.',
                        'part_price_cents' => 200,
                        'part_promotional_tickets' => 1,
                        'display_price_label' => '2,000 IQD',
                        'resource_types' => ['video', 'pdf'],
                        'duration_minutes' => 45,
                    ],
                    [
                        'part_number' => 2,
                        'title_ar' => 'استخدام الأفوميتر والكاميرا الحرارية لكشف الشورت',
                        'title_en' => 'Multimeter & Thermal Camera Diagnostics',
                        'syllabus_ar' => 'قياس الممانعة على وضع الدايود، واستخدام دخان الرزينة والكاميرا الحرارية لتحديد المكون التالف.',
                        'syllabus_en' => 'Diode mode impedance testing, rosin vapor method, and thermal camera heat mapping.',
                        'part_price_cents' => 200,
                        'part_promotional_tickets' => 1,
                        'display_price_label' => '2,000 IQD',
                        'resource_types' => ['video', 'pdf'],
                        'duration_minutes' => 50,
                    ],
                    [
                        'part_number' => 3,
                        'title_ar' => 'تقنيات اللحام بالكاوية والهوت إير وتنظيف الشبلنة',
                        'title_en' => 'Hot Air Rework & BGA Reballing',
                        'syllabus_ar' => 'ضبط حرارة الهوت إير، رفع الأيسيات المحمية بالإيبوكسي، وشبلنة كرات القصدير بدقة 0.2mm.',
                        'syllabus_en' => 'Underfill glue removal, BGA stencil reballing with 0.2mm solder paste.',
                        'part_price_cents' => 200,
                        'part_promotional_tickets' => 1,
                        'display_price_label' => '2,000 IQD',
                        'resource_types' => ['video', 'pdf'],
                        'duration_minutes' => 65,
                    ],
                    [
                        'part_number' => 4,
                        'title_ar' => 'إصلاح مسارات الشحن ودائرة الإضاءة في هواتف الآيفون والأندرويد',
                        'title_en' => 'Charging Port & Backlight Circuit Repair',
                        'syllabus_ar' => 'تبديل آيسي الترايستار/هايدرا، فحص ملفات الإضاءة ودايود البوست وفلاتر الشاشة.',
                        'syllabus_en' => 'Tristar/Hydra IC replacement, backlight boost coil, and display filter testing.',
                        'part_price_cents' => 200,
                        'part_promotional_tickets' => 1,
                        'display_price_label' => '2,000 IQD',
                        'resource_types' => ['video', 'pdf'],
                        'duration_minutes' => 55,
                    ],
                    [
                        'part_number' => 5,
                        'title_ar' => 'استبدال شاشات OLED ونقل بيانات تروتون وفك الفلاتات',
                        'title_en' => 'OLED Screen Separation & TrueTone Serialization',
                        'syllabus_ar' => 'فك الشاشات المنحنية بجهاز التسخين، ونقل السيريال عبر المبرمجة لتفعيل تروتون والبطارية.',
                        'syllabus_en' => 'Curved OLED screen disassembly, EEPROM programmer serialization for TrueTone.',
                        'part_price_cents' => 200,
                        'part_promotional_tickets' => 1,
                        'display_price_label' => '2,000 IQD',
                        'resource_types' => ['video', 'pdf'],
                        'duration_minutes' => 40,
                    ],
                    [
                        'part_number' => 6,
                        'title_ar' => 'تجهيز معمل الصيانة وتسعير قطع الغيار في السوق المحلي',
                        'title_en' => 'Repair Lab Setup & Spare Parts Sourcing',
                        'syllabus_ar' => 'أفضل مصادر قطع الغيار في بغداد (شارع الربيعي/باب الشرقي)، وتسعير أجور اليد وضمان التصليح.',
                        'syllabus_en' => 'Sourcing original spare parts in Baghdad market, labor pricing, and repair warranties.',
                        'part_price_cents' => 200,
                        'part_promotional_tickets' => 1,
                        'display_price_label' => '2,000 IQD',
                        'resource_types' => ['video', 'pdf'],
                        'duration_minutes' => 45,
                    ],
                ],
            ],
            [
                'slug' => 'freelance-design',
                'title_ar' => 'تصميم الهويات البصرية والواجهات والعمل الحر في العراق',
                'title_en' => 'Brand Identity, UI Design & Local Freelancing',
                'description_ar' => 'مسار عملي لتصميم العلامات التجارية وواجهات التطبيقات واستقطاب العملاء المحليين وتلقي المدفوعات.',
                'description_en' => 'Practical track for branding, UI design, client acquisition and receiving payments in Iraq.',
                'cover_image_url' => '/images/courses/freelance-design.jpg',
                'bundle_price_cents' => 1000,
                'bundle_promotional_tickets' => 15,
                'display_price_label' => '13,000 IQD',
                'is_active' => true,
                'parts' => [
                    [
                        'part_number' => 1,
                        'title_ar' => 'أساسيات بناء الهوية البصرية ونظرية الألوان والخطوط العربية',
                        'title_en' => 'Visual Identity & Arabic Typography',
                        'syllabus_ar' => 'اختيار الخطوط الطباعية المتناسقة، معاني الألوان للمستهلك العراقي، ودليل استخدام الشعار.',
                        'syllabus_en' => 'Arabic font pairing, cultural color psychology, and comprehensive brand guidelines.',
                        'part_price_cents' => 200,
                        'part_promotional_tickets' => 1,
                        'display_price_label' => '2,000 IQD',
                        'resource_types' => ['video', 'pdf'],
                        'duration_minutes' => 45,
                    ],
                    [
                        'part_number' => 2,
                        'title_ar' => 'تصميم واجهات المستخدم وتجربة الاستخدام ببرنامج فيجما',
                        'title_en' => 'Figma UI/UX Design System Fundamentals',
                        'syllabus_ar' => 'بناء شبكات التصميم، الأوتولايوت، المكونات التفاعلية، وتصميم واجهات عربية RTL.',
                        'syllabus_en' => 'Grid systems, Auto-layout, variants, and Arabic RTL interface design patterns.',
                        'part_price_cents' => 200,
                        'part_promotional_tickets' => 1,
                        'display_price_label' => '2,000 IQD',
                        'resource_types' => ['video', 'pdf'],
                        'duration_minutes' => 60,
                    ],
                    [
                        'part_number' => 3,
                        'title_ar' => 'تصميم إعلانات السوشيال ميديا للمتاجر والمطاعم العراقية',
                        'title_en' => 'Social Media Ad Creatives for Iraqi Businesses',
                        'syllabus_ar' => 'مقاسات المنشورات والستوري، دمج الصور وتوزيع النصوص الجاذبة للفت انتباه المشتري.',
                        'syllabus_en' => 'Feed & Story ad composition, photo manipulation, and high-converting CTA text.',
                        'part_price_cents' => 200,
                        'part_promotional_tickets' => 1,
                        'display_price_label' => '2,000 IQD',
                        'resource_types' => ['video', 'pdf'],
                        'duration_minutes' => 50,
                    ],
                    [
                        'part_number' => 4,
                        'title_ar' => 'بناء البورتفوليو الاحترافي على بيهانس ولينكد إن',
                        'title_en' => 'Behance Portfolio Curation & Case Studies',
                        'syllabus_ar' => 'عرض دراسة الحالة (Case Study) وكتابة التحدي والحلول لإقناع الشركات بتوظيفك.',
                        'syllabus_en' => 'Presenting design case studies, outlining problems & solutions to win client pitches.',
                        'part_price_cents' => 200,
                        'part_promotional_tickets' => 1,
                        'display_price_label' => '2,000 IQD',
                        'resource_types' => ['video', 'pdf'],
                        'duration_minutes' => 40,
                    ],
                    [
                        'part_number' => 5,
                        'title_ar' => 'استراتيجيات التسعير والتفاوض وكتابة العقود القانونية',
                        'title_en' => 'Freelance Pricing Models & Service Contracts',
                        'syllabus_ar' => 'التسعير القائم على القيمة مقابل السعر الثابت، صياغة عقود حفظ الحقوق واستلام الدفعة المقدمة.',
                        'syllabus_en' => 'Value-based pricing vs flat rate, deposit clauses, and freelance service agreements.',
                        'part_price_cents' => 200,
                        'part_promotional_tickets' => 1,
                        'display_price_label' => '2,000 IQD',
                        'resource_types' => ['video', 'pdf'],
                        'duration_minutes' => 45,
                    ],
                    [
                        'part_number' => 6,
                        'title_ar' => 'إدارة التحويلات المالية عبر زين كاش والماستر كارد المحلية',
                        'title_en' => 'Payment Collection via ZainCash & Qi Card',
                        'syllabus_ar' => 'استلام دفعات العمل الحر في العراق، ربط الحسابات المصرفية، وتجنب مشاكل المعاملات المالية.',
                        'syllabus_en' => 'Collecting freelance fees via Zain Cash merchant wallets, Qi card, and bank transfers.',
                        'part_price_cents' => 200,
                        'part_promotional_tickets' => 1,
                        'display_price_label' => '2,000 IQD',
                        'resource_types' => ['video', 'pdf'],
                        'duration_minutes' => 35,
                    ],
                ],
            ],
        ];

        foreach ($courses as $cData) {
            $parts = $cData['parts'];
            unset($cData['parts']);

            $course = Course::firstOrCreate(
                ['slug' => $cData['slug']],
                $cData
            );

            foreach ($parts as $pData) {
                CoursePart::firstOrCreate(
                    [
                        'course_id' => $course->id,
                        'part_number' => $pData['part_number'],
                    ],
                    $pData
                );
            }
        }
    }
}
