/**
 * admin-dashboard.tsx
 */

import React, { useState, useRef, useMemo } from 'react';
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
import { ThemeProvider, useAppTheme, ColorPalette } from '@/components/admin/ThemeContext';

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

const AnnouncementsIcon = ({ color = C.white }: IconColorProp) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M3 10v4a1 1 0 001 1h2l8 4V5l-8 4H4a1 1 0 00-1 1z" stroke={color} strokeWidth={1.8} strokeLinejoin="round"/>
    <Path d="M19 9a4 4 0 010 6" stroke={color} strokeWidth={1.8} strokeLinecap="round"/>
    <Path d="M7 15v3a1.5 1.5 0 003 0v-2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
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

const MenuIcon = ({ color = C.amber }: { color?: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M3 7h18M3 12h18M3 17h12" stroke={color} strokeWidth={2.8} strokeLinecap="round"/>
  </Svg>
);

const BellIcon = ({ color = C.amber }: IconColorProp) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 2a6 6 0 00-6 6v3.6c0 .7-.24 1.38-.68 1.92L4 15.5c-.7.86-.08 2.15 1.02 2.15h13.96c1.1 0 1.72-1.29 1.02-2.15l-1.32-2.5A3 3 0 0118 11.6V8a6 6 0 00-6-6z" />
    <Path d="M9.5 19.5a2.5 2.5 0 005 0h-5z" />
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
  { key: 'announcements', label: 'Announcements',    Icon: AnnouncementsIcon },
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
      <MenuIcon color={C.amber} />
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
    backgroundColor: C.cardBg,
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
    width: 38, height: 38, borderRadius: 11,
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
  tours: 'Tours', calendar: 'Calendar', payments: 'Payments', announcements: 'Announcements',
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
   SETTINGS SCREEN — collapsible card, same
   pattern as the dashboard's Filters bar
════════════════════════════════════════ */
const SettingsChevronIcon = ({ color = C.amber }: IconColorProp) => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const MoonFieldIcon = ({ color = C.amber }: IconColorProp) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M20 14.5A8.5 8.5 0 119.5 4a7 7 0 0010.5 10.5z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
  </Svg>
);

const GlobeFieldIcon = ({ color = C.amber }: IconColorProp) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M12 21a9 9 0 100-18 9 9 0 000 18z" stroke={color} strokeWidth={1.8} />
    <Path d="M3 12h18M12 3c2.4 2.5 3.6 5.6 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.6-3.6-9S9.6 5.5 12 3z" stroke={color} strokeWidth={1.8} />
  </Svg>
);

const LANGUAGE_OPTIONS = ['English', 'Filipino'];

const SettingsScreen = () => {
  const { C, isDark, toggleDarkMode } = useAppTheme();
  const st = useMemo(() => makeSettingsStyles(C), [C]);
  const [language, setLanguage] = useState('English');
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <View style={st.panel}>
        <View style={st.field}>
          <Text style={st.fieldLabel}>DARK MODE</Text>
          <View style={st.fieldBox}>
            <MoonFieldIcon color={C.amber} />
            <Text style={st.fieldValue}>{isDark ? 'On' : 'Off'}</Text>
            <View style={{ flex: 1 }} />
            <Switch
              value={isDark}
              onValueChange={(v) => toggleDarkMode(v)}
              trackColor={{ false: C.divider, true: C.amber }}
              thumbColor={C.white}
            />
          </View>
        </View>

        <View style={st.field}>
          <Text style={st.fieldLabel}>LANGUAGE</Text>
          <TouchableOpacity style={st.fieldBox} activeOpacity={0.8} onPress={() => setShowLanguagePicker(true)}>
            <GlobeFieldIcon color={C.amber} />
            <Text style={st.fieldValue}>{language}</Text>
            <View style={{ flex: 1 }} />
            <SettingsChevronIcon color={C.amber} />
          </TouchableOpacity>
        </View>
      </View>

      <Copyright />

      <Modal
        visible={showLanguagePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguagePicker(false)}
        statusBarTranslucent
      >
        <TouchableOpacity style={st.pmBackdrop} activeOpacity={1} onPress={() => setShowLanguagePicker(false)}>
          <TouchableOpacity style={st.pmSheet} activeOpacity={1}>
            <Text style={st.pmTitle}>Language</Text>
            {LANGUAGE_OPTIONS.map((opt) => {
              const isSelected = opt === language;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[st.pmRow, isSelected && st.pmRowSelected]}
                  activeOpacity={0.75}
                  onPress={() => { setLanguage(opt); setShowLanguagePicker(false); }}
                >
                  <Text style={[st.pmRowText, isSelected && st.pmRowTextSelected]}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const makeSettingsStyles = (C: ColorPalette) => StyleSheet.create({
  panel: {
    marginHorizontal: 16, marginTop: 16, paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: C.cardBg, borderRadius: 14,
    borderWidth: 1, borderColor: C.divider,
    gap: 12,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1 },
    }),
  },
  field: { gap: 6 },
  fieldLabel: { fontSize: 9.5, fontWeight: '800', color: C.brownMid, opacity: 0.65, letterSpacing: 0.5 },
  fieldBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.lightBg, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 14,
    borderWidth: 1, borderColor: C.divider,
  },
  fieldValue: { fontSize: 13, fontWeight: '700', color: C.brown, flexShrink: 1 },
  pmBackdrop: { flex: 1, backgroundColor: 'rgba(59,26,12,0.5)', justifyContent: 'flex-end' },
  pmSheet: {
    backgroundColor: C.cardBg,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 30,
  },
  pmTitle: { fontSize: 13, fontWeight: '900', color: C.brown, marginBottom: 10, letterSpacing: 0.3 },
  pmRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.divider + '55',
  },
  pmRowSelected:     {},
  pmRowText:         { fontSize: 13, color: C.brownMid, fontWeight: '600' },
  pmRowTextSelected: { color: C.amber, fontWeight: '800' },
});

