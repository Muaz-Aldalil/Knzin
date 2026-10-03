<?php

namespace App\Services\Admin;

use App\Exceptions\AdminStateConflictException;
use App\Exceptions\ProtectedFieldException;
use App\Models\Draw;
use App\Models\DrawWinner;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DrawLifecycleService
{
    public function __construct(
        private readonly DrawSeedService $seedService = new DrawSeedService(),
        private readonly AdminAuditWriter $auditWriter = new AdminAuditWriter()
    ) {
    }

    /**
     * Create a new draw in private draft state.
     */
    public function createDraft(array $data, User $actor, ?AdminAuditContext $auditContext = null): Draw
    {
        return DB::transaction(function () use ($data, $auditContext) {
            $draw = Draw::create([
                'tier' => $data['tier'],
                'execution_type' => $data['execution_type'] ?? 'scheduled',
                'title_ar' => $data['title_ar'],
                'title_en' => $data['title_en'],
                'status' => 'upcoming',
                'is_published' => false,
                'starts_at' => $data['starts_at'],
                'ends_at' => $data['ends_at'],
                'broadcast_url' => $data['broadcast_url'] ?? null,
                'total_eligible_tickets' => 0,
            ]);

            if ($auditContext) {
                $this->auditWriter->record(
                    context: $auditContext,
                    action: 'draw.created',
                    targetType: 'draw',
                    targetId: $draw->id,
                    beforeState: null,
                    afterState: [
                        'tier' => $draw->tier,
                        'title_en' => $draw->title_en,
                        'starts_at' => $draw->starts_at?->toIso8601String(),
                        'ends_at' => $draw->ends_at?->toIso8601String(),
                        'is_published' => false,
                    ]
                );
            }

            return $draw;
        });
    }

    /**
     * Update an operational draw obeying D1-D9 integrity boundaries.
     */
    public function update(Draw $draw, array $data, User $actor, ?AdminAuditContext $auditContext = null): Draw
    {
        return DB::transaction(function () use ($draw, $data, $auditContext) {
            // Lock row for update
            /** @var Draw $lockedDraw */
            $lockedDraw = Draw::where('id', $draw->id)->lockForUpdate()->firstOrFail();

            // Invariant: Concluded draws can only update US6 AC5 metadata
            if ($lockedDraw->status === 'completed') {
                $allowedOnCompleted = ['broadcast_url'];
                foreach (array_keys($data) as $field) {
                    if (!in_array($field, $allowedOnCompleted, true)) {
                        throw new ProtectedFieldException("Field '{$field}' cannot be modified on a concluded draw.");
                    }
                }
            }

            // Invariant D1: Tier cannot be changed if stored completed or effective active (now >= starts_at)
            if (array_key_exists('tier', $data) && $data['tier'] !== $lockedDraw->tier) {
                if ($lockedDraw->status === 'completed' || ($lockedDraw->starts_at && Carbon::now()->greaterThanOrEqualTo($lockedDraw->starts_at))) {
                    throw new AdminStateConflictException('Cannot change tier on an active or concluded draw.');
                }
            }

            // Invariant D4: Schedule dates read-only only while a draw_winners row exists
            $hasWinner = DrawWinner::where('draw_id', $lockedDraw->id)->exists();
            if ($hasWinner) {
                if (array_key_exists('starts_at', $data) && $lockedDraw->starts_at && $data['starts_at'] != $lockedDraw->starts_at) {
                    throw new AdminStateConflictException('Schedule starts_at is read-only after canonical winner record is created.');
                }
                if (array_key_exists('ends_at', $data) && $lockedDraw->ends_at && $data['ends_at'] != $lockedDraw->ends_at) {
                    throw new AdminStateConflictException('Schedule ends_at is read-only after canonical winner record is created.');
                }
            }

            $newStartsAt = array_key_exists('starts_at', $data) ? Carbon::parse($data['starts_at']) : $lockedDraw->starts_at;
            $newEndsAt = array_key_exists('ends_at', $data) ? Carbon::parse($data['ends_at']) : $lockedDraw->ends_at;

            // Invariant D2: ends_at > starts_at
            if ($newStartsAt && $newEndsAt && $newEndsAt->lessThanOrEqualTo($newStartsAt)) {
                throw ValidationException::withMessages([
                    'ends_at' => ['Draw ends_at must be strictly after starts_at.'],
                ]);
            }

            // Invariant D3: If seed committed, starts_at >= seed_committed_at
            if ($lockedDraw->seed_committed_at && $newStartsAt) {
                if ($newStartsAt->lessThan($lockedDraw->seed_committed_at)) {
                    throw new AdminStateConflictException('starts_at cannot be set earlier than cryptographic seed commitment time.');
                }
            }

            $before = $lockedDraw->only([
                'title_ar', 'title_en', 'tier', 'execution_type',
                'starts_at', 'ends_at', 'broadcast_url'
            ]);

            $lockedDraw->update(array_filter([
                'title_ar' => $data['title_ar'] ?? $lockedDraw->title_ar,
                'title_en' => $data['title_en'] ?? $lockedDraw->title_en,
                'tier' => $data['tier'] ?? $lockedDraw->tier,
                'execution_type' => $data['execution_type'] ?? $lockedDraw->execution_type,
                'starts_at' => $newStartsAt,
                'ends_at' => $newEndsAt,
                'broadcast_url' => array_key_exists('broadcast_url', $data) ? $data['broadcast_url'] : $lockedDraw->broadcast_url,
            ], fn ($v) => $v !== null));

            if ($auditContext) {
                $this->auditWriter->record(
                    context: $auditContext,
                    action: 'draw.updated',
                    targetType: 'draw',
                    targetId: $lockedDraw->id,
                    beforeState: $before,
                    afterState: $lockedDraw->only(array_keys($before))
                );
            }

            return $lockedDraw;
        });
    }

    /**
     * Atomically publish a draw with cryptographic pre-commitment before window opens.
     */
    public function publish(Draw $draw, User $actor, ?AdminAuditContext $auditContext = null): Draw
    {
        return DB::transaction(function () use ($draw, $actor, $auditContext) {
            /** @var Draw $lockedDraw */
            $lockedDraw = Draw::where('id', $draw->id)->lockForUpdate()->firstOrFail();

            if ($lockedDraw->is_published) {
                throw new AdminStateConflictException('Draw is already published.');
            }

            if ($lockedDraw->server_seed_hash !== null) {
                throw new AdminStateConflictException('Draw already has a committed seed.');
            }

            if ($lockedDraw->starts_at && Carbon::now()->greaterThanOrEqualTo($lockedDraw->starts_at)) {
                throw new AdminStateConflictException('Cannot publish draw: schedule starts_at has already passed.');
            }

            $commitment = $this->seedService->generateAndCommit($lockedDraw);

            $lockedDraw->update([
                'server_seed_hash' => $commitment['hash'],
                'server_seed_encrypted' => $commitment['encrypted'],
                'seed_committed_at' => $commitment['committed_at'],
                'is_published' => true,
                'published_at' => now(),
                'published_by_user_id' => $actor->id,
            ]);

            if ($auditContext) {
                $this->auditWriter->record(
                    context: $auditContext,
                    action: 'draw.published',
                    targetType: 'draw',
                    targetId: $lockedDraw->id,
                    beforeState: ['is_published' => false],
                    afterState: [
                        'is_published' => true,
                        'server_seed_hash' => $commitment['hash'],
                        'seed_committed_at' => $commitment['committed_at']->toIso8601String(),
                    ]
                );
            }

            return $lockedDraw;
        });
    }

    /**
     * Mark a draw as completed and reveal the cryptographic seed for an existing canonical winner.
     */
    public function complete(Draw $draw, User $actor, ?AdminAuditContext $auditContext = null): Draw
    {
        return DB::transaction(function () use ($draw, $auditContext) {
            /** @var Draw $lockedDraw */
            $lockedDraw = Draw::where('id', $draw->id)->lockForUpdate()->firstOrFail();

            if ($lockedDraw->status === 'completed') {
                // Idempotent replay
                return $lockedDraw;
            }

            // Invariant: Canonical winner record MUST exist before marking completed
            $hasWinner = DrawWinner::where('draw_id', $lockedDraw->id)->exists();
            if (!$hasWinner) {
                throw new AdminStateConflictException('ERR_CANONICAL_RESULT_MISSING: Cannot complete draw without an existing canonical winner record.');
            }

            $revealedSeed = null;
            if ($lockedDraw->server_seed_hash !== null && $lockedDraw->server_seed_encrypted !== null) {
                $revealedSeed = $this->seedService->reveal($lockedDraw);
            }

            $lockedDraw->update([
                'status' => 'completed',
                'server_seed_revealed' => $revealedSeed,
                'seed_revealed_at' => $revealedSeed !== null ? now() : null,
            ]);

            if ($auditContext) {
                $this->auditWriter->record(
                    context: $auditContext,
                    action: 'draw.completed',
                    targetType: 'draw',
                    targetId: $lockedDraw->id,
                    beforeState: ['status' => $lockedDraw->getOriginal('status')],
                    afterState: [
                        'status' => 'completed',
                        'has_revealed_seed' => $revealedSeed !== null,
                    ]
                );
            }

            return $lockedDraw;
        });
    }

    /**
     * Update post-draw winner metadata.
     */
    public function updateWinnerMetadata(Draw $draw, array $data, User $actor, ?AdminAuditContext $auditContext = null): DrawWinner
    {
        return DB::transaction(function () use ($draw, $data, $auditContext) {
            $winner = DrawWinner::where('draw_id', $draw->id)->first();
            if (!$winner) {
                throw new AdminStateConflictException('No canonical winner record exists for this draw.');
            }

            $before = $winner->only([
                'winner_masked_name', 'winner_governorate', 'prize_delivered', 'stream_recording_url'
            ]);

            $winner->update(array_filter([
                'winner_masked_name' => $data['winner_masked_name'] ?? $winner->winner_masked_name,
                'winner_governorate' => $data['winner_governorate'] ?? $winner->winner_governorate,
                'prize_delivered' => array_key_exists('prize_delivered', $data) ? (bool) $data['prize_delivered'] : $winner->prize_delivered,
                'stream_recording_url' => array_key_exists('stream_recording_url', $data) ? $data['stream_recording_url'] : $winner->stream_recording_url,
            ], fn ($v) => $v !== null));

            if ($auditContext) {
                $this->auditWriter->record(
                    context: $auditContext,
                    action: 'winner.metadata_updated',
                    targetType: 'draw_winner',
                    targetId: $winner->id,
                    beforeState: $before,
                    afterState: $winner->only(array_keys($before))
                );
            }

            return $winner;
        });
    }
}
