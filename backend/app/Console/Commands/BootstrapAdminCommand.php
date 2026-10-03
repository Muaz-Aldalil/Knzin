<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\Admin\AdminCapabilityService;
use Illuminate\Console\Command;
use Illuminate\Database\QueryException;

class BootstrapAdminCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'knzin:bootstrap-admin 
                            {user : Email address or UUID of the initial administrator} 
                            {--token= : Secret deployment bootstrap credential}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'One-time out-of-band bootstrap for initial Administrator when zero active administrators exist';

    /**
     * Execute the console command.
     */
    public function handle(AdminCapabilityService $capabilityService): int
    {
        $identifier = (string) $this->argument('user');
        $suppliedToken = (string) $this->option('token');

        // Invariant 1: Require valid, operationally protected deployment bootstrap token
        $expectedToken = (string) config('knzin.admin.bootstrap_token');
        if (empty($suppliedToken) || empty($expectedToken) || !hash_equals($expectedToken, $suppliedToken)) {
            $this->error('AUTHORIZATION FAILED: Invalid or missing bootstrap credential token.');
            return self::FAILURE;
        }

        // Invariant 2: Target user must be an existing legitimate user record
        $targetUser = User::where('id', $identifier)
            ->orWhere('email', $identifier)
            ->first();

        if ($targetUser === null) {
            $this->error("Target user not found for identifier: {$identifier}");
            return self::FAILURE;
        }

        // Invariant 3: Atomic, race-safe check and provisioning within database transaction
        try {
            $capabilityService->bootstrapInitialAdmin($targetUser);
        } catch (\DomainException $de) {
            $this->error($de->getMessage());
            return self::FAILURE;
        } catch (QueryException $qe) {
            // Unique key violation on 'admin.bootstrap_singleton' guarantees concurrent race safety
            $this->error('CRITICAL: Bootstrap rejected. Initial Administrator has already been provisioned or concurrent bootstrap detected.');
            return self::FAILURE;
        }

        $this->info("Initial Administrator bootstrapped successfully:");
        $this->line(" - User ID: {$targetUser->id}");
        $this->line(" - Email: {$targetUser->email}");
        $this->line(" - Provisioning Source: bootstrap");
        $this->line(" - Granted Capabilities: manage_admin_capabilities, manage_platform_settings, adjudicate_affiliate_coprize");
        $this->warn("Bootstrap path is now permanently locked. Subsequent administrators must be delegated by an active Administrator.");

        return self::SUCCESS;
    }
}
