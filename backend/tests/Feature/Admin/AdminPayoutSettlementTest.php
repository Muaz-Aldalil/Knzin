<?php

namespace Tests\Feature\Admin;

use App\Models\AdminActivityLog;
use App\Models\AffiliateLedgerEntry;
use App\Models\AffiliatePayout;
use App\Models\User;
use App\Support\AdminCapabilities;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminPayoutSettlementTest extends TestCase
{
    use RefreshDatabase;

    public function test_payout_settlement_transitions_state_uploads_receipt_and_clears_debit(): void
    {
        Storage::fake('payout-receipts');

        $admin = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $admin->grantCapability(AdminCapabilities::SETTLE_AFFILIATE_PAYOUT, null, 'bootstrap');
        $token = $admin->createToken('admin_token')->plainTextToken;
        $headers = ['Authorization' => "Bearer {$token}"];

        $affiliate = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);

        $payout = AffiliatePayout::create([
            'payout_number' => 'KNZ-PAY-2026-TEST1',
            'user_id' => $affiliate->id,
            'amount_cents' => 5000,
            'threshold_cents_at_request' => 5000,
            'amount_iqd' => 65500,
            'payout_method' => 'western_union',
            'recipient_details' => ['full_name' => 'Ali Ahmed'],
            'status' => 'requested',
        ]);

        $debit = AffiliateLedgerEntry::create([
            'user_id' => $affiliate->id,
            'payout_id' => $payout->id,
            'entry_type' => 'payout_debit',
            'amount_cents' => -5000,
            'currency' => 'USD',
            'status' => 'available',
            'idempotency_key' => "payout_debit_{$payout->payout_number}",
        ]);

        $receiptFile = UploadedFile::fake()->create('receipt.jpg', 100, 'image/jpeg');

        $response = $this->withHeaders($headers)->postJson("/api/v1/admin/payouts/{$payout->payout_number}/settle", [
            'reference_number' => 'MTCN-987654321',
            'receipt' => $receiptFile,
            'notes' => 'Settled via Western Union agent Baghdad',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.status', 'completed');
        $response->assertJsonPath('data.admin_reference_number', 'MTCN-987654321');
        $this->assertNotNull($response->json('data.receipt_sha256'));

        // Assert debit ledger entry flipped to cleared
        $this->assertEquals('cleared', $debit->fresh()->status);

        // Assert receipt exists on protected disk
        $receiptSha = $response->json('data.receipt_sha256');
        $this->assertNotEmpty(Storage::disk('payout-receipts')->allFiles());

        // Assert audit log was created
        $audit = AdminActivityLog::where('action', 'payout.settled')->first();
        $this->assertNotNull($audit);
        $this->assertEquals($admin->id, $audit->actor_user_id);
    }

    public function test_admin_cannot_settle_or_reject_own_payout(): void
    {
        Storage::fake('payout-receipts');

        $admin = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $admin->grantCapability(AdminCapabilities::SETTLE_AFFILIATE_PAYOUT, null, 'bootstrap');
        $token = $admin->createToken('admin_token')->plainTextToken;
        $headers = ['Authorization' => "Bearer {$token}"];

        // Payout belonging to the admin himself
        $payout = AffiliatePayout::create([
            'payout_number' => 'KNZ-PAY-2026-OWN1',
            'user_id' => $admin->id,
            'amount_cents' => 5000,
            'threshold_cents_at_request' => 5000,
            'amount_iqd' => 65500,
            'payout_method' => 'zain_cash',
            'recipient_details' => ['phone' => '07700000000'],
            'status' => 'requested',
        ]);

        $receiptFile = UploadedFile::fake()->create('receipt.png', 100, 'image/png');

        // Settlement attempt must be blocked
        $settleResponse = $this->withHeaders($headers)->postJson("/api/v1/admin/payouts/{$payout->payout_number}/settle", [
            'reference_number' => 'REF-12345',
            'receipt' => $receiptFile,
        ]);
        $settleResponse->assertStatus(403);
        $settleResponse->assertJsonPath('code', 'ERR_SELF_SETTLEMENT_FORBIDDEN');

        // Rejection attempt must be blocked
        $rejectResponse = $this->withHeaders($headers)->postJson("/api/v1/admin/payouts/{$payout->payout_number}/reject", [
            'reason' => 'Admin trying to reject own payout',
        ]);
        $rejectResponse->assertStatus(403);
        $rejectResponse->assertJsonPath('code', 'ERR_SELF_SETTLEMENT_FORBIDDEN');
    }
}
