import { apiGet } from '@/api/client';
import { CustomerWallet, WalletResponse } from '@volo/shared-types';

/** Get customer wallet balance and transaction history. */
export const getCustomerWallet = (): Promise<WalletResponse> =>
  apiGet('/api/customer/wallet');

/** Get worker earnings summary and wallet. */
export const getWorkerEarnings = (): Promise<any> =>
  apiGet('/api/worker/earnings');
