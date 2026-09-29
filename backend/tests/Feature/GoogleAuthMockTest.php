<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GoogleAuthMockTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.google.mock' => true]);
    }

    public function test_google_redirect_redirects_to_callback_in_mock_mode(): void
    {
        $response = $this->get('/api/v1/auth/google/redirect?mock_email=testuser@example.com');

        $response->assertStatus(302);
        $redirectUrl = $response->headers->get('Location');
        $this->assertStringContainsString('/api/v1/auth/google/callback', $redirectUrl);
        $this->assertStringContainsString('mock_email=testuser%40example.com', $redirectUrl);
    }

    public function test_google_callback_creates_verified_user_and_issues_token_in_mock_mode(): void
    {
        $response = $this->get('/api/v1/auth/google/callback?mock_email=newstudent@example.com&mock_name=Student+One');

        $response->assertStatus(302);
        $redirectUrl = $response->headers->get('Location');
        $this->assertStringContainsString('/auth/callback', $redirectUrl);
        $this->assertStringContainsString('token=', $redirectUrl);

        $user = User::where('email', 'newstudent@example.com')->first();
        $this->assertNotNull($user);
        $this->assertEquals('google', $user->auth_provider);
        $this->assertEquals('active', $user->status);
        $this->assertNotNull($user->email_verified_at);
        $this->assertTrue($user->isVerified());
    }

    public function test_guest_auth_endpoint_issues_token_for_email(): void
    {
        $response = $this->postJson('/api/v1/auth/guest', [
            'email' => 'guest_student@example.com',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure([
                'status',
                'data' => [
                    'token',
                    'user' => [
                        'id',
                        'email',
                        'auth_provider',
                    ],
                ],
            ]);

        $this->assertEquals('guest_student@example.com', $response->json('data.user.email'));
    }
}
