<?php

namespace App\Services;

use App\Models\Course;
use App\Models\CoursePart;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\URL;

class MediaProtectionService
{
    public const TOKEN_VALIDITY_SECONDS = 900; // 15 minutes max per Constitution

    public function __construct(protected EntitlementService $entitlementService)
    {
    }

    /**
     * Generate signed playback authorization response according to playback-auth.contract.md.
     */
    public function generatePlaybackToken(?User $user, Course $course, CoursePart $part): array
    {
        $partNumber = (int) $part->part_number;

        // Part 1: Public free preview
        if ($partNumber === 1) {
            return [
                'course_slug' => $course->slug,
                'part_number' => 1,
                'part_title_ar' => $part->title_ar,
                'part_title_en' => $part->title_en,
                'duration_seconds' => (int) $part->duration_seconds,
                'stream' => [
                    'stream_url' => url("/api/v1/media/stream/{$course->slug}/1"),
                    'format' => 'hls',
                    'expires_at' => null,
                    'validity_seconds' => null,
                ],
                'watermark' => null,
            ];
        }

        // Part 2+: Requires authenticated learner with verified entitlement
        if (!$user) {
            return [
                'error' => 'ERR_UNAUTHORIZED',
                'message' => 'يرجى تسجيل الدخول أو إدخال بريدك للوصول إلى هذا المحتوى المدفوع.',
                'status_code' => 401,
            ];
        }

        if (!$this->entitlementService->hasAccess($user, $course, $part)) {
            return [
                'error' => 'ERR_PART_LOCKED',
                'message' => 'يجب شراء هذا الجزء التدريبي أو باقة الدورة الكاملة للمشاهدة.',
                'status_code' => 403,
                'pricing' => [
                    'part_price_cents' => (int) $part->part_price_cents,
                    'part_promotional_tickets' => (int) $part->part_promotional_tickets,
                    'bundle_price_cents' => (int) $course->bundle_price_cents,
                    'bundle_promotional_tickets' => (int) $course->bundle_promotional_tickets,
                ],
            ];
        }

        $expiresAt = Carbon::now('UTC')->addSeconds(self::TOKEN_VALIDITY_SECONDS);

        $signedStreamUrl = URL::temporarySignedRoute(
            'api.media.stream',
            $expiresAt,
            [
                'courseSlug' => $course->slug,
                'partNumber' => $partNumber,
            ]
        );

        return [
            'course_slug' => $course->slug,
            'part_number' => $partNumber,
            'part_title_ar' => $part->title_ar,
            'part_title_en' => $part->title_en,
            'duration_seconds' => (int) $part->duration_seconds,
            'stream' => [
                'stream_url' => $signedStreamUrl,
                'format' => 'hls',
                'expires_at' => $expiresAt->toIso8601String(),
                'validity_seconds' => self::TOKEN_VALIDITY_SECONDS,
            ],
            'watermark' => [
                'account_email' => $user->email,
                'learner_code' => $user->learner_code,
                'rendered_at' => Carbon::now('UTC')->format('d M Y H:i'),
            ],
        ];
    }

    /**
     * Generate signed download token response according to downloads.contract.md.
     */
    public function generateDownloadToken(User $user, Course $course, CoursePart $part, string $resourceId): array
    {
        if (!preg_match('/^[a-zA-Z0-9_-]+$/', $resourceId)) {
            return [
                'error' => 'ERR_INVALID_RESOURCE_ID',
                'message' => 'معرف الملف غير صالح.',
                'status_code' => 400,
            ];
        }

        if (!$this->entitlementService->hasAccess($user, $course, $part)) {
            return [
                'error' => 'ERR_RESOURCE_LOCKED',
                'message' => 'الملفات المرفقة متاحة حصرياً للمتدربين المشتركين في هذا الجزء أو باقة الدورة.',
                'status_code' => 403,
            ];
        }

        $expiresAt = Carbon::now('UTC')->addSeconds(self::TOKEN_VALIDITY_SECONDS);

        $downloadUrl = URL::temporarySignedRoute(
            'api.media.download',
            $expiresAt,
            [
                'courseSlug' => $course->slug,
                'partNumber' => (int) $part->part_number,
                'resourceId' => $resourceId,
            ]
        );

        return [
            'resource_id' => $resourceId,
            'filename' => "{$course->slug}_part_{$part->part_number}_{$resourceId}.pdf",
            'mime_type' => 'application/pdf',
            'size_bytes' => 1048576,
            'download_url' => $downloadUrl,
            'expires_at' => $expiresAt->toIso8601String(),
            'validity_seconds' => self::TOKEN_VALIDITY_SECONDS,
        ];
    }
}
