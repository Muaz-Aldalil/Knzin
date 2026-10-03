<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $activeCapabilities = $this->adminCapabilities
            ? $this->adminCapabilities->where('status', 'active')->pluck('capability')->values()->all()
            : [];

        return [
            'id' => $this->id,
            'email' => $this->email,
            'display_name' => $this->display_name,
            'learner_code' => $this->learner_code,
            'auth_provider' => $this->auth_provider,
            'status' => $this->status,
            'is_verified' => method_exists($this->resource, 'isVerified') ? $this->resource->isVerified() : !is_null($this->email_verified_at),
            'email_verified_at' => $this->email_verified_at?->toIso8601String(),
            'orders_count' => $this->orders_count ?? 0,
            'active_capabilities' => $activeCapabilities,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
