<?php

namespace App\Http\Requests\Admin;

use App\Services\Admin\AdminAuditContext;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

abstract class AdminFormRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Handle a failed validation attempt with standardized JSend 422 format.
     */
    protected function failedValidation(Validator $validator): void
    {
        $response = response()->json([
            'status' => 'fail',
            'code' => 'ERR_VALIDATION',
            'message' => 'Validation failed',
            'errors' => $validator->errors()->toArray(),
        ], Response::HTTP_UNPROCESSABLE_ENTITY);

        throw new HttpResponseException($response);
    }

    /**
     * Extract or construct an AdminAuditContext for this request.
     */
    public function auditContext(?string $capability = null): AdminAuditContext
    {
        $requestId = $this->attributes->get('request_id')
            ?? $this->header('X-Request-Id')
            ?? (string) Str::uuid();

        $ip = $this->ip();
        $salt = (string) config('app.key', 'knzin-salt');
        $ipHash = $ip ? hash('sha256', $ip . $salt) : null;

        $justification = $this->input('justification') ?? $this->input('reason');
        if (is_string($justification)) {
            $justification = trim($justification);
        } else {
            $justification = null;
        }

        return new AdminAuditContext(
            actorUserId: $this->user()?->id,
            capabilityUsed: $capability,
            requestId: $requestId,
            ipHash: $ipHash,
            justification: $justification,
        );
    }
}
