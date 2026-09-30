<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\GoogleAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends ApiController
{
    public function __construct(
        protected GoogleAuthService $googleAuthService
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
            if ($user->auth_provider === 'google' || $user->isVerified()) {
                return $this->failResponse(
                    'AUTH_GOOGLE_ACCOUNT_EXISTS',
                    'هذا البريد الإلكتروني مسجل بحساب Google مفعل. يرجى تسجيل الدخول عبر Google.',
                    [],
                    Response::HTTP_CONFLICT
                );
            }
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
     * Redirect to Google OAuth consent screen or local mock callback.
     */
    public function googleRedirect(Request $request): RedirectResponse
    {
        return $this->googleAuthService->getRedirectResponse(
            $request->input('mock_email')
        );
    }

    /**
     * Handle Google OAuth callback, issue token, and redirect to frontend.
     */
    public function googleCallback(Request $request): RedirectResponse
    {
        $result = $this->googleAuthService->handleCallback($request);

        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
        $redirectUrl = rtrim($frontendUrl, '/') . '/ar/auth/callback?' . http_build_query([
            'token' => $result['token'],
            'email' => $result['user']->email,
            'name' => $result['user']->display_name,
            'merged_orders' => $result['merge_stats']['merged_orders_count'] ?? 0,
        ]);

        return redirect()->away($redirectUrl);
    }
}
