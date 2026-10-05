import { apiClient, ApiError } from '@/lib/api-client';
import { AdminCapability, AdminSession } from '@/types/admin';

/**
 * Asks the backend whether the current bearer token belongs to an administrator.
 *
 * The existing `/admin/me` endpoint (behind `admin.principal`) is the only authority:
 * 200 with capabilities => admin, 401/403 => not an admin. Any failure is treated as
 * "no admin access" so the UI fails closed; the backend still guards every admin route.
 */
export async function fetchAdminCapabilities(): Promise<AdminCapability[] | null> {
  try {
    const session = await apiClient<AdminSession>('/admin/me');
    const capabilities = session?.capabilities ?? [];
    return capabilities.length > 0 ? capabilities : null;
  } catch (error) {
    if (error instanceof ApiError) return null;
    return null;
  }
}

/**
 * Extends the active administrative session by refreshing the Sanctum token's lifetime.
 */
export async function extendAdminSession(): Promise<AdminSession> {
  return await apiClient<AdminSession>('/admin/session/extend', { method: 'POST' });
}
