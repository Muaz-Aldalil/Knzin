<?php

use App\Http\Controllers\ActivityController;
use App\Http\Controllers\AffiliateDashboardController;
use App\Http\Controllers\AffiliatePayoutController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DrawController;
use App\Http\Controllers\LessonPlaybackController;
use App\Http\Controllers\ProgressController;
use App\Http\Controllers\ReferralController;
use App\Http\Controllers\TicketController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('v1')->group(function () {
    // Auth Endpoints (US3) - Throttled 60 req/min (DEF-02G)
    Route::post('/auth/guest', [AuthController::class, 'guest'])->middleware('throttle:60,1');
    Route::post('/auth/otp/send', [AuthController::class, 'sendOtp'])->middleware('throttle:10,1');
    Route::post('/auth/otp/verify', [AuthController::class, 'verifyOtp'])->middleware('throttle:15,1');
    Route::get('/auth/google/redirect', [AuthController::class, 'googleRedirect']);
    Route::get('/auth/google/callback', [AuthController::class, 'googleCallback']);
    Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    Route::get('/auth/me', [AuthController::class, 'me'])->middleware('auth:sanctum');

    // Catalog Endpoints (US2)
    Route::get('/catalog/courses', [CatalogController::class, 'index']);
    Route::get('/catalog/courses/{slug}', [CatalogController::class, 'show']);

    // Promotional Draws Endpoints (US1 & US3)
    Route::get('/draws/active', [DrawController::class, 'active']);
    Route::get('/draws/concluded', [DrawController::class, 'concluded']);

    // Public Activity Feed Endpoints (US3 - Feature 004)
    Route::get('/activity/recent', [ActivityController::class, 'recent']);

    // Referral Resolution Endpoints (Feature 006 - US1)
    Route::get('/referrals/resolve/{codeOrSlug}', [ReferralController::class, 'resolve'])->middleware('throttle:60,1');

    // Checkout Endpoints (US1) - Throttled 60 req/min (DEF-02G)
    Route::post('/checkout/orders', [CheckoutController::class, 'store'])->middleware('throttle:60,1');
    Route::get('/checkout/orders/{orderNumber}', [CheckoutController::class, 'show']);

    // Learner Hub & Ticket Ledger (Feature 005)
    Route::get('/user/dashboard', [DashboardController::class, 'index'])->middleware('auth:sanctum');
    Route::get('/user/tickets', [TicketController::class, 'index'])->middleware('auth:sanctum');

    // Affiliate Portal Endpoints (Feature 006 - US4)
    Route::get('/affiliate/dashboard', [AffiliateDashboardController::class, 'dashboard'])->middleware('auth:sanctum');
    Route::get('/affiliate/ledger', [AffiliateDashboardController::class, 'ledger'])->middleware('auth:sanctum');

    // Affiliate Payout Endpoints (Feature 006 - US5)
    Route::post('/affiliate/payouts/request', [AffiliatePayoutController::class, 'requestPayout'])->middleware('auth:sanctum');
    Route::get('/affiliate/payouts', [AffiliatePayoutController::class, 'history'])->middleware('auth:sanctum');

    // Lesson Playback & Protected Resources (Feature 005)
    Route::post('/lessons/{courseSlug}/parts/{partNumber}/playback-auth', [LessonPlaybackController::class, 'playbackAuth']);
    Route::post('/lessons/{courseSlug}/parts/{partNumber}/downloads/{resourceId}', [LessonPlaybackController::class, 'downloadResource'])->middleware('auth:sanctum');

    // Progress & Continuation Endpoints (Scrimba & Vertex Alignment)
    Route::post('/progress', [ProgressController::class, 'recordProgress'])->middleware('auth:sanctum');
    Route::get('/user/active-learning', [ProgressController::class, 'getActiveLearning'])->middleware('auth:sanctum');
    Route::get('/courses/{slug}/progress', [ProgressController::class, 'getCourseProgress'])->middleware('auth:sanctum');

    // Media Protection Streaming & Downloads (US2 - Feature 005)
    Route::get('/media/stream/{courseSlug}/{partNumber}', function ($courseSlug, $partNumber, Request $request) {
        if ((int) $partNumber > 1 && !$request->hasValidSignature()) {
            abort(403, 'Invalid or expired media signature.');
        }

        $disk = Storage::disk('protected-media');
        $filePath = "videos/{$courseSlug}/part_{$partNumber}.mp4";

        if ($disk->exists($filePath)) {
            return $disk->response($filePath);
        }

        return response('SIMULATED_STREAM_CHUNKS_FOR_' . strtoupper($courseSlug) . '_PART_' . $partNumber, 200, [
            'Content-Type' => 'video/mp4',
            'Cache-Control' => 'no-cache, private',
        ]);
    })->name('api.media.stream');

    Route::get('/media/download/{courseSlug}/{partNumber}/{resourceId}', function ($courseSlug, $partNumber, $resourceId, Request $request) {
        if (!$request->hasValidSignature()) {
            abort(403, 'Invalid or expired download signature.');
        }

        $disk = Storage::disk('protected-media');
        $filePath = "downloads/{$courseSlug}/part_{$partNumber}/{$resourceId}.pdf";

        if ($disk->exists($filePath)) {
            return $disk->download($filePath);
        }

        return response('SIMULATED_PDF_DOWNLOAD_PAYLOAD_FOR_' . strtoupper($resourceId), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $resourceId . '.pdf"',
        ]);
    })->name('api.media.download');

    // Administrative Operations (Feature 008 — 30 Admin Routes)
    Route::prefix('admin')->middleware([
        'auth:sanctum',
        'admin.principal',
        'throttle:admin',
        'admin.request_id',
        'admin.audit_failures',
    ])->group(function () {
        // Session profile & capabilities (UI hint only)
        Route::get('/me', [\App\Http\Controllers\Admin\AdminSessionController::class, 'me']);

        // Platform settings (manage_platform_settings)
        Route::middleware('admin.capability:manage_platform_settings')->group(function () {
            Route::get('/settings', [\App\Http\Controllers\Admin\AdminSettingsController::class, 'show']);
            Route::patch('/settings', [\App\Http\Controllers\Admin\AdminSettingsController::class, 'update']);
        });

        // Affiliate oversight (manage_platform_settings OR settle_affiliate_payout)
        Route::middleware('admin.capability:manage_platform_settings,settle_affiliate_payout')->group(function () {
            Route::get('/affiliates', [\App\Http\Controllers\Admin\AdminAffiliateController::class, 'index']);
            Route::get('/affiliates/{userId}/ledger', [\App\Http\Controllers\Admin\AdminAffiliateController::class, 'ledger']);
            Route::get('/payouts', [\App\Http\Controllers\Admin\AdminPayoutController::class, 'index']);
        });

        // Affiliate payout settlement (settle_affiliate_payout)
        Route::middleware('admin.capability:settle_affiliate_payout')->group(function () {
            Route::post('/payouts/{payoutNumber}/settle', [\App\Http\Controllers\Admin\AdminPayoutController::class, 'settle']);
            Route::post('/payouts/{payoutNumber}/reject', [\App\Http\Controllers\Admin\AdminPayoutController::class, 'reject']);
        });

        // Co-prize adjudication (adjudicate_affiliate_coprize)
        Route::middleware('admin.capability:adjudicate_affiliate_coprize')->group(function () {
            Route::get('/coprizes', [\App\Http\Controllers\Admin\AdminCoPrizeController::class, 'index']);
            Route::post('/coprizes/{serial}/release', [\App\Http\Controllers\Admin\AdminCoPrizeController::class, 'release']);
            Route::post('/coprizes/{serial}/revoke', [\App\Http\Controllers\Admin\AdminCoPrizeController::class, 'revoke']);
        });

        // Approvals (issue_kyc_approval, issue_draw_audit_approval)
        Route::get('/approvals', [\App\Http\Controllers\Admin\AdminApprovalController::class, 'index'])
            ->middleware('admin.capability:issue_kyc_approval,issue_draw_audit_approval');
        Route::post('/approvals/kyc', [\App\Http\Controllers\Admin\AdminApprovalController::class, 'issueKyc'])
            ->middleware('admin.capability:issue_kyc_approval');
        Route::post('/approvals/draw-integrity', [\App\Http\Controllers\Admin\AdminApprovalController::class, 'issueDrawIntegrity'])
            ->middleware('admin.capability:issue_draw_audit_approval');
        Route::post('/approvals/{approvalId}/revoke', [\App\Http\Controllers\Admin\AdminApprovalController::class, 'revoke'])
            ->middleware('admin.capability:issue_kyc_approval,issue_draw_audit_approval');

        // Draws, prizes, winner metadata, and promotional awards (manage_platform_settings)
        Route::middleware('admin.capability:manage_platform_settings')->group(function () {
            Route::get('/draws', [\App\Http\Controllers\Admin\AdminDrawController::class, 'index']);
            Route::post('/draws', [\App\Http\Controllers\Admin\AdminDrawController::class, 'store']);
            Route::get('/draws/{id}', [\App\Http\Controllers\Admin\AdminDrawController::class, 'show']);
            Route::patch('/draws/{id}', [\App\Http\Controllers\Admin\AdminDrawController::class, 'update']);
            Route::post('/draws/{id}/publish', [\App\Http\Controllers\Admin\AdminDrawController::class, 'publish']);
            Route::post('/draws/{id}/complete', [\App\Http\Controllers\Admin\AdminDrawController::class, 'complete']);

            Route::post('/draws/{drawId}/prizes', [\App\Http\Controllers\Admin\AdminPrizeController::class, 'store']);
            Route::patch('/prizes/{id}', [\App\Http\Controllers\Admin\AdminPrizeController::class, 'update']);
            Route::delete('/prizes/{id}', [\App\Http\Controllers\Admin\AdminPrizeController::class, 'destroy']);

            Route::patch('/draws/{drawId}/winner', [\App\Http\Controllers\Admin\AdminDrawWinnerController::class, 'update']);

            Route::post('/awards', [\App\Http\Controllers\Admin\AdminPromotionalAwardController::class, 'store']);
        });

        // Users & Capabilities, and Centralized Audit Logs (manage_admin_capabilities)
        Route::middleware('admin.capability:manage_admin_capabilities')->group(function () {
            Route::get('/users', [\App\Http\Controllers\Admin\AdminUserController::class, 'index']);
            Route::post('/users/{id}/capabilities', [\App\Http\Controllers\Admin\AdminCapabilityController::class, 'store']);
            Route::delete('/users/{id}/capabilities/{capability}', [\App\Http\Controllers\Admin\AdminCapabilityController::class, 'destroy']);

            Route::get('/audit-logs', [\App\Http\Controllers\Admin\AdminAuditLogController::class, 'index']);
        });
    });
});
