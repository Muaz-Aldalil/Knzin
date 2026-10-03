<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class OtpAuthService
{
    public const CODE_TTL_SECONDS = 600; // 10 minutes
    public const MAX_VERIFY_ATTEMPTS = 5;
    public const MAX_SEND_RATE = 5; // 5 send requests per 10 minutes

    public function __construct(
        protected AccountMergeService $mergeService
    ) {}

    /**
     * Generate, cache, and transmit a 6-digit OTP code to the requested email.
     */
    public function sendOtp(string $email, ?string $clientIp = null): array
    {
        $normalizedEmail = strtolower(trim($email));

        // 1. Rate-limiting check per email
        $rateKey = 'otp_rate:' . sha1($normalizedEmail);
        $attempts = (int) Cache::get($rateKey, 0);

        if ($attempts >= self::MAX_SEND_RATE) {
            throw ValidationException::withMessages([
                'email' => ['تم تجاوز الحد الأقصى لإرسال الرموز. يرجى المحاولة بعد بضع دقائق.'],
            ]);
        }

        Cache::put($rateKey, $attempts + 1, self::CODE_TTL_SECONDS);

        // 2. Cryptographically secure 6-digit integer
        $code = (string) random_int(100000, 999999);
        $codeHash = hash('sha256', $code);

        // 3. Cache the OTP with attempt counter
        $cacheKey = 'otp_auth:' . sha1($normalizedEmail);
        Cache::put($cacheKey, [
            'hash' => $codeHash,
            'attempts' => 0,
            'created_at' => now()->timestamp,
        ], self::CODE_TTL_SECONDS);

        // 4. Send email notification via Laravel Mail
        try {
            Mail::raw("رمز التحقق الخاص بك لمنصة كَنزين هو: {$code}\n\nهذا الرمز صالح لمدة 10 دقائق فقط. لا تشارك هذا الرمز مع أي شخص.", function ($message) use ($normalizedEmail) {
                $message->to($normalizedEmail)
                    ->subject('رمز التحقق لمنصة كَنزين (KNZiN)');
            });
        } catch (\Throwable $e) {
            // Mail transport error logged without breaking dev/testing
            logger()->warning('OTP email transmission failed: ' . $e->getMessage(), [
                'email' => $normalizedEmail,
            ]);
        }

        $isLocalOrTesting = app()->environment(['local', 'testing']);

        return [
            'email' => $normalizedEmail,
            'expires_in_seconds' => self::CODE_TTL_SECONDS,
            // Expose dev_code strictly in non-production environments for automated & local verification
            'dev_code' => $isLocalOrTesting ? $code : null,
        ];
    }

    /**
     * Validate supplied OTP code, verify user, merge guest assets, and issue Sanctum token.
     */
    public function verifyOtp(string $email, string $code): array
    {
        $normalizedEmail = strtolower(trim($email));
        $cacheKey = 'otp_auth:' . sha1($normalizedEmail);

        $cachedData = Cache::get($cacheKey);

        if (!$cachedData || !is_array($cachedData)) {
            throw ValidationException::withMessages([
                'code' => ['رمز التحقق غير صالح أو انتهت صلاحيته. يرجى طلب رمز جديد.'],
            ]);
        }

        // Increment failed attempt counter to protect against brute force
        $attempts = (int) ($cachedData['attempts'] ?? 0) + 1;
        $cachedData['attempts'] = $attempts;

        if ($attempts > self::MAX_VERIFY_ATTEMPTS) {
            Cache::forget($cacheKey);
            throw ValidationException::withMessages([
                'code' => ['تم تجاوز عدد المحاولات المسموح بها لهذا الرمز. يرجى طلب رمز جديد.'],
            ]);
        }

        // Verify hash
        $providedHash = hash('sha256', trim($code));
        if (!hash_equals($cachedData['hash'], $providedHash)) {
            Cache::put($cacheKey, $cachedData, self::CODE_TTL_SECONDS);
            throw ValidationException::withMessages([
                'code' => ['رمز التحقق غير صحيح. يرجى التأكد وإعادة المحاولة.'],
            ]);
        }

        // Immediately invalidate code to prevent replay
        Cache::forget($cacheKey);

        // Find or create verified user record
        $user = User::where('email', $normalizedEmail)
            ->where('auth_provider', 'google')
            ->first();

        if (!$user) {
            // Check if there is an unverified guest record with this email
            $guestUser = User::where('email', $normalizedEmail)
                ->where('auth_provider', 'guest')
                ->where('status', 'active')
                ->first();

            $displayName = $guestUser?->display_name && $guestUser->display_name !== 'ضيف'
                ? $guestUser->display_name
                : explode('@', $normalizedEmail)[0];

            $user = User::create([
                'email' => $normalizedEmail,
                'display_name' => $displayName,
                'auth_provider' => 'google',
                'provider_id' => 'email_otp_' . md5($normalizedEmail),
                'status' => 'active',
                'email_verified_at' => now(),
            ]);
        } else {
            $user->update([
                'status' => 'active',
                'email_verified_at' => $user->email_verified_at ?? now(),
            ]);
        }

        // Execute one-way account merge for any guest assets
        $mergeStats = $this->mergeService->mergeGuestIntoGoogle($user);

        // Issue Sanctum session token
        $token = $user->createToken('web_session_token')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
            'merge_stats' => $mergeStats,
        ];
    }
}
