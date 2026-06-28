import { useAuthStore } from '@/features/auth/authStore';

export function useAuth() {
  const { user, token, isAuthenticated, isLoading, clearAuth, setAuth } = useAuthStore();

  return {
    user,
    token,
    role: user?.role ?? null,
    userId: user?.id ?? null,
    isAuthenticated,
    isLoading,
    logout: clearAuth,
    setAuth,
  };
}
