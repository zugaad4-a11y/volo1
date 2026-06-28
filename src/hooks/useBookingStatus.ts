import { useState, useEffect } from 'react';
import { BookingStatus } from '@/types';

export function useBookingStatus(bookingId?: string) {
  const [status, setStatus] = useState<BookingStatus | null>(null);

  useEffect(() => {
    if (!bookingId) return;
    // Real-time listener logic placeholder
    setStatus(BookingStatus.PENDING_ASSIGNMENT);
  }, [bookingId]);

  return status;
}
