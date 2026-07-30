/**
 * client-dashboard.tsx
 */

import React, { useRef, useState, useEffect } from 'react';
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
import { useRouter } from 'expo-router';
import WelcomeModal from '@/components/WelcomeModal';
import Copyright from '@/components/Copyright';
import ClientMessagesScreen from '@/components/client/messages/ClientMessagesScreen';
import ClientDashboardHome from '@/components/client/dashboard/ClientDashboardHome';
import ToursScreen from '@/components/client/tours/ToursScreen';
import MyBookingsScreen from '@/components/client/bookings/MyBookingsScreen';
import { BookingsProvider } from '@/components/client/bookings/BookingsContext';
import { FavoritesProvider } from '@/components/client/tours/FavoritesContext';
import DocumentsScreen from '@/components/client/documents/DocumentsScreen';
import AccountScreen from '@/components/client/account/AccountScreen';
import ClientNotificationsScreen from '@/components/client/notifications/NotificationsScreen';
import ClientTopNav from '@/components/client/ClientTopNav';
import ClientSidebar, { SIDEBAR_W } from '@/components/client/ClientSidebar';
import LogoutConfirmModal from '@/components/client/LogoutConfirmModal';
import { BOTTOM_NAV_TABS, TAB_META, TabKey } from '@/components/client/navConfig';
import { useAuth } from '@/components/auth/AuthContext';
import { NOTIFICATIONS_UNREAD_COUNT_API_URL, CLIENT_CONVERSATIONS_LIST_API_URL } from '@/constants/api';
import { TourConversation } from '@/components/client/messages/mockData';

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

const BottomNav = ({
  active, onSelect, insetBottom, badges,
}: {
  active: TabKey;
  onSelect: (key: TabKey) => void;
  insetBottom: number;
  badges?: Partial<Record<TabKey, number>>;
}) => (
  <View style={[bn.wrapper, { paddingBottom: 8 + insetBottom }]}>
    {BOTTOM_NAV_TABS.map((item) => {
      const isActive = active === item.key;
      const badgeCount = badges?.[item.key] ?? 0;
      return (
        <TouchableOpacity
          key={item.key}
          style={bn.item}
          activeOpacity={0.75}
          onPress={() => onSelect(item.key)}
        >
          <View>
            <item.Icon color={isActive ? C.amber : C.brownMid} />
            {badgeCount > 0 && (
              <View style={bn.badge}>
                <Text style={bn.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
              </View>
            )}
          </View>
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
  const { user, logout } = useAuth();
  const [showWelcome, setShowWelcome] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [documentsBookingId, setDocumentsBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = () => {
      fetch(`${NOTIFICATIONS_UNREAD_COUNT_API_URL}&recipientType=client&recipientId=${user.id}`)
        .then((res) => res.json())
        .then((result) => { if (result.status === 'success') setUnreadNotifications(result.data.unreadCount); })
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user, activeTab]);

  useEffect(() => {
    if (!user) return;
    const fetchUnreadMessages = () => {
      fetch(`${CLIENT_CONVERSATIONS_LIST_API_URL}&userId=${user.id}`)
        .then((res) => res.json())
        .then((result) => {
          if (result.status !== 'success') return;
          const total = (result.data as TourConversation[])
            .filter((c) => !c.isArchived)
            .reduce((sum, c) => sum + c.unreadCount, 0);
          setUnreadMessages(total);
        })
        .catch(() => {});
    };
    fetchUnreadMessages();
    const interval = setInterval(fetchUnreadMessages, 15000);
    return () => clearInterval(interval);
  }, [user, activeTab]);

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
    logout();
    router.replace('/login' as any);
  };

  return (
    <BookingsProvider>
    <FavoritesProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

        <ClientTopNav onOpenMenu={openSidebar} />

        <View style={{ flex: 1 }}>
          {activeTab === 'dashboard' ? (
            <ClientDashboardHome name={user?.fullName} onNavigate={setActiveTab} />
          ) : activeTab === 'tours' ? (
            <ToursScreen />
          ) : activeTab === 'bookings' ? (
            <MyBookingsScreen
              onBrowseTours={() => setActiveTab('tours')}
              onViewDocuments={(bookingId) => { setDocumentsBookingId(bookingId); setActiveTab('documents'); }}
            />
          ) : activeTab === 'documents' ? (
            <DocumentsScreen
              initialBookingId={documentsBookingId}
              onConsumedInitialBooking={() => setDocumentsBookingId(null)}
            />
          ) : activeTab === 'messages' ? (
            <ClientMessagesScreen onNavigate={setActiveTab} />
          ) : activeTab === 'notifications' ? (
            <ClientNotificationsScreen onNavigate={setActiveTab} />
          ) : activeTab === 'account' ? (
            <AccountScreen name={user?.fullName} email={user?.email} />
          ) : (
            <PlaceholderTab tab={activeTab} />
          )}
        </View>

        <BottomNav
          active={activeTab}
          onSelect={setActiveTab}
          insetBottom={insets.bottom}
          badges={{ messages: unreadMessages }}
        />

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
                notificationsBadge={unreadNotifications}
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
    </FavoritesProvider>
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
  badge: {
    position: 'absolute', top: -4, right: -8,
    minWidth: 15, height: 15, borderRadius: 8, backgroundColor: '#F44336',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: C.cardBg,
  },
  badgeText: { fontSize: 8, fontWeight: '800', color: '#FFFFFF' },
});
