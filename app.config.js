import 'dotenv/config';

export default {
  name: 'SENTINEL',
  slug: 'sentinel-loans-demo-self-onboarding',
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
    runtimeVersion: {
      policy: 'appVersion',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.yourbank.kyc',
    runtimeVersion: '1.0.0',
  },
  web: {
    favicon: './assets/favicon.png',
  },
  platforms: ['android', 'ios', 'web'],

  // updates: {
  //   url: 'https://u.expo.dev/df73b81c-d5f1-4a14-966c-08e5e541d4fa',
  // },

  extra: {
    eas: {
      projectId: 'df73b81c-d5f1-4a14-966c-08e5e541d4fa',
    },
  },
};
