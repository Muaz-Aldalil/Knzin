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
    Route::get('/auth/google/redirect', [AuthController::class, 'googleRedirect']);
    Route::get('/auth/google/callback', [AuthController::class, 'googleCallback']);

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
});
