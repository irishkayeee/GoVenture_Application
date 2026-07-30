/**
 * admin-dashboard.tsx
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
  Animated,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import WelcomeModal from '@/components/WelcomeModal';
import Copyright from '@/components/Copyright';
import DashboardOverview from '@/components/admin/dashboard/DashboardOverview';
import BookingsScreen from '@/components/admin/bookings/BookingsScreen';
import CalendarScreen from '@/components/admin/calendar/CalendarScreen';
import MessagesScreen from '@/components/admin/messages/MessagesScreen';
import TourPackagesScreen from '@/components/admin/tours/TourPackagesScreen';
import PaymentsScreen from '@/components/admin/payments/PaymentsScreen';
import AccountsScreen from '@/components/admin/accounts/AccountsScreen';
import AdminDocumentsScreen from '@/components/admin/documents/DocumentsScreen';
import TripRequestsScreen from '@/components/admin/trips/TripRequestsScreen';
import NotificationsScreen from '@/components/admin/notifications/NotificationsScreen';
import AdminSettingsScreen from '@/components/admin/settings/SettingsScreen';
import { ThemeProvider, useAppTheme, ColorPalette } from '@/components/admin/ThemeContext';
import { useAuth } from '@/components/auth/AuthContext';
import { NOTIFICATIONS_UNREAD_COUNT_API_URL } from '@/constants/api';

/* ── Color System (matches index.tsx) ── */
const C = {
  bg:        '#F8E4D5',
  brown:     '#3B1A0C',
  brownMid:  '#6B3318',
  amber:     '#C46B1A',
  border:    '#C86820',
  white:     '#FFFFFF',
  cardBg:    '#FFFFFF',
  lightBg:   '#FDF0E6',
  divider:   '#E8C4A0',
  success:   '#4CAF50',
  warning:   '#FF9800',
  danger:    '#F44336',
  info:      '#2196F3',
  purple:    '#9C27B0',
};

const SIDEBAR_W = 220;

/* ════════════════════════════════════════
   SVG ICONS — Path only, no Rect/Circle
════════════════════════════════════════ */
type IconColorProp = { color?: string };

const HomeIcon = ({ color = C.white }: IconColorProp) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M4 10.5L12 3l8 7.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M6 9v10a1 1 0 001 1h4v-6h2v6h4a1 1 0 001-1V9" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const BookingsIcon = ({ color = C.white }: IconColorProp) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M5 6a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6z" stroke={color} strokeWidth={1.8}/>
    <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth={1.8} strokeLinecap="round"/>
    <Path d="M8 14h4M8 17h6" stroke={color} strokeWidth={1.8} strokeLinecap="round"/>
  </Svg>
);

const MessagesIcon = ({ color = C.white }: IconColorProp) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke={color} strokeWidth={1.8} strokeLinejoin="round"/>
  </Svg>
);

const ToursIcon = ({ color = C.white }: IconColorProp) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke={color} strokeWidth={1.8}/>
    <Path d="M14.5 9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" stroke={color} strokeWidth={1.8}/>
  </Svg>
);

const CalendarIcon = ({ color = C.white }: IconColorProp) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M5 6a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6z" stroke={color} strokeWidth={1.8}/>
    <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth={1.8} strokeLinecap="round"/>
    <Path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" stroke={color} strokeWidth={2} strokeLinecap="round"/>
  </Svg>
);

const PaymentsIcon = ({ color = C.white }: IconColorProp) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M4 7a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" stroke={color} strokeWidth={1.8}/>
    <Path d="M2 10h20" stroke={color} strokeWidth={1.8} strokeLinecap="round"/>
    <Path d="M6 15h4" stroke={color} strokeWidth={2} strokeLinecap="round"/>
  </Svg>
);

const PlaneIcon = ({ color = C.white }: IconColorProp) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M21 3L3 10.5l7 2.5 2.5 7L21 3z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round"/>
  </Svg>
);

const DocumentsIcon = ({ color = C.white }: IconColorProp) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M7 3h7l4 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" stroke={color} strokeWidth={1.8} strokeLinejoin="round"/>
    <Path d="M14 3v4h4" stroke={color} strokeWidth={1.8} strokeLinejoin="round"/>
  </Svg>
);

