/**
 * KNZiN API Client
 * Standardized client handling JSend envelopes (success, fail, error),
 * Sanctum Bearer tokens, and base configuration.
 */

export interface JSendSuccess<T = any> {
  status: 'success';
  data: T;
}

export interface JSendFail {
  status: 'fail';
  code: string;
  message: string;
  errors?: Record<string, string[]>;
}

export interface JSendError {
  status: 'error';
  code?: string;
  message: string;
}

export type JSendResponse<T = any> = JSendSuccess<T> | JSendFail | JSendError;

export class ApiError extends Error {
  public code: string;
  public httpStatus: number;
  public errors?: Record<string, string[]>;
  public data?: any;

  constructor(message: string, code = 'ERR_UNKNOWN', httpStatus = 400, errors?: Record<string, string[]>, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.errors = errors;
    this.data = data;
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('knzin_auth_token') : null;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  if (!isJson) {
    if (!response.ok) {
      throw new ApiError(`HTTP Error ${response.status}`, 'ERR_HTTP', response.status);
    }
    return {} as T;
  }

  const data: JSendResponse<T> = await response.json();

  if (data.status === 'fail') {
    throw new ApiError(
      data.message,
      data.code,
      response.status,
      data.errors,
      (data as any).pricing || (data as any).data
    );
  }

  if (data.status === 'error') {
    throw new ApiError(data.message, data.code || 'ERR_INTERNAL_SERVER', response.status);
  }

  if (!response.ok) {
    throw new ApiError(
      (data as any)?.message || `HTTP Error ${response.status}`,
      (data as any)?.code || 'ERR_HTTP',
      response.status
    );
  }

  return data.data;
}
