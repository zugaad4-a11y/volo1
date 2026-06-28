import { apiGet, apiPost, apiPut } from '@/api/client';
import {
  Booking,
  CreateBookingPayload,
  BookingListResponse,
  CreateBookingResponse,
  ServiceCategoryWithItems,
} from '@volo/shared-types';

/** Fetch active bookings for the logged-in customer. */
export const getActiveBookings = (): Promise<BookingListResponse> =>
  apiGet('/api/customer/bookings');

/** Fetch booking history for the logged-in customer. */
export const getBookingHistory = (): Promise<BookingListResponse> =>
  apiGet('/api/customer/booking-history');

/** Fetch a single booking by ID (includes worker lat/lng for tracking). */
export const getBookingById = (id: string): Promise<{ booking: Booking }> =>
  apiGet(`/api/customer/bookings/${id}`);

/** Create a new booking. */
export const createBooking = (payload: CreateBookingPayload): Promise<CreateBookingResponse> =>
  apiPost('/api/customer/bookings', payload);

/** Cancel a booking. */
export const cancelBooking = (id: string): Promise<{ success: boolean }> =>
  apiPut(`/api/customer/bookings/${id}`, { action: 'cancel' });

/** Fetch all active service categories + items. */
export const getServices = (): Promise<{ categories: ServiceCategoryWithItems[] }> =>
  apiGet('/api/customer/services');
