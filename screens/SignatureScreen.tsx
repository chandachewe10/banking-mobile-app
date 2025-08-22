import React, { useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Image as RNImage,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../theme';
import {signature} from '../api';

// @ts-ignore: Only available on web
import SignatureCanvas from 'react-signature-canvas';

export default function SignatureScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();
  const { email, token } = route.params;
  const [signatureUri, setSignatureUri] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const sigCanvasRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const isWeb = Platform.OS === 'web';

  const handleCaptureSignature = async () => {
    if (!isWeb) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setSignatureUri(result.assets[0].uri);
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
        try {
          const response = await signature(signatureUri, email, token);

          if (response.success) {
    
            const caseNumber = response.data.data.caseNumber
            console.log('Signature has been saved successfully: ', response.data);
    
            navigation.navigate('Confirmation', { email, token, caseNumber });
          } else {
            console.warn('saving signature details failed:', response.message);

          }
        } catch (err) {
          console.error('Error saving signature details:', err);

        } finally {
          setLoading(false);
        }
    
    
  };

  const isValid = agreed && !!signatureUri;

  const handleSaveWebSignature = () => {
    const dataUrl = sigCanvasRef.current?.getTrimmedCanvas().toDataURL('image/png');
    if (dataUrl) {
      setSignatureUri(dataUrl);
    }
  };

  const handleClearWebSignature = () => {
    sigCanvasRef.current?.clear();
    setSignatureUri(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.textColor }]}>Terms & Conditions</Text>

        <View style={[styles.termsBox, { borderColor: theme.borderColor }]}>
          <ScrollView style={styles.termsScroll}>
            <Text style={[styles.termsContent, { color: theme.textColor }]}>
              Welcome to Sentinel MDC. By submitting this application, you agree:
              {'\n\n'}1. We may verify your identity and credit information.
              {'\n\n'}2. To pay all fees, interest, and charges as outlined.
              {'\n\n'}3. That false information may lead to rejection.
              {'\n\n'}4. Your data will be processed per our Privacy Policy.
              {'\n\n'}5. You consent to electronic communications.
              {'\n\n'}Thank you for trusting us with your application.
            </Text>
          </ScrollView>
        </View>

        <View style={styles.termsContainer}>
          <TouchableOpacity
            style={[
              styles.checkbox,
              {
                borderColor: theme.primaryColor,
                backgroundColor: agreed ? theme.primaryColor : 'transparent',
              },
            ]}
            onPress={() => setAgreed(!agreed)}
          />
          <Text style={[styles.termsText, { color: theme.textColor }]}>
            I accept all Terms & Conditions
          </Text>
        </View>

        <View style={[styles.signatureBox, { borderColor: theme.borderColor }]}>
          {signatureUri ? (
            <RNImage source={{ uri: signatureUri }} style={styles.signatureImage} />
          ) : isWeb ? (
            <SignatureCanvas
              ref={sigCanvasRef}
              penColor="black"
              backgroundColor="white"
              canvasProps={{ width: 300, height: 200, className: 'sigCanvas' }}
            />
          ) : (
            <Text style={[styles.placeholder, { color: theme.textColor }]}>
              No signature captured
            </Text>
          )}
        </View>

        {isWeb ? (
          <>
            <TouchableOpacity
              style={[styles.captureButton, { backgroundColor: theme.primaryColor }]}
              onPress={handleSaveWebSignature}
            >
              <Text style={styles.buttonText}>Save Signature</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.captureButton, { backgroundColor: theme.dangerColor || 'red' }]}
              onPress={handleClearWebSignature}
            >
              <Text style={styles.buttonText}>Clear Signature</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.captureButton, { backgroundColor: theme.primaryColor }]}
            onPress={handleCaptureSignature}
          >
            <Text style={styles.buttonText}>
              {signatureUri ? 'Retake Signature' : 'Capture Signature'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: theme.successColor, opacity: isValid ? 1 : 0.6 },
          ]}
          onPress={handleSubmit}
          disabled={!isValid}
        >
          <Text style={styles.buttonText}>Submit Application</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  termsBox: {
    height: 200,
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 12,
    backgroundColor: '#FFF',
  },
  termsScroll: { padding: 10 },
  termsContent: { fontSize: 14, lineHeight: 20 },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  termsText: { fontSize: 14, flexShrink: 1 },
  signatureBox: {
    height: 200,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#FFF',
  },
  placeholder: { fontSize: 16 },
  signatureImage: { width: '100%', height: '100%', borderRadius: 8 },
  captureButton: {
    height: 48,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButton: {
    height: 48,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
