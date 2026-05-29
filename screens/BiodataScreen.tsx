import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, differenceInYears } from 'date-fns';
import * as Location from 'expo-location';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../theme';
import { Picker } from '@react-native-picker/picker';
import { countries, provincesByCountry, districtsByProvince } from './data/locations';
import { personalDetails } from '../api';

const ZAMBIAN_BANKS = [
  { label: 'Select Bank', value: '' },
  { label: 'Absa Bank Zambia', value: 'Absa Bank Zambia' },
  { label: 'Access Bank Zambia', value: 'Access Bank Zambia' },
  { label: 'Atlas Mara Bank', value: 'Atlas Mara Bank' },
  { label: 'Bank of China Zambia', value: 'Bank of China Zambia' },
  { label: 'Citibank Zambia', value: 'Citibank Zambia' },
  { label: 'Ecobank Zambia', value: 'Ecobank Zambia' },
  { label: 'First Alliance Bank Zambia', value: 'First Alliance Bank Zambia' },
  { label: 'First Capital Bank', value: 'First Capital Bank' },
  { label: 'First National Bank Zambia (FNB)', value: 'First National Bank Zambia' },
  { label: 'Indo Zambia Bank', value: 'Indo Zambia Bank' },
  { label: 'Investrust Bank', value: 'Investrust Bank' },
  { label: 'Madison Finance', value: 'Madison Finance' },
  { label: 'Natsave', value: 'Natsave' },
  { label: 'Standard Chartered Bank Zambia', value: 'Standard Chartered Bank Zambia' },
  { label: 'UBA Zambia', value: 'UBA Zambia' },
  { label: 'ZANACO', value: 'ZANACO' },
  { label: 'ZICB', value: 'ZICB' },
];

const ACCOUNT_TYPES = [
  { label: 'Select Account Type', value: '' },
  { label: 'Current Account', value: 'Current' },
  { label: 'Savings Account', value: 'Savings' },
  { label: 'Fixed Deposit', value: 'Fixed Deposit' },
  { label: 'Call Account', value: 'Call' },
];

