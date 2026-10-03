<?php

namespace App\Services\Admin;

use App\Exceptions\LastAdminLockoutException;
use App\Models\PlatformSetting;
use App\Models\User;
use App\Support\AdminCapabilities;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;

class AdminCapabilityService
{
    public function __construct(
        private readonly AdminAuditWriter $auditWriter = new AdminAuditWriter()
    ) {
    }

    /**
     * Resolves and asserts target user eligibility for administrative privileges.
     */
    public function assertEligibleTarget(User|string $target): User
    {
        $user = is_string($target) ? $this->resolveUser($target) : $target;

        if ($user->status !== 'active') {
            throw ValidationException::withMessages([
                'target' => ['Target user account is not active.'],
            ]);
        }

        if ($user->merged_into_user_id !== null) {
            throw ValidationException::withMessages([
                'target' => ['Merged accounts cannot hold administrative capabilities.'],
            ]);
        }

        if (method_exists($user, 'isVerified') && !$user->isVerified()) {
            throw ValidationException::withMessages([
                'target' => ['Target user email must be verified.'],
            ]);
        }

        return $user;
    }

    /**
     * Grant an administrative capability to a target user.
     */
    public function grant(
        User|string $target,
        string $capability,
        User $actor,
        ?AdminAuditContext $auditContext = null
    ): void {
        if (!in_array($capability, AdminCapabilities::ALL, true)) {
            throw new InvalidArgumentException("Capability '{$capability}' is not an approved administrative capability.");
        }

        $user = $this->assertEligibleTarget($target);

        if ($user->id === $actor->id) {
            throw new AuthorizationException('Self-granting administrative capabilities is strictly prohibited.');
        }

        DB::transaction(function () use ($user, $capability, $actor, $auditContext) {
            $user->grantCapability($capability, $actor, 'delegated_admin');

            if ($auditContext) {
                $this->auditWriter->record(
                    context: $auditContext,
                    action: 'capability.granted',
                    targetType: 'user',
                    targetId: $user->id,
                    beforeState: null,
                    afterState: [
                        'capability' => $capability,
                        'granted_to' => $user->id,
                    ]
                );
            }
        });
    }

    /**
     * Revoke an administrative capability from a target user.
     */
    public function revoke(
        User|string $target,
        string $capability,
        User $actor,
        ?string $reason = null,
        ?AdminAuditContext $auditContext = null
    ): void {
        if (!in_array($capability, AdminCapabilities::ALL, true)) {
            throw new InvalidArgumentException("Capability '{$capability}' is not an approved administrative capability.");
        }

        $user = is_string($target) ? $this->resolveUser($target) : $target;

        DB::transaction(function () use ($user, $capability, $actor, $reason, $auditContext) {
            // Lock target row and assess last-admin lockout
            if ($capability === AdminCapabilities::MANAGE_ADMIN_CAPABILITIES) {
                $activeHoldersCount = DB::table('admin_capabilities')
                    ->join('users', 'users.id', '=', 'admin_capabilities.user_id')
                    ->where('admin_capabilities.capability', AdminCapabilities::MANAGE_ADMIN_CAPABILITIES)
                    ->where('admin_capabilities.status', 'active')
                    ->where('users.status', 'active')
                    ->whereNull('users.merged_into_user_id')
                    ->lockForUpdate()
                    ->count();

                if ($activeHoldersCount <= 1 && $user->hasCapability(AdminCapabilities::MANAGE_ADMIN_CAPABILITIES)) {
                    throw new LastAdminLockoutException('Cannot revoke manage_admin_capabilities from the last active administrator.');
                }
            }

            $user->revokeCapability($capability, $actor, $reason);

            if ($auditContext) {
                $this->auditWriter->record(
                    context: $auditContext,
                    action: 'capability.revoked',
                    targetType: 'user',
                    targetId: $user->id,
                    beforeState: ['capability' => $capability],
                    afterState: ['status' => 'revoked', 'reason' => $reason]
                );
            }
        });
    }

    /**
     * Bootstrap the initial administrator when zero active admins exist.
     */
    public function bootstrapInitialAdmin(User $targetUser): void
    {
        DB::transaction(function () use ($targetUser) {
            $activeAdminExists = DB::table('admin_capabilities')
                ->where('status', 'active')
                ->exists();

            if ($activeAdminExists) {
                throw new \DomainException('CRITICAL: Bootstrap rejected. An active Administrator already exists in the system. Use delegated Admin provisioning (knzin:grant-admin-capability).');
            }

            PlatformSetting::create([
                'key' => 'admin.bootstrap_singleton',
                'value' => [
                    'bootstrapped_user_id' => $targetUser->id,
                    'bootstrapped_at' => now()->toIso8601String(),
                ],
                'updated_by_user_id' => $targetUser->id,
                'description' => 'Initial administrator bootstrap lock',
            ]);

            $targetUser->grantCapability(AdminCapabilities::MANAGE_ADMIN_CAPABILITIES, null, 'bootstrap');
            $targetUser->grantCapability(AdminCapabilities::MANAGE_PLATFORM_SETTINGS, null, 'bootstrap');
            $targetUser->grantCapability(AdminCapabilities::ADJUDICATE_AFFILIATE_COPRIZE, null, 'bootstrap');
        });
    }

    public function resolveUser(string $identifier): User
    {
        // Lookup by UUID
        if (preg_match('/^[0-9a-fA-F-]{36}$/', $identifier)) {
            $user = User::find($identifier);
            if ($user) {
                return $user;
            }
        }

        // Lookup by exact email
        $matches = User::where('email', $identifier)->get();
        if ($matches->count() > 1) {
            throw ValidationException::withMessages([
                'target' => ['Ambiguous user email: multiple accounts found. Please specify user UUID.'],
            ]);
        }

        if ($matches->count() === 1) {
            return $matches->first();
        }

        // Lookup by learner code
        $byCode = User::where('learner_code', $identifier)->first();
        if ($byCode) {
            return $byCode;
        }

        throw ValidationException::withMessages([
            'target' => ['Target user not found.'],
        ]);
    }
}
