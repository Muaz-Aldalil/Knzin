<?php

namespace App\Models;

use App\Exceptions\ImmutableAuditException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminActivityLog extends Model
{
    protected $table = 'admin_activity_logs';

    public $timestamps = false;

    protected $guarded = ['id'];

    protected $casts = [
        'before_state' => 'array',
        'after_state' => 'array',
        'created_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::updating(function () {
            throw new ImmutableAuditException('Admin activity log entries are immutable and cannot be updated.');
        });

        static::deleting(function () {
            throw new ImmutableAuditException('Admin activity log entries are immutable and cannot be deleted.');
        });
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }
}
