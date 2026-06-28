import { useEffect, useRef } from 'react';

/**
 * A custom hook to perform periodic polling.
 * Handles pausing when screen changes or components unmount.
 */
export function usePolling(
  callback: () => Promise<void> | void,
  delay: number | null,
  active: boolean = true
) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null || !active) return;

    const tick = async () => {
      await savedCallback.current();
    };

    // Run immediately on active change
    tick();

    const id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay, active]);
}
