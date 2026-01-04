import { Token, ApiError } from './types';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../auth/authStore';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

// Internal flag to prevent infinite loops
const RETRY_FLAG = '__retried';

interface RequestOptions extends RequestInit {
    params?: Record<string, string | number | boolean | undefined>;
    [RETRY_FLAG]?: boolean;
}

// Helper imports replace local definitions

async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T | null> {
    const url = new URL(`${BASE_URL}${path}`);

    if (options.params) {
        Object.entries(options.params).forEach(([key, value]) => {
            if (value !== undefined) {
                url.searchParams.append(key, String(value));
            }
        });
    }

    const accessToken = getAccessToken();
    const headers = new Headers(options.headers);

    if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
    }

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    const config: RequestInit = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(url.toString(), config);

        // Handle 401 Refresh Logic
        if (response.status === 401) {
            if (options[RETRY_FLAG]) {
                // Already retried, give up
                clearTokens();
                throw { status: 401, message: 'Session expired' } as ApiError;
            }

            const refreshToken = getRefreshToken();
            if (!refreshToken) {
                clearTokens();
                throw { status: 401, message: 'Unauthorized' } as ApiError;
            }

            try {
                // Try to refresh
                const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token: refreshToken }),
                });

                if (!refreshResponse.ok) {
                    throw new Error('Refresh failed');
                }

                const data: Token = await refreshResponse.json();
                setTokens(data.access_token, data.refresh_token);

                // Retry original request
                return apiFetch<T>(path, { ...options, [RETRY_FLAG]: true });
            } catch (refreshError) {
                clearTokens();
                // Redirect to login handled by AuthProvider or page protection
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
                throw { status: 401, message: 'Session expired' } as ApiError;
            }
        }

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { detail: response.statusText };
            }
            throw {
                status: response.status,
                message: errorData.detail || errorData.message || 'API Error',
                details: errorData,
            } as ApiError;
        }

        if (response.status === 204) {
            return null;
        }

        return await response.json();
    } catch (error: any) {
        // If it's already an ApiError, rethrow
        if (error.status) throw error;
        // Network errors etc
        throw {
            status: 500,
            message: error.message || 'Network Error',
        } as ApiError;
    }
}

export const api = {
    get: <T>(path: string, params?: RequestOptions['params'], options?: RequestOptions) =>
        apiFetch<T>(path, { ...options, method: 'GET', params }),

    post: <T>(path: string, body?: any, options?: RequestOptions) =>
        apiFetch<T>(path, { ...options, method: 'POST', body: JSON.stringify(body) }),

    put: <T>(path: string, body?: any, options?: RequestOptions) =>
        apiFetch<T>(path, { ...options, method: 'PUT', body: JSON.stringify(body) }),

    patch: <T>(path: string, body?: any, options?: RequestOptions) =>
        apiFetch<T>(path, { ...options, method: 'PATCH', body: JSON.stringify(body) }),

    delete: <T>(path: string, options?: RequestOptions) =>
        apiFetch<T>(path, { ...options, method: 'DELETE' }),

    upload: <T>(path: string, body: FormData, options?: RequestOptions) =>
        apiFetch<T>(path, { ...options, method: 'POST', body }),
};