/* ════════════════════════════════════════
   TOP NAV BAR
════════════════════════════════════════ */
const TopNav = ({ activeTab, onOpenMenu }: { activeTab: string; onOpenMenu: () => void }) => {
  const { C } = useAppTheme();
  const tn = useMemo(() => makeTopNavStyles(C), [C]);
  const allLabels: Record<string, string> = { dashboard: '', ...TAB_LABELS };
  return (
    <View style={tn.shadowLayer}>
      <View style={tn.bar}>
        <TouchableOpacity style={tn.menuBtn} onPress={onOpenMenu} activeOpacity={0.8}>
          <MenuIcon color={C.white} />
        </TouchableOpacity>

        <View style={tn.titleWrap}>
          <Text
            style={[tn.title, { height: 0, opacity: 0 }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {allLabels[activeTab] || ''}
          </Text>
          <Text style={tn.subtitle} numberOfLines={1} ellipsizeMode="tail">GoVenture Travel & Tours</Text>
        </View>
      </View>
    </View>
  );
};

/* ════════════════════════════════════════
   ONBOARDING TOOLTIP — points at a TopNav icon
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
    borderRadius: 14,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 },
    }),
  },
  bar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 12,
    backgroundColor: C.cardBg,
    borderRadius: 14,
    gap: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  menuBtn: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: C.amber,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    ...Platform.select({
      ios:     { shadowColor: C.amber, shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  titleWrap: { flex: 1, minWidth: 0 },
  title:     { fontSize: 14, fontWeight: '900', color: C.brown, letterSpacing: 0.1 },
  subtitle:  { fontSize: 10.5, color: C.brownMid, opacity: 0.7, fontWeight: '600', marginTop: 1 },
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
  { key: 'notifications', label: 'Notifications', Icon: BellIcon, badge: 3 },
  { key: 'accounts',      label: 'Me',            Icon: AccountsIcon },
];

const BottomNavBar = ({
  active, onSelect, insetBottom,
}: { active: string; onSelect: (key: string) => void; insetBottom: number }) => {
  const { C } = useAppTheme();
  const bn = useMemo(() => makeBottomNavStyles(C), [C]);
  return (
    <View style={[bn.bar, { paddingBottom: 8 + insetBottom }]}>
      {BOTTOM_NAV_ITEMS.map((item) => {
        const isActive = active === item.key;
        const color = isActive ? C.amber : C.brownMid;
        return (
          <TouchableOpacity
            key={item.key}
            style={bn.item}
            activeOpacity={0.75}
            onPress={() => onSelect(item.key)}
          >
            <View style={bn.iconWrap}>
              <item.Icon color={color} />
              {item.badge !== undefined && (
                <View style={bn.badge}>
                  <Text style={bn.badgeText}>{item.badge}</Text>
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

  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [activeTab,    setActiveTab]    = useState('dashboard');
  const [showWelcome,  setShowWelcome]  = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  // 0 = none, 1 = menu
  const [tooltipStep,  setTooltipStep]  = useState(0);

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
        <TopNav activeTab={activeTab} onOpenMenu={openSidebar} />

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
          ? <BookingsScreen />
          : activeTab === 'tours'
          ? <TourPackagesScreen />
          : activeTab === 'calendar'
          ? <CalendarScreen />
          : activeTab === 'messages'
          ? <MessagesScreen />
          : activeTab === 'payments'
          ? <PaymentsScreen />
          : activeTab === 'accounts'
          ? <AccountsScreen />
          : activeTab === 'settings'
          ? <SettingsScreen />
          : <PlaceholderScreen tabKey={activeTab} />
        }
      </View>

      <BottomNavBar active={activeTab} onSelect={handleSelect} insetBottom={insets.bottom} />

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
