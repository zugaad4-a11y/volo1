import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/config';

export const SECURE_KEYS = {
  TOKEN: 'volo_token',
  REFRESH_TOKEN: 'volo_refresh_token',
  USER: 'volo_user',
} as const;

// ─── Axios Instance ──────────────────────────────────────────

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Request Interceptor: Attach Bearer Token ────────────────

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync(SECURE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: 401 → Refresh → Retry ────────────

let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

const processQueue = (token: string) => {
  pendingRequests.forEach((resolve) => resolve(token));
  pendingRequests = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve) => {
          pendingRequests.push((newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync(SECURE_KEYS.REFRESH_TOKEN);
        if (!refreshToken) throw new Error('No refresh token');

        const res = await axios.post(`${API_BASE_URL}/api/auth/mobile-refresh`, { refreshToken });
        const { token: newToken, refreshToken: newRefreshToken } = res.data;

        await SecureStore.setItemAsync(SECURE_KEYS.TOKEN, newToken);
        await SecureStore.setItemAsync(SECURE_KEYS.REFRESH_TOKEN, newRefreshToken);

        apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        processQueue(newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed — clear auth and signal logout
        await SecureStore.deleteItemAsync(SECURE_KEYS.TOKEN);
        await SecureStore.deleteItemAsync(SECURE_KEYS.REFRESH_TOKEN);
        await SecureStore.deleteItemAsync(SECURE_KEYS.USER);
        // Emit logout event consumed by auth store
        authEventEmitter.emit('logout');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Simple event emitter for auth events ───────────────────

type AuthEvent = 'logout';

class AuthEventEmitter {
  private listeners: Record<string, Array<() => void>> = {};

  on(event: AuthEvent, listener: () => void) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(listener);
    return () => this.off(event, listener);
  }

  off(event: AuthEvent, listener: () => void) {
    this.listeners[event] = (this.listeners[event] || []).filter((l) => l !== listener);
  }

  emit(event: AuthEvent) {
    (this.listeners[event] || []).forEach((l) => l());
  }
}

export const authEventEmitter = new AuthEventEmitter();

// ─── Typed API helper ────────────────────────────────────────

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await apiClient.get<T>(url, config);
  return res.data;
}

export async function apiPost<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await apiClient.post<T>(url, data, config);
  return res.data;
}

export async function apiPut<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await apiClient.put<T>(url, data, config);
  return res.data;
}

export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await apiClient.delete<T>(url, config);
  return res.data;
}

export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error ?? error.message ?? 'Network error';
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}
