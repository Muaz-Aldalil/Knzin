<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CoursePart;
use App\Models\LessonProgress;
use App\Services\EntitlementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ProgressController extends ApiController
{
    public function __construct(protected EntitlementService $entitlementService)
    {
    }

    /**
     * Upsert watch depth and completion with strict server-side entitlement check,
     * duration bounds, monotonicity, and sticky 95% completion (FR-015, FR-016, FR-017).
     */
    public function recordProgress(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course_slug' => 'required|string',
            'part_number' => 'required|integer',
            'watch_seconds' => 'required|integer|min:0',
            'percent_complete' => 'required|integer|min:0|max:100',
        ]);

        $user = $request->user();
        if (!$user) {
            return $this->failResponse(
                'ERR_UNAUTHORIZED',
                'يرجى تسجيل الدخول لتسجيل التقدم.',
                [],
                Response::HTTP_UNAUTHORIZED
            );
        }

        $course = Course::where('slug', $validated['course_slug'])->first();
        if (!$course) {
            return $this->failResponse(
                'ERR_COURSE_NOT_FOUND',
                'Course not found',
                [],
                Response::HTTP_NOT_FOUND
            );
        }

        $part = CoursePart::where('course_id', $course->id)
            ->where('part_number', $validated['part_number'])
            ->first();

        if (!$part) {
            return $this->failResponse(
                'ERR_PART_NOT_FOUND',
                'Part not found',
                [],
                Response::HTTP_NOT_FOUND
            );
        }

        // Part 1 is free introductory preview. For parts > 1, verify active entitlement via EntitlementService
        if ((int) $part->part_number > 1) {
            if (!$this->entitlementService->hasAccess($user, $course, $part)) {
                return $this->failResponse(
                    'ERR_PART_LOCKED',
                    'يجب شراء هذا الجزء أو الباقة الكاملة لتسجيل التقدم.',
                    [],
                    Response::HTTP_FORBIDDEN
                );
            }
        }

        // Bound watch_seconds at part duration if duration is known
        $inputWatchSeconds = (int) $validated['watch_seconds'];
        if ($part->duration_seconds && (int) $part->duration_seconds > 0) {
            $inputWatchSeconds = min((int) $part->duration_seconds, $inputWatchSeconds);
        }

        $inputPercentComplete = (int) $validated['percent_complete'];

        $existing = LessonProgress::where('user_id', $user->id)
            ->where('course_part_id', $part->id)
            ->first();

        // Enforce server-side monotonicity: lower watch depth or percentage reports cannot regress higher recorded values
        $finalWatchSeconds = $existing ? max((int) $existing->watch_seconds, $inputWatchSeconds) : $inputWatchSeconds;
        $finalPercentComplete = $existing ? max((int) $existing->percent_complete, $inputPercentComplete) : $inputPercentComplete;

        // Enforce sticky completion: reaching 95% sets is_completed = true permanently
        $isCompleted = ($existing && $existing->is_completed) || $finalPercentComplete >= 95;

        $progress = LessonProgress::updateOrCreate(
            [
                'user_id' => $user->id,
                'course_part_id' => $part->id,
            ],
            [
                'course_id' => $course->id,
                'watch_seconds' => $finalWatchSeconds,
                'percent_complete' => $finalPercentComplete,
                'is_completed' => $isCompleted,
                'last_watched_at' => now(),
            ]
        );

        return $this->successResponse([
            'progress' => [
                'course_slug' => $course->slug,
                'part_number' => (int) $part->part_number,
                'watch_seconds' => (int) $progress->watch_seconds,
                'percent_complete' => (int) $progress->percent_complete,
                'is_completed' => (bool) $progress->is_completed,
            ],
        ]);
    }

    /**
     * Get the latest active course & part for Scrimba-style "Jump Back In" hero card.
     * Serves exclusively authoritative server-persisted state with zero demo/mock fallback.
     */
    public function getActiveLearning(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return $this->successResponse(['active_learning' => null]);
        }

        $latest = LessonProgress::with(['course', 'coursePart'])
            ->where('user_id', $user->id)
            ->orderBy('last_watched_at', 'desc')
            ->first();

        if (!$latest || !$latest->course || !$latest->coursePart) {
            return $this->successResponse(['active_learning' => null]);
        }

        return $this->successResponse([
            'active_learning' => [
                'course_slug' => $latest->course->slug,
                'course_title_ar' => $latest->course->title_ar,
                'course_title_en' => $latest->course->title_en,
                'cover_image_url' => $latest->course->cover_image_url,
                'part_number' => (int) $latest->coursePart->part_number,
                'part_title_ar' => $latest->coursePart->title_ar,
                'part_title_en' => $latest->coursePart->title_en,
                'watch_seconds' => (int) $latest->watch_seconds,
                'percent_complete' => (int) $latest->percent_complete,
                'is_completed' => (bool) $latest->is_completed,
                'last_watched_at' => $latest->last_watched_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * Get all progress for a given course to display on curriculum list.
     */
    public function getCourseProgress(Request $request, string $courseSlug): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return $this->successResponse(['parts_progress' => []]);
        }

        $course = Course::where('slug', $courseSlug)->first();
        if (!$course) {
            return $this->successResponse(['parts_progress' => []]);
        }

        $progressRecords = LessonProgress::with('coursePart')
            ->where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->get();

        $partsProgress = $progressRecords->mapWithKeys(function ($record) {
            return [
                (int) $record->coursePart->part_number => [
                    'percent_complete' => (int) $record->percent_complete,
                    'is_completed' => (bool) $record->is_completed,
                    'watch_seconds' => (int) $record->watch_seconds,
                ],
            ];
        });

        return $this->successResponse(['parts_progress' => $partsProgress]);
    }
}
