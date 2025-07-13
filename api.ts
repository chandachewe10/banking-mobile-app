// api.ts
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Explicitly set platform for API calls
const currentPlatform = Platform.OS || 'web';
const runtimeVersion = Constants.manifest?.runtimeVersion || '1.0.0';
const channelName = Constants.manifest?.updates?.channel || 'default';

export const API_BASE = 'http://127.0.0.1:8050';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

// Helper function to add required Expo headers
const addExpoHeaders = (headers = {}) => {
  return {
    ...headers,
    'Accept': 'application/json',
    'expo-platform': currentPlatform,
    'expo-runtime-version': runtimeVersion,
    'expo-channel-name': channelName,
  };
};

export async function register(email: string, mobile: string): Promise<ApiResponse> {
  console.log(`Registering user with email: ${email}, mobile: ${mobile}, platform: ${currentPlatform}`);
  
   const formData = new FormData();
   formData.append('email', email || '');
   formData.append('phone', mobile || '');
  try {
    // fetch a call to the web application
    const response = await fetch(`${API_BASE}/api/register`, {
      method: 'POST',
      headers: addExpoHeaders(),
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Registration failed');
  
    return {
      success: true,
      message: 'OTP sent successfully',
      data: data
    };
  } catch (error) { 
    console.error('Registration error:', error);
    return {
      success: false,
      message: error.message || 'Failed to register user'
    };
  }
}


export async function verifyOtp(otp: string, email?: string, token?:string): Promise<ApiResponse> {
  
  console.log(`Verifying OTP: ${otp} for user: ${email}, platform: ${currentPlatform}`);
   const formData = new FormData();
   formData.append('otp_code', otp);
   formData.append('email', email || '');
  try {
    // fetch a call to the web application
   const response = await fetch(`${API_BASE}/api/verifyOtp`, {
  method: 'POST',
  headers: {
    ...addExpoHeaders(),
    'Authorization': `Bearer ${token}`,
   
  },
  body: formData,
});
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'OTP verification failed');
    return data;
    
    
  } catch (error) {
    console.error('OTP verification error:', error);
    return {
      success: false,
      message: error.message || 'Failed to verify OTP'
    };
  }
}



export async function personalDetails(biodata: any, token: string): Promise<ApiResponse> {
  console.log(`Saving user with data: ${biodata}, token: ${token}, platform: ${currentPlatform}`);
  const formData = new FormData();
  Object.keys(biodata).forEach(key => {
    formData.append(key, biodata[key] || '');
  });
  
  try {
    // fetch a call to the web application
    const response = await fetch(`${API_BASE}/api/personalDetails`, {
      method: 'POST',
      headers: {
    ...addExpoHeaders(),
    'Authorization': `Bearer ${token}`,
   
  },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Saving personal details failed');
  
    return {
      success: true,
      message: 'Personal details saved successfully',
      data: data
    };
  } catch (error) { 
    console.error('Personal Details error:', error);
    return {
      success: false,
      message: error.message || 'Failed to add personal details'
    };
  }
}


export async function submitKyc(payload: any): Promise<ApiResponse> {
  console.log(`Submitting KYC data, platform: ${currentPlatform}`);
  
  try {
    // In a real app, this would be a fetch call to your API
    // const response = await fetch(`${API_BASE}/kyc/submit`, {
    //   method: 'POST',
    //   headers: addExpoHeaders(),
    //   body: JSON.stringify(payload),
    // });
    // const data = await response.json();
    // if (!response.ok) throw new Error(data.message || 'KYC submission failed');
    // return data;
    
    // For demo purposes, simulate a successful response
    return {
      success: true,
      message: 'KYC data submitted successfully',
      data: { 
        ...payload,
        id: 'kyc-' + Date.now(),
        referenceNumber: 'KYC-' + Math.floor(100000 + Math.random() * 900000)
      }
    };
  } catch (error) {
    console.error('KYC submission error:', error);
    return {
      success: false,
      message: error.message || 'Failed to submit KYC data'
    };
  }
}