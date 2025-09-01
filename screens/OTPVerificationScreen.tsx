import React, { useState, useEffect } from 'react';
import { verifyOtp } from '../api';
import { toast } from "sonner-native";
import { 
  SafeAreaView, 
  Text, 
  TextInput, 
  StyleSheet, 
  View,
  TouchableOpacity,
  ActivityIndicator,
  Platform
} from 'react-native';
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
  const { email, mobile, token } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);


  

  const handleVerify = async () => {
  const fullOtp = otpDigits.join('');
  if (fullOtp.length < 6) {
    toast.error('Please enter complete OTP');
    console.log('Please enter complete OTP');
    return;
  }

  setLoading(true);

  try {
    const response = await verifyOtp(fullOtp, email,token);

    if (response.success) {
      toast.success('OTP Verified successfully');
      console.log('OTP Verified:', response.data);
      navigation.navigate('Biodata', { email, mobile,token });
    } else {
      console.warn('OTP Verification failed:', response.message);
      toast.error(response.message || "OTP Verification failed");
    }
  } catch (err) {
    console.error('Error verifying OTP:', err);
    toast.error("An error occurred while verifying OTP");
  } finally {
    setLoading(false);
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.textColor }]}>Verify OTP</Text>
        <Text style={[styles.subtitle, { color: theme.textColor }]}>
          Enter the OTP sent to {email} and {mobile}
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
        </View>
        
        <Text style={styles.platformInfo}>
          Current Platform: {Platform.OS || 'unknown'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
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

});