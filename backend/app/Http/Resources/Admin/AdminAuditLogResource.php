<?php

namespace App\Http\Resources\Admin;

use App\Services\Admin\AuditRedactor;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminAuditLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $redactor = app(AuditRedactor::class);

        return [
            'id' => $this->id,
            'request_id' => $this->request_id,
            'actor_user_id' => $this->actor_user_id,
            'actor' => $this->whenLoaded('actor', function () {
                return [
                    'id' => $this->actor->id,
                    'email' => $this->actor->email,
                    'display_name' => $this->actor->display_name,
                    'learner_code' => $this->actor->learner_code,
                ];
            }),
            'capability_used' => $this->capability_used,
            'action' => $this->action,
            'target_type' => $this->target_type,
            'target_id' => $this->target_id,
            'outcome' => $this->outcome,
            'reason_code' => $this->reason_code,
            'administrative_justification' => $this->administrative_justification,
            'before_state' => is_array($this->before_state) ? $redactor->redact($this->before_state) : null,
            'after_state' => is_array($this->after_state) ? $redactor->redact($this->after_state) : null,
            'ip_hash' => $this->ip_hash,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