const AccountsIcon = ({ color = C.white }: IconColorProp) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M16 8a4 4 0 11-8 0 4 4 0 018 0z" stroke={color} strokeWidth={1.8}/>
    <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth={1.8} strokeLinecap="round"/>
  </Svg>
);

const HelpIcon = ({ color = C.white }: IconColorProp) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M12 21a9 9 0 100-18 9 9 0 000 18z" stroke={color} strokeWidth={1.8}/>
    <Path d="M9.5 9a2.5 2.5 0 014.9.8c0 1.7-2.4 2-2.4 3.7" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M12 17h.01" stroke={color} strokeWidth={2.2} strokeLinecap="round"/>
  </Svg>
);

const SettingsIcon = ({ color = C.white }: IconColorProp) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke={color} strokeWidth={1.8}/>
    <Path d="M19.4 13a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V19a2 2 0 01-4 0v-.09A1.65 1.65 0 008.5 17.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.18 13a1.65 1.65 0 00-1.51-1H2.5a2 2 0 010-4h.09A1.65 1.65 0 004.6 6.6a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 008.5 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1h.09a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const LogoutIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="#FF6B5C" strokeWidth={1.8} strokeLinecap="round"/>
    <Path d="M16 17l5-5-5-5M21 12H9" stroke="#FF6B5C" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const CloseIcon = ({ color = C.amber, size = 22 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 5l14 14M19 5L5 19" stroke={color} strokeWidth={2.8} strokeLinecap="round"/>
  </Svg>
);

const BellIcon = ({ color = C.amber }: IconColorProp) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 2a6 6 0 00-6 6v3.6c0 .7-.24 1.38-.68 1.92L4 15.5c-.7.86-.08 2.15 1.02 2.15h13.96c1.1 0 1.72-1.29 1.02-2.15l-1.32-2.5A3 3 0 0118 11.6V8a6 6 0 00-6-6z" />
    <Path d="M9.5 19.5a2.5 2.5 0 005 0h-5z" />
  </Svg>
);

const HamburgerIcon = ({ color = C.white }: IconColorProp) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M4 7h16M4 12h16M4 17h16" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
  </Svg>
);

/* ════════════════════════════════════════
   SIDEBAR
════════════════════════════════════════ */
type NavItem = { key: string; label: string; Icon: React.FC<IconColorProp>; badge?: number };

const NAV_ITEMS: NavItem[] = [
  { key: 'bookings',      label: 'Bookings',         Icon: BookingsIcon, badge: 4 },
  { key: 'tours',         label: 'Tours',            Icon: ToursIcon },
  { key: 'calendar',      label: 'Calendar',         Icon: CalendarIcon },
  { key: 'payments',      label: 'Payments',         Icon: PaymentsIcon },
  { key: 'documents',     label: 'Documents',        Icon: DocumentsIcon },
  { key: 'tripRequests',  label: 'Trip Requests',    Icon: PlaneIcon },
];

const ACCOUNT_ITEMS: NavItem[] = [
  { key: 'help',     label: 'Help & Support', Icon: HelpIcon },
  { key: 'settings', label: 'Settings',       Icon: SettingsIcon },
];

type SidebarProps = {
  active:   string;
  onSelect: (key: string) => void;
  onClose:  () => void;
  onLogout: () => void;
  insetTop: number;
  insetBottom: number;
};

const SectionLabel = ({ text, sb }: { text: string; sb: ReturnType<typeof makeSidebarStyles> }) => (
  <View style={sb.sectionRow}>
    <Text style={sb.sectionLabel}>{text} <Text style={sb.sectionPlus}>+</Text></Text>
    <View style={sb.sectionLine} />
  </View>
);

