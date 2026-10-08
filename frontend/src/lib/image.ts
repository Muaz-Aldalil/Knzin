/**
 * Image normalization and validation utilities.
 */

/**
 * Normalizes an image URL input by extracting the direct image URL
 * if the user pasted a Google Images search redirect URL (e.g. google.com/imgres?imgurl=...).
 */
export function normalizeImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  try {
    if (trimmed.includes('google.') && trimmed.includes('/imgres')) {
      const parsed = new URL(trimmed);
      const directUrl = parsed.searchParams.get('imgurl');
      if (directUrl) {
        return decodeURIComponent(directUrl);
      }
    }
  } catch {
    // If URL parsing fails, return as-is
  }

  return trimmed;
}
