import React, { useState, useEffect } from 'react';
import { toast } from "sonner-native";
import {register} from '../api';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';

export default function SignUpScreen() {
  
  const navigation = useNavigation();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  

  const handleSubmit = async () =>  {
    if (!email || !mobile) {
      console.log('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    
try {
    const response = await register(email, mobile);

    if (response.success) {
      const token = response.data.data.token;
      setToken(token);

      toast.success(response.message || "Registration successful");
      console.log('Registration successfull:',response.data.data.token);

    navigation.navigate('OTPVerification', { email, mobile, token});
    } else {
      console.warn('registration failed:', response.message);
      toast.error(response.message || "Registration failed");

    }
  } catch (err) {
    console.error('Error verifying OTP:', err);
    const errorMessage = typeof err === 'object' && err !== null && 'message' in err ? (err as { message?: string }).message : undefined;
    toast.error(errorMessage || "An error occurred");

  } finally {
    setLoading(false);
  }

};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
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
  required: {
  color: 'red',
},
});