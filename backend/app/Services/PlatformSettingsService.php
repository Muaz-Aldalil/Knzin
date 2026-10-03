<?php

namespace App\Services;

use App\Models\PlatformSetting;
use App\Models\User;
use App\Services\Admin\AdminAuditContext;
use App\Services\Admin\AdminAuditWriter;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class PlatformSettingsService
{
    private const ALLOWED_ADMIN_SETTINGS = [
        'affiliate.commission_rate_bps' => [
            'type' => 'integer',
            'min' => 0,
            'max' => 10000,
        ],
        'affiliate.payout_min_cents' => [
            'type' => 'integer',
            'min' => 0,
            'max' => null,
        ],
    ];

    public function __construct(
        private readonly AdminAuditWriter $auditWriter = new AdminAuditWriter()
    ) {
    }

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
        $trustedActor = $actor ?? Auth::user();

        if ($trustedActor === null) {
            throw new AuthorizationException('Unauthenticated actor cannot mutate platform settings.');
        }

        if (!Gate::forUser($trustedActor)->allows('manage_platform_settings')) {
            throw new AuthorizationException("User [{$trustedActor->id}] lacks required persistent capability 'manage_platform_settings'.");
        }

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

    /**
     * Atomically update multiple platform settings with validation and synchronous auditing.
     */
    public function setMany(array $settings, User $actor, ?AdminAuditContext $auditContext = null): void
    {
        if (!Gate::forUser($actor)->allows('manage_platform_settings')) {
            throw new AuthorizationException("User [{$actor->id}] lacks required persistent capability 'manage_platform_settings'.");
        }

        // Validate each key and value against approved typed registry
        foreach ($settings as $key => $value) {
            if (!array_key_exists($key, self::ALLOWED_ADMIN_SETTINGS)) {
                throw ValidationException::withMessages([
                    'settings' => ["Platform setting '{$key}' cannot be modified via administrative settings."],
                ]);
            }

            $rules = self::ALLOWED_ADMIN_SETTINGS[$key];
            if (!is_int($value) && !ctype_digit((string) $value)) {
                throw ValidationException::withMessages([
                    $key => ["Setting '{$key}' must be an integer."],
                ]);
            }

            $intValue = (int) $value;
            if ($rules['min'] !== null && $intValue < $rules['min']) {
                throw ValidationException::withMessages([
                    $key => ["Setting '{$key}' must be at least {$rules['min']}."],
                ]);
            }

            if ($rules['max'] !== null && $intValue > $rules['max']) {
                throw ValidationException::withMessages([
                    $key => ["Setting '{$key}' must not exceed {$rules['max']}."],
                ]);
            }
        }

        DB::transaction(function () use ($settings, $actor, $auditContext) {
            $before = [];
            $after = [];

            foreach ($settings as $key => $value) {
                $intValue = (int) $value;
                $existing = PlatformSetting::where('key', $key)->first();
                $before[$key] = $existing ? $existing->value : config("knzin.{$key}");

                PlatformSetting::updateOrCreate(
                    ['key' => $key],
                    [
                        'value' => $intValue,
                        'updated_by_user_id' => $actor->id,
                    ]
                );

                $after[$key] = $intValue;
            }

            if ($auditContext) {
                $this->auditWriter->record(
                    context: $auditContext,
                    action: 'settings.updated',
                    targetType: 'setting',
                    targetId: implode(',', array_keys($settings)),
                    beforeState: $before,
                    afterState: $after
                );
            }
        });
    }
}
