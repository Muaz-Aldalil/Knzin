/**
 * Generic Client-Side Form Draft Preservation for Admin Operations.
 *
 * When an administrative session expires, partial and unvalidated forms
 * must NEVER be auto-saved to the production database (to prevent data corruption
 * and invalid audit events). Instead, dirty form inputs are safely serialized
 * into browser sessionStorage so they can be restored upon re-authentication.
 */

export const ADMIN_DRAFT_PREFIX = 'knzin_admin_draft:';

export interface FormDraftSnapshot {
  savedAt: string;
  pathname: string;
  fields: Record<string, string>;
}

/**
 * Scans active input/textarea/select fields on the page and serializes their values.
 * Passwords, tokens, hidden fields, and read-only inputs are strictly excluded.
 */
export function saveCurrentPageDraft(pathname: string): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;

  const elements = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    'input:not([type="password"]):not([type="hidden"]):not([type="submit"]):not([type="button"]):not([disabled]), textarea:not([disabled]), select:not([disabled])'
  );

  const fields: Record<string, string> = {};
  let count = 0;

  elements.forEach((el, index) => {
    // Identifier priority: data-testid -> name -> id -> selector index
    const key = el.dataset.testid || el.name || el.id || `input_${index}`;
    const value = el.value?.trim();

    // Only record populated non-empty fields
    if (key && value !== undefined && value !== '') {
      fields[key] = el.value;
      count++;
    }
  });

  if (count === 0) return false;

  const snapshot: FormDraftSnapshot = {
    savedAt: new Date().toISOString(),
    pathname,
    fields,
  };

  try {
    sessionStorage.setItem(`${ADMIN_DRAFT_PREFIX}${pathname}`, JSON.stringify(snapshot));
    return true;
  } catch {
    return false;
  }
}

/**
 * Retrieves a stored form draft for the given route pathname.
 */
export function getStoredPageDraft(pathname: string): FormDraftSnapshot | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(`${ADMIN_DRAFT_PREFIX}${pathname}`);
    if (!raw) return null;
    return JSON.parse(raw) as FormDraftSnapshot;
  } catch {
    return null;
  }
}

/**
 * Clears the stored draft for a given route pathname.
 */
export function clearPageDraft(pathname: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(`${ADMIN_DRAFT_PREFIX}${pathname}`);
  } catch {
    // ignore storage errors
  }
}

/**
 * Applies saved draft field values back into matching DOM input elements.
 * Dispatches 'input' and 'change' events so React controlled state synchronizes.
 */
export function applyPageDraft(pathname: string): number {
  if (typeof window === 'undefined' || typeof document === 'undefined') return 0;

  const draft = getStoredPageDraft(pathname);
  if (!draft || !draft.fields) return 0;

  let restoredCount = 0;

  for (const [key, value] of Object.entries(draft.fields)) {
    // Attempt lookup by data-testid, name, or id
    const el =
      document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`[data-testid="${key}"]`) ||
      document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`[name="${key}"]`) ||
      (document.getElementById(key) as (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null));

    if (el && !el.disabled && el.type !== 'password' && el.type !== 'hidden') {
      el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      restoredCount++;
    }
  }

  // Once restored, clear draft
  clearPageDraft(pathname);
  return restoredCount;
}
