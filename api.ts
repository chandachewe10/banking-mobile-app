// api.ts
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Explicitly set platform for API calls
const currentPlatform = Platform.OS || 'web';
const expoConfig = Constants.expoConfig;
const runtimeVersionRaw = expoConfig?.runtimeVersion;
const runtimeVersion =
  typeof runtimeVersionRaw === 'string' ? runtimeVersionRaw : '1.0.0';
const channelName = (expoConfig?.updates as any)?.channel || 'default';

// On Android the loopback address 127.0.0.1 resolves to the device itself.
// The Android emulator exposes the host machine at 10.0.2.2.
// For a physical device replace this with your machine's LAN IP.
const HOST = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';

export const API_BASE = `https://dd81-41-216-86-45.ngrok-free.app`;

// Kept for backwards-compat; same value as API_BASE now that HOST is correct.
export const HTTP_API_BASE = `https://dd81-41-216-86-45.ngrok-free.app`;

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

// Convert raw Laravel validation strings into readable copy.
const humanizeMessage = (msg: string): string => {
  if (!msg) return msg;
  return msg
    .replace(/The email has already been taken\./gi, 'This email address is already registered.')
    .replace(/The phone has already been taken\./gi, 'This phone number is already registered.')
    .replace(/The phone number has already been taken\./gi, 'This phone number is already registered.')
    .replace(/The citizen id has already been taken\./gi, 'This NRC/ID number is already registered.')
    .replace(/The email field must be a valid email address\./gi, 'Please enter a valid email address.')
    .replace(/The email field is required\./gi, 'Email address is required.')
    .replace(/The phone field must be a number\./gi, 'Phone number must contain digits only.')
    .replace(/The phone field is required\./gi, 'Phone number is required.')
    .replace(/The otp code field is required\./gi, 'Please enter your OTP code.')
    .replace(/The selected otp code is invalid\./gi, 'The OTP code you entered is incorrect.')
    .replace(/Invalid or expired OTP code/gi, 'This OTP has expired or is incorrect. Please request a new one.')
    .replace(/The selected email is invalid\./gi, 'This email address is not registered.')
    .replace(/An error occurred while processing(?: while processing)? your request\.?/gi, '')
    .replace(/Unauthenticated\./gi, 'Your session has expired. Please start over.')
    .trim();
};

// Extract the most informative error message from any API response shape:
//   { error: "..." }                       — registration / OTP / personalDetails
//   { errors: { field: ["msg"] } }         — documents / signature / loanDetails
//   { message: "..." }                     — generic
const extractErrorMessage = (data: any, fallback: string): string => {
  if (data?.error && typeof data.error === 'string') {
    const cleaned = humanizeMessage(data.error);
    if (cleaned) return cleaned;
  }
  if (data?.errors && typeof data.errors === 'object') {
    const msgs = (Object.values(data.errors) as string[][]).flat();
    if (msgs.length > 0) return humanizeMessage(msgs[0]);
  }
  if (data?.message && typeof data.message === 'string') {
    const cleaned = humanizeMessage(data.message);
    if (cleaned) return cleaned;
  }
  return fallback;
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
    if (!response.ok) throw new Error(extractErrorMessage(data, 'Registration failed'));

    return {
      success: true,
      message: 'OTP sent successfully',
      data: data
    };
  } catch (error: any) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: error.message || 'Failed to register. Please try again.'
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
    if (!response.ok) throw new Error(extractErrorMessage(data, 'OTP verification failed'));
    return {
      success: true,
      message: data.message || 'OTP verified successfully',
      data,
    };
  } catch (error: any) {
    console.error('OTP verification error:', error);
    return {
      success: false,
      message: error.message || 'Failed to verify OTP. Please try again.'
    };
  }
}

