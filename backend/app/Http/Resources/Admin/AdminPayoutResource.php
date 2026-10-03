<?php

namespace App\Http\Resources\Admin;

use App\Support\AdminCapabilities;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminPayoutResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $canViewRecipient = AdminCapabilities::canViewRecipientDetails($request->user());

        $recipientDetails = null;
        if ($this->recipient_details) {
            if ($canViewRecipient) {
                $recipientDetails = $this->recipient_details;
            } else {
                $recipientDetails = ['masked' => true];
            }
        }

        return [
            'id' => $this->id,
            'payout_number' => $this->payout_number,
            'user_id' => $this->user_id,
            'amount_cents' => $this->amount_cents,
            'amount_usd' => round($this->amount_cents / 100, 2),
            'amount_iqd' => $this->amount_iqd,
            'threshold_cents_at_request' => $this->threshold_cents_at_request,
            'payout_method' => $this->payout_method,
            'recipient_details' => $recipientDetails,
            'status' => $this->status,
            'admin_reference_number' => $this->admin_reference_number,
            'receipt_sha256' => $this->receipt_sha256,
            'admin_notes' => $this->admin_notes,
            'processed_by_admin_id' => $this->processed_by_admin_id,
            'processed_at' => $this->processed_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'email' => $this->user->email,
                    'display_name' => $this->user->display_name,
                    'learner_code' => $this->user->learner_code,
                ];
            }),
        ];
    }
}
