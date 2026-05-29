import React, { useRef, useState } from "react";
import Toast from 'react-native-toast-message';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image as RNImage,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../theme";
import { signature } from "../api";

// Web signature pad
// @ts-ignore
import SignatureCanvas from "react-signature-canvas";
// Native signature pad
import Signature from "react-native-signature-canvas";

export default function SignatureScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();
  const { email, token } = route.params;
  const [signatureUri, setSignatureUri] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const sigCanvasRef = useRef<any>(null);
  const signatureRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const isWeb = Platform.OS === "web";
  const isAndroid = Platform.OS === "android";

  // Use most of the screen for signature
  const screenHeight = Dimensions.get("window").height;
  const signaturePadHeight = Math.max(300, screenHeight * 0.6);

  /** --- Handlers --- **/
  const handleSubmit = async () => {
    if (!termsAccepted) {
      Toast.show({ type: 'error', text1: 'Please accept the Terms & Conditions first' });
      return;
    }
    if (!signatureUri) {
      Toast.show({
        type: 'error',
        text1: "Please provide a signature first"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await signature(signatureUri, email, token);

      if (response.success) {
        Toast.show({
          type: 'success',
          text1: "Signature has been saved successfully"
        });
        const caseNumber = response.data.data.caseNumber;
        navigation.navigate("Confirmation", { email, token, caseNumber });
      } else {
        Toast.show({
          type: 'error',
          text1: response.message || "Signature saving failed"
        });
      }
    } catch (err) {
      console.error("Error saving signature");
      Toast.show({
        type: 'error',
        text1: "An error occurred while saving signature"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWebSignature = () => {
    const dataUrl = sigCanvasRef.current
      ?.getTrimmedCanvas()
      .toDataURL("image/png");
    if (dataUrl) {
      setSignatureUri(dataUrl);
      setScrollEnabled(true);
      Toast.show({
        type: 'success',
        text1: "Signature saved"
      });
    }
  };

  const handleClearWebSignature = () => {
    sigCanvasRef.current?.clear();
    setSignatureUri(null);
  };

  // Native signature handlers
  const handleOK = (sig: string) => {
    console.log("Signature saved as base64");
    setSignatureUri(sig);
    setScrollEnabled(true);
    Toast.show({
      type: 'success',
      text1: "Signature saved"
    });
  };

  const handleClearNative = () => {
    setSignatureUri(null);
  };

  // Custom clear function for Android
  const handleAndroidClear = () => {
    if (signatureRef.current) {
      signatureRef.current.clearSignature();
      setSignatureUri(null);
    }
  };

  // Custom save function for Android
  const handleAndroidSave = () => {
    if (signatureRef.current) {
      signatureRef.current.readSignature();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={scrollEnabled}
        removeClippedSubviews={false}
      >
        {/* Simple header */}
        <Text style={[styles.title, { color: theme.textColor }]}>
          Terms &amp; Conditions
        </Text>

        {/* Terms & Conditions declaration */}
        <View style={[styles.termsBox, { borderColor: theme.borderColor, backgroundColor: theme.cardBackgroundColor || '#F9F9F9' }]}>
          <Text style={[styles.termsHeading, { color: theme.textColor }]}>By signing below, I confirm that:</Text>
          {[
            'I authorise the bank to store and process my data for KYC compliance.',
            'I agree to be contacted via email/SMS for verification purposes.',
            'Submission of this application does not guarantee loan approval.',
            'This information is only indicative and a separate loan agreement will be signed after approval based on the approved amount and the bank\'s specific terms.',
            'I certify that all information provided is accurate and complete.',
          ].map((clause, i) => (
            <Text key={i} style={[styles.termsClauses, { color: theme.textColor }]}>• {clause}</Text>
          ))}

          {/* Checkbox */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setTermsAccepted(!termsAccepted)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, {
              borderColor: theme.primaryColor,
              backgroundColor: termsAccepted ? theme.primaryColor : 'transparent',
            }]}>
              {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.checkboxLabel, { color: theme.textColor }]}>
              I agree to the Terms &amp; Conditions
            </Text>
          </TouchableOpacity>
        </View>

        {/* Signature Area */}
        <Text style={[styles.title, { color: theme.textColor, marginTop: 20 }]}>
          E-Signature
        </Text>

        {/* Signature Area - Takes most of the screen */}
        <View
          style={[
            styles.signatureBox,
            { 
              borderColor: theme.borderColor, 
              height: signaturePadHeight,
              backgroundColor: "#FFF"
            },
          ]}
        >
          {signatureUri ? (
            <RNImage
              source={{ uri: signatureUri }}
              style={styles.signatureImage}
              resizeMode="contain"
            />
          ) : isWeb ? (
            <SignatureCanvas
              ref={sigCanvasRef}
              penColor="black"
              backgroundColor="white"
              onBegin={() => setScrollEnabled(false)}
              onEnd={() => setScrollEnabled(true)}
              canvasProps={{
                width: Dimensions.get("window").width - 40,
                height: signaturePadHeight - 20,
                className: "sigCanvas",
              }}
            />
          ) : (
            <Signature
              ref={signatureRef}
              onOK={handleOK}
              onClear={handleClearNative}
              onBegin={() => setScrollEnabled(false)}
              onEnd={() => setScrollEnabled(true)}
              descriptionText="Sign in the box"
              clearText=""
              confirmText=""
              autoClear={false}
              imageType="image/png"
              style={{ 
                flex: 1,
                backgroundColor: "#FFF",
              }}
              webStyle={`.m-signature-pad {box-shadow: none; border: none; margin: 0;}`}
            />
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {/* Clear Button */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: theme.warningColor || "#FF3B30" },
            ]}
            onPress={isWeb ? handleClearWebSignature : handleAndroidClear}
            disabled={!!signatureUri}
          >
            <Text style={styles.buttonText}>Clear</Text>
          </TouchableOpacity>

          {/* Save Button (only show if no signature yet) */}
          {!signatureUri && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.primaryColor },
              ]}
              onPress={isWeb ? handleSaveWebSignature : handleAndroidSave}
            >
              <Text style={styles.buttonText}>Save Signature</Text>
            </TouchableOpacity>
          )}

          {/* Submit Button (only show after signature is saved) */}
          {signatureUri && (
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: termsAccepted ? theme.successColor : '#AAA' },
              ]}
              onPress={handleSubmit}
              disabled={loading || !termsAccepted}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Submit Application</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Instructions */}
        <Text style={[styles.instruction, { color: theme.textColor }]}>
          {signatureUri 
            ? "Signature saved. Press 'Submit Application' to continue."
            : "Draw your signature in the box above, then press 'Save Signature'"
          }
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

/** --- Styles --- **/
const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  content: { 
    padding: 20,
    paddingBottom: 40,
  },
  termsBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    marginBottom: 8,
  },
  termsHeading: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 10,
  },
  termsClauses: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 6,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  title: { 
    fontSize: 22, 
    fontWeight: "bold", 
    marginBottom: 20,
    textAlign: "center",
  },
  signatureBox: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 8,
    marginBottom: 20,
    overflow: "hidden",
  },
  signatureImage: { 
    width: "100%", 
    height: "100%", 
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: { 
    color: "#FFF", 
    fontSize: 16, 
    fontWeight: "bold" 
  },
  instruction: {
    textAlign: "center",
    fontSize: 14,
    marginTop: 10,
  },
});