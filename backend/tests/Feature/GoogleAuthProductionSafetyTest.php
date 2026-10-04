<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The mock Google flow accepts an arbitrary email with no verification. It must be
 * impossible to reach outside local/testing even if the flag is mistakenly enabled,
 * and the unimplemented real Google flow must fail closed.
 */
class GoogleAuthProductionSafetyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->app['env'] = 'production';
        config(['services.google.mock' => true]);
    }

    public function test_mock_google_redirect_is_unavailable_in_production_even_if_flag_enabled(): void
    {
        $response = $this->getJson('/api/v1/auth/google/redirect?mock_email=admin@knzin.com');

        $response->assertStatus(503)->assertJsonPath('code', 'ERR_GOOGLE_AUTH_UNAVAILABLE');
    }

    public function test_mock_google_callback_cannot_issue_token_or_create_user_in_production(): void
    {
        $response = $this->getJson('/api/v1/auth/google/callback?mock_email=victim@example.com&mock_name=Victim');

        $response->assertStatus(503)->assertJsonPath('code', 'ERR_GOOGLE_AUTH_UNAVAILABLE');
        $this->assertNull(User::where('email', 'victim@example.com')->first());
        $this->assertNull(User::where('email', 'user@example.com')->first());
    }

    public function test_google_flow_fails_closed_when_mock_flag_is_off(): void
    {
        config(['services.google.mock' => false]);

        $this->getJson('/api/v1/auth/google/callback')->assertStatus(503);
        $this->assertSame(0, User::count());
    }
}
