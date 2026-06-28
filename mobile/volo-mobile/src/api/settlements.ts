import { apiGet } from '@/api/client';
import { SettlementsResponse, SettlementLedger } from '@volo/shared-types';

/** Get worker settlement history. */
export const getSettlements = (): Promise<SettlementsResponse> =>
  apiGet('/api/worker/settlements');

/** Get worker payouts list. */
export const getPayouts = (): Promise<any> =>
  apiGet('/api/worker/payouts');
