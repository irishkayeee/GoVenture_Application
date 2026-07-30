/**
 * NotificationsScreen.tsx
 * Client Notifications tab — real feed backed by the shared `notifications`
 * table (recipientType=client). Filter by category (dropdown), mark-all-read,
 * per-row delete, and a detail popup (tap a card to mark it read + see the
 * full message with a category-appropriate action button).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import Copyright from '@/components/Copyright';
import { C } from '../theme';
import ClientPageHero from '../ClientPageHero';
import { useAuth } from '@/components/auth/AuthContext';
import { TabKey } from '../navConfig';
import {
  NOTIFICATIONS_LIST_API_URL, NOTIFICATION_MARK_READ_API_URL,
  NOTIFICATIONS_MARK_ALL_READ_API_URL, NOTIFICATION_DELETE_API_URL,
} from '@/constants/api';

type NotificationCategory = 'booking' | 'payment' | 'document' | 'message' | 'security' | 'reminder' | 'system';

type ClientNotification = {
  id:        string;
  category:  NotificationCategory;
  title:     string;
  message:   string;
  actionUrl: string | null;
  bookingId: string | null;
  isRead:    boolean;
  timeAgo:   string;
};

const FILTERS: { value: NotificationCategory | ''; label: string }[] = [
  { value: '',          label: 'All' },
  { value: 'booking',   label: 'Bookings' },
  { value: 'payment',   label: 'Payments' },
  { value: 'document',  label: 'Documents' },
  { value: 'message',   label: 'Messages' },
];

const ACTION_LABEL: Record<NotificationCategory, string> = {
  booking: 'View Booking', payment: 'View Booking', document: 'View Documents', message: 'View Message',
  security: 'View Account', reminder: 'View Dashboard', system: 'View Dashboard',
};

const CalendarIcon = ({ color }: { color: string }) => (
  <Svg width={17} height={17} viewBox="0 0 24 24" fill="none"><Path d="M5 6a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6z" stroke={color} strokeWidth={1.8} /><Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth={1.8} strokeLinecap="round" /></Svg>
);
const CardIcon = ({ color }: { color: string }) => (
  <Svg width={17} height={17} viewBox="0 0 24 24" fill="none"><Path d="M3 7a1 1 0 011-1h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" /><Path d="M3 10h18" stroke={color} strokeWidth={1.8} /></Svg>
);
const DocIcon = ({ color }: { color: string }) => (
  <Svg width={17} height={17} viewBox="0 0 24 24" fill="none"><Path d="M7 3h7l4 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" /><Path d="M14 3v4h4" stroke={color} strokeWidth={1.8} strokeLinejoin="round" /></Svg>
);
const ChatIcon = ({ color }: { color: string }) => (
  <Svg width={17} height={17} viewBox="0 0 24 24" fill="none"><Path d="M4 5h16v11H8l-4 4V5z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" /></Svg>
);
const ClockIcon = ({ color }: { color: string }) => (
  <Svg width={17} height={17} viewBox="0 0 24 24" fill="none"><Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} /><Path d="M12 7v5l3.5 2" stroke={color} strokeWidth={1.8} strokeLinecap="round" /></Svg>
);
const GearIcon = ({ color }: { color: string }) => (
  <Svg width={17} height={17} viewBox="0 0 24 24" fill="none"><Circle cx={12} cy={12} r={3.2} stroke={color} strokeWidth={1.8} /><Path d="M12 3v2.4M12 18.6V21M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M3 12h2.4M18.6 12H21M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7" stroke={color} strokeWidth={1.8} strokeLinecap="round" /></Svg>
);
const ShieldIcon = ({ color }: { color: string }) => (
  <Svg width={17} height={17} viewBox="0 0 24 24" fill="none"><Path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" /></Svg>
);
const TrashIcon = ({ color }: { color: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none"><Path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>
);
const ChevronIcon = ({ open, color = C.brownMid, size = 9 }: { open: boolean; color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
    <Path fill={color} d="M12 16L4 8h16z" />
  </Svg>
);
const CloseIcon = ({ color = C.brownMid, size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill={color} d="M6.4 5L12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4L12 13.4 6.4 19 5 17.6 10.6 12 5 6.4z" />
  </Svg>
);

const CATEGORY_META: Record<NotificationCategory, { Icon: React.FC<{ color: string }>; bg: string; color: string }> = {
  booking:  { Icon: CalendarIcon, bg: '#FFF3E8', color: C.amber },
  payment:  { Icon: CardIcon,     bg: '#FCE4E1', color: '#F44336' },
  document: { Icon: DocIcon,      bg: '#EDE7F6', color: '#9C27B0' },
  message:  { Icon: ChatIcon,     bg: '#E8F1FC', color: '#2196F3' },
  security: { Icon: ShieldIcon,   bg: '#FCE4E1', color: '#E5473A' },
  reminder: { Icon: ClockIcon,    bg: '#E8F5E9', color: '#4CAF50' },
  system:   { Icon: GearIcon,     bg: '#F1F1F1', color: C.brownMid },
};

const CATEGORY_TAB: Record<NotificationCategory, TabKey> = {
  booking: 'bookings', payment: 'bookings', document: 'documents', message: 'messages',
  security: 'account', reminder: 'dashboard', system: 'dashboard',
};

/* ── Category filter dropdown (replaces the old wrapping chip row) ── */
function FilterDropdown({ value, onChange }: { value: NotificationCategory | ''; onChange: (v: NotificationCategory | '') => void }) {
  const [open, setOpen] = useState(false);
  const activeLabel = FILTERS.find((f) => f.value === value)?.label ?? 'All';
  return (
    <View style={{ position: 'relative', flexShrink: 1, zIndex: 10 }}>
      <TouchableOpacity style={ns.filterTrigger} activeOpacity={0.8} onPress={() => setOpen((v) => !v)}>
        <Text style={ns.filterTriggerText} numberOfLines={1}>{activeLabel}</Text>
        <ChevronIcon open={open} />
      </TouchableOpacity>
      {open && (
        <View style={ns.filterMenu}>
          {FILTERS.map((f) => {
            const active = f.value === value;
            return (
              <TouchableOpacity
                key={f.value || 'all'}
                style={ns.filterMenuItem}
                activeOpacity={0.75}
                onPress={() => { onChange(f.value); setOpen(false); }}
              >
                <Text style={[ns.filterMenuItemText, active && ns.filterMenuItemTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

/* ── Notification detail popup ── */
function NotificationDetailModal({ visible, notification, onClose, onAction }: {
  visible: boolean; notification: ClientNotification | null; onClose: () => void; onAction: () => void;
}) {
  if (!notification) return null;
  const meta = CATEGORY_META[notification.category];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={dm.backdrop}>
        <View style={dm.card}>
          <View style={dm.topRow}>
            <View style={[ns.iconWrap, { backgroundColor: meta.bg }]}>
              <meta.Icon color={meta.color} />
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <CloseIcon />
            </TouchableOpacity>
          </View>

          <Text style={dm.title}>{notification.title}</Text>
          <Text style={dm.time}>{notification.timeAgo}</Text>
          <Text style={dm.message}>{notification.message}</Text>

          <View style={dm.btnRow}>
            <TouchableOpacity style={dm.cancelBtn} activeOpacity={0.85} onPress={onClose}>
              <Text style={dm.cancelText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dm.actionBtn} activeOpacity={0.85} onPress={onAction}>
              <Text style={dm.actionText}>{ACTION_LABEL[notification.category]}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

type Props = {
  onNavigate: (tab: TabKey) => void;
  onViewDocuments?: (bookingId: string) => void;
  onUnreadChange?: () => void;
};

export default function NotificationsScreen({ onNavigate, onViewDocuments, onUnreadChange }: Props) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<NotificationCategory | ''>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!user) return;
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ recipientType: 'client', recipientId: user.id, limit: '50' });
    if (filter) params.set('category', filter);
    fetch(`${NOTIFICATIONS_LIST_API_URL}&${params.toString()}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.status !== 'success') throw new Error(result.message || 'Failed to load notifications.');
        setNotifications(result.data);
      })
      .catch((e) => setError(e.message || 'Failed to load notifications.'))
      .finally(() => setLoading(false));
  }, [user, filter]);

  useEffect(() => { load(); }, [load]);

  const markRead = (n: ClientNotification) => {
    if (!user || n.isRead) return;
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    fetch(NOTIFICATION_MARK_READ_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientType: 'client', recipientId: user.id, notificationId: n.id }),
    }).catch(() => {});
    onUnreadChange?.();
  };

  const handlePress = (n: ClientNotification) => {
    markRead(n);
    setSelectedId(n.id);
  };

  const handleAction = () => {
    if (!selected) return;
    setSelectedId(null);
    if (selected.category === 'document' && selected.bookingId && onViewDocuments) {
      onViewDocuments(selected.bookingId);
    } else {
      onNavigate(CATEGORY_TAB[selected.category]);
    }
  };

  const handleMarkAllRead = () => {
    if (!user) return;
    setNotifications((prev) => prev.map((x) => ({ ...x, isRead: true })));
    fetch(NOTIFICATIONS_MARK_ALL_READ_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientType: 'client', recipientId: user.id }),
    }).catch(() => {});
    onUnreadChange?.();
  };

  const handleDelete = (id: string) => {
    if (!user) return;
    setNotifications((prev) => prev.filter((x) => x.id !== id));
    fetch(NOTIFICATION_DELETE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientType: 'client', recipientId: user.id, notificationId: id }),
    }).catch(() => {});
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const selected = useMemo(() => notifications.find((n) => n.id === selectedId) ?? null, [notifications, selectedId]);

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      <ClientPageHero icon="🔔" title="Notifications" subtitle="Updates about your bookings, payments, and messages." />

      <View style={ns.controlsRow}>
        <FilterDropdown value={filter} onChange={setFilter} />
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.75} style={ns.markAllBtn}>
            <Text style={ns.markAllText} numberOfLines={1}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={ns.list}>
        {loading ? (
          <View style={ns.emptyWrap}><ActivityIndicator color={C.amber} /></View>
        ) : error ? (
          <View style={ns.emptyWrap}>
            <Text style={ns.emptyText}>{error}</Text>
            <TouchableOpacity onPress={load}><Text style={[ns.emptyText, { color: C.amber, fontWeight: '800' }]}>Tap to retry</Text></TouchableOpacity>
          </View>
        ) : notifications.length === 0 ? (
          <View style={ns.emptyWrap}>
            <Text style={ns.emptyText}>No notifications here.</Text>
          </View>
        ) : (
          notifications.map((n) => {
            const meta = CATEGORY_META[n.category];
            return (
              <TouchableOpacity key={n.id} style={[ns.row, !n.isRead && ns.rowUnread]} activeOpacity={0.8} onPress={() => handlePress(n)}>
                <View style={[ns.iconWrap, { backgroundColor: meta.bg }]}>
                  <meta.Icon color={meta.color} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {!n.isRead && <View style={ns.unreadDot} />}
                    <Text style={ns.rowTitle} numberOfLines={1}>{n.title}</Text>
                  </View>
                  <Text style={ns.rowMessage} numberOfLines={2}>{n.message}</Text>
                  <Text style={ns.rowTime}>{n.timeAgo}</Text>
                </View>
                <TouchableOpacity style={ns.deleteBtn} activeOpacity={0.75} onPress={() => handleDelete(n.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <TrashIcon color={C.brownMid} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      <Copyright />

      <NotificationDetailModal
        visible={!!selected}
        notification={selected}
        onClose={() => setSelectedId(null)}
        onAction={handleAction}
      />
    </ScrollView>
  );
}

const ns = StyleSheet.create({
  controlsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: 10, paddingHorizontal: 16, marginTop: 14, zIndex: 10,
  },

  filterTrigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    borderWidth: 1, borderColor: C.divider, backgroundColor: C.cardBg,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, minWidth: 110,
  },
  filterTriggerText: { fontSize: 11.5, fontWeight: '800', color: C.brown },
  filterMenu: {
    position: 'absolute', top: 42, left: 0, backgroundColor: C.cardBg, borderRadius: 12,
    borderWidth: 1, borderColor: C.divider, paddingVertical: 4, minWidth: 160,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 8 },
    }),
  },
  filterMenuItem: { paddingHorizontal: 14, paddingVertical: 10 },
  filterMenuItemText: { fontSize: 12, fontWeight: '700', color: C.brown },
  filterMenuItemTextActive: { color: C.amber, fontWeight: '900' },

  markAllBtn: { flexShrink: 0 },
  markAllText: { fontSize: 11.5, fontWeight: '800', color: C.amber },

  list: { paddingHorizontal: 16, marginTop: 14, gap: 8 },
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: C.cardBg, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: C.divider,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1 },
    }),
  },
  rowUnread: { borderColor: C.amber },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  unreadDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.amber },
  rowTitle: { fontSize: 12.5, fontWeight: '900', color: C.brown, flexShrink: 1 },
  rowMessage: { fontSize: 11.5, color: C.brownMid, opacity: 0.85, marginTop: 3, lineHeight: 15 },
  rowTime: { fontSize: 10, color: C.brownMid, opacity: 0.6, fontWeight: '600', marginTop: 5 },
  deleteBtn: { padding: 4, flexShrink: 0 },

  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50, gap: 8 },
  emptyText: { fontSize: 12.5, color: C.brownMid, opacity: 0.7, fontWeight: '600' },
});

const dm = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(59,26,12,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%', maxWidth: 360,
    backgroundColor: C.cardBg, borderRadius: 20, padding: 20,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 12 },
    }),
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: '900', color: C.brown, marginTop: 14 },
  time: { fontSize: 10.5, color: C.brownMid, opacity: 0.6, fontWeight: '600', marginTop: 3 },
  message: { fontSize: 12.5, color: C.brownMid, lineHeight: 19, marginTop: 12 },

  btnRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, paddingVertical: 12,
    borderWidth: 1, borderColor: C.divider, backgroundColor: C.lightBg,
  },
  cancelText: { fontSize: 12.5, fontWeight: '800', color: C.brownMid },
  actionBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, paddingVertical: 12, backgroundColor: C.amber,
  },
  actionText: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' },
});
