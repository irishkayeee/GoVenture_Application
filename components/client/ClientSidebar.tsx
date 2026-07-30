/**
 * ClientSidebar.tsx
 * Slide-in navigation drawer for the client shell, mirroring the admin
 * dashboard's Sidebar — logo, a "MAIN MENU" nav list, and a Logout row.
 */

import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, Platform } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
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

/** Decorative bird/palm-tree/hills footer illustration, in the app's own amber/brown palette. */
const PALM_CROWN = { x: 122, y: 60 };
const PALM_FRONDS = [-82, -62, -42, -21, 0, 21, 42, 62, 82];

const Cloud = ({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) => (
  <>
    <Circle cx={x} cy={y} r={7 * scale} fill={C.lightBg} opacity={0.8} />
    <Circle cx={x + 8 * scale} cy={y + 2 * scale} r={9 * scale} fill={C.lightBg} opacity={0.8} />
    <Circle cx={x - 8 * scale} cy={y + 3 * scale} r={6 * scale} fill={C.lightBg} opacity={0.8} />
    <Circle cx={x + 3 * scale} cy={y + 6 * scale} r={7 * scale} fill={C.lightBg} opacity={0.8} />
  </>
);

const SidebarFooterArt = () => (
  <View style={sb.footerArt} pointerEvents="none">
    <Svg width="100%" height="100%" viewBox="-40 -40 300 180" preserveAspectRatio="xMidYMax slice">
      {/* soft sun glow */}
      <Circle cx={40} cy={26} r={28} fill={C.amber} opacity={0.07} />
      <Circle cx={40} cy={26} r={17} fill={C.amber} opacity={0.13} />
      <Circle cx={40} cy={26} r={8} fill={C.amber} opacity={0.22} />

      {/* clouds */}
      <Cloud x={78} y={20} scale={0.7} />
      <Cloud x={188} y={30} scale={0.55} />

      {/* birds */}
      <Path d="M152 20q6.5 -9.5 13 0q6.5 -9.5 13 0" stroke={C.brownMid} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.4} />
      <Path d="M170 42q5 -7 10 0q5 -7 10 0" stroke={C.brownMid} strokeWidth={1.6} strokeLinecap="round" fill="none" opacity={0.3} />
      <Path d="M16 46q4.5 -6.5 9 0q4.5 -6.5 9 0" stroke={C.brownMid} strokeWidth={1.6} strokeLinecap="round" fill="none" opacity={0.28} />

      {/* rolling hills, back to front */}
      <Path d="M0 98 Q40 62 92 86 T220 74 V140 H0 Z" fill={C.divider} opacity={0.55} />
      <Path d="M0 116 Q55 84 118 104 T220 98 V140 H0 Z" fill={C.amber} opacity={0.2} />
      <Path d="M0 128 Q60 108 130 122 T220 118 V140 H0 Z" fill={C.amber} opacity={0.3} />

      {/* palm trunk — tapered, leaning, with bark texture */}
      <Path d="M104 140 C105 116 108 96 114 78 C116 72 119 66 122 60 C125 68 124 76 122 86 C119 104 118 122 120 140 Z" fill={C.brown} />
      <Path d="M115 128 C114 110 116 94 121 80" stroke={C.brownMid} strokeWidth={1.2} strokeLinecap="round" fill="none" opacity={0.5} />
      <Path d="M110 114 C111 100 113 90 117 78" stroke={C.brownMid} strokeWidth={1} strokeLinecap="round" fill="none" opacity={0.4} />

      {/* crown fronds, fanned + drooping at the tips */}
      {PALM_FRONDS.map((angle, i) => (
        <Path
          key={angle}
          d="M0,0 C -3,-16 -1,-31 8,-43 C 13,-32 13,-17 8,-3 Z"
          fill={i % 2 === 0 ? C.brown : C.brownMid}
          opacity={i % 2 === 0 ? 1 : 0.82}
          transform={`translate(${PALM_CROWN.x} ${PALM_CROWN.y}) rotate(${angle})`}
        />
      ))}

    </Svg>
  </View>
);

type Props = {
  active:      TabKey;
  onSelect:    (key: TabKey) => void;
  onClose:     () => void;
  onLogout:    () => void;
  insetTop:    number;
  insetBottom: number;
  notificationsBadge?: number;
};

export default function ClientSidebar({ active, onSelect, onClose, onLogout, insetTop, insetBottom, notificationsBadge = 0 }: Props) {
  return (
    <View style={[sb.wrapper, { paddingTop: 16 + insetTop }]}>
      <TouchableOpacity style={sb.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <CloseIcon />
      </TouchableOpacity>

      <View style={sb.logoArea}>
        <Image source={require('../../assets/images/go_logo.png')} style={sb.logoImage} resizeMode="contain" />
      </View>

      <ScrollView style={{ flexGrow: 0, flexShrink: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 + insetBottom }}>
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
              {item.key === 'notifications' && notificationsBadge > 0 && (
                <View style={sb.badge}>
                  <Text style={sb.badgeText}>{notificationsBadge}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={[sb.navItem, sb.logoutItem]} activeOpacity={0.75} onPress={onLogout}>
          <LogoutIcon />
          <Text style={sb.logoutLabel}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      <SidebarFooterArt />
    </View>
  );
}

const sb = StyleSheet.create({
  wrapper: {
    width: SIDEBAR_W, height: '100%',
    backgroundColor: C.bg, paddingHorizontal: 14,
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
  logoImage: { width: 190, height: 95 },

  sectionRow: { marginTop: 14, marginBottom: 8, alignItems: 'center' },
  sectionLabel: { fontSize: 9.5, fontWeight: '800', color: C.amber, letterSpacing: 1.2 },
  sectionLine: { height: 1, backgroundColor: C.divider, width: '100%', marginTop: 8 },

  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginVertical: 4, borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 14,
    borderWidth: 1, borderColor: C.amber,
  },
  navItemActive: { backgroundColor: C.amber },
  navItemInactive: { backgroundColor: '#FAF6F2' },
  navLabel: { flex: 1, fontSize: 12.5, fontWeight: '700' },
  navLabelActive: { color: '#FFFFFF' },
  navLabelInactive: { color: C.brown },
  badge: { backgroundColor: C.amber, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, minWidth: 20, alignItems: 'center' },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },

  logoutItem: { backgroundColor: '#FCE4E1', marginTop: 14 },
  logoutLabel: { flex: 1, fontSize: 12.5, fontWeight: '700', color: '#E5473A' },

  footerArt: {
    flex: 1, minHeight: 90, marginHorizontal: -14, marginTop: 8, overflow: 'hidden',
  },
});
