'use client';

import { useEffect, useRef } from 'react';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { firebaseApp } from '@/lib/firebase-client';
import { usePathname } from 'next/navigation';

// Replace with your provided VAPID key
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'BJ3H5YP7RfvhxKE8gYYrugEIwhXc2Zen4Vg-mB-f8st8gASa2GUuAiiwBVB5ZqHdfAyqR2UsbjqUc_Lieu3Lvug';

export default function FCMProvider() {
  const pathname = usePathname();
  const registered = useRef(false);

  useEffect(() => {
    const initMessaging = async () => {
      try {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
        
        const supported = await isSupported();
        if (!supported) {
          console.log('[FCM] Firebase messaging is not supported in this browser.');
          return;
        }

        // Only register and prompt for notification permission on authenticated portal routes
        const isPortal = pathname?.startsWith('/customer') || pathname?.startsWith('/worker') || pathname?.startsWith('/admin');
        const isAuthPage = pathname?.includes('/login') || pathname?.includes('/verify') || pathname?.includes('/register');
        if (!isPortal || isAuthPage) {
          return;
        }

        // 1. Request Permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('[FCM] Notification permission not granted.');
          return;
        }

        const messaging = getMessaging(firebaseApp);

        // 2. Register Service Worker with dynamic config to avoid hardcoding in the SW file itself
        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'volohome-16448';
        const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '';
        const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '';

        const swUrl = `/firebase-messaging-sw.js?apiKey=${apiKey}&projectId=${projectId}&messagingSenderId=${messagingSenderId}&appId=${appId}`;
        const registration = await navigator.serviceWorker.register(swUrl);

        // Wait for the service worker to become active before getting FCM Token
        let activeWorker = registration.active;
        if (!activeWorker) {
          const installingOrWaitingWorker = registration.installing || registration.waiting;
          if (installingOrWaitingWorker) {
            await new Promise<void>((resolve) => {
              if (installingOrWaitingWorker.state === 'activated') {
                resolve();
              } else {
                const stateChangeHandler = () => {
                  if (installingOrWaitingWorker.state === 'activated') {
                    installingOrWaitingWorker.removeEventListener('statechange', stateChangeHandler);
                    resolve();
                  }
                };
                installingOrWaitingWorker.addEventListener('statechange', stateChangeHandler);
              }
            });
          }
        }

        // 3. Get FCM Token
        const currentToken = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration
        });

        if (currentToken && !registered.current) {
          // 4. Register Device to backend
          const res = await fetch('/api/device-tokens/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceToken: currentToken, platform: 'web', permissionStatus: permission })
          });

          if (res.ok) {
            console.log('[FCM] Device token securely registered with backend.');
            registered.current = true;
          }
        }

        // 5. Foreground Message Handler
        onMessage(messaging, (payload) => {
          console.log('[FCM] Foreground notification received:', payload);
          // In a real application, replace this with a beautiful toast notification library
          if (payload.notification) {
            // Fallback native notification if the browser supports it and it's allowed
            if (Notification.permission === 'granted') {
               new Notification(payload.notification.title || 'Notification', {
                 body: payload.notification.body,
                 icon: '/favicon.ico'
               });
            }
          }
        });

      } catch (error) {
        console.error('[FCM] Error initializing messaging:', error);
      }
    };

    // Delay initialization slightly to let critical auth operations finish on load
    const timeout = setTimeout(initMessaging, 2000);
    return () => clearTimeout(timeout);
  }, [pathname]); // Re-run on pathname change to catch post-login states

  return null; // This component renders nothing
}
