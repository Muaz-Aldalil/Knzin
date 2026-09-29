<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LessonProgress extends Model
{
    use HasUuids;

    protected $table = 'lesson_progress';

    protected $fillable = [
        'user_id',
        'course_id',
        'course_part_id',
        'watch_seconds',
        'percent_complete',
        'is_completed',
        'last_watched_at',
    ];

    protected $casts = [
        'watch_seconds' => 'integer',
        'percent_complete' => 'integer',
        'is_completed' => 'boolean',
        'last_watched_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function coursePart(): BelongsTo
    {
        return $this->belongsTo(CoursePart::class, 'course_part_id');
    }
}