export default function BiodataScreen() {
  const route = useRoute();
  const { email, mobile, token } = route.params;
  const navigation = useNavigation();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationCaptured, setLocationCaptured] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    gender: '',
    citizenId: '',
    title: '',
    dateOfBirth: '',
    phoneNumber: '',
    email: '',
    address: '',
    district: '',
    province: '',
    country: '',
    maritalStatus: '',
    zipCode: '',
    occupation: '',
    employer: '',
    employeeNumber: '',
    employerNumber: '',
    employerAddress: '',
    employeeStartDate: '',
    employerEmail: '',
    monthlyIncome: '',
    bankName: '',
    branchName: '',
    branchCode: '',
    accountNumber: '',
    accountType: '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dob, setDob] = useState<Date | null>(null);

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);

  const handleDateChange = useCallback((event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDob(selectedDate);
      handleInputChange('dateOfBirth', format(selectedDate, 'dd/MM/yyyy'));
    }
  }, [handleInputChange]);

  const handleStartDateChange = useCallback((event: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
      handleInputChange('employeeStartDate', format(selectedDate, 'yyyy-MM-dd'));
    }
  }, [handleInputChange]);

  // Auto-format NRC: insert slashes after 6th and 8th digit → XXXXXX/XX/X
  const formatNRC = useCallback((raw: string): string => {
    const digits = raw.replace(/\D/g, '').slice(0, 9);
    if (digits.length <= 6) return digits;
    if (digits.length <= 8) return `${digits.slice(0, 6)}/${digits.slice(6)}`;
    return `${digits.slice(0, 6)}/${digits.slice(6, 8)}/${digits.slice(8)}`;
  }, []);

  // Strip non-letter characters from name fields (allow spaces, hyphens, apostrophes)
  const sanitizeName = useCallback((v: string) => v.replace(/[^a-zA-Z\s'-]/g, ''), []);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  useEffect(() => {
    handleInputChange('email', email);
    handleInputChange('phoneNumber', mobile);
  }, [email, mobile]);

  // Auto-request location permission on screen load
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Location required',
          text2: 'GPS location is required to proceed. Please enable it in Settings.',
        });
      } else {
        captureLocation();
      }
    })();
  }, []);

  const captureLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Location permission denied',
          text2: 'Enable location access in your device settings to continue.',
        });
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLatitude(position.coords.latitude);
      setLongitude(position.coords.longitude);

      const results = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      if (!results || results.length === 0) {
        Toast.show({ type: 'error', text1: 'Unable to get address from GPS' });
        return;
      }

      const place = results[0];
      const parts = [
        place.name,
        place.street,
        place.subregion || place.city,
        place.region,
        place.country,
      ].filter(Boolean);

      const formattedAddress = parts.join(', ');
      if (formattedAddress) {
        handleInputChange('address', formattedAddress);
        setLocationCaptured(true);
        Toast.show({
          type: 'success',
          text1: 'Location captured',
          text2: formattedAddress,
        });
      } else {
        Toast.show({ type: 'error', text1: 'Could not build address from GPS location' });
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Toast.show({ type: 'error', text1: 'Failed to get GPS location', text2: 'Please try again.' });
    } finally {
      setLocating(false);
    }
  };

  // ── Validation ──────────────────────────────────────────────────
  const lettersOnly = /^[a-zA-Z\s'-]+$/;
  // Zambia NRC format: 000000/00/0
  const nrcRegex = /^\d{6}\/\d{2}\/\d{1}$/;

  const zambianMobileRegex = /^0(9[5-7]|7[5-7]|5[5-7])\d{7}$/;

  const validateForm = (): boolean => {
    const { firstName, lastName, gender, title, dateOfBirth, citizenId,
      address, country, province, bankName, branchCode, accountNumber, accountType,
      employerNumber } = formData;

    if (!firstName.trim() || !lettersOnly.test(firstName.trim())) {
      Toast.show({ type: 'error', text1: 'Invalid first name', text2: 'First name must contain letters only.' });
      return false;
    }
    if (!lastName.trim() || !lettersOnly.test(lastName.trim())) {
      Toast.show({ type: 'error', text1: 'Invalid last name', text2: 'Last name must contain letters only.' });
      return false;
    }
    if (!gender) {
      Toast.show({ type: 'error', text1: 'Gender required', text2: 'Please select your gender.' });
      return false;
    }
    if (!title) {
      Toast.show({ type: 'error', text1: 'Title required', text2: 'Please select your title.' });
      return false;
    }
    if (!dob || !dateOfBirth) {
      Toast.show({ type: 'error', text1: 'Date of birth required', text2: 'Please select your date of birth.' });
      return false;
    }
    if (differenceInYears(new Date(), dob) < 18) {
      Toast.show({ type: 'error', text1: 'Age requirement', text2: 'You must be at least 18 years old to apply.' });
      return false;
    }
    if (!citizenId.trim()) {
      Toast.show({ type: 'error', text1: 'NRC/ID required', text2: 'Please enter your NRC/citizen ID.' });
      return false;
    }
    if (!nrcRegex.test(citizenId.trim())) {
      Toast.show({ type: 'error', text1: 'Invalid NRC format', text2: 'NRC must be in the format 000000/00/0 (e.g. 123456/78/9).' });
      return false;
    }
    if (employerNumber.trim() && !zambianMobileRegex.test(employerNumber.trim())) {
      Toast.show({ type: 'error', text1: 'Invalid employer number', text2: 'Enter a valid 10-digit Zambian number (e.g. 0971234567).' });
      return false;
    }
    if (!locationCaptured || !address.trim()) {
      Toast.show({ type: 'error', text1: 'GPS location required', text2: 'Tap "Capture GPS Location" before continuing.' });
      return false;
    }
    if (!country) {
      Toast.show({ type: 'error', text1: 'Country required', text2: 'Please select your country.' });
      return false;
    }
    if (provincesByCountry[country]?.length > 0 && !province) {
      Toast.show({ type: 'error', text1: 'Province required', text2: 'Please select your province.' });
      return false;
    }

    // Bank details
    if (bankName && branchCode) {
      if (!/^\d{1,6}$/.test(branchCode.trim())) {
        Toast.show({ type: 'error', text1: 'Invalid sort/branch code', text2: 'Branch code must be numeric and at most 6 digits.' });
        return false;
      }
    }
    if (accountNumber && !/^\d{8,13}$/.test(accountNumber.trim())) {
      Toast.show({ type: 'error', text1: 'Invalid account number', text2: 'Account number must be 8–13 digits.' });
      return false;
    }

    return true;
  };

  const isFormValid = useMemo(() => {
    const required = ['firstName', 'lastName', 'dateOfBirth', 'phoneNumber', 'address'];
    return required.every(field => (formData as any)[field]?.trim() !== '') && locationCaptured;
  }, [formData, locationCaptured]);

  const handleNext = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      const payload = {
        ...formData,
        latitude: latitude?.toString() ?? '',
        longitude: longitude?.toString() ?? '',
      };
      const response = await personalDetails(payload, token);

      if (response.success) {
        Toast.show({ type: 'success', text1: 'Personal details saved successfully' });
        navigation.navigate('DocumentUpload', { token, email });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed to save details',
          text2: response.message || 'Please check your details and try again.',
        });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err?.message || 'An unexpected error occurred.',
      });
    } finally {
      setLoading(false);
    }
  };

  const provinces = useMemo(
    () => (formData.country ? provincesByCountry[formData.country] || [] : []),
    [formData.country],
  );
  const districts = useMemo(
    () => (formData.province ? districtsByProvince[formData.province] || [] : []),
    [formData.province],
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
      >
        <Text style={[styles.title, { color: theme.textColor }]}>Personal Information</Text>
        <Text style={[styles.subtitle, { color: theme.textColor }]}>
          Please fill in your personal details
        </Text>

        {/* ── Basic Information ── */}
        <View style={[styles.section, { backgroundColor: theme.cardBackgroundColor }]}>
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Basic Information</Text>

          <Text style={styles.label}>First Name <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="e.g. John"
            value={formData.firstName}
            onChangeText={(v) => handleInputChange('firstName', sanitizeName(v))}
          />

          <Text style={styles.label}>Last Name <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="e.g. Mwansa"
            value={formData.lastName}
            onChangeText={(v) => handleInputChange('lastName', sanitizeName(v))}
          />

          <Text style={styles.label}>Middle Name</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="e.g. James (optional)"
            value={formData.middleName}
            onChangeText={(v) => handleInputChange('middleName', sanitizeName(v))}
          />

          <Text style={styles.label}>Gender <Text style={styles.required}>*</Text></Text>
          <View style={[styles.pickerWrapper, { borderColor: theme.borderColor }]}>
            <Picker selectedValue={formData.gender} onValueChange={(v) => handleInputChange('gender', v)}>
              <Picker.Item label="Select Gender" value="" />
              <Picker.Item label="Male" value="male" />
              <Picker.Item label="Female" value="female" />
            </Picker>
          </View>

          <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
          <View style={[styles.pickerWrapper, { borderColor: theme.borderColor }]}>
            <Picker selectedValue={formData.title} onValueChange={(v) => handleInputChange('title', v)}>
              <Picker.Item label="Select Title" value="" />
              <Picker.Item label="Mr" value="Mr" />
              <Picker.Item label="Ms" value="Ms" />
              <Picker.Item label="Mrs" value="Mrs" />
              <Picker.Item label="Doctor" value="Doc" />
            </Picker>
          </View>

          <Text style={styles.label}>Marital Status <Text style={styles.required}>*</Text></Text>
          <View style={[styles.pickerWrapper, { borderColor: theme.borderColor }]}>
            <Picker selectedValue={formData.maritalStatus} onValueChange={(v) => handleInputChange('maritalStatus', v)}>
              <Picker.Item label="Select Marital Status" value="" />
              <Picker.Item label="Married" value="Married" />
              <Picker.Item label="Single" value="Single" />
              <Picker.Item label="Divorced" value="Divorced" />
              <Picker.Item label="Widowed" value="Widowed" />
            </Picker>
          </View>

          <Text style={styles.label}>Date of Birth <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={[styles.input, { borderColor: theme.borderColor, justifyContent: 'center' }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: dob ? '#000' : '#888' }}>
              {dob ? format(dob, 'dd/MM/yyyy') : 'Select your date of birth (must be 18+)'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dob || new Date(1990, 0, 1)}
              mode="date"
              display="default"
              maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 18))}
              onChange={handleDateChange}
            />
          )}

          <Text style={styles.label}>Citizen ID (NRC) <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="123456/78/9"
            value={formData.citizenId}
            onChangeText={(v) => handleInputChange('citizenId', formatNRC(v))}
            keyboardType="numeric"
            autoCapitalize="none"
            maxLength={11}
          />
          <Text style={styles.helperText}>Slashes are added automatically — enter digits only</Text>
        </View>

        {/* ── Contact Information ── */}
        <View style={[styles.section, { backgroundColor: theme.cardBackgroundColor }]}>
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Contact Information</Text>

          <Text style={styles.label}>Phone Number <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor, backgroundColor: '#F0F0F0' }]}
            value={formData.phoneNumber}
            editable={false}
          />

          <Text style={styles.label}>Email <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor, backgroundColor: '#F0F0F0' }]}
            value={formData.email}
            editable={false}
          />

          {/* Country */}
          <Text style={styles.label}>Country <Text style={styles.required}>*</Text></Text>
          <View style={[styles.pickerWrapper, { borderColor: theme.borderColor }]}>
            <Picker
              selectedValue={formData.country}
              onValueChange={(v) => {
                handleInputChange('country', v);
                handleInputChange('province', '');
                handleInputChange('district', '');
              }}
            >
              {countries.map(({ label, value }) => (
                <Picker.Item key={value} label={label} value={value} />
              ))}
            </Picker>
          </View>

          {/* Province */}
          {provinces.length > 0 && (
            <>
              <Text style={styles.label}>Province <Text style={styles.required}>*</Text></Text>
              <View style={[styles.pickerWrapper, { borderColor: theme.borderColor }]}>
                <Picker
                  selectedValue={formData.province}
                  onValueChange={(v) => {
                    handleInputChange('province', v);
                    handleInputChange('district', '');
                  }}
                >
                  <Picker.Item label="Select Province" value="" />
                  {provinces.map(({ label, value }) => (
                    <Picker.Item key={value} label={label} value={value} />
                  ))}
                </Picker>
              </View>
            </>
          )}

          {/* District */}
          {districts.length > 0 && (
            <>
              <Text style={styles.label}>District <Text style={styles.required}>*</Text></Text>
              <View style={[styles.pickerWrapper, { borderColor: theme.borderColor }]}>
                <Picker
                  selectedValue={formData.district}
                  onValueChange={(v) => handleInputChange('district', v)}
                >
                  <Picker.Item label="Select District" value="" />
                  {districts.map(({ label, value }) => (
                    <Picker.Item key={value} label={label} value={value} />
                  ))}
                </Picker>
              </View>
            </>
          )}

          {/* Address — GPS only, read-only */}
          <Text style={styles.label}>Address <Text style={styles.required}>*</Text></Text>
          <View style={[
            styles.input,
            { borderColor: locationCaptured ? '#4CAF50' : theme.borderColor, minHeight: 70, justifyContent: 'center', backgroundColor: '#F9F9F9' }
          ]}>
            <Text style={{ color: formData.address ? '#333' : '#888', fontSize: 14 }}>
              {formData.address || 'Will be filled automatically from GPS'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.locationButton, {
              borderColor: locationCaptured ? '#4CAF50' : theme.primaryColor,
              backgroundColor: locationCaptured ? '#E8F5E9' : undefined,
            }]}
            onPress={captureLocation}
            disabled={locating}
          >
            {locating ? (
              <ActivityIndicator size="small" color={theme.primaryColor} />
            ) : (
              <Text style={[styles.locationButtonText, { color: locationCaptured ? '#2E7D32' : theme.primaryColor }]}>
                {locationCaptured ? '✓ GPS Location Captured — Tap to Refresh' : 'Capture GPS Location (Required)'}
              </Text>
            )}
          </TouchableOpacity>
          {latitude && longitude && (
            <Text style={styles.helperText}>
              GPS: {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </Text>
          )}
        </View>

        {/* ── Employment Information ── */}
        <View style={[styles.section, { backgroundColor: theme.cardBackgroundColor }]}>
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Employment Information</Text>

          <Text style={styles.label}>Occupation <Text style={styles.required}>*</Text></Text>
          <View style={[styles.pickerContainer, { borderColor: theme.borderColor }]}>
            <Picker
              selectedValue={formData.occupation}
              onValueChange={(v) => handleInputChange('occupation', v)}
              style={styles.picker}
              dropdownIconColor={theme.textColor}
            >
              <Picker.Item label="Select occupation" value="" />
              <Picker.Item label="Government Employee" value="Government Employee" />
              <Picker.Item label="Private Sector Employee" value="Private Sector Employee" />
              <Picker.Item label="Self Employed / Business Owner" value="Self Employed" />
              <Picker.Item label="Farmer / Agricultural Worker" value="Farmer" />
              <Picker.Item label="Healthcare Professional" value="Healthcare Professional" />
              <Picker.Item label="Teacher / Educator" value="Teacher" />
              <Picker.Item label="Engineer / Technician" value="Engineer" />
              <Picker.Item label="Lawyer / Legal Professional" value="Lawyer" />
              <Picker.Item label="Accountant / Finance Professional" value="Accountant" />
              <Picker.Item label="Sales / Marketing" value="Sales / Marketing" />
              <Picker.Item label="Driver / Transport" value="Driver" />
              <Picker.Item label="Security Personnel" value="Security Personnel" />
              <Picker.Item label="Domestic Worker" value="Domestic Worker" />
              <Picker.Item label="Student" value="Student" />
              <Picker.Item label="Retired" value="Retired" />
              <Picker.Item label="Unemployed" value="Unemployed" />
              <Picker.Item label="Other" value="Other" />
            </Picker>
          </View>

          <Text style={styles.label}>Employer</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="Enter your employer"
            value={formData.employer}
            onChangeText={(v) => handleInputChange('employer', v)}
          />

          <Text style={styles.label}>Employer Number</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="e.g. 0971234567"
            value={formData.employerNumber}
            onChangeText={(v) => handleInputChange('employerNumber', v.replace(/\D/g, '').slice(0, 10))}
            keyboardType="phone-pad"
            maxLength={10}
          />
          <Text style={styles.helperText}>Valid Zambian number (10 digits, e.g. 097/077/057…)</Text>

          <Text style={styles.label}>Employer Address</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="Enter employer physical address"
            value={formData.employerAddress}
            onChangeText={(v) => handleInputChange('employerAddress', v)}
          />

          <Text style={styles.label}>Employer Email</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="Enter employer email"
            value={formData.employerEmail}
            onChangeText={(v) => handleInputChange('employerEmail', v)}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Employee Number</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="Enter your employee number"
            value={formData.employeeNumber}
            onChangeText={(v) => handleInputChange('employeeNumber', v)}
          />

          <Text style={styles.label}>Employment Start Date</Text>
          <TouchableOpacity
            style={[styles.input, { borderColor: theme.borderColor, justifyContent: 'center' }]}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Text style={{ color: startDate ? '#000' : '#888' }}>
              {startDate ? format(startDate, 'dd/MM/yyyy') : 'Select employment start date'}
            </Text>
          </TouchableOpacity>
          {showStartDatePicker && (
            <DateTimePicker
              value={startDate || new Date()}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={handleStartDateChange}
            />
          )}

          <Text style={styles.label}>Monthly Income (ZMW)</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="Enter your monthly income"
            value={formData.monthlyIncome}
            onChangeText={(v) => handleInputChange('monthlyIncome', v)}
            keyboardType="numeric"
          />
        </View>

        {/* ── Bank Details ── */}
        <View style={[styles.section, { backgroundColor: theme.cardBackgroundColor }]}>
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Bank Details</Text>

          <Text style={styles.label}>Bank Name</Text>
          <View style={[styles.pickerWrapper, { borderColor: theme.borderColor }]}>
            <Picker
              selectedValue={formData.bankName}
              onValueChange={(v) => handleInputChange('bankName', v)}
            >
              {ZAMBIAN_BANKS.map(({ label, value }) => (
                <Picker.Item key={value} label={label} value={value} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Account Type</Text>
          <View style={[styles.pickerWrapper, { borderColor: theme.borderColor }]}>
            <Picker
              selectedValue={formData.accountType}
              onValueChange={(v) => handleInputChange('accountType', v)}
            >
              {ACCOUNT_TYPES.map(({ label, value }) => (
                <Picker.Item key={value} label={label} value={value} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Branch Name</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="Letters only"
            value={formData.branchName}
            onChangeText={(v) => handleInputChange('branchName', v)}
          />

          <Text style={styles.label}>Branch / Sort Code</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="Up to 6 digits (numeric)"
            value={formData.branchCode}
            onChangeText={(v) => handleInputChange('branchCode', v.replace(/\D/g, '').slice(0, 6))}
            keyboardType="numeric"
            maxLength={6}
          />

          <Text style={styles.label}>Bank Account Number</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="8–13 digits (numeric)"
            value={formData.accountNumber}
            onChangeText={(v) => handleInputChange('accountNumber', v.replace(/\D/g, '').slice(0, 13))}
            keyboardType="numeric"
            maxLength={13}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primaryColor, opacity: isFormValid ? 1 : 0.7 }]}
          onPress={handleNext}
          disabled={!isFormValid || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Next</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 24 },
  section: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  label: { fontSize: 14, marginBottom: 8, color: '#666' },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  locationButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  locationButtonText: { fontSize: 14, fontWeight: '600' },
  helperText: { fontSize: 12, color: '#666', marginBottom: 16 },
  required: { color: 'red' },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    height: 52,
    width: '100%',
  },
});
