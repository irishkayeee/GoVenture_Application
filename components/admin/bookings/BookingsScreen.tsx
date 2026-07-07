/**
 * BookingsScreen.tsx
 * Bookings tab — search + status filter, a live count, and a scrollable list
 * of color-accented booking cards. Tapping a card opens BookingDetailModal
 * with the full booking info, client card, note field, and actions.
 */

import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import Copyright from '@/components/Copyright';
import { C as LIGHT_C } from '../dashboard/theme';
import { useAppTheme, ColorPalette } from '../ThemeContext';
import { BOOKINGS, Booking, BookingStatus, STATUS_FILTER_OPTIONS, formatPeso } from './mockData';
import BookingDetailModal from './BookingDetailModal';

const STATUS_STYLE: Record<BookingStatus, { bg: string; color: string; accent: string }> = {
  Confirmed: { bg: '#E7F9F3', color: '#12946F', accent: '#12946F' },
  Pending:   { bg: '#FFF5E0', color: '#B8922E', accent: '#B8922E' },
  Cancelled: { bg: '#FDEAEA', color: LIGHT_C.danger,  accent: LIGHT_C.danger },
};

const AVATAR_COLORS = [LIGHT_C.amber, LIGHT_C.purple, LIGHT_C.info, LIGHT_C.danger, '#12946F'];

const SearchIcon = ({ color = LIGHT_C.brownMid }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const FunnelIcon = ({ color = LIGHT_C.amber }: { color?: string }) => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Path d="M3 4h18l-7 8.5V19l-4 2v-8.5L3 4z" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
  </Svg>
);

const CheckIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke={LIGHT_C.amber} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PlaneIcon = ({ color }: { color: string }) => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2.5 1.8V22l3.5-1 3.5 1v-1.2L12 19v-5.5l9 2.5z"
      fill={color}
    />
  </Svg>
);

const PeopleIcon = ({ color = LIGHT_C.brownMid }: { color?: string }) => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
    <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const CalendarIcon = ({ color = LIGHT_C.brownMid }: { color?: string }) => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
    <Path d="M5 6a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6z" stroke={color} strokeWidth={1.8} />
    <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const ClipboardIcon = () => (
  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
    <Path d="M7 4.5A1.5 1.5 0 018.5 3h7A1.5 1.5 0 0117 4.5V6H7V4.5z" stroke="#FFFFFF" strokeWidth={1.6} />
    <Path d="M6 5h12a1 1 0 011 1v13a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 015 19V6a1 1 0 011-1z" stroke="#FFFFFF" strokeWidth={1.6} />
    <Path d="M9 12l2 2 4-4" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

type PickerModalProps = {
  visible: boolean; title: string;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
};

const StatusPickerModal = ({ visible, title, options, selected, onSelect, onClose, bs }: PickerModalProps & { bs: ReturnType<typeof makeStyles> }) => {
  if (!visible) return null;
  return (
    <View style={bs.pmBackdropWrap} pointerEvents="box-none">
      <TouchableOpacity style={bs.pmBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={bs.pmSheet}>
        <Text style={bs.pmTitle}>{title}</Text>
        {options.map((opt) => {
          const isSelected = opt.value === selected;
          return (
            <TouchableOpacity
              key={opt.value || '__all__'}
              style={[bs.pmRow, isSelected && bs.pmRowSelected]}
              activeOpacity={0.75}
              onPress={() => { onSelect(opt.value); onClose(); }}
            >
              <Text style={[bs.pmRowText, isSelected && bs.pmRowTextSelected]}>{opt.label}</Text>
              {isSelected && <CheckIcon />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const BookingCard = ({ booking, index, onPress, C, bs }: { booking: Booking; index: number; onPress: () => void; C: ColorPalette; bs: ReturnType<typeof makeStyles> }) => {
  const st = STATUS_STYLE[booking.status];
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];

  return (
    <TouchableOpacity style={bs.card} activeOpacity={0.85} onPress={onPress}>
      <View style={[bs.cardAccent, { backgroundColor: st.accent }]} />
      <View style={bs.cardBody}>
        <View style={bs.cardTopRow}>
          <View style={[bs.avatar, { backgroundColor: avatarColor }]}>
            <Text style={bs.avatarText}>{booking.initials}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={bs.clientName} numberOfLines={1}>{booking.clientName}</Text>
            <View style={bs.destRow}>
              <PlaneIcon color={C.brownMid} />
              <Text style={bs.destText} numberOfLines={1}>{booking.destination}</Text>
            </View>
          </View>
          <View style={[bs.badge, { backgroundColor: st.bg }]}>
            <Text style={[bs.badgeText, { color: st.color }]}>{booking.status}</Text>
          </View>
        </View>

        <View style={bs.cardBottomRow}>
          <View style={bs.metaItem}>
            <CalendarIcon color={C.brownMid} />
            <Text style={bs.metaText} numberOfLines={1}>{booking.startDate}</Text>
          </View>
          <View style={bs.metaItem}>
            <PeopleIcon color={C.brownMid} />
            <Text style={bs.metaText}>{booking.pax} pax</Text>
          </View>
          <View style={{ flex: 1 }} />
          <Text style={bs.priceText}>{formatPeso(booking.price)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function BookingsScreen() {
  const { C } = useAppTheme();
  const bs = useMemo(() => makeStyles(C), [C]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('');
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [bookings, setBookings] = useState<Booking[]>(BOOKINGS);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter((b) => {
      const matchesQuery =
        !q ||
        b.clientName.toLowerCase().includes(q) ||
        b.destination.toLowerCase().includes(q) ||
        b.reference.toLowerCase().includes(q);
      const matchesStatus = !statusFilter || b.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [bookings, query, statusFilter]);

  const statusLabel = STATUS_FILTER_OPTIONS.find((o) => o.value === statusFilter)?.label ?? 'All Status';

  const updateStatus = (id: string, status: BookingStatus, paymentStatus?: Booking['paymentStatus']) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status, ...(paymentStatus ? { paymentStatus } : {}) } : b))
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 8 }} keyboardShouldPersistTaps="handled">
        <LinearGradient
          colors={['#6B2E10', '#B85F17', '#D17B2E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={bs.headerCard}
        >
          <View style={bs.headerDecorLayer} pointerEvents="none">
            <Text style={[bs.headerDecorEmoji, { top: 8, right: 66, fontSize: 15, opacity: 0.55, transform: [{ rotate: '18deg' }] }]}>✈️</Text>
            <Text style={[bs.headerDecorEmoji, { top: 2, right: 4, fontSize: 20, opacity: 0.5 }]}>📍</Text>
            <Text style={[bs.headerDecorEmoji, { bottom: -14, right: 74, fontSize: 60, opacity: 0.14 }]}>🏝️</Text>
          </View>

          <View style={bs.headerTopRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={bs.headerEyebrow}>BOOKINGS MANAGEMENT</Text>
              <Text style={bs.headerTitle}>Bookings</Text>
              <Text style={bs.headerSub}>Manage bookings, track reservations, and update booking status.</Text>
            </View>

            <View style={bs.headerIconWrap}>
              <View style={bs.headerRing2} />
              <View style={bs.headerRing1} />
              <View style={bs.headerIconCircle}>
                <ClipboardIcon />
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={bs.searchRow}>
          <View style={bs.searchBox}>
            <SearchIcon color={C.brownMid} />
            <TextInput
              style={bs.searchInput}
              placeholder="Search by name, destination, or reference"
              placeholderTextColor={C.brownMid + '80'}
              value={query}
              onChangeText={setQuery}
            />
          </View>
          <TouchableOpacity
            style={[bs.filterBtn, statusFilter && bs.filterBtnActive]}
            activeOpacity={0.8}
            onPress={() => setShowStatusPicker(true)}
          >
            <FunnelIcon color={statusFilter ? C.white : C.amber} />
            <Text style={[bs.filterBtnText, statusFilter && bs.filterBtnTextActive]}>Filter</Text>
          </TouchableOpacity>
        </View>

        {!!statusFilter && (
          <View style={bs.activeFilterRow}>
            <View style={bs.activeFilterChip}>
              <Text style={bs.activeFilterText}>{statusLabel}</Text>
              <TouchableOpacity onPress={() => setStatusFilter('')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Text style={bs.activeFilterClear}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={bs.countRow}>
          <Text style={bs.countText}>{filtered.length} booking{filtered.length === 1 ? '' : 's'}</Text>
        </View>

        <View style={bs.list}>
          {filtered.length === 0 ? (
            <View style={bs.emptyWrap}>
              <Text style={bs.emptyEmoji}>🔍</Text>
              <Text style={bs.emptyText}>No bookings match your search.</Text>
            </View>
          ) : (
            filtered.map((b, i) => (
              <BookingCard key={b.id} booking={b} index={i} onPress={() => setSelected(b)} C={C} bs={bs} />
            ))
          )}
        </View>

        <Copyright />
      </ScrollView>

      <StatusPickerModal
        visible={showStatusPicker}
        title="Filter by Status"
        options={STATUS_FILTER_OPTIONS}
        selected={statusFilter}
        onSelect={(v) => setStatusFilter(v as BookingStatus | '')}
        onClose={() => setShowStatusPicker(false)}
        bs={bs}
      />

      <BookingDetailModal
        visible={!!selected}
        booking={selected}
        onClose={() => setSelected(null)}
        onConfirm={(id) => updateStatus(id, 'Confirmed', 'Paid')}
        onCancel={(id) => updateStatus(id, 'Cancelled', 'Refunded')}
      />
    </View>
  );
}

const makeStyles = (C: ColorPalette) => StyleSheet.create({
  headerCard: {
    marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    borderRadius: 20, padding: 18,
    overflow: 'hidden', position: 'relative',
    ...Platform.select({
      ios:     { shadowColor: '#3B1A0C', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 5 },
    }),
  },
  headerDecorLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  headerDecorEmoji: { position: 'absolute' },
  headerTopRow: { flexDirection: 'row', alignItems: 'flex-start' },
  headerEyebrow: { fontSize: 10.5, fontWeight: '800', color: '#FFD9A0', letterSpacing: 0.6 },
  headerTitle: { fontSize: 21, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3, marginTop: 4 },
  headerSub: { fontSize: 11.5, color: 'rgba(255,255,255,0.85)', opacity: 1, marginTop: 6, lineHeight: 16, maxWidth: 230 },
  headerIconWrap: {
    width: 64, height: 64,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 8, flexShrink: 0,
  },
  headerRing2: {
    position: 'absolute', width: 64, height: 64, borderRadius: 32,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  headerRing1: {
    position: 'absolute', width: 50, height: 50, borderRadius: 25,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  headerIconCircle: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },

  searchRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 14 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.cardBg, borderRadius: 12, paddingHorizontal: 12, height: 42,
    borderWidth: 1, borderColor: C.divider,
  },
  searchInput: { flex: 1, fontSize: 13, color: C.brown },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.cardBg, borderRadius: 12, paddingHorizontal: 14, height: 42,
    borderWidth: 1.5, borderColor: C.amber,
  },
  filterBtnActive: { backgroundColor: C.amber },
  filterBtnText: { fontSize: 12.5, fontWeight: '800', color: C.amber },
  filterBtnTextActive: { color: '#FFFFFF' },

  activeFilterRow: { paddingHorizontal: 16, marginTop: 10 },
  activeFilterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
    backgroundColor: C.lightBg, borderRadius: 20, borderWidth: 1, borderColor: C.divider,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  activeFilterText: { fontSize: 11.5, fontWeight: '700', color: C.brown },
  activeFilterClear: { fontSize: 12, fontWeight: '900', color: C.brownMid },

  countRow: { paddingHorizontal: 16, marginTop: 14, marginBottom: 8 },
  countText: { fontSize: 12.5, fontWeight: '800', color: C.brownMid, opacity: 0.75, letterSpacing: 0.3 },

  list: { paddingHorizontal: 16, gap: 10 },
  card: {
    flexDirection: 'row', backgroundColor: C.cardBg, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: C.divider,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1 },
    }),
  },
  cardAccent: { width: 5 },
  cardBody: { flex: 1, padding: 12, gap: 10 },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' },
  clientName: { fontSize: 13.5, fontWeight: '800', color: C.brown },
  destRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  destText: { fontSize: 11.5, color: C.brownMid, opacity: 0.85, flexShrink: 1 },
  badge: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4, flexShrink: 0 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  cardBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  metaText: { fontSize: 11, color: C.brownMid, opacity: 0.8, fontWeight: '600' },
  priceText: { fontSize: 13.5, fontWeight: '900', color: C.amber },

  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50, gap: 8 },
  emptyEmoji: { fontSize: 34 },
  emptyText: { fontSize: 12.5, color: C.brownMid, opacity: 0.7, fontWeight: '600' },

  pmBackdropWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 },
  pmBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(59,26,12,0.5)' },
  pmSheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: C.cardBg,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 30,
  },
  pmTitle: { fontSize: 13, fontWeight: '900', color: C.brown, marginBottom: 10, letterSpacing: 0.3 },
  pmRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  pmRowSelected: {},
  pmRowText: { fontSize: 13, color: C.brownMid, fontWeight: '600' },
  pmRowTextSelected: { color: C.amber, fontWeight: '800' },
});
