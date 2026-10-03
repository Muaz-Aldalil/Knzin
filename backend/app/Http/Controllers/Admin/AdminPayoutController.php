<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\ApiController;
use App\Http\Requests\Admin\RejectPayoutRequest;
use App\Http\Requests\Admin\SettlePayoutRequest;
use App\Http\Resources\Admin\AdminPayoutResource;
use App\Models\AffiliatePayout;
use App\Services\Admin\ReceiptStorageService;
use App\Services\AffiliatePayoutService;
use App\Support\AdminCapabilities;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminPayoutController extends ApiController
{
    public function __construct(
        protected AffiliatePayoutService $payoutService,
        protected ReceiptStorageService $receiptStorage
    ) {
    }

    /**
     * List affiliate payouts with cursor pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min(50, max(1, (int) $request->query('per_page', 25)));
        $cursor = $request->query('cursor');
        $status = $request->query('status');
        $payoutNumber = $request->query('payout_number');

        $query = AffiliatePayout::with('user')->orderBy('id', 'desc');

        if ($status) {
            $query->where('status', $status);
        }

        if ($payoutNumber) {
            $query->where('payout_number', $payoutNumber);
        }

        if ($cursor) {
            $query->where('id', '<', (int) $cursor);
        }

        $payouts = $query->limit($perPage + 1)->get();

        $hasNextPage = $payouts->count() > $perPage;
        if ($hasNextPage) {
            $payouts = $payouts->slice(0, $perPage);
        }

        $nextCursor = $hasNextPage ? (string) $payouts->last()?->id : null;

        return $this->successResponse([
            'items' => AdminPayoutResource::collection($payouts),
            'next_cursor' => $nextCursor,
        ]);
    }

    /**
     * Settle an accepted affiliate payout with reference number and receipt file upload.
     */
    public function settle(SettlePayoutRequest $request, string $payoutNumber): JsonResponse
    {
        $payout = AffiliatePayout::where('payout_number', $payoutNumber)->firstOrFail();

        $stagedReceipt = null;
        try {
            $stagedReceipt = $this->receiptStorage->stage($request->file('receipt'));

            $auditContext = $request->auditContext(AdminCapabilities::SETTLE_AFFILIATE_PAYOUT);

            $settled = $this->payoutService->settlePayout(
                payout: $payout,
                adminReferenceNumber: (string) $request->input('reference_number'),
                adminId: $request->user()->id,
                adminNotes: $request->input('notes'),
                receiptPath: $stagedReceipt->path,
                receiptSha256: $stagedReceipt->sha256,
                auditContext: $auditContext
            );

            return $this->successResponse(new AdminPayoutResource($settled));
        } catch (\Throwable $e) {
            if ($stagedReceipt) {
                $this->receiptStorage->discard($stagedReceipt->path);
            }
            throw $e;
        }
    }

    /**
     * Reject an accepted payout and issue a compensating reversal credit.
     */
    public function reject(RejectPayoutRequest $request, string $payoutNumber): JsonResponse
    {
        $payout = AffiliatePayout::where('payout_number', $payoutNumber)->firstOrFail();

        $auditContext = $request->auditContext(AdminCapabilities::SETTLE_AFFILIATE_PAYOUT);

        $rejected = $this->payoutService->rejectPayout(
            payout: $payout,
            reason: (string) $request->input('reason'),
            adminId: $request->user()->id,
            auditContext: $auditContext
        );

        return $this->successResponse(new AdminPayoutResource($rejected));
    }
}
