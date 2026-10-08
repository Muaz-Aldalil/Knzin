<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\ApiController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AdminMediaController extends ApiController
{
    /**
     * Upload an image from local device and return its public URL.
     */
    public function uploadImage(Request $request): JsonResponse
    {
        $request->validate([
            'image' => [
                'required',
                'file',
                'image',
                'mimes:jpeg,png,jpg,webp,gif,svg',
                'max:10240', // 10MB
            ],
            'folder' => ['nullable', 'string', 'in:courses,draws,prizes,general'],
        ]);

        $file = $request->file('image');
        $folder = $request->input('folder', 'courses');

        $extension = $file->getClientOriginalExtension() ?: 'jpg';
        $filename = Str::uuid()->toString() . '.' . $extension;
        $path = "{$folder}/{$filename}";

        Storage::disk('public')->putFileAs($folder, $file, $filename);

        $url = url("storage/{$path}");

        return $this->successResponse([
            'url' => $url,
            'relative_url' => "/storage/{$path}",
            'filename' => $filename,
        ]);
    }
}
