import React, { useState } from 'react';
import * as FileSystem from 'expo-file-system';
import Toast from 'react-native-toast-message';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  ActionSheetIOS
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../theme';
import { documentsUpload } from '../api';

export default function DocumentUploadScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { email, token } = route.params;
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [bankStatement, setBankStatement] = useState<string | null>(null);
  const [payslip1, setPayslip1] = useState<string | null>(null);
  const [payslip2, setPayslip2] = useState<string | null>(null);
  const [payslip3, setPayslip3] = useState<string | null>(null);

  // Request necessary permissions
  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Sorry, we need camera and gallery permissions to make this work!'
        );
        return false;
      }
    }
    return true;
  };

  // Show action sheet for iOS or alert for Android to choose source
  const showSourceOptions = (documentType: string, callback: (source: 'camera' | 'gallery') => void) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            callback('camera');
          } else if (buttonIndex === 2) {
            callback('gallery');
          }
        }
      );
    } else {
      Alert.alert(
        'Select Source',
        'Choose how you want to upload the file',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: () => callback('camera') },
          { text: 'Choose from Gallery', onPress: () => callback('gallery') },
        ]
      );
    }
  };

  // Check file size (max 10MB)
  const checkFileSize = async (uri: string): Promise<boolean> => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists && fileInfo.size) {
        const fileSizeInMB = fileInfo.size / (1024 * 1024);
        return fileSizeInMB <= 10;
      }
      return false;
    } catch (error) {
      console.error('Error checking file size:', error);
      return false;
    }
  };

  const handleCapture = async (documentType: 'idFront' | 'idBack' | 'selfie' | 'bankStatement') => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    showSourceOptions(documentType, async (source) => {
      let pickerResult;
      
      try {
        if (source === 'camera') {
          pickerResult = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.8,
          });
        } else {
          pickerResult = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.8,
          });
        }

        if (pickerResult.canceled) return;

        const asset = pickerResult.assets?.[0];
        if (!asset?.uri) return;

        // Check file size
        const isValidSize = await checkFileSize(asset.uri);
        if (!isValidSize) {
          Toast.show({
            type: 'error',
            text1: 'File too large',
            text2: 'Please select a file smaller than 10MB'
          });
          return;
        }

        const uri = asset.uri;
        switch (documentType) {
          case 'idFront': setIdFront(uri); break;
          case 'idBack': setIdBack(uri); break;
          case 'selfie': setSelfie(uri); break;
          case 'bankStatement': setBankStatement(uri); break;
        }
      } catch (error) {
        console.error('Error picking image:', error);
        Toast.show({
          type: 'error',
          text1: 'Error selecting image',
          text2: 'Please try again'
        });
      }
    });
  };

  const convertImageToBase64 = async (uri: string): Promise<string> => {
    try {
      // For Android 9+ compatibility, use a different approach
      if (Platform.OS === 'android') {
        // Create a copy of the file to avoid issues with Android content URIs
        const fileUri = `${FileSystem.cacheDirectory}${Date.now()}.jpg`;
        await FileSystem.copyAsync({ from: uri, to: fileUri });
        
        const base64 = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        // Clean up temporary file
        try {
          await FileSystem.deleteAsync(fileUri, { idempotent: true });
        } catch (e) {
          console.warn('Could not delete temp file:', e);
        }
        
        return `data:image/jpeg;base64,${base64}`;
      } else {
        // For iOS and web, use the original approach
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return `data:image/jpeg;base64,${base64}`;
      }
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw error;
    }
  };

  const convertPdfToBase64 = async (uri: string): Promise<string> => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return `data:application/pdf;base64,${base64}`;
    } catch (error) {
      console.error('Error converting PDF to base64:', error);
      throw error;
    }
  };

  const handlePickPayslip = async (slot: 1 | 2 | 3) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset?.uri) return;

      const isValidSize = await checkFileSize(asset.uri);
      if (!isValidSize) {
        Toast.show({
          type: 'error',
          text1: 'File too large',
          text2: 'Please select a file smaller than 10MB'
        });
        return;
      }

      const uri = asset.uri;
      switch (slot) {
        case 1:
          setPayslip1(uri);
          break;
        case 2:
          setPayslip2(uri);
          break;
        case 3:
          setPayslip3(uri);
          break;
      }
    } catch (error) {
      console.error('Error picking payslip PDF:', error);
      Toast.show({
        type: 'error',
        text1: 'Error selecting payslip PDF',
        text2: 'Please try again'
      });
    }
  };

  const handleNext = async () => {
    setLoading(true);

    try {
      // Convert all images to base64 before uploading
      const convertIfNeeded = async (uri: string | null): Promise<string | null> => {
        if (!uri) return null;
        if (uri.startsWith('data:image')) return uri; // Already base64
        return await convertImageToBase64(uri);
      };

      const [
        idFrontBase64,
        idBackBase64,
        selfieBase64,
        bankStatementBase64,
        payslip1Base64,
        payslip2Base64,
        payslip3Base64,
      ] = await Promise.all([
        convertIfNeeded(idFront),
        convertIfNeeded(idBack),
        convertIfNeeded(selfie),
        convertIfNeeded(bankStatement),
        payslip1 ? convertPdfToBase64(payslip1) : Promise.resolve(null),
        payslip2 ? convertPdfToBase64(payslip2) : Promise.resolve(null),
        payslip3 ? convertPdfToBase64(payslip3) : Promise.resolve(null),
      ]);

      const response = await documentsUpload(
        idFrontBase64,
        idBackBase64,
        selfieBase64,
        bankStatementBase64,
        payslip1Base64,
        payslip2Base64,
        payslip3Base64,
        email,
        token
      );

      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Documents details have been saved successfully'
        });
        console.log('Documents details have been saved successfully: ', response.data);
        navigation.navigate('LoanDetails', { token, email });
      } else {
        Toast.show({
          type: 'error',
          text1: response.message || "Saving documents details failed"
        });
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: "An error occurred while saving documents"
      });
      console.error('Error saving documents:', err);
    } finally {
      setLoading(false);
    }
  };

  // Require ID front, ID back, selfie, and three payslips for navigation
  const canProceed = idFront && idBack && selfie && payslip1 && payslip2 && payslip3;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: theme.textColor }]}>Document Upload</Text>
        <Text style={[styles.subtitle, { color: theme.textColor }]}>
          Please upload the required documents (max 10MB each)
        </Text>

        <View style={[styles.card, { backgroundColor: theme.cardBackgroundColor }]}>
          <Text style={[styles.cardTitle, { color: theme.textColor }]}>ID Card (Front) <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              {
                backgroundColor: idFront ? theme.successColor : theme.primaryColor
              }
            ]}
            onPress={() => handleCapture('idFront')}
          >
            <Text style={styles.buttonText}>
              {idFront ? 'Uploaded' : 'Upload'}
            </Text>
          </TouchableOpacity>
          {idFront && <Text style={styles.fileInfo}>File selected</Text>}
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBackgroundColor }]}>
          <Text style={[styles.cardTitle, { color: theme.textColor }]}>ID Card (Back) <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              {
                backgroundColor: idBack ? theme.successColor : theme.primaryColor
              }
            ]}
            onPress={() => handleCapture('idBack')}
          >
            <Text style={styles.buttonText}>
              {idBack ? 'Uploaded' : 'Upload'}
            </Text>
          </TouchableOpacity>
          {idBack && <Text style={styles.fileInfo}>File selected</Text>}
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBackgroundColor }]}>
          <Text style={[styles.cardTitle, { color: theme.textColor }]}>Selfie <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              {
                backgroundColor: selfie ? theme.successColor : theme.primaryColor
              }
            ]}
            onPress={() => handleCapture('selfie')}
          >
            <Text style={styles.buttonText}>
              {selfie ? 'Uploaded' : 'Upload'}
            </Text>
          </TouchableOpacity>
          {selfie && <Text style={styles.fileInfo}>File selected</Text>}
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBackgroundColor }]}>
          <Text style={[styles.cardTitle, { color: theme.textColor }]}>Bank Statement(s) <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              {
                backgroundColor: bankStatement ? theme.successColor : theme.primaryColor
              }
            ]}
            onPress={() => handleCapture('bankStatement')}
          >
            <Text style={styles.buttonText}>
              {bankStatement ? 'Uploaded' : 'Upload'}
            </Text>
          </TouchableOpacity>
          {bankStatement && <Text style={styles.fileInfo}>File selected</Text>}
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBackgroundColor }]}>
          <Text style={[styles.cardTitle, { color: theme.textColor }]}>Payslips (PDF) <Text style={styles.required}>*</Text></Text>
          
          <Text style={styles.payslipLabel}>Payslip 1</Text>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              {
                backgroundColor: payslip1 ? theme.successColor : theme.primaryColor
              }
            ]}
            onPress={() => handlePickPayslip(1)}
          >
            <Text style={styles.buttonText}>
              {payslip1 ? 'Uploaded' : 'Upload PDF'}
            </Text>
          </TouchableOpacity>
          {payslip1 && <Text style={styles.fileInfo}>PDF selected</Text>}

          <Text style={styles.payslipLabel}>Payslip 2</Text>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              {
                backgroundColor: payslip2 ? theme.successColor : theme.primaryColor
              }
            ]}
            onPress={() => handlePickPayslip(2)}
          >
            <Text style={styles.buttonText}>
              {payslip2 ? 'Uploaded' : 'Upload PDF'}
            </Text>
          </TouchableOpacity>
          {payslip2 && <Text style={styles.fileInfo}>PDF selected</Text>}

          <Text style={styles.payslipLabel}>Payslip 3</Text>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              {
                backgroundColor: payslip3 ? theme.successColor : theme.primaryColor
              }
            ]}
            onPress={() => handlePickPayslip(3)}
          >
            <Text style={styles.buttonText}>
              {payslip3 ? 'Uploaded' : 'Upload PDF'}
            </Text>
          </TouchableOpacity>
          {payslip3 && <Text style={styles.fileInfo}>PDF selected</Text>}
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: theme.primaryColor,
              opacity: canProceed ? 1 : 0.7
            }
          ]}
          onPress={handleNext}
          disabled={!canProceed || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Next</Text>
          )}
        </TouchableOpacity>
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
  card: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  uploadButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
  required: {
    color: 'red',
  },
  fileInfo: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  payslipLabel: {
    marginTop: 12,
    marginBottom: 8,
    fontSize: 14,
    color: '#444',
  },
});