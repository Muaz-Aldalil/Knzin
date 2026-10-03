<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminDrawResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $effectiveStatus = method_exists($this->resource, 'computeEffectiveStatus')
            ? $this->resource->computeEffectiveStatus()
            : $this->status;

        $stage = 'draft';
        if ($this->is_published) {
            $stage = match ($effectiveStatus) {
                'upcoming' => 'published_upcoming',
                'active' => 'active',
                'locked' => 'locked',
                'completed' => 'completed',
                default => 'published',
            };
        }

        return [
            'id' => $this->id,
            'tier' => $this->tier,
            'execution_type' => $this->execution_type,
            'status' => $this->status,
            'effective_status' => $effectiveStatus,
            'stage' => $stage,
            'is_published' => (bool) $this->is_published,
            'published_at' => $this->published_at?->toIso8601String(),
            'published_by_user_id' => $this->published_by_user_id,
            'title_ar' => $this->title_ar,
            'title_en' => $this->title_en,
            'starts_at' => $this->starts_at?->toIso8601String(),
            'ends_at' => $this->ends_at?->toIso8601String(),
            'broadcast_url' => $this->broadcast_url,
            'server_seed_hash' => $this->server_seed_hash,
            'seed_committed_at' => $this->seed_committed_at?->toIso8601String(),
            'server_seed_revealed' => $this->server_seed_revealed,
            'seed_revealed_at' => $this->seed_revealed_at?->toIso8601String(),
            'seed_commitment_hash' => $this->server_seed_hash,
            'revealed_server_seed' => $this->server_seed_revealed,
            'seed_commitment' => $this->server_seed_hash ? [
                'server_seed_hash' => $this->server_seed_hash,
                'committed_at' => $this->seed_committed_at?->toIso8601String(),
            ] : null,
            'seed_verification' => $this->server_seed_revealed ? [
                'server_seed_hash' => $this->server_seed_hash,
                'server_seed_revealed' => $this->server_seed_revealed,
                'revealed_at' => $this->seed_revealed_at?->toIso8601String(),
            ] : null,
            'prizes' => $this->whenLoaded('prizes'),
            'winner' => $this->whenLoaded('winner'),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
