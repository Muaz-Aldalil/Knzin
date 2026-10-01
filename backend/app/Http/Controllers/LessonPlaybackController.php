<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CoursePart;
use App\Services\MediaProtectionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LessonPlaybackController extends ApiController
{
    public function __construct(protected MediaProtectionService $mediaProtectionService)
    {
    }

    /**
     * Authorize lesson playback for course part.
     * Part 1 is free public preview; Part 2+ requires authentication and entitlement.
     * Adheres to contracts/playback-auth.contract.md.
     */
    public function playbackAuth(Request $request, string $courseSlug, int $partNumber): JsonResponse
    {
        $course = Course::where('slug', $courseSlug)->where('is_active', true)->first();
        if (!$course) {
            return $this->failResponse('ERR_COURSE_NOT_FOUND', "Course '{$courseSlug}' not found.", [], 404);
        }

        $part = CoursePart::where('course_id', $course->id)
            ->where('part_number', $partNumber)
            ->where('is_active', true)
            ->first();

        if (!$part) {
            return $this->failResponse('ERR_PART_NOT_FOUND', "Part {$partNumber} not found for course '{$courseSlug}'.", [], 404);
        }

        $user = $request->user() ?: auth('sanctum')->user();

        $result = $this->mediaProtectionService->generatePlaybackToken($user, $course, $part);

        if (isset($result['error'])) {
            $code = $result['error'];
            $message = $result['message'];
            $statusCode = $result['status_code'] ?? 403;
            $data = [
                'code' => $code,
                'message' => $message,
            ];

            if (isset($result['pricing'])) {
                $data['pricing'] = $result['pricing'];
            }

            return response()->json([
                'status' => 'fail',
                'code' => $code,
                'message' => $message,
                'data' => $data,
            ], $statusCode);
        }

        return $this->successResponse($result);
    }

    /**
     * Generate signed temporary download URL for lesson trade attachment.
     * Adheres to contracts/downloads.contract.md.
     */
    public function downloadResource(Request $request, string $courseSlug, int $partNumber, string $resourceId): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'status' => 'fail',
                'code' => 'ERR_UNAUTHORIZED',
                'message' => 'Unauthenticated',
                'data' => [
                    'code' => 'ERR_UNAUTHORIZED',
                    'message' => 'Unauthenticated',
                ],
            ], 401);
        }

        $course = Course::where('slug', $courseSlug)->where('is_active', true)->first();
        if (!$course) {
            return response()->json([
                'status' => 'fail',
                'code' => 'ERR_RESOURCE_NOT_FOUND',
                'message' => 'الملف المطلوب غير موجود.',
                'data' => [
                    'code' => 'ERR_RESOURCE_NOT_FOUND',
                    'message' => 'الملف المطلوب غير موجود.',
                ],
            ], 404);
        }

        $part = CoursePart::where('course_id', $course->id)
            ->where('part_number', $partNumber)
            ->where('is_active', true)
            ->first();

        if (!$part) {
            return response()->json([
                'status' => 'fail',
                'code' => 'ERR_RESOURCE_NOT_FOUND',
                'message' => 'الملف المطلوب غير موجود.',
                'data' => [
                    'code' => 'ERR_RESOURCE_NOT_FOUND',
                    'message' => 'الملف المطلوب غير موجود.',
                ],
            ], 404);
        }

        $result = $this->mediaProtectionService->generateDownloadToken($user, $course, $part, $resourceId);

        if (isset($result['error'])) {
            $code = $result['error'];
            $message = $result['message'];
            $statusCode = $result['status_code'] ?? 403;

            return response()->json([
                'status' => 'fail',
                'code' => $code,
                'message' => $message,
                'data' => [
                    'code' => $code,
                    'message' => $message,
                ],
            ], $statusCode);
        }

        return $this->successResponse($result);
    }
}
