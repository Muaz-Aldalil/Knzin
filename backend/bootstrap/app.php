<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->redirectGuestsTo(fn () => null);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, \Illuminate\Http\Request $request) {
            return response()->json([
                'status' => 'fail',
                'code' => 'ERR_UNAUTHORIZED',
                'message' => 'Unauthenticated or session expired.',
            ], 401);
        });

        $exceptions->render(function (\Illuminate\Database\Eloquent\ModelNotFoundException $e, \Illuminate\Http\Request $request) {
            return response()->json([
                'status' => 'fail',
                'code' => 'ERR_NOT_FOUND',
                'message' => 'Requested resource not found.',
            ], 404);
        });

        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException $e, \Illuminate\Http\Request $request) {
            return response()->json([
                'status' => 'fail',
                'code' => 'ERR_TOO_MANY_REQUESTS',
                'message' => 'Too many requests. Please slow down.',
            ], 429);
        });
    })->create();
