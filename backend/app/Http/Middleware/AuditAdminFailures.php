<?php

namespace App\Http\Middleware;

use App\Models\AdminActivityLog;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class AuditAdminFailures
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    /**
     * Handle tasks after the response has been sent to the browser.
     */
    public function terminate(Request $request, Response $response): void
    {
        $status = $response->getStatusCode();

        if ($status < 400) {
            return;
        }

        try {
            $requestId = (string) ($request->attributes->get('request_id')
                ?? $request->header('X-Request-Id')
                ?? 'unknown');

            // Skip if a success row already exists for this request
            $exists = AdminActivityLog::where('request_id', $requestId)
                ->where('outcome', 'success')
                ->exists();

            if ($exists) {
                return;
            }

            $outcome = match ($status) {
                401, 403 => 'denied',
                409 => 'conflict',
                422 => 'rejected',
                default => 'failed',
            };

            $ip = $request->ip();
            $salt = (string) config('app.key', 'knzin-salt');
            $ipHash = $ip ? hash('sha256', $ip . $salt) : null;

            AdminActivityLog::create([
                'request_id' => $requestId,
                'actor_user_id' => $request->user()?->id,
                'capability_used' => $request->attributes->get('capability_used'),
                'action' => 'admin.request_failed',
                'target_type' => 'route',
                'target_id' => $request->path(),
                'outcome' => $outcome,
                'reason_code' => "HTTP_{$status}",
                'administrative_justification' => null,
                'before_state' => null,
                'after_state' => null,
                'ip_hash' => $ipHash,
                'created_at' => now(),
            ]);
        } catch (Throwable $e) {
            Log::critical('AuditAdminFailures middleware failed to record failure row', [
                'error' => $e->getMessage(),
                'path' => $request->path(),
                'status' => $status,
            ]);
        }
    }
}
