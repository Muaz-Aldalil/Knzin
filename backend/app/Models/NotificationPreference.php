<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationPreference extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'course_announcements',
        'prize_draw_promotions',
        'admin_broadcasts',
        'unsubscribed_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'course_announcements' => 'boolean',
            'prize_draw_promotions' => 'boolean',
            'admin_broadcasts' => 'boolean',
            'unsubscribed_at' => 'datetime',
        ];
    }

    /**
     * Get the user that owns the preferences.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Determine if a specific marketing category is allowed.
     */
    public function allowsCategory(string $category): bool
    {
        if ($this->unsubscribed_at !== null) {
            return false;
        }

        return match ($category) {
            'course_announcements' => (bool) $this->course_announcements,
            'prize_draw_promotions' => (bool) $this->prize_draw_promotions,
            'admin_broadcasts' => (bool) $this->admin_broadcasts,
            default => true,
        };
    }

    /**
     * Determine if user has unsubscribed from all marketing communications.
     */
    public function isUnsubscribedFromAll(): bool
    {
        return $this->unsubscribed_at !== null;
    }
}
