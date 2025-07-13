import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';

export default function SplashScreen() {
  const navigation = useNavigation();
  const theme = useTheme();
  const [currentPlatform, setCurrentPlatform] = useState('detecting...');

  useEffect(() => {
    // Explicitly detect platform
    const platform = Platform.OS || 'web';
    setCurrentPlatform(platform);
    console.log('Platform in SplashScreen:', platform);
    
    // Navigate after delay
    const timer = setTimeout(() => {
      navigation.navigate('SignUp'); //SignUp
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <View style={styles.logoContainer}>
        <View style={[styles.logoPlaceholder, { backgroundColor: theme.primaryColor }]}>
          <Text style={styles.logoText}>BANK</Text>
        </View>
        <Text style={[styles.appName, { color: theme.textColor }]}>
          KYC Self-Onboarding
        </Text>
        <Text style={[styles.platformText, { color: theme.secondaryColor }]}>
          Platform: {currentPlatform}
        </Text>
      </View>
      <ActivityIndicator size="large" color={theme.primaryColor} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  logoImage: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  platformText: {
    fontSize: 16,
    marginBottom: 30,
  },
  loader: {
    marginTop: 20,
  }
});