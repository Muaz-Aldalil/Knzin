<?php

namespace Tests\Feature\Admin;

use App\Models\AffiliateLedgerEntry;
use App\Models\AffiliatePayout;
use App\Models\User;
use App\Support\AdminCapabilities;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminPayoutStateTransitionTest extends TestCase
{
    use RefreshDatabase;

    public function test_payout_state_transitions_and_terminal_conflict_guards(): void
    {
        Storage::fake('payout-receipts');

        $admin = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $admin->grantCapability(AdminCapabilities::SETTLE_AFFILIATE_PAYOUT, null, 'bootstrap');
        $token = $admin->createToken('admin_token')->plainTextToken;
        $headers = ['Authorization' => "Bearer {$token}"];

        $affiliate = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);

        $payout = AffiliatePayout::create([
            'payout_number' => 'KNZ-PAY-STATE-1',
            'user_id' => $affiliate->id,
            'amount_cents' => 5000,
            'threshold_cents_at_request' => 5000,
            'amount_iqd' => 65500,
            'payout_method' => 'western_union',
            'recipient_details' => ['full_name' => 'Sara Noor'],
            'status' => 'requested',
        ]);

        AffiliateLedgerEntry::create([
            'user_id' => $affiliate->id,
            'payout_id' => $payout->id,
            'entry_type' => 'payout_debit',
            'amount_cents' => -5000,
            'currency' => 'USD',
            'status' => 'available',
            'idempotency_key' => "payout_debit_{$payout->payout_number}",
        ]);

        $receiptFile = UploadedFile::fake()->create('receipt.jpg', 100, 'image/jpeg');

        // 1. Settle requested payout -> completed
        $settleResponse = $this->withHeaders($headers)->postJson("/api/v1/admin/payouts/{$payout->payout_number}/settle", [
            'reference_number' => 'MTCN-555',
            'receipt' => $receiptFile,
        ]);
        $settleResponse->assertStatus(200);
        $settleResponse->assertJsonPath('data.status', 'completed');

        // 2. Idempotent replay: settle with identical reference -> 200
        $replayResponse = $this->withHeaders($headers)->postJson("/api/v1/admin/payouts/{$payout->payout_number}/settle", [
            'reference_number' => 'MTCN-555',
            'receipt' => $receiptFile,
        ]);
        $replayResponse->assertStatus(200);

        // 3. Different reference on already completed payout -> 409
        $conflictResponse = $this->withHeaders($headers)->postJson("/api/v1/admin/payouts/{$payout->payout_number}/settle", [
            'reference_number' => 'MTCN-DIFFERENT',
            'receipt' => $receiptFile,
        ]);
        $conflictResponse->assertStatus(409);
        $conflictResponse->assertJsonPath('code', 'ERR_STATE_CONFLICT');

        // 4. Reject an already completed payout -> 409
        $rejectOnCompleted = $this->withHeaders($headers)->postJson("/api/v1/admin/payouts/{$payout->payout_number}/reject", [
            'reason' => 'Invalid bank details',
        ]);
        $rejectOnCompleted->assertStatus(409);
        $rejectOnCompleted->assertJsonPath('code', 'ERR_STATE_CONFLICT');
    }

    public function test_rejection_appends_single_compensating_reversal_credit_and_is_idempotent(): void
    {
        Storage::fake('payout-receipts');

        $admin = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $admin->grantCapability(AdminCapabilities::SETTLE_AFFILIATE_PAYOUT, null, 'bootstrap');
        $token = $admin->createToken('admin_token')->plainTextToken;
        $headers = ['Authorization' => "Bearer {$token}"];

        $affiliate = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);

        $payout = AffiliatePayout::create([
            'payout_number' => 'KNZ-PAY-STATE-2',
            'user_id' => $affiliate->id,
            'amount_cents' => 6000,
            'threshold_cents_at_request' => 5000,
            'amount_iqd' => 78600,
            'payout_method' => 'zain_cash',
            'recipient_details' => ['phone' => '07712345678'],
            'status' => 'processing',
        ]);

        AffiliateLedgerEntry::create([
            'user_id' => $affiliate->id,
            'payout_id' => $payout->id,
            'entry_type' => 'payout_debit',
            'amount_cents' => -6000,
            'currency' => 'USD',
            'status' => 'available',
            'idempotency_key' => "payout_debit_{$payout->payout_number}",
        ]);

        // 1. Reject processing payout
        $rejectResponse = $this->withHeaders($headers)->postJson("/api/v1/admin/payouts/{$payout->payout_number}/reject", [
            'reason' => 'Beneficiary phone number disconnected',
        ]);
        $rejectResponse->assertStatus(200);
        $rejectResponse->assertJsonPath('data.status', 'rejected');

        // Verify single compensating reversal credit
        $reversal = AffiliateLedgerEntry::where('payout_id', $payout->id)
            ->where('entry_type', 'reversal_credit')
            ->first();
        $this->assertNotNull($reversal);
        $this->assertEquals(6000, $reversal->amount_cents);

        // 2. Idempotent replay: reject already rejected payout -> 200, no duplicate credit
        $replayReject = $this->withHeaders($headers)->postJson("/api/v1/admin/payouts/{$payout->payout_number}/reject", [
            'reason' => 'Beneficiary phone number disconnected',
        ]);
        $replayReject->assertStatus(200);
        $this->assertEquals(1, AffiliateLedgerEntry::where('payout_id', $payout->id)->where('entry_type', 'reversal_credit')->count());

        // 3. Attempting to settle rejected payout -> 409
        $receiptFile = UploadedFile::fake()->create('receipt.jpg', 100, 'image/jpeg');
        $settleOnRejected = $this->withHeaders($headers)->postJson("/api/v1/admin/payouts/{$payout->payout_number}/settle", [
            'reference_number' => 'MTCN-999',
            'receipt' => $receiptFile,
        ]);
        $settleOnRejected->assertStatus(409);
        $settleOnRejected->assertJsonPath('code', 'ERR_STATE_CONFLICT');
    }
}
