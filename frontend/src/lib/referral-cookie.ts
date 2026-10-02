/**
 * Referral Cookie Capture & Management Utility (Feature 006)
 * Preserves referral intent across a 30-day window with SameSite=Lax.
 */

export const REFERRAL_COOKIE_NAME = 'knzin_ref';
export const CAMPAIGN_COOKIE_NAME = 'knzin_campaign';
export const REFERRAL_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days = 2,592,000s

export interface ReferralContext {
  referralCode: string | null;
  campaignTag: string | null;
}

/**
 * Read active referral cookies in browser client.
 */
export function getReferralData(): ReferralContext {
  if (typeof document === 'undefined') {
    return { referralCode: null, campaignTag: null };
  }

  const cookies = document.cookie.split(';').reduce<Record<string, string>>((acc, pair) => {
    const [key, value] = pair.trim().split('=');
    if (key && value) {
      acc[key] = decodeURIComponent(value);
    }
    return acc;
  }, {});

  return {
    referralCode: cookies[REFERRAL_COOKIE_NAME] || null,
    campaignTag: cookies[CAMPAIGN_COOKIE_NAME] || null,
  };
}

/**
 * Set referral cookies in browser client.
 */
export function setReferralCookies(referralCode: string, campaignTag?: string | null): void {
  if (typeof document === 'undefined') return;

  const trimmedCode = referralCode.trim();
  if (!trimmedCode) return;

  const cookieBase = `max-age=${REFERRAL_COOKIE_MAX_AGE_SECONDS}; path=/; samesite=lax`;
  document.cookie = `${REFERRAL_COOKIE_NAME}=${encodeURIComponent(trimmedCode)}; ${cookieBase}`;

  if (campaignTag && campaignTag.trim()) {
    document.cookie = `${CAMPAIGN_COOKIE_NAME}=${encodeURIComponent(campaignTag.trim())}; ${cookieBase}`;
  }
}

/**
 * Automatically inspect window location query parameters and capture referral cookies.
 */
export function captureReferralFromUrl(): void {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  const campaign = params.get('campaign');

  if (ref) {
    setReferralCookies(ref, campaign);
  }
}
