<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseEntitlement;
use App\Models\CoursePart;
use App\Models\LessonProgress;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends ApiController
{
    /**
     * Get the authenticated learner's complete personalized dashboard state.
     * Adheres to contracts/dashboard.contract.md.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return $this->failResponse('ERR_UNAUTHORIZED', 'Unauthenticated', [], 401);
        }

        // 1. Fetch total tickets count
        $totalTicketsCount = Ticket::where('user_id', $user->id)->count();

        // 2. Fetch authoritative active entitlements
        $activeEntitlements = CourseEntitlement::where('user_id', $user->id)
            ->where('status', 'active')
            ->with(['course.parts' => function ($query) {
                $query->where('is_active', true)->orderBy('part_number', 'asc');
            }])
            ->get();

        $enrolledCoursesMap = [];
        $completedCoursesCount = 0;

        // Group entitlements by course
        $groupedByCourse = $activeEntitlements->groupBy('course_id');

        foreach ($groupedByCourse as $courseId => $entitlements) {
            $course = $entitlements->first()->course;
            if (!$course || !$course->is_active) {
                continue;
            }

            $activeParts = $course->parts;
            $totalActiveParts = $activeParts->count();

            // Determine if user has a bundle entitlement
            $hasBundle = $entitlements->contains(fn($e) => $e->course_part_id === null);

            // Determine owned parts
            if ($hasBundle) {
                $entitlementType = 'bundle';
                $ownedPartIds = $activeParts->pluck('id')->all();
            } else {
                $entitlementType = 'part';
                $ownedPartIds = $entitlements->pluck('course_part_id')->filter()->unique()->all();
            }
            $ownedPartsCount = count($ownedPartIds);

            // Fetch progress for this course and user
            $progressRecords = LessonProgress::where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->get();

            // Completed parts count among owned parts
            $completedPartsCount = $progressRecords
                ->whereIn('course_part_id', $ownedPartIds)
                ->where('is_completed', true)
                ->count();

            // Total completed active parts across curriculum
            $completedTotalPartsCount = $progressRecords
                ->where('is_completed', true)
                ->count();

            $isCourseCompleted = ($totalActiveParts > 0 && $completedTotalPartsCount >= $totalActiveParts);
            if ($isCourseCompleted) {
                $completedCoursesCount++;
            }

            // Curriculum Progress (overall_progress_percentage)
            // Sum percent_complete of all active parts / totalActiveParts
            $curriculumSum = 0;
            foreach ($activeParts as $p) {
                $pRecord = $progressRecords->firstWhere('course_part_id', $p->id);
                $curriculumSum += $pRecord ? (int) $pRecord->percent_complete : 0;
            }
            $overallProgressPercentage = $totalActiveParts > 0
                ? (int) round($curriculumSum / $totalActiveParts)
                : 0;

            // Owned Scope Progress (owned_scope_progress_percentage)
            $ownedSum = 0;
            foreach ($ownedPartIds as $opId) {
                $pRecord = $progressRecords->firstWhere('course_part_id', $opId);
                $ownedSum += $pRecord ? (int) $pRecord->percent_complete : 0;
            }
            $ownedScopeProgressPercentage = $ownedPartsCount > 0
                ? (int) round($ownedSum / $ownedPartsCount)
                : 0;

            // Determine last_accessed_at
            $latestWatched = $progressRecords->max('last_watched_at');
            $latestEntitlement = $entitlements->max('created_at');
            $lastAccessedAt = $latestWatched ?: $latestEntitlement;

            $enrolledCoursesMap[] = [
                'course_id' => $course->id,
                'slug' => $course->slug,
                'title_ar' => $course->title_ar,
                'title_en' => $course->title_en,
                'cover_image_url' => $course->cover_image_url,
                'entitlement_type' => $entitlementType,
                'owned_parts_count' => $ownedPartsCount,
                'total_active_parts' => $totalActiveParts,
                'completed_parts_count' => $completedPartsCount,
                'owned_scope_progress_percentage' => $ownedScopeProgressPercentage,
                'overall_progress_percentage' => $overallProgressPercentage,
                'is_course_completed' => $isCourseCompleted,
                'last_accessed_at' => $lastAccessedAt ? $lastAccessedAt->toISOString() : now()->toISOString(),
            ];
        }

        // Sort enrolled courses by last_accessed_at descending
        usort($enrolledCoursesMap, function ($a, $b) {
            return strcmp($b['last_accessed_at'], $a['last_accessed_at']);
        });

        // 3. Active Learning ("Jump Back In") continuation item
        // Strictly scoped to courses and parts where user holds an active entitlement
        $bundleCourseIds = $activeEntitlements->whereNull('course_part_id')->pluck('course_id')->all();
        $modularPartIds = $activeEntitlements->whereNotNull('course_part_id')->pluck('course_part_id')->all();

        $latestProgress = null;
        if (!empty($bundleCourseIds) || !empty($modularPartIds)) {
            $latestProgress = LessonProgress::where('user_id', $user->id)
                ->with(['course', 'coursePart'])
                ->whereHas('course', fn($q) => $q->where('is_active', true))
                ->whereHas('coursePart', fn($q) => $q->where('is_active', true))
                ->where(function ($q) use ($bundleCourseIds, $modularPartIds) {
                    if (!empty($bundleCourseIds)) {
                        $q->whereIn('course_id', $bundleCourseIds);
                    }
                    if (!empty($modularPartIds)) {
                        $q->orWhereIn('course_part_id', $modularPartIds);
                    }
                })
                ->orderByDesc('last_watched_at')
                ->first();
        }

        $activeLearning = null;
        if ($latestProgress && $latestProgress->course && $latestProgress->coursePart) {
            $activeLearning = [
                'course_slug' => $latestProgress->course->slug,
                'course_title_ar' => $latestProgress->course->title_ar,
                'course_title_en' => $latestProgress->course->title_en,
                'cover_image_url' => $latestProgress->course->cover_image_url,
                'part_number' => (int) $latestProgress->coursePart->part_number,
                'part_title_ar' => $latestProgress->coursePart->title_ar,
                'part_title_en' => $latestProgress->coursePart->title_en,
                'watch_seconds' => (int) $latestProgress->watch_seconds,
                'percent_complete' => (int) $latestProgress->percent_complete,
                'is_completed' => (bool) $latestProgress->is_completed,
                'last_watched_at' => $latestProgress->last_watched_at?->toISOString() ?? $latestProgress->updated_at?->toISOString(),
            ];
        }

        return $this->successResponse([
            'summary' => [
                'enrolled_courses_count' => count($enrolledCoursesMap),
                'completed_courses_count' => $completedCoursesCount,
                'total_tickets_count' => $totalTicketsCount,
            ],
            'active_learning' => $activeLearning,
            'enrolled_courses' => $enrolledCoursesMap,
        ]);
    }
}
