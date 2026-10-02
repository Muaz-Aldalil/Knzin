<?php

namespace App\Http\Controllers;

use App\Services\AffiliateAttributionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReferralController extends Controller
{
    public function __construct(
        protected AffiliateAttributionService $attributionService
    ) {}

    /**
     * Public resolution endpoint for incoming referral links or vanity slugs.
     */
    public function resolve(Request $request, string $codeOrSlug): JsonResponse
    {
        $resolved = $this->attributionService->resolveReferralCode($codeOrSlug);

        if ($resolved === null) {
            return response()->json([
                'status' => 'fail',
                'code' => 'ERR_REFERRAL_CODE_NOT_FOUND',
                'message' => 'رمز الإحالة غير صالح أو غير نشط.',
                'data' => [
                    'valid' => false,
                ],
            ], 404);
        }

        // Check if an authenticated user is trying to resolve their own referral link
        $currentUser = auth('sanctum')->user();
        if ($currentUser !== null) {
            if ($this->attributionService->isSelfReferral($resolved['referrer_id'], $currentUser->id, $currentUser->email)) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'ERR_SELF_REFERRAL_FORBIDDEN',
                    'message' => 'لا يمكنك استخدام رابط الإحالة الخاص بحسابك لتسجيل مشترياتك الشخصية.',
                    'data' => [
                        'valid' => false,
                        'is_self_referral' => true,
                    ],
                ], 422);
            }
        }

        return response()->json([
            'status' => 'success',
            'data' => $resolved,
        ], 200);
    }
}
