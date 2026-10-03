<?php

namespace App\Services\Admin;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

readonly class StagedReceipt
{
    public function __construct(
        public string $path,
        public string $sha256,
        public int $sizeBytes
    ) {
    }
}

class ReceiptStorageService
{
    private const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
    private const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
    private const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

    /**
     * Validate and stage an uploaded physical payout receipt on the private disk.
     */
    public function stage(UploadedFile $file): StagedReceipt
    {
        $extension = strtolower((string) $file->getClientOriginalExtension());
        if (!in_array($extension, self::ALLOWED_EXTENSIONS, true)) {
            throw ValidationException::withMessages([
                'receipt' => ['Receipt file must be an image with extension: jpg, jpeg, png, or webp.'],
            ]);
        }

        $mimeType = $file->getMimeType();
        if (!in_array($mimeType, self::ALLOWED_MIMES, true)) {
            throw ValidationException::withMessages([
                'receipt' => ['Invalid receipt content type. Only JPG, PNG, and WebP images are permitted.'],
            ]);
        }

        $size = $file->getSize();
        if ($size > self::MAX_SIZE_BYTES) {
            throw ValidationException::withMessages([
                'receipt' => ['Receipt file exceeds maximum permitted size of 5 MB.'],
            ]);
        }

        $sha256 = hash_file('sha256', $file->getRealPath());
        $ulid = strtolower((string) Str::ulid());
        $path = "receipts/{$ulid}.{$extension}";

        $stored = Storage::disk('payout-receipts')->put($path, file_get_contents($file->getRealPath()));
        if (!$stored) {
            throw new \RuntimeException('Failed to store receipt on private storage disk.');
        }

        return new StagedReceipt(
            path: $path,
            sha256: $sha256,
            sizeBytes: $size
        );
    }

    /**
     * Delete a staged receipt file if an operation fails or rolls back.
     */
    public function discard(?string $path): void
    {
        if ($path && Storage::disk('payout-receipts')->exists($path)) {
            Storage::disk('payout-receipts')->delete($path);
        }
    }
}
