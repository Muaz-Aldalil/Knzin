<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CoursePart;
use App\Models\LessonProgress;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ProgressController extends ApiController
{
    /**
     * Upsert watch depth and completion for a user and course part (DEF-05D, DEF-06A).
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
                'Unauthenticated',
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

        // Part 1 is free introductory preview. For parts > 1, verify user purchase entitlement (DEF-05D)
        if ($part->part_number > 1) {
            $hasPurchased = Order::where('user_id', $user->id)
                ->whereIn('status', ['completed', 'pending'])
                ->whereHas('items', function ($query) use ($course, $part) {
                    $query->where('course_id', $course->id)
                        ->where(function ($q) use ($part) {
                            $q->where('item_type', 'bundle')
                              ->orWhere('course_part_id', $part->id);
                        });
                })
                ->exists();

            if (!$hasPurchased) {
                return $this->failResponse(
                    'ERR_PART_LOCKED',
                    'يجب شراء هذا الجزء أو الباقة الكاملة لتسجيل التقدم.',
                    [],
                    Response::HTTP_FORBIDDEN
                );
            }
        }

        $isCompleted = $validated['percent_complete'] >= 95;

        $progress = LessonProgress::updateOrCreate(
            [
                'user_id' => $user->id,
                'course_part_id' => $part->id,
            ],
            [
                'course_id' => $course->id,
                'watch_seconds' => $validated['watch_seconds'],
                'percent_complete' => $validated['percent_complete'],
                'is_completed' => $isCompleted,
                'last_watched_at' => now(),
            ]
        );

        return $this->successResponse([
            'progress' => [
                'course_slug' => $course->slug,
                'part_number' => $part->part_number,
                'watch_seconds' => $progress->watch_seconds,
                'percent_complete' => $progress->percent_complete,
                'is_completed' => (bool) $progress->is_completed,
            ],
        ]);
    }

    /**
     * Get the latest active course & part for Scrimba-style "Jump Back In" hero card.
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
                'part_number' => $latest->coursePart->part_number,
                'part_title_ar' => $latest->coursePart->title_ar,
                'part_title_en' => $latest->coursePart->title_en,
                'watch_seconds' => $latest->watch_seconds,
                'percent_complete' => $latest->percent_complete,
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
                $record->coursePart->part_number => [
                    'percent_complete' => $record->percent_complete,
                    'is_completed' => (bool) $record->is_completed,
                    'watch_seconds' => $record->watch_seconds,
                ],
            ];
        });

        return $this->successResponse(['parts_progress' => $partsProgress]);
    }
}
