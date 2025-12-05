import { ApiError } from './types';

// Determine API base URL based on environment
function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // Check if running in GitHub Codespaces
    if (hostname.includes('app.github.dev')) {
      const url = new URL(window.location.href);
      url.port = '';
      const codespacesHostname = hostname.replace('-8080.', '-8000.');
      return `https://${codespacesHostname}/api`;
    }

    // Check if running on Render or any production domain (not localhost)
    if (hostname.includes('.onrender.com') || !hostname.includes('localhost')) {
      // In production, frontend and backend served from same origin
      return `${window.location.origin}/api`;
    }
  }

  // Default for local development
  return 'http://localhost:8000/api';
}

const API_BASE = getApiBaseUrl();

// Token management
export function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function setToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

export function clearToken(): void {
  localStorage.removeItem('auth_token');
}

// Generic request function with JWT header injection
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw { detail: error.detail || 'Request failed', status: response.status } as ApiError;
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// HTTP client with convenience methods
export const httpClient = {
  get: <T>(endpoint: string) => request<T>(endpoint),

  post: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data: unknown) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),

  // Token management exports
  getToken,
  setToken,
  clearToken,
};

export default httpClient;
