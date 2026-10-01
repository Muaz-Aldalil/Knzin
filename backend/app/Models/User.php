<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUuids, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'email',
        'learner_code',
        'display_name',
        'auth_provider',
        'provider_id',
        'avatar_url',
        'status',
        'merged_into_user_id',
        'email_verified_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
        ];
    }

    /**
     * Model boot hooks.
     */
    protected static function booted(): void
    {
        static::creating(function (User $user) {
            if (empty($user->learner_code)) {
                $user->learner_code = static::generateUniqueLearnerCode();
            }
        });
    }

    /**
     * Generate unique Crockford Base32 learner code (LRN-XXXXXX).
     */
    public static function generateUniqueLearnerCode(): string
    {
        $alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
        for ($attempt = 0; $attempt < 3; $attempt++) {
            $bytes = random_bytes(6);
            $chars = '';
            for ($i = 0; $i < 6; $i++) {
                $chars .= $alphabet[ord($bytes[$i]) % 32];
            }
            $candidate = 'LRN-' . $chars;
            if (!static::where('learner_code', $candidate)->exists()) {
                return $candidate;
            }
        }

        // High-entropy fallback if 3 collisions occur
        return 'LRN-' . substr(str_shuffle($alphabet), 0, 6);
    }

    /**
     * Get all orders placed by this user.
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Get all course entitlements held by this user.
     */
    public function courseEntitlements(): HasMany
    {
        return $this->hasMany(CourseEntitlement::class);
    }

    /**
     * Get all promotional tickets owned by this user.
     */
    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    /**
     * Get the verified user account this record merged into.
     */
    public function mergedIntoUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'merged_into_user_id');
    }

    /**
     * Get guest accounts that merged into this user.
     */
    public function mergedUsers(): HasMany
    {
        return $this->hasMany(User::class, 'merged_into_user_id');
    }

    /**
     * Check if user is a verified account.
     */
    public function isVerified(): bool
    {
        return !is_null($this->email_verified_at) && $this->auth_provider === 'google';
    }
}
