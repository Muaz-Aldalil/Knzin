<?php

namespace App\Providers;

use App\Models\User;
use App\Services\ApprovalRegistryService;
use App\Services\ApprovalRegistryServiceInterface;
use App\Services\CoPrizeApprovalProviderInterface;
use App\Services\DatabaseCoPrizeApprovalProvider;
use App\Support\AdminCapabilities;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
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

        $this->app->bind(
            \App\Services\AffiliateCoPrizeServiceInterface::class,
            \App\Services\AffiliateCoPrizeService::class
        );

        $this->app->singleton(
            \Illuminate\Notifications\Channels\DatabaseChannel::class,
            \App\Channels\DatabaseChannel::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Define persistent Admin authorization gates for all six approved capabilities under least privilege model
        foreach (AdminCapabilities::ALL as $capability) {
            Gate::define($capability, function (?User $user) use ($capability) {
                return $user !== null && $user->hasCapability($capability);
            });
        }

        RateLimiter::for('admin', function ($request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });
    }
}
