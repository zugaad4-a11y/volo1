import { useMutation } from '@tanstack/react-query';
import { verifyFirebaseToken } from '@/api/auth';
import { useAuthStore } from './authStore';

/**
 * Hook wrapping ID token exchange with backend.
 */
export function useTokenExchange() {
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: async ({ idToken, role }: { idToken: string; role: 'customer' | 'worker' }) => {
      const data = await verifyFirebaseToken(idToken, role);
      await setAuth(data.token, data.refreshToken, data.user);
      return data;
    },
  });
}
