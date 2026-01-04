export const STORAGE_KEY_ACCESS = 'access_token';
export const STORAGE_KEY_REFRESH = 'refresh_token';

export function getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEY_ACCESS);
}

export function getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEY_REFRESH);
}

export function setTokens(access: string, refresh: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_ACCESS, access);
    localStorage.setItem(STORAGE_KEY_REFRESH, refresh);
}

export function clearTokens() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY_ACCESS);
    localStorage.removeItem(STORAGE_KEY_REFRESH);
}
