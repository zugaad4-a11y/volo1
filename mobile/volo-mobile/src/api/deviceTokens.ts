import { apiPost, apiDelete } from '@/api/client';

/** Register FCM device token with the backend. */
export const registerDeviceToken = (token: string, platform: 'android' | 'ios'): Promise<{ success: boolean }> =>
  apiPost('/api/device-tokens/register', { token, platform });

/** Remove FCM device token on logout. */
export const removeDeviceToken = (token: string): Promise<{ success: boolean }> =>
  apiDelete(`/api/device-tokens/remove?token=${encodeURIComponent(token)}`);
