<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\PlatformSettingsService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Console\Command;

class SetPlatformSettingCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'knzin:set-setting 
                            {key : The platform setting key (e.g. affiliate.payout_min_cents)} 
                            {value : The setting value}
                            {--user= : Email or UUID of the authorized Admin user executing this change}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Set a dynamic platform setting in the database under persistent Admin authorization';

    /**
     * Execute the console command.
     */
    public function handle(PlatformSettingsService $settingsService): int
    {
        $key = (string) $this->argument('key');
        $rawValue = (string) $this->argument('value');
        $userOption = $this->option('user');

        $actor = null;
        if (!empty($userOption)) {
            $actor = User::where('id', $userOption)
                ->orWhere('email', $userOption)
                ->first();

            if ($actor === null) {
                $this->error("Admin user not found for identifier: {$userOption}");
                return self::FAILURE;
            }
        } else {
            // In local/testing console environments, check if an active admin user exists
            $actor = User::whereHas('adminCapabilities', function ($q) {
                $q->active()->where('capability', 'manage_platform_settings');
            })->first();

            if ($actor === null) {
                $this->error("CRITICAL: Operation requires an authorized Admin user possessing 'manage_platform_settings'. Provide --user=<id|email> or grant capability first via knzin:grant-admin-capability.");
                return self::FAILURE;
            }
        }

        // Cast numeric values to integer/float appropriately
        $parsedValue = is_numeric($rawValue) ? (str_contains($rawValue, '.') ? (float) $rawValue : (int) $rawValue) : $rawValue;

        try {
            $settingsService->set($key, $parsedValue, $actor);
        } catch (AuthorizationException $e) {
            $this->error("AUTHORIZATION FAILED: " . $e->getMessage());
            return self::FAILURE;
        }

        $this->info("Platform setting updated successfully under authorized Admin context:");
        $this->line(" - Key: {$key}");
        $this->line(" - Value: " . json_encode($parsedValue));
        $this->line(" - Authorized By: {$actor->id} ({$actor->email})");

        return self::SUCCESS;
    }
}
