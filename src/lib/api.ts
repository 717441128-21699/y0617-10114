import type { ApiResponse } from '../../shared/types';
import { getToken } from './auth';

const BASE_URL = '/api';

async function request<T>(
  method: string,
  endpoint: string,
  body?: unknown,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    method,
    headers,
  };

  if (body !== undefined && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}`;
      try {
        const errData = await response.json();
        if (errData?.error || errData?.message) {
          errorMsg = errData.error || errData.message;
        }
      } catch {
        // ignore parse error
      }
      return {
        success: false,
        error: errorMsg,
      };
    }

    if (response.status === 204) {
      return { success: true };
    }

    const data = await response.json() as ApiResponse<T>;
    if (typeof data === 'object' && data !== null && 'success' in data) {
      return data;
    }
    return {
      success: true,
      data: data as unknown as T,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

export const apiClient = {
  get<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return request<T>('GET', endpoint, undefined, options);
  },

  post<T>(endpoint: string, body?: unknown, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return request<T>('POST', endpoint, body, options);
  },

  put<T>(endpoint: string, body?: unknown, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return request<T>('PUT', endpoint, body, options);
  },

  patch<T>(endpoint: string, body?: unknown, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return request<T>('PATCH', endpoint, body, options);
  },

  delete<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return request<T>('DELETE', endpoint, undefined, options);
  },
};
