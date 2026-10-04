<?php

namespace App\Http\Controllers;

use App\Services\LandingCmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicLandingCmsController extends ApiController
{
    public function __construct(
        protected LandingCmsService $landingCmsService
    ) {
    }

    /**
     * Get published landing content for public visitor pages.
     */
    public function index(Request $request): JsonResponse
    {
        $sections = $this->landingCmsService->getAllSections();

        // Shape as key-value map for fast lookup on frontend: { [section]: content }
        $contentMap = [];
        foreach ($sections as $sectionKey => $data) {
            $contentMap[$sectionKey] = $data['content'];
        }

        return $this->successResponse([
            'sections' => $contentMap,
        ]);
    }
}
