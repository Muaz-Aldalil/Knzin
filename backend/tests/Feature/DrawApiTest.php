<?php

namespace Tests\Feature;

use App\Models\Draw;
use App\Models\DrawWinner;
use App\Models\Prize;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DrawApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\PromotionalDrawSeeder::class);
    }
    /**
     * Test active draws endpoint returns standardized JSend envelope with server UTC timestamp.
     */
    public function test_active_draws_endpoint_returns_jsend_success_envelope(): void
    {
        $response = $this->getJson('/api/v1/draws/active');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data' => [
                    'server_time_utc',
                    'draws' => [
                        '*' => [
                            'id',
                            'tier',
                            'execution_type',
                            'title',
                            'status',
                            'starts_at',
                            'ends_at',
                            'badge_label',
                            'broadcast_url',
                            'total_eligible_tickets',
                            'prize' => [
                                'title',
                                'description',
                                'category',
                                'valuation_usd',
                                'display_iqd_label',
                                'image_url',
                            ],
                        ],
                    ],
                ],
            ]);

        $this->assertEquals('success', $response->json('status'));
        $this->assertNotEmpty($response->json('data.server_time_utc'));
        $this->assertIsArray($response->json('data.draws'));
    }

    /**
     * Test active draws computes dynamic locked status when ends_at <= now().
     */
    public function test_active_draws_endpoint_computes_dynamic_locked_status_at_zero(): void
    {
        $now = Carbon::now();

        // Create a draw that ended 5 minutes ago (within 15m grace window) but status in DB is 'active'
        $draw = Draw::create([
            'tier' => 'hourly',
            'execution_type' => 'automated_electronic',
            'title_ar' => 'سحب منتهي حديثاً للاختبار',
            'title_en' => 'Recently Expired Test Draw',
            'status' => 'active',
            'starts_at' => $now->copy()->subMinutes(60),
            'ends_at' => $now->copy()->subMinutes(5),
            'broadcast_url' => null,
            'total_eligible_tickets' => 50,
        ]);

        Prize::create([
            'draw_id' => $draw->id,
            'title_ar' => 'جائزة تجريبية',
            'title_en' => 'Test Prize',
            'category' => 'cash',
            'valuation_usd_cents' => 10000,
            'display_iqd_label' => '131,000 د.ع',
            'image_url' => 'https://example.com/prize.webp',
        ]);

        $response = $this->getJson('/api/v1/draws/active');

        $response->assertStatus(200);

        $draws = collect($response->json('data.draws'));
        $matched = $draws->firstWhere('id', $draw->id);

        $this->assertNotNull($matched);
        $this->assertEquals('locked', $matched['status'], 'Status should dynamically resolve to locked when ends_at <= now');
    }

    /**
     * Test concluded draws endpoint returns privacy-masked winners and winning ticket numbers.
     */
    public function test_concluded_draws_endpoint_returns_verified_masked_winners(): void
    {
        $response = $this->getJson('/api/v1/draws/concluded');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data' => [
                    'draws' => [
                        '*' => [
                            'id',
                            'tier',
                            'title',
                            'concluded_at',
                            'broadcast_replay_url',
                            'prize' => [
                                'title',
                                'valuation_usd',
                                'display_iqd_label',
                                'image_url',
                            ],
                            'winner' => [
                                'winning_ticket_serial',
                                'masked_name',
                                'governorate',
                                'prize_delivered',
                            ],
                        ],
                    ],
                ],
            ]);

        $draws = $response->json('data.draws');
        $this->assertNotEmpty($draws);

        foreach ($draws as $item) {
            $this->assertStringStartsWith('#KNZ-', $item['winner']['winning_ticket_serial']);
            $this->assertNotEmpty($item['winner']['masked_name']);
            $this->assertNotEmpty($item['winner']['governorate']);
        }
    }

    /**
     * Test locale header returns corresponding translated titles.
     */
    public function test_draws_honor_locale_header(): void
    {
        $responseAr = $this->withHeader('X-Locale', 'ar')->getJson('/api/v1/draws/active');
        $responseEn = $this->withHeader('X-Locale', 'en')->getJson('/api/v1/draws/active');

        $responseAr->assertStatus(200);
        $responseEn->assertStatus(200);

        $drawsAr = $responseAr->json('data.draws');
        $drawsEn = $responseEn->json('data.draws');

        $this->assertNotEmpty($drawsAr);
        $this->assertNotEmpty($drawsEn);

        // Check badge and title difference
        $this->assertEquals('سحب مضمون ومجدول رسمياً', $drawsAr[0]['badge_label']);
        $this->assertEquals('Officially Scheduled & Guaranteed', $drawsEn[0]['badge_label']);
    }
}
