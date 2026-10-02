<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', function (Request $request) {
    $frontendUrl = rtrim((string) env('FRONTEND_URL', 'http://localhost:3000'), '/');
    $queryString = $request->getQueryString();
    return redirect($frontendUrl . ($queryString ? '?' . $queryString : ''));
});

