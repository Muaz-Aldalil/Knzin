<?php

namespace Database\Factories;

use App\Models\Course;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Course>
 */
class CourseFactory extends Factory
{
    protected $model = Course::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'slug' => 'course-' . Str::random(8),
            'title_ar' => 'دورة تدريبية تجريبية',
            'title_en' => 'Test Course Title',
            'description_ar' => 'وصف الدورة التدريبية',
            'description_en' => 'Test course description',
            'cover_image_url' => 'https://knzin.com/assets/course-cover.png',
            'bundle_price_cents' => 10000,
            'bundle_promotional_tickets' => 1,
            'display_price_label' => '$100',
            'is_active' => true,
        ];
    }
}
