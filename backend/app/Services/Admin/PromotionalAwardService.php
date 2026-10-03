<?php

namespace App\Services\Admin;

use App\Models\Draw;
use App\Models\PromotionalAward;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PromotionalAwardService
{
    public function __construct(
        private readonly AdminAuditWriter $auditWriter = new AdminAuditWriter()
    ) {
    }

    /**
     * Grant a promotional award to an eligible user with full administrative provenance.
     */
    public function grant(array $data, User $actor, ?AdminAuditContext $auditContext = null): PromotionalAward
    {
        $recipient = $this->resolveRecipient($data['recipient_user_id']);

        $drawId = null;
        if (!empty($data['draw_id'])) {
            $draw = Draw::find($data['draw_id']);
            if (!$draw) {
                throw ValidationException::withMessages([
                    'draw_id' => ['Referenced draw not found.'],
                ]);
            }
            $drawId = $draw->id;
        }

        return DB::transaction(function () use ($recipient, $drawId, $data, $actor, $auditContext) {
            $award = PromotionalAward::create([
                'recipient_user_id' => $recipient->id,
                'draw_id' => $drawId,
                'award_title' => $data['award_title'],
                'award_details' => $data['award_details'] ?? null,
                'valuation_usd_cents' => isset($data['valuation_usd_cents']) ? (int) $data['valuation_usd_cents'] : null,
                'reason' => $data['reason'],
                'awarded_by_admin_id' => $actor->id,
                'created_at' => now(),
            ]);

            if ($auditContext) {
                $this->auditWriter->record(
                    context: $auditContext,
                    action: 'award.granted',
                    targetType: 'promotional_award',
                    targetId: (string) $award->id,
                    beforeState: null,
                    afterState: [
                        'recipient_user_id' => $recipient->id,
                        'draw_id' => $drawId,
                        'award_title' => $award->award_title,
                        'valuation_usd_cents' => $award->valuation_usd_cents,
                    ]
                );
            }

            return $award;
        });
    }

    private function resolveRecipient(string $identifier): User
    {
        if (preg_match('/^[0-9a-fA-F-]{36}$/', $identifier)) {
            $user = User::find($identifier);
            if ($user) {
                $this->assertRecipientEligible($user);
                return $user;
            }
        }

        $byCode = User::where('learner_code', $identifier)->first();
        if ($byCode) {
            $this->assertRecipientEligible($byCode);
            return $byCode;
        }

        throw ValidationException::withMessages([
            'recipient_user_id' => ['Recipient user not found.'],
        ]);
    }

    private function assertRecipientEligible(User $user): void
    {
        if ($user->status !== 'active') {
            throw ValidationException::withMessages([
                'recipient_user_id' => ['Recipient user account is not active.'],
            ]);
        }

        if ($user->merged_into_user_id !== null) {
            throw ValidationException::withMessages([
                'recipient_user_id' => ['Merged user accounts cannot receive awards.'],
            ]);
        }
    }
}
