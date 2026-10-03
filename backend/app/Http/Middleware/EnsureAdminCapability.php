<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminCapability
{
    /**
     * Handle an incoming request.
     *
     * @param string ...$capabilities Comma-delimited or variadic list of required capabilities (any-of semantics)
     */
    public function handle(Request $request, Closure $next, string ...$capabilities): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'status' => 'fail',
                'code' => 'ERR_UNAUTHORIZED',
                'message' => 'Authentication required.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        // Support comma-delimited parameters: e.g. "cap1,cap2"
        $flatCapabilities = [];
        foreach ($capabilities as $cap) {
            foreach (explode(',', $cap) as $subCap) {
                $trimmed = trim($subCap);
                if ($trimmed !== '') {
                    $flatCapabilities[] = $trimmed;
                }
            }
        }

        if (empty($flatCapabilities)) {
            return $next($request);
        }

        foreach ($flatCapabilities as $capability) {
            if (Gate::forUser($user)->allows($capability)) {
                $request->attributes->set('capability_used', $capability);
                return $next($request);
            }
        }

        return response()->json([
            'status' => 'fail',
            'code' => 'ERR_FORBIDDEN',
            'message' => 'User does not hold the required administrative capability.',
        ], Response::HTTP_FORBIDDEN);
    }
}
