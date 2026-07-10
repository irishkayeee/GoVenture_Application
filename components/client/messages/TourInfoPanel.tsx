/**
 * TourInfoPanel.tsx
 * "About This Tour" summary — banner, trip facts, booking info cards, and
 * the End Conversation action. Reused both as a fixed sidebar (wide layout)
 * and inside a bottom-sheet modal (compact layout).
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { C } from '../theme';
import { TourConversation } from './mockData';

const PinIcon = () => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
    <Path d="M12 21s7-7.58 7-12a7 7 0 10-14 0c0 4.42 7 12 7 12z" stroke={C.amber} strokeWidth={2} strokeLinejoin="round" />
    <Circle cx={12} cy={9} r={2.4} stroke={C.amber} strokeWidth={2} />
  </Svg>
);

const CalendarIcon = () => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
    <Path d="M7 3v4M17 3v4M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" stroke={C.amber} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PersonIcon = () => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={8} r={3.4} stroke={C.amber} strokeWidth={2} />
    <Path d="M5 20c0-3.6 3.1-6.5 7-6.5s7 2.9 7 6.5" stroke={C.amber} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const CloseCircleIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke={C.danger} strokeWidth={2} />
    <Path d="M9 9l6 6M15 9l-6 6" stroke={C.danger} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

type Props = {
  conversation: TourConversation;
  onEndConversation: () => void;
};

export default function TourInfoPanel({ conversation, onEndConversation }: Props) {
  return (
    <View style={p.wrap}>
      <Text style={p.title}>About This Tour</Text>

      <View style={p.banner}>
        <Text style={p.bannerEmoji}>{conversation.emoji}</Text>
      </View>

      <Text style={p.destination}>{conversation.destination}</Text>

      <View style={p.factRow}>
        <PinIcon />
        <Text style={p.factText}>{conversation.location}</Text>
      </View>
      <View style={p.factRow}>
        <CalendarIcon />
        <Text style={p.factText}>{conversation.travelDates}</Text>
      </View>
      <View style={p.factRow}>
        <PersonIcon />
        <Text style={p.factText}>{conversation.guestLabel}</Text>
      </View>

      <View style={p.divider} />

      <Text style={p.sectionLabel}>Booking Information</Text>

      <View style={p.infoCard}>
        <Text style={p.infoLabel}>Booking ID:</Text>
        <Text style={p.infoValue}>{conversation.bookingId}</Text>
      </View>

      <View style={p.infoCard}>
        <Text style={p.infoLabel}>Booking Status:</Text>
        <View style={[p.statusPill, statusPillColor(conversation.bookingStatus)]}>
          <Text style={p.statusPillText}>{conversation.bookingStatus}</Text>
        </View>
      </View>

      <View style={p.infoCard}>
        <Text style={p.infoLabel}>Total Amount:</Text>
        <Text style={p.infoValue}>{conversation.totalAmount}</Text>
      </View>

      {!conversation.ended ? (
        <TouchableOpacity style={p.endBtn} activeOpacity={0.85} onPress={onEndConversation}>
          <CloseCircleIcon />
          <View style={{ flex: 1 }}>
            <Text style={p.endBtnTitle}>End Conversation</Text>
            <Text style={p.endBtnSub}>Close this conversation</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={p.endedNote}>
          <Text style={p.endedNoteText}>This conversation has ended.</Text>
        </View>
      )}
    </View>
  );
}

function statusPillColor(status: TourConversation['bookingStatus']) {
  switch (status) {
    case 'Confirmed': return { backgroundColor: C.success };
    case 'Cancelled': return { backgroundColor: C.danger };
    case 'Completed': return { backgroundColor: C.info };
    default:          return { backgroundColor: C.amber };
  }
}

const p = StyleSheet.create({
  wrap: { padding: 16 },
  title: { fontSize: 13, fontWeight: '900', color: C.brown, marginBottom: 12 },

  banner: {
    height: 110, borderRadius: 14, marginBottom: 12,
    backgroundColor: C.brown, alignItems: 'center', justifyContent: 'center',
  },
  bannerEmoji: { fontSize: 40 },

  destination: { fontSize: 16, fontWeight: '900', color: C.brown, marginBottom: 10 },

  factRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  factText: { fontSize: 12, color: C.brownMid, flexShrink: 1 },

  divider: { height: 1, backgroundColor: C.divider, marginVertical: 14 },

  sectionLabel: { fontSize: 11.5, fontWeight: '900', color: C.brown, marginBottom: 10 },

  infoCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.lightBg, borderRadius: 10,
    borderWidth: 1, borderColor: C.divider,
    paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 8,
  },
  infoLabel: { fontSize: 12, fontWeight: '700', color: C.brownMid },
  infoValue: { fontSize: 12, fontWeight: '800', color: C.brown },

  statusPill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  statusPillText: { fontSize: 10.5, fontWeight: '800', color: '#FFFFFF' },

  endBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FDECEA', borderRadius: 12,
    borderWidth: 1, borderColor: '#F5C6C0',
    paddingHorizontal: 14, paddingVertical: 12,
    marginTop: 10,
    ...Platform.select({
      ios:     { shadowColor: C.danger, shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 1 },
    }),
  },
  endBtnTitle: { fontSize: 12.5, fontWeight: '900', color: C.danger },
  endBtnSub:   { fontSize: 10.5, color: C.danger, opacity: 0.8, marginTop: 1 },

  endedNote: {
    marginTop: 10, borderRadius: 12, borderWidth: 1, borderColor: C.divider,
    backgroundColor: C.lightBg, paddingHorizontal: 14, paddingVertical: 12,
  },
  endedNoteText: { fontSize: 11.5, color: C.brownMid, textAlign: 'center' },
});
