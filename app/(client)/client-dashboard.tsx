/**
 * client-dashboard.tsx
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import WelcomeModal from '@/components/WelcomeModal';
import Copyright from '@/components/Copyright';
import ClientMessagesScreen from '@/components/client/messages/ClientMessagesScreen';
import ClientDashboardHome from '@/components/client/dashboard/ClientDashboardHome';
import ToursScreen from '@/components/client/tours/ToursScreen';
import PlanTripScreen from '@/components/client/plan/PlanTripScreen';
import MyBookingsScreen from '@/components/client/bookings/MyBookingsScreen';
import { BookingsProvider } from '@/components/client/bookings/BookingsContext';
import DocumentsScreen from '@/components/client/documents/DocumentsScreen';
import AccountScreen from '@/components/client/account/AccountScreen';
import ClientTopNav from '@/components/client/ClientTopNav';
import ClientSidebar, { SIDEBAR_W } from '@/components/client/ClientSidebar';
import LogoutConfirmModal from '@/components/client/LogoutConfirmModal';
import { BOTTOM_NAV_TABS, TAB_META, TabKey } from '@/components/client/navConfig';

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

const PlaneIcon = ({ color = '#FFFFFF' }: { color?: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M2 16l7-2 3.5-7.5c.3-.6 1.2-.6 1.5 0L14 8l6.5-2c1-.3 2 .6 1.6 1.6l-2 6.5-2 3.5c-.2.4-.9.4-1 0l-1.5-3.5-7 3-4.5-.6c-.4 0-.6-.5-.3-.8L6 13" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PlaceholderTab = ({ tab }: { tab: Exclude<TabKey, 'dashboard' | 'account'> }) => {
  const meta = TAB_META[tab];
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Text style={{ fontSize: 48 }}>{meta.emoji}</Text>
        <Text style={{ fontSize: 18, fontWeight: '900', color: C.brown }}>{meta.label}</Text>
      </View>
      <Copyright />
    </View>
  );
};

const BottomNav = ({ active, onSelect, insetBottom }: { active: TabKey; onSelect: (key: TabKey) => void; insetBottom: number }) => (
  <View style={[bn.wrapper, { paddingBottom: 8 + insetBottom }]}>
    {BOTTOM_NAV_TABS.map((item) => {
      const isActive = active === item.key;
      return (
        <TouchableOpacity
          key={item.key}
          style={bn.item}
          activeOpacity={0.75}
          onPress={() => onSelect(item.key)}
        >
          <item.Icon color={isActive ? C.amber : C.brownMid} />
          <Text style={[bn.label, isActive && bn.labelActive]} numberOfLines={1}>
            {item.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

export default function ClientDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showWelcome, setShowWelcome] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const slideAnim = useRef(new Animated.Value(-SIDEBAR_W)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const openSidebar = () => {
    setSidebarOpen(true);
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const closeSidebar = () => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: -SIDEBAR_W, useNativeDriver: true, tension: 80, friction: 10 }),
      Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setSidebarOpen(false));
  };

  const handleSelect = (key: TabKey) => {
    setActiveTab(key);
    closeSidebar();
  };

  const handleLogout = () => {
    closeSidebar();
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    router.replace('/login' as any);
  };

  return (
    <BookingsProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

        <ClientTopNav onOpenMenu={openSidebar} />

        <View style={{ flex: 1 }}>
          {activeTab === 'dashboard' ? (
            <ClientDashboardHome onNavigate={setActiveTab} />
          ) : activeTab === 'tours' ? (
            <ToursScreen />
          ) : activeTab === 'plan' ? (
            <PlanTripScreen />
          ) : activeTab === 'bookings' ? (
            <MyBookingsScreen onBrowseTours={() => setActiveTab('tours')} />
          ) : activeTab === 'documents' ? (
            <DocumentsScreen />
          ) : activeTab === 'messages' ? (
            <ClientMessagesScreen />
          ) : activeTab === 'account' ? (
            <AccountScreen onLogout={handleLogout} />
          ) : (
            <PlaceholderTab tab={activeTab} />
          )}

          {activeTab !== 'plan' && (
            <TouchableOpacity style={fab.btn} activeOpacity={0.85} onPress={() => setActiveTab('plan')}>
              <PlaneIcon />
              <View style={fab.dot} />
            </TouchableOpacity>
          )}
        </View>

        <BottomNav active={activeTab} onSelect={setActiveTab} insetBottom={insets.bottom} />

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
              <ClientSidebar
                active={activeTab}
                onSelect={handleSelect}
                onClose={closeSidebar}
                onLogout={handleLogout}
                insetBottom={insets.bottom}
              />
            </Animated.View>
          </>
        )}

        <WelcomeModal
          visible={showWelcome}
          onClose={() => setShowWelcome(false)}
          emoji="🌴"
          title="Welcome, Traveler!"
          message="You're logged in to your GoVenture account. Browse tours and manage your bookings here."
        />

        <LogoutConfirmModal
          visible={showLogoutConfirm}
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={confirmLogout}
        />
      </SafeAreaView>
    </BookingsProvider>
  );
}

const bn = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    backgroundColor: C.cardBg,
    borderTopWidth: 1,
    borderTopColor: C.divider,
    paddingTop: 8,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: -3 } },
      android: { elevation: 10 },
    }),
  },
  item:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 2 },
  label: { fontSize: 8.5, fontWeight: '700', color: C.brownMid },
  labelActive: { color: C.amber, fontWeight: '800' },
});

const fab = StyleSheet.create({
  btn: {
    position: 'absolute', bottom: 20, right: 16,
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: C.amber, alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios:     { shadowColor: C.amber, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 6 },
    }),
  },
  dot: {
    position: 'absolute', top: 2, right: 2,
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#2FBF9F',
    borderWidth: 2, borderColor: C.amber,
  },
});
