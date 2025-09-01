import React, { useState } from 'react';
import { toast } from "sonner-native";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';

import { useTheme } from '../theme';
import { loanDetails } from '../api';

export default function LoanDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();
  const { email, token } = route.params;
  const [loading, setLoading] = useState(false);
  const [loanAmount, setLoanAmount] = useState('');
  const [loanPurpose, setLoanPurpose] = useState('');
  const [loanTenure, setLoanTenure] = useState('1');
  const [monthlyIncome, setMonthlyIncome] = useState('');

  // Constants for fees and interest
  const ARRANGEMENT_FEE_PERCENT = 0.04;
  const PROCESSING_FEE_PERCENT = 0.025;
  const INSURANCE_FEE_PERCENT = 0.045;
  const INTEREST_RATE_MONTHLY = 0.32;

  const calculateSummary = () => {
    const amount = parseFloat(loanAmount) || 0;
    const tenure = parseInt(loanTenure, 10) || 0;
    const arrangementFee = amount * ARRANGEMENT_FEE_PERCENT;
    const processingFee = amount * PROCESSING_FEE_PERCENT;
    const insuranceFee = amount * INSURANCE_FEE_PERCENT;
    const totalFees = processingFee + arrangementFee + insuranceFee;
    const totalDisbursable = amount - totalFees;
    const principalMonthly = tenure > 0 ? amount / tenure : 0;
    const totalInterest = amount * INTEREST_RATE_MONTHLY * tenure;
    const monthlyInterest = tenure > 0 ? totalInterest / tenure : 0;
    const monthlyRepayment = principalMonthly + monthlyInterest;
    
    return {
      arrangementFee: arrangementFee.toFixed(2),
      processingFee: processingFee.toFixed(2),
      insuranceFee: insuranceFee.toFixed(2),
      totalFees: totalFees.toFixed(2),
      totalDisbursable: totalDisbursable.toFixed(2),
      monthlyRepayment: monthlyRepayment.toFixed(2),
      totalInterest: totalInterest.toFixed(2)
    };
  };

  const handleNext = async () => {
    setLoading(true);
    
    try {
      const summary = calculateSummary();
      
      const response = await loanDetails(
        loanAmount, 
        loanPurpose, 
        INTEREST_RATE_MONTHLY.toString(), 
        loanTenure, 
        summary.arrangementFee,
        summary.processingFee,
        summary.insuranceFee,
        summary.totalInterest,
        email, 
        token
      );

      if (response.success) {
        toast.success('Loan details have been saved successfully');
        console.log('Loan details have been saved successfully: ', response.data);
        navigation.navigate('Signature', { email, token });
      } else {
        console.warn('Saving loan details failed:', response.message);
        toast.error(response.message || "Saving loan details failed");
      }
    } catch (err) {
      console.error('Error saving loan details:', err);
      toast.error("An error occurred while saving loan details");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return loanAmount && loanPurpose && monthlyIncome;
  };

  const summary = calculateSummary();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: theme.textColor }]}>Loan Details</Text>
        <Text style={[styles.subtitle, { color: theme.textColor }]}>
          Please provide your loan requirements
        </Text>

        <View style={[styles.card, { backgroundColor: theme.cardBackgroundColor }]}>
          <Text style={[styles.cardTitle, { color: theme.textColor }]}>Loan Information</Text>

          <Text style={styles.label}>Loan Amount (K) <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="Enter amount in Kwacha"
            value={loanAmount}
            onChangeText={setLoanAmount}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Loan Purpose <Text style={styles.required}>*</Text></Text>
          <View>
            <Picker
              selectedValue={loanPurpose}
              onValueChange={(itemValue) => setLoanPurpose(itemValue)}
              style={[styles.input]}
              dropdownIconColor={theme.textColor}
            >
              <Picker.Item label="Select loan purpose" value="" />
              <Picker.Item label="Business Loan" value="Business Loan" />
              <Picker.Item label="Consumer Loan" value="Consumer Loan" />
              <Picker.Item label="Agri Loan" value="Agri Loan" />
              <Picker.Item label="Scheme Loan" value="Scheme Loan" />
              <Picker.Item label="Public Sector Staff Loan" value="Public Sector Staff Loan" />
              <Picker.Item label="Gadget Finance Loan" value="Gadget Finance Loan" />
              <Picker.Item label="Solar Loan" value="Solar Loan" />
            </Picker>
          </View>

          <Text style={styles.label}>Loan Tenure (Months) <Text style={styles.required}>*</Text></Text>
          <View>
            <Picker
              selectedValue={loanTenure}
              onValueChange={(itemValue) => setLoanTenure(itemValue)}
              style={styles.input}
              dropdownIconColor={theme.textColor}
            >
              <Picker.Item label="Select tenure" value="" />
              <Picker.Item label="3 Months" value="3" />
              <Picker.Item label="6 Months" value="6" />
              <Picker.Item label="12 Months" value="12" />
              <Picker.Item label="24 Months" value="24" />
              <Picker.Item label="36 Months" value="36" />
              <Picker.Item label="48 Months" value="48" />
              <Picker.Item label="60 Months" value="60" />
              <Picker.Item label="72 Months" value="72" />
              <Picker.Item label="84 Months" value="84" />
            </Picker>
          </View>

          <Text style={styles.label}>Monthly Income (K) <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="Enter monthly income in Kwacha"
            value={monthlyIncome}
            onChangeText={setMonthlyIncome}
            keyboardType="numeric"
          />
        </View>

        {loanAmount && (
          <View style={[styles.card, { backgroundColor: theme.cardBackgroundColor }]}>
            <Text style={[styles.cardTitle, { color: theme.textColor }]}>Fee Summary</Text>

            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Loan Amount:</Text>
              <Text style={styles.feeValue}>K{parseFloat(loanAmount).toLocaleString()}</Text>
            </View>

            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Interest Amount:</Text>
              <Text style={styles.feeValue}>K{parseFloat(summary.totalInterest).toLocaleString()}</Text>
            </View>

            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Arrangement Fee (4%):</Text>
              <Text style={styles.feeValue}>K{parseFloat(summary.arrangementFee).toLocaleString()}</Text>
            </View>

            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Processing Fee (2.5%):</Text>
              <Text style={styles.feeValue}>K{parseFloat(summary.processingFee).toLocaleString()}</Text>
            </View>

            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Insurance (4.5%):</Text>
              <Text style={styles.feeValue}>K{parseFloat(summary.insuranceFee).toLocaleString()}</Text>
            </View>

            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Total Fees:</Text>
              <Text style={styles.feeValue}>K{parseFloat(summary.totalFees).toLocaleString()}</Text>
            </View>

            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Total Disbursable Amount:</Text>
              <Text style={styles.feeValue}>K{parseFloat(summary.totalDisbursable).toLocaleString()}</Text>
            </View>

            <View style={[styles.feeRow, styles.totalRow]}>
              <Text style={[styles.feeLabel, styles.totalLabel]}>Monthly Repayment:</Text>
              <Text style={[styles.feeValue, styles.totalValue]}>K{parseFloat(summary.monthlyRepayment).toLocaleString()}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: theme.primaryColor,
              opacity: isFormValid() ? 1 : 0.7
            }
          ]}
          onPress={handleNext}
          disabled={!isFormValid() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Next</Text>
          )}
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
  
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  feeLabel: {
    fontSize: 14,
    color: '#666',
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  totalValue: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#FF5733',
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
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  required: {
  color: 'red',
},
});