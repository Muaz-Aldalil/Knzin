<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GoogleIdentityAuthTest extends TestCase
{
    use RefreshDatabase;

    protected string $clientId = '118096304294-3vikmbr2diolhadj2q6lbo4647umueav.apps.googleusercontent.com';

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'services.google.client_id' => $this->clientId,
            'services.google.mock' => false,
        ]);
    }

    public function test_google_verify_requires_credential_or_id_token(): void
    {
        $response = $this->postJson('/api/v1/auth/google/verify', []);

        $response->assertStatus(422)
            ->assertJsonPath('status', 'fail')
            ->assertJsonPath('code', 'VALIDATION_ERROR');
    }

    public function test_google_verify_authenticates_valid_id_token(): void
    {
        Http::fake([
            'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
                'iss' => 'https://accounts.google.com',
                'aud' => $this->clientId,
                'sub' => 'google_sub_123456789',
                'email' => 'real_user@gmail.com',
                'email_verified' => 'true',
                'name' => 'Real Google User',
                'picture' => 'https://lh3.googleusercontent.com/avatar.jpg',
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/auth/google/verify', [
            'credential' => 'valid_signed_google_jwt_token',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.user.email', 'real_user@gmail.com')
            ->assertJsonPath('data.user.displayName', 'Real Google User')
            ->assertJsonPath('data.user.authProvider', 'google')
            ->assertJsonPath('data.user.isVerified', true);

        $this->assertNotEmpty($response->json('data.token'));

        $user = User::where('email', 'real_user@gmail.com')->first();
        $this->assertNotNull($user);
        $this->assertEquals('google_sub_123456789', $user->provider_id);
        $this->assertEquals('https://lh3.googleusercontent.com/avatar.jpg', $user->avatar_url);
        $this->assertNotNull($user->email_verified_at);
    }

    public function test_google_verify_rejects_mismatched_client_id_audience(): void
    {
        Http::fake([
            'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
                'iss' => 'https://accounts.google.com',
                'aud' => 'different_client_id.apps.googleusercontent.com',
                'sub' => 'google_sub_123456789',
                'email' => 'attacker@gmail.com',
                'email_verified' => 'true',
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/auth/google/verify', [
            'credential' => 'attacker_token_for_different_app',
        ]);

        $response->assertStatus(422);
    }

    public function test_google_verify_rejects_unverified_email(): void
    {
        Http::fake([
            'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
                'iss' => 'https://accounts.google.com',
                'aud' => $this->clientId,
                'sub' => 'google_sub_123456789',
                'email' => 'unverified@gmail.com',
                'email_verified' => 'false',
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/auth/google/verify', [
            'credential' => 'token_with_unverified_email',
        ]);

        $response->assertStatus(422);
    }

    public function test_google_verify_merges_guest_orders_automatically(): void
    {
        // 1. Create a guest user with orders
        $guestUser = User::create([
            'email' => 'student@knzin.com',
            'display_name' => 'ضيف',
            'auth_provider' => 'guest',
            'status' => 'active',
        ]);

        Order::factory()->create([
            'order_number' => 'ORD-GUEST-001',
            'user_id' => $guestUser->id,
            'status' => 'completed',
        ]);

        // 2. Google sign in with same email
        Http::fake([
            'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
                'iss' => 'https://accounts.google.com',
                'aud' => $this->clientId,
                'sub' => 'google_sub_student_1',
                'email' => 'student@knzin.com',
                'email_verified' => 'true',
                'name' => 'Student Confirmed',
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/auth/google/verify', [
            'credential' => 'token_for_student',
        ]);

        $response->assertStatus(200);

        // The user should now be verified Google user
        $updatedUser = User::where('email', 'student@knzin.com')->first();
        $this->assertEquals('google', $updatedUser->auth_provider);
        $this->assertNotNull($updatedUser->email_verified_at);

        // The order should be re-attributed to this user
        $order = Order::where('order_number', 'ORD-GUEST-001')->first();
        $this->assertEquals($updatedUser->id, $order->user_id);
    }
}
