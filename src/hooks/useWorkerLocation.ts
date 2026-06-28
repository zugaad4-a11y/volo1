import { useState, useEffect } from 'react';

export function useWorkerLocation(workerId?: string) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!workerId) return;
    // Location polling / tracking logic placeholder
    setLocation({ lat: 12.9716, lng: 77.5946 });
  }, [workerId]);

  return location;
}
