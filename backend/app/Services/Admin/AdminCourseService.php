<?php

namespace App\Services\Admin;

use App\Models\Course;
use App\Models\CourseEntitlement;
use App\Models\CoursePart;
use App\Models\LessonProgress;
use App\Models\OrderItem;
use App\Models\User;
use App\Notifications\CourseContentUpdatedNotification;
use App\Notifications\NewCourseNotification;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminCourseService
{
    public function __construct(
        protected AdminAuditWriter $auditWriter
    ) {
    }

    /**
     * Create a new course inside an active transaction with audit logging.
     */
    public function createCourse(array $data, User $actor, AdminAuditContext $auditContext): Course
    {
        return DB::transaction(function () use ($data, $actor, $auditContext) {
            $slug = !empty($data['slug'])
                ? Str::slug($data['slug'])
                : Str::slug($data['title_en'] ?? $data['title_ar'] ?? Str::random(8));

            // Ensure slug uniqueness
            $baseSlug = $slug;
            $counter = 1;
            while (Course::where('slug', $slug)->exists()) {
                $slug = "{$baseSlug}-{$counter}";
                $counter++;
            }

            $course = Course::create([
                'slug' => $slug,
                'title_ar' => $data['title_ar'],
                'title_en' => $data['title_en'] ?? $data['title_ar'],
                'description_ar' => $data['description_ar'],
                'description_en' => $data['description_en'] ?? $data['description_ar'],
                'cover_image_url' => $data['cover_image_url'] ?? '',
                'bundle_price_cents' => (int) ($data['bundle_price_cents'] ?? 1000),
                'bundle_promotional_tickets' => (int) ($data['bundle_promotional_tickets'] ?? 15),
                'display_price_label' => $data['display_price_label'] ?? $this->formatIqdPrice((int) ($data['bundle_price_cents'] ?? 1000)),
                'is_active' => $data['is_active'] ?? true,
                'outcomes' => $data['outcomes'] ?? null,
                'curriculum_summary_ar' => $data['curriculum_summary_ar'] ?? null,
                'curriculum_summary_en' => $data['curriculum_summary_en'] ?? null,
            ]);

            $this->auditWriter->record(
                context: $auditContext,
                action: 'create_course',
                targetType: 'course',
                targetId: (string) $course->id,
                beforeState: null,
                afterState: $course->toArray(),
                outcome: 'success',
                reasonCode: 'COURSE_CREATED'
            );

            $this->clearCatalogCache();

            if ($course->is_active) {
                DB::afterCommit(function () use ($course) {
                    User::where('status', 'active')->chunkById(250, function ($users) use ($course) {
                        foreach ($users as $user) {
                            $user->notify(new NewCourseNotification($course, $user));
                        }
                    });
                });
            }

            return $course;
        });
    }

    /**
     * Update an existing course inside an active transaction with audit logging.
     */
    public function updateCourse(Course $course, array $data, User $actor, AdminAuditContext $auditContext): Course
    {
        return DB::transaction(function () use ($course, $data, $actor, $auditContext) {
            $beforeState = $course->toArray();

            $updateFields = [];
            foreach (['title_ar', 'title_en', 'description_ar', 'description_en', 'cover_image_url', 'is_active', 'outcomes', 'curriculum_summary_ar', 'curriculum_summary_en'] as $field) {
                if (array_key_exists($field, $data)) {
                    $updateFields[$field] = $data[$field];
                }
            }

            if (isset($data['slug']) && $data['slug'] !== $course->slug) {
                $newSlug = Str::slug($data['slug']);
                if (Course::where('slug', $newSlug)->where('id', '!=', $course->id)->exists()) {
                    throw new \InvalidArgumentException("Slug '{$newSlug}' is already taken by another course.");
                }
                $updateFields['slug'] = $newSlug;
            }

            if (isset($data['bundle_price_cents'])) {
                $cents = max(0, (int) $data['bundle_price_cents']);
                $updateFields['bundle_price_cents'] = $cents;
                if (!isset($data['display_price_label'])) {
                    $updateFields['display_price_label'] = $this->formatIqdPrice($cents);
                }
            }

            if (isset($data['bundle_promotional_tickets'])) {
                $updateFields['bundle_promotional_tickets'] = max(0, (int) $data['bundle_promotional_tickets']);
            }

            if (isset($data['display_price_label'])) {
                $updateFields['display_price_label'] = $data['display_price_label'];
            }

            $course->update($updateFields);
            $fresh = $course->fresh();

            $hasLearnerChanges = $course->wasChanged([
                'title_ar', 'title_en', 'description_ar', 'description_en',
                'curriculum_summary_ar', 'curriculum_summary_en', 'outcomes', 'cover_image_url'
            ]);

            $this->auditWriter->record(
                context: $auditContext,
                action: 'update_course',
                targetType: 'course',
                targetId: (string) $course->id,
                beforeState: $beforeState,
                afterState: $fresh->toArray(),
                outcome: 'success',
                reasonCode: 'COURSE_UPDATED'
            );

            $this->clearCatalogCache();

            if ($hasLearnerChanges) {
                $this->notifyEntitledLearners($fresh);
            }

            return $fresh;
        });
    }

    /**
     * Toggle course active/paused status.
     */
    public function toggleStatus(Course $course, User $actor, AdminAuditContext $auditContext): Course
    {
        return DB::transaction(function () use ($course, $actor, $auditContext) {
            $beforeState = ['is_active' => $course->is_active];
            $course->is_active = !$course->is_active;
            $course->save();

            $this->auditWriter->record(
                context: $auditContext,
                action: 'toggle_course_status',
                targetType: 'course',
                targetId: (string) $course->id,
                beforeState: $beforeState,
                afterState: ['is_active' => $course->is_active],
                outcome: 'success',
                reasonCode: $course->is_active ? 'COURSE_ACTIVATED' : 'COURSE_PAUSED'
            );

            $this->clearCatalogCache();

            if ($course->is_active) {
                DB::afterCommit(function () use ($course) {
                    User::where('status', 'active')->chunkById(250, function ($users) use ($course) {
                        foreach ($users as $user) {
                            $user->notify(new NewCourseNotification($course, $user));
                        }
                    });
                });
            }

            return $course;
        });
    }

    /**
     * Safely delete or archive course to protect existing student enrollments.
     */
    public function deleteCourse(Course $course, User $actor, AdminAuditContext $auditContext): array
    {
        return DB::transaction(function () use ($course, $actor, $auditContext) {
            $hasEntitlements = CourseEntitlement::where('course_id', $course->id)->exists();
            $hasOrders = OrderItem::where('course_id', $course->id)->exists();

            if ($hasEntitlements || $hasOrders) {
                // Safeguard: Do not hard delete courses held by active learners
                $course->update(['is_active' => false]);

                $this->auditWriter->record(
                    context: $auditContext,
                    action: 'archive_course',
                    targetType: 'course',
                    targetId: (string) $course->id,
                    beforeState: ['is_active' => true],
                    afterState: ['is_active' => false],
                    outcome: 'success',
                    reasonCode: 'COURSE_ARCHIVED_ACTIVE_STUDENTS'
                );

                $this->clearCatalogCache();

                return [
                    'action_taken' => 'archived',
                    'message' => 'Course deactivated and archived to preserve active learner entitlements and purchase history.',
                    'course' => $course->fresh(),
                ];
            }

            $before = $course->toArray();
            $course->parts()->delete();
            $course->delete();

            $this->auditWriter->record(
                context: $auditContext,
                action: 'delete_course',
                targetType: 'course',
                targetId: (string) $course->id,
                beforeState: $before,
                afterState: null,
                outcome: 'success',
                reasonCode: 'COURSE_HARD_DELETED'
            );

            $this->clearCatalogCache();

            return [
                'action_taken' => 'deleted',
                'message' => 'Course and draft parts deleted permanently.',
            ];
        });
    }

    /**
     * Add a modular course part.
     */
    public function addPart(Course $course, array $data, User $actor, AdminAuditContext $auditContext): CoursePart
    {
        return DB::transaction(function () use ($course, $data, $actor, $auditContext) {
            $maxPart = CoursePart::where('course_id', $course->id)->max('part_number') ?? 0;
            $partNumber = isset($data['part_number']) && $data['part_number'] > 0
                ? (int) $data['part_number']
                : ($maxPart + 1);

            $partPrice = isset($data['part_price_cents']) ? max(0, (int) $data['part_price_cents']) : 200;
            $tickets = isset($data['part_promotional_tickets']) ? max(0, (int) $data['part_promotional_tickets']) : 1;

            $part = CoursePart::create([
                'course_id' => $course->id,
                'part_number' => $partNumber,
                'title_ar' => $data['title_ar'],
                'title_en' => $data['title_en'] ?? $data['title_ar'],
                'syllabus_ar' => $data['syllabus_ar'] ?? '',
                'syllabus_en' => $data['syllabus_en'] ?? ($data['syllabus_ar'] ?? ''),
                'part_price_cents' => $partPrice,
                'part_promotional_tickets' => $tickets,
                'display_price_label' => $data['display_price_label'] ?? $this->formatIqdPrice($partPrice),
                'resource_types' => $data['resource_types'] ?? ['video', 'pdf'],
                'duration_minutes' => (int) ($data['duration_minutes'] ?? 45),
                'is_active' => $data['is_active'] ?? true,
                'is_free' => (bool) ($data['is_free'] ?? ($partNumber === 1)),
                'video_url' => $data['video_url'] ?? null,
                'pdf_url' => $data['pdf_url'] ?? null,
                'pdf_title_ar' => $data['pdf_title_ar'] ?? null,
                'pdf_title_en' => $data['pdf_title_en'] ?? null,
            ]);

            $this->auditWriter->record(
                context: $auditContext,
                action: 'create_course_part',
                targetType: 'course_part',
                targetId: (string) $part->id,
                beforeState: null,
                afterState: $part->toArray(),
                outcome: 'success',
                reasonCode: 'COURSE_PART_CREATED'
            );

            $this->clearCatalogCache();
            $this->notifyEntitledLearners($course);

            return $part;
        });
    }

    /**
     * Update a course part with full media and access controls.
     */
    public function updatePart(CoursePart $part, array $data, User $actor, AdminAuditContext $auditContext): CoursePart
    {
        return DB::transaction(function () use ($part, $data, $actor, $auditContext) {
            $beforeState = $part->toArray();

            $updateFields = [];
            foreach ([
                'title_ar', 'title_en', 'syllabus_ar', 'syllabus_en',
                'resource_types', 'duration_minutes', 'is_active', 'is_free',
                'video_url', 'pdf_url', 'pdf_title_ar', 'pdf_title_en'
            ] as $field) {
                if (array_key_exists($field, $data)) {
                    $updateFields[$field] = $data[$field];
                }
            }

            if (isset($data['part_number']) && $data['part_number'] !== $part->part_number) {
                $targetNumber = (int) $data['part_number'];
                // Check if another part has this number
                $existing = CoursePart::where('course_id', $part->course_id)
                    ->where('part_number', $targetNumber)
                    ->where('id', '!=', $part->id)
                    ->first();
                if ($existing) {
                    // Swap part numbers cleanly
                    $existing->part_number = $part->part_number;
                    $existing->save();
                }
                $updateFields['part_number'] = $targetNumber;
            }

            if (isset($data['part_price_cents'])) {
                $cents = max(0, (int) $data['part_price_cents']);
                $updateFields['part_price_cents'] = $cents;
                if (!isset($data['display_price_label'])) {
                    $updateFields['display_price_label'] = $this->formatIqdPrice($cents);
                }
            }

            if (isset($data['part_promotional_tickets'])) {
                $updateFields['part_promotional_tickets'] = max(0, (int) $data['part_promotional_tickets']);
            }

            if (isset($data['display_price_label'])) {
                $updateFields['display_price_label'] = $data['display_price_label'];
            }

            $part->update($updateFields);
            $fresh = $part->fresh();

            $hasLearnerChanges = $part->wasChanged([
                'title_ar', 'title_en', 'syllabus_ar', 'syllabus_en',
                'resource_types', 'duration_minutes', 'is_active', 'is_free',
                'video_url', 'pdf_url', 'pdf_title_ar', 'pdf_title_en', 'part_number'
            ]);

            $this->auditWriter->record(
                context: $auditContext,
                action: 'update_course_part',
                targetType: 'course_part',
                targetId: (string) $part->id,
                beforeState: $beforeState,
                afterState: $fresh->toArray(),
                outcome: 'success',
                reasonCode: 'COURSE_PART_UPDATED'
            );

            $this->clearCatalogCache();

            if ($hasLearnerChanges) {
                $parentCourse = Course::find($part->course_id);
                if ($parentCourse) {
                    $this->notifyEntitledLearners($parentCourse);
                }
            }

            return $fresh;
        });
    }

    /**
     * Safely delete or deactivate course part to protect existing student progress.
     */
    public function deletePart(CoursePart $part, User $actor, AdminAuditContext $auditContext): array
    {
        return DB::transaction(function () use ($part, $actor, $auditContext) {
            $hasEntitlements = CourseEntitlement::where('course_part_id', $part->id)
                ->orWhere(function ($q) use ($part) {
                    $q->where('course_id', $part->course_id)->whereNull('course_part_id');
                })
                ->exists();
            $hasProgress = LessonProgress::where('course_part_id', $part->id)->exists();
            $hasOrders = OrderItem::where('course_part_id', $part->id)
                ->orWhere(function ($q) use ($part) {
                    $q->where('course_id', $part->course_id)->whereNull('course_part_id');
                })
                ->exists();

            $courseId = $part->course_id;

            if ($hasEntitlements || $hasProgress || $hasOrders) {
                // Safeguard: deactivating protects student records
                $part->update(['is_active' => false]);

                $this->auditWriter->record(
                    context: $auditContext,
                    action: 'archive_course_part',
                    targetType: 'course_part',
                    targetId: (string) $part->id,
                    beforeState: ['is_active' => true],
                    afterState: ['is_active' => false],
                    outcome: 'success',
                    reasonCode: 'PART_ARCHIVED_ACTIVE_STUDENTS'
                );

                $parentCourse = Course::find($courseId);
                if ($parentCourse) {
                    $this->notifyEntitledLearners($parentCourse);
                }

                return [
                    'action_taken' => 'archived',
                    'message' => 'Part deactivated and archived to protect existing learner progress and entitlements.',
                    'part' => $part->fresh(),
                ];
            }

            $before = $part->toArray();
            $part->delete();

            $this->auditWriter->record(
                context: $auditContext,
                action: 'delete_course_part',
                targetType: 'course_part',
                targetId: (string) $part->id,
                beforeState: $before,
                afterState: null,
                outcome: 'success',
                reasonCode: 'PART_HARD_DELETED'
            );

            $parentCourse = Course::find($courseId);
            if ($parentCourse) {
                $this->notifyEntitledLearners($parentCourse);
            }

            $this->clearCatalogCache();

            return [
                'action_taken' => 'deleted',
                'message' => 'Part removed successfully.',
            ];
        });
    }

    /**
     * Reorder parts for a course atomically.
     */
    public function reorderParts(Course $course, array $orderedPartIds, User $actor, AdminAuditContext $auditContext): array
    {
        return DB::transaction(function () use ($course, $orderedPartIds, $actor, $auditContext) {
            $parts = CoursePart::where('course_id', $course->id)->get()->keyBy('id');
            $beforeState = $parts->map(fn ($p) => ['id' => $p->id, 'part_number' => $p->part_number])->toArray();

            // Temporary offset (200..255) to prevent unique constraint conflicts within unsignedTinyInteger
            foreach ($orderedPartIds as $index => $id) {
                if (isset($parts[$id])) {
                    $parts[$id]->part_number = 200 + $index;
                    $parts[$id]->save();
                }
            }

            // Assign final canonical 1-based order
            $afterState = [];
            foreach ($orderedPartIds as $index => $id) {
                if (isset($parts[$id])) {
                    $canonicalNumber = $index + 1;
                    $parts[$id]->part_number = $canonicalNumber;
                    $parts[$id]->save();
                    $afterState[] = ['id' => $id, 'part_number' => $canonicalNumber];
                }
            }

            $this->auditWriter->record(
                context: $auditContext,
                action: 'reorder_course_parts',
                targetType: 'course',
                targetId: (string) $course->id,
                beforeState: $beforeState,
                afterState: $afterState,
                outcome: 'success',
                reasonCode: 'PARTS_REORDERED'
            );

            $this->clearCatalogCache();

            if (!empty($afterState)) {
                $this->notifyEntitledLearners($course);
            }

            return CoursePart::where('course_id', $course->id)->orderBy('part_number', 'asc')->get()->toArray();
        });
    }

    /**
     * Clear public catalog cache so learners see updates immediately.
     */
    protected function clearCatalogCache(): void
    {
        Cache::forget('catalog_courses_index');
    }

    /**
     * Increment course content version and notify all actively entitled learners via in-app notification.
     */
    protected function notifyEntitledLearners(Course $course): void
    {
        $course->increment('content_version');
        $version = (int) $course->fresh()->content_version;

        DB::afterCommit(function () use ($course, $version) {
            $userIds = CourseEntitlement::where('course_id', $course->id)
                ->where('status', 'active')
                ->pluck('user_id')
                ->unique();

            if ($userIds->isEmpty()) {
                return;
            }

            User::whereIn('id', $userIds)->where('status', 'active')->chunkById(250, function ($users) use ($course, $version) {
                foreach ($users as $user) {
                    $notificationId = \Ramsey\Uuid\Uuid::uuid5(
                        \Ramsey\Uuid\Uuid::NAMESPACE_OID,
                        "admin_update:course:{$course->id}:v{$version}:{$user->id}"
                    )->toString();

                    if (!DB::table('notifications')->where('id', $notificationId)->exists()) {
                        $user->notify(new CourseContentUpdatedNotification($course, $version, $user));
                    }
                }
            });
        });
    }

    /**
     * Compute approximate IQD display label from USD cents ($1 = 1,300 IQD).
     */
    protected function formatIqdPrice(int $priceCents): string
    {
        $usd = $priceCents / 100;
        $iqd = round($usd * 1300);
        return number_format($iqd) . ' IQD';
    }
}
