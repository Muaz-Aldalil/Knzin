<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseEntitlement;
use App\Models\CoursePart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Services\EntitlementService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class CourseEntitlementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\CourseCatalogSeeder::class);
    }

    private function createOrderWithItem(
        User $user,
        Course $course,
        string $itemType = 'bundle',
        ?CoursePart $part = null,
        string $orderNumber = 'KNZ-ORD-TEST-001'
    ): Order {
        $order = Order::create([
            'id' => (string) Str::uuid(),
            'order_number' => $orderNumber,
            'user_id' => $user->id,
            'total_amount_cents' => $itemType === 'bundle' ? 1000 : 200,
            'currency' => 'USD',
            'exchange_rate' => 1.3100,
            'paid_amount_gateway' => $itemType === 'bundle' ? 13100 : 2620,
            'display_price_label' => $itemType === 'bundle' ? '13,000 IQD' : '2,000 IQD',
            'promotional_tickets_granted' => $itemType === 'bundle' ? 15 : 1,
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
            'course_id' => $course->id,
            'course_part_id' => $part?->id,
            'item_type' => $itemType,
            'price_cents' => $itemType === 'bundle' ? 1000 : 200,
            'promotional_tickets_granted' => $itemType === 'bundle' ? 15 : 1,
        ]);

        return $order;
    }

    public function test_order_completion_creates_active_entitlement(): void
    {
        $user = User::factory()->create();
        $course = Course::first();
        $entitlementService = app(EntitlementService::class);

        $order = $this->createOrderWithItem($user, $course, 'bundle', null, 'KNZ-ORD-TEST-001');

        $entitlementService->grantAfterFulfillment($order);

        $entitlement = CourseEntitlement::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->whereNull('course_part_id')
            ->first();

        $this->assertNotNull($entitlement);
        $this->assertEquals('active', $entitlement->status);
        $this->assertEquals($user->id, $entitlement->user_id);
        $this->assertEquals($course->id, $entitlement->course_id);
        $this->assertNull($entitlement->course_part_id);
        $this->assertEquals('BUNDLE', $entitlement->scope_key);
    }

    public function test_bundle_purchase_grants_access_to_all_active_parts(): void
    {
        $user = User::factory()->create();
        $course = Course::with('parts')->first();
        $entitlementService = app(EntitlementService::class);

        $order = $this->createOrderWithItem($user, $course, 'bundle', null, 'KNZ-ORD-TEST-002');

        $entitlementService->grantAfterFulfillment($order);

        foreach ($course->parts as $part) {
            $this->assertTrue(
                $entitlementService->hasAccess($user, $course, $part),
                "User should have access to part {$part->part_number} via bundle entitlement"
            );
        }
    }

    public function test_single_part_purchase_grants_access_only_to_purchased_part(): void
    {
        $user = User::factory()->create();
        $course = Course::with('parts')->first();
        $parts = $course->parts->sortBy('part_number')->values();
        $part1 = $parts[0];
        $part2 = $parts[1];
        $part3 = $parts[2];

        $entitlementService = app(EntitlementService::class);

        $order = $this->createOrderWithItem($user, $course, 'part', $part2, 'KNZ-ORD-TEST-003');

        $entitlementService->grantAfterFulfillment($order);

        // Part 1 is free preview by contract
        $this->assertTrue($entitlementService->hasAccess($user, $course, $part1));
        // Part 2 is purchased
        $this->assertTrue($entitlementService->hasAccess($user, $course, $part2));
        // Part 3 was NOT purchased
        $this->assertFalse($entitlementService->hasAccess($user, $course, $part3));
    }

    public function test_bundle_and_part_entitlements_safely_coexist_as_active(): void
    {
        $user = User::factory()->create();
        $course = Course::with('parts')->first();
        $part2 = $course->parts->firstWhere('part_number', 2);
        $entitlementService = app(EntitlementService::class);

        // 1. User purchases part 2 first
        $partOrder = $this->createOrderWithItem($user, $course, 'part', $part2, 'KNZ-ORD-TEST-004A');
        $entitlementService->grantAfterFulfillment($partOrder);

        // 2. User later purchases the full bundle
        $bundleOrder = $this->createOrderWithItem($user, $course, 'bundle', null, 'KNZ-ORD-TEST-004B');
        $entitlementService->grantAfterFulfillment($bundleOrder);

        $activeEntitlements = CourseEntitlement::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('status', 'active')
            ->get();

        // Both entitlements coexist under distinct scope_keys ('BUNDLE' and part_id)
        $this->assertCount(2, $activeEntitlements);
        $this->assertTrue($activeEntitlements->contains('scope_key', 'BUNDLE'));
        $this->assertTrue($activeEntitlements->contains('scope_key', (string) $part2->id));
    }

    public function test_bundle_revocation_preserves_independent_modular_part_access(): void
    {
        $user = User::factory()->create();
        $course = Course::with('parts')->first();
        $part2 = $course->parts->firstWhere('part_number', 2);
        $part3 = $course->parts->firstWhere('part_number', 3);
        $entitlementService = app(EntitlementService::class);

        // Create independent part 2 purchase
        $partOrder = $this->createOrderWithItem($user, $course, 'part', $part2, 'KNZ-ORD-TEST-005A');
        $entitlementService->grantAfterFulfillment($partOrder);

        // Create bundle purchase
        $bundleOrder = $this->createOrderWithItem($user, $course, 'bundle', null, 'KNZ-ORD-TEST-005B');
        $entitlementService->grantAfterFulfillment($bundleOrder);

        // Revoke only the bundle order (e.g., chargeback on bundle)
        $entitlementService->revokeEntitlements($bundleOrder);

        // Part 2 access is preserved because its separate entitlement is still active
        $this->assertTrue($entitlementService->hasAccess($user, $course, $part2));
        // Part 3 access is lost because bundle was revoked and no separate part 3 entitlement exists
        $this->assertFalse($entitlementService->hasAccess($user, $course, $part3));
    }

    public function test_duplicate_effective_entitlement_creation_is_prevented(): void
    {
        $user = User::factory()->create();
        $course = Course::first();
        $entitlementService = app(EntitlementService::class);

        $order = $this->createOrderWithItem($user, $course, 'bundle', null, 'KNZ-ORD-TEST-006');

        $entitlementService->grantAfterFulfillment($order);
        $entitlementService->grantAfterFulfillment($order);

        $this->assertEquals(1, CourseEntitlement::where('user_id', $user->id)->count());
    }

    public function test_two_active_bundle_entitlements_for_same_user_are_rejected_by_database_constraint(): void
    {
        $user = User::factory()->create();
        $course = Course::first();
        $order1 = $this->createOrderWithItem($user, $course, 'bundle', null, 'KNZ-ORD-TEST-007A');
        $order2 = $this->createOrderWithItem($user, $course, 'bundle', null, 'KNZ-ORD-TEST-007B');

        CourseEntitlement::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'course_part_id' => null,
            'order_id' => $order1->id,
            'status' => 'active',
        ]);

        $this->expectException(\Illuminate\Database\QueryException::class);

        // Attempting to insert second active bundle entitlement must fail on uq_user_course_active_scope
        CourseEntitlement::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'course_part_id' => null,
            'order_id' => $order2->id,
            'status' => 'active',
        ]);
    }

    public function test_two_active_part_entitlements_for_same_part_are_rejected_by_database_constraint(): void
    {
        $user = User::factory()->create();
        $course = Course::with('parts')->first();
        $part = $course->parts->first();
        $order1 = $this->createOrderWithItem($user, $course, 'part', $part, 'KNZ-ORD-TEST-008A');
        $order2 = $this->createOrderWithItem($user, $course, 'part', $part, 'KNZ-ORD-TEST-008B');

        CourseEntitlement::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'course_part_id' => $part->id,
            'order_id' => $order1->id,
            'status' => 'active',
        ]);

        $this->expectException(\Illuminate\Database\QueryException::class);

        // Attempting to insert second active part entitlement must fail on uq_user_course_active_scope
        CourseEntitlement::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'course_part_id' => $part->id,
            'order_id' => $order2->id,
            'status' => 'active',
        ]);
    }

    public function test_multiple_historical_superseded_or_revoked_records_can_coexist(): void
    {
        $user = User::factory()->create();
        $course = Course::first();
        $order1 = $this->createOrderWithItem($user, $course, 'bundle', null, 'KNZ-ORD-TEST-009A');
        $order2 = $this->createOrderWithItem($user, $course, 'bundle', null, 'KNZ-ORD-TEST-009B');
        $order3 = $this->createOrderWithItem($user, $course, 'bundle', null, 'KNZ-ORD-TEST-009C');

        // Insert first superseded record
        $e1 = CourseEntitlement::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'course_part_id' => null,
            'order_id' => $order1->id,
            'status' => 'superseded',
        ]);

        // Insert second superseded record for same scope (must NOT throw unique constraint exception!)
        $e2 = CourseEntitlement::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'course_part_id' => null,
            'order_id' => $order2->id,
            'status' => 'superseded',
        ]);

        // Insert third revoked record for same scope (must NOT throw unique constraint exception!)
        $e3 = CourseEntitlement::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'course_part_id' => null,
            'order_id' => $order3->id,
            'status' => 'revoked',
        ]);

        $this->assertNull($e1->active_scope_key);
        $this->assertNull($e2->active_scope_key);
        $this->assertNull($e3->active_scope_key);
        $this->assertEquals(3, CourseEntitlement::where('user_id', $user->id)->count());
    }

    public function test_historical_records_do_not_occupy_active_uniqueness_slot(): void
    {
        $user = User::factory()->create();
        $course = Course::first();
        $orderHistorical = $this->createOrderWithItem($user, $course, 'bundle', null, 'KNZ-ORD-TEST-010A');
        $orderActive = $this->createOrderWithItem($user, $course, 'bundle', null, 'KNZ-ORD-TEST-010B');

        // User had a superseded bundle entitlement from past merge
        CourseEntitlement::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'course_part_id' => null,
            'order_id' => $orderHistorical->id,
            'status' => 'superseded',
        ]);

        // Creating a new active entitlement for the same scope succeeds
        $active = CourseEntitlement::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'course_part_id' => null,
            'order_id' => $orderActive->id,
            'status' => 'active',
        ]);
        $active->refresh();

        $this->assertEquals('BUNDLE', $active->active_scope_key);
        $this->assertEquals('active', $active->status);
        $this->assertEquals(2, CourseEntitlement::where('user_id', $user->id)->count());
    }

    public function test_historical_record_becoming_active_again_fails_if_active_already_exists(): void
    {
        $user = User::factory()->create();
        $course = Course::first();
        $order1 = $this->createOrderWithItem($user, $course, 'bundle', null, 'KNZ-ORD-TEST-011A');
        $order2 = $this->createOrderWithItem($user, $course, 'bundle', null, 'KNZ-ORD-TEST-011B');

        // Existing active entitlement
        CourseEntitlement::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'course_part_id' => null,
            'order_id' => $order1->id,
            'status' => 'active',
        ]);

        // Existing superseded entitlement
        $superseded = CourseEntitlement::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'course_part_id' => null,
            'order_id' => $order2->id,
            'status' => 'superseded',
        ]);

        $this->expectException(\Illuminate\Database\QueryException::class);

        // Attempting to reactivate the superseded record when an active already exists must fail
        $superseded->update(['status' => 'active']);
    }
}
