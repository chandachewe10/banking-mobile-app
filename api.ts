// api.ts
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Explicitly set platform for API calls
const currentPlatform = Platform.OS || 'web';
const runtimeVersion = Constants.manifest?.runtimeVersion || '1.0.0';
const channelName = Constants.manifest?.updates?.channel || 'default';

// Determine base URL based on Android version
export const API_BASE = (() => {
  const httpsBase = 'https://sentinel-loans.sentinel365.net';
  
  // For Android 7 and 8 (API levels 24-27), we may need to use HTTP
  if (Platform.OS === 'android' && Platform.Version && Platform.Version < 28) {
    console.warn('Using older Android version, HTTPS may have issues');
    // Try HTTPS first, but have fallback mechanism
    return httpsBase;
  }
  
  return httpsBase;
})();

// Fallback HTTP base URL for older Android versions
export const HTTP_API_BASE = 'http://sentinel-loans.sentinel365.net';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

// Helper function to add required Expo headers
const addExpoHeaders = (headers: Record<string, string> = {}) => {
  return {
    ...headers,
    'Accept': 'application/json',
    'expo-platform': currentPlatform,
    'expo-runtime-version': runtimeVersion,
    'expo-channel-name': channelName,
  };
};

// Enhanced fetch function with Android 7/8 compatibility
const compatibleFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  let response: Response;
  
  try {
    // First try with HTTPS
    response = await fetch(`${API_BASE}${url}`, options);
    
    // If request fails on older Android, try with HTTP fallback
    if (!response.ok && Platform.OS === 'android' && Platform.Version && Platform.Version < 28) {
      console.warn('HTTPS request failed, trying HTTP fallback for Android', Platform.Version);
      try {
        response = await fetch(`${HTTP_API_BASE}${url}`, options);
      } catch (fallbackError) {
        console.error('HTTP fallback also failed:', fallbackError);
        throw new Error(`Network request failed: `);
      }
    }
    
    return response;
  } catch (error) {
    // If HTTPS fails completely on older Android, try HTTP
    if (Platform.OS === 'android' && Platform.Version && Platform.Version < 28) {
      console.warn('HTTPS request failed, trying HTTP fallback for Android', Platform.Version);
      try {
        response = await fetch(`${HTTP_API_BASE}${url}`, options);
        return response;
      } catch (fallbackError) {
        console.error('HTTP fallback also failed:', fallbackError);
        throw new Error(`Network request failed: `);
      }
    }
    
    throw error;
  }
};

