/**
 * Maps standard API errors or Javascript exceptions to user-friendly messages.
 */
export function getErrorMessage(error: any): string {
  if (typeof error === 'string') return error;

  const dataMsg = error?.response?.data?.error;
  if (dataMsg) {
    switch (dataMsg) {
      case 'FIREBASE_TOKEN_INVALID':
        return 'Authentication session invalid. Please log in again.';
      case 'UNAUTHORIZED_ROLE':
        return 'You are not authorized for this role.';
      case 'ACCOUNT_BLOCKED':
        return 'Your account is suspended. Contact support.';
      case 'KYC_REJECTED':
        return 'Your worker registration KYC was rejected.';
      case 'INVALID_PHONE':
        return 'The provided phone number is invalid.';
      default:
        return dataMsg;
    }
  }

  return error?.message ?? 'An unexpected error occurred. Please try again.';
}
