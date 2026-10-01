<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseEntitlement extends Model
{
    use HasFactory, HasUuids;

    protected $guarded = ['id'];

    /**
     * Relationship: Learner holding the entitlement.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relationship: Course covered by the entitlement.
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Relationship: Specific course part (null = full bundle).
     */
    public function coursePart(): BelongsTo
    {
        return $this->belongsTo(CoursePart::class);
    }

    /**
     * Relationship: Originating fulfilled order.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Relationship: Superseding entitlement pointer for merged accounts.
     */
    public function supersededBy(): BelongsTo
    {
        return $this->belongsTo(CourseEntitlement::class, 'superseded_by_entitlement_id');
    }

    /**
     * Query scope: Pure boolean access check for effective active entitlement.
     * Evaluates whether user has active bundle access (course_part_id is null)
     * OR specific active modular part access.
     */
    public function scopeEffective(Builder $query, string $userId, string $courseId, ?string $partId = null): Builder
    {
        return $query->where('user_id', $userId)
            ->where('course_id', $courseId)
            ->where('status', 'active')
            ->where(function (Builder $q) use ($partId) {
                $q->whereNull('course_part_id');
                if ($partId !== null) {
                    $q->orWhere('course_part_id', $partId);
                }
            });
    }
}
