import React, { useState, useEffect } from 'react';
import Toast from 'react-native-toast-message';
import { register } from '../api';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';

export default function SignUpScreen() {

  const navigation = useNavigation();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');


  const validateForm = (): boolean => {
    if (!email.trim()) {
      Toast.show({ type: 'error', text1: 'Email is required', text2: 'Please enter your email address.' });
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Toast.show({ type: 'error', text1: 'Invalid email', text2: 'Please enter a valid email address.' });
      return false;
    }
    if (!mobile.trim()) {
      Toast.show({ type: 'error', text1: 'Mobile number is required', text2: 'Please enter your mobile number.' });
      return false;
    }
    // Accepts all current Zambian network prefixes: 095-097, 075-077, 055-057
    const mobileRegex = /^0(9[5-7]|7[5-7]|5[5-7])\d{7}$/;
    if (!mobileRegex.test(mobile.trim())) {
      Toast.show({ type: 'error', text1: 'Invalid mobile number', text2: 'Enter a valid 10-digit Zambian number (e.g. 0971234567, 0771234567).' });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await register(email.trim(), mobile.trim());

      if (response.success) {
        const token = response.data?.data?.token ?? response.data?.token;
        setToken(token);

        Toast.show({
          type: 'success',
          text1: 'OTP Sent',
          text2: response.message || 'Check your email and SMS for your OTP code.'
        });

        navigation.navigate('OTPVerification', { email: email.trim(), mobile: mobile.trim(), token, flow: 'signup' });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Registration Failed',
          text2: response.message || 'Something went wrong. Please try again.'
        });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: err?.message || 'An unexpected error occurred.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
      >
        <Text style={[styles.title, { color: theme.textColor }]}>Sign Up</Text>
        <Text style={[styles.subtitle, { color: theme.textColor }]}>
          Enter your details to continue
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Mobile Number <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="Enter your mobile number"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primaryColor }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Send OTP</Text>
            )}
          </TouchableOpacity>
        </View>


      </ScrollView>
      </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
  },
  form: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
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
  required: {
    color: 'red',
  },
});