<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CoursePart;
use App\Models\LessonProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProgressController extends Controller
{
    /**
     * Upsert watch depth and completion for a user and course part.
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
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $course = Course::where('slug', $validated['course_slug'])->first();
        if (!$course) {
            return response()->json(['message' => 'Course not found'], 404);
        }

        $part = CoursePart::where('course_id', $course->id)
            ->where('part_number', $validated['part_number'])
            ->first();

        if (!$part) {
            return response()->json(['message' => 'Part not found'], 404);
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

        return response()->json([
            'status' => 'success',
            'progress' => [
                'course_slug' => $course->slug,
                'part_number' => $part->part_number,
                'watch_seconds' => $progress->watch_seconds,
                'percent_complete' => $progress->percent_complete,
                'is_completed' => $progress->is_completed,
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
            return response()->json(['active_learning' => null]);
        }

        $latest = LessonProgress::with(['course', 'coursePart'])
            ->where('user_id', $user->id)
            ->orderBy('last_watched_at', 'desc')
            ->first();

        if (!$latest || !$latest->course || !$latest->coursePart) {
            return response()->json(['active_learning' => null]);
        }

        return response()->json([
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
                'is_completed' => $latest->is_completed,
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
            return response()->json(['parts_progress' => []]);
        }

        $course = Course::where('slug', $courseSlug)->first();
        if (!$course) {
            return response()->json(['parts_progress' => []]);
        }

        $progressRecords = LessonProgress::with('coursePart')
            ->where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->get();

        $partsProgress = $progressRecords->mapWithKeys(function ($record) {
            return [
                $record->coursePart->part_number => [
                    'percent_complete' => $record->percent_complete,
                    'is_completed' => $record->is_completed,
                    'watch_seconds' => $record->watch_seconds,
                ],
            ];
        });

        return response()->json(['parts_progress' => $partsProgress]);
    }
}
