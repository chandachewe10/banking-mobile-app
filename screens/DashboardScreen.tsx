import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const theme = useTheme();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.header, { backgroundColor: theme.primaryColor }]}>
          <Text style={styles.headerText}>Welcome to KYC Portal</Text>
          <Text style={styles.headerSubtext}>Complete your verification process</Text>
        </View>

        {/* New Application */}
        <View style={[styles.card, { backgroundColor: theme.cardBackgroundColor }]}>
          <Text style={[styles.cardTitle, { color: theme.textColor }]}>New Application</Text>
          <Text style={[styles.cardDescription, { color: theme.textColor }]}>
            First time here? Register and complete your KYC to access all banking services.
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primaryColor }]}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.buttonText}>Register &amp; Start KYC</Text>
          </TouchableOpacity>
        </View>

        {/* Returning User */}
        <View style={[styles.card, { backgroundColor: theme.cardBackgroundColor }]}>
          <Text style={[styles.cardTitle, { color: theme.textColor }]}>Returning User</Text>
          <Text style={[styles.cardDescription, { color: theme.textColor }]}>
            Already registered? Login with your mobile number to resume or reapply.
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.secondaryColor }]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.cardBackgroundColor }]}>
          <Text style={[styles.infoTitle, { color: theme.textColor }]}>What You'll Need</Text>
          <Text style={[styles.infoText, { color: theme.textColor }]}>
            • Valid government-issued NRC{'\n'}
            • Live selfie (camera capture required){'\n'}
            • GPS location enabled{'\n'}
            • Bank statement (PDF){'\n'}
            • Up to 3 months payslips (PDF){'\n'}
            • Bank account details
          </Text>
        </View>
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