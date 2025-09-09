import React, { useRef, useState } from "react";
import { toast } from "sonner-native";
import Toast from 'react-native-toast-message';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image as RNImage,
  ActivityIndicator,
  Dimensions,
} from "react-native";
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
      <View style={styles.content}>
        {/* Simple header */}
        <Text style={[styles.title, { color: theme.textColor }]}>
          Please Sign Below
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
                { backgroundColor: theme.successColor },
              ]}
              onPress={handleSubmit}
              disabled={loading}
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
      </View>
    </SafeAreaView>
  );
}

/** --- Styles --- **/
const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  content: { 
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
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