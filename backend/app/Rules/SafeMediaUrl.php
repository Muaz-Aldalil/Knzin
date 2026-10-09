<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class SafeMediaUrl implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($value === null || $value === '') {
            return;
        }

        if (!is_string($value)) {
            $fail(__('validation.string', ['attribute' => $attribute]));
            return;
        }

        $trimmed = trim($value);
        if ($trimmed === '') {
            return;
        }

        if (strlen($trimmed) > 1000) {
            $fail(__('The :attribute must not exceed 1000 characters.', ['attribute' => $attribute]));
            return;
        }

        // Forbid control characters (ASCII 0-31 and 127)
        if (preg_match('/[\x00-\x1F\x7F]/', $trimmed)) {
            $fail(__('The :attribute contains invalid control characters.', ['attribute' => $attribute]));
            return;
        }

        // Forbid HTML tags and quotes to prevent markup injection
        if (preg_match('/[<>"\']/', $trimmed)) {
            $fail(__('The :attribute contains invalid characters or markup.', ['attribute' => $attribute]));
            return;
        }

        // Forbid dangerous pseudo-protocols (XSS / local file execution)
        if (preg_match('/^(?:javascript|data|vbscript|file|about):/i', $trimmed)) {
            $fail(__('The :attribute contains an unsafe protocol (e.g. javascript: or data:).', ['attribute' => $attribute]));
            return;
        }

        // Forbid protocol-relative URLs
        if (str_starts_with($trimmed, '//')) {
            $fail(__('Protocol-relative URLs are not permitted for :attribute.', ['attribute' => $attribute]));
            return;
        }

        // Allow safe relative paths for local media/storage
        if (preg_match('#^/(?:storage|media|images|videos)/[\w\-\./]+$#i', $trimmed)) {
            // Guard against directory traversal in relative paths
            if (str_contains($trimmed, '..')) {
                $fail(__('Directory traversal is not permitted in :attribute.', ['attribute' => $attribute]));
            }
            return;
        }

        // Validate absolute URL
        if (!filter_var($trimmed, FILTER_VALIDATE_URL)) {
            $fail(__('The :attribute must be a valid URL starting with https://, http://, or /storage/.', ['attribute' => $attribute]));
            return;
        }

        $scheme = strtolower((string) parse_url($trimmed, PHP_URL_SCHEME));
        if (!in_array($scheme, ['http', 'https'], true)) {
            $fail(__('The :attribute protocol must be http or https.', ['attribute' => $attribute]));
            return;
        }

        $host = parse_url($trimmed, PHP_URL_HOST);
        if (empty($host) || strlen($host) < 3) {
            $fail(__('The :attribute must contain a valid domain host.', ['attribute' => $attribute]));
            return;
        }
    }
}
