<?php

namespace Tests\Feature\Admin;

use App\Models\AffiliatePayout;
use App\Models\User;
use App\Support\AdminCapabilities;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminReceiptStagingTest extends TestCase
{
    use RefreshDatabase;

    public function test_receipt_staging_enforces_image_type_and_size_cap(): void
    {
        Storage::fake('payout-receipts');

        $admin = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $admin->grantCapability(AdminCapabilities::SETTLE_AFFILIATE_PAYOUT, null, 'bootstrap');
        $token = $admin->createToken('admin_token')->plainTextToken;
        $headers = ['Authorization' => "Bearer {$token}"];

        $affiliate = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);

        $payout = AffiliatePayout::create([
            'payout_number' => 'KNZ-PAY-TEST-STG',
            'user_id' => $affiliate->id,
            'amount_cents' => 5000,
            'threshold_cents_at_request' => 5000,
            'amount_iqd' => 65500,
            'payout_method' => 'zain_cash',
            'recipient_details' => ['phone' => '07700000000'],
            'status' => 'requested',
        ]);

        // 1. Disallowed file extension (.txt or .pdf)
        $badFile = UploadedFile::fake()->create('receipt.txt', 100, 'text/plain');
        $response = $this->withHeaders($headers)->postJson("/api/v1/admin/payouts/{$payout->payout_number}/settle", [
            'reference_number' => 'REF-1234',
            'receipt' => $badFile,
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['receipt']);

        // 2. File exceeding 5 MB limit
        $oversizedFile = UploadedFile::fake()->create('receipt.jpg', 6000, 'image/jpeg'); // 6 MB
        $response2 = $this->withHeaders($headers)->postJson("/api/v1/admin/payouts/{$payout->payout_number}/settle", [
            'reference_number' => 'REF-1234',
            'receipt' => $oversizedFile,
        ]);
        $response2->assertStatus(422);
        $response2->assertJsonValidationErrors(['receipt']);
    }
}
