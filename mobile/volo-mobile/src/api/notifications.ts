import { apiGet, apiPost } from '@/api/client';
import { NotificationsResponse } from '@volo/shared-types';

/** Get notifications for the current user. */
export const getNotifications = (): Promise<NotificationsResponse> =>
  apiGet('/api/users/notifications');

/** Mark a notification as read. */
export const markNotificationRead = (id: string): Promise<{ success: boolean }> =>
  apiPost(`/api/users/notifications/${id}/read`);

/** Mark all notifications as read. */
export const markAllRead = (): Promise<{ success: boolean }> =>
  apiPost('/api/users/notifications/read-all');
