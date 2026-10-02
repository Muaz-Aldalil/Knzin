<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class RevokeAdminCapabilityCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'knzin:revoke-admin-capability 
                            {user : Email address or UUID of the target user} 
                            {capability=manage_platform_settings : The administrative capability to revoke}
                            {--authorized-by= : Email address or UUID of the active Administrator authorizing this revocation}
                            {--reason= : Administrative audit reason for revocation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Revoke a persistent administrative capability from a user with audit provenance';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $identifier = (string) $this->argument('user');
        $capability = (string) $this->argument('capability');
        $authorizerOption = (string) $this->option('authorized-by');
        $reason = (string) ($this->option('reason') ?? 'Administrative deactivation');

        // Invariant 1: Explicit authorizer required (no convenience fallback)
        if (empty($authorizerOption)) {
            $this->error("AUTHORIZATION FAILED: Revocation requires explicit --authorized-by=<admin_email_or_id>.");
            return self::FAILURE;
        }

        $targetUser = User::where('id', $identifier)
            ->orWhere('email', $identifier)
            ->first();

        if ($targetUser === null) {
            $this->error("Target user not found for identifier: {$identifier}");
            return self::FAILURE;
        }

        $authorizer = User::where('id', $authorizerOption)
            ->orWhere('email', $authorizerOption)
            ->first();

        if ($authorizer === null) {
            $this->error("Authorizing Administrator not found for identifier: {$authorizerOption}");
            return self::FAILURE;
        }

        // Invariant 2: Authorizer must possess 'manage_admin_capabilities'
        if (!$authorizer->hasCapability('manage_admin_capabilities')) {
            $this->error("AUTHORIZATION FAILED: Authorizer [{$authorizer->id}] lacks required capability 'manage_admin_capabilities'.");
            return self::FAILURE;
        }

        $revoked = $targetUser->revokeCapability($capability, $authorizer, $reason);

        if (!$revoked) {
            $this->warn("User [{$targetUser->id}] had no active capability '{$capability}' to revoke.");
            return self::SUCCESS;
        }

        $this->info("Successfully revoked capability '{$capability}':");
        $this->line(" - Target User: {$targetUser->id} ({$targetUser->email})");
        $this->line(" - Revoked By: {$authorizer->id} ({$authorizer->email})");
        $this->line(" - Reason: {$reason}");

        return self::SUCCESS;
    }
}
