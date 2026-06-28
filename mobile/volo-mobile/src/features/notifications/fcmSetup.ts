import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { registerDeviceToken } from '@/api/deviceTokens';

/**
 * Request user permission for push notifications and register FCM token with the backend.
 */
export async function setupFcmNotifications(): Promise<string | null> {
  try {
    // 1. Request Permission
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log('[FCM] Push notifications permission denied.');
      return null;
    }

    // 2. Register with APNs for iOS if needed
    if (Platform.OS === 'ios') {
      await messaging().registerDeviceForRemoteMessages();
    }

    // 3. Get FCM Token
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      console.log('[FCM] Device Token:', fcmToken);
      // Register with the backend database
      await registerDeviceToken(fcmToken, Platform.OS === 'android' ? 'android' : 'ios');
      return fcmToken;
    }

    return null;
  } catch (error) {
    console.error('[FCM] Setup failed:', error);
    return null;
  }
}

/**
 * Set up token refresh listener to update server when Firebase refreshes the token.
 */
export function listenForFcmTokenRefresh() {
  return messaging().onTokenRefresh(async (newToken) => {
    try {
      console.log('[FCM] Token refreshed:', newToken);
      await registerDeviceToken(newToken, Platform.OS === 'android' ? 'android' : 'ios');
    } catch (err) {
      console.warn('[FCM] Failed to update refreshed token on server:', err);
    }
  });
}
