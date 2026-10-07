<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
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
     * Get notification preferences for this user.
     */
    public function notificationPreferences(): HasOne
    {
        return $this->hasOne(NotificationPreference::class);
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
         return !is_null($this->email_verified_at) && $this->auth_provider !== 'guest';
     }

    /**
     * Affiliate profile associated with this user.
     */
    public function affiliateProfile(): HasOne
    {
        return $this->hasOne(AffiliateProfile::class);
    }

    /**
     * Referral attributions where this user is the credited referrer.
     */
    public function referralAttributions(): HasMany
    {
        return $this->hasMany(ReferralAttribution::class, 'referrer_user_id');
    }

    /**
     * Affiliate subledger entries owned by this user.
     */
    public function affiliateLedgerEntries(): HasMany
    {
        return $this->hasMany(AffiliateLedgerEntry::class);
    }

    /**
     * Affiliate payout requests submitted by this user.
     */
    public function affiliatePayouts(): HasMany
    {
        return $this->hasMany(AffiliatePayout::class);
    }

    /**
     * Admin capabilities persistently granted to this user.
     */
    public function adminCapabilities(): HasMany
    {
        return $this->hasMany(AdminCapability::class);
    }

    /**
     * Check if user possesses an active persistent administrative capability.
     */
    public function hasCapability(string $capability): bool
    {
        return $this->adminCapabilities()
            ->active()
            ->where('capability', $capability)
            ->exists();
    }

    /**
     * Check if user possesses any active administrative capabilities.
     */
    public function isAdmin(): bool
    {
        return $this->adminCapabilities()->active()->exists();
    }

    /**
     * Grant a persistent administrative capability to this user.
     */
    public function grantCapability(
        string $capability,
        ?User $grantedBy = null,
        string $source = 'delegated_admin'
    ): AdminCapability {
        $existing = $this->adminCapabilities()
            ->where('capability', $capability)
            ->first();

        if ($existing !== null) {
            $existing->update([
                'status' => 'active',
                'provisioning_source' => $source,
                'granted_at' => now(),
                'granted_by_user_id' => $grantedBy?->id,
                'revoked_at' => null,
                'revoked_by_user_id' => null,
                'revocation_reason' => null,
            ]);
            return $existing->fresh();
        }

        return AdminCapability::create([
            'user_id' => $this->id,
            'capability' => $capability,
            'status' => 'active',
            'provisioning_source' => $source,
            'granted_at' => now(),
            'granted_by_user_id' => $grantedBy?->id,
        ]);
    }

    /**
     * Revoke a persistent administrative capability from this user with audit provenance.
     */
    public function revokeCapability(
        string $capability,
        ?User $revokedBy = null,
        ?string $reason = null
    ): bool {
        $existing = $this->adminCapabilities()
            ->where('capability', $capability)
            ->where('status', 'active')
            ->first();

        if ($existing === null) {
            return false;
        }

        return $existing->revoke($revokedBy, $reason);
    }
}

