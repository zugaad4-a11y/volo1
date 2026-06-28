import { apiPost } from '@/api/client';
import { LocationUpdatePayload } from '@volo/shared-types';

/** Send worker location update to the backend. */
export const pushWorkerLocation = (
  payload: LocationUpdatePayload
): Promise<{ success: boolean; activeBookingId?: string }> =>
  apiPost('/api/worker/location', payload);
