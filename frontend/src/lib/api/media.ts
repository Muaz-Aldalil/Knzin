import { apiClient } from '@/lib/api-client';

export interface UploadImageResponse {
  url: string;
  relative_url: string;
  filename: string;
}

/**
 * Uploads an image file from the admin device to the backend storage.
 */
export async function uploadAdminImage(
  file: File,
  folder: 'courses' | 'draws' | 'prizes' | 'general' = 'courses'
): Promise<UploadImageResponse> {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('folder', folder);

  const res = await apiClient<any>('/admin/media/upload-image', {
    method: 'POST',
    body: formData,
  });

  // Defensively handle unwrapped, nested, or wrapped payloads
  const resolved = res?.data?.url ? res.data : (res?.url ? res : res?.data);

  if (!resolved || !resolved.url) {
    throw new Error('Image uploaded successfully but server returned an invalid URL format.');
  }

  return {
    url: resolved.url,
    relative_url: resolved.relative_url || resolved.url,
    filename: resolved.filename || '',
  };
}
