<?php

namespace Tests\Feature;

use App\Models\AffiliateProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReferralResolutionContractTest extends TestCase
{
    use RefreshDatabase;

    public function test_resolves_valid_learner_code_referral_returns_200(): void
    {
        $referrer = User::factory()->create([
            'learner_code' => 'LRN-7K2M',
            'display_name' => 'Ali Faraj',
            'status' => 'active',
        ]);

        $response = $this->getJson('/api/v1/referrals/resolve/LRN-7K2M');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'valid' => true,
                    'referral_code' => 'LRN-7K2M',
                    'referrer' => [
                        'display_name' => 'Ali Faraj',
                    ],
                    'incentives' => [
                        'buyer_promotional_tickets_part' => 1,
                        'buyer_promotional_tickets_bundle' => 15,
                        'buyer_surcharge' => false,
                    ],
                ],
            ]);
    }

    public function test_resolves_custom_vanity_slug_returns_200(): void
    {
        $referrer = User::factory()->create([
            'learner_code' => 'LRN-VIP1',
            'display_name' => 'Influencer Star',
            'status' => 'active',
        ]);

        AffiliateProfile::create([
            'user_id' => $referrer->id,
            'custom_slug' => 'alifaraj',
            'status' => 'active',
        ]);

        $response = $this->getJson('/api/v1/referrals/resolve/alifaraj');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'valid' => true,
                    'referral_code' => 'LRN-VIP1',
                    'referrer' => [
                        'display_name' => 'Influencer Star',
                    ],
                ],
            ]);
    }

    public function test_returns_404_for_unknown_or_inactive_referral_code(): void
    {
        $response = $this->getJson('/api/v1/referrals/resolve/NONEXISTENT');

        $response->assertStatus(404)
            ->assertJson([
                'status' => 'fail',
                'code' => 'ERR_REFERRAL_CODE_NOT_FOUND',
                'data' => [
                    'valid' => false,
                ],
            ]);
    }

    public function test_authenticated_user_resolving_own_code_returns_422_self_referral(): void
    {
        $user = User::factory()->create([
            'learner_code' => 'LRN-MINE',
            'status' => 'active',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/referrals/resolve/LRN-MINE');

        $response->assertStatus(422)
            ->assertJson([
                'status' => 'fail',
                'code' => 'ERR_SELF_REFERRAL_FORBIDDEN',
                'data' => [
                    'valid' => false,
                    'is_self_referral' => true,
                ],
            ]);
    }
}
