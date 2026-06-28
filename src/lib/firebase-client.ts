import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  initializeRecaptchaConfig,
  Auth
} from 'firebase/auth';

// ---------------------------------------------------------------------------
// 1. Firebase App + Auth initialization
// ---------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const firebaseAuth = getAuth(firebaseApp);

// Proactively initialize reCAPTCHA Enterprise config on client side to reduce latency and load assets early
if (typeof window !== 'undefined') {
  initializeRecaptchaConfig(firebaseAuth).catch((err) => {
    console.warn('[Firebase Auth] Failed to pre-initialize reCAPTCHA Enterprise config:', err);
  });
}

// Log config (non-sensitive fields only) for debugging
console.log('[Firebase] Initialized:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
});

export { firebaseApp, firebaseAuth };

// ---------------------------------------------------------------------------
// 2. RecaptchaManager - Singleton Lifecycle Manager
// ---------------------------------------------------------------------------
class RecaptchaManager {
  private static instance: RecaptchaVerifier | null = null;
  private static container: HTMLElement | null = null;

  public static getOrCreate(auth: Auth): RecaptchaVerifier {
    if (typeof window === 'undefined') {
      throw new Error('RecaptchaVerifier can only be created on the client side.');
    }

    // 1. Ensure container exists in DOM and is clean
    let container = document.getElementById('recaptcha-phone-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'recaptcha-phone-container';
      // Keep it positioned and hidden so reCAPTCHA can attach but doesn't disrupt UI
      container.style.cssText = 'position:fixed;bottom:0;right:0;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none;z-index:-999;';
      document.body.appendChild(container);
    }
    this.container = container;

    // 2. Return existing instance or create a new singleton instance
    if (!this.instance) {
      console.log('[Phone Auth] Instantiating RecaptchaVerifier singleton');
      this.instance = new RecaptchaVerifier(auth, container, {
        size: 'invisible',
        callback: () => {
          console.log('[Phone Auth] reCAPTCHA successfully solved');
        },
        'expired-callback': () => {
          console.log('[Phone Auth] reCAPTCHA token expired, resetting verifier');
          this.reset();
        }
      });
    }

    return this.instance;
  }

  public static reset(): void {
    if (this.instance) {
      try {
        this.instance.clear();
      } catch (err) {
        console.warn('[Phone Auth] Error clearing verifier:', err);
      }
      this.instance = null;
    }

    if (this.container) {
      try {
        this.container.remove();
      } catch (err) {
        console.warn('[Phone Auth] Error removing container:', err);
      }
      this.container = null;
    }
    console.log('[Phone Auth] RecaptchaVerifier singleton successfully reset');
  }
}

// ---------------------------------------------------------------------------
// 3. Phone OTP API — callers only need to call sendOtp(phone) and verifyOtp()
// ---------------------------------------------------------------------------

/**
 * Sends an OTP to the given phone number via Firebase Phone Auth.
 *
 * Handles the full RecaptchaVerifier lifecycle internally using the singleton manager:
 *   1. Obtains the singleton invisible verifier
 *   2. Proactively renders the verifier (attaching and loading recaptcha assets)
 *   3. Passes it to signInWithPhoneNumber
 *   4. Cleans up and resets the verifier state after success or failure to avoid stale tokens
 *
 * @param phone - E.164 formatted phone number (e.g. "+919876543210")
 * @returns ConfirmationResult to verify the OTP
 */
export async function sendOtp(phone: string): Promise<ConfirmationResult> {
  if (typeof window === 'undefined') {
    throw new Error('sendOtp can only be called on the client side.');
  }

  console.log('[Phone Auth] Initiating OTP send for:', phone);

  // Get/create the singleton verifier
  const verifier = RecaptchaManager.getOrCreate(firebaseAuth);

  try {
    // Proactively render the verifier to ensure the recaptcha widget is initialized
    console.log('[Phone Auth] Rendering reCAPTCHA widget');
    await verifier.render();

    // Call signInWithPhoneNumber using the rendered singleton verifier
    const confirmationResult = await signInWithPhoneNumber(firebaseAuth, phone, verifier);
    console.log('[Phone Auth] OTP sent successfully');

    // Reset verifier after success so next attempt starts fresh
    RecaptchaManager.reset();

    return confirmationResult;
  } catch (error: any) {
    console.error('[Phone Auth] OTP Error during send:', error?.code, error?.message);
    
    // Always reset verifier on failure so next attempt starts clean
    RecaptchaManager.reset();
    throw error;
  }
}

/**
 * Verifies the OTP code against the ConfirmationResult from sendOtp().
 *
 * @param confirmationResult - The result from sendOtp()
 * @param otp - The 6-digit OTP code entered by the user
 * @returns Firebase ID token string
 */
export async function verifyOtp(confirmationResult: ConfirmationResult, otp: string): Promise<string> {
  const result = await confirmationResult.confirm(otp);
  if (!result.user) {
    throw new Error('OTP verification failed — no user returned');
  }
  return result.user.getIdToken();
}

// ---------------------------------------------------------------------------
// 4. Legacy exports for backward compatibility
// ---------------------------------------------------------------------------
export function getOrCreateRecaptchaVerifier(): RecaptchaVerifier {
  return RecaptchaManager.getOrCreate(firebaseAuth);
}

export function cleanupRecaptchaVerifier(): void {
  RecaptchaManager.reset();
}
