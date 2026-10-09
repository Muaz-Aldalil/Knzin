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

/**
 * Strictly verifies whether a URL or storage path is safe to render in <img>, <video>, <a>, or <iframe>.
 * Allowed:
 *  - http:// or https:// with a valid hostname
 *  - Relative paths starting with single '/' (e.g. /storage/courses/...)
 * Forbidden:
 *  - javascript:, data:, vbscript:, file:, blob:, about:
 *  - Protocol-relative URLs ('//...')
 *  - Embedded control characters, newlines, HTML tags, or unescaped quotes
 */
export function isSafeMediaUrl(raw: string | null | undefined): boolean {
  if (typeof raw !== 'string') return false;
  const trimmed = raw.trim();
  if (!trimmed) return true; // Empty string is allowed (cleared/unset)

  // Forbid control characters, HTML tags, quotes, or whitespace inside URL
  if (/[\u0000-\u001f\u007f<>"'\s]/.test(trimmed)) {
    return false;
  }

  // Reject dangerous pseudo-protocols
  if (/^(?:javascript|data|vbscript|file|about):/i.test(trimmed)) {
    return false;
  }

  // Reject protocol-relative URLs (e.g. //attacker.com)
  if (trimmed.startsWith('//')) {
    return false;
  }

  // Allow safe relative paths (e.g., /storage/...)
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('://')) {
    // Guard against directory traversal
    if (trimmed.includes('..')) {
      return false;
    }
    return true;
  }

  // Verify absolute HTTP / HTTPS URL
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    return Boolean(parsed.hostname && parsed.hostname.length >= 3);
  } catch {
    return false;
  }
}

/**
 * Sanitizes a media URL (image, video, PDF) returning a clean URL or empty fallback if unsafe.
 */
export function sanitizeMediaUrl(raw: string | null | undefined, fallback = ''): string {
  if (typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  if (!trimmed) return fallback;

  return isSafeMediaUrl(trimmed) ? trimmed : fallback;
}

/**
 * Validates a user-input media URL and returns localized diagnostic messages for admin UI feedback.
 */
export function validateMediaUrlInput(raw: string, isAr = false): { isValid: boolean; error: string | null; cleanUrl: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { isValid: true, error: null, cleanUrl: '' };
  }

  // Check for dangerous protocols
  if (/^(?:javascript|data|vbscript|file|about):/i.test(trimmed)) {
    return {
      isValid: false,
      error: isAr
        ? 'تم اكتشاف بروتوكول غير آمن (مثل javascript: أو data:). يُسمح فقط بروابط https:// أو مسار التخزين /storage/'
        : 'Unsafe protocol detected (e.g. javascript: or data:). Only https:// or /storage/ links are permitted.',
      cleanUrl: '',
    };
  }

  // Check for tags, quotes, whitespace
  if (/[\u0000-\u001f\u007f<>"'\s]/.test(trimmed)) {
    return {
      isValid: false,
      error: isAr
        ? 'الرابط يحتوي على مسافات أو رموز غير صالحة أو وسم HTML.'
        : 'URL contains whitespace, HTML markup, or invalid characters.',
      cleanUrl: '',
    };
  }

  // Check for protocol-relative
  if (trimmed.startsWith('//')) {
    return {
      isValid: false,
      error: isAr
        ? 'الروابط النسبية للبروتوكول غير مدعومة. يرجى استخدام https://'
        : 'Protocol-relative URLs are not allowed. Please use https://',
      cleanUrl: '',
    };
  }

  // If starts with /, ensure it's a valid relative path without directory traversal
  if (trimmed.startsWith('/')) {
    if (trimmed.includes('://') || trimmed.includes('..')) {
      return {
        isValid: false,
        error: isAr ? 'صيغة مسار محلي غير صالحة.' : 'Invalid local path format.',
        cleanUrl: '',
      };
    }
    return { isValid: true, error: null, cleanUrl: trimmed };
  }

  // Try parsing absolute URL
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        isValid: false,
        error: isAr
          ? `البروتوكول "${parsed.protocol}" غير مسموح به. يُسمح فقط بـ https:// أو http://`
          : `Protocol "${parsed.protocol}" is not allowed. Only https:// or http:// are permitted.`,
        cleanUrl: '',
      };
    }

    if (!parsed.hostname || parsed.hostname.length < 3) {
      return {
        isValid: false,
        error: isAr ? 'اسم النطاق في الرابط غير صالح.' : 'Invalid domain name in URL.',
        cleanUrl: '',
      };
    }

    return { isValid: true, error: null, cleanUrl: trimmed };
  } catch {
    return {
      isValid: false,
      error: isAr
        ? 'صيغة الرابط غير صحيحة. يجب أن يبدأ بـ https:// أو مسار التخزين /storage/'
        : 'Invalid URL format. Must start with https:// or /storage/ path.',
      cleanUrl: '',
    };
  }
}
