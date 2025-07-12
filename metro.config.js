// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Support .cjs modules (e.g., react-native-webview)
if (config.resolver && Array.isArray(config.resolver.sourceExts)) {
  config.resolver.sourceExts.push('cjs');
}

module.exports = config;