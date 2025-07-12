import React, { useRef, useState } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Alert 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SignatureCanvas from 'react-native-signature-canvas';

export default function SignatureScreen() {
  const navigation = useNavigation();
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const ref = useRef<any>(null);

  const handleOK = (signature: string) => {
    // This is a base64-encoded PNG image
    setSignatureData(signature);
    Alert.alert("Signature Captured");
  };

  const handleClear = () => {
    ref.current?.clearSignature();
  };

  const handleConfirm = () => {
    if (signatureData) {
      navigation.navigate('NextScreen', { signature: signatureData });
    } else {
      Alert.alert("No signature", "Please provide your signature.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.signatureWrapper}>
        <SignatureCanvas
          ref={ref}
          onOK={handleOK}
          descriptionText="Sign below"
          clearText="Clear"
          confirmText="Save"
          webStyle={`.m-signature-pad--footer { display: none; margin: 0px; }`}
        />
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={handleClear}>
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleConfirm}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  signatureWrapper: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    margin: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007BFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
