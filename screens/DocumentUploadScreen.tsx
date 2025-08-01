import React, { useState } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../theme';

export default function DocumentUploadScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();
  const { biodata } = route.params || { biodata: {} };
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [bankStatement, setBankStatement] = useState<string | null>(null);
  const [payslip, setPayslip] = useState<string | null>(null);

  const handleCapture = async (documentType: 'idFront' | 'idBack' | 'selfie' | 'bankStatement' | 'payslip') => {
    // request permissions and open camera on native, gallery on web
   if (Platform.OS !== 'web') {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') return;
}

const pickerResult = Platform.OS === 'web'
  ? await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images })
  : await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });

if (pickerResult.canceled) return;

const asset = pickerResult.assets?.[0];
if (!asset?.uri) return;

    
    const uri = asset.uri;
    switch (documentType) {
      case 'idFront': setIdFront(uri); break;
      case 'idBack': setIdBack(uri); break;
      case 'selfie': setSelfie(uri); break;
      case 'bankStatement': setBankStatement(uri); break;
      case 'payslip': setPayslip(uri); break;
    }
  };

  const handleNext = () => {
    navigation.navigate('LoanDetails', { 
      biodata, 
      docs: { 
        idFront, 
        idBack, 
        selfie,
        bankStatement,
        payslip
      } 
    });
  };

  // Only require ID front, ID back, and selfie for navigation
  const canProceed = idFront && idBack && selfie;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: theme.textColor }]}>Document Upload</Text>
        <Text style={[styles.subtitle, { color: theme.textColor }]}>
          Please upload the required documents
        </Text>

        <View style={[styles.card, { backgroundColor: theme.cardBackgroundColor }]}>
          <Text style={[styles.cardTitle, { color: theme.textColor }]}>ID Card (Front) *</Text>
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
              {idFront ? 'Captured' : 'Capture'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBackgroundColor }]}>
          <Text style={[styles.cardTitle, { color: theme.textColor }]}>ID Card (Back) *</Text>
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
              {idBack ? 'Captured' : 'Capture'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBackgroundColor }]}>
          <Text style={[styles.cardTitle, { color: theme.textColor }]}>Selfie *</Text>
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
              {selfie ? 'Captured' : 'Capture'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBackgroundColor }]}>
          <Text style={[styles.cardTitle, { color: theme.textColor }]}>Bank Statement(s)</Text>
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
              {bankStatement ? 'Captured' : 'Capture'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBackgroundColor }]}>
          <Text style={[styles.cardTitle, { color: theme.textColor }]}>Payslip(s)</Text>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              { 
                backgroundColor: payslip ? theme.successColor : theme.primaryColor 
              }
            ]}
            onPress={() => handleCapture('payslip')}
          >
            <Text style={styles.buttonText}>
              {payslip ? 'Captured' : 'Capture'}
            </Text>
          </TouchableOpacity>
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
          disabled={!canProceed}
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
  platformInfo: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
    color: '#888',
  },
});