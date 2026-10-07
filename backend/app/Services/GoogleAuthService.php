<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class GoogleAuthService
{
    public function __construct(
        protected AccountMergeService $mergeService
    ) {}

    /**
     * Check if Google OAuth mock mode is enabled for deterministic offline development.
     *
     * Mock mode accepts an arbitrary email without verification, so it is only ever
     * honoured in local/testing environments regardless of the configuration flag.
     */
    public function isMockMode(): bool
    {
        return (bool) config('services.google.mock', false);
    }

    /**
     * Real Google OAuth (Socialite) is not implemented. Outside mock mode this must fail
     * closed rather than authenticate a placeholder identity.
     */
    protected function failGoogleNotConfigured(): never
    {
        throw new HttpResponseException(response()->json([
            'status' => 'fail',
            'code' => 'ERR_GOOGLE_AUTH_UNAVAILABLE',
            'message' => 'Google sign-in is not available. Please sign in with your email verification code.',
        ], 503));
    }

    /**
     * Generate redirect response for Google OAuth (mock or real).
     */
    public function getRedirectResponse(?string $mockEmail = null, ?string $redirect = null): RedirectResponse
    {
        if ($this->isMockMode()) {
            $email = $mockEmail ?: 'mock_student_' . Str::random(5) . '@example.com';
            $name = 'طالب كَنزين';
            if ($mockEmail) {
                $existingUser = User::where('email', $email)->first();
                if ($existingUser && !empty($existingUser->display_name)) {
                    $name = $existingUser->display_name;
                } elseif (str_contains($email, 'affiliate_a')) {
                    $name = 'المسوّق أ';
                } elseif (str_contains($email, 'customer_b')) {
                    $name = 'العميل ب';
                }
            }
            $params = [
                'mock_email' => $email,
                'mock_name' => $name,
                'mock_sub' => 'mock_google_sub_' . md5($email),
            ];
            if ($redirect) {
                $params['redirect'] = $redirect;
            }
            $callbackUrl = url('/api/v1/auth/google/callback') . '?' . http_build_query($params);

            return redirect()->away($callbackUrl);
        }

        $this->failGoogleNotConfigured();
    }

    /**
     * Process Google OAuth callback, authenticate or create verified user, and execute one-way merge.
     */
    public function handleCallback(Request $request): array
    {
        if ($this->isMockMode()) {
            $email = strtolower(trim((string) $request->input('mock_email', 'mock_student@example.com')));
            $name = (string) $request->input('mock_name', 'طالب كَنزين');
            $providerId = (string) $request->input('mock_sub', 'mock_sub_' . md5($email));
            $avatarUrl = 'https://ui-avatars.com/api/?name=' . urlencode($name);
        } else {
            $this->failGoogleNotConfigured();
        }

        // Find or create Google authenticated user
        $googleUser = User::where('email', $email)
            ->where('auth_provider', 'google')
            ->first();

        if (!$googleUser) {
            $googleUser = User::create([
                'email' => $email,
                'display_name' => $name,
                'auth_provider' => 'google',
                'provider_id' => $providerId,
                'avatar_url' => $avatarUrl,
                'status' => 'active',
                'email_verified_at' => now(),
            ]);
        } else {
            // Ensure verified timestamp and active status
            $googleUser->update([
                'status' => 'active',
                'email_verified_at' => $googleUser->email_verified_at ?? now(),
                'provider_id' => $providerId,
                'avatar_url' => $avatarUrl ?? $googleUser->avatar_url,
            ]);
        }

        // Execute one-way merge: re-attribute all unverified guest orders to this verified account
        $mergeStats = $this->mergeService->mergeGuestIntoGoogle($googleUser);

        // Issue Sanctum API token
        $token = $googleUser->createToken('google_auth_token')->plainTextToken;

        return [
            'user' => $googleUser,
            'token' => $token,
            'merge_stats' => $mergeStats,
        ];
    }
}
