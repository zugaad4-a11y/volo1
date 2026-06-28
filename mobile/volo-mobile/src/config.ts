import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra as Record<string, string> | undefined;

/**
 * The base URL for all API requests.
 * Set via API_BASE_URL in the appropriate .env.* file.
 * Never hardcode URLs — they change per environment.
 */
export const API_BASE_URL: string = extra?.API_BASE_URL ?? 'http://YOUR_LOCAL_IP:3000';

export const APP_VARIANT: string = extra?.APP_VARIANT ?? 'development';

/**
 * Polling interval for customer tracking (ms).
 * Mirrors the web app's polling behavior.
 */
export const TRACKING_POLL_INTERVAL_MS = 10_000; // 10 seconds

/**
 * How often the worker sends location updates (ms).
 */
export const WORKER_LOCATION_PUSH_INTERVAL_MS = 10_000; // 10 seconds
