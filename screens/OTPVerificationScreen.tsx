import React, { useState, useEffect } from 'react';
import { verifyOtp, resendOtp, applicationStatus } from '../api';
import Toast from 'react-native-toast-message';
import { 
  Text, 
  TextInput, 
  StyleSheet, 
  View,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../theme';

export default function OTPVerificationScreen() {

const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
const inputs = Array(6)
  .fill(null)
  .map(() => React.createRef<TextInput>());
   const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();
  const { email, mobile, token, flow } = route.params as {
    email: string; mobile: string; token: string; flow?: 'signup' | 'login' | 'resume';
  };
  const isLoginFlow = flow === 'login';
  const isResumeFlow = flow === 'resume';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);


  

  /** Resume flow: route to the correct KYC step based on backend progress */
  const resumeToStep = async (verifiedToken: string) => {
    setResumeLoading(true);
    try {
      const statusRes = await applicationStatus(verifiedToken);
      const step: string = statusRes.data?.step ?? 'biodata';

      const stepRoutes: Record<string, () => void> = {
        biodata:      () => (navigation as any).navigate('Biodata',        { email, mobile, token: verifiedToken }),
        documents:    () => (navigation as any).navigate('DocumentUpload', { email, token: verifiedToken }),
        loan_details: () => (navigation as any).navigate('LoanDetails',    { email, token: verifiedToken }),
        completed:    () => (navigation as any).reset({
          index: 0,
          routes: [{ name: 'CustomerDashboard', params: { email, mobile, token: verifiedToken } }],
        }),
      };

      const friendlyStep: Record<string, string> = {
        biodata:      'Personal Details',
        documents:    'Document Upload',
        loan_details: 'Loan Details',
        completed:    'your dashboard',
      };

      Toast.show({ type: 'success', text1: 'Welcome back!', text2: `Resuming at: ${friendlyStep[step] ?? step}` });
      (stepRoutes[step] ?? stepRoutes.biodata)();
    } catch {
      Toast.show({ type: 'error', text1: 'Could not load your progress. Starting from Personal Details.' });
      (navigation as any).navigate('Biodata', { email, mobile, token: verifiedToken });
    } finally {
      setResumeLoading(false);
    }
  };

  const handleVerify = async () => {
  const fullOtp = otpDigits.join('');
  if (fullOtp.length < 6) {
    Toast.show({ type: 'error', text1: 'Please enter all 6 digits of the OTP' });
    return;
  }

  setLoading(true);

  try {
    const response = await verifyOtp(fullOtp, email, token);

    if (response.success) {
      const verifiedToken = response.data?.token ?? token;

      if (isLoginFlow) {
        // Login — go to the personal dashboard to track loan status
        Toast.show({ type: 'success', text1: 'Welcome back!', text2: 'Loading your dashboard...' });
        (navigation as any).reset({
          index: 0,
          routes: [{ name: 'CustomerDashboard', params: { email, mobile, token: verifiedToken } }],
        });
      } else if (isResumeFlow) {
        // Resume — jump straight back to the step where the user left off
        await resumeToStep(verifiedToken);
      } else {
        // New user — always start at Biodata
        Toast.show({
          type: 'success',
          text1: 'OTP Verified',
          text2: 'Identity confirmed. Proceeding to your details.'
        });
        (navigation as any).navigate('Biodata', { email, mobile, token: verifiedToken });
      }
    } else {
      Toast.show({
        type: 'error',
        text1: 'Verification Failed',
        text2: response.message || 'The OTP you entered is incorrect or has expired.'
      });
    }
  } catch (err: any) {
    console.error('Error verifying OTP:', err);
    Toast.show({
      type: 'error',
      text1: 'Verification Failed',
      text2: err?.message || 'An error occurred while verifying OTP.'
    });
  } finally {
    setLoading(false);
  }
};

const handleResend = async () => {
  if (resendSeconds > 0 || resendLoading) {
    return;
  }

  setResendLoading(true);

  try {
    const response = await resendOtp(email, token);

    if (response.success) {
      Toast.show({
        type: 'success',
        text1: 'OTP Resent',
        text2: 'A new OTP has been sent to your email and phone.'
      });
      setResendSeconds(60);
    } else {
      Toast.show({
        type: 'error',
        text1: 'Resend Failed',
        text2: response.message || 'Unable to resend OTP. Please try again.'
      });
    }
  } catch (err: any) {
    console.error('Error resending OTP:', err);
    Toast.show({
      type: 'error',
      text1: 'Resend Failed',
      text2: err?.message || 'An error occurred while resending OTP.'
    });
  } finally {
    setResendLoading(false);
  }
};

useEffect(() => {
  if (resendSeconds === 0) {
    return;
  }

  const interval = setInterval(() => {
    setResendSeconds(prev => (prev > 0 ? prev - 1 : 0));
  }, 1000);

  return () => clearInterval(interval);
}, [resendSeconds]);

  if (resumeLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.resumeOverlay}>
          <ActivityIndicator size="large" color={theme.primaryColor} />
          <Text style={[styles.resumeText, { color: theme.textColor }]}>
            Loading your progress...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={[styles.title, { color: theme.textColor }]}>Verify OTP</Text>
        <Text style={[styles.subtitle, { color: theme.textColor }]}>
          {isResumeFlow
            ? `Enter the OTP sent to ${email} to resume your application`
            : `Enter the OTP sent to ${email} and ${mobile}`}
        </Text>
        <Text style={[styles.hint, { color: theme.textColor }]}>
          You can resend the OTP after 60 seconds.
        </Text>
        
        <View style={styles.form}>
          <Text style={styles.label}>OTP</Text>
<View style={styles.otpContainer}>
  {otpDigits.map((digit, index) => (
    <TextInput
      key={index}
      ref={inputs[index]}
      value={digit}
      keyboardType="number-pad"
      maxLength={1}
      style={[styles.otpBox, { borderColor: theme.borderColor }]}
     onChangeText={(text) => {
     if (/^\d+$/.test(text) && text.length === 6) {
    // user pasted entire code
    const newDigits = text.split('');
    setOtpDigits(newDigits.slice(0, 6));
    inputs[5].current?.focus();
    return;
  }

  const newDigits = [...otpDigits];
  newDigits[index] = text;
  setOtpDigits(newDigits);

  if (text && index < 5) {
    inputs[index + 1].current?.focus();
  }
}}

      onKeyPress={({ nativeEvent }) => {
        if (
          nativeEvent.key === 'Backspace' &&
          otpDigits[index] === '' &&
          index > 0
        ) {
          inputs[index - 1].current?.focus();
        }
      }}
    />
  ))}
</View>

          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primaryColor }]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.resendButton,
              { borderColor: theme.borderColor, opacity: resendSeconds === 0 && !resendLoading ? 1 : 0.6 }
            ]}
            onPress={handleResend}
            disabled={resendSeconds > 0 || resendLoading}
          >
            {resendLoading ? (
              <ActivityIndicator color={theme.primaryColor} />
            ) : (
              <Text style={[styles.resendButtonText, { color: theme.primaryColor }]}>
                {resendSeconds > 0 ? `Resend OTP in ${resendSeconds}s` : 'Resend OTP'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
        
        <Text style={styles.platformInfo}>
          Current Platform: {Platform.OS || 'unknown'}
        </Text>
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
    marginBottom: 10,
  },
  hint: {
    fontSize: 13,
    marginBottom: 20,
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
  otpContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginVertical: 20,
},
otpBox: {
  width: 45,
  height: 50,
  borderWidth: 1,
  borderRadius: 8,
  textAlign: 'center',
  fontSize: 18,
},
  resendButton: {
    height: 45,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resumeOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  resumeText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
  },
});