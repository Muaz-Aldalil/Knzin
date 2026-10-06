/**
 * Safe URL sanitization for CMS links, notification redirects, and dynamic action targets.
 * Defends against javascript:, data:, and vbscript: XSS vectors.
 */

export function sanitizeCtaUrl(raw: string | null | undefined, fallback = '#catalog'): string {
  if (typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  if (!trimmed) return fallback;

  // Forbid javascript:, data:, vbscript:, and control characters
  if (/^(?:javascript|data|vbscript):/i.test(trimmed) || /[\u0000-\u001f\u007f]/.test(trimmed)) {
    return fallback;
  }

  // Permit safe internal hashes, relative paths, or http/https URLs
  if (trimmed.startsWith('#') || trimmed.startsWith('/') || /^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return fallback;
}

/**
 * Ensures a relative navigation path is strictly same-origin and safe for Next.js router.push.
 */
export function sanitizeRelativePath(raw: string | null | undefined, fallback = '/'): string {
  if (typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  if (!trimmed) return fallback;

  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('://') && !/[\u0000-\u001f\u007f]/.test(trimmed)) {
    return trimmed;
  }

  return fallback;
}
