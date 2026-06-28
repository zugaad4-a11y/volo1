import 'server-only';
import admin from 'firebase-admin';

// Guard against double initialization
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    // Fallback for development if exact cert credentials are not fully supplied yet
    admin.initializeApp({
      projectId: projectId || 'volohome-16448',
    });
  }
}

export const adminAuth = admin.auth();
export const adminMessaging = admin.messaging();

export async function verifyFirebaseToken(idToken: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return {
      uid: decodedToken.uid,
      phone_number: decodedToken.phone_number || '',
    };
  } catch (error) {
    throw new Error('FIREBASE_TOKEN_INVALID');
  }
}
