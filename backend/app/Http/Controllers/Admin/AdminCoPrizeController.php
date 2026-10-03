<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\ApiController;
use App\Http\Requests\Admin\RevokeCoPrizeRequest;
use App\Models\AffiliateLedgerEntry;
use App\Services\AffiliateCoPrizeServiceInterface;
use App\Services\CoPrizeApprovalProviderInterface;
use App\Support\AdminCapabilities;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminCoPrizeController extends ApiController
{
    public function __construct(
        protected AffiliateCoPrizeServiceInterface $coPrizeService,
        protected CoPrizeApprovalProviderInterface $approvalProvider
    ) {
    }

    /**
     * List co-prize credits with complete approval provenance and revocation exposure preview.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min(50, max(1, (int) $request->query('per_page', 25)));
        $cursor = $request->query('cursor');
        $status = $request->query('status');

        $query = AffiliateLedgerEntry::where('entry_type', 'co_prize_credit')
            ->with(['order', 'user'])
            ->orderBy('id', 'desc');

        if ($status) {
            $query->where('status', $status);
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
            $ticketSerial = $entry->metadata['winning_ticket_serial'] ?? null;
            $approvalState = null;
            $preview = null;

            if ($ticketSerial) {
                try {
                    $state = $this->approvalProvider->getApprovalState($ticketSerial);
                    $approvalState = [
                        'is_fully_approved' => $state->isFullyApproved(),
                        'kyc' => [
                            'status' => $state->kyc->status,
                            'approval_id' => $state->kyc->approvalId,
                            'is_approved' => $state->kyc->isApproved(),
                            'version' => $state->kyc->record?->version,
                            'approved_by' => $state->kyc->record?->approved_by,
                            'revoked_at' => $state->kyc->record?->revoked_at?->toIso8601String(),
                            'superseded_at' => $state->kyc->record?->superseded_at?->toIso8601String(),
                        ],
                        'draw_integrity' => [
                            'status' => $state->drawIntegrity->status,
                            'approval_id' => $state->drawIntegrity->approvalId,
                            'is_approved' => $state->drawIntegrity->isApproved(),
                            'version' => $state->drawIntegrity->record?->version,
                            'approved_by' => $state->drawIntegrity->record?->approved_by,
                            'revoked_at' => $state->drawIntegrity->record?->revoked_at?->toIso8601String(),
                            'superseded_at' => $state->drawIntegrity->record?->superseded_at?->toIso8601String(),
                        ],
                        'draw_winner_exists' => $state->drawWinnerExists,
                    ];
                    $preview = $this->coPrizeService->previewRevocation($ticketSerial);
                } catch (\Throwable $e) {
                    // Fallback gracefully if provenance cannot be resolved
                }
            }

            return [
                'id' => $entry->id,
                'ticket_serial' => $ticketSerial,
                'user_id' => $entry->user_id,
                'user' => [
                    'id' => $entry->user?->id,
                    'email' => $entry->user?->email,
                    'display_name' => $entry->user?->display_name,
                ],
                'amount_cents' => $entry->amount_cents,
                'amount_usd' => round($entry->amount_cents / 100, 2),
                'status' => $entry->status,
                'funding_source' => $entry->funding_source,
                'created_at' => $entry->created_at?->toIso8601String(),
                'approval_provenance' => $approvalState,
                'revocation_preview' => $preview,
            ];
        });

        return $this->successResponse([
            'items' => $items,
            'next_cursor' => $nextCursor,
        ]);
    }

    /**
     * Adjudicate release of pending co-prize credit.
     */
    public function release(Request $request, string $serial): JsonResponse
    {
        $auditContext = (new \App\Http\Requests\Admin\RevokeCoPrizeRequest())->auditContext(
            AdminCapabilities::ADJUDICATE_AFFILIATE_COPRIZE
        );

        $released = $this->coPrizeService->adjudicateCoPrizeRelease(
            winningTicketSerial: $serial,
            adminUser: $request->user(),
            auditContext: $auditContext
        );

        return $this->successResponse([
            'entry' => $released,
            'status' => $released?->status,
        ]);
    }

    /**
     * Adjudicate post-release revocation of co-prize credit.
     */
    public function revoke(RevokeCoPrizeRequest $request, string $serial): JsonResponse
    {
        $auditContext = $request->auditContext(AdminCapabilities::ADJUDICATE_AFFILIATE_COPRIZE);

        $reversal = $this->coPrizeService->adjudicateCoPrizeRevocation(
            winningTicketSerial: $serial,
            reason: (string) $request->input('justification'),
            adminUser: $request->user(),
            auditContext: $auditContext
        );

        $preview = $this->coPrizeService->previewRevocation($serial);

        return $this->successResponse([
            'reversal_entry' => $reversal,
            'exposure_preview' => $preview,
        ]);
    }
}
