<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Support\AdminCapabilities;
use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminPrincipal
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        /** @var User|null $user */
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'status' => 'fail',
                'code' => 'ERR_UNAUTHORIZED',
                'message' => 'Authentication required.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        // Safety guard: unsafe mock configuration outside local or testing
        $isMock = config('services.google.mock', false);
        $allowDemoAdmin = (bool) env('KNZIN_ALLOW_DEMO_ADMIN', false) || (bool) env('KNZIN_EXPOSE_DEV_OTP', false);
        if ($isMock && !$allowDemoAdmin && !app()->environment(['local', 'testing'])) {
            return response()->json([
                'status' => 'error',
                'code' => 'ERR_ADMIN_AUTH_UNSAFE_CONFIG',
                'message' => 'Admin access is disabled with mock authentication outside development/testing environments.',
            ], Response::HTTP_SERVICE_UNAVAILABLE);
        }

        // Validate Sanctum token type and session age
        $token = $user->currentAccessToken();
        if ($token instanceof PersonalAccessToken) {
            if ($token->name === 'guest_session_token') {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'ERR_FORBIDDEN',
                    'message' => 'Guest tokens are not authorized for administrative access.',
                ], Response::HTTP_FORBIDDEN);
            }

            $maxAgeMinutes = (int) config('knzin.admin.session_max_age_minutes', 480);
            if ($token->created_at && $token->created_at->addMinutes($maxAgeMinutes)->isPast()) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'ERR_ADMIN_SESSION_EXPIRED',
                    'message' => 'Admin session has expired. Please sign in again.',
                ], Response::HTTP_UNAUTHORIZED);
            }
        }

        // User account integrity checks
        if ($user->status !== 'active') {
            return response()->json([
                'status' => 'fail',
                'code' => 'ERR_FORBIDDEN',
                'message' => 'User account is not active.',
            ], Response::HTTP_FORBIDDEN);
        }

        if ($user->merged_into_user_id !== null) {
            return response()->json([
                'status' => 'fail',
                'code' => 'ERR_FORBIDDEN',
                'message' => 'Merged user accounts cannot perform administrative actions.',
            ], Response::HTTP_FORBIDDEN);
        }

        if (method_exists($user, 'isVerified') && !$user->isVerified()) {
            return response()->json([
                'status' => 'fail',
                'code' => 'ERR_FORBIDDEN',
                'message' => 'Unverified accounts cannot perform administrative actions.',
            ], Response::HTTP_FORBIDDEN);
        }

        // Must hold at least one active approved capability
        $hasAnyCapability = false;
        foreach (AdminCapabilities::ALL as $capability) {
            if ($user->hasCapability($capability)) {
                $hasAnyCapability = true;
                break;
            }
        }

        if (!$hasAnyCapability) {
            return response()->json([
                'status' => 'fail',
                'code' => 'ERR_FORBIDDEN',
                'message' => 'User holds no active administrative capabilities.',
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
