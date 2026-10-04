<?php

namespace Tests\Feature;

use App\Jobs\GenerateTicketsJob;
use App\Models\Course;
use App\Models\Order;
use App\Models\PaymentTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\TestCase;

class PaymentReconciliationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\CourseCatalogSeeder::class);
    }

    protected function createPendingOrder(string $itemType = 'part'): Order
    {
        $course = Course::with('parts')->first();
        $part = $course->parts->first();
        $canonicalText = "أوافق على الشروط والأحكام وسياسة الخصوصية، وأقر بأنني أقوم بشراء محتوى رقمي تعليمي، وأن تذكرة السحب المرفقة هي هدية ترويجية مجانية غير مستردة أو قابلة للتبديل";

        $payload = [
            'email' => 'reconcile_buyer@example.com',
            'course_id' => $course->id,
            'course_part_id' => $itemType === 'part' ? $part->id : null,
            'item_type' => $itemType,
            'legal_terms_agreed' => true,
            'legal_shield_text' => $canonicalText,
            'idempotency_key' => (string) Str::uuid(),
            'quiz_answers' => [
                'experience_level' => 'beginner',
                'learning_goal' => 'launch_workshop',
                'weekly_hours' => '6_to_10',
            ],
        ];

        $response = $this->postJson('/api/v1/checkout/orders', $payload);
        $response->assertStatus(201);

        return Order::where('idempotency_key', $payload['idempotency_key'])->firstOrFail();
    }

    public function test_reconcile_command_ignores_fresh_transactions(): void
    {
        $order = $this->createPendingOrder('part');

        // Fresh transaction created 2 minutes ago
        $txn = PaymentTransaction::create([
            'order_id' => $order->id,
            'gateway' => 'simulator',
            'gateway_transaction_id' => 'SIM-TXN-FRESH-001',
            'amount_iqd' => 2600,
            'currency' => 'IQD',
            'status' => 'initiated',
            'attempt_number' => 1,
            'expires_at' => now()->addMinutes(30),
            'created_at' => now()->subMinutes(2),
        ]);

        $this->artisan('payments:reconcile')
            ->expectsOutput('No stale pending payment transactions requiring reconciliation.')
            ->assertSuccessful();

        $txn->refresh();
        $this->assertEquals('initiated', $txn->status);
    }

    public function test_reconcile_command_recovers_and_fulfills_stale_successful_transaction(): void
    {
        Queue::fake();

        $order = $this->createPendingOrder('part');

        // Stale transaction created 15 minutes ago with mock status = success
        $txn = PaymentTransaction::create([
            'order_id' => $order->id,
            'gateway' => 'simulator',
            'gateway_transaction_id' => 'SIM-TXN-STALE-RECOVER',
            'amount_iqd' => 2600,
            'currency' => 'IQD',
            'status' => 'initiated',
            'gateway_response' => ['mock_status' => 'success'],
            'attempt_number' => 1,
            'expires_at' => now()->addMinutes(15),
        ]);
        PaymentTransaction::where('id', $txn->id)->update(['created_at' => now()->subMinutes(15)]);

        $this->artisan('payments:reconcile')
            ->assertSuccessful();

        $txn->refresh();
        $this->assertEquals('success', $txn->status);
        $this->assertNotNull($txn->paid_at);

        $order->refresh();
        $this->assertEquals('completed', $order->status);

        $this->assertDatabaseHas('course_entitlements', [
            'user_id' => $order->user_id,
            'course_id' => $order->items->first()->course_id,
        ]);

        Queue::assertPushed(GenerateTicketsJob::class);
    }

    public function test_reconcile_command_updates_failed_transaction_without_order_mutation(): void
    {
        $order = $this->createPendingOrder('part');

        // Stale transaction created 20 minutes ago with mock status = failed
        $txn = PaymentTransaction::create([
            'order_id' => $order->id,
            'gateway' => 'simulator',
            'gateway_transaction_id' => 'SIM-TXN-STALE-FAILED',
            'amount_iqd' => 2600,
            'currency' => 'IQD',
            'status' => 'initiated',
            'gateway_response' => ['mock_status' => 'failed'],
            'attempt_number' => 1,
            'expires_at' => now()->addMinutes(10),
        ]);
        PaymentTransaction::where('id', $txn->id)->update(['created_at' => now()->subMinutes(20)]);

        $this->artisan('payments:reconcile')
            ->assertSuccessful();

        $txn->refresh();
        $this->assertEquals('failed', $txn->status);

        $order->refresh();
        $this->assertEquals('pending', $order->status);
    }

    public function test_reconcile_command_ignores_expired_orders_over_24h(): void
    {
        $order = $this->createPendingOrder('part');
        $order->update([
            'created_at' => now()->subHours(25),
            'expires_at' => now()->subHours(1),
        ]);

        $txn = PaymentTransaction::create([
            'order_id' => $order->id,
            'gateway' => 'simulator',
            'gateway_transaction_id' => 'SIM-TXN-OVER-24H',
            'amount_iqd' => 2600,
            'currency' => 'IQD',
            'status' => 'initiated',
            'gateway_response' => ['mock_status' => 'success'],
            'attempt_number' => 1,
            'expires_at' => now()->subHours(1),
        ]);
        PaymentTransaction::where('id', $txn->id)->update(['created_at' => now()->subHours(25)]);

        $this->artisan('payments:reconcile')
            ->assertSuccessful();

        $txn->refresh();
        $this->assertEquals('initiated', $txn->status);

        $order->refresh();
        $this->assertNotEquals('completed', $order->status);
    }

    public function test_reconcile_command_dry_run_does_not_mutate_records(): void
    {
        $order = $this->createPendingOrder('part');

        $txn = PaymentTransaction::create([
            'order_id' => $order->id,
            'gateway' => 'simulator',
            'gateway_transaction_id' => 'SIM-TXN-DRY-RUN',
            'amount_iqd' => 2600,
            'currency' => 'IQD',
            'status' => 'initiated',
            'gateway_response' => ['mock_status' => 'success'],
            'attempt_number' => 1,
            'expires_at' => now()->addMinutes(15),
        ]);
        PaymentTransaction::where('id', $txn->id)->update(['created_at' => now()->subMinutes(15)]);

        $this->artisan('payments:reconcile', ['--dry-run' => true])
            ->assertSuccessful();

        $txn->refresh();
        $this->assertEquals('initiated', $txn->status);
        $this->assertNull($txn->paid_at);

        $order->refresh();
        $this->assertEquals('pending', $order->status);
    }
}
