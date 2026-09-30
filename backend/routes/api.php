<?php

use App\Http\Controllers\ActivityController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\DrawController;
use App\Http\Controllers\ProgressController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('v1')->group(function () {
    // Auth Endpoints (US3)
    Route::post('/auth/guest', [AuthController::class, 'guest']);
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

    // Checkout Endpoints (US1)
    Route::post('/checkout/orders', [CheckoutController::class, 'store']);
    Route::get('/checkout/orders/{orderNumber}', [CheckoutController::class, 'show']);

    // Progress & Continuation Endpoints (Scrimba & Vertex Alignment)
    Route::post('/progress', [ProgressController::class, 'recordProgress'])->middleware('auth:sanctum');
    Route::get('/user/active-learning', [ProgressController::class, 'getActiveLearning'])->middleware('auth:sanctum');
    Route::get('/courses/{slug}/progress', [ProgressController::class, 'getCourseProgress'])->middleware('auth:sanctum');
});
