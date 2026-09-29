<?php

namespace Database\Seeders;

use App\Models\Draw;
use App\Models\DrawWinner;
use App\Models\Prize;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class PromotionalDrawSeeder extends Seeder
{
    /**
     * Run the promotional draws seeder with deterministic idempotent records.
     */
    public function run(): void
    {
        $now = Carbon::now();

        // 1. Current Active Hourly Draw
        $hourlyActive = Draw::updateOrCreate(
            ['id' => '11111111-1111-1111-1111-111111111111'],
            [
                'tier' => 'hourly',
                'execution_type' => 'automated_electronic',
                'title_ar' => 'السحب الساعي السريع (100$ كاش)',
                'title_en' => 'Hourly Micro-Draw ($100 Instant Cash)',
                'status' => 'active',
                'starts_at' => $now->copy()->subMinutes(25),
                'ends_at' => $now->copy()->addMinutes(35),
                'broadcast_url' => null,
                'total_eligible_tickets' => 420,
            ]
        );

        Prize::updateOrCreate(
            ['draw_id' => $hourlyActive->id],
            [
                'id' => 'aaaa1111-1111-1111-1111-111111111111',
                'title_ar' => 'مبلغ 100$ نقداً يُسلّم فورياً',
                'title_en' => '$100 Instant Cash Award',
                'description_ar' => 'جائزة نقدية فورية تُسلّم إلى الفائز عبر زين كاش أو الحوالة السريعة فور توثيق السحب.',
                'description_en' => 'Instant cash award transferred directly via local digital wallet upon certification.',
                'category' => 'cash',
                'valuation_usd_cents' => 10000,
                'display_iqd_label' => '131,000 د.ع',
                'image_url' => 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&q=80&w=800',
            ]
        );

        // 2. Upcoming Hourly Draw
        $hourlyUpcoming = Draw::updateOrCreate(
            ['id' => '11111111-1111-1111-1111-111111111112'],
            [
                'tier' => 'hourly',
                'execution_type' => 'automated_electronic',
                'title_ar' => 'السحب الساعي السريع للدورة القادمة',
                'title_en' => 'Next Upcoming Hourly Micro-Draw',
                'status' => 'upcoming',
                'starts_at' => $now->copy()->addMinutes(35),
                'ends_at' => $now->copy()->addMinutes(95),
                'broadcast_url' => null,
                'total_eligible_tickets' => 110,
            ]
        );

        Prize::updateOrCreate(
            ['draw_id' => $hourlyUpcoming->id],
            [
                'id' => 'aaaa1111-1111-1111-1111-111111111112',
                'title_ar' => 'مبلغ 100$ نقداً للدورة القادمة',
                'title_en' => '$100 Instant Cash for Next Cycle',
                'description_ar' => 'جائزة نقدية فورية تُسلّم إلى الفائز فور توثيق السحب.',
                'description_en' => 'Instant cash award transferred upon certification.',
                'category' => 'cash',
                'valuation_usd_cents' => 10000,
                'display_iqd_label' => '131,000 د.ع',
                'image_url' => 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&q=80&w=800',
            ]
        );

        // 3. Locked Hourly Draw (5 minutes expired, within 15m grace window)
        $hourlyLocked = Draw::updateOrCreate(
            ['id' => '11111111-1111-1111-1111-111111111113'],
            [
                'tier' => 'hourly',
                'execution_type' => 'automated_electronic',
                'title_ar' => 'السحب الساعي السريع #8822 (قيد الإجراء)',
                'title_en' => 'Hourly Micro-Draw #8822 (In Progress)',
                'status' => 'locked',
                'starts_at' => $now->copy()->subMinutes(65),
                'ends_at' => $now->copy()->subMinutes(5),
                'broadcast_url' => null,
                'total_eligible_tickets' => 540,
            ]
        );

        Prize::updateOrCreate(
            ['draw_id' => $hourlyLocked->id],
            [
                'id' => 'aaaa1111-1111-1111-1111-111111111113',
                'title_ar' => '100$ كاش فوري',
                'title_en' => '$100 Instant Cash',
                'description_ar' => 'جائزة نقدية فورية قيد التوثيق الإلكتروني.',
                'description_en' => 'Instant cash currently undergoing automated certification.',
                'category' => 'cash',
                'valuation_usd_cents' => 10000,
                'display_iqd_label' => '131,000 د.ع',
                'image_url' => 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&q=80&w=800',
            ]
        );

        // 4. Current Active Daily Draw
        $dailyActive = Draw::updateOrCreate(
            ['id' => '22222222-2222-2222-2222-222222222222'],
            [
                'tier' => 'daily',
                'execution_type' => 'automated_electronic',
                'title_ar' => 'السحب اليومي الذهبي (iPhone 16 Pro Max)',
                'title_en' => 'Golden Daily Draw (iPhone 16 Pro Max)',
                'status' => 'active',
                'starts_at' => $now->copy()->subHours(10),
                'ends_at' => $now->copy()->addHours(14),
                'broadcast_url' => null,
                'total_eligible_tickets' => 2450,
            ]
        );

        Prize::updateOrCreate(
            ['draw_id' => $dailyActive->id],
            [
                'id' => 'bbbb2222-2222-2222-2222-222222222222',
                'title_ar' => 'iPhone 16 Pro Max (256GB Desert Titanium)',
                'title_en' => 'iPhone 16 Pro Max (256GB Desert Titanium)',
                'description_ar' => 'أحدث هواتف آبل مع ضمان رسمي وتوصيل مجاني لكافة محافظات العراق.',
                'description_en' => 'Latest flagship iPhone with official regional warranty and free delivery across Iraq.',
                'category' => 'merchandise',
                'valuation_usd_cents' => 140000,
                'display_iqd_label' => '1,834,000 د.ع',
                'image_url' => 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=800',
            ]
        );

        // 5. Active Monthly Grand Draw
        $monthlyGrand = Draw::updateOrCreate(
            ['id' => '33333333-3333-3333-3333-333333333333'],
            [
                'tier' => 'monthly',
                'execution_type' => 'live_broadcast',
                'title_ar' => 'الجائزة الكبرى الشهرية: سيارة شيري تيجو 8 برو ماكس 2026',
                'title_en' => 'Monthly Grand Prize: Chery Tiggo 8 Pro Max 2026',
                'status' => 'active',
                'starts_at' => $now->copy()->subDays(15),
                'ends_at' => $now->copy()->addDays(14)->addHours(6),
                'broadcast_url' => 'https://youtube.com/live/knzin-grand-draw',
                'total_eligible_tickets' => 18920,
            ]
        );

        Prize::updateOrCreate(
            ['draw_id' => $monthlyGrand->id],
            [
                'id' => 'cccc3333-3333-3333-3333-333333333333',
                'title_ar' => 'سيارة Chery Tiggo 8 Pro Max 2026 زيرو مع لوحات بغداد',
                'title_en' => 'Chery Tiggo 8 Pro Max 2026 (Zero Km with Baghdad Plates)',
                'description_ar' => 'الجائزة الكبرى الشهرية: سيارة دفع رباعي عائلية فاخرة مرقمة وجاهزة للاستلام مع تغطية كاملة لرسوم التسجيل والتحويل.',
                'description_en' => 'Grand luxury SUV certified and delivered with all registration and transfer fees covered.',
                'category' => 'merchandise',
                'valuation_usd_cents' => 3500000,
                'display_iqd_label' => '45,850,000 د.ع',
                'image_url' => 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=1200',
            ]
        );

        // 6. Concluded Past Monthly Grand Draw (Hall of Fame)
        $pastMonthly = Draw::updateOrCreate(
            ['id' => '44444444-4444-4444-4444-444444444441'],
            [
                'tier' => 'monthly',
                'execution_type' => 'live_broadcast',
                'title_ar' => 'السحب الشهري الكبير السابق (سيارة هيونداي إلنترا 2025)',
                'title_en' => 'Previous Monthly Grand Draw (Hyundai Elantra 2025)',
                'status' => 'completed',
                'starts_at' => $now->copy()->subDays(45),
                'ends_at' => $now->copy()->subDays(15),
                'broadcast_url' => 'https://youtube.com/watch?v=knzin-m01-replay',
                'total_eligible_tickets' => 14210,
            ]
        );

        Prize::updateOrCreate(
            ['draw_id' => $pastMonthly->id],
            [
                'id' => 'dddd4444-4444-4444-4444-444444444441',
                'title_ar' => 'سيارة Hyundai Elantra 2025 زيرو',
                'title_en' => 'Hyundai Elantra 2025 (Zero Km)',
                'description_ar' => 'تم تسليم السيارة للفائز رسمياً في أربيل وتوثيق البث.',
                'description_en' => 'Delivered to verified winner in Erbil with recorded ceremony.',
                'category' => 'merchandise',
                'valuation_usd_cents' => 2400000,
                'display_iqd_label' => '31,440,000 د.ع',
                'image_url' => 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800',
            ]
        );

        DrawWinner::updateOrCreate(
            ['draw_id' => $pastMonthly->id],
            [
                'id' => 'eeee5555-5555-5555-5555-555555555551',
                'winning_ticket_serial' => '#KNZ-M01-0023',
                'winner_masked_name' => 'سامر ل. خ.',
                'winner_governorate' => 'أربيل',
                'prize_delivered' => true,
                'stream_recording_url' => 'https://youtube.com/watch?v=knzin-m01-replay',
                'drawn_at' => $now->copy()->subDays(15),
            ]
        );

        // 7. Concluded Past Daily Draw
        $pastDaily = Draw::updateOrCreate(
            ['id' => '44444444-4444-4444-4444-444444444442'],
            [
                'tier' => 'daily',
                'execution_type' => 'automated_electronic',
                'title_ar' => 'السحب اليومي الذهبي (مبلغ 5,000$ كاش)',
                'title_en' => 'Golden Daily Draw ($5,000 Cash)',
                'status' => 'completed',
                'starts_at' => $now->copy()->subDays(2),
                'ends_at' => $now->copy()->subDays(1),
                'broadcast_url' => null,
                'total_eligible_tickets' => 3120,
            ]
        );

        Prize::updateOrCreate(
            ['draw_id' => $pastDaily->id],
            [
                'id' => 'dddd4444-4444-4444-4444-444444444442',
                'title_ar' => 'مبلغ 5,000$ نقداً',
                'title_en' => '$5,000 Instant Cash',
                'description_ar' => 'تم استلام المبلغ نقداً في بغداد.',
                'description_en' => 'Claimed and delivered in Baghdad.',
                'category' => 'cash',
                'valuation_usd_cents' => 500000,
                'display_iqd_label' => '6,550,000 د.ع',
                'image_url' => 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=800',
            ]
        );

        DrawWinner::updateOrCreate(
            ['draw_id' => $pastDaily->id],
            [
                'id' => 'eeee5555-5555-5555-5555-555555555552',
                'winning_ticket_serial' => '#KNZ-D04-1049',
                'winner_masked_name' => 'مروة ع. ج.',
                'winner_governorate' => 'بغداد (الكرخ)',
                'prize_delivered' => true,
                'stream_recording_url' => null,
                'drawn_at' => $now->copy()->subDays(1),
            ]
        );

        // 8. Concluded Past Hourly Draw
        $pastHourly = Draw::updateOrCreate(
            ['id' => '44444444-4444-4444-4444-444444444443'],
            [
                'tier' => 'hourly',
                'execution_type' => 'automated_electronic',
                'title_ar' => 'السحب الساعي السريع رقم #8821',
                'title_en' => 'Hourly Micro-Draw #8821',
                'status' => 'completed',
                'starts_at' => $now->copy()->subHours(3),
                'ends_at' => $now->copy()->subHours(2),
                'broadcast_url' => null,
                'total_eligible_tickets' => 380,
            ]
        );

        Prize::updateOrCreate(
            ['draw_id' => $pastHourly->id],
            [
                'id' => 'dddd4444-4444-4444-4444-444444444443',
                'title_ar' => '100$ كاش فوري',
                'title_en' => '$100 Instant Cash',
                'description_ar' => 'تم التحويل لحساب زين كاش الموثق.',
                'description_en' => 'Transferred to verified ZainCash account in Basra.',
                'category' => 'cash',
                'valuation_usd_cents' => 10000,
                'display_iqd_label' => '131,000 د.ع',
                'image_url' => 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&q=80&w=800',
            ]
        );

        DrawWinner::updateOrCreate(
            ['draw_id' => $pastHourly->id],
            [
                'id' => 'eeee5555-5555-5555-5555-555555555553',
                'winning_ticket_serial' => '#KNZ-H12-8821',
                'winner_masked_name' => 'حسين ك. م.',
                'winner_governorate' => 'البصرة',
                'prize_delivered' => true,
                'stream_recording_url' => null,
                'drawn_at' => $now->copy()->subHours(2),
            ]
        );
    }
}
