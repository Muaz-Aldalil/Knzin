<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class GoogleAuthService
{
    public function __construct(
        protected AccountMergeService $mergeService
    ) {}

    /**
     * Check if Google OAuth mock mode is enabled for deterministic offline development.
     */
    public function isMockMode(): bool
    {
        return (bool) config('services.google.mock', true);
    }

    /**
     * Generate redirect response for Google OAuth (mock or real).
     */
    public function getRedirectResponse(?string $mockEmail = null): RedirectResponse
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
            $callbackUrl = url('/api/v1/auth/google/callback') . '?' . http_build_query([
                'mock_email' => $email,
                'mock_name' => $name,
                'mock_sub' => 'mock_google_sub_' . md5($email),
            ]);

            return redirect()->away($callbackUrl);
        }

        // Production Socialite redirect would go here
        return redirect()->away('https://accounts.google.com/o/oauth2/v2/auth');
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
            // Socialite driver handling in production
            $email = 'user@example.com';
            $name = 'Google User';
            $providerId = 'sub_prod_123';
            $avatarUrl = null;
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
