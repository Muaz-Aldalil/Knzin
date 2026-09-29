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
     * Get all orders placed by this user.
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
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
