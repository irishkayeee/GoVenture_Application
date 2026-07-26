/**
 * ClientTopNav.tsx
 * Floating top bar for the client shell — a hamburger button that opens
 * ClientSidebar. Mirrors the admin dashboard's ticket-stub TopNav design
 * (amber stub + dashed perforation + two-tone brand wordmark) for parity
 * between the admin and traveler shells.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { C } from './theme';

const HamburgerIcon = ({ color = C.white }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M4 7h16M4 12h16M4 17h16" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
  </Svg>
);

export default function ClientTopNav({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <View style={tn.shadowLayer}>
      <View style={tn.ticket}>
        <View style={[tn.stub, { backgroundColor: C.amber }]}>
          <TouchableOpacity onPress={onOpenMenu} activeOpacity={0.8} style={tn.stubBtn}>
            <HamburgerIcon color={C.white} />
          </TouchableOpacity>
        </View>

        <View style={tn.perforation}>
          <View style={tn.notchTop} />
          <View style={tn.dashedLine} />
          <View style={tn.notchBottom} />
        </View>

        <View style={tn.body}>
          <View style={tn.brandBlock}>
            <Text numberOfLines={1}>
              <Text style={tn.brandGo}>Go</Text><Text style={tn.brandVenture}>Venture</Text>
            </Text>
            <Text style={tn.tagline} numberOfLines={1}>—  TRAVEL & TOURS  —</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const tn = StyleSheet.create({
  shadowLayer: {
    marginHorizontal: 14, marginTop: 10, marginBottom: 16,
    borderRadius: 12,
    ...Platform.select({
      ios:     { shadowColor: '#3B1A0C', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 },
    }),
  },
  ticket: {
    flexDirection: 'row', alignItems: 'stretch',
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: C.divider,
  },
  stub: {
    width: 64,
    alignItems: 'center', justifyContent: 'center',
    gap: 10,
    flexShrink: 0,
    position: 'relative',
  },
  stubBtn: {
    alignItems: 'center', justifyContent: 'center',
    padding: 4,
  },
  perforation: {
    width: 1,
    position: 'relative',
  },
  dashedLine: {
    flex: 1,
    borderLeftWidth: 1.5,
    borderLeftColor: C.divider,
    borderStyle: 'dashed',
  },
  notchTop: {
    position: 'absolute',
    top: -9, left: -8,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: C.bg,
    zIndex: 2,
  },
  notchBottom: {
    position: 'absolute',
    bottom: -9, left: -8,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: C.bg,
    zIndex: 2,
  },
  body: {
    flex: 1, minWidth: 0,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.white,
    paddingHorizontal: 12, paddingVertical: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  brandBlock: { flexShrink: 1, minWidth: 0 },
  brandGo:      { fontSize: 19, fontWeight: '900', color: C.brown, letterSpacing: -0.3 },
  brandVenture: { fontSize: 19, fontWeight: '900', color: C.amber, letterSpacing: -0.3 },
  tagline: { fontSize: 9, fontWeight: '800', color: C.brownMid, letterSpacing: 1.2, marginTop: 2, opacity: 0.8 },
});
