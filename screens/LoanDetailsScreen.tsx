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
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../theme';

export default function LoanDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();
  const { biodata, docs } = route.params || { biodata: {}, docs: {} };
  
  const [loanAmount, setLoanAmount] = useState('');
  const [loanPurpose, setLoanPurpose] = useState('');
  const [loanTenure, setLoanTenure] = useState('24');
  const [monthlyIncome, setMonthlyIncome] = useState('');

  // Constants for fees and interest
  const ARRANGEMENT_FEE_PERCENT = 0.04; // 4%
  const PROCESSING_FEE_PERCENT = 0.025; // 2.5%
  const INSURANCE_FEE_PERCENT = 0.045; // 4.5%
  const INTEREST_RATE_ANNUAL = 0.32; // 32% per annum

  const calculateSummary = () => {
    const amount = parseFloat(loanAmount) || 0;
    const tenure = parseInt(loanTenure, 10) || 0;
    const arrangementFee = amount * ARRANGEMENT_FEE_PERCENT;
    const processingFee = amount * PROCESSING_FEE_PERCENT;
    const insuranceFee = amount * INSURANCE_FEE_PERCENT;
    const totalFees = arrangementFee + processingFee + insuranceFee;
    const totalDisbursable = amount - totalFees;
    const principalMonthly = tenure > 0 ? amount / tenure : 0;
    const totalInterest = amount * INTEREST_RATE_ANNUAL * (tenure / 12);
    const monthlyInterest = tenure > 0 ? totalInterest / tenure : 0;
    const monthlyRepayment = principalMonthly + monthlyInterest;
    return {
      arrangementFee: arrangementFee.toFixed(2),
      processingFee: processingFee.toFixed(2),
      insuranceFee: insuranceFee.toFixed(2),
      totalFees: totalFees.toFixed(2),
      totalDisbursable: totalDisbursable.toFixed(2),
      monthlyRepayment: monthlyRepayment.toFixed(2),
    };
  };

  const handleNext = () => {
    const loanDetails = {
      amount: loanAmount,
      purpose: loanPurpose,
      tenure: loanTenure,
      monthlyIncome,
      summary: calculateSummary()
    };
    
    navigation.navigate('Signature', { 
      biodata, 
      docs, 
      loanDetails 
    });
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
          
          <Text style={styles.label}>Loan Amount (K) *</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="Enter amount in Kwacha"
            value={loanAmount}
            onChangeText={setLoanAmount}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Loan Purpose *</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="Enter loan purpose"
            value={loanPurpose}
            onChangeText={setLoanPurpose}
          />

          <Text style={styles.label}>Loan Tenure (Months)</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.borderColor }]}
            placeholder="24"
            value={loanTenure}
            onChangeText={setLoanTenure}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Monthly Income (K) *</Text>
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
              <Text style={styles.feeLabel}>Arrangement Fee (4%):</Text>
              <Text style={styles.feeValue}>K{parseFloat(summary.arrangementFee).toLocaleString()}</Text>
            </View>
            
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Processing Fee (2.5%):</Text>
              <Text style={styles.feeValue}>K{parseFloat(summary.processingFee).toLocaleString()}</Text>
            </View>
            
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Credit Life Insurance (4.5%):</Text>
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
});