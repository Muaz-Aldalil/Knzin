<?php

namespace Tests\Feature\Admin;

use App\Models\AffiliateLedgerEntry;
use App\Models\Draw;
use App\Models\DrawWinner;
use App\Models\PromotionalAward;
use App\Models\Ticket;
use App\Models\User;
use App\Support\AdminCapabilities;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminPromotionalAwardTest extends TestCase
{
    use RefreshDatabase;

    public function test_promotional_award_grant_with_zero_side_effect_on_canonical_winners_and_ledger(): void
    {
        $admin = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $admin->grantCapability(AdminCapabilities::MANAGE_PLATFORM_SETTINGS, null, 'bootstrap');
        $token = $admin->createToken('admin_token')->plainTextToken;
        $headers = ['Authorization' => "Bearer {$token}"];

        $recipient = User::factory()->create([
            'status' => 'active',
            'auth_provider' => 'google',
            'learner_code' => 'LRN-AWARD-RECIP',
        ]);

        $draw = Draw::factory()->create(['is_published' => true]);

        $winnerCountBefore = DrawWinner::count();
        $ticketCountBefore = Ticket::count();
        $ledgerCountBefore = AffiliateLedgerEntry::count();

        // 1. Grant award using learner code
        $response = $this->withHeaders($headers)->postJson('/api/v1/admin/awards', [
            'recipient_user_id' => $recipient->learner_code,
            'draw_id' => $draw->id,
            'award_title' => 'شهادة تقدير وتكريم',
            'award_details' => 'Honorary Certificate of Distinction',
            'valuation_usd_cents' => 5000,
            'reason' => 'Outstanding contribution to peer learning community',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.recipient_user_id', $recipient->id);
        $response->assertJsonPath('data.award_title', 'شهادة تقدير وتكريم');
        $response->assertJsonPath('data.awarded_by_admin_id', $admin->id);

        // 2. Invariants: Canonical winners, tickets, and financial ledger entries remain completely untouched
        $this->assertEquals($winnerCountBefore, DrawWinner::count());
        $this->assertEquals($ticketCountBefore, Ticket::count());
        $this->assertEquals($ledgerCountBefore, AffiliateLedgerEntry::count());

        // 3. Promotional award is persisted in dedicated promotional_awards table
        $award = PromotionalAward::where('recipient_user_id', $recipient->id)->first();
        $this->assertNotNull($award);
        $this->assertEquals($draw->id, $award->draw_id);
        $this->assertEquals(5000, $award->valuation_usd_cents);
    }
}
