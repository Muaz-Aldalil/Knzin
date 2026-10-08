<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\ApiController;
use App\Http\Requests\Admin\AdminFormRequest;
use App\Http\Requests\Admin\ReorderCoursePartsRequest;
use App\Http\Requests\Admin\StoreCoursePartRequest;
use App\Http\Requests\Admin\StoreCourseRequest;
use App\Http\Requests\Admin\UpdateCoursePartRequest;
use App\Http\Requests\Admin\UpdateCourseRequest;
use App\Http\Resources\CoursePartResource;
use App\Http\Resources\CourseResource;
use App\Models\Course;
use App\Models\CoursePart;
use App\Services\Admin\AdminCourseService;
use App\Support\AdminCapabilities;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminCourseController extends ApiController
{
    public function __construct(
        protected AdminCourseService $adminCourseService
    ) {
    }

    /**
     * List all courses with search, filters, and KPI summary.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Course::withCount('parts')->with(['parts' => function ($q) {
            $q->orderBy('part_number', 'asc');
        }]);

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('title_ar', 'like', "%{$search}%")
                  ->orWhere('title_en', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        if ($request->has('is_active') && $request->input('is_active') !== '' && $request->input('is_active') !== null) {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $totalCourses = Course::count();
        $activeCourses = Course::where('is_active', true)->count();
        $totalParts = CoursePart::count();

        $perPage = max(1, min(100, (int) $request->input('per_page', 20)));
        $paginated = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return $this->successResponse([
            'items' => CourseResource::collection($paginated->items()),
            'pagination' => [
                'current_page' => $paginated->currentPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'last_page' => $paginated->lastPage(),
            ],
            'kpis' => [
                'total_courses' => $totalCourses,
                'active_courses' => $activeCourses,
                'total_parts' => $totalParts,
            ],
        ]);
    }

    /**
     * Create a new course.
     */
    public function store(StoreCourseRequest $request): JsonResponse
    {
        $auditContext = $request->auditContext(AdminCapabilities::MANAGE_PLATFORM_SETTINGS);

        $course = $this->adminCourseService->createCourse(
            data: $request->validated(),
            actor: $request->user(),
            auditContext: $auditContext
        );

        return $this->successResponse(new CourseResource($course->load('parts')), 201);
    }

    /**
     * Show a specific course with its ordered parts.
     */
    public function show(string $id): JsonResponse
    {
        $course = Course::with(['parts' => function ($q) {
            $q->orderBy('part_number', 'asc');
        }])->findOrFail($id);

        return $this->successResponse(new CourseResource($course));
    }

    /**
     * Update an existing course.
     */
    public function update(UpdateCourseRequest $request, string $id): JsonResponse
    {
        $course = Course::findOrFail($id);
        $auditContext = $request->auditContext(AdminCapabilities::MANAGE_PLATFORM_SETTINGS);

        $updated = $this->adminCourseService->updateCourse(
            course: $course,
            data: $request->validated(),
            actor: $request->user(),
            auditContext: $auditContext
        );

        $updated->load(['parts' => function ($q) {
            $q->orderBy('part_number', 'asc');
        }]);

        return $this->successResponse(new CourseResource($updated));
    }

    /**
     * Delete or safely archive a course.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $course = Course::findOrFail($id);
        $auditContext = AdminFormRequest::fromRequest($request, AdminCapabilities::MANAGE_PLATFORM_SETTINGS);

        $result = $this->adminCourseService->deleteCourse(
            course: $course,
            actor: $request->user(),
            auditContext: $auditContext
        );

        return $this->successResponse($result);
    }

    /**
     * Toggle course active/paused status.
     */
    public function toggleStatus(Request $request, string $id): JsonResponse
    {
        $course = Course::findOrFail($id);
        $auditContext = AdminFormRequest::fromRequest($request, AdminCapabilities::MANAGE_PLATFORM_SETTINGS);

        $updated = $this->adminCourseService->toggleStatus(
            course: $course,
            actor: $request->user(),
            auditContext: $auditContext
        );

        return $this->successResponse(new CourseResource($updated));
    }

    /**
     * Add a part to a course.
     */
    public function storePart(StoreCoursePartRequest $request, string $id): JsonResponse
    {
        $course = Course::findOrFail($id);
        $auditContext = $request->auditContext(AdminCapabilities::MANAGE_PLATFORM_SETTINGS);

        $part = $this->adminCourseService->addPart(
            course: $course,
            data: $request->validated(),
            actor: $request->user(),
            auditContext: $auditContext
        );

        return $this->successResponse(new CoursePartResource($part), 201);
    }

    /**
     * Update an existing course part.
     */
    public function updatePart(UpdateCoursePartRequest $request, string $id, string $partId): JsonResponse
    {
        $part = CoursePart::where('course_id', $id)->where('id', $partId)->firstOrFail();
        $auditContext = $request->auditContext(AdminCapabilities::MANAGE_PLATFORM_SETTINGS);

        $updated = $this->adminCourseService->updatePart(
            part: $part,
            data: $request->validated(),
            actor: $request->user(),
            auditContext: $auditContext
        );

        return $this->successResponse(new CoursePartResource($updated));
    }

    /**
     * Remove or safely deactivate a course part.
     */
    public function destroyPart(Request $request, string $id, string $partId): JsonResponse
    {
        $part = CoursePart::where('course_id', $id)->where('id', $partId)->firstOrFail();
        $auditContext = AdminFormRequest::fromRequest($request, AdminCapabilities::MANAGE_PLATFORM_SETTINGS);
        $force = filter_var($request->input('force', false), FILTER_VALIDATE_BOOLEAN);

        $result = $this->adminCourseService->deletePart(
            part: $part,
            actor: $request->user(),
            auditContext: $auditContext,
            force: $force
        );

        return $this->successResponse($result);
    }

    /**
     * Restore an archived course part back to active.
     */
    public function restorePart(Request $request, string $id, string $partId): JsonResponse
    {
        $part = CoursePart::where('course_id', $id)->where('id', $partId)->firstOrFail();
        $auditContext = AdminFormRequest::fromRequest($request, AdminCapabilities::MANAGE_PLATFORM_SETTINGS);

        $restored = $this->adminCourseService->restorePart(
            part: $part,
            actor: $request->user(),
            auditContext: $auditContext
        );

        return $this->successResponse(new CoursePartResource($restored));
    }

    /**
     * Atomically reorder parts for a course.
     */
    public function reorderParts(ReorderCoursePartsRequest $request, string $id): JsonResponse
    {
        $course = Course::findOrFail($id);
        $auditContext = $request->auditContext(AdminCapabilities::MANAGE_PLATFORM_SETTINGS);

        $parts = $this->adminCourseService->reorderParts(
            course: $course,
            orderedPartIds: $request->getOrderedPartIds(),
            actor: $request->user(),
            auditContext: $auditContext
        );

        return $this->successResponse($parts);
    }
}
