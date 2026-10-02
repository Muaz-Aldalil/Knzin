<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class GrantAdminCapabilityCommand extends Command
{
    /**
     * Allowed system capabilities.
     */
    public const ALLOWED_CAPABILITIES = [
        'manage_admin_capabilities',
        'manage_platform_settings',
        'adjudicate_affiliate_coprize',
        'issue_kyc_approval',
        'issue_draw_audit_approval',
    ];

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'knzin:grant-admin-capability 
                            {user : Email address or UUID of the target user} 
                            {capability=manage_platform_settings : The administrative capability to grant}
                            {--authorized-by= : Email address or UUID of the active Administrator authorizing this grant}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Grant a persistent server-side administrative capability under active Admin authority';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $identifier = (string) $this->argument('user');
        $capability = (string) $this->argument('capability');
        $authorizerOption = (string) $this->option('authorized-by');

        // Invariant 1: Capability must be a recognized system capability
        if (!in_array($capability, self::ALLOWED_CAPABILITIES, true)) {
            $this->error("Invalid capability [{$capability}]. Allowed: " . implode(', ', self::ALLOWED_CAPABILITIES));
            return self::FAILURE;
        }

        // Invariant 2: Explicit authorizer required (no convenience fallback)
        if (empty($authorizerOption)) {
            $this->error("AUTHORIZATION FAILED: Delegated admin provisioning requires explicit --authorized-by=<admin_email_or_id>.");
            return self::FAILURE;
        }

        // Resolve target user
        $targetUser = User::where('id', $identifier)
            ->orWhere('email', $identifier)
            ->first();

        if ($targetUser === null) {
            $this->error("Target user not found for identifier: {$identifier}");
            return self::FAILURE;
        }

        // Resolve authorizer
        $authorizer = User::where('id', $authorizerOption)
            ->orWhere('email', $authorizerOption)
            ->first();

        if ($authorizer === null) {
            $this->error("Authorizing Administrator not found for identifier: {$authorizerOption}");
            return self::FAILURE;
        }

        // Invariant 3: Authorizer must possess 'manage_admin_capabilities'
        if (!$authorizer->hasCapability('manage_admin_capabilities')) {
            $this->error("AUTHORIZATION FAILED: Authorizer [{$authorizer->id}] lacks required capability 'manage_admin_capabilities'.");
            return self::FAILURE;
        }

        // Invariant 4: Anti-self-escalation: Target user cannot self-grant admin capabilities
        if ($authorizer->id === $targetUser->id) {
            $this->error("AUTHORIZATION FAILED: Self-grant is forbidden. Administrators cannot grant capabilities to themselves.");
            return self::FAILURE;
        }

        $granted = $targetUser->grantCapability($capability, $authorizer, 'delegated_admin');

        $this->info("Successfully granted capability '{$capability}' under Admin authority:");
        $this->line(" - Target User: {$targetUser->id} ({$targetUser->email})");
        $this->line(" - Authorized By: {$authorizer->id} ({$authorizer->email})");
        $this->line(" - Granted At: {$granted->granted_at->toIso8601String()}");

        return self::SUCCESS;
    }
}
