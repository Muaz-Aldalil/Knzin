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

        // 1. Calculate available balance: mature credits minus active debits
        $availableSum = AffiliateLedgerEntry::where('user_id', $user->id)
            ->matureAvailable()
            ->sum('amount_cents');
        $unpaidAvailableCents = max(0, (int) $availableSum);

        // 2. Calculate pending hold balance
        $pendingSum = AffiliateLedgerEntry::where('user_id', $user->id)
            ->pendingHold()
            ->whereIn('entry_type', ['sales_commission', 'co_prize_credit'])
            ->sum('amount_cents');
        $unpaidPendingCents = max(0, (int) $pendingSum);

        // 3. Total lifetime earned
        $totalEarnedCents = (int) AffiliateLedgerEntry::where('user_id', $user->id)
            ->whereIn('entry_type', ['sales_commission', 'co_prize_credit'])
            ->sum('amount_cents');

        // 4. Total withdrawn
        $totalWithdrawnCents = abs((int) AffiliateLedgerEntry::where('user_id', $user->id)
            ->where('entry_type', 'payout_debit')
            ->whereIn('status', ['cleared', 'available'])
            ->sum('amount_cents'));

        // 5. Total referred orders
        $referredOrdersCount = ReferralAttribution::where('referrer_user_id', $user->id)->count();

        // 6. Active draw co-prize tickets count
        $referredOrderIds = ReferralAttribution::where('referrer_user_id', $user->id)->pluck('order_id');
        $activeCoPrizeTicketsCount = Ticket::whereIn('order_id', $referredOrderIds)->count();

        // 7. Active dynamic admin threshold
        $minPayoutCents = (int) $this->settingsService->get('affiliate.payout_min_cents', 5000);

        // 8. Referral URLs (pointing to Next.js Frontend catalog where cookies are captured)
        $baseUrl = rtrim((string) env('FRONTEND_URL', config('app.frontend_url', 'http://localhost:3000')), '/');
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
                    'sales_commission_rate_percent' => 25,
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
                return [
                    'ar' => "عمولة مبيعات 25% من طلب دورة ({$orderNum})",
                    'en' => "25% sales commission from course order ({$orderNum})",
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
