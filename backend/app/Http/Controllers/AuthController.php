<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\GoogleAuthService;
use App\Services\OtpAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends ApiController
{
    public function __construct(
        protected GoogleAuthService $googleAuthService,
        protected OtpAuthService $otpAuthService
    ) {}

    /**
     * Authenticate or register guest buyer and issue Sanctum token.
     */
    public function guest(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
        ]);

        $email = strtolower(trim($validated['email']));

        $user = User::where('email', $email)
            ->where('status', 'active')
            ->first();

        if ($user) {
            $code = ($user->auth_provider === 'google') ? 'AUTH_GOOGLE_ACCOUNT_EXISTS' : 'AUTH_ACCOUNT_EXISTS';
            return $this->failResponse(
                $code,
                'هذا البريد الإلكتروني مسجل بحساب مسبقاً. يرجى تسجيل الدخول للوصول إلى حسابك.',
                [],
                Response::HTTP_CONFLICT
            );
        } else {
            $user = User::create([
                'email' => $email,
                'display_name' => 'ضيف',
                'auth_provider' => 'guest',
                'status' => 'active',
            ]);
        }

        $token = $user->createToken('guest_session_token')->plainTextToken;

        return $this->successResponse([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'display_name' => $user->display_name,
                'displayName' => $user->display_name,
                'auth_provider' => $user->auth_provider,
                'authProvider' => $user->auth_provider,
                'is_verified' => $user->isVerified(),
                'isVerified' => $user->isVerified(),
            ],
        ]);
    }

    /**
     * Request a one-time password code sent to user email.
     */
    public function sendOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
        ]);

        $result = $this->otpAuthService->sendOtp(
            $validated['email'],
            $request->ip()
        );

        return $this->successResponse([
            'message' => 'تم إرسال رمز التحقق إلى بريدك الإلكتروني بنجاح.',
            'email' => $result['email'],
            'expires_in_seconds' => $result['expires_in_seconds'],
            'dev_code' => $result['dev_code'],
        ]);
    }

    /**
     * Validate one-time password code and issue authenticated web session token.
     */
    public function verifyOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
            'code' => ['required', 'string', 'min:6', 'max:6'],
        ]);

        $result = $this->otpAuthService->verifyOtp(
            $validated['email'],
            $validated['code']
        );

        $user = $result['user'];

        return $this->successResponse([
            'token' => $result['token'],
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'display_name' => $user->display_name,
                'displayName' => $user->display_name,
                'auth_provider' => $user->auth_provider,
                'authProvider' => $user->auth_provider,
                'is_verified' => $user->isVerified(),
                'isVerified' => $user->isVerified(),
            ],
            'merge_stats' => $result['merge_stats'],
        ]);
    }

    /**
     * Get current authenticated user profile.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return $this->failResponse('ERR_UNAUTHORIZED', 'Unauthenticated', [], Response::HTTP_UNAUTHORIZED);
        }

        return $this->successResponse([
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'display_name' => $user->display_name,
                'displayName' => $user->display_name,
                'auth_provider' => $user->auth_provider,
                'authProvider' => $user->auth_provider,
                'is_verified' => $user->isVerified(),
                'isVerified' => $user->isVerified(),
            ],
        ]);
    }

    /**
     * Invalidate current authenticated session token.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user) {
            $user->currentAccessToken()?->delete();
        }

        return $this->successResponse([
            'message' => 'تم تسجيل الخروج بنجاح.',
        ]);
    }

    /**
     * Redirect to Google OAuth consent screen or local mock callback.
     */
    public function googleRedirect(Request $request): RedirectResponse
    {
        return $this->googleAuthService->getRedirectResponse(
            $request->input('mock_email'),
            $request->input('redirect')
        );
    }

    /**
     * Handle Google OAuth callback, issue token, and redirect to frontend.
     */
    public function googleCallback(Request $request): RedirectResponse
    {
        $result = $this->googleAuthService->handleCallback($request);

        $params = [
            'token' => $result['token'],
            'email' => $result['user']->email,
            'name' => $result['user']->display_name,
            'merged_orders' => $result['merge_stats']['merged_orders_count'] ?? 0,
        ];

        if ($request->filled('redirect')) {
            $params['redirect'] = $request->input('redirect');
        }

        $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
        $redirectUrl = rtrim($frontendUrl, '/') . '/ar/auth/callback?' . http_build_query($params);

        return redirect()->away($redirectUrl);
    }
}
