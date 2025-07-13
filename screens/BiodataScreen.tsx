import React, { useState } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { Picker } from '@react-native-picker/picker';
import { countries, provincesByCountry, districtsByProvince } from './data/locations';


  


export default function BiodataScreen() {


  const navigation = useNavigation();
  const theme = useTheme();
  
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
    country:'',
    maritalStatus:'',
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
    accountNumber: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    navigation.navigate('DocumentUpload', { biodata: formData });
  };

  const isFormValid = () => {
    const required = ['firstName', 'lastName', 'dateOfBirth', 'phoneNumber', 'email', 'address'];
    return required.every(field => formData[field].trim() !== '');
  };
const provinces = formData.country ? provincesByCountry[formData.country] || [] : [];
const districts = formData.province ? districtsByProvince[formData.province] || [] : [];

const [selectedCountry, setSelectedCountry] = useState('');
const [selectedProvince, setSelectedProvince] = useState('');
const [selectedDistrict, setSelectedDistrict] = useState('');


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: theme.textColor }]}>Personal Information</Text>
        <Text style={[styles.subtitle, { color: theme.textColor }]}>
          Please fill in your personal details
        </Text>

        <View style={[styles.section, { backgroundColor: theme.cardBackgroundColor }]}>
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Basic Information</Text>
          
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="Enter your first name"
            value={formData.firstName}
            onChangeText={(value) => handleInputChange('firstName', value)}
          />

          <Text style={styles.label}>Last Name *</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="Enter your last name"
            value={formData.lastName}
            onChangeText={(value) => handleInputChange('lastName', value)}
          />

          <Text style={styles.label}>Middle Name</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="Enter your middle name"
            value={formData.middleName}
            onChangeText={(value) => handleInputChange('middleName', value)}
          />

           <Text style={styles.label}>Gender *</Text>
         
           <Picker
           selectedValue={formData.gender}
           onValueChange={(value) => handleInputChange('gender', value)}
           style={[styles.input, { borderColor: theme.borderColor }]}
           >
          <Picker.Item label="Select Gender" value="" />
          <Picker.Item label="Male" value="male" />
          <Picker.Item label="Female" value="female" />
         </Picker>
        

         <Text style={styles.label}>Title *</Text>
        
         <Picker
         selectedValue={formData.title}
         onValueChange={(value) => handleInputChange('title', value)}
        style={[styles.input, { borderColor: theme.borderColor }]}
         >
         <Picker.Item label="Select Title" value="" />
         <Picker.Item label="Mr" value="Mr" />
         <Picker.Item label="Ms" value="Ms" />
         <Picker.Item label="Mrs" value="Mrs" />
         <Picker.Item label="Doctor" value="Doc" />
         </Picker>


         <Text style={styles.label}>Marital Status *</Text>
         
         <Picker
          selectedValue={formData.maritalStatus}
          onValueChange={(value) => handleInputChange('maritalStatus', value)}
         style={[styles.input, { borderColor: theme.borderColor }]}
          >
          <Picker.Item label="Select Marital Status" value="" />
          <Picker.Item label="married" value="Married" />
          <Picker.Item label="single" value="Single" />
          <Picker.Item label="divorced" value="Divorced" />
          <Picker.Item label="widowed" value="Widowed" />
         </Picker>
       



          <Text style={styles.label}>Date of Birth *</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="DD/MM/YYYY"
            value={formData.dateOfBirth}
            onChangeText={(value) => handleInputChange('dateOfBirth', value)}
          />

           <Text style={styles.label}>Citizen ID *</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="e.g 123456/7/1"
            value={formData.citizenId}
            onChangeText={(value) => handleInputChange('dateOfBirth', value)}
          />
        
        

       
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Contact Information</Text>
          
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="Enter your phone number"
            value={formData.phoneNumber}
            onChangeText={(value) => handleInputChange('phoneNumber', value)}
            keyboardType="phone-pad"
          />

        




      {/* Country Picker */}
      <Text style={styles.label}>Country *</Text>
      <View>
        <Picker
        style={[styles.input, { borderColor: theme.borderColor }]}
          selectedValue={formData.country}
          onValueChange={(value) => {
            handleInputChange('country', value);
            // Reset dependent selects
            handleInputChange('province', '');
            handleInputChange('district', '');
          }}
        >
          {countries.map(({ label, value }) => (
            <Picker.Item key={value} label={label} value={value} />
          ))}
        </Picker>
      </View>

      {/* Province Picker */}
      {provinces.length > 0 && (
        <>
          <Text style={styles.label}>Province *</Text>
          <View>
            <Picker
            style={[styles.input, { borderColor: theme.borderColor }]}
              selectedValue={formData.province}
              onValueChange={(value) => {
                handleInputChange('province', value);
                // Reset district when province changes
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

      {/* District Picker */}
      {districts.length > 0 && (
        <>
          <Text style={styles.label}>District *</Text>
          <View>
            <Picker
            style={[styles.input, { borderColor: theme.borderColor }]}
              selectedValue={formData.district}
              onValueChange={(value) => handleInputChange('district', value)}
            >
              <Picker.Item label="Select District" value="" />
              {districts.map(({ label, value }) => (
                <Picker.Item key={value} label={label} value={value} />
              ))}
            </Picker>
          </View>
        </>
      )}
   


        


          <Text style={styles.label}>Address *</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="Enter your address"
            value={formData.address}
            onChangeText={(value) => handleInputChange('address', value)}
            multiline
          />

    
        </View>

        <View style={[styles.section, { backgroundColor: theme.cardBackgroundColor }]}>
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Employment Information</Text>
          
          <Text style={styles.label}>Occupation</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="Enter your occupation"
            value={formData.occupation}
            onChangeText={(value) => handleInputChange('occupation', value)}
          />

          <Text style={styles.label}>Employer</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="Enter your employer"
            value={formData.employer}
            onChangeText={(value) => handleInputChange('employer', value)}
          />

           <Text style={styles.label}>Employer number</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="Enter your employer number"
            value={formData.employerNumber}
            onChangeText={(value) => handleInputChange('employerNumber', value)}
          />


           <Text style={styles.label}>Employer Address</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="Enter your employer physical address"
            value={formData.employerAddress}
            onChangeText={(value) => handleInputChange('employerAddress', value)}
          />

          <Text style={styles.label}>Employer Email</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="Enter your employer email"
            value={formData.employerEmail}
            onChangeText={(value) => handleInputChange('employerEmail', value)}
          />
          
           <Text style={styles.label}>Employee number</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="Enter your employee number"
            value={formData.employeeNumber}
            onChangeText={(value) => handleInputChange('employee_number', value)}
          />

            <Text style={styles.label}>Employee Start date</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="DD/MM/YYYY"
            value={formData.employeeStartDate}
            onChangeText={(value) => handleInputChange('employeeStartDate', value)}
          />


          <Text style={styles.label}>Monthly Income</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="Enter your monthly income"
            value={formData.monthlyIncome}
            onChangeText={(value) => handleInputChange('monthlyIncome', value)}
            keyboardType="numeric"
          />
        </View>


        <View style={[styles.section, { backgroundColor: theme.cardBackgroundColor }]}>
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Bank Details</Text>
          
          <Text style={styles.label}>Bank Name *</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="Enter your Bank name"
            value={formData.bankName}
            onChangeText={(value) => handleInputChange('bankName', value)}
          />

          <Text style={styles.label}>Branch Name *</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="Enter Branch Name"
            value={formData.branchName}
            onChangeText={(value) => handleInputChange('branchName', value)}
          />

           <Text style={styles.label}>Branch Code</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="Enter Branch Code"
            value={formData.branchCode}
            onChangeText={(value) => handleInputChange('branchCode', value)}
          />


          <Text style={styles.label}>Account type</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="Enter Account type"
            value={formData.branchCode}
            onChangeText={(value) => handleInputChange('branchCode', value)}
          />

          <Text style={styles.label}>Bank Account Number *</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="Enter your Account Number"
            value={formData.accountNumber}
            onChangeText={(value) => handleInputChange('accountNumber', value)}
          />

         
        </View>



        <TouchableOpacity
          style={[
            styles.button, 
            { 
              backgroundColor: theme.primaryColor,
              opacity: isFormValid() ? 1 : 0.7
            }
          ]}
          onPress={handleNext}
          disabled={!isFormValid()}
        >
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
        
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666',
  },
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

   pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
  },
});