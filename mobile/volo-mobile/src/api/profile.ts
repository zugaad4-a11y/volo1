import { apiGet, apiPut } from '@/api/client';
import { ProfileResponse } from '@volo/shared-types';

/** Get current user's profile. */
export const getProfile = (): Promise<ProfileResponse> =>
  apiGet('/api/customer/profile');

/** Get worker profile. */
export const getWorkerProfile = (): Promise<ProfileResponse> =>
  apiGet('/api/worker/profile');

/** Update customer profile. */
export const updateCustomerProfile = (data: {
  full_name?: string;
  email?: string;
  avatar_url?: string;
}): Promise<{ success: boolean }> => apiPut('/api/customer/profile', data);

/** Update worker profile. */
export const updateWorkerProfile = (data: {
  full_name?: string;
  email?: string;
  avatar_url?: string;
}): Promise<{ success: boolean }> => apiPut('/api/worker/profile', data);
