/**
 * AccountScreen.tsx
 * Client Account tab — profile summary, quick stats, and Log Out. Minimal
 * first pass since no design reference was given yet; easy to expand once
 * there's a real profile-editing flow.
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Copyright from '@/components/Copyright';
import { C } from '../theme';
import ClientPageHero from '../ClientPageHero';
import { STAT_CARDS } from '../dashboard/mockData';
import { useBookings } from '../bookings/BookingsContext';

const ChevronIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
    <Path d="M9 6l6 6-6 6" stroke={C.brownMid} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const LogoutIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="#E5473A" strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M16 17l5-5-5-5M21 12H9" stroke="#E5473A" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const initialsOf = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');

const MENU_ROWS = ['Edit Profile', 'Saved Addresses', 'Payment Methods', 'Notification Preferences', 'Help & Support'];

type Props = { name?: string; email?: string; onLogout: () => void };

export default function AccountScreen({ name = 'Jared Abellera', email = 'jared.abellera@email.com', onLogout }: Props) {
  const { bookings } = useBookings();
  const totalBookings = bookings.length;
  const placesVisited = STAT_CARDS.find((c) => c.key === 'places')?.value ?? '0';

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      <ClientPageHero icon="👤" title="Account" subtitle="Manage your profile and preferences" />

      <View style={pc.card}>
        <View style={pc.avatar}>
          <Text style={pc.avatarText}>{initialsOf(name)}</Text>
        </View>
        <Text style={pc.name}>{name}</Text>
        <Text style={pc.email}>{email}</Text>
      </View>

      <View style={st.row}>
        <View style={st.card}>
          <Text style={st.value}>{totalBookings}</Text>
          <Text style={st.label}>TOTAL BOOKINGS</Text>
        </View>
        <View style={st.card}>
          <Text style={st.value}>{placesVisited}</Text>
          <Text style={st.label}>PLACES VISITED</Text>
        </View>
      </View>

      <View style={mn.card}>
        {MENU_ROWS.map((label, i) => (
          <TouchableOpacity key={label} style={[mn.row, i === MENU_ROWS.length - 1 && mn.rowLast]} activeOpacity={0.75}>
            <Text style={mn.rowText}>{label}</Text>
            <ChevronIcon />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={mn.logoutBtn} activeOpacity={0.85} onPress={onLogout}>
        <LogoutIcon />
        <Text style={mn.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <Copyright />
    </ScrollView>
  );
}

const pc = StyleSheet.create({
  card: {
    alignItems: 'center', backgroundColor: C.cardBg, borderRadius: 16,
    marginHorizontal: 16, marginTop: 14, padding: 22,
    borderWidth: 1, borderColor: C.divider,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 2 },
    }),
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: C.amber,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  avatarText: { fontSize: 24, fontWeight: '900', color: '#FFFFFF' },
  name: { fontSize: 16, fontWeight: '900', color: C.brown },
  email: { fontSize: 11.5, color: C.brownMid, opacity: 0.75, marginTop: 2 },
});

const st = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 14 },
  card: {
    flex: 1, alignItems: 'center', backgroundColor: C.cardBg, borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: C.divider,
  },
  value: { fontSize: 18, fontWeight: '900', color: C.brown },
  label: { fontSize: 8.5, fontWeight: '800', color: C.brownMid, opacity: 0.65, letterSpacing: 0.4, marginTop: 3 },
});

const mn = StyleSheet.create({
  card: {
    backgroundColor: C.cardBg, borderRadius: 14, marginHorizontal: 16, marginTop: 16,
    borderWidth: 1, borderColor: C.divider, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  rowLast: { borderBottomWidth: 0 },
  rowText: { fontSize: 12.5, fontWeight: '700', color: C.brown },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FCE4E1', borderRadius: 14, marginHorizontal: 16, marginTop: 16,
    paddingVertical: 14,
  },
  logoutText: { fontSize: 12.5, fontWeight: '800', color: '#E5473A' },
});
