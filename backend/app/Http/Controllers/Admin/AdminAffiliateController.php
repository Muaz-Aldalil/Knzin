<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\ApiController;
use App\Models\AffiliateLedgerEntry;
use App\Models\AffiliatePayout;
use App\Models\User;
use App\Services\AffiliatePayoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAffiliateController extends ApiController
{
    public function __construct(
        protected AffiliatePayoutService $payoutService
    ) {
    }

    /**
     * List affiliates with balance projections and pending payout counts.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min(50, max(1, (int) $request->query('per_page', 25)));
        $page = max(1, (int) $request->query('page', 1));
        $search = $request->query('search');
        $userId = $request->query('user_id');

        $query = User::query()->where('status', 'active');

        if ($userId) {
            $query->where('id', $userId);
        } elseif ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('email', 'like', "{$search}%")
                  ->orWhere('learner_code', $search)
                  ->orWhere('id', $search);
            });
        }

        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        $items = collect($paginator->items())->map(function (User $user) {
            $pendingPayoutCount = AffiliatePayout::where('user_id', $user->id)
                ->whereIn('status', ['requested', 'processing'])
                ->count();

            $availableCents = $this->payoutService->calculateAvailableBalance($user->id);
            $pendingCents = $this->payoutService->calculatePendingBalance($user->id);
            $lifetimeEarnedCents = $this->payoutService->calculateLifetimeEarned($user->id);

            return [
                'user_id' => $user->id,
                'email' => $user->email,
                'display_name' => $user->display_name,
                'learner_code' => $user->learner_code,
                'referral_code' => $user->learner_code,
                'available_cents' => $availableCents,
                'pending_cents' => $pendingCents,
                'lifetime_earned_cents' => $lifetimeEarnedCents,
                'pending_payout_count' => $pendingPayoutCount,
            ];
        });

        return $this->successResponse([
            'items' => $items,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    /**
     * Get read-only chronological ledger history for an affiliate.
     */
    public function ledger(Request $request, string $userId): JsonResponse
    {
        $user = User::findOrFail($userId);

        $perPage = min(50, max(1, (int) $request->query('per_page', 25)));
        $cursor = $request->query('cursor');
        $type = $request->query('type');

        $query = AffiliateLedgerEntry::where('user_id', $user->id)
            ->with(['order', 'payout'])
            ->orderBy('id', 'desc');

        if ($type && $type !== 'all') {
            $query->where('entry_type', $type);
        }

        if ($cursor) {
            $query->where('id', '<', (int) $cursor);
        }

        $entries = $query->limit($perPage + 1)->get();

        $hasNextPage = $entries->count() > $perPage;
        if ($hasNextPage) {
            $entries = $entries->slice(0, $perPage);
        }

        $nextCursor = $hasNextPage ? (string) $entries->last()?->id : null;

        $items = $entries->map(function (AffiliateLedgerEntry $entry) {
            return [
                'id' => $entry->id,
                'entry_type' => $entry->entry_type,
                'amount_cents' => $entry->amount_cents,
                'amount_usd' => round($entry->amount_cents / 100, 2),
                'currency' => $entry->currency,
                'status' => $entry->status,
                'funding_source' => $entry->funding_source,
                'idempotency_key' => $entry->idempotency_key,
                'matures_at' => $entry->matures_at?->toIso8601String(),
                'created_at' => $entry->created_at?->toIso8601String(),
                'order_number' => $entry->order?->order_number,
                'payout_number' => $entry->payout?->payout_number,
            ];
        });

        return $this->successResponse([
            'items' => $items,
            'next_cursor' => $nextCursor,
        ]);
    }
}
