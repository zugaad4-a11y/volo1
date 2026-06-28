import { apiGet, apiPost } from '@/api/client';
import { LoginResponse, MobileRefreshResponse, AuthUser } from '@volo/shared-types';

/**
 * Exchange a Firebase ID token for a VOLO JWT.
 * Called after successful Firebase OTP verification.
 */
export async function verifyFirebaseToken(
  idToken: string,
  role: 'customer' | 'worker',
  deviceName?: string
): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/api/auth/verify-firebase-token', {
    idToken,
    role,
    deviceName: deviceName ?? 'Mobile App',
  });
}

/**
 * Refresh access token using the stored refresh token.
 * Sends token in body (not cookie) for mobile compatibility.
 */
export async function mobileRefresh(refreshToken: string): Promise<MobileRefreshResponse> {
  return apiPost<MobileRefreshResponse>('/api/auth/mobile-refresh', { refreshToken });
}

/**
 * Validate current session and fetch user profile.
 */
export async function getMe(): Promise<AuthUser> {
  return apiGet<AuthUser>('/api/auth/me');
}
