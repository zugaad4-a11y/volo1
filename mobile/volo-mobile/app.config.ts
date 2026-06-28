import type { ExpoConfig, ConfigContext } from 'expo/config';
// @ts-ignore
import fs from 'fs';
// @ts-ignore
import path from 'path';

const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const getAppName = () => {
  if (IS_DEV) return 'VOLO (Dev)';
  if (IS_PREVIEW) return 'VOLO (Preview)';
  return 'VOLO';
};

const getBundleId = () => 'com.volohome.app';

// @ts-ignore
const hasGoogleServicesJson = fs.existsSync(path.resolve(__dirname, 'google-services.json'));
// @ts-ignore
const hasGoogleServicesPlist = fs.existsSync(path.resolve(__dirname, 'GoogleService-Info.plist'));

export default ({ config }: ConfigContext): any => ({
  ...config,
  name: getAppName(),
  slug: 'volo-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0F172A',
  },
  ios: {
    bundleIdentifier: getBundleId(),
    supportsTablet: false,
    googleServicesFile: './GoogleService-Info.plist',
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'VOLO needs your location to assign nearby workers and show your live position.',
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'VOLO uses your location in the background while you are actively on a job.',
      NSCameraUsageDescription: 'VOLO needs camera access to capture KYC documents.',
      NSPhotoLibraryUsageDescription: 'VOLO needs photo library access for profile and KYC photos.',
    },
  },
  android: {
    package: getBundleId(),
    googleServicesFile: './google-services.json',
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
      backgroundColor: '#0F172A',
    },
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'RECEIVE_BOOT_COMPLETED',
      'VIBRATE',
      'POST_NOTIFICATIONS',
    ],
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    '@react-native-firebase/app',
    '@react-native-firebase/auth',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'VOLO uses your location while you are on an active job.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'VOLO needs access to your photos for KYC and profile upload.',
        cameraPermission: 'VOLO needs camera access to capture KYC documents.',
      },
    ],
    'expo-secure-store',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    API_BASE_URL: process.env.API_BASE_URL,
    APP_VARIANT: process.env.APP_VARIANT,
    eas: {
      projectId: "62410664-b000-4546-9644-71be5e237081",
    },
  },
  scheme: 'volo',
});