const Sidebar = ({ active, onSelect, onClose, onLogout, insetTop, insetBottom }: SidebarProps) => {
  const { C, isDark } = useAppTheme();
  const sb = useMemo(() => makeSidebarStyles(C, isDark), [C, isDark]);

  return (
  <View style={[sb.wrapper, { paddingTop: insetTop + 16, paddingBottom: 16 + insetBottom }]}>
    {/* Menu toggle */}
    <TouchableOpacity style={sb.menuBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
      <CloseIcon color={C.amber} size={14} />
    </TouchableOpacity>

    {/* Logo */}
    <View style={sb.logoArea}>
      <Image
        source={require('../../assets/images/go_logo.png')}
        style={sb.logoImage}
        resizeMode="contain"
      />
    </View>

    {/* Nav Items */}
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
      <SectionLabel text="MAIN MENU" sb={sb} />

      {NAV_ITEMS.map((item) => {
        const isActive = active === item.key;
        return (
          <TouchableOpacity
            key={item.key}
            style={[sb.navItem, isActive ? sb.navItemActive : sb.navItemInactive]}
            activeOpacity={0.75}
            onPress={() => onSelect(item.key)}
          >
            <item.Icon color={isActive ? C.white : C.brown} />
            <Text style={[sb.navLabel, isActive ? sb.navLabelActive : sb.navLabelInactive]}>
              {item.label}
            </Text>
            {item.badge !== undefined && (
              <View style={sb.badge}>
                <Text style={sb.badgeText}>{item.badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      <SectionLabel text="ACCOUNT" sb={sb} />

      {ACCOUNT_ITEMS.map((item) => {
        const isActive = active === item.key;
        return (
          <TouchableOpacity
            key={item.key}
            style={[sb.navItem, isActive ? sb.navItemActive : sb.navItemInactive]}
            activeOpacity={0.75}
            onPress={() => onSelect(item.key)}
          >
            <item.Icon color={isActive ? C.white : C.brown} />
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
};

const makeSidebarStyles = (C: ColorPalette, isDark: boolean) => StyleSheet.create({
  wrapper: {
    width: SIDEBAR_W,
    height: '100%',
    backgroundColor: C.bg,
    paddingHorizontal: 14,
    borderRightWidth: 1,
    borderRightColor: C.divider,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 16, shadowOffset: { width: 6, height: 0 } },
      android: { elevation: 14 },
    }),
  },
  menuBtn: {
    alignSelf: 'flex-end',
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: C.lightBg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.divider,
    marginBottom: 6,
  },
  logoArea: { alignItems: 'center', marginBottom: 16 },
  logoImage: { width: 160, height: 80 },

  sectionRow: { marginTop: 14, marginBottom: 8, alignItems: 'center' },
  sectionLabel: { fontSize: 9.5, fontWeight: '800', color: C.amber, letterSpacing: 1.2 },
  sectionPlus:  { fontSize: 10, fontWeight: '800', color: C.amber },
  sectionLine:  { height: 1, backgroundColor: C.divider, width: '100%', marginTop: 8 },

  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginVertical: 4, borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 14,
  },
  navItemActive:    { backgroundColor: C.amber },
  navItemInactive:  { backgroundColor: C.lightBg },
  navLabel:         { flex: 1, fontSize: 12.5, fontWeight: '700' },
  navLabelActive:   { color: C.white },
  navLabelInactive: { color: C.brown },
  badge:            { backgroundColor: C.amber, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, minWidth: 20, alignItems: 'center' },
  badgeText:        { fontSize: 9, fontWeight: '800', color: C.white },

  logoutItem:  { backgroundColor: isDark ? '#3A1F1C' : '#FCE4E1' },
  logoutLabel: { flex: 1, fontSize: 12.5, fontWeight: '700', color: isDark ? '#FF8A7A' : '#E5473A' },
});

/* ════════════════════════════════════════
   PLACEHOLDER FOR OTHER TABS
════════════════════════════════════════ */
const TAB_LABELS: Record<string, string> = {
  bookings: 'Bookings', messages: 'Messages', accounts: 'Account', notifications: 'Notifications',
  tours: 'Tours', calendar: 'Calendar', payments: 'Payments', documents: 'Documents', tripRequests: 'Trip Requests',
  help: 'Help & Support', settings: 'Settings',
};

const PlaceholderScreen = ({ tabKey }: { tabKey: string }) => {
  const { C } = useAppTheme();
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Text style={{ fontSize: 48 }}>🚧</Text>
        <Text style={{ fontSize: 18, fontWeight: '900', color: C.brown }}>{TAB_LABELS[tabKey] || tabKey}</Text>
      </View>
      <Copyright />
    </View>
  );
};

/* ════════════════════════════════════════
   TOP NAV BAR
════════════════════════════════════════ */
const TopNav = ({ onOpenMenu }: { onOpenMenu: () => void }) => {
  const { C } = useAppTheme();
  const tn = useMemo(() => makeTopNavStyles(C), [C]);
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
};

/* ════════════════════════════════════════
   ONBOARDING TOOLTIP 
════════════════════════════════════════ */
type OnboardingTooltipProps = {
  message:     string;
  buttonLabel: string;
  onDismiss:   () => void;
  side:        'left' | 'right';
  offset:      number;
};

const OnboardingTooltip = ({ message, buttonLabel, onDismiss, side, offset }: OnboardingTooltipProps) => (
  <View
    style={[mt.wrapper, side === 'left' ? { left: offset } : { right: offset }]}
    pointerEvents="box-none"
  >
    <View style={[mt.arrow, side === 'left' ? { alignSelf: 'flex-start', marginLeft: 10 } : { alignSelf: 'flex-end', marginRight: 10 }]} />
    <View style={mt.bubble}>
      <Text style={mt.text}>{message}</Text>
      <TouchableOpacity style={mt.gotItBtn} activeOpacity={0.85} onPress={onDismiss}>
        <Text style={mt.gotItText}>{buttonLabel}</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const mt = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: '100%',
    marginTop: 8,
    zIndex: 30,
    maxWidth: 230,
  },
  arrow: {
    width: 0, height: 0,
    borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 9,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: '#3B1A0C',
  },
  bubble: {
    backgroundColor: '#3B1A0C',
    borderRadius: 12,
    padding: 12,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 8 },
    }),
  },
  text:       { fontSize: 11, color: '#FFFFFF', lineHeight: 16, marginBottom: 8 },
  gotItBtn:   { alignSelf: 'flex-end', backgroundColor: '#C46B1A', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  gotItText:  { fontSize: 9.5, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.6 },
});

const makeTopNavStyles = (C: ColorPalette) => StyleSheet.create({
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
  brandGo:       { fontSize: 19, fontWeight: '900', color: C.brown, letterSpacing: -0.3 },
  brandVenture:  { fontSize: 19, fontWeight: '900', color: C.amber, letterSpacing: -0.3 },
  tagline: { fontSize: 9, fontWeight: '800', color: C.brownMid, letterSpacing: 1.2, marginTop: 2, opacity: 0.8 },
});

/* ════════════════════════════════════════
   LOGOUT CONFIRMATION MODAL
════════════════════════════════════════ */
type LogoutConfirmModalProps = {
  visible:   boolean;
  onCancel:  () => void;
  onConfirm: () => void;
};

const LogoutConfirmModal = ({ visible, onCancel, onConfirm }: LogoutConfirmModalProps) => {
  const { C, isDark } = useAppTheme();
  const lc = useMemo(() => makeLogoutStyles(C), [C]);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={lc.backdrop}>
        <View style={lc.card}>
          <View style={[lc.iconCircle, { backgroundColor: isDark ? '#3A1F1C' : '#FCE4E1' }]}>
            <LogoutIcon />
          </View>
          <Text style={lc.title}>Log Out?</Text>
          <Text style={lc.message}>Are you sure you want to log out of your admin account?</Text>
          <View style={lc.btnRow}>
            <TouchableOpacity style={[lc.btn, lc.cancelBtn]} activeOpacity={0.85} onPress={onCancel}>
              <Text style={lc.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[lc.btn, lc.confirmBtn]} activeOpacity={0.85} onPress={onConfirm}>
              <Text style={lc.confirmText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const makeLogoutStyles = (C: ColorPalette) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(59,26,12,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%', maxWidth: 320,
    backgroundColor: C.cardBg, borderRadius: 22,
    paddingHorizontal: 22, paddingVertical: 26,
    alignItems: 'center',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 12 },
    }),
  },
  iconCircle: {
    width: 58, height: 58, borderRadius: 29,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  title:   { fontSize: 18, fontWeight: '900', color: C.brown, textAlign: 'center', marginBottom: 8 },
  message: { fontSize: 12, color: C.brownMid, textAlign: 'center', lineHeight: 18, opacity: 0.85, marginBottom: 20 },
  btnRow:  { flexDirection: 'row', gap: 10, width: '100%' },
  btn:     { flex: 1, borderRadius: 50, paddingVertical: 12, alignItems: 'center' },
  cancelBtn:   { backgroundColor: C.lightBg, borderWidth: 1, borderColor: C.divider },
  cancelText:  { color: C.brownMid, fontWeight: '800', fontSize: 12, letterSpacing: 0.6 },
  confirmBtn:  { backgroundColor: '#E5473A' },
  confirmText: { color: C.white, fontWeight: '800', fontSize: 12, letterSpacing: 0.6 },
});

/* ════════════════════════════════════════
   BOTTOM NAV BAR
════════════════════════════════════════ */
type BottomNavItem = { key: string; label: string; Icon: React.FC<IconColorProp>; badge?: number };

const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { key: 'dashboard',     label: 'Dashboard',     Icon: HomeIcon },
  { key: 'messages',      label: 'Messages',      Icon: MessagesIcon, badge: 12 },
  { key: 'notifications', label: 'Notifications', Icon: BellIcon },
  { key: 'accounts',      label: 'Me',            Icon: AccountsIcon },
];

const BottomNavBar = ({
  active, onSelect, insetBottom, notificationsBadge,
}: { active: string; onSelect: (key: string) => void; insetBottom: number; notificationsBadge: number }) => {
  const { C } = useAppTheme();
  const bn = useMemo(() => makeBottomNavStyles(C), [C]);
  return (
    <View style={[bn.bar, { paddingBottom: 8 + insetBottom }]}>
      {BOTTOM_NAV_ITEMS.map((item) => {
        const isActive = active === item.key;
        const color = isActive ? C.amber : C.brownMid;
        const badge = item.key === 'notifications' ? (notificationsBadge > 0 ? notificationsBadge : undefined) : item.badge;
        return (
          <TouchableOpacity
            key={item.key}
            style={bn.item}
            activeOpacity={0.75}
            onPress={() => onSelect(item.key)}
          >
            <View style={bn.iconWrap}>
              <item.Icon color={color} />
              {badge !== undefined && (
                <View style={bn.badge}>
                  <Text style={bn.badgeText}>{badge}</Text>
                </View>
              )}
            </View>
            <Text style={[bn.label, { color }]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const makeBottomNavStyles = (C: ColorPalette) => StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: C.cardBg,
    borderTopWidth: 1, borderTopColor: C.divider,
    paddingTop: 8,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: -2 } },
      android: { elevation: 8 },
    }),
  },
  item: { flex: 1, alignItems: 'center', gap: 3 },
  iconWrap: { position: 'relative' },
  label: { fontSize: 9.5, fontWeight: '700' },
  badge: {
    position: 'absolute', top: -5, right: -9,
    minWidth: 15, height: 15, borderRadius: 8,
    backgroundColor: C.danger,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 8.5, fontWeight: '800', color: C.white },
});

/* ════════════════════════════════════════
   MAIN EXPORT — AdminDashboard
════════════════════════════════════════ */
export default function AdminDashboard() {
  return (
    <ThemeProvider>
      <AdminDashboardInner />
    </ThemeProvider>
  );
}

function AdminDashboardInner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { C, isDark } = useAppTheme();
  const { user } = useAuth();

  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [activeTab,    setActiveTab]    = useState('dashboard');
  const [showWelcome,  setShowWelcome]  = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [pendingMessageClient, setPendingMessageClient] = useState<string | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  // 0 = none, 1 = menu
  const [tooltipStep,  setTooltipStep]  = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = () => {
      fetch(`${NOTIFICATIONS_UNREAD_COUNT_API_URL}&recipientType=admin&recipientId=${user.id}`)
        .then((res) => res.json())
        .then((result) => { if (result.status === 'success') setUnreadNotifications(result.data.unreadCount); })
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user, activeTab]);

  const slideAnim   = useRef(new Animated.Value(-SIDEBAR_W)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const openSidebar = () => {
    setTooltipStep(0);
    setSidebarOpen(true);
    Animated.parallel([
      Animated.spring(slideAnim,   { toValue: 0,          useNativeDriver: true, tension: 80, friction: 10 }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const closeSidebar = () => {
    Animated.parallel([
      Animated.spring(slideAnim,   { toValue: -SIDEBAR_W, useNativeDriver: true, tension: 80, friction: 10 }),
      Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setSidebarOpen(false));
  };

  const handleSelect = (key: string) => {
    setActiveTab(key);
    closeSidebar();
  };

  const goToClientMessages = (clientName: string) => {
    setPendingMessageClient(clientName);
    setActiveTab('messages');
  };

  const handleLogout = () => {
    closeSidebar();
    setShowLogoutConfirm(true);
  };

  const cancelLogout = () => setShowLogoutConfirm(false);

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    router.replace('/login' as any);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />

      <View style={{ position: 'relative', zIndex: 25 }}>
        <TopNav onOpenMenu={openSidebar} />

        {tooltipStep === 1 && (
          <OnboardingTooltip
            side="left"
            offset={28}
            message="Tap here anytime to open Bookings, Tours, Payments, and more."
            buttonLabel="GOT IT"
            onDismiss={() => setTooltipStep(0)}
          />
        )}
      </View>

      <View style={{ flex: 1, backgroundColor: C.lightBg }}>
        {activeTab === 'dashboard'
          ? <DashboardOverview />
          : activeTab === 'bookings'
          ? <BookingsScreen onMessageClient={goToClientMessages} />
          : activeTab === 'tours'
          ? <TourPackagesScreen />
          : activeTab === 'calendar'
          ? <CalendarScreen />
          : activeTab === 'messages'
          ? (
            <MessagesScreen
              openForClient={pendingMessageClient}
              onConsumeOpenRequest={() => setPendingMessageClient(null)}
            />
          )
          : activeTab === 'payments'
          ? <PaymentsScreen />
          : activeTab === 'documents'
          ? <AdminDocumentsScreen />
          : activeTab === 'tripRequests'
          ? <TripRequestsScreen />
          : activeTab === 'accounts'
          ? <AccountsScreen />
          : activeTab === 'settings'
          ? <AdminSettingsScreen />
          : activeTab === 'notifications'
          ? <NotificationsScreen recipientId={user?.id} onNavigateTab={setActiveTab} />
          : <PlaceholderScreen tabKey={activeTab} />
        }
      </View>

      <BottomNavBar active={activeTab} onSelect={handleSelect} insetBottom={insets.bottom} notificationsBadge={unreadNotifications} />

      {sidebarOpen && (
        <>
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: 'rgba(0,0,0,0.52)', opacity: overlayAnim, zIndex: 30 },
            ]}
          >
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeSidebar} />
          </Animated.View>

          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              { width: SIDEBAR_W, zIndex: 40, transform: [{ translateX: slideAnim }] },
            ]}
          >
            <Sidebar
              active={activeTab}
              onSelect={handleSelect}
              onClose={closeSidebar}
              onLogout={handleLogout}
              insetTop={insets.top}
              insetBottom={insets.bottom}
            />
          </Animated.View>
        </>
      )}

      <WelcomeModal
        visible={showWelcome}
        onClose={() => { setShowWelcome(false); setTooltipStep(1); }}
        emoji="🛡️"
        title="Welcome, Admin!"
        message="You're logged in as Super Administrator. Manage bookings, tours, and messages from your dashboard."
      />

      <LogoutConfirmModal
        visible={showLogoutConfirm}
        onCancel={cancelLogout}
        onConfirm={confirmLogout}
      />
    </SafeAreaView>
  );
}
