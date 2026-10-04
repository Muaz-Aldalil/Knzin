/**
 * Post-login destination resolution.
 *
 * Pure and framework-free so the safety rules are unit-testable. The admin flag passed in
 * MUST come from the server (`/admin/me` succeeding with at least one capability); this
 * module never decides who is an admin, it only maps that fact to a destination.
 *
 * Returned paths are locale-free internal paths (the next-intl router adds the locale).
 */

export const USER_HOME = '/';
export const ADMIN_HOME = '/admin';

const LOCALE_PREFIX = /^\/(?:ar|en)(?=\/|$|\?|#)/;
const PROBE_ORIGIN = 'http://internal.invalid';
const MAX_LENGTH = 512;

/**
 * Accepts only same-origin, path-only redirect targets. Anything else (absolute URLs,
 * protocol-relative URLs, backslash tricks, control characters, auth pages that could loop)
 * yields `null`, meaning "no usable intended destination".
 */
export function sanitizeRedirectTarget(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null;

  const value = raw.trim();
  if (!value || value.length > MAX_LENGTH) return null;
  if (!value.startsWith('/') || value.startsWith('//')) return null;
  if (/[\u0000-\u001f\u007f\\]/.test(value)) return null;
  if (value.includes('://')) return null;

  let parsed: URL;
  try {
    parsed = new URL(value, PROBE_ORIGIN);
  } catch {
    return null;
  }
  if (parsed.origin !== PROBE_ORIGIN) return null;

  let path = parsed.pathname.replace(LOCALE_PREFIX, '');
  if (path === '') path = '/';

  if (path === '/auth' || path.startsWith('/auth/')) return null;
  // A bare "/" carries no intent: the role default should apply instead.
  if (path === '/' && !parsed.search && !parsed.hash) return null;

  return `${path}${parsed.search}${parsed.hash}`;
}

export function isAdminPath(path: string): boolean {
  return path === '/admin' || path.startsWith('/admin/') || path.startsWith('/admin?') || path.startsWith('/admin#');
}

export interface PostLoginInput {
  redirect: string | null | undefined;
  /** Server-confirmed administrative access. */
  isAdmin: boolean;
}

/**
 * - valid intended destination  -> that destination (admin pages only for admins)
 * - otherwise admin             -> Admin Dashboard
 * - otherwise normal user       -> normal landing/home
 */
export function resolvePostLoginDestination({ redirect, isAdmin }: PostLoginInput): string {
  const target = sanitizeRedirectTarget(redirect);

  if (target) {
    if (isAdminPath(target) && !isAdmin) return USER_HOME;
    return target;
  }

  return isAdmin ? ADMIN_HOME : USER_HOME;
}
