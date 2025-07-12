import React from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const theme = useTheme();

  const startKYC = () => {
    navigation.navigate('SignUp');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.header, { backgroundColor: theme.primaryColor }]}>
          <Text style={styles.headerText}>Welcome to KYC Portal</Text>
          <Text style={styles.headerSubtext}>Complete your verification process</Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBackgroundColor }]}>
          <Text style={[styles.cardTitle, { color: theme.textColor }]}>Start Your KYC Process</Text>
          <Text style={[styles.cardDescription, { color: theme.textColor }]}>
            Complete your Know Your Customer verification to access all banking services.
          </Text>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primaryColor }]}
            onPress={startKYC}
          >
            <Text style={styles.buttonText}>Start KYC</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.cardBackgroundColor }]}>
          <Text style={[styles.infoTitle, { color: theme.textColor }]}>What You'll Need</Text>
          <Text style={[styles.infoText, { color: theme.textColor }]}>
            • Valid government-issued ID{'\n'}
            • Recent selfie for verification{'\n'}
            • Basic personal information{'\n'}
            • Employment details
          </Text>
        </View>
        
        <Text style={styles.platformInfo}>
          Current Platform: {Platform.OS || 'unknown'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    padding: 30,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtext: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  card: {
    margin: 20,
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  platformInfo: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
    color: '#888',
  },
});