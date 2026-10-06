<?php

namespace App\Services\Admin;

use App\Exceptions\AdminStateConflictException;
use App\Models\Draw;
use App\Models\DrawWinner;
use App\Models\Prize;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class PrizeService
{
    public function __construct(
        private readonly AdminAuditWriter $auditWriter = new AdminAuditWriter()
    ) {
    }

    /**
     * Create a new prize for a draw.
     */
    public function createPrize(Draw $draw, array $data, User $actor, ?AdminAuditContext $auditContext = null): Prize
    {
        return DB::transaction(function () use ($draw, $data, $auditContext) {
            $lockedDraw = Draw::where('id', $draw->id)->lockForUpdate()->firstOrFail();
            if ($lockedDraw->status === 'completed') {
                throw new AdminStateConflictException('Cannot add prizes to a concluded draw.');
            }
            $valuationCents = isset($data['valuation_usd_cents']) ? (int) $data['valuation_usd_cents'] : 0;
            $defaultIqdLabel = number_format(($valuationCents / 100) * 1310) . ' IQD';

            $prize = $draw->prizes()->create([
                'title_ar' => $data['title_ar'],
                'title_en' => $data['title_en'],
                'description_ar' => $data['description_ar'] ?? null,
                'description_en' => $data['description_en'] ?? null,
                'display_iqd_label' => !empty($data['display_iqd_label']) ? $data['display_iqd_label'] : $defaultIqdLabel,
                'image_url' => !empty($data['image_url']) ? $data['image_url'] : 'https://knzin.com/assets/prizes/default.png',
                'valuation_usd_cents' => $valuationCents,
                'category' => in_array($data['category'] ?? '', ['cash', 'merchandise'], true) ? $data['category'] : 'merchandise',
            ]);

            if ($auditContext) {
                $this->auditWriter->record(
                    context: $auditContext,
                    action: 'prize.created',
                    targetType: 'prize',
                    targetId: $prize->id,
                    beforeState: null,
                    afterState: [
                        'draw_id' => $draw->id,
                        'title_en' => $prize->title_en,
                        'valuation_usd_cents' => $prize->valuation_usd_cents,
                    ]
                );
            }

            return $prize;
        });
    }

    /**
     * Update an existing prize.
     */
    public function updatePrize(Prize $prize, array $data, User $actor, ?AdminAuditContext $auditContext = null): Prize
    {
        return DB::transaction(function () use ($prize, $data, $auditContext) {
            $lockedDraw = Draw::where('id', $prize->draw_id)->lockForUpdate()->first();
            if ($lockedDraw && $lockedDraw->status === 'completed') {
                throw new AdminStateConflictException('Cannot modify prizes of a concluded draw.');
            }
            $before = $prize->only([
                'title_ar', 'title_en', 'description_ar', 'description_en',
                'display_iqd_label', 'image_url', 'valuation_usd_cents', 'category'
            ]);

            $prize->update(array_filter([
                'title_ar' => $data['title_ar'] ?? $prize->title_ar,
                'title_en' => $data['title_en'] ?? $prize->title_en,
                'description_ar' => array_key_exists('description_ar', $data) ? $data['description_ar'] : $prize->description_ar,
                'description_en' => array_key_exists('description_en', $data) ? $data['description_en'] : $prize->description_en,
                'display_iqd_label' => array_key_exists('display_iqd_label', $data) ? $data['display_iqd_label'] : $prize->display_iqd_label,
                'image_url' => array_key_exists('image_url', $data) ? $data['image_url'] : $prize->image_url,
                'valuation_usd_cents' => array_key_exists('valuation_usd_cents', $data) ? (int) $data['valuation_usd_cents'] : $prize->valuation_usd_cents,
                'category' => $data['category'] ?? $prize->category,
            ], fn ($v) => $v !== null));

            if ($auditContext) {
                $this->auditWriter->record(
                    context: $auditContext,
                    action: 'prize.updated',
                    targetType: 'prize',
                    targetId: $prize->id,
                    beforeState: $before,
                    afterState: $prize->only(array_keys($before))
                );
            }

            return $prize;
        });
    }

    /**
     * Delete an existing prize, verifying it is not referenced by a canonical winner.
     */
    public function deletePrize(Prize $prize, User $actor, ?AdminAuditContext $auditContext = null): void
    {
        DB::transaction(function () use ($prize, $auditContext) {
            $lockedDraw = Draw::where('id', $prize->draw_id)->lockForUpdate()->first();
            if ($lockedDraw && $lockedDraw->status === 'completed') {
                throw new AdminStateConflictException('Cannot delete prizes from a concluded draw.');
            }

            // Canonical winner protection
            $hasWinnerReference = DrawWinner::where('prize_id', $prize->id)->exists();
            if ($hasWinnerReference) {
                throw new AdminStateConflictException('Cannot delete prize: canonical winner record references this prize.');
            }

            $before = [
                'id' => $prize->id,
                'draw_id' => $prize->draw_id,
                'title_en' => $prize->title_en,
            ];

            $prize->delete();

            if ($auditContext) {
                $this->auditWriter->record(
                    context: $auditContext,
                    action: 'prize.deleted',
                    targetType: 'prize',
                    targetId: $before['id'],
                    beforeState: $before,
                    afterState: null
                );
            }
        });
    }
}
