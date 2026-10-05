<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\AdminCapabilities;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSessionController extends Controller
{
    /**
     * Return authenticated admin profile, active capabilities, and session telemetry.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        $activeCapabilities = [];
        foreach (AdminCapabilities::ALL as $capability) {
            if ($user && $user->hasCapability($capability)) {
                $activeCapabilities[] = $capability;
            }
        }

        $sessionTelemetry = $this->resolveSessionTelemetry($user);

        return response()->json([
            'status' => 'success',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'display_name' => $user->display_name ?? explode('@', (string) $user->email)[0],
                    'status' => $user->status,
                ],
                'capabilities' => $activeCapabilities,
                'session' => $sessionTelemetry,
                'server_time_utc' => now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * Extend the active administrative session by resetting the token lifetime.
     */
    public function extend(Request $request): JsonResponse
    {
        $user = $request->user();
        $token = $user?->currentAccessToken();

        if ($token) {
            $token->forceFill(['created_at' => now()])->save();
        }

        $sessionTelemetry = $this->resolveSessionTelemetry($user);

        return response()->json([
            'status' => 'success',
            'message' => 'Admin session extended successfully.',
            'data' => [
                'session' => $sessionTelemetry,
                'server_time_utc' => now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * Calculate authoritative session expiration telemetry.
     */
    protected function resolveSessionTelemetry($user): array
    {
        $token = $user?->currentAccessToken();
        $maxAgeMinutes = (int) config('knzin.admin.session_max_age_minutes', 480);

        $createdAt = ($token && $token->created_at)
            ? $token->created_at
            : now();

        $expiresAt = $createdAt->copy()->addMinutes($maxAgeMinutes);
        $remainingSeconds = max(0, (int) now()->diffInSeconds($expiresAt, false));

        return [
            'created_at' => $createdAt->toIso8601String(),
            'expires_at' => $expiresAt->toIso8601String(),
            'remaining_seconds' => $remainingSeconds,
            'max_age_minutes' => $maxAgeMinutes,
        ];
    }
}
