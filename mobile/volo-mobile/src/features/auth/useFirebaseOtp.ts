import { useState } from 'react';
import auth from '@react-native-firebase/auth';

/**
 * Hook wrapping Firebase OTP send behaviors.
 */
export function useFirebaseOtp() {
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<any>(null);

  const sendOtp = async (phone: string) => {
    setLoading(true);
    try {
      const result = await auth().signInWithPhoneNumber(phone);
      setConfirmation(result);
      return result;
    } catch (error) {
      console.error('[Firebase OTP] Send error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { sendOtp, confirmation, loading };
}
