/**
 * WelcomeBanner.tsx
 * Hero banner shown at the top of the admin Dashboard tab — greeting and
 * date over a travel-themed illustration.
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { C } from './theme';

const CalendarIcon = () => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
    <Path d="M5 6a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6z" stroke={C.white} strokeWidth={1.8} />
    <Path d="M16 2v4M8 2v4M3 10h18" stroke={C.white} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

function formatToday(): string {
  const d = new Date();
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' });
}

/** Greeting + emoji based on the current hour in the Philippines (Asia/Manila). */
function getGreeting(): { text: string; emoji: string } {
  const hour = parseInt(
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', hour: '2-digit', hour12: false }).format(new Date()),
    10
  );
  if (hour < 12) return { text: 'Good Morning', emoji: '☀️' };
  if (hour < 18) return { text: 'Good Afternoon', emoji: '🌤️' };
  return { text: 'Good Evening', emoji: '🌙' };
}

export default function WelcomeBanner({ name = 'Admin' }: { name?: string }) {
  const greeting = getGreeting();

  return (
    <LinearGradient
      colors={['#6B2E10', '#B85F17', '#D17B2E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={wb.card}
    >
      {/* decorative background */}
      <View style={wb.decorLayer} pointerEvents="none">
        <Text style={[wb.decorEmoji, { top: 10, right: 62, fontSize: 15, opacity: 0.55, transform: [{ rotate: '18deg' }] }]}>✈️</Text>
        <Text style={[wb.decorEmoji, { top: 4, right: 4, fontSize: 20, opacity: 0.5 }]}>📍</Text>
        <Text style={[wb.decorEmoji, { bottom: -10, right: 76, fontSize: 68, opacity: 0.16 }]}>⛰️</Text>
        <Text style={[wb.decorEmoji, { bottom: -16, right: 2, fontSize: 50, opacity: 0.22 }]}>🌴</Text>
        <Text style={[wb.decorEmoji, { bottom: -22, right: 38, fontSize: 38, opacity: 0.2 }]}>🌴</Text>
      </View>

      <View style={wb.topRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={wb.eyebrowRow}>
            <Text style={wb.eyebrow}>{greeting.text.toUpperCase()}, {name.toUpperCase()}!</Text>
            <Text style={wb.sun}>{greeting.emoji}</Text>
          </View>
          <Text style={wb.title}>Admin Dashboard</Text>
          <Text style={wb.subtitle}>Here&apos;s what&apos;s happening with your travel business today.</Text>

          <View style={wb.datePill}>
            <CalendarIcon />
            <Text style={wb.dateText}>{formatToday()}</Text>
          </View>
        </View>

        <View style={wb.globeWrap}>
          <View style={wb.ring2} />
          <View style={wb.ring1} />
          <View style={wb.orbitDot1} />
          <View style={wb.orbitDot2} />
          <View style={wb.globeCircle}>
            <Text style={{ fontSize: 30 }}>🌍</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const wb = StyleSheet.create({
  card: {
    marginHorizontal: 16, marginTop: 4, marginBottom: 14,
    borderRadius: 20, padding: 18,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios:     { shadowColor: '#3B1A0C', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 5 },
    }),
  },
  decorLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  decorEmoji: { position: 'absolute' },
  topRow: { flexDirection: 'row', alignItems: 'flex-start' },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eyebrow: { fontSize: 10.5, fontWeight: '800', color: '#FFD9A0', letterSpacing: 0.6 },
  sun: { fontSize: 12 },
  title: { fontSize: 20, fontWeight: '900', color: C.white, letterSpacing: -0.3, marginTop: 4 },
  subtitle: { fontSize: 11.5, color: 'rgba(255,255,255,0.8)', lineHeight: 16, marginTop: 6, maxWidth: 220 },
  datePill: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    alignSelf: 'flex-start', marginTop: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
  },
  dateText: { fontSize: 10.5, fontWeight: '700', color: C.white },
  globeWrap: {
    width: 84, height: 84,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 8, flexShrink: 0,
  },
  ring2: {
    position: 'absolute', width: 84, height: 84, borderRadius: 42,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  ring1: {
    position: 'absolute', width: 68, height: 68, borderRadius: 34,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  orbitDot1: { position: 'absolute', top: 2, right: 2, width: 6, height: 6, borderRadius: 3, backgroundColor: C.amber },
  orbitDot2: { position: 'absolute', bottom: 6, left: 0, width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.amber },
  globeCircle: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
});
