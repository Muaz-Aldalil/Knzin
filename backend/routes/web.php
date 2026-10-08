<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', function (Request $request) {
    $frontendUrl = rtrim((string) config('app.frontend_url', 'http://localhost:3000'), '/');
    $queryString = $request->getQueryString();
    return redirect($frontendUrl . ($queryString ? '?' . $queryString : ''));
});

Route::get('/storage/{path}', function (string $path) {
    $disk = \Illuminate\Support\Facades\Storage::disk('public');
    if (!$disk->exists($path)) {
        abort(404, 'File not found');
    }
    return $disk->response($path);
})->where('path', '.*')->name('storage.fallback');

