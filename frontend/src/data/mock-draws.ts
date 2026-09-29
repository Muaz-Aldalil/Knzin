import { DrawItem, ConcludedDrawItem } from '@/types/draws';

/**
 * Helper to generate dynamic timestamps relative to current client runtime
 * ensuring offline fixtures always render realistic active countdowns.
 */
function getFutureDate(minutesFromNow: number): string {
  return new Date(Date.now() + minutesFromNow * 60 * 1000).toISOString();
}

function getPastDate(minutesAgo: number): string {
  return new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
}

export function getMockServerTimeUtc(): string {
  return new Date().toISOString();
}

export const MOCK_ACTIVE_DRAWS: DrawItem[] = [
  {
    id: 'draw-hourly-active',
    tier: 'hourly',
    execution_type: 'automated_electronic',
    title: 'السحب الساعي السريع (100$ كاش)',
    status: 'active',
    starts_at: getPastDate(25),
    ends_at: getFutureDate(35),
    badge_label: 'سحب مضمون ومجدول رسمياً',
    broadcast_url: null,
    total_eligible_tickets: 420,
    prize: {
      title: 'مبلغ 100$ نقداً يُسلّم فورياً',
      description: 'جائزة نقدية فورية تُسلّم إلى الفائز عبر زين كاش أو الحوالة السريعة فور توثيق السحب.',
      category: 'cash',
      valuation_usd: 100,
      display_iqd_label: '131,000 د.ع',
      image_url: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&q=80&w=800',
    },
  },
  {
    id: 'draw-daily-active',
    tier: 'daily',
    execution_type: 'automated_electronic',
    title: 'السحب اليومي الذهبي (iPhone 16 Pro Max)',
    status: 'active',
    starts_at: getPastDate(12 * 60),
    ends_at: getFutureDate(10 * 60),
    badge_label: 'سحب مضمون ومجدول رسمياً',
    broadcast_url: null,
    total_eligible_tickets: 2450,
    prize: {
      title: 'iPhone 16 Pro Max (256GB Desert Titanium)',
      description: 'أحدث هواتف آبل مع ضمان رسمي وتوصيل مجاني لكافة محافظات العراق.',
      category: 'merchandise',
      valuation_usd: 1400,
      display_iqd_label: '1,834,000 د.ع',
      image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=800',
    },
  },
  {
    id: 'draw-monthly-grand',
    tier: 'monthly',
    execution_type: 'live_broadcast',
    title: 'الجائزة الكبرى الشهرية: سيارة شيري تيجو 8 برو ماكس 2026',
    status: 'active',
    starts_at: getPastDate(15 * 24 * 60),
    ends_at: getFutureDate(14 * 24 * 60 + 6 * 60),
    badge_label: 'بث مباشر رسمي على يوتيوب',
    broadcast_url: 'https://youtube.com/live/knzin-grand-draw',
    total_eligible_tickets: 18920,
    prize: {
      title: 'سيارة Chery Tiggo 8 Pro Max 2026 زيرو مع لوحات بغداد',
      description: 'الجائزة الكبرى الشهرية: سيارة دفع رباعي عائلية فاخرة مرقمة وجاهزة للاستلام مع تغطية كاملة لرسوم التسجيل والتحويل.',
      category: 'merchandise',
      valuation_usd: 35000,
      display_iqd_label: '45,850,000 د.ع',
      image_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=1200',
    },
  },
];

export const MOCK_CONCLUDED_DRAWS: ConcludedDrawItem[] = [
  {
    id: 'draw-monthly-prev',
    tier: 'monthly',
    title: 'السحب الشهري الكبير السابق (سيارة هيونداي إلنترا 2025)',
    concluded_at: getPastDate(14 * 24 * 60),
    broadcast_replay_url: 'https://youtube.com/watch?v=knzin-m01-replay',
    prize: {
      title: 'سيارة Hyundai Elantra 2025 زيرو',
      valuation_usd: 24000,
      display_iqd_label: '31,440,000 د.ع',
      image_url: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800',
    },
    winner: {
      winning_ticket_serial: '#KNZ-M01-0023',
      masked_name: 'سامر ل. خ.',
      governorate: 'أربيل',
      prize_delivered: true,
    },
  },
  {
    id: 'draw-daily-prev',
    tier: 'daily',
    title: 'السحب اليومي الذهبي (مبلغ 5,000$ كاش)',
    concluded_at: getPastDate(26 * 60),
    broadcast_replay_url: null,
    prize: {
      title: 'مبلغ 5,000$ نقداً',
      valuation_usd: 5000,
      display_iqd_label: '6,550,000 د.ع',
      image_url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=800',
    },
    winner: {
      winning_ticket_serial: '#KNZ-D04-1049',
      masked_name: 'مروة ع. ج.',
      governorate: 'بغداد (الكرخ)',
      prize_delivered: true,
    },
  },
  {
    id: 'draw-hourly-prev',
    tier: 'hourly',
    title: 'السحب الساعي السريع رقم #8821',
    concluded_at: getPastDate(95),
    broadcast_replay_url: null,
    prize: {
      title: '100$ كاش فوري',
      valuation_usd: 100,
      display_iqd_label: '131,000 د.ع',
      image_url: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&q=80&w=800',
    },
    winner: {
      winning_ticket_serial: '#KNZ-H12-8821',
      masked_name: 'حسين ك. م.',
      governorate: 'البصرة',
      prize_delivered: true,
    },
  },
];
