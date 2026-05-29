import React, { useState } from 'react';
import Toast from 'react-native-toast-message';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  TouchableOpacity,
  Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';

import { useTheme } from '../theme';
import { loanDetails } from '../api';

export default function LoanDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();
  const { email, token } = route.params as { email: string; token: string };
  const [loading, setLoading] = useState(false);
  const [loanAmount, setLoanAmount] = useState('');
  const [loanPurpose, setLoanPurpose] = useState('');
  const [loanTenure, setLoanTenure] = useState('1');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [disbursementMethod, setDisbursementMethod] = useState('');

  // ── Fee constants — kept in sync with LoanCalculator.php on the backend ──
  const INTEREST_RATE_PA     = 32;    // 32 % per annum (stored as integer, not decimal)
  const ARRANGEMENT_RATE     = 0.04;  // 4 %
  const PROCESSING_RATE      = 0.025; // 2.5 %
  const CREDIT_LIFE_RATE     = 0.045; // 4.5 %
  const INSURANCE_LEVY       = 150;   // fixed K 150
  const CRB_FEE              = 50;    // fixed K 50
  const COLLATERAL_RATE      = 0.01;  // 1 %
  const DOCUMENTATION_RATE   = 0.005; // 0.5 %
  const ADMIN_RATE_PER_MONTH = 0.005; // 0.5 % of principal per month

  const r = (v: number) => Math.round(v * 100) / 100; // round to 2 d.p.

  const calculateSummary = () => {
    const amount = parseFloat(loanAmount) || 0;
    const tenure = parseInt(loanTenure, 10) || 0;

    // Upfront fees
    const arrangementFee     = r(amount * ARRANGEMENT_RATE);
    const processingFee      = r(amount * PROCESSING_RATE);
    const creditLifeFee      = r(amount * CREDIT_LIFE_RATE);
    const insuranceLevy      = INSURANCE_LEVY;
    const creditReferenceFee = CRB_FEE;
    const collateralFee      = r(amount * COLLATERAL_RATE);
    const documentationFee   = r(amount * DOCUMENTATION_RATE);
    const adminFeePerMonth   = r(amount * ADMIN_RATE_PER_MONTH);
    const totalAdminFees     = r(adminFeePerMonth * tenure);

    // Total displayed deductions (informational — shown to borrower)
    const totalUpfrontFees = arrangementFee + processingFee + creditLifeFee
                           + insuranceLevy + creditReferenceFee + collateralFee
                           + documentationFee + totalAdminFees;

    // Disbursed amount per spec: only 5 fees are physically deducted from the cash given
    // (arrangement + processing + credit life + credit reference + insurance levy)
    const disbursedAmount  = r(Math.max(0, amount - arrangementFee - processingFee
                             - creditLifeFee - creditReferenceFee - insuranceLevy));

    // Interest: 32 % per annum, simple interest over tenure months
    const totalInterest    = r(amount * (INTEREST_RATE_PA / 100) * (tenure / 12));
    const totalRepayable   = r(amount + totalInterest);
    const monthlyRepayment = tenure > 0 ? r(totalRepayable / tenure) : 0;

    return {
      arrangementFee:     arrangementFee.toFixed(2),
      processingFee:      processingFee.toFixed(2),
      creditLifeFee:      creditLifeFee.toFixed(2),
      insuranceLevy:      insuranceLevy.toFixed(2),
      creditReferenceFee: creditReferenceFee.toFixed(2),
      collateralFee:      collateralFee.toFixed(2),
      documentationFee:   documentationFee.toFixed(2),
      adminFeePerMonth:   adminFeePerMonth.toFixed(2),
      totalUpfrontFees:   totalUpfrontFees.toFixed(2),
      disbursedAmount:    disbursedAmount.toFixed(2),
      totalInterest:      totalInterest.toFixed(2),
      totalRepayable:     totalRepayable.toFixed(2),
      monthlyRepayment:   monthlyRepayment.toFixed(2),
    };
  };

  const handleNext = async () => {
    setLoading(true);
    
    try {
      const summary = calculateSummary();
      
      const response = await loanDetails(
        loanAmount,
        loanPurpose,
        INTEREST_RATE_PA.toString(),   // send as integer percentage e.g. "32"
        loanTenure,
        summary.arrangementFee,
        summary.processingFee,
        summary.creditLifeFee,         // was insuranceFee
        summary.totalInterest,
        summary.monthlyRepayment,
        summary.disbursedAmount,
        summary.totalRepayable,
        summary.creditLifeFee,
        summary.insuranceLevy,
        summary.creditReferenceFee,
        summary.collateralFee,
        summary.documentationFee,
        summary.adminFeePerMonth,
        disbursementMethod,
        email,
        token
      );

      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Loan details have been saved successfully'
        });
        console.log('Loan details have been saved successfully: ', response.data);
        (navigation as any).navigate('Signature', { email, token });
      } else {
        console.warn('Saving loan details failed:', response.message);
        Toast.show({
          type: 'error',
          text1: response.message || "Saving loan details failed"
        });
      }
    } catch (err) {
      console.error('Error saving loan details:', err);
      Toast.show({
        type: 'error',
        text1: "An error occurred while saving loan details"
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return loanAmount && loanPurpose && monthlyIncome && disbursementMethod;
  };

  const summary = calculateSummary();

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
          <View style={[styles.pickerContainer, { borderColor: theme.borderColor }]}>
            <Picker
              selectedValue={loanPurpose}
              onValueChange={(itemValue) => setLoanPurpose(itemValue)}
              style={styles.picker}
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
          <View style={[styles.pickerContainer, { borderColor: theme.borderColor }]}>
            <Picker
              selectedValue={loanTenure}
              onValueChange={(itemValue) => setLoanTenure(itemValue)}
              style={styles.picker}
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

          <Text style={styles.label}>Preferred Disbursement Method <Text style={styles.required}>*</Text></Text>
          <View style={[styles.pickerContainer, { borderColor: theme.borderColor }]}>
            <Picker
              selectedValue={disbursementMethod}
              onValueChange={(v) => setDisbursementMethod(v)}
              style={styles.picker}
              dropdownIconColor={theme.textColor}
            >
              <Picker.Item label="Select disbursement method" value="" />
              <Picker.Item label="Electronic Funds Transfer (EFT)" value="EFT" />
              <Picker.Item label="Mobile Money" value="Mobile Money" />
            </Picker>
          </View>
        </View>

        {loanAmount && (
          <View style={[styles.card, { backgroundColor: theme.cardBackgroundColor }]}>
            <Text style={[styles.cardTitle, { color: theme.textColor }]}>Loan Summary</Text>

            {/* ── Loan basics ── */}
            <FeeRow label="Loan Amount" value={loanAmount} />
            <FeeRow label={`Interest (${INTEREST_RATE_PA}% p.a.)`} value={summary.totalInterest} />

            {/* ── Upfront deduction fees ── */}
            <View style={styles.sectionDivider}>
              <Text style={styles.sectionDividerText}>Upfront Deduction Fees</Text>
            </View>
            <FeeRow label="Arrangement Fee (4%)"              value={summary.arrangementFee} />
            <FeeRow label="Processing Fee (2.5%)"             value={summary.processingFee} />
            <FeeRow label="Credit Life Insurance (4.5%)"      value={summary.creditLifeFee} />
            <FeeRow label="Insurance Levy (Fixed)"            value={summary.insuranceLevy} />
            <FeeRow label="Credit Reference Bureau Fee (Fixed)" value={summary.creditReferenceFee} />
            <FeeRow label="Collateral Appraisal Fee (1%)"    value={summary.collateralFee} />
            <FeeRow label="Documentation Fee (0.5%)"          value={summary.documentationFee} />
            <FeeRow label="Admin Fee / Month (0.5%)"          value={summary.adminFeePerMonth} />
            <FeeRow label="Total Upfront Deductions"          value={summary.totalUpfrontFees} bold />

            {/* ── Totals ── */}
            <View style={styles.sectionDivider}>
              <Text style={styles.sectionDividerText}>Repayment Summary</Text>
            </View>
            <FeeRow label="Disbursed Amount"  value={summary.disbursedAmount} />
            <FeeRow label="Total Repayable"   value={summary.totalRepayable} />

            <View style={[styles.feeRow, styles.totalRow]}>
              <Text style={[styles.feeLabel, styles.totalLabel]}>Monthly Repayment:</Text>
              <Text style={[styles.feeValue, styles.totalValue]}>
                K{parseFloat(summary.monthlyRepayment).toLocaleString()}
              </Text>
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Lightweight row component — avoids inline object creation on every render
function FeeRow({ label, value, bold = false }: { label: string; value: string | number; bold?: boolean }) {
  const numVal = typeof value === 'string' ? parseFloat(value) : value;
  return (
    <View style={feeRowStyle}>
      <Text style={[feeRowLabelStyle, bold && { fontWeight: '700' }]}>{label}:</Text>
      <Text style={[feeRowValueStyle, bold && { fontWeight: '700' }]}>
        K{isNaN(numVal) ? '0.00' : numVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </Text>
    </View>
  );
}
const feeRowStyle      = { flexDirection: 'row' as const, justifyContent: 'space-between' as const, marginBottom: 6 };
const feeRowLabelStyle = { fontSize: 13, color: '#555', flex: 1 };
const feeRowValueStyle = { fontSize: 13, fontWeight: '500' as const, textAlign: 'right' as const };

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
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  picker: {
    height: 50,
    paddingHorizontal: 8,
    color: '#000000',
  },
  required: {
    color: 'red',
  },
  sectionDivider: {
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 10,
    marginBottom: 8,
  },
  sectionDividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});