<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Order;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OtpAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\CourseCatalogSeeder::class);
    }

    public function test_send_otp_generates_code_and_returns_dev_code_in_testing(): void
    {
        $response = $this->postJson('/api/v1/auth/otp/send', [
            'email' => 'student_otp@example.com',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure([
                'status',
                'data' => [
                    'message',
                    'email',
                    'expires_in_seconds',
                    'dev_code',
                ],
            ]);

        $this->assertEquals('student_otp@example.com', $response->json('data.email'));
        $this->assertNotNull($response->json('data.dev_code'));
        $this->assertEquals(6, strlen($response->json('data.dev_code')));
    }

    public function test_verify_otp_creates_verified_user_and_issues_token(): void
    {
        $sendResponse = $this->postJson('/api/v1/auth/otp/send', [
            'email' => 'new_student@example.com',
        ]);
        $code = $sendResponse->json('data.dev_code');

        $verifyResponse = $this->postJson('/api/v1/auth/otp/verify', [
            'email' => 'new_student@example.com',
            'code' => $code,
        ]);

        $verifyResponse->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure([
                'status',
                'data' => [
                    'token',
                    'user' => [
                        'id',
                        'email',
                        'display_name',
                        'is_verified',
                    ],
                ],
            ]);

        $this->assertNotEmpty($verifyResponse->json('data.token'));
        $this->assertTrue($verifyResponse->json('data.user.is_verified'));

        $user = User::where('email', 'new_student@example.com')->first();
        $this->assertNotNull($user);
        $this->assertTrue($user->isVerified());
        $this->assertEquals('active', $user->status);
    }

    public function test_verify_otp_rejects_invalid_code(): void
    {
        $this->postJson('/api/v1/auth/otp/send', [
            'email' => 'student_invalid@example.com',
        ]);

        $response = $this->postJson('/api/v1/auth/otp/verify', [
            'email' => 'student_invalid@example.com',
            'code' => '000000',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['code']);
    }

    public function test_verify_otp_invalidates_code_after_success_preventing_replay(): void
    {
        $sendResponse = $this->postJson('/api/v1/auth/otp/send', [
            'email' => 'replay_test@example.com',
        ]);
        $code = $sendResponse->json('data.dev_code');

        // First verification succeeds
        $firstVerify = $this->postJson('/api/v1/auth/otp/verify', [
            'email' => 'replay_test@example.com',
            'code' => $code,
        ]);
        $firstVerify->assertStatus(200);

        // Second verification with identical code must fail (replayed code is consumed)
        $secondVerify = $this->postJson('/api/v1/auth/otp/verify', [
            'email' => 'replay_test@example.com',
            'code' => $code,
        ]);
        $secondVerify->assertStatus(422);
    }

    public function test_verify_otp_merges_unverified_guest_orders(): void
    {
        $email = 'guest_to_verify@example.com';
        $course = Course::first();

        // 1. Guest creates order
        $orderService = app(OrderService::class);
        $order = $orderService->createOrder([
            'email' => $email,
            'course_id' => $course->id,
            'item_type' => 'bundle',
            'legal_terms_agreed' => true,
            'idempotency_key' => (string) Str::uuid(),
            'quiz_answers' => [
                'experience_level' => 'beginner',
                'learning_goal' => 'launch_workshop',
                'weekly_hours' => '6_to_10',
            ],
        ])['order'];

        $guestUser = User::where('email', $email)->where('auth_provider', 'guest')->first();
        $this->assertNotNull($guestUser);
        $this->assertEquals($guestUser->id, $order->user_id);

        // 2. User verifies email via OTP
        $sendResponse = $this->postJson('/api/v1/auth/otp/send', ['email' => $email]);
        $code = $sendResponse->json('data.dev_code');

        $verifyResponse = $this->postJson('/api/v1/auth/otp/verify', [
            'email' => $email,
            'code' => $code,
        ]);
        $verifyResponse->assertStatus(200);

        // 3. Verified account now owns the order, guest is deactivated
        $verifiedUser = User::where('email', $email)->where('auth_provider', 'google')->first();
        $this->assertNotNull($verifiedUser);
        $this->assertEquals($verifiedUser->id, Order::find($order->id)->user_id);

        $reloadedGuest = User::find($guestUser->id);
        $this->assertEquals('deactivated', $reloadedGuest->status);
        $this->assertEquals($verifiedUser->id, $reloadedGuest->merged_into_user_id);
    }

    public function test_logout_revokes_current_access_token(): void
    {
        $user = User::factory()->create([
            'email' => 'logout_test@example.com',
            'auth_provider' => 'google',
            'email_verified_at' => now(),
            'status' => 'active',
        ]);

        $token = $user->createToken('test_session_token')->plainTextToken;

        // Call authenticated me endpoint
        $meResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/auth/me');
        $meResponse->assertStatus(200)
            ->assertJsonPath('data.user.email', 'logout_test@example.com');

        // Logout revokes token
        $logoutResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/auth/logout');
        $logoutResponse->assertStatus(200);

        // Assert token is deleted from DB
        $this->assertEquals(0, $user->fresh()->tokens()->count());

        // Reset test container auth guard state
        $this->app['auth']->forgetGuards();

        // Next call with revoked token must fail with 401
        $subsequentResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/auth/me');
        $subsequentResponse->assertStatus(401);
    }
}