export async function resendOtp(email: string, token: string): Promise<ApiResponse> {
  console.log(`Resending OTP for user: ${email}, platform: ${currentPlatform}`);

  const formData = new FormData();
  formData.append('email', email || '');

  try {
    const response = await compatibleFetch('/api/resendOtp', {
      method: 'POST',
      headers: {
        ...addExpoHeaders(),
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(extractErrorMessage(data, 'Failed to resend OTP'));
    return {
      success: true,
      message: data.message || 'OTP resent successfully',
      data,
    };
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    return {
      success: false,
      message: error.message || 'Failed to resend OTP. Please try again.'
    };
  }
}

export async function personalDetails(biodata: any, token: string): Promise<ApiResponse> {
  console.log(`Saving personal details for: ${biodata?.email}, platform: ${currentPlatform}`);

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
    if (!response.ok) throw new Error(extractErrorMessage(data, 'Failed to save personal details'));

    return {
      success: true,
      message: 'Personal details saved successfully',
      data: data
    };
  } catch (error: any) {
    console.error('Personal Details error:', error);
    return {
      success: false,
      message: error.message || 'Failed to save personal details. Please try again.'
    };
  }
}

export async function documentsUpload(
  idFront: string,
  idBack: string,
  selfie: string,
  bankStatement: string,
  payslip1: string | null,
  payslip2: string | null,
  payslip3: string | null,
  email: string,
  token: string
): Promise<ApiResponse> {
  console.log(`Saving Docs for user: ${email}, platform: ${currentPlatform}`);

  const formData = new FormData();
  formData.append('idFront', idFront);
  formData.append('idBack', idBack);
  formData.append('selfie', selfie);
  formData.append('bankStatement', bankStatement);
  if (payslip1) formData.append('payslip1', payslip1);
  if (payslip2) formData.append('payslip2', payslip2);
  if (payslip3) formData.append('payslip3', payslip3);
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
    if (!response.ok) throw new Error(extractErrorMessage(data, 'Failed to upload documents'));

    return {
      success: true,
      message: 'Files saved successfully',
      data: data
    };
  } catch (error: any) {
    console.error('Files saving error:', error);
    return {
      success: false,
      message: error.message || 'Failed to upload documents. Please try again.'
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
  monthlyRepayment: string,
  disbursedAmount: string,
  totalRepayable: string,
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
  formData.append('monthlyRepayment', monthlyRepayment);
  formData.append('disbursedAmount', disbursedAmount);
  formData.append('totalRepayable', totalRepayable);
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
    if (!response.ok) throw new Error(extractErrorMessage(data, 'Failed to save loan details'));

    return {
      success: true,
      message: 'Loan details saved successfully',
      data: data
    };
  } catch (error: any) {
    console.error('Loan details saving error:', error);
    return {
      success: false,
      message: error.message || 'Failed to save loan details. Please try again.'
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
    if (!response.ok) throw new Error(extractErrorMessage(data, 'Failed to save signature'));

    return {
      success: true,
      message: 'Signature saved successfully',
      data: data
    };
  } catch (error: any) {
    console.error('Signature URI saving error:', error);
    return {
      success: false,
      message: error.message || 'Failed to save signature. Please try again.'
    };
  }
}

export async function loginRequest(mobile: string): Promise<ApiResponse> {
  console.log(`Login request for mobile: ${mobile}`);

  const formData = new FormData();
  formData.append('phone', mobile);

  try {
    const response = await compatibleFetch('/api/login', {
      method: 'POST',
      headers: addExpoHeaders(),
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(extractErrorMessage(data, 'Login failed. Please check your mobile number.'));

    return {
      success: true,
      message: data.message || 'OTP sent successfully',
      data: data.data ?? data,
    };
  } catch (error: any) {
    console.error('Login error:', error);
    return {
      success: false,
      message: error.message || 'Login failed. Please try again.',
    };
  }
}

export async function applicationStatus(token: string): Promise<ApiResponse> {
  try {
    const response = await compatibleFetch('/api/application-status', {
      method: 'GET',
      headers: {
        ...addExpoHeaders(),
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(extractErrorMessage(data, 'Could not retrieve application status.'));

    return {
      success: true,
      message: data.message,
      data: data.data ?? data,
    };
  } catch (error: any) {
    console.error('applicationStatus error:', error);
    return {
      success: false,
      message: error.message || 'Failed to check application status.',
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