import React, { useState } from 'react';
import Toast from 'react-native-toast-message';
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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { loginRequest } from '../api';

export default function LoginScreen() {
  const navigation = useNavigation();
  const theme = useTheme();
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);

  const validateMobile = (): boolean => {
    if (!mobile.trim()) {
      Toast.show({ type: 'error', text1: 'Mobile required', text2: 'Please enter your registered mobile number.' });
      return false;
    }
    // Accepts all current Zambian network prefixes: 095-097, 075-077, 055-057
    if (!/^0(9[5-7]|7[5-7]|5[5-7])\d{7}$/.test(mobile.trim())) {
      Toast.show({ type: 'error', text1: 'Invalid mobile number', text2: 'Enter a valid 10-digit Zambian number (e.g. 0971234567, 0771234567).' });
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateMobile()) return;
    setLoading(true);

    try {
      const response = await loginRequest(mobile.trim());

      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'OTP Sent',
          text2: 'An OTP has been sent to your registered email and phone.',
        });
        navigation.navigate('OTPVerification', {
          email: response.data?.email ?? '',
          mobile: mobile.trim(),
          token: response.data?.token ?? '',
          flow: 'login',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: response.message || 'Mobile number not found. Please register first.',
        });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: err?.message || 'An error occurred. Please try again.',
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
        <Text style={[styles.title, { color: theme.textColor }]}>Resume Application</Text>
        <Text style={[styles.subtitle, { color: theme.textColor }]}>
          Enter your registered mobile number. We'll send an OTP to verify your identity and take you back to where you left off.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Mobile Number <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="e.g. 0971234567"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
            maxLength={10}
            autoFocus
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primaryColor }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Send OTP</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.borderColor }]}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.primaryColor }]}>
              New user? Register here
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 16, marginBottom: 30, lineHeight: 22 },
  form: { marginBottom: 20 },
  label: { fontSize: 16, marginBottom: 8, color: '#444' },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: { fontSize: 15, fontWeight: '500' },
  required: { color: 'red' },
});
