<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseEntitlement;
use App\Models\CoursePart;
use App\Models\LessonProgress;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Ticket;
use App\Models\User;
use App\Services\AccountMergeService;
use App\Services\TicketMintingService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AccountMergeEntitlementsTest extends TestCase
{
    use RefreshDatabase;

    protected Course $course;
    protected CoursePart $part1;
    protected CoursePart $part2;
    protected AccountMergeService $mergeService;
    protected TicketMintingService $mintingService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\CourseCatalogSeeder::class);

        $this->course = Course::with('parts')->first();
        $parts = $this->course->parts->sortBy('part_number')->values();
        $this->part1 = $parts[0];
        $this->part2 = $parts[1];

        $this->mergeService = app(AccountMergeService::class);
        $this->mintingService = app(TicketMintingService::class);
    }

    private function createOrder(User $user, string $itemType = 'bundle', ?CoursePart $part = null, int $tickets = 15): Order
    {
        $order = Order::create([
            'id' => (string) Str::uuid(),
            'order_number' => 'KNZ-ORD-' . Str::upper(Str::random(8)),
            'user_id' => $user->id,
            'total_amount_cents' => $itemType === 'bundle' ? 1000 : 200,
            'currency' => 'USD',
            'exchange_rate' => 1.3100,
            'paid_amount_gateway' => $itemType === 'bundle' ? 13100 : 2620,
            'display_price_label' => $itemType === 'bundle' ? '13,000 IQD' : '2,000 IQD',
            'promotional_tickets_granted' => $tickets,
            'status' => 'completed',
            'tickets_status' => 'completed',
            'idempotency_key' => 'idem_' . Str::random(16),
            'legal_terms_agreed' => true,
            'terms_agreed_ip' => '127.0.0.1',
            'terms_agreed_at' => Carbon::now(),
            'expires_at' => Carbon::now()->addHour(),
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'course_id' => $this->course->id,
            'course_part_id' => $part?->id,
            'item_type' => $itemType,
            'price_cents' => $itemType === 'bundle' ? 1000 : 200,
            'promotional_tickets_granted' => $tickets,
        ]);

        return $order;
    }

    public function test_guest_order_progress_entitlements_and_tickets_transferred_to_google_user(): void
    {
        $sharedEmail = 'student@example.com';

        // 1. Create Guest User with order, entitlement, ticket, progress
        $guestUser = User::create([
            'id' => (string) Str::uuid(),
            'email' => $sharedEmail,
            'display_name' => 'Guest Student',
            'auth_provider' => 'guest',
            'status' => 'active',
        ]);

        $order = $this->createOrder($guestUser, 'part', $this->part2, 1);
        $this->mintingService->mintForOrder($order);

        $entitlement = CourseEntitlement::create([
            'user_id' => $guestUser->id,
            'course_id' => $this->course->id,
            'course_part_id' => $this->part2->id,
            'order_id' => $order->id,
            'status' => 'active',
        ]);

        $progress = LessonProgress::create([
            'user_id' => $guestUser->id,
            'course_id' => $this->course->id,
            'course_part_id' => $this->part2->id,
            'watch_seconds' => 300,
            'percent_complete' => 30,
            'is_completed' => false,
            'last_watched_at' => Carbon::now(),
        ]);

        // 2. Create surviving Google User
        $googleUser = User::create([
            'id' => (string) Str::uuid(),
            'email' => $sharedEmail,
            'display_name' => 'Verified Student',
            'auth_provider' => 'google',
            'provider_id' => 'google_12345',
            'status' => 'active',
        ]);

        // 3. Execute merge
        $result = $this->mergeService->mergeGuestIntoGoogle($googleUser);

        $this->assertEquals(1, $result['merged_orders_count']);
        $this->assertEquals(1, $result['deactivated_guests_count']);

        // Assert Order transferred
        $this->assertEquals($googleUser->id, $order->fresh()->user_id);

        // Assert Ticket transferred
        $ticket = Ticket::where('order_id', $order->id)->first();
        $this->assertEquals($googleUser->id, $ticket->user_id);

        // Assert Entitlement transferred
        $this->assertEquals($googleUser->id, $entitlement->fresh()->user_id);

        // Assert Progress transferred
        $this->assertEquals($googleUser->id, $progress->fresh()->user_id);

        // Assert Guest deactivated
        $guestUser->refresh();
        $this->assertEquals('deactivated', $guestUser->status);
        $this->assertEquals($googleUser->id, $guestUser->merged_into_user_id);
    }

    public function test_guest_and_google_user_with_identical_scope_marks_guest_record_superseded(): void
    {
        $sharedEmail = 'bundle_buyer@example.com';

        $guestUser = User::create([
            'id' => (string) Str::uuid(),
            'email' => $sharedEmail,
            'display_name' => 'Guest User',
            'auth_provider' => 'guest',
            'status' => 'active',
        ]);

        $googleUser = User::create([
            'id' => (string) Str::uuid(),
            'email' => $sharedEmail,
            'display_name' => 'Google User',
            'auth_provider' => 'google',
            'provider_id' => 'google_998877',
            'status' => 'active',
        ]);

        $guestOrder = $this->createOrder($guestUser, 'bundle', null, 15);
        $googleOrder = $this->createOrder($googleUser, 'bundle', null, 15);

        $guestEntitlement = CourseEntitlement::create([
            'user_id' => $guestUser->id,
            'course_id' => $this->course->id,
            'course_part_id' => null,
            'order_id' => $guestOrder->id,
            'status' => 'active',
        ]);

        $googleEntitlement = CourseEntitlement::create([
            'user_id' => $googleUser->id,
            'course_id' => $this->course->id,
            'course_part_id' => null,
            'order_id' => $googleOrder->id,
            'status' => 'active',
        ]);

        // Execute merge
        $this->mergeService->mergeGuestIntoGoogle($googleUser);

        $guestEntitlement->refresh();
        $googleEntitlement->refresh();

        // Guest entitlement marked superseded by Google entitlement
        $this->assertEquals('superseded', $guestEntitlement->status);
        $this->assertEquals($googleEntitlement->id, $guestEntitlement->superseded_by_entitlement_id);

        // Google entitlement remains active
        $this->assertEquals('active', $googleEntitlement->status);

        // Exactly 1 active bundle entitlement for Google user
        $activeBundles = CourseEntitlement::where('user_id', $googleUser->id)
            ->where('course_id', $this->course->id)
            ->whereNull('course_part_id')
            ->where('status', 'active')
            ->count();

        $this->assertEquals(1, $activeBundles);
    }

    public function test_guest_and_google_user_with_part_and_bundle_coexistence_preserves_both(): void
    {
        $sharedEmail = 'coexist@example.com';

        $guestUser = User::create([
            'id' => (string) Str::uuid(),
            'email' => $sharedEmail,
            'display_name' => 'Guest Part Buyer',
            'auth_provider' => 'guest',
            'status' => 'active',
        ]);

        $googleUser = User::create([
            'id' => (string) Str::uuid(),
            'email' => $sharedEmail,
            'display_name' => 'Google Bundle Buyer',
            'auth_provider' => 'google',
            'provider_id' => 'google_554433',
            'status' => 'active',
        ]);

        $guestOrder = $this->createOrder($guestUser, 'part', $this->part2, 1);
        $googleOrder = $this->createOrder($googleUser, 'bundle', null, 15);

        // Guest owns Part 2
        $guestPartEntitlement = CourseEntitlement::create([
            'user_id' => $guestUser->id,
            'course_id' => $this->course->id,
            'course_part_id' => $this->part2->id,
            'order_id' => $guestOrder->id,
            'status' => 'active',
        ]);

        // Google user owns Full Bundle
        $googleBundleEntitlement = CourseEntitlement::create([
            'user_id' => $googleUser->id,
            'course_id' => $this->course->id,
            'course_part_id' => null,
            'order_id' => $googleOrder->id,
            'status' => 'active',
        ]);

        // Execute merge
        $this->mergeService->mergeGuestIntoGoogle($googleUser);

        $guestPartEntitlement->refresh();
        $googleBundleEntitlement->refresh();

        // Both entitlements remain active under Google user (distinct scope_keys: 'BUNDLE' vs part UUID)
        $this->assertEquals('active', $guestPartEntitlement->status);
        $this->assertEquals($googleUser->id, $guestPartEntitlement->user_id);

        $this->assertEquals('active', $googleBundleEntitlement->status);
        $this->assertEquals($googleUser->id, $googleBundleEntitlement->user_id);

        $activeCount = CourseEntitlement::where('user_id', $googleUser->id)
            ->where('course_id', $this->course->id)
            ->where('status', 'active')
            ->count();

        $this->assertEquals(2, $activeCount);
    }

    public function test_merge_executing_during_active_ticket_generation_serializes_safely(): void
    {
        $sharedEmail = 'concurrent_mint@example.com';

        $guestUser = User::create([
            'id' => (string) Str::uuid(),
            'email' => $sharedEmail,
            'display_name' => 'Guest Buyer',
            'auth_provider' => 'guest',
            'status' => 'active',
        ]);

        $googleUser = User::create([
            'id' => (string) Str::uuid(),
            'email' => $sharedEmail,
            'display_name' => 'Google Buyer',
            'auth_provider' => 'google',
            'provider_id' => 'google_667788',
            'status' => 'active',
        ]);

        // Create pending order for guest (tickets not yet minted)
        $order = Order::create([
            'id' => (string) Str::uuid(),
            'order_number' => 'KNZ-ORD-MERGE-01',
            'user_id' => $guestUser->id,
            'total_amount_cents' => 1000,
            'currency' => 'USD',
            'exchange_rate' => 1.3100,
            'paid_amount_gateway' => 13100,
            'display_price_label' => '13,000 IQD',
            'promotional_tickets_granted' => 15,
            'status' => 'completed',
            'tickets_status' => 'pending',
            'idempotency_key' => 'idem_' . Str::random(16),
            'legal_terms_agreed' => true,
            'terms_agreed_ip' => '127.0.0.1',
            'terms_agreed_at' => Carbon::now(),
            'expires_at' => Carbon::now()->addHour(),
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'course_id' => $this->course->id,
            'item_type' => 'bundle',
            'price_cents' => 1000,
            'promotional_tickets_granted' => 15,
        ]);

        // Merge runs first
        $this->mergeService->mergeGuestIntoGoogle($googleUser);

        $order->refresh();
        $this->assertEquals($googleUser->id, $order->user_id);

        // Minting worker runs afterwards
        $minted = $this->mintingService->mintForOrder($order);

        $this->assertEquals(15, $minted);
        $this->assertEquals(15, Ticket::where('order_id', $order->id)->where('user_id', $googleUser->id)->count());
    }
}
