<?php

namespace Tests\Feature;

use App\Models\Course;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\CourseCatalogSeeder::class);
    }

    public function test_catalog_listing_returns_active_courses_with_pricing_and_tickets(): void
    {
        $response = $this->getJson('/api/v1/catalog/courses');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure([
                'status',
                'data' => [
                    '*' => [
                        'id',
                        'slug',
                        'title_ar',
                        'title_en',
                        'description_ar',
                        'description_en',
                        'cover_image_url',
                        'bundle_price_cents',
                        'bundle_promotional_tickets',
                        'display_price_label',
                        'parts_count',
                    ],
                ],
            ]);

        $courses = $response->json('data');
        $this->assertGreaterThanOrEqual(3, count($courses));

        // Verify bundle pricing and ticket incentive
        $autoDetailing = collect($courses)->firstWhere('slug', 'auto-detailing');
        $this->assertNotNull($autoDetailing);
        $this->assertEquals(1000, $autoDetailing['bundle_price_cents']);
        $this->assertEquals(15, $autoDetailing['bundle_promotional_tickets']);
        $this->assertEquals('13,000 IQD', $autoDetailing['display_price_label']);
        $this->assertEquals(6, $autoDetailing['parts_count']);
    }

    public function test_catalog_course_detail_returns_all_modular_parts_in_order(): void
    {
        $response = $this->getJson('/api/v1/catalog/courses/auto-detailing');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.slug', 'auto-detailing')
            ->assertJsonStructure([
                'status',
                'data' => [
                    'id',
                    'slug',
                    'title_ar',
                    'title_en',
                    'description_ar',
                    'description_en',
                    'cover_image_url',
                    'bundle_price_cents',
                    'bundle_promotional_tickets',
                    'display_price_label',
                    'parts' => [
                        '*' => [
                            'id',
                            'part_number',
                            'title_ar',
                            'title_en',
                            'syllabus_ar',
                            'syllabus_en',
                            'part_price_cents',
                            'part_promotional_tickets',
                            'display_price_label',
                            'resource_types',
                            'duration_minutes',
                        ],
                    ],
                ],
            ]);

        $parts = $response->json('data.parts');
        $this->assertCount(6, $parts);

        // Verify parts are strictly in order 1..6
        for ($i = 0; $i < 6; $i++) {
            $this->assertEquals($i + 1, $parts[$i]['part_number']);
            $this->assertEquals(200, $parts[$i]['part_price_cents']);
            $this->assertEquals(1, $parts[$i]['part_promotional_tickets']);
            $this->assertEquals('2,000 IQD', $parts[$i]['display_price_label']);
            $this->assertIsArray($parts[$i]['resource_types']);
        }
    }

    public function test_catalog_returns_404_for_non_existent_course(): void
    {
        $response = $this->getJson('/api/v1/catalog/courses/non-existent-course');

        $response->assertStatus(404)
            ->assertJsonPath('status', 'fail')
            ->assertJsonPath('code', 'ERR_COURSE_NOT_FOUND');
    }
}
