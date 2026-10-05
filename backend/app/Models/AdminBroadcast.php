<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminBroadcast extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'admin_user_id',
        'title_ar',
        'title_en',
        'body_ar',
        'body_en',
        'channels',
        'sent_count',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'channels' => 'array',
            'sent_count' => 'integer',
        ];
    }

    /**
     * Get the administrator user who sent the broadcast.
     */
    public function adminUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_user_id');
    }
}
