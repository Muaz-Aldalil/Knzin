/**
 * Navigation Progress Bar Utilities & Invariants
 * Pure helper functions for internal link detection, RTL/LTR transform mapping, and trickling math.
 */

export interface ShouldTriggerNavigationOptions {
  currentUrl: URL;
  targetHref: string;
  isModifiedEvent: boolean;
  button: number;
  defaultPrevented: boolean;
  targetAttr?: string | null;
  downloadAttr?: boolean;
  relAttr?: string | null;
}

/**
 * Normalizes a pathname by separating supported locale prefix (/ar, /en) from the logical route path.
 */
export function normalizePathname(pathname: string): { locale: string | null; logicalPath: string } {
  const normalized = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  const match = normalized.match(/^\/(ar|en)(\/.*)?$/);
  if (match) {
    const rawLogical = match[2] || '/';
    return {
      locale: match[1],
      logicalPath: rawLogical.endsWith('/') && rawLogical.length > 1 ? rawLogical.slice(0, -1) : rawLogical,
    };
  }
  return {
    locale: null,
    logicalPath: normalized === '' ? '/' : normalized,
  };
}

/**
 * Determines whether a click interaction constitutes a valid internal client-side navigation.
 */
export function shouldTriggerNavigation({
  currentUrl,
  targetHref,
  isModifiedEvent,
  button,
  defaultPrevented,
  targetAttr,
  downloadAttr,
  relAttr,
}: ShouldTriggerNavigationOptions): boolean {
  // If user modified click (Ctrl/Cmd/Shift/Alt) or not primary left button
  if (isModifiedEvent || button !== 0 || defaultPrevented) {
    return false;
  }

  // If opening in new tab/window
  if (targetAttr && targetAttr !== '_self') {
    return false;
  }

  // If download link
  if (downloadAttr) {
    return false;
  }

  // If rel specifies external
  if (relAttr && relAttr.includes('external')) {
    return false;
  }

  // If non-http/empty protocols (mailto, tel, javascript, hash-only without href)
  if (
    !targetHref ||
    targetHref.startsWith('mailto:') ||
    targetHref.startsWith('tel:') ||
    targetHref.startsWith('javascript:')
  ) {
    return false;
  }

  try {
    const parsedTarget = new URL(targetHref, currentUrl.href);

    // Reject external origins
    if (parsedTarget.origin !== currentUrl.origin) {
      return false;
    }

    const currentNorm = normalizePathname(currentUrl.pathname);
    const targetNorm = normalizePathname(parsedTarget.pathname);

    // If target does not explicitly declare a locale, it inherits currentUrl's locale
    const effectiveTargetLocale = targetNorm.locale ?? currentNorm.locale;
    const isSameLocale = effectiveTargetLocale === currentNorm.locale;
    const isSameLogicalPath = targetNorm.logicalPath === currentNorm.logicalPath;
    const isSameSearch = parsedTarget.search === currentUrl.search;

    // Reject hash-only changes on current logical route and locale (Section 10 & 14)
    if (
      isSameLocale &&
      isSameLogicalPath &&
      isSameSearch &&
      parsedTarget.hash !== currentUrl.hash
    ) {
      return false;
    }

    // Reject same-page re-clicks (no path, locale, or search change, and no hash change)
    if (
      isSameLocale &&
      isSameLogicalPath &&
      isSameSearch &&
      !parsedTarget.hash
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Returns the CSS transform origin based on the active locale/direction.
 * LTR (en): 'left' (progress originates from left and expands towards right)
 * RTL (ar): 'right' (progress originates from right and expands towards left)
 */
export function getTransformOrigin(locale: string, isRtlDir = false): 'right' | 'left' {
  if (locale === 'ar' || isRtlDir) {
    return 'right';
  }
  return 'left';
}

/**
 * Calculates next trickling progress value.
 * Diminishing returns ensures progress never stalls while never claiming 100% prematurely.
 */
export function getNextTrickleProgress(current: number, randomFactor = 0): number {
  const maxCap = 0.92;
  if (current >= maxCap) {
    return current;
  }

  let increment = 0;
  if (current < 0.4) {
    increment = 0.08 + randomFactor * 0.03;
  } else if (current < 0.7) {
    increment = 0.03 + randomFactor * 0.02;
  } else if (current < 0.85) {
    increment = 0.015 + randomFactor * 0.01;
  } else {
    increment = 0.005;
  }

  return Math.min(Number((current + increment).toFixed(4)), maxCap);
}
