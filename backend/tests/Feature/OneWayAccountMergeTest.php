<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Order;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class OneWayAccountMergeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\CourseCatalogSeeder::class);
        config(['services.google.mock' => true]);
    }

    public function test_unverified_guest_orders_merge_into_verified_google_user_on_login(): void
    {
        $email = 'merge_student@example.com';
        $course = Course::first();

        // 1. Guest places an order before registering
        $orderService = app(OrderService::class);
        $order1 = $orderService->createOrder([
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

        // Guest user is initially created
        $guestUser = User::where('email', $email)->where('auth_provider', 'guest')->first();
        $this->assertNotNull($guestUser);
        $this->assertEquals('active', $guestUser->status);
        $this->assertEquals($guestUser->id, $order1->user_id);

        // 2. User logs in via Google with the exact same email
        $response = $this->get("/api/v1/auth/google/callback?mock_email={$email}&mock_name=Verified+Google+Student&mock_sub=sub_google_998877");
        $response->assertStatus(302);

        // 3. Verify Google account exists and is active & verified
        $googleUser = User::where('email', $email)->where('auth_provider', 'google')->first();
        $this->assertNotNull($googleUser);
        $this->assertNotEquals($guestUser->id, $googleUser->id);
        $this->assertEquals('active', $googleUser->status);
        $this->assertNotNull($googleUser->email_verified_at);

        // 4. Assert guest orders are now re-attributed to Google user
        $reloadedOrder1 = Order::find($order1->id);
        $this->assertEquals($googleUser->id, $reloadedOrder1->user_id);

        // 5. Assert guest user is deactivated with merged_into audit pointer
        $reloadedGuestUser = User::find($guestUser->id);
        $this->assertEquals('deactivated', $reloadedGuestUser->status);
        $this->assertEquals($googleUser->id, $reloadedGuestUser->merged_into_user_id);
    }
}
