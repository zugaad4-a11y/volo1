import { Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { router } from 'expo-router';

/**
 * Handles incoming push notifications for foreground, background, and quit states.
 */
export function registerNotificationHandlers() {
  // 1. Foreground listener
  const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
    console.log('[FCM] Foreground notification received:', remoteMessage);

    const title = remoteMessage.notification?.title || 'Notification';
    const body = remoteMessage.notification?.body || '';

    // Show a native in-app alert since user is currently using the app
    Alert.alert(
      title,
      body,
      [
        {
          text: 'Close',
          style: 'cancel',
        },
        {
          text: 'View details',
          onPress: () => handleNotificationAction(remoteMessage.data),
        },
      ],
      { cancelable: true }
    );
  });

  // 2. Background click listener
  const unsubscribeBackgroundClick = messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('[FCM] App opened from background state:', remoteMessage);
    handleNotificationAction(remoteMessage.data);
  });

  // 3. Quit state click listener
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log('[FCM] App opened from quit state:', remoteMessage);
        handleNotificationAction(remoteMessage.data);
      }
    });

  return () => {
    unsubscribeForeground();
    unsubscribeBackgroundClick();
  };
}

/**
 * Parses notification data payload and routes the user to the correct screen.
 */
function handleNotificationAction(data: any) {
  if (!data) return;

  const { bookingId, role } = data;

  if (bookingId) {
    if (role === 'worker') {
      router.push(`/(worker)/jobs/${bookingId}`);
    } else {
      router.push(`/(customer)/bookings/${bookingId}`);
    }
  } else {
    // Fallback to inboxes
    if (role === 'worker') {
      router.push('/(worker)/notifications');
    } else {
      router.push('/(customer)/notifications');
    }
  }
}
