import type { ApiResponse, ApiError, PaginationParams, PaginationMeta } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Request configuration
interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  requiresAuth?: boolean;
}

// API Error class
export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Get auth token from storage
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const authState = localStorage.getItem('laboro-auth');
    if (authState) {
      const parsed = JSON.parse(authState);
      return parsed.state?.accessToken || null;
    }
  } catch {
    return null;
  }
  return null;
}

// Build URL with query parameters
function buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(`${API_BASE_URL}${endpoint}`, window.location.origin);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  
  return url.toString();
}

// Base fetch function
async function baseFetch<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const { params, requiresAuth = true, ...fetchConfig } = config;
  
  const url = buildUrl(endpoint, params);
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchConfig.headers,
  };
  
  if (requiresAuth) {
    const token = getAuthToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }
  
  const response = await fetch(url, {
    ...fetchConfig,
    headers,
  });
  
  // Handle non-OK responses
  if (!response.ok) {
    let errorData: ApiError;
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
      };
    }
    throw new APIError(
      errorData.code,
      errorData.message,
      response.status,
      errorData.details
    );
  }
  
  // Handle empty responses
  if (response.status === 204) {
    return undefined as T;
  }
  
  return response.json();
}

// API client methods
export const apiClient = {
  get: <T>(endpoint: string, config?: RequestConfig) =>
    baseFetch<T>(endpoint, { ...config, method: 'GET' }),
    
  post: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
    baseFetch<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  put: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
    baseFetch<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  patch: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
    baseFetch<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  delete: <T>(endpoint: string, config?: RequestConfig) =>
    baseFetch<T>(endpoint, { ...config, method: 'DELETE' }),
};

// Helper to build pagination params
export function buildPaginationParams(params: PaginationParams): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  
  if (params.page) result.page = params.page;
  if (params.perPage) result.per_page = params.perPage;
  if (params.sortBy) result.sort_by = params.sortBy;
  if (params.sortOrder) result.sort_order = params.sortOrder;
  
  return result;
}

export default apiClient;
