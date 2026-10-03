<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\ApiController;
use App\Http\Requests\Admin\UpdateSettingsRequest;
use App\Models\PlatformSetting;
use App\Services\PlatformSettingsService;
use App\Support\AdminCapabilities;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSettingsController extends ApiController
{
    public function __construct(
        protected PlatformSettingsService $settingsService
    ) {
    }

    /**
     * Get platform settings.
     */
    public function show(Request $request): JsonResponse
    {
        $commissionRateBps = (int) $this->settingsService->get('affiliate.commission_rate_bps', 2500);
        $payoutMinCents = (int) $this->settingsService->get('affiliate.payout_min_cents', 5000);
        $maturationHours = (int) config('knzin.affiliate.maturation_hours', 24);
        $coPrizeRateBps = (int) config('knzin.affiliate.co_prize_rate_bps', 4000);

        $keys = ['affiliate.commission_rate_bps', 'affiliate.payout_min_cents'];
        $metaSettings = PlatformSetting::whereIn('key', $keys)->get()->keyBy('key');

        $meta = [];
        foreach ($keys as $key) {
            $record = $metaSettings->get($key);
            $meta[$key] = [
                'updated_by_user_id' => $record?->updated_by_user_id,
                'updated_at' => $record?->updated_at?->toIso8601String(),
            ];
        }

        return $this->successResponse([
            'commission_rate_bps' => $commissionRateBps,
            'commission_rate_percent' => round($commissionRateBps / 100, 2),
            'payout_min_cents' => $payoutMinCents,
            'maturation_hours' => $maturationHours,
            'co_prize_rate_bps' => $coPrizeRateBps,
            'meta' => $meta,
        ]);
    }

    /**
     * Update platform settings forward-only with atomic audit.
     */
    public function update(UpdateSettingsRequest $request): JsonResponse
    {
        $settingsToUpdate = [];

        if ($request->has('commission_rate_bps')) {
            $settingsToUpdate['affiliate.commission_rate_bps'] = (int) $request->input('commission_rate_bps');
        }

        if ($request->has('payout_min_cents')) {
            $settingsToUpdate['affiliate.payout_min_cents'] = (int) $request->input('payout_min_cents');
        }

        $auditContext = $request->auditContext(AdminCapabilities::MANAGE_PLATFORM_SETTINGS);

        $this->settingsService->setMany(
            settings: $settingsToUpdate,
            actor: $request->user(),
            auditContext: $auditContext
        );

        return $this->show($request);
    }
}
