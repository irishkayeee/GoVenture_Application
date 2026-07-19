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

const CheckCircleIcon = ({ color }: { color: string }) => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
    <Path d="M12 21a9 9 0 100-18 9 9 0 000 18z" stroke={color} strokeWidth={1.8} />
    <Path d="M8 12.5l2.5 2.5L16 9.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// A "stamp" — dashed circle border with a mark that reflects the booking's status.
const StatusStampIcon = ({ status, color }: { status: BookingStatus; color: string }) => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path d="M12 21a9 9 0 100-18 9 9 0 000 18z" stroke={color} strokeWidth={1.6} strokeDasharray="2.2,2.2" />
    {status === 'Confirmed' && (
      <Path d="M8 12.5l2.5 2.5L16 9.5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    )}
    {status === 'Pending' && (
      <Path d="M12 7.5v5l3.2 1.8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    )}
    {status === 'Cancelled' && (
      <Path d="M9 9l6 6M15 9l-6 6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    )}
  </Svg>
);

type Props = {
  visible:    boolean;
  booking:    Booking | null;
  onClose:    () => void;
  onConfirm:  (id: string) => void;
  onCancel:   (id: string) => void;
  onMessage?: () => void;
};

export default function BookingDetailModal({ visible, booking, onClose, onConfirm, onCancel, onMessage }: Props) {
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

            <View style={s.infoCard}>
              <View style={s.infoCardTop}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
                    <CheckCircleIcon color={st.color} />
                    <Text style={[s.statusBadgeText, { color: st.color }]}>{booking.status.toUpperCase()}</Text>
                  </View>
                  <Text style={s.referenceText} numberOfLines={1}>{booking.reference}</Text>
                  <Text style={s.referenceLabel}>Booking Reference</Text>
                </View>
                <View style={[s.illustrationWrap, { backgroundColor: st.bg }]}>
                  <StatusStampIcon status={booking.status} color={st.color} />
                </View>
              </View>

              <View style={s.infoDivider} />

              <View style={s.infoGridRow}>
                <View style={s.infoField}>
                  <Text style={s.infoFieldLabel}>TRAVEL DATES</Text>
                  <Text style={s.infoFieldValue}>
                    {booking.startDate.split(', ')[0]} – {booking.endDate.split(', ')[0]}, {booking.startDate.split(', ')[1]}
                  </Text>
                  <Text style={s.infoFieldSubValue}>{booking.startTime} – {booking.endTime}</Text>
                </View>
                <View style={s.infoFieldDividerV} />
                <View style={s.infoField}>
                  <Text style={s.infoFieldLabel}>TRAVELERS</Text>
                  <Text style={s.infoFieldValue}>{booking.pax} pax</Text>
                </View>
              </View>

              <View style={s.infoFieldDividerH} />

              <View style={s.infoGridRow}>
                <View style={s.infoField}>
                  <Text style={s.infoFieldLabel}>TOTAL PRICE</Text>
                  <Text style={[s.infoFieldValue, { color: C.amber, fontWeight: '900' }]}>{formatPeso(booking.price)}</Text>
                </View>
                <View style={s.infoFieldDividerV} />
                <View style={s.infoField}>
                  <Text style={s.infoFieldLabel}>PAYMENT STATUS</Text>
                  <View style={[s.miniBadge, { backgroundColor: '#FFF5E0' }]}>
                    <Text style={[s.miniBadgeText, { color: '#B8922E' }]}>{booking.paymentStatus}</Text>
                  </View>
                </View>
              </View>
            </View>

            <Text style={s.sectionLabel}>NOTE</Text>
            <TextInput
              style={[s.noteInput, isFinal && s.noteInputDisabled]}
              placeholder={isFinal ? 'Notes are locked once a booking is confirmed.' : 'Add a note for this booking...'}
              placeholderTextColor={C.brownMid + '80'}
              value={note}
              onChangeText={setNote}
              editable={!isFinal}
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

            <TouchableOpacity
              style={[s.actionBtn, s.messageBtn]}
              activeOpacity={0.85}
              onPress={() => { onMessage?.(); onClose(); }}
            >
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
  infoCard: {
    backgroundColor: C.cardBg, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.divider, marginBottom: 18,
  },
  infoCardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: 'flex-start', marginBottom: 10,
  },
  statusBadgeText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.4 },
  referenceText: { fontSize: 18, fontWeight: '900', color: C.brown },
  referenceLabel: { fontSize: 11, color: C.brownMid, opacity: 0.7, marginTop: 2 },
  illustrationWrap: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 10, flexShrink: 0,
  },
  infoDivider: { height: 1, backgroundColor: C.divider, marginVertical: 14 },
  infoGridRow: { flexDirection: 'row', alignItems: 'flex-start' },
  infoField: { flex: 1, minWidth: 0 },
  infoFieldLabel: { fontSize: 9, fontWeight: '800', color: C.brownMid, opacity: 0.6, letterSpacing: 0.5, marginBottom: 3 },
  infoFieldValue: { fontSize: 12.5, fontWeight: '700', color: C.brown, lineHeight: 17 },
  infoFieldSubValue: { fontSize: 11, fontWeight: '600', color: C.brownMid, opacity: 0.75, marginTop: 1 },
  infoFieldDividerV: { width: 1, backgroundColor: C.divider, marginHorizontal: 12, alignSelf: 'stretch' },
  infoFieldDividerH: { height: 1, backgroundColor: C.divider, marginVertical: 14 },
  miniBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  miniBadgeText: { fontSize: 10, fontWeight: '800' },
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
  noteInputDisabled: { backgroundColor: C.lightBg, opacity: 0.7 },
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
