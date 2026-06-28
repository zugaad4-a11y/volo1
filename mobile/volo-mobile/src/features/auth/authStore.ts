import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { AuthUser } from '@volo/shared-types';
import { SECURE_KEYS } from '@/api/client';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (token: string, refreshToken: string, user: AuthUser) => Promise<void>;
  clearAuth: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (token, refreshToken, user) => {
    await SecureStore.setItemAsync(SECURE_KEYS.TOKEN, token);
    await SecureStore.setItemAsync(SECURE_KEYS.REFRESH_TOKEN, refreshToken);
    await SecureStore.setItemAsync(SECURE_KEYS.USER, JSON.stringify(user));
    set({ token, refreshToken, user, isAuthenticated: true, isLoading: false });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync(SECURE_KEYS.TOKEN);
    await SecureStore.deleteItemAsync(SECURE_KEYS.REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(SECURE_KEYS.USER);
    set({ token: null, refreshToken: null, user: null, isAuthenticated: false, isLoading: false });
  },

  loadFromStorage: async () => {
    try {
      const [token, refreshToken, userStr] = await Promise.all([
        SecureStore.getItemAsync(SECURE_KEYS.TOKEN),
        SecureStore.getItemAsync(SECURE_KEYS.REFRESH_TOKEN),
        SecureStore.getItemAsync(SECURE_KEYS.USER),
      ]);
      if (token && refreshToken && userStr) {
        const user = JSON.parse(userStr) as AuthUser;
        set({ token, refreshToken, user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
