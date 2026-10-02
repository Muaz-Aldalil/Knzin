<?php

namespace App\Services;

use App\Models\PlatformSetting;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class PlatformSettingsService
{
    /**
     * Retrieve a dynamic runtime setting with fallback to config and default.
     */
    public function get(string $key, mixed $default = null): mixed
    {
        try {
            $setting = PlatformSetting::where('key', $key)->first();
            if ($setting !== null && $setting->value !== null) {
                return $setting->value;
            }
        } catch (\Throwable $e) {
            // In case table hasn't migrated yet during bootstrapping, fallback gracefully
        }

        return config("knzin.{$key}", $default);
    }

    /**
     * Atomically upsert a runtime platform setting behind persistent Admin authorization.
     *
     * @throws AuthorizationException if actor is unauthenticated or lacks 'manage_platform_settings'
     */
    public function set(string $key, mixed $value, ?User $actor = null, ?string $description = null): void
    {
        // 1. Identify trusted admin identity from server-side auth context or explicitly passed trusted model
        $trustedActor = $actor ?? Auth::user();

        if ($trustedActor === null) {
            throw new AuthorizationException('Unauthenticated actor cannot mutate platform settings.');
        }

        // 2. Verify persistent server-side authorization capability
        if (!Gate::forUser($trustedActor)->allows('manage_platform_settings')) {
            throw new AuthorizationException("User [{$trustedActor->id}] lacks required persistent capability 'manage_platform_settings'.");
        }

        // 3. Atomically upsert the setting, binding the trusted actor ID for auditability
        DB::transaction(function () use ($key, $value, $trustedActor, $description) {
            $attributes = [
                'value' => $value,
                'updated_by_user_id' => $trustedActor->id,
            ];

            if ($description !== null) {
                $attributes['description'] = $description;
            }

            PlatformSetting::updateOrCreate(
                ['key' => $key],
                $attributes
            );
        });
    }
}
