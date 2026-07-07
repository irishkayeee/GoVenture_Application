/**
 * PaymentDetailModal.tsx
 * Full-screen detail view for a single payment record — amount breakdown,
 * method/status badges, and a "Mark as Fully Paid" action for payments that
 * are still Pending, Partial, or Overdue.
 */

import React, { useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { C as LIGHT_C } from '../dashboard/theme';
import { useAppTheme, ColorPalette } from '../ThemeContext';
import { Payment, PaymentStatus, PaymentMethod, formatPeso2 } from './mockData';

const STATUS_STYLE: Record<PaymentStatus, { bg: string; color: string }> = {
  Pending:     { bg: '#FFF5E0', color: '#B8922E' },
  'Fully Paid': { bg: '#E7F9F3', color: '#12946F' },
  Partial:     { bg: '#EAF1FB', color: LIGHT_C.info },
  Overdue:     { bg: '#FDEAEA', color: LIGHT_C.danger },
};
const METHOD_STYLE: Record<PaymentMethod, { bg: string }> = {
  GCash:           { bg: '#1D6FB8' },
  Maya:            { bg: '#0C6B4F' },
  'Bank Transfer': { bg: '#5B21A6' },
};

const BackIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M15 19l-7-7 7-7" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const CheckIcon = () => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const InfoTile = ({ label, children, pd }: { label: string; children: React.ReactNode; pd: ReturnType<typeof makeStyles> }) => (
  <View style={pd.tile}>
    <Text style={pd.tileLabel}>{label}</Text>
    {children}
  </View>
);

type Props = {
  visible:   boolean;
  payment:   Payment | null;
  onClose:   () => void;
  onMarkPaid: (id: string) => void;
};

export default function PaymentDetailModal({ visible, payment, onClose, onMarkPaid }: Props) {
  const { C } = useAppTheme();
  const pd = useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  if (!payment) return null;

  const st = STATUS_STYLE[payment.status];
  const mt = METHOD_STYLE[payment.method];
  const paidAmount = payment.totalAmount - payment.balance;
  const isSettled = payment.status === 'Fully Paid';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={pd.safe}>
        <LinearGradient colors={['#6B2E10', '#B85F17', '#D17B2E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[pd.header, { paddingTop: insets.top + 14 }]}>
          <TouchableOpacity style={pd.backBtn} activeOpacity={0.85} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={pd.headerTitle}>{payment.bookingId}</Text>
          <Text style={pd.headerSub}>{payment.clientName} · {payment.tourPackage}</Text>
        </LinearGradient>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={pd.body}>
          <View style={pd.amountCard}>
            <Text style={pd.amountLabel}>Total Amount</Text>
            <Text style={pd.amountBig}>{formatPeso2(payment.totalAmount)}</Text>
            <View style={pd.amountRow}>
              <View>
                <Text style={pd.amountSubLabel}>Paid</Text>
                <Text style={[pd.amountSubValue, { color: '#12946F' }]}>{formatPeso2(paidAmount)}</Text>
              </View>
              <View>
                <Text style={pd.amountSubLabel}>Balance</Text>
                <Text style={[pd.amountSubValue, { color: payment.balance > 0 ? C.danger : '#12946F' }]}>{formatPeso2(payment.balance)}</Text>
              </View>
            </View>
          </View>

          <Text style={pd.sectionLabel}>PAYMENT INFO</Text>
          <View style={pd.grid}>
            <InfoTile label="BOOKING ID" pd={pd}>
              <Text style={pd.tileValue}>{payment.bookingId}</Text>
            </InfoTile>
            <InfoTile label="STATUS" pd={pd}>
              <View style={[pd.badge, { backgroundColor: st.bg, alignSelf: 'flex-start' }]}>
                <Text style={[pd.badgeText, { color: st.color }]}>{payment.status}</Text>
              </View>
            </InfoTile>
            <InfoTile label="METHOD" pd={pd}>
              <View style={[pd.badge, { backgroundColor: mt.bg, alignSelf: 'flex-start' }]}>
                <Text style={[pd.badgeText, { color: '#FFFFFF' }]}>{payment.method}</Text>
              </View>
            </InfoTile>
            <InfoTile label="DATE" pd={pd}>
              <Text style={pd.tileValue}>{payment.date}</Text>
            </InfoTile>
          </View>

          <Text style={pd.sectionLabel}>CLIENT</Text>
          <View style={pd.clientCard}>
            <View style={pd.avatar}><Text style={pd.avatarText}>{payment.initials}</Text></View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={pd.clientName}>{payment.clientName}</Text>
              <Text style={pd.clientTour} numberOfLines={1}>{payment.tourPackage}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={[pd.footer, { paddingBottom: insets.bottom + 14 }]}>
          <TouchableOpacity
            style={[pd.markBtn, isSettled && pd.markBtnDisabled]}
            activeOpacity={0.85}
            disabled={isSettled}
            onPress={() => { onMarkPaid(payment.id); onClose(); }}
          >
            <CheckIcon />
            <Text style={pd.markBtnText}>{isSettled ? 'Fully Paid' : 'Mark as Fully Paid'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (C: ColorPalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.lightBg },
  header: { paddingBottom: 18, paddingHorizontal: 20 },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  headerTitle: { fontSize: 19, fontWeight: '900', color: '#FFFFFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 3 },

  body: { padding: 16, paddingBottom: 24 },
  amountCard: {
    backgroundColor: C.cardBg, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.divider,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1 },
    }),
  },
  amountLabel: { fontSize: 11, color: C.brownMid, opacity: 0.7 },
  amountBig: { fontSize: 26, fontWeight: '900', color: C.brown, marginTop: 2 },
  amountRow: { flexDirection: 'row', gap: 28, marginTop: 14 },
  amountSubLabel: { fontSize: 10, color: C.brownMid, opacity: 0.6, fontWeight: '700' },
  amountSubValue: { fontSize: 14, fontWeight: '900', marginTop: 2 },

  sectionLabel: { fontSize: 10.5, fontWeight: '800', color: C.brownMid, opacity: 0.65, letterSpacing: 0.6, marginBottom: 8, marginTop: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { flexBasis: '47%', flexGrow: 1, backgroundColor: C.cardBg, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.divider },
  tileLabel: { fontSize: 8.5, fontWeight: '800', color: C.brownMid, opacity: 0.6, letterSpacing: 0.5, marginBottom: 6 },
  tileValue: { fontSize: 12.5, fontWeight: '700', color: C.brown },
  badge: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  badgeText: { fontSize: 10.5, fontWeight: '800' },

  clientCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.cardBg, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: C.divider,
  },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.amber, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  clientName: { fontSize: 13.5, fontWeight: '800', color: C.brown },
  clientTour: { fontSize: 11, color: C.brownMid, opacity: 0.75, marginTop: 2 },

  footer: { paddingHorizontal: 16, paddingTop: 12, backgroundColor: C.cardBg, borderTopWidth: 1, borderTopColor: C.divider },
  markBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#12946F', borderRadius: 24, paddingVertical: 14,
  },
  markBtnDisabled: { opacity: 0.5 },
  markBtnText: { fontSize: 13.5, fontWeight: '800', color: '#FFFFFF' },
});
