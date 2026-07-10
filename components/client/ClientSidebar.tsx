/**
 * ClientSidebar.tsx
 * Slide-in navigation drawer for the client shell, mirroring the admin
 * dashboard's Sidebar — logo, a "MAIN MENU" nav list, and a Logout row.
 */

import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { C } from './theme';
import { SIDEBAR_NAV_TABS, TabKey } from './navConfig';

export const SIDEBAR_W = 220;

const CloseIcon = ({ color = C.amber, size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 5l14 14M19 5L5 19" stroke={color} strokeWidth={2.8} strokeLinecap="round" />
  </Svg>
);

const LogoutIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="#FF6B5C" strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M16 17l5-5-5-5M21 12H9" stroke="#FF6B5C" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SectionLabel = ({ text }: { text: string }) => (
  <View style={sb.sectionRow}>
    <Text style={sb.sectionLabel}>{text}</Text>
    <View style={sb.sectionLine} />
  </View>
);

type Props = {
  active:      TabKey;
  onSelect:    (key: TabKey) => void;
  onClose:     () => void;
  onLogout:    () => void;
  insetBottom: number;
};

export default function ClientSidebar({ active, onSelect, onClose, onLogout, insetBottom }: Props) {
  return (
    <View style={[sb.wrapper, { paddingBottom: 16 + insetBottom }]}>
      <TouchableOpacity style={sb.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <CloseIcon />
      </TouchableOpacity>

      <View style={sb.logoArea}>
        <Image source={require('../../assets/images/go_logo.png')} style={sb.logoImage} resizeMode="contain" />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
        <SectionLabel text="MAIN MENU" />

        {SIDEBAR_NAV_TABS.map((item) => {
          const isActive = active === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[sb.navItem, isActive ? sb.navItemActive : sb.navItemInactive]}
              activeOpacity={0.75}
              onPress={() => onSelect(item.key)}
            >
              <item.Icon color={isActive ? '#FFFFFF' : C.brown} />
              <Text style={[sb.navLabel, isActive ? sb.navLabelActive : sb.navLabelInactive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={[sb.navItem, sb.logoutItem]} activeOpacity={0.75} onPress={onLogout}>
          <LogoutIcon />
          <Text style={sb.logoutLabel}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const sb = StyleSheet.create({
  wrapper: {
    width: SIDEBAR_W, height: '100%',
    backgroundColor: C.bg, paddingHorizontal: 14, paddingTop: 16,
    borderRightWidth: 1, borderRightColor: C.divider,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 16, shadowOffset: { width: 6, height: 0 } },
      android: { elevation: 14 },
    }),
  },
  closeBtn: {
    alignSelf: 'flex-end',
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: C.lightBg, borderWidth: 1, borderColor: C.divider,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  logoArea: { alignItems: 'center', marginBottom: 16 },
  logoImage: { width: 160, height: 80 },

  sectionRow: { marginTop: 14, marginBottom: 8, alignItems: 'center' },
  sectionLabel: { fontSize: 9.5, fontWeight: '800', color: C.amber, letterSpacing: 1.2 },
  sectionLine: { height: 1, backgroundColor: C.divider, width: '100%', marginTop: 8 },

  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginVertical: 4, borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 14,
  },
  navItemActive: { backgroundColor: C.amber },
  navItemInactive: { backgroundColor: C.lightBg },
  navLabel: { flex: 1, fontSize: 12.5, fontWeight: '700' },
  navLabelActive: { color: '#FFFFFF' },
  navLabelInactive: { color: C.brown },

  logoutItem: { backgroundColor: '#FCE4E1', marginTop: 14 },
  logoutLabel: { flex: 1, fontSize: 12.5, fontWeight: '700', color: '#E5473A' },
});
