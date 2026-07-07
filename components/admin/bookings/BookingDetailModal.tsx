/**
 * BookingDetailModal.tsx
 * Full-screen slide-up detail view for a single booking — info grid, client
 * card, note field, and Confirm / Message / Cancel actions.
 */

import React, { useMemo, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform, KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { C as LIGHT_C } from '../dashboard/theme';
import { useAppTheme, ColorPalette } from '../ThemeContext';
import { Booking, BookingStatus, formatPeso } from './mockData';

const STATUS_STYLE: Record<BookingStatus, { bg: string; color: string }> = {
  Confirmed: { bg: '#E7F9F3', color: '#12946F' },
  Pending:   { bg: '#FFF5E0', color: '#B8922E' },
  Cancelled: { bg: '#FDEAEA', color: LIGHT_C.danger },
};

const BackIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M15 19l-7-7 7-7" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CheckIcon = () => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const MessageIcon = ({ color = LIGHT_C.amber }: { color?: string }) => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
  </Svg>
);

const CancelIcon = ({ color }: { color: string }) => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
  </Svg>
);

const InfoTile = ({ label, children, s }: { label: string; children: React.ReactNode; s: ReturnType<typeof makeStyles> }) => (
  <View style={s.tile}>
    <Text style={s.tileLabel}>{label}</Text>
    {children}
  </View>
);

type Props = {
  visible:    boolean;
  booking:    Booking | null;
  onClose:    () => void;
  onConfirm:  (id: string) => void;
  onCancel:   (id: string) => void;
};

export default function BookingDetailModal({ visible, booking, onClose, onConfirm, onCancel }: Props) {
  const { C } = useAppTheme();
  const s = useMemo(() => makeStyles(C), [C]);
  const [note, setNote] = useState('');

  if (!booking) return null;
  const st = STATUS_STYLE[booking.status];
  const isFinal = booking.status !== 'Pending';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={s.safe}>
        <LinearGradient
          colors={['#6B2E10', '#B85F17', '#D17B2E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.header}
        >
          <TouchableOpacity style={s.backBtn} onPress={onClose} activeOpacity={0.8} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={s.headerTitle} numberOfLines={1}>{booking.destination}</Text>
          <Text style={s.headerSub} numberOfLines={1}>{booking.tourPackage}</Text>
        </LinearGradient>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
            <Text style={s.sectionLabel}>BOOKING INFO</Text>
            <View style={s.grid}>
              <InfoTile s={s} label="REFERENCE">
                <Text style={s.tileValue}>{booking.reference}</Text>
              </InfoTile>
              <InfoTile s={s} label="BOOKING STATUS">
                <View style={[s.badge, { backgroundColor: st.bg, alignSelf: 'flex-start' }]}>
                  <Text style={[s.badgeText, { color: st.color }]}>{booking.status}</Text>
                </View>
              </InfoTile>
              <InfoTile s={s} label="TRAVEL DATES">
                <Text style={s.tileValue}>
                  {booking.startDate} {booking.startTime} – {booking.endDate} {booking.endTime}
                </Text>
              </InfoTile>
              <InfoTile s={s} label="TRAVELERS">
                <Text style={s.tileValue}>{booking.pax} pax</Text>
              </InfoTile>
              <InfoTile s={s} label="TOTAL PRICE">
                <Text style={[s.tileValue, { color: C.amber, fontWeight: '900' }]}>{formatPeso(booking.price)}</Text>
              </InfoTile>
              <InfoTile s={s} label="PAYMENT STATUS">
                <View style={[s.badge, { backgroundColor: '#FFF5E0', alignSelf: 'flex-start' }]}>
                  <Text style={[s.badgeText, { color: '#B8922E' }]}>{booking.paymentStatus}</Text>
                </View>
              </InfoTile>
            </View>

            <Text style={s.sectionLabel}>CLIENT</Text>
            <View style={s.clientCard}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{booking.initials}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.clientName}>{booking.clientName}</Text>
                <Text style={s.clientEmail} numberOfLines={1}>{booking.clientEmail}</Text>
              </View>
            </View>

            <Text style={s.sectionLabel}>NOTE</Text>
            <TextInput
              style={s.noteInput}
              placeholder="Add a note for this booking..."
              placeholderTextColor={C.brownMid + '80'}
              value={note}
              onChangeText={setNote}
              multiline
              textAlignVertical="top"
            />
          </ScrollView>

          <View style={s.actionRow}>
            <TouchableOpacity
              style={[s.actionBtn, s.confirmBtn, isFinal && s.actionBtnDisabled]}
              activeOpacity={0.85}
              disabled={isFinal}
              onPress={() => { onConfirm(booking.id); onClose(); }}
            >
              <CheckIcon />
              <Text style={s.confirmText}>Confirm</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[s.actionBtn, s.messageBtn]} activeOpacity={0.85}>
              <MessageIcon />
              <Text style={s.messageText}>Message</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.actionBtn, s.cancelBtn, isFinal && s.actionBtnDisabled]}
              activeOpacity={0.85}
              disabled={isFinal}
              onPress={() => { onCancel(booking.id); onClose(); }}
            >
              <CancelIcon color={isFinal ? C.brownMid : C.danger} />
              <Text style={[s.cancelText, isFinal && { color: C.brownMid }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const makeStyles = (C: ColorPalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.lightBg },
  header: { paddingTop: 54, paddingBottom: 20, paddingHorizontal: 20 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  headerTitle: { fontSize: 21, fontWeight: '900', color: '#FFFFFF' },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 3 },
  body: { padding: 16, paddingBottom: 24 },
  sectionLabel: { fontSize: 10.5, fontWeight: '800', color: C.brownMid, opacity: 0.65, letterSpacing: 0.6, marginBottom: 8, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  tile: {
    flexBasis: '47%', flexGrow: 1,
    backgroundColor: C.cardBg, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: C.divider,
  },
  tileLabel: { fontSize: 8.5, fontWeight: '800', color: C.brownMid, opacity: 0.6, letterSpacing: 0.5, marginBottom: 6 },
  tileValue: { fontSize: 12.5, fontWeight: '700', color: C.brown, lineHeight: 17 },
  badge: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  badgeText: { fontSize: 10.5, fontWeight: '800' },
  clientCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.cardBg, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: C.divider,
    marginBottom: 18,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.amber,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  clientName: { fontSize: 13.5, fontWeight: '800', color: C.brown },
  clientEmail: { fontSize: 11, color: C.brownMid, opacity: 0.75, marginTop: 2 },
  noteInput: {
    backgroundColor: C.cardBg, borderRadius: 12, borderWidth: 1, borderColor: C.divider,
    padding: 12, minHeight: 90, fontSize: 12.5, color: C.brown,
  },
  actionRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    backgroundColor: C.lightBg,
    borderTopWidth: 1, borderTopColor: C.divider,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: 24, paddingVertical: 12,
  },
  actionBtnDisabled: { opacity: 0.45 },
  confirmBtn: { backgroundColor: C.success },
  confirmText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  messageBtn: { backgroundColor: C.cardBg, borderWidth: 1.5, borderColor: C.amber },
  messageText: { fontSize: 12, fontWeight: '800', color: C.amber },
  cancelBtn: { backgroundColor: C.cardBg, borderWidth: 1.5, borderColor: C.divider },
  cancelText: { fontSize: 12, fontWeight: '800', color: C.danger },
});