export async function register(email: string, mobile: string): Promise<ApiResponse> {
  console.log(`Registering user with email: ${email}, mobile: ${mobile}, platform: ${currentPlatform}`);
  
  const formData = new FormData();
  formData.append('email', email || '');
  formData.append('phone', mobile || '');
  
  try {
    const response = await compatibleFetch('/api/register', {
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
  } catch (error: any) { 
    console.error('Registration error:', error);
    return {
      success: false,
      message: error.message || 'Failed to register user'
    };
  }
}

export async function verifyOtp(otp: string, email?: string, token?: string): Promise<ApiResponse> {
  console.log(`Verifying OTP: ${otp} for user: ${email}, platform: ${currentPlatform}`);
  
  const formData = new FormData();
  formData.append('otp_code', otp);
  formData.append('email', email || '');
  
  try {
    const response = await compatibleFetch('/api/verifyOtp', {
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
  } catch (error: any) {
    console.error('OTP verification error:', error);
    return {
      success: false,
      message: error.message || 'Failed to verify OTP'
    };
  }
}

export async function personalDetails(biodata: any, token: string): Promise<ApiResponse> {
  console.log(`Saving user with data: ${JSON.stringify(biodata)}, platform: ${currentPlatform}`);
  
  const formData = new FormData();
  Object.keys(biodata).forEach(key => {
    formData.append(key, biodata[key] || '');
  });
  
  try {
    const response = await compatibleFetch('/api/personalDetails', {
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
  } catch (error: any) { 
    console.error('Personal Details error:', error);
    return {
      success: false,
      message: error.message || 'Failed to add personal details'
    };
  }
}

export async function documentsUpload(
  idFront: string, 
  idBack: string, 
  selfie: string, 
  bankStatement: string, 
  payslip: string, 
  email: string, 
  token: string
): Promise<ApiResponse> {
  console.log(`Saving Docs for user: ${email}, platform: ${currentPlatform}`);

  const formData = new FormData();
  formData.append('idFront', idFront);
  formData.append('idBack', idBack);
  formData.append('selfie', selfie);
  formData.append('bankStatement', bankStatement);
  formData.append('payslip', payslip);
  formData.append('email', email);

  try {
    const response = await compatibleFetch('/api/documents', {
      method: 'POST',
      headers: {
        ...addExpoHeaders(),
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Saving documents details failed');
  
    return {
      success: true,
      message: 'Files saved successfully',
      data: data
    };
  } catch (error: any) { 
    console.error('Files saving error:', error);
    return {
      success: false,
      message: error.message || 'Failed to save files'
    };
  }
}

export async function loanDetails(
  amount: string, 
  purpose: string, 
  interestRate: any, 
  tenure: string, 
  arrangementFee: string, 
  processingFee: string, 
  insuranceFee: string, 
  totalInterestFee: string, 
  email: string, 
  token: string
): Promise<ApiResponse> {
  console.log(`Saving loan details for user: ${email}, platform: ${currentPlatform}`);

  const formData = new FormData();
  formData.append('amount', amount);
  formData.append('purpose', purpose);
  formData.append('interestRate', interestRate);
  formData.append('tenure', tenure);
  formData.append('arrangementFee', arrangementFee);
  formData.append('processingFee', processingFee);
  formData.append('insuranceFee', insuranceFee);
  formData.append('totalInterestFee', totalInterestFee);
  formData.append('email', email);

  try {
    const response = await compatibleFetch('/api/loanDetails', {
      method: 'POST',
      headers: {
        ...addExpoHeaders(),
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Saving loan details failed');

    return {
      success: true,
      message: 'Loan details saved successfully',
      data: data
    };
  } catch (error: any) {
    console.error('Loan details saving error:', error);
    return {
      success: false,
      message: error.message || 'Failed to save loan details'
    };
  }
}

export async function signature(signatureUri: string, email: string, token: string): Promise<ApiResponse> {
  console.log(`Saving signature URI: ${signatureUri}`);

  const formData = new FormData();
  formData.append('signatureUri', signatureUri);
  formData.append('email', email);

  try {
    const response = await compatibleFetch('/api/signature', {
      method: 'POST',
      headers: {
        ...addExpoHeaders(),
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Saving signature URI failed');

    return {
      success: true,
      message: 'Signature URI saved successfully',
      data: data
    };
  } catch (error: any) {
    console.error('Signature URI saving error:', error);
    return {
      success: false,
      message: error.message || 'Failed to save signature URI'
    };
  }
}

export async function submitKyc(payload: any): Promise<ApiResponse> {
  console.log(`Submitting KYC data, platform: ${currentPlatform}`);
  
  try {
    // In a real app, this would be a fetch call to your API
    // const response = await compatibleFetch('/kyc/submit', {
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
  } catch (error: any) {
    console.error('KYC submission error:', error);
    return {
      success: false,
      message: error.message || 'Failed to submit KYC data'
    };
  }
}

// Utility function to check network connectivity
export const checkNetworkCompatibility = () => {
  if (Platform.OS === 'android' && Platform.Version && Platform.Version < 28) {
    return {
      isOlderAndroid: true,
      version: Platform.Version,
      mayHaveHttpsIssues: true,
      recommendation: 'Ensure server supports TLS 1.2 and has valid certificates'
    };
  }
  
  return {
    isOlderAndroid: false,
    version: Platform.Version,
    mayHaveHttpsIssues: false
  };
};