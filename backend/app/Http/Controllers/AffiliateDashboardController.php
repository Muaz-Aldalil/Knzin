<?php

namespace App\Http\Controllers;

use App\Models\AffiliateLedgerEntry;
use App\Models\ReferralAttribution;
use App\Models\Ticket;
use App\Services\PlatformSettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AffiliateDashboardController extends Controller
{
    public function __construct(
        protected PlatformSettingsService $settingsService
    ) {}

    /**
     * Get affiliate dashboard KPI summary, referral links, and active policy threshold.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();

        // 0. Sweep any mature pending commissions for this user to ensure DB state matches holding policy
        app(\App\Services\AffiliateCommissionService::class)->sweepMaturedCommissionsForUser($user->id);

        // 1-4. Optimized aggregate ledger query: single database roundtrip for all balances
        $now = now();
        $ledgerStats = AffiliateLedgerEntry::where('user_id', $user->id)
            ->selectRaw("
                COALESCE(SUM(CASE 
                    WHEN status = 'available' 
                      OR (status = 'pending' AND matures_at IS NOT NULL AND matures_at <= ?)
                    THEN amount_cents 
                    ELSE 0 
                END), 0) as available_sum,
                COALESCE(SUM(CASE 
                    WHEN status = 'pending' 
                      AND (matures_at IS NULL OR matures_at > ?)
                      AND entry_type IN ('sales_commission', 'co_prize_credit')
                    THEN amount_cents 
                    ELSE 0 
                END), 0) as pending_sum,
                COALESCE(SUM(CASE 
                    WHEN entry_type IN ('sales_commission', 'co_prize_credit') 
                    THEN amount_cents 
                    ELSE 0 
                END), 0) as total_earned,
                COALESCE(SUM(CASE 
                    WHEN entry_type = 'payout_debit' AND status IN ('cleared', 'available') 
                    THEN amount_cents 
                    ELSE 0 
                END), 0) as total_withdrawn
            ", [$now, $now])
            ->first();

        $unpaidAvailableCents = max(0, (int) ($ledgerStats->available_sum ?? 0));
        $unpaidPendingCents = max(0, (int) ($ledgerStats->pending_sum ?? 0));
        $totalEarnedCents = (int) ($ledgerStats->total_earned ?? 0);
        $totalWithdrawnCents = abs((int) ($ledgerStats->total_withdrawn ?? 0));

        // 5. Total referred orders
        $referredOrdersCount = ReferralAttribution::where('referrer_user_id', $user->id)->count();

        // 6. Active draw co-prize tickets count via SQL subquery (prevents in-memory array allocation)
        $activeCoPrizeTicketsCount = Ticket::whereIn('order_id', function ($query) use ($user) {
            $query->select('order_id')
                ->from('referral_attributions')
                ->where('referrer_user_id', $user->id);
        })->count();

        // 7. Active dynamic admin threshold
        $minPayoutCents = (int) $this->settingsService->get('affiliate.payout_min_cents', 5000);

        // 8. Referral URLs (pointing to Next.js Frontend catalog where cookies are captured)
        $baseUrl = rtrim((string) config('app.frontend_url', 'http://127.0.0.1:3000'), '/');
        $profile = $user->affiliateProfile;
        $customSlug = $profile?->custom_slug;

        // 9. Recent conversions
        $recentAttributions = ReferralAttribution::where('referrer_user_id', $user->id)
            ->with(['order.items.course', 'order.user'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        $recentConversions = $recentAttributions->map(function (ReferralAttribution $attr) {
            $order = $attr->order;
            $firstItem = $order?->items?->first();
            $course = $firstItem?->course;

            $commissionEntry = AffiliateLedgerEntry::where('order_id', $order?->id)
                ->where('entry_type', 'sales_commission')
                ->first();

            $commissionCents = $commissionEntry ? $commissionEntry->amount_cents : 0;

            $isMatured = $commissionEntry && (
                $commissionEntry->status === 'available' ||
                ($commissionEntry->status === 'pending' && $commissionEntry->matures_at && $commissionEntry->matures_at->isPast())
            );
            $effectiveStatus = $isMatured ? 'available' : ($commissionEntry?->status ?? 'pending');

            return [
                'order_number' => $order?->order_number ?? 'UNKNOWN',
                'course_title_ar' => $course?->title_ar ?? 'دورة مهنية',
                'course_title_en' => $course?->title_en ?? 'Vocational Course',
                'purchase_type' => $firstItem?->item_type ?? 'bundle',
                'buyer_name' => $order?->user?->display_name ?? 'طالب كَنزين',
                'order_total_formatted' => sprintf('$%.2f', ($order?->total_amount_cents ?? 0) / 100),
                'commission_cents' => $commissionCents,
                'commission_formatted' => sprintf('$%.2f', $commissionCents / 100),
                'tickets_granted_to_buyer' => $order?->promotional_tickets_granted ?? 0,
                'status' => $effectiveStatus,
                'matures_at' => $commissionEntry?->matures_at?->toISOString(),
                'created_at' => $order?->created_at?->toISOString(),
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => [
                'referral_info' => [
                    'learner_code' => $user->learner_code,
                    'custom_slug' => $customSlug,
                    'canonical_url' => "{$baseUrl}?ref={$user->learner_code}",
                    'vanity_url' => $customSlug ? "{$baseUrl}/{$customSlug}" : null,
                    'is_influencer' => !empty($customSlug),
                ],
                'kpis' => [
                    'unpaid_available_cents' => $unpaidAvailableCents,
                    'unpaid_available_formatted' => sprintf('$%.2f', $unpaidAvailableCents / 100),
                    'unpaid_available_iqd' => intdiv($unpaidAvailableCents * 131, 10),
                    'unpaid_pending_cents' => $unpaidPendingCents,
                    'unpaid_pending_formatted' => sprintf('$%.2f', $unpaidPendingCents / 100),
                    'total_earned_cents' => $totalEarnedCents,
                    'total_earned_formatted' => sprintf('$%.2f', $totalEarnedCents / 100),
                    'total_withdrawn_cents' => $totalWithdrawnCents,
                    'total_withdrawn_formatted' => sprintf('$%.2f', $totalWithdrawnCents / 100),
                    'total_referred_orders_count' => $referredOrdersCount,
                    'active_co_prize_tickets_count' => $activeCoPrizeTicketsCount,
                ],
                'commission_policy' => [
                    'sales_commission_rate_percent' => round(((int) $this->settingsService->get('affiliate.commission_rate_bps', 2500)) / 100, 2),
                    'minimum_payout_cents' => $minPayoutCents,
                    'minimum_payout_formatted' => sprintf('$%.2f', $minPayoutCents / 100),
                    'maturation_hold_hours' => (int) config('knzin.affiliate.maturation_hours', 24),
                    'co_prize_share_percent' => 40,
                ],
                'recent_conversions' => $recentConversions,
            ],
        ]);
    }

    /**
     * Get paginated append-only subledger history for the authenticated user.
     */
    public function ledger(Request $request): JsonResponse
    {
        $user = $request->user();

        // Sweep any mature pending commissions for this user so ledger rows reflect availability
        app(\App\Services\AffiliateCommissionService::class)->sweepMaturedCommissionsForUser($user->id);

        $perPage = min(50, max(5, (int) $request->query('per_page', 15)));
        $type = $request->query('type', 'all');

        $query = AffiliateLedgerEntry::where('user_id', $user->id)
            ->with(['order', 'payout'])
            ->orderBy('id', 'desc');

        if ($type !== 'all' && in_array($type, ['sales_commission', 'co_prize_credit', 'payout_debit', 'reversal_debit', 'reversal_credit'], true)) {
            $query->where('entry_type', $type);
        }

        $paginator = $query->paginate($perPage);

        $entries = collect($paginator->items())->map(function (AffiliateLedgerEntry $entry) {
            $isPositive = $entry->amount_cents >= 0;
            $sign = $isPositive ? '+' : '-';
            $amountFormatted = sprintf('%s$%.2f', $sign, abs($entry->amount_cents) / 100);

            $descriptions = $this->resolveEntryDescriptions($entry);

            return [
                'id' => $entry->id,
                'entry_type' => $entry->entry_type,
                'amount_cents' => $entry->amount_cents,
                'amount_formatted' => $amountFormatted,
                'currency' => $entry->currency,
                'status' => $entry->status,
                'order_number' => $entry->order?->order_number,
                'payout_number' => $entry->payout?->payout_number,
                'description_ar' => $descriptions['ar'],
                'description_en' => $descriptions['en'],
                'matures_at' => $entry->matures_at?->toISOString(),
                'created_at' => $entry->created_at?->toISOString(),
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => [
                'entries' => $entries,
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                ],
            ],
        ]);
    }

    /**
     * Resolve localized descriptions for ledger entries.
     */
    private function resolveEntryDescriptions(AffiliateLedgerEntry $entry): array
    {
        switch ($entry->entry_type) {
            case 'sales_commission':
                $orderNum = $entry->order?->order_number ?? '';
                $attribution = $entry->order_id ? \App\Models\ReferralAttribution::where('order_id', $entry->order_id)->first() : null;
                if ($attribution && $attribution->commission_rate_bps !== null) {
                    $percent = rtrim(rtrim(number_format($attribution->commission_rate_bps / 100, 2), '0'), '.');
                    return [
                        'ar' => "عمولة مبيعات {$percent}% من طلب دورة ({$orderNum})",
                        'en' => "{$percent}% sales commission from course order ({$orderNum})",
                    ];
                }
                return [
                    'ar' => "عمولة مبيعات من طلب دورة ({$orderNum})",
                    'en' => "Sales commission from course order ({$orderNum})",
                ];
            case 'co_prize_credit':
                return [
                    'ar' => "حصة الصديق 40% من الجائزة الكبرى (من صندوق المنصة التسويقي)",
                    'en' => "40% Grand-Prize Co-Share (from KNZiN promotional marketing pool)",
                ];
            case 'payout_debit':
                $payNum = $entry->payout?->payout_number ?? '';
                return [
                    'ar' => "سحب أرباح عبر محفظة محلية ({$payNum})",
                    'en' => "Affiliate withdrawal disbursement ({$payNum})",
                ];
            case 'reversal_debit':
                return [
                    'ar' => "تسوية عكسية لعمولة ملغاة أو مستردة",
                    'en' => "Compensating reversal debit for refunded/cancelled order",
                ];
            case 'reversal_credit':
                return [
                    'ar' => "إعادة رصيد سحب مرفوض إلى الحساب",
                    'en' => "Credit refund for rejected withdrawal request",
                ];
            default:
                return [
                    'ar' => 'حركة مالية في سجل الشريك',
                    'en' => 'Affiliate financial transaction',
                ];
        }
    }
}
