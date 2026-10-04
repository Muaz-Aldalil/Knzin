<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\ApiController;
use App\Http\Requests\Admin\UpdateLandingCmsRequest;
use App\Services\LandingCmsService;
use App\Support\AdminCapabilities;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminLandingCmsController extends ApiController
{
    public function __construct(
        protected LandingCmsService $landingCmsService
    ) {
    }

    /**
     * Get all CMS sections for admin editor.
     */
    public function index(Request $request): JsonResponse
    {
        $sections = $this->landingCmsService->getAllSections();

        return $this->successResponse([
            'sections' => $sections,
        ]);
    }

    /**
     * Get a specific CMS section.
     */
    public function show(Request $request, string $section): JsonResponse
    {
        $data = $this->landingCmsService->getSection($section);

        return $this->successResponse($data);
    }

    /**
     * Update a specific CMS section.
     */
    public function update(UpdateLandingCmsRequest $request, string $section): JsonResponse
    {
        $updated = $this->landingCmsService->updateSection(
            section: $section,
            data: $request->getContentData(),
            actor: $request->user(),
            auditContext: $request->auditContext()
        );

        return $this->successResponse($updated);
    }
}
