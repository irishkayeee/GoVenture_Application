/**
 * CalendarScreen.tsx
 * Bookings Calendar tab — month grid navigation, a "Bookings on [date]" list
 * for the selected day, a Booking Summary stat grid, and Quick Filters by
 * status. Mirrors the concept/features of the Bookings tab, reskinned to the
 * app's warm cream/brown/amber palette and laid out for a single-column
 * mobile screen.
 */

import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import Copyright from '@/components/Copyright';
import { C as LIGHT_C } from '../dashboard/theme';
import { useAppTheme, ColorPalette } from '../ThemeContext';
import { BOOKINGS, Booking, BookingStatus, STATUS_FILTER_OPTIONS, formatPeso, formatCompactPeso } from '../bookings/mockData';
import BookingDetailModal from '../bookings/BookingDetailModal';

const STATUS_STYLE: Record<BookingStatus, { bg: string; color: string }> = {
  Confirmed: { bg: '#E7F9F3', color: '#12946F' },
  Pending:   { bg: '#FFF5E0', color: '#B8922E' },
  Cancelled: { bg: '#FDEAEA', color: LIGHT_C.danger },
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/* ── Icons ── */
const ChevronLeftIcon = ({ color = LIGHT_C.brownMid }: { color?: string }) => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Path d="M15 19l-7-7 7-7" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const ChevronRightIcon = ({ color = LIGHT_C.brownMid }: { color?: string }) => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Path d="M9 5l7 7-7 7" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const CalendarHeaderIcon = () => (
  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
    <Path d="M5 6a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6z" stroke="#FFFFFF" strokeWidth={1.6} />
    <Path d="M16 2v4M8 2v4M3 10h18" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" />
  </Svg>
);
const PlaneIcon = ({ color }: { color: string }) => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2.5 1.8V22l3.5-1 3.5 1v-1.2L12 19v-5.5l9 2.5z"
      fill={color}
    />
  </Svg>
);

/* ── Date helpers (Asia/Manila, matching WelcomeBanner convention) ── */
function getManilaTodayISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
function pad2(n: number): string { return n.toString().padStart(2, '0'); }
function isoOf(y: number, m: number, d: number): string { return `${y}-${pad2(m + 1)}-${pad2(d)}`; }

type DayCell = { iso: string; day: number; inMonth: boolean };

function buildMonthGrid(year: number, month: number): DayCell[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const cells: DayCell[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - firstWeekday + 1;
    const d = new Date(year, month, dayNum);
    cells.push({ iso: isoOf(d.getFullYear(), d.getMonth(), d.getDate()), day: d.getDate(), inMonth: d.getMonth() === month });
  }
  return cells;
}

function formatSelectedDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTH_NAMES[m - 1].slice(0, 3)} ${d}, ${y}`;
}

const BookingRow = ({ booking, onPress, C, cs }: { booking: Booking; onPress: () => void; C: ColorPalette; cs: ReturnType<typeof makeStyles> }) => {
  const st = STATUS_STYLE[booking.status];
  return (
    <TouchableOpacity style={cs.bookingRow} activeOpacity={0.8} onPress={onPress}>
      <View style={cs.rowAvatar}>
        <Text style={cs.rowAvatarText}>{booking.initials}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={cs.rowName} numberOfLines={1}>{booking.clientName}</Text>
        <View style={cs.rowDestWrap}>
          <PlaneIcon color={C.brownMid} />
          <Text style={cs.rowDest} numberOfLines={1}>{booking.destination}</Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <View style={[cs.rowBadge, { backgroundColor: st.bg }]}>
          <Text style={[cs.rowBadgeText, { color: st.color }]}>{booking.status}</Text>
        </View>
        <Text style={cs.rowPrice}>{formatPeso(booking.price)}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default function CalendarScreen() {
  const { C } = useAppTheme();
  const cs = useMemo(() => makeStyles(C), [C]);
  const todayISO = useMemo(getManilaTodayISO, []);
  const [todayY, todayM] = todayISO.split('-').map(Number);

  const [cursorYear, setCursorYear] = useState(todayY);
  const [cursorMonth, setCursorMonth] = useState(todayM - 1);
  const [selectedISO, setSelectedISO] = useState(todayISO);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('');
  const [bookings, setBookings] = useState<Booking[]>(BOOKINGS);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);

  const grid = useMemo(() => buildMonthGrid(cursorYear, cursorMonth), [cursorYear, cursorMonth]);

  const filteredBookings = useMemo(
    () => (statusFilter ? bookings.filter((b) => b.status === statusFilter) : bookings),
    [bookings, statusFilter]
  );

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    filteredBookings.forEach((b) => {
      const list = map.get(b.startDateISO) ?? [];
      list.push(b);
      map.set(b.startDateISO, list);
    });
    return map;
  }, [filteredBookings]);

  const dayBookings = bookingsByDate.get(selectedISO) ?? [];

  const summary = useMemo(() => {
    const guests = dayBookings.reduce((sum, b) => sum + b.pax, 0);
    const sales = dayBookings.reduce((sum, b) => sum + b.price, 0);
    const pending = dayBookings.filter((b) => b.status === 'Pending').length;
    const confirmed = dayBookings.filter((b) => b.status === 'Confirmed').length;
    const cancelled = dayBookings.filter((b) => b.status === 'Cancelled').length;
    return { bookings: dayBookings.length, guests, sales, pending, confirmed, cancelled };
  }, [dayBookings]);

  const goPrevMonth = () => {
    if (cursorMonth === 0) { setCursorMonth(11); setCursorYear((y) => y - 1); }
    else setCursorMonth((m) => m - 1);
  };
  const goNextMonth = () => {
    if (cursorMonth === 11) { setCursorMonth(0); setCursorYear((y) => y + 1); }
    else setCursorMonth((m) => m + 1);
  };
  const goToday = () => {
    setCursorYear(todayY);
    setCursorMonth(todayM - 1);
    setSelectedISO(todayISO);
  };

  const updateStatus = (id: string, status: BookingStatus, paymentStatus?: Booking['paymentStatus']) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status, ...(paymentStatus ? { paymentStatus } : {}) } : b)));
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 8 }}>
        <LinearGradient
          colors={['#6B2E10', '#B85F17', '#D17B2E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={cs.headerCard}
        >
          <View style={cs.headerDecorLayer} pointerEvents="none">
            <Text style={[cs.headerDecorEmoji, { top: 8, right: 66, fontSize: 15, opacity: 0.55, transform: [{ rotate: '18deg' }] }]}>✈️</Text>
            <Text style={[cs.headerDecorEmoji, { top: 2, right: 4, fontSize: 20, opacity: 0.5 }]}>📍</Text>
            <Text style={[cs.headerDecorEmoji, { bottom: -14, right: 74, fontSize: 60, opacity: 0.14 }]}>🏝️</Text>
          </View>

          <View style={cs.headerTopRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={cs.headerEyebrow}>CALENDAR VIEW</Text>
              <Text style={cs.headerTitle}>Bookings Calendar</Text>
              <Text style={cs.headerSub}>View and manage all tour bookings in calendar view.</Text>
            </View>

            <View style={cs.headerIconWrap}>
              <View style={cs.headerRing2} />
              <View style={cs.headerRing1} />
              <View style={cs.headerIconCircle}>
                <CalendarHeaderIcon />
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={cs.calendarCard}>
          <View style={cs.navRow}>
            <TouchableOpacity style={cs.navBtn} activeOpacity={0.8} onPress={goPrevMonth}>
              <ChevronLeftIcon color={C.brownMid} />
            </TouchableOpacity>
            <TouchableOpacity style={cs.navBtn} activeOpacity={0.8} onPress={goNextMonth}>
              <ChevronRightIcon color={C.brownMid} />
            </TouchableOpacity>
            <TouchableOpacity style={cs.todayBtn} activeOpacity={0.85} onPress={goToday}>
              <Text style={cs.todayBtnText}>Today</Text>
            </TouchableOpacity>
            <Text style={cs.monthTitle} numberOfLines={1}>{MONTH_NAMES[cursorMonth]} {cursorYear}</Text>
          </View>

          <View style={cs.weekdayRow}>
            {WEEKDAY_LABELS.map((w) => (
              <View key={w} style={cs.weekdayCell}>
                <Text style={cs.weekdayText}>{w}</Text>
              </View>
            ))}
          </View>

          <View style={cs.grid}>
            {grid.map((cell) => {
              const isToday = cell.iso === todayISO;
              const isSelected = cell.iso === selectedISO;
              const hasBookings = (bookingsByDate.get(cell.iso)?.length ?? 0) > 0;

              return (
                <TouchableOpacity
                  key={cell.iso}
                  style={[cs.dayCell, isSelected && cs.dayCellSelected]}
                  activeOpacity={cell.inMonth ? 0.7 : 1}
                  disabled={!cell.inMonth}
                  onPress={() => setSelectedISO(cell.iso)}
                >
                  <View style={[cs.dayNumWrap, isToday && cs.dayNumToday]}>
                    <Text
                      style={[
                        cs.dayNumText,
                        !cell.inMonth && cs.dayNumTextDim,
                        isToday && cs.dayNumTextToday,
                      ]}
                    >
                      {cell.day}
                    </Text>
                  </View>
                  {hasBookings && cell.inMonth && <View style={cs.dayDot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={cs.sideCard}>
          <View style={cs.sideCardHeaderRow}>
            <Text style={cs.sideCardTitle}>Bookings on {formatSelectedDate(selectedISO)}</Text>
            <View style={cs.countPill}>
              <Text style={cs.countPillText}>{dayBookings.length}</Text>
            </View>
          </View>

          {dayBookings.length === 0 ? (
            <Text style={cs.emptyText}>No bookings on this day.</Text>
          ) : (
            <View style={{ gap: 8, marginTop: 4 }}>
              {dayBookings.map((b) => (
                <BookingRow key={b.id} booking={b} onPress={() => setActiveBooking(b)} C={C} cs={cs} />
              ))}
            </View>
          )}
        </View>

        <View style={cs.sideCard}>
          <Text style={cs.sideCardTitle}>Booking Summary</Text>
          <View style={cs.summaryGrid}>
            <View style={[cs.summaryTile, { backgroundColor: '#EAF1FB' }]}>
              <Text style={[cs.summaryValue, { color: C.info }]}>{summary.bookings}</Text>
              <Text style={cs.summaryLabel}>BOOKINGS</Text>
            </View>
            <View style={[cs.summaryTile, { backgroundColor: '#F3EAFB' }]}>
              <Text style={[cs.summaryValue, { color: C.purple }]}>{summary.guests}</Text>
              <Text style={cs.summaryLabel}>GUESTS</Text>
            </View>
            <View style={[cs.summaryTile, { backgroundColor: '#FDF0E6' }]}>
              <Text style={[cs.summaryValue, { color: C.amber }]} numberOfLines={1} adjustsFontSizeToFit>{formatCompactPeso(summary.sales)}</Text>
              <Text style={cs.summaryLabel}>SALES</Text>
            </View>
            <View style={[cs.summaryTile, { backgroundColor: '#FFF5E0' }]}>
              <Text style={[cs.summaryValue, { color: '#B8922E' }]}>{summary.pending}</Text>
              <Text style={cs.summaryLabel}>PENDING</Text>
            </View>
            <View style={[cs.summaryTile, { backgroundColor: '#E7F9F3' }]}>
              <Text style={[cs.summaryValue, { color: '#12946F' }]}>{summary.confirmed}</Text>
              <Text style={cs.summaryLabel}>CONFIRMED</Text>
            </View>
            <View style={[cs.summaryTile, { backgroundColor: '#FDEAEA' }]}>
              <Text style={[cs.summaryValue, { color: C.danger }]}>{summary.cancelled}</Text>
              <Text style={cs.summaryLabel}>CANCELLED</Text>
            </View>
          </View>
        </View>

        <View style={cs.sideCard}>
          <Text style={cs.sideCardTitle}>Quick Filters</Text>
          <View style={cs.filterChipsRow}>
            {STATUS_FILTER_OPTIONS.map((opt) => {
              const isSelected = opt.value === statusFilter;
              const st = opt.value ? STATUS_STYLE[opt.value as BookingStatus] : null;
              return (
                <TouchableOpacity
                  key={opt.value || '__all__'}
                  style={[
                    cs.filterChip,
                    isSelected
                      ? cs.filterChipSelected
                      : { backgroundColor: st ? st.bg : C.lightBg, borderColor: st ? st.bg : C.divider },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setStatusFilter(opt.value as BookingStatus | '')}
                >
                  <Text style={[cs.filterChipText, isSelected ? cs.filterChipTextSelected : { color: st ? st.color : C.brownMid }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Copyright />
      </ScrollView>

      <BookingDetailModal
        visible={!!activeBooking}
        booking={activeBooking}
        onClose={() => setActiveBooking(null)}
        onConfirm={(id) => updateStatus(id, 'Confirmed', 'Paid')}
        onCancel={(id) => updateStatus(id, 'Cancelled', 'Refunded')}
      />
    </View>
  );
}

const CELL_PCT = '14.28%';

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
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3, marginTop: 4 },
  headerSub: { fontSize: 11.5, color: 'rgba(255,255,255,0.85)', marginTop: 6, lineHeight: 16, maxWidth: 230 },
  headerIconWrap: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', marginLeft: 8, flexShrink: 0 },
  headerRing2: { position: 'absolute', width: 64, height: 64, borderRadius: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  headerRing1: { position: 'absolute', width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  headerIconCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },

  calendarCard: {
    marginHorizontal: 16, marginTop: 14, padding: 14,
    backgroundColor: C.cardBg, borderRadius: 16,
    borderWidth: 1, borderColor: C.divider,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1 },
    }),
  },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  navBtn: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.lightBg, borderWidth: 1, borderColor: C.divider,
  },
  todayBtn: { backgroundColor: C.amber, borderRadius: 10, paddingHorizontal: 12, height: 32, alignItems: 'center', justifyContent: 'center' },
  todayBtnText: { fontSize: 11.5, fontWeight: '800', color: '#FFFFFF' },
  monthTitle: { flex: 1, textAlign: 'right', fontSize: 15, fontWeight: '900', color: C.brown },

  weekdayRow: { flexDirection: 'row' },
  weekdayCell: { width: CELL_PCT, alignItems: 'center', paddingBottom: 8 },
  weekdayText: { fontSize: 9.5, fontWeight: '800', color: C.brownMid, opacity: 0.6, letterSpacing: 0.4 },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: CELL_PCT, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 10, marginBottom: 2 },
  dayCellSelected: { backgroundColor: C.lightBg, borderWidth: 1.5, borderColor: C.amber },
  dayNumWrap: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  dayNumToday: { backgroundColor: C.amber },
  dayNumText: { fontSize: 12.5, fontWeight: '700', color: C.brown },
  dayNumTextDim: { color: C.brownMid, opacity: 0.32 },
  dayNumTextToday: { color: '#FFFFFF', fontWeight: '900' },
  dayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.amber, marginTop: 2 },

  sideCard: {
    marginHorizontal: 16, marginTop: 12, padding: 14,
    backgroundColor: C.cardBg, borderRadius: 16,
    borderWidth: 1, borderColor: C.divider,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1 },
    }),
  },
  sideCardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sideCardTitle: { fontSize: 13.5, fontWeight: '900', color: C.brown, flexShrink: 1 },
  countPill: { minWidth: 24, height: 24, borderRadius: 12, paddingHorizontal: 7, backgroundColor: C.amber, alignItems: 'center', justifyContent: 'center' },
  countPillText: { fontSize: 11.5, fontWeight: '800', color: '#FFFFFF' },
  emptyText: { fontSize: 12, color: C.brownMid, opacity: 0.65, marginTop: 10, textAlign: 'center' },

  bookingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.lightBg, borderRadius: 12, padding: 10,
    borderWidth: 1, borderColor: C.divider,
  },
  rowAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.amber, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowAvatarText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  rowName: { fontSize: 12.5, fontWeight: '800', color: C.brown },
  rowDestWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  rowDest: { fontSize: 10.5, color: C.brownMid, opacity: 0.85, flexShrink: 1 },
  rowBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  rowBadgeText: { fontSize: 9.5, fontWeight: '800' },
  rowPrice: { fontSize: 11.5, fontWeight: '900', color: C.brown },

  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  summaryTile: { flexBasis: '31%', flexGrow: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center', gap: 4 },
  summaryValue: { fontSize: 17, fontWeight: '900' },
  summaryLabel: { fontSize: 8.5, fontWeight: '800', color: C.brownMid, opacity: 0.65, letterSpacing: 0.4 },

  filterChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  filterChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1.5 },
  filterChipSelected: { backgroundColor: '#3B1A0C', borderColor: '#3B1A0C' },
  filterChipText: { fontSize: 12, fontWeight: '800' },
  filterChipTextSelected: { color: '#FFFFFF' },
});
