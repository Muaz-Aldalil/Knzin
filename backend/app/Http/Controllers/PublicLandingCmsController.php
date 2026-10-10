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
     * Get published CMS content for public visitor pages.
     * Default returns legacy landing sections (count 11).
     * With ?scope=all, returns all 20 site-wide application sections.
     */
    public function index(Request $request): JsonResponse
    {
        $sections = $request->query('scope') === 'all'
            ? $this->landingCmsService->getAllCmsSections()
            : $this->landingCmsService->getAllSections();

        // Shape as key-value map for fast lookup on frontend: { [section]: content }
        $contentMap = [];
        foreach ($sections as $sectionKey => $data) {
            $contentMap[$sectionKey] = $data['content'];
        }

        return $this->successResponse(
            ['sections' => $contentMap],
            \Symfony\Component\HttpFoundation\Response::HTTP_OK,
            ['Cache-Control' => 'public, max-age=60, s-maxage=300, stale-while-revalidate=600']
        );
    }

    /**
     * Dedicated site-wide public endpoint returning all application sections.
     */
    public function siteWide(Request $request): JsonResponse
    {
        $sections = $this->landingCmsService->getAllCmsSections();

        $contentMap = [];
        foreach ($sections as $sectionKey => $data) {
            $contentMap[$sectionKey] = $data['content'];
        }

        return $this->successResponse(
            ['sections' => $contentMap],
            \Symfony\Component\HttpFoundation\Response::HTTP_OK,
            ['Cache-Control' => 'public, max-age=60, s-maxage=300, stale-while-revalidate=600']
        );
    }
}
