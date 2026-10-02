<?php

namespace App\Providers;

use App\Models\User;
use App\Services\ApprovalRegistryService;
use App\Services\ApprovalRegistryServiceInterface;
use App\Services\CoPrizeApprovalProviderInterface;
use App\Services\DatabaseCoPrizeApprovalProvider;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(
            CoPrizeApprovalProviderInterface::class,
            DatabaseCoPrizeApprovalProvider::class
        );

        $this->app->bind(
            ApprovalRegistryServiceInterface::class,
            ApprovalRegistryService::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Define persistent Admin authorization gates under least privilege model
        Gate::define('manage_platform_settings', function (?User $user) {
            return $user !== null && $user->hasCapability('manage_platform_settings');
        });

        Gate::define('adjudicate_affiliate_coprize', function (?User $user) {
            return $user !== null && $user->hasCapability('adjudicate_affiliate_coprize');
        });

        Gate::define('manage_admin_capabilities', function (?User $user) {
            return $user !== null && $user->hasCapability('manage_admin_capabilities');
        });

        Gate::define('issue_kyc_approval', function (?User $user) {
            return $user !== null && $user->hasCapability('issue_kyc_approval');
        });

        Gate::define('issue_draw_audit_approval', function (?User $user) {
            return $user !== null && $user->hasCapability('issue_draw_audit_approval');
        });
    }
}
