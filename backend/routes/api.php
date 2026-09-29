<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\CheckoutController;
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

    // Checkout Endpoints (US1)
    Route::post('/checkout/orders', [CheckoutController::class, 'store']);
    Route::get('/checkout/orders/{orderNumber}', [CheckoutController::class, 'show']);
});
