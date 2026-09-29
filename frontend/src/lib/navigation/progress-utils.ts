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

    // Reject hash-only changes on current page
    if (
      parsedTarget.pathname === currentUrl.pathname &&
      parsedTarget.search === currentUrl.search &&
      parsedTarget.hash !== currentUrl.hash
    ) {
      return false;
    }

    // Reject same-page re-clicks (no path/search change)
    if (
      parsedTarget.pathname === currentUrl.pathname &&
      parsedTarget.search === currentUrl.search &&
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
