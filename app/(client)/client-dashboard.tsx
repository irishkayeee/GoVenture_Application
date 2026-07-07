/**
 * client-dashboard.tsx
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import WelcomeModal from '@/components/WelcomeModal';
import Copyright from '@/components/Copyright';

/* ── Color System (matches landing/admin) ── */
const C = {
  bg:       '#F8E4D5',
  brown:    '#3B1A0C',
  brownMid: '#6B3318',
  amber:    '#C46B1A',
  white:    '#FFFFFF',
  cardBg:   '#FFFFFF',
  lightBg:  '#FDF0E6',
  divider:  '#E8C4A0',
};

const QUICK_LINKS = [
  { label: 'My Bookings', emoji: '🧳' },
  { label: 'Browse Tours', emoji: '🗺️' },
  { label: 'Messages', emoji: '✉️' },
  { label: 'Profile', emoji: '👤' },
];

export default function ClientDashboard() {
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(true);

  const handleLogout = () => router.replace('/login' as any);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }}>
        <View style={s.welcomeBanner}>
          <View>
            <Text style={s.welcomeSub}>Welcome back 👋</Text>
            <Text style={s.welcomeTitle}>Your Travel Hub</Text>
          </View>
          <View style={s.welcomeIcon}>
            <Text style={{ fontSize: 36 }}>🌏</Text>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>QUICK LINKS</Text>
          <View style={s.grid}>
            {QUICK_LINKS.map((item) => (
              <TouchableOpacity key={item.label} style={s.actionBtn} activeOpacity={0.82}>
                <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
                <Text style={s.actionLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>NO BOOKINGS YET</Text>
          <Text style={s.emptyText}>Once you book a tour, it'll show up here.</Text>
        </View>

        <TouchableOpacity style={s.logoutBtn} activeOpacity={0.85} onPress={handleLogout}>
          <Text style={s.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Copyright />
      </ScrollView>

      <WelcomeModal
        visible={showWelcome}
        onClose={() => setShowWelcome(false)}
        emoji="🌴"
        title="Welcome, Traveler!"
        message="You're logged in to your GoVenture account. Browse tours and manage your bookings here."
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  welcomeBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.brown, borderRadius: 16, padding: 18, margin: 16, marginBottom: 8,
    ...Platform.select({
      ios:     { shadowColor: C.brown, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 5 },
    }),
  },
  welcomeSub:   { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 2 },
  welcomeTitle: { fontSize: 18, fontWeight: '900', color: C.white, letterSpacing: -0.3 },
  welcomeIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  card: {
    backgroundColor: C.white, borderRadius: 14, padding: 14,
    marginHorizontal: 16, marginBottom: 12,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 2 },
    }),
  },
  cardTitle: { fontSize: 11, fontWeight: '900', color: C.brown, letterSpacing: 0.5, marginBottom: 12 },
  grid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: {
    width: '47%', alignItems: 'center', backgroundColor: C.lightBg,
    borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: C.divider,
  },
  actionLabel: { fontSize: 9.5, fontWeight: '700', color: C.brownMid, marginTop: 6, textAlign: 'center' },
  emptyText:   { fontSize: 11, color: C.brownMid, opacity: 0.7 },
  logoutBtn: {
    marginHorizontal: 16, marginTop: 8,
    backgroundColor: C.amber, borderRadius: 50, height: 44,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios:     { shadowColor: C.amber, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 4 },
    }),
  },
  logoutText: { color: C.white, fontWeight: '800', fontSize: 12, letterSpacing: 1.4 },
});
