/**
 * ClientTopNav.tsx
 * Floating top bar for the client shell — a hamburger button that opens
 * ClientSidebar, mirroring the admin dashboard's TopNav.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { C } from './theme';

const MenuIcon = ({ color = '#FFFFFF' }: { color?: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M3 7h18M3 12h18M3 17h12" stroke={color} strokeWidth={2.8} strokeLinecap="round" />
  </Svg>
);

export default function ClientTopNav({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <View style={tn.shadowLayer}>
      <View style={tn.bar}>
        <TouchableOpacity style={tn.menuBtn} onPress={onOpenMenu} activeOpacity={0.8}>
          <MenuIcon />
        </TouchableOpacity>
        <Text style={tn.title} numberOfLines={1} ellipsizeMode="tail">GoVenture Travel & Tours</Text>
      </View>
    </View>
  );
}

const tn = StyleSheet.create({
  shadowLayer: {
    marginHorizontal: 14, marginTop: 10, marginBottom: 10,
    borderRadius: 14,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 },
    }),
  },
  bar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 10, paddingVertical: 12,
    backgroundColor: C.bg, borderRadius: 14,
  },
  menuBtn: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: C.amber, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    ...Platform.select({
      ios:     { shadowColor: C.amber, shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  title: { flex: 1, minWidth: 0, fontSize: 15, fontWeight: '900', color: C.brown, letterSpacing: 0.2 },
});
