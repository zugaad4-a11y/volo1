// Minimal configuration for Firebase Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging-compat.js');

// We need to initialize with the project credentials.
// For the SW, we typically inject these or build them in.
// Alternatively, passing URL parameters can work, but simplest is hardcoded fallback or URL param.
// Assuming URL search params or fallback (in production, use a bundler or precise config)

const firebaseConfig = {
  apiKey: new URL(location).searchParams.get('apiKey'),
  projectId: new URL(location).searchParams.get('projectId'),
  messagingSenderId: new URL(location).searchParams.get('messagingSenderId'),
  appId: new URL(location).searchParams.get('appId'),
};

// Fallback to avoid crashing if params are missing (some SW registrations don't append params easily)
// The service worker will still run, but FCM might fail initialization if these are strictly required.
if (firebaseConfig.projectId) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title || 'New Notification';
    const notificationOptions = {
      body: payload.notification.body,
      icon: '/favicon.ico',
      data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}
