<?php

namespace App\Http\Controllers;

use App\Exceptions\InsufficientAvailableBalanceException;
use App\Exceptions\PayoutThresholdUnmetException;
use App\Models\AffiliatePayout;
use App\Services\AffiliatePayoutService;
use App\Services\PlatformSettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AffiliatePayoutController extends Controller
{
    public function __construct(
        protected AffiliatePayoutService $payoutService,
        protected PlatformSettingsService $settingsService
    ) {}

    /**
     * Submit a cash withdrawal request.
     */
    public function requestPayout(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'amount_cents' => 'required|integer|min:1',
            'payout_method' => 'required|string|in:zain_cash,asia_hawala,western_union',
            'recipient_details' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'fail',
                'code' => 'ERR_VALIDATION',
                'message' => 'بيانات طلب السحب غير مكتملة أو غير صالحة.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        try {
            $payout = $this->payoutService->requestPayout(
                user: $user,
                amountCents: (int) $request->input('amount_cents'),
                payoutMethod: (string) $request->input('payout_method'),
                recipientDetails: (array) $request->input('recipient_details')
            );

            return response()->json([
                'status' => 'success',
                'data' => [
                    'payout_number' => $payout->payout_number,
                    'amount_cents' => $payout->amount_cents,
                    'amount_formatted' => '$' . number_format($payout->amount_cents / 100, 2),
                    'amount_iqd' => $payout->amount_iqd,
                    'threshold_cents_at_request' => $payout->threshold_cents_at_request,
                    'payout_method' => $payout->payout_method,
                    'status' => $payout->status,
                    'status_label_ar' => 'قيد المراجعة والتحويل',
                    'status_label_en' => 'Pending Review & Transfer',
                    'recipient_details' => $payout->recipient_details,
                    'remaining_available_cents' => $this->payoutService->calculateAvailableBalance($user->id),
                    'created_at' => $payout->created_at->toISOString(),
                ],
            ], 201);
        } catch (PayoutThresholdUnmetException $e) {
            return response()->json([
                'status' => 'fail',
                'code' => 'ERR_PAYOUT_THRESHOLD_UNMET',
                'message' => $e->getMessage(),
                'data' => [
                    'requested_amount_cents' => $e->requestedAmountCents,
                    'minimum_threshold_cents' => $e->minimumThresholdCents,
                    'minimum_threshold_formatted' => '$' . number_format($e->minimumThresholdCents / 100, 2),
                    'minimum_threshold_iqd' => intdiv($e->minimumThresholdCents * (int) $this->settingsService->get('platform.iqd_exchange_rate', 1310), 100),
                ],
            ], 422);
        } catch (InsufficientAvailableBalanceException $e) {
            return response()->json([
                'status' => 'fail',
                'code' => 'ERR_INSUFFICIENT_AVAILABLE_BALANCE',
                'message' => $e->getMessage(),
                'data' => [
                    'requested_amount_cents' => $e->requestedAmountCents,
                    'available_balance_cents' => $e->availableBalanceCents,
                    'pending_balance_cents' => $e->pendingBalanceCents,
                ],
            ], 422);
        }
    }

    /**
     * Get withdrawal request history for authenticated user.
     */
    public function history(Request $request): JsonResponse
    {
        $user = $request->user();

        $payouts = AffiliatePayout::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function (AffiliatePayout $payout) {
                return [
                    'payout_number' => $payout->payout_number,
                    'amount_cents' => $payout->amount_cents,
                    'amount_formatted' => '$' . number_format($payout->amount_cents / 100, 2),
                    'amount_iqd' => $payout->amount_iqd,
                    'threshold_cents_at_request' => $payout->threshold_cents_at_request,
                    'payout_method' => $payout->payout_method,
                    'status' => $payout->status,
                    'admin_reference_number' => $payout->admin_reference_number,
                    'created_at' => $payout->created_at->toISOString(),
                    'processed_at' => $payout->processed_at?->toISOString(),
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => [
                'payouts' => $payouts,
            ],
        ]);
    }
}
