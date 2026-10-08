<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Support\AdminCapabilities;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminMediaUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_upload_valid_course_image(): void
    {
        Storage::fake('public');

        $admin = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $admin->grantCapability(AdminCapabilities::MANAGE_PLATFORM_SETTINGS, null, 'bootstrap');
        $token = $admin->createToken('admin_token')->plainTextToken;

        $file = UploadedFile::fake()->create('course_cover.jpg', 100, 'image/jpeg');

        $response = $this->withHeaders(['Authorization' => "Bearer {$token}"])
            ->post('/api/v1/admin/media/upload-image', [
                'image' => $file,
                'folder' => 'courses',
            ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'data' => [
                'url',
                'relative_url',
                'filename',
            ],
        ]);

        $filename = $response->json('data.filename');
        Storage::disk('public')->assertExists("courses/{$filename}");
    }

    public function test_upload_rejects_non_image_files(): void
    {
        Storage::fake('public');

        $admin = User::factory()->create(['status' => 'active', 'auth_provider' => 'google']);
        $admin->grantCapability(AdminCapabilities::MANAGE_PLATFORM_SETTINGS, null, 'bootstrap');
        $token = $admin->createToken('admin_token')->plainTextToken;

        $badFile = UploadedFile::fake()->create('script.php', 100, 'text/x-php');

        $response = $this->withHeaders(['Authorization' => "Bearer {$token}"])
            ->postJson('/api/v1/admin/media/upload-image', [
                'image' => $badFile,
            ]);

        $response->assertStatus(422);
    }
}
