import React, { useState, useEffect } from 'react';
import { toast } from "sonner-native";
import { 
  SafeAreaView, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator, 
  View,
  Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../theme';

export default function ConfirmationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
   const { email, token, caseNumber } = route.params;
  const theme = useTheme();
  const [submitting, setSubmitting] = useState(true);
  const [success, setSuccess] = useState(false);

  const handleFinish = () => navigation.navigate('Dashboard');

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  if (submitting) {
    return (
      <SafeAreaView style={styles.containerCentered}>
        <ActivityIndicator size="large" color={theme.primaryColor} />
        <Text style={{ marginTop: 20 }}>Submitting your application...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: theme.cardBackgroundColor }]}>
          <Text style={[styles.title, { color: theme.textColor }]}>
            {success ? 'Submission Successful' : 'Submission Failed'}
          </Text>
          
          <Text style={styles.subtitle}>
            {success 
              ? 'Thank you for completing your KYC process. Your application has been submitted successfully.'
              : 'There was an error submitting your application. Please try again later.'}
          </Text>
          
          {success && (
            <Text style={styles.referenceText}>
              Reference Number: KYC-{caseNumber}
            </Text>
          )}
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primaryColor }]}
            onPress={handleFinish}
          >
            <Text style={styles.buttonText}>Done</Text>
          </TouchableOpacity>
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
  containerCentered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  content: { 
    padding: 20,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: { 
    fontSize: 16, 
    marginBottom: 24, 
    textAlign: 'center',
    lineHeight: 22,
  },
  referenceText: {
    fontSize: 16,
    marginBottom: 24,
    fontWeight: '500',
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  platformInfo: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
    color: '#888',
  },
});