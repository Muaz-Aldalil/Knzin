<?php

namespace Tests\Feature\Admin;

use App\Models\AffiliateLedgerEntry;
use App\Models\Course;
use App\Models\Draw;
use App\Models\DrawWinner;
use App\Models\Order;
use App\Models\ReferralAttribution;
use App\Models\Ticket;
use App\Models\User;
use App\Services\ApprovalRegistryService;
use App\Support\AdminCapabilities;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminCoPrizeAdjudicationTest extends TestCase
{
    use RefreshDatabase;

    public function test_dual_approval_gating_release_and_post_release_revocation(): void
    {
        $admin = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $admin->grantCapability(AdminCapabilities::ADJUDICATE_AFFILIATE_COPRIZE, null, 'bootstrap');
        $admin->grantCapability(AdminCapabilities::ISSUE_KYC_APPROVAL, null, 'bootstrap');
        $admin->grantCapability(AdminCapabilities::ISSUE_DRAW_AUDIT_APPROVAL, null, 'bootstrap');
        $token = $admin->createToken('admin_token')->plainTextToken;
        $headers = ['Authorization' => "Bearer {$token}"];

        // Setup draw, winner, referrer, ticket, and pending co-prize credit
        $referrer = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $buyer = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $draw = Draw::factory()->create(['status' => 'completed', 'is_published' => true]);

        $order = Order::factory()->create([
            'user_id' => $buyer->id,
            'order_number' => 'KNZ-ORD-COPRIZE',
            'total_amount_cents' => 10000,
            'status' => 'completed',
        ]);

        ReferralAttribution::create([
            'order_id' => $order->id,
            'referrer_user_id' => $referrer->id,
            'buyer_user_id' => $buyer->id,
            'referral_code' => $referrer->learner_code,
            'commission_rate_bps' => 2500,
        ]);

        $ticketSerial = 'KNZ-26-W1NN-0001';
        $ticket = Ticket::factory()->create([
            'user_id' => $buyer->id,
            'order_id' => $order->id,
            'serial_number' => $ticketSerial,
        ]);

        $winner = DrawWinner::create([
            'draw_id' => $draw->id,
            'ticket_id' => $ticket->id,
            'user_id' => $buyer->id,
            'winning_ticket_serial' => $ticketSerial,
            'winner_masked_name' => 'A*** M***',
            'winner_governorate' => 'Baghdad',
            'drawn_at' => now(),
        ]);

        $coPrizeEntry = AffiliateLedgerEntry::create([
            'user_id' => $referrer->id,
            'order_id' => $order->id,
            'entry_type' => 'co_prize_credit',
            'amount_cents' => 40000, // 40% of $1,000 grand prize
            'currency' => 'USD',
            'status' => 'pending',
            'funding_source' => 'marketing_pool',
            'metadata' => [
                'winning_ticket_serial' => $ticketSerial,
                'grand_prize_valuation_cents' => 100000,
                'co_prize_rate_bps' => 4000,
                'co_prize_cents' => 40000,
            ],
            'idempotency_key' => "co_prize_ticket_{$ticketSerial}",
        ]);

        // 1. Attempt release without approvals -> 409 ERR_COPRIZE_APPROVALS_INCOMPLETE
        $prematureResponse = $this->withHeaders($headers)
            ->postJson("/api/v1/admin/coprizes/{$ticketSerial}/release");
        $prematureResponse->assertStatus(409);
        $prematureResponse->assertJsonPath('code', 'ERR_COPRIZE_APPROVALS_INCOMPLETE');

        // 2. Issue KYC approval for buyer and Draw Integrity for draw
        $registry = app(ApprovalRegistryService::class);
        $kycApp = $registry->issueApproval('kyc', 'user', $buyer->id, 'approved', 'admin_panel', $admin);
        $drawApp = $registry->issueApproval('draw_integrity', 'draw', $draw->id, 'approved', 'admin_panel', $admin);

        // 3. Release succeeds with dual approvals present
        $releaseResponse = $this->withHeaders($headers)
            ->postJson("/api/v1/admin/coprizes/{$ticketSerial}/release");
        $releaseResponse->assertStatus(200);
        $releaseResponse->assertJsonPath('status', 'success');
        $this->assertEquals('available', $coPrizeEntry->fresh()->status);

        // 4. Idempotent replay: release already available -> 200
        $replayResponse = $this->withHeaders($headers)
            ->postJson("/api/v1/admin/coprizes/{$ticketSerial}/release");
        $replayResponse->assertStatus(200);

        // 5. Post-release revocation with confirmation
        $revokeResponse = $this->withHeaders($headers)
            ->postJson("/api/v1/admin/coprizes/{$ticketSerial}/revoke", [
                'justification' => 'Disqualified after identity investigation',
                'confirm' => true,
            ]);
        $revokeResponse->assertStatus(200);
        $revokeResponse->assertJsonStructure([
            'status',
            'data' => [
                'reversal_entry',
                'exposure_preview' => [
                    'net_after_reversal',
                    'withdrawn_exposure',
                ],
            ],
        ]);

        // Assert reversal entry exists and original entry is preserved
        $this->assertEquals('available', $coPrizeEntry->fresh()->status);
        $reversal = AffiliateLedgerEntry::where('entry_type', 'reversal_debit')
            ->where('idempotency_key', "co_prize_reversal_{$ticketSerial}")
            ->first();
        $this->assertNotNull($reversal);
        $this->assertEquals(-40000, $reversal->amount_cents);
    }
}
