/**
 * ClientPageHero.tsx
 * Compact gradient hero header reused across every client page except the
 * Dashboard (which has its own richer greeting banner) — an emoji "confetti"
 * layer, a title/subtitle, and a decorative icon with orbiting rings. Defaults
 * to the same HERO_GRADIENT as the Dashboard's banner; pass `gradient` to
 * override (e.g. PAGE_HERO_GRADIENT for pages that should avoid dark brown).
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HERO_GRADIENT } from './theme';

type Props = { icon: string; title: string; subtitle: string; gradient?: readonly string[] };

export default function ClientPageHero({ icon, title, subtitle, gradient = HERO_GRADIENT }: Props) {
  return (
    <LinearGradient colors={gradient as [string, string, ...string[]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={ph.card}>
      <View style={ph.decorLayer} pointerEvents="none">
        <Text style={[ph.decorEmoji, { top: 8, right: 58, fontSize: 14, opacity: 0.5, transform: [{ rotate: '15deg' }] }]}>✈️</Text>
        <Text style={[ph.decorEmoji, { top: 4, right: 6, fontSize: 18, opacity: 0.4 }]}>📍</Text>
        <Text style={[ph.decorEmoji, { bottom: -14, right: 56, fontSize: 54, opacity: 0.14 }]}>🏖️</Text>
        <Text style={[ph.decorEmoji, { bottom: -16, right: -2, fontSize: 42, opacity: 0.18 }]}>🌴</Text>
      </View>

      <View style={ph.row}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={ph.title} numberOfLines={1}>{title}</Text>
          <Text style={ph.subtitle} numberOfLines={2}>{subtitle}</Text>
        </View>
        <View style={ph.iconWrap}>
          <View style={ph.ring2} />
          <View style={ph.ring1} />
          <View style={ph.iconCircle}>
            <Text style={{ fontSize: 24 }}>{icon}</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const ph = StyleSheet.create({
  card: {
    marginHorizontal: 16, marginTop: 4, marginBottom: 14,
    borderRadius: 18, padding: 16,
    overflow: 'hidden', position: 'relative',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 },
    }),
  },
  decorLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  decorEmoji: { position: 'absolute' },
  row: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.2 },
  subtitle: { fontSize: 11, color: 'rgba(255,255,255,0.9)', marginTop: 4, lineHeight: 15, maxWidth: 240 },
  iconWrap: { width: 62, height: 62, alignItems: 'center', justifyContent: 'center', marginLeft: 8, flexShrink: 0 },
  ring2: { position: 'absolute', width: 62, height: 62, borderRadius: 31, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  ring1: { position: 'absolute', width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  iconCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
});
