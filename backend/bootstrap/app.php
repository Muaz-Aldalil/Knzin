<?php

use App\Exceptions\AdminStateConflictException;
use App\Exceptions\AmbiguousCommitException;
use App\Exceptions\CoPrizeApprovalsIncompleteException;
use App\Exceptions\LastAdminLockoutException;
use App\Exceptions\PayoutStateConflictException;
use App\Exceptions\ProtectedFieldException;
use App\Http\Middleware\AssignAdminRequestId;
use App\Http\Middleware\AuditAdminFailures;
use App\Http\Middleware\EnsureAdminCapability;
use App\Http\Middleware\EnsureAdminPrincipal;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->trustProxies(at: '*');
        $middleware->redirectGuestsTo(fn () => null);

        $middleware->alias([
            'admin.principal' => EnsureAdminPrincipal::class,
            'admin.capability' => EnsureAdminCapability::class,
            'admin.request_id' => AssignAdminRequestId::class,
            'admin.audit_failures' => AuditAdminFailures::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            return response()->json([
                'status' => 'fail',
                'code' => 'ERR_UNAUTHORIZED',
                'message' => 'Unauthenticated or session expired.',
            ], 401);
        });

        $exceptions->render(function (AuthorizationException $e, Request $request) {
            return response()->json([
                'status' => 'fail',
                'code' => 'ERR_FORBIDDEN',
                'message' => $e->getMessage() ?: 'Unauthorized action.',
            ], 403);
        });

        $exceptions->render(function (ModelNotFoundException $e, Request $request) {
            return response()->json([
                'status' => 'fail',
                'code' => 'ERR_NOT_FOUND',
                'message' => 'Requested resource not found.',
            ], 404);
        });

        $exceptions->render(function (LastAdminLockoutException $e, Request $request) {
            return response()->json([
                'status' => 'fail',
                'code' => 'ERR_LAST_ADMIN_LOCKOUT',
                'message' => $e->getMessage() ?: 'Cannot remove the last administrator with manage_admin_capabilities.',
            ], 409);
        });

        $exceptions->render(function (CoPrizeApprovalsIncompleteException $e, Request $request) {
            return response()->json([
                'status' => 'fail',
                'code' => 'ERR_COPRIZE_APPROVALS_INCOMPLETE',
                'message' => $e->getMessage() ?: 'Dual approvals incomplete for co-prize release.',
                'data' => $e->data,
            ], 409);
        });

        $exceptions->render(function (
            AdminStateConflictException|PayoutStateConflictException|AmbiguousCommitException $e,
            Request $request
        ) {
            return response()->json([
                'status' => 'fail',
                'code' => 'ERR_STATE_CONFLICT',
                'message' => $e->getMessage() ?: 'State conflict.',
            ], 409);
        });

        $exceptions->render(function (ProtectedFieldException $e, Request $request) {
            return response()->json([
                'status' => 'fail',
                'code' => 'ERR_PROTECTED_FIELD',
                'message' => $e->getMessage() ?: 'Protected field cannot be modified.',
            ], 422);
        });

        $exceptions->render(function (TooManyRequestsHttpException $e, Request $request) {
            return response()->json([
                'status' => 'fail',
                'code' => 'ERR_TOO_MANY_REQUESTS',
                'message' => 'Too many requests. Please slow down.',
            ], 429);
        });
    })->create();
