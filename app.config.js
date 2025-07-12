import 'dotenv/config';

export default {
  name: 'KYC Self-Onboarding',
  slug: 'kyc-self-onboarding',
  sdkVersion: '52.0.0',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.yourbank.kyc',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.yourbank.kyc',
  },
  web: {
    favicon: './assets/favicon.png',
  },
  extra: {
    eas: {
      projectId: 'your-project-id',
    },
  },
  runtimeVersion: {
    policy: 'sdkVersion',
  },
  updates: {
    fallbackToCacheTimeout: 0,
    url: 'https://u.expo.dev/your-project-id',
  },
  platforms: ['android', 'ios', 'web'],
};