<?php

namespace Tests\Feature\Admin;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class AdminRoutesCapabilityCoverageTest extends TestCase
{
    public function test_all_admin_routes_adhere_to_capability_coverage_invariants(): void
    {
        $adminRoutes = collect(Route::getRoutes()->getRoutes())
            ->filter(fn ($r) => str_starts_with($r->uri(), 'api/v1/admin'));

        $this->assertCount(43, $adminRoutes, 'Expected exactly 43 admin routes.');

        foreach ($adminRoutes as $route) {
            $uri = $route->uri();
            $middleware = $route->gatherMiddleware();

            // Invariant 4: No bootstrap route exists under API
            $this->assertStringNotContainsString('bootstrap', $uri, "Admin routes must never expose bootstrap endpoint: {$uri}");

            // Invariant 1: All protected admin routes must have admin.principal
            $this->assertContains(
                'admin.principal',
                $middleware,
                "Admin route [{$uri}] is missing 'admin.principal' middleware."
            );

            // Invariant 2 & 3: GET /me is the sole exception to admin.capability
            if ($uri === 'api/v1/admin/me') {
                $hasCapabilityMiddleware = collect($middleware)->contains(fn ($m) => str_starts_with($m, 'admin.capability'));
                $this->assertFalse(
                    $hasCapabilityMiddleware,
                    "Route [GET /api/v1/admin/me] is the sole intentional exception and must not require a specific capability."
                );
            } else {
                $hasCapabilityMiddleware = collect($middleware)->contains(fn ($m) => str_starts_with($m, 'admin.capability'));
                $this->assertTrue(
                    $hasCapabilityMiddleware,
                    "Route [{$uri}] must require specific capability via 'admin.capability:<specific>' middleware."
                );
            }
        }
    }
}
