<?php

namespace App\Http\Controllers;

use App\Http\Resources\CourseResource;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class CatalogController extends ApiController
{
    /**
     * List all active courses with parts count and pricing.
     */
    public function index(): JsonResponse
    {
        $courses = Cache::remember('catalog_courses_index', 300, function () {
            return Course::where('is_active', true)
                ->withCount('parts')
                ->orderBy('created_at', 'asc')
                ->get();
        });

        return $this->successResponse(CourseResource::collection($courses));
    }

    /**
     * Show a single course by slug with all modular parts.
     */
    public function show(string $slug): JsonResponse
    {
        $course = Course::where('slug', $slug)
            ->where('is_active', true)
            ->with(['parts' => function ($query) {
                $query->where('is_active', true)->orderBy('part_number', 'asc');
            }])
            ->first();

        if (!$course) {
            return $this->failResponse(
                'ERR_COURSE_NOT_FOUND',
                "Course with slug '{$slug}' not found",
                [],
                Response::HTTP_NOT_FOUND
            );
        }

        return $this->successResponse(new CourseResource($course));
    }
}
