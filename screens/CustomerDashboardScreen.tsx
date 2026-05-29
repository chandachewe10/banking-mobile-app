import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../theme';
import { applicationStatus } from '../api';

const STEP_ROUTES: Record<string, string> = {
  biodata: 'Biodata',
  documents: 'DocumentUpload',
  loan_details: 'LoanDetails',
};

const STEP_LABELS: Record<string, string> = {
  biodata: 'Personal Details',
  documents: 'Document Upload',
  loan_details: 'Loan Details',
};

const DOC_LABELS: Record<string, string> = {
  id_front: 'ID Card (Front)',
  id_back: 'ID Card (Back)',
  selfie: 'Live Selfie',
  bank_statement: 'Bank Statement',
  payslip1: 'Payslip 1',
  payslip2: 'Payslip 2',
  payslip3: 'Payslip 3',
};

const POLL_INTERVAL_MS = 20000;

function money(value: any): string {
  const n = Number(value);
  if (!value || isNaN(n)) return 'K0.00';
  return `K${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CustomerDashboardScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const theme = useTheme();
  const { email, mobile, token } = route.params as {
    email: string; mobile?: string; token: string;
  };

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = useCallback(async (silent = false) => {
    try {
      const res = await applicationStatus(token);
      if (res.success) {
        setData(res.data);
      } else if (!silent) {
        Toast.show({ type: 'error', text1: 'Could not load status', text2: res.message });
      }
    } catch {
      if (!silent) Toast.show({ type: 'error', text1: 'Network error', text2: 'Please try again.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  // Refetch every time the screen is focused, and poll while focused (real-time)
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      fetchStatus();
      const interval = setInterval(() => {
        if (mounted) fetchStatus(true);
      }, POLL_INTERVAL_MS);
      return () => {
        mounted = false;
        clearInterval(interval);
      };
    }, [fetchStatus])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStatus(true);
  }, [fetchStatus]);

  const statusColor = (key?: string): string => {
    switch (key) {
      case 'approved': return theme.successColor;
      case 'rejected': return theme.errorColor;
      case 'in_review': return theme.infoColor;
      case 'incomplete': return theme.warningColor;
      default: return theme.secondaryColor;
    }
  };

  const stageVisual = (state: string) => {
    switch (state) {
      case 'completed': return { icon: '✓', color: theme.successColor };
      case 'current':   return { icon: '•', color: theme.infoColor };
      case 'rejected':  return { icon: '✕', color: theme.errorColor };
      default:          return { icon: '', color: theme.borderColor };
    }
  };

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={theme.primaryColor} />
        <Text style={[styles.loadingText, { color: theme.textColor }]}>Loading your dashboard...</Text>
      </SafeAreaView>
    );
  }

  const borrower = data?.borrower ?? {};
  const loan = data?.loan ?? null;
  const pipeline: any[] = data?.pipeline ?? [];
  const uploadedDocs: Record<string, boolean> = data?.uploaded_documents ?? {};
  const step = data?.step ?? 'biodata';
  const isComplete = step === 'completed';
  const fullName = `${borrower.first_name ?? ''} ${borrower.last_name ?? ''}`.trim() || 'Customer';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        removeClippedSubviews={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primaryColor]} tintColor={theme.primaryColor} />
        }
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.primaryColor }]}>
          <Text style={styles.headerHello}>Welcome back,</Text>
          <Text style={styles.headerName}>{fullName}</Text>
          {data?.case_number ? (
            <Text style={styles.headerCase}>Reference: KYC-{data.case_number}</Text>
          ) : null}
        </View>

        {/* Overall status banner */}
        <View style={[styles.card, { backgroundColor: theme.cardBackgroundColor }]}>
          <Text style={[styles.cardLabel, { color: theme.textColor }]}>Application Status</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor(data?.overall_status) }]}>
            <Text style={styles.statusBadgeText}>{data?.status_label ?? 'Pending'}</Text>
          </View>
          {data?.status_message ? (
            <Text style={[styles.statusMessage, { color: theme.textColor }]}>{data.status_message}</Text>
          ) : null}
          <Text style={styles.refreshHint}>Pull down to refresh • Updates automatically</Text>
        </View>

        {/* Continue application if incomplete */}
        {!isComplete && (
          <View style={[styles.card, { backgroundColor: theme.cardBackgroundColor }]}>
            <Text style={[styles.cardTitle, { color: theme.textColor }]}>Finish Your Application</Text>
            <Text style={[styles.cardBody, { color: theme.textColor }]}>
              You still need to complete: <Text style={{ fontWeight: 'bold' }}>{STEP_LABELS[step] ?? step}</Text>
            </Text>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.primaryColor }]}
              onPress={() => navigation.navigate(STEP_ROUTES[step] ?? 'Biodata', { email, mobile, token })}
            >
              <Text style={styles.primaryButtonText}>Continue Application</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Approval pipeline */}
        {loan && (
          <View style={[styles.card, { backgroundColor: theme.cardBackgroundColor }]}>
            <Text style={[styles.cardTitle, { color: theme.textColor }]}>Approval Progress</Text>
            {pipeline.map((stage, idx) => {
              const visual = stageVisual(stage.state);
              const isLast = idx === pipeline.length - 1;
              return (
                <View key={stage.key} style={styles.timelineRow}>
                  <View style={styles.timelineLeft}>
                    <View style={[styles.timelineDot, { backgroundColor: visual.color }]}>
                      <Text style={styles.timelineDotIcon}>{visual.icon}</Text>
                    </View>
                    {!isLast && <View style={[styles.timelineLine, { backgroundColor: theme.borderColor }]} />}
                  </View>
                  <View style={styles.timelineBody}>
                    <Text style={[styles.timelineTitle, { color: theme.textColor }]}>{stage.title}</Text>
                    <Text style={[styles.timelineState, { color: visual.color }]}>
                      {stage.state === 'completed' ? 'Approved'
                        : stage.state === 'current' ? 'In progress'
                        : stage.state === 'rejected' ? 'Rejected'
                        : 'Pending'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Loan summary */}
        {loan && (
          <View style={[styles.card, { backgroundColor: theme.cardBackgroundColor }]}>
            <Text style={[styles.cardTitle, { color: theme.textColor }]}>Loan Summary</Text>
            <Row label="Loan Amount" value={money(loan.principal_amount)} theme={theme} />
            <Row label="Purpose" value={loan.loan_purpose ?? '—'} theme={theme} />
            <Row label="Tenure" value={loan.duration_period ?? `${loan.loan_duration ?? '—'}`} theme={theme} />
            <Row label="Interest Rate" value={loan.interest_rate ? `${loan.interest_rate}% p.a.` : '—'} theme={theme} />
            <Row label="Monthly Repayment" value={money(loan.monthly_repayment)} theme={theme} />
            <Row label="Disbursed Amount" value={money(loan.disbursed_amount)} theme={theme} />
            <Row label="Total Repayable" value={money(loan.total_repayment)} theme={theme} />
            <Row label="Disbursement" value={loan.disbursement_method ?? '—'} theme={theme} />
            {loan.loan_number ? <Row label="Loan Number" value={String(loan.loan_number)} theme={theme} /> : null}
          </View>
        )}

        {/* Documents checklist */}
        <View style={[styles.card, { backgroundColor: theme.cardBackgroundColor }]}>
          <Text style={[styles.cardTitle, { color: theme.textColor }]}>Documents</Text>
          {Object.keys(DOC_LABELS).map((key) => {
            const done = uploadedDocs[key];
            return (
              <View key={key} style={styles.docRow}>
                <Text style={[styles.docIcon, { color: done ? theme.successColor : theme.borderColor }]}>
                  {done ? '✓' : '○'}
                </Text>
                <Text style={[styles.docLabel, { color: theme.textColor }]}>{DOC_LABELS[key]}</Text>
                <Text style={[styles.docStatus, { color: done ? theme.successColor : theme.warningColor }]}>
                  {done ? 'Uploaded' : 'Missing'}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: theme.borderColor }]}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] })}
        >
          <Text style={[styles.logoutText, { color: theme.errorColor }]}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, theme }: { label: string; value: string; theme: any }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, { color: theme.textColor }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: theme.textColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9F9F9' },
  loadingText: { marginTop: 16, fontSize: 15 },
  content: { padding: 16, paddingBottom: 40 },
  header: {
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
  },
  headerHello: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  headerName: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginTop: 2 },
  headerCase: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 8 },
  card: {
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLabel: { fontSize: 13, opacity: 0.7, marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 14 },
  cardBody: { fontSize: 14, lineHeight: 21, marginBottom: 14 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  statusBadgeText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  statusMessage: { fontSize: 14, lineHeight: 21, marginTop: 12 },
  refreshHint: { fontSize: 11, color: '#999', marginTop: 12, fontStyle: 'italic' },
  primaryButton: { height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  // Timeline
  timelineRow: { flexDirection: 'row' },
  timelineLeft: { alignItems: 'center', width: 36 },
  timelineDot: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  timelineDotIcon: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  timelineLine: { width: 2, flex: 1, minHeight: 26, marginVertical: 2 },
  timelineBody: { flex: 1, paddingBottom: 18, paddingLeft: 6 },
  timelineTitle: { fontSize: 15, fontWeight: '600' },
  timelineState: { fontSize: 13, marginTop: 2 },
  // Summary
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#EEE' },
  summaryLabel: { fontSize: 14, opacity: 0.75, flex: 1 },
  summaryValue: { fontSize: 14, fontWeight: '600', textAlign: 'right', flex: 1 },
  // Docs
  docRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  docIcon: { fontSize: 18, width: 26 },
  docLabel: { fontSize: 14, flex: 1 },
  docStatus: { fontSize: 13, fontWeight: '600' },
  // Logout
  logoutButton: { height: 48, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  logoutText: { fontSize: 15, fontWeight: '600' },
});
