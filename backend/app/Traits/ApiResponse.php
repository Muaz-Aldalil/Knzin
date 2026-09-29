<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

trait ApiResponse
{
    /**
     * Return a standardized JSend success response.
     */
    public function successResponse(mixed $data = null, int $code = Response::HTTP_OK): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $data,
        ], $code);
    }

    /**
     * Return a standardized JSend fail response (4xx client/validation error).
     */
    public function failResponse(string $code = 'ERR_VALIDATION', string $message = 'Validation failed', array $errors = [], int $httpStatus = Response::HTTP_UNPROCESSABLE_ENTITY): JsonResponse
    {
        $payload = [
            'status' => 'fail',
            'code' => $code,
            'message' => $message,
        ];

        if (!empty($errors)) {
            $payload['errors'] = $errors;
        }

        return response()->json($payload, $httpStatus);
    }

    /**
     * Return a standardized JSend error response (5xx server error).
     */
    public function errorResponse(string $message = 'Internal server error', string $code = 'ERR_INTERNAL_SERVER', int $httpStatus = Response::HTTP_INTERNAL_SERVER_ERROR): JsonResponse
    {
        return response()->json([
            'status' => 'error',
            'code' => $code,
            'message' => $message,
        ], $httpStatus);
    }
}
