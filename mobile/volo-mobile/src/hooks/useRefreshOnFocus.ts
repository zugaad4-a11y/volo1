import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * Custom hook to run refetch queries when an Expo Router screen gains focus.
 */
export function useRefreshOnFocus<T>(refetch: () => Promise<T>) {
  const firstTimeRef = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (firstTimeRef.current) {
        firstTimeRef.current = false;
        return;
      }
      refetch();
    }, [refetch])
  );
}
