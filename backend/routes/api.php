<?php

use App\Http\Controllers\CheckoutController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('v1')->group(function () {
    // Checkout Endpoints (US1)
    Route::post('/checkout/orders', [CheckoutController::class, 'store']);
    Route::get('/checkout/orders/{orderNumber}', [CheckoutController::class, 'show']);
});
