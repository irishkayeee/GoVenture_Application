/**
 * MyBookingsScreen.tsx
 * Client "My Bookings" tab — search + status filter dropdown, a sort toggle,
 * booking cards, a lightweight "Choose a Tour" prompt, and a booking detail
 * modal with a "View Documents" action that jumps straight into that
 * booking's entry in the Documents tab (via onViewDocuments).
 */

import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Image,
  StyleSheet, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import Copyright from '@/components/Copyright';
import { C } from '../theme';
import ClientPageHero from '../ClientPageHero';
import { useBookings, Booking, BookingStatus } from './BookingsContext';

const GRADIENT = ['#3B1A0C', '#C46B1A'] as const;
const STATUS_FILTERS: ('All' | BookingStatus)[] = ['All', 'Upcoming', 'Ongoing', 'Completed', 'Cancelled'];

/* ── Icons ── */
const SearchIcon = ({ color = C.brownMid }: { color?: string }) => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Circle cx={11} cy={11} r={7} stroke={color} strokeWidth={2} />
    <Path d="M21 21l-4.3-4.3" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);
const SortIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M7 4v16M7 4l-3 3M7 4l3 3M17 20V4M17 20l-3-3M17 20l3-3" stroke={C.brown} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const ChevronIcon = ({ open }: { open: boolean }) => (
  <Svg width={10} height={10} viewBox="0 0 24 24" style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
    <Path fill={C.brown} d="M12 16L4 8h16z" />
  </Svg>
);
const DotsIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={5} r={1.6} fill={C.brownMid} />
    <Circle cx={12} cy={12} r={1.6} fill={C.brownMid} />
    <Circle cx={12} cy={19} r={1.6} fill={C.brownMid} />
  </Svg>
);
const PinIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
    <Path d="M12 21s7-7.58 7-12a7 7 0 10-14 0c0 4.42 7 12 7 12z" stroke={C.amber} strokeWidth={2} strokeLinejoin="round" />
    <Circle cx={12} cy={9} r={2.4} stroke={C.amber} strokeWidth={2} />
  </Svg>
);
const CalendarIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
    <Path d="M7 3v4M17 3v4M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" stroke={C.amber} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const PersonIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={8} r={3.4} stroke={C.amber} strokeWidth={2} />
    <Path d="M5 20c0-3.6 3.1-6.5 7-6.5s7 2.9 7 6.5" stroke={C.amber} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);
const CloseWhiteIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
    <Path d="M6 6l12 12M18 6L6 18" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" />
  </Svg>
);
const CheckIcon = ({ color = '#FFFFFF', size = 24 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 12l6 6L20 6" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const DocIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M7 3h7l4 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="#FFFFFF" strokeWidth={1.8} strokeLinejoin="round" />
  </Svg>
);

const money = (n: number) => `₱${n.toLocaleString('en-US')}`;
const formatShort = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const formatRange = (fromISO: string, toISO: string) => {
  const from = new Date(fromISO), to = new Date(toISO);
  const sameMonth = from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear();
  const fromLabel = from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const toLabel = sameMonth
    ? to.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' })
    : to.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${fromLabel} – ${toLabel}`;
};

function statusColor(status: BookingStatus) {
  switch (status) {
    case 'Ongoing':   return C.info;
    case 'Completed': return C.success;
    case 'Cancelled': return C.danger;
    default:          return C.brown;
  }
}

/* ── Booking card (list layout) ── */
function BookingRow({ booking, onViewDetails, onCancel, menuOpenId, setMenuOpenId }: {
  booking: Booking;
  onViewDetails: () => void;
  onCancel: () => void;
  menuOpenId: string | null;
  setMenuOpenId: (id: string | null) => void;
}) {
  const menuOpen = menuOpenId === booking.id;
  return (
    <View style={r.card}>
      <View style={r.banner}>
        {booking.imageUrl ? (
          <Image source={{ uri: booking.imageUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <Text style={{ fontSize: 30 }}>🌏</Text>
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0, padding: 14 }}>
        <View style={r.topRow}>
          <Text style={r.dest} numberOfLines={1}>{booking.destination}</Text>
          <View style={{ position: 'relative' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[r.statusPill, { backgroundColor: statusColor(booking.status) }]}>
                <Text style={r.statusPillText}>{booking.status}</Text>
              </View>
              <TouchableOpacity onPress={() => setMenuOpenId(menuOpen ? null : booking.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <DotsIcon />
              </TouchableOpacity>
            </View>
            {menuOpen && (
              <View style={r.menu}>
                {booking.status === 'Upcoming' ? (
                  <TouchableOpacity style={r.menuItem} onPress={() => { setMenuOpenId(null); onCancel(); }}>
                    <Text style={r.menuItemDanger}>Cancel Booking</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={r.menuItem}><Text style={r.menuItemMuted}>No actions available</Text></View>
                )}
              </View>
            )}
          </View>
        </View>

        <View style={r.metaRow}>
          <PinIcon /><Text style={r.metaText}>{booking.location}</Text>
          <CalendarIcon /><Text style={r.metaText}>{formatRange(booking.dateFrom, booking.dateTo)}</Text>
          <PersonIcon /><Text style={r.metaText}>{booking.travelers} {booking.travelers === 1 ? 'Adult' : 'Adults'}</Text>
        </View>

        <Text style={r.smallText}>Booking ID: <Text style={r.smallTextBold}>{booking.id}</Text></Text>
        <Text style={r.smallText}>Total Paid: <Text style={r.smallTextBold}>{money(booking.totalAmount)}</Text></Text>

        <TouchableOpacity style={r.detailsBtn} activeOpacity={0.85} onPress={onViewDetails}>
          <Text style={r.detailsBtnText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ── Booking card (grid layout) ── */
/* ── Choose a Tour modal ── */
function ChooseTourModal({ visible, onClose, onBrowseTours }: { visible: boolean; onClose: () => void; onBrowseTours: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={ct.overlay}>
        <View style={ct.card}>
          <LinearGradient colors={GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={ct.header}>
            <View style={ct.avatar}><Text style={{ color: '#FFFFFF', fontWeight: '900' }}>G</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={ct.title}>Choose a Tour</Text>
              <Text style={ct.sub}>Select a tour to start booking</Text>
            </View>
            <TouchableOpacity style={ct.closeBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <CloseWhiteIcon />
            </TouchableOpacity>
          </LinearGradient>
          <View style={ct.body}>
            <Text style={ct.bodyText}>Browse our available tours and click Book Now to start your reservation.</Text>
            <TouchableOpacity style={ct.browseBtn} activeOpacity={0.85} onPress={onBrowseTours}>
              <Text style={ct.browseBtnText}>Browse Tours →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ── Booking detail modal ── */
function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <View style={df.box}>
      <Text style={df.label}>{label}</Text>
      <Text style={df.value}>{value}</Text>
    </View>
  );
}

const StarIcon = ({ filled, size = 30 }: { filled: boolean; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? C.amber : 'none'}>
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" stroke={filled ? C.amber : C.brownMid} strokeWidth={1.5} strokeLinejoin="round" />
  </Svg>
);

function RateTourModal({ visible, onClose, onSubmit }: { visible: boolean; onClose: () => void; onSubmit: (rating: number, text: string) => Promise<void> }) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (rating < 1) { setError('Please select a star rating.'); return; }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(rating, text.trim());
      setRating(0);
      setText('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={rt.overlay}>
        <View style={rt.card}>
          <Text style={rt.title}>Rate This Tour</Text>
          <Text style={rt.subtitle}>How was your experience?</Text>
          <View style={rt.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity key={n} activeOpacity={0.7} onPress={() => setRating(n)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                <StarIcon filled={n <= rating} />
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={rt.input}
            placeholder="Share more about your trip (optional)"
            placeholderTextColor={C.brownMid + '80'}
            value={text}
            onChangeText={setText}
            multiline
            numberOfLines={3}
          />
          {!!error && <Text style={rt.errorText}>{error}</Text>}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <TouchableOpacity style={rt.cancelBtn} activeOpacity={0.8} onPress={onClose} disabled={submitting}>
              <Text style={rt.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[rt.submitBtn, submitting && { opacity: 0.7 }]} activeOpacity={0.85} onPress={handleSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={rt.submitText}>Submit</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ReviewSubmittedModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={rs.overlay}>
        <View style={rs.card}>
          <View style={rs.iconCircle}><CheckIcon color={C.success} size={26} /></View>
          <Text style={rs.title}>Rating Submitted!</Text>
          <Text style={rs.body}>Thanks for sharing your feedback — it helps other travelers plan their trips.</Text>
          <TouchableOpacity style={rs.okBtn} activeOpacity={0.85} onPress={onClose}>
            <Text style={rs.okBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function BookingDetailModal({ booking, onClose, onViewDocuments }: {
  booking: Booking | null; onClose: () => void; onViewDocuments: (bookingId: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const { submitReview } = useBookings();
  const [rateModalVisible, setRateModalVisible] = useState(false);
  const [reviewSubmittedVisible, setReviewSubmittedVisible] = useState(false);
  if (!booking) return null;

  const handleSubmitReview = async (rating: number, text: string) => {
    const result = await submitReview(booking.id, rating, text);
    if (result.ok) {
      setRateModalVisible(false);
      setReviewSubmittedVisible(true);
    }
  };

  const handleViewDocuments = () => {
    onClose();
    onViewDocuments(booking.id);
  };

  return (
    <Modal visible={!!booking} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaProvider>
      <View style={dt.overlay}>
        <View style={[dt.card, { maxHeight: '90%' }]}>
          <LinearGradient colors={GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={dt.header}>
            <Text style={dt.headerEyebrow}>Booking #{booking.id}</Text>
            <Text style={dt.headerTitle}>{booking.destination}</Text>
            <View style={[dt.statusPill, { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
              <Text style={dt.statusPillText}>{booking.status}</Text>
            </View>
          </LinearGradient>

          <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ padding: 16 }}>
            <View style={dt.grid}>
              <DetailField label="TRAVEL DATES" value={formatRange(booking.dateFrom, booking.dateTo)} />
              <DetailField label="TRAVELERS" value={`${booking.travelers} ${booking.travelers === 1 ? 'Adult' : 'Adults'}`} />
              <DetailField label="BOOKED ON" value={formatShort(booking.bookedOn)} />
              <DetailField label="BOOKING ID" value={booking.id} />
            </View>

            <View style={dt.paymentCard}>
              <Text style={dt.paymentTitle}>Payment Details</Text>
              <View style={dt.paymentRow}><Text style={dt.paymentLabel}>Total Amount</Text><Text style={dt.paymentValue}>{money(booking.totalAmount)}</Text></View>
              <View style={dt.paymentRow}><Text style={dt.paymentLabel}>Balance Due</Text><Text style={dt.paymentValue}>{money(booking.balanceDue)}</Text></View>
              <View style={dt.paymentRow}><Text style={dt.paymentLabel}>Method</Text><Text style={dt.paymentValue}>{booking.paymentMethod}</Text></View>
              <View style={dt.paymentRow}><Text style={dt.paymentLabel}>Pay Status</Text><Text style={dt.paymentValue}>{booking.paymentStatus}</Text></View>
            </View>

            {booking.status === 'Completed' && (
              <View style={dt.reviewCard}>
                {booking.hasReview ? (
                  <View style={dt.myReviewCard}>
                    <Text style={dt.reviewDoneText}>✓ You've already reviewed this tour. Thanks!</Text>
                    <View style={dt.myReviewStarsRow}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <StarIcon key={n} filled={n <= (booking.myRating ?? 0)} size={18} />
                      ))}
                    </View>
                    {!!booking.myReviewText && <Text style={dt.myReviewText}>"{booking.myReviewText}"</Text>}
                  </View>
                ) : (
                  <TouchableOpacity style={dt.rateBtn} activeOpacity={0.85} onPress={() => setRateModalVisible(true)}>
                    <StarIcon filled />
                    <Text style={dt.rateBtnText}>Rate This Tour</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>

          <View style={[dt.footer, { paddingBottom: Math.max(14, insets.bottom) }]}>
            <TouchableOpacity style={dt.footerCloseBtn} activeOpacity={0.85} onPress={onClose}>
              <Text style={dt.footerCloseText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dt.footerDownloadBtn} activeOpacity={0.85} onPress={handleViewDocuments}>
              <DocIcon />
              <Text style={dt.footerDownloadText}>View Documents</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <RateTourModal visible={rateModalVisible} onClose={() => setRateModalVisible(false)} onSubmit={handleSubmitReview} />
      <ReviewSubmittedModal visible={reviewSubmittedVisible} onClose={() => setReviewSubmittedVisible(false)} />
      </SafeAreaProvider>
    </Modal>
  );
}

function FilterDropdown({ value, onChange }: { value: 'All' | BookingStatus; onChange: (v: 'All' | BookingStatus) => void }) {
  const [open, setOpen] = useState(false);
  const activeLabel = value === 'All' ? 'All Bookings' : value;
  return (
    <View style={{ position: 'relative', zIndex: 10, flexShrink: 1 }}>
      <TouchableOpacity style={fd.trigger} activeOpacity={0.8} onPress={() => setOpen((v) => !v)}>
        <Text style={fd.triggerText} numberOfLines={1}>{activeLabel}</Text>
        <ChevronIcon open={open} />
      </TouchableOpacity>
      {open && (
        <View style={fd.menu}>
          {STATUS_FILTERS.map((f) => {
            const active = f === value;
            return (
              <TouchableOpacity
                key={f}
                style={fd.menuItem}
                activeOpacity={0.75}
                onPress={() => { onChange(f); setOpen(false); }}
              >
                <Text style={[fd.menuItemText, active && fd.menuItemTextActive]}>{f === 'All' ? 'All Bookings' : f}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

type MyBookingsScreenProps = { onBrowseTours: () => void; onViewDocuments: (bookingId: string) => void };

export default function MyBookingsScreen({ onBrowseTours, onViewDocuments }: MyBookingsScreenProps) {
  const { bookings, loading, error, refresh, cancelBooking } = useBookings();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | BookingStatus>('All');
  const [sortDesc, setSortDesc] = useState(true);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [chooseTourVisible, setChooseTourVisible] = useState(false);
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);

  const filtered = useMemo(() => {
    let list = bookings.filter((b) => {
      if (statusFilter !== 'All' && b.status !== statusFilter) return false;
      const q = search.trim().toLowerCase();
      if (q && !b.destination.toLowerCase().includes(q) && !b.id.toLowerCase().includes(q)) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      const diff = new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime();
      return sortDesc ? -diff : diff;
    });
    return list;
  }, [bookings, statusFilter, search, sortDesc]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <ClientPageHero icon="🧳" title="My Bookings" subtitle="View and manage your bookings" />

        <View style={sb.searchRow}>
          <SearchIcon />
          <TextInput
            style={sb.searchInput}
            placeholder="Search Bookings"
            placeholderTextColor={C.brownMid + '80'}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={sb.controlsRow}>
          <FilterDropdown value={statusFilter} onChange={setStatusFilter} />
          <View style={sb.rightControls}>
            <TouchableOpacity style={sb.bookTourBtn} activeOpacity={0.85} onPress={() => setChooseTourVisible(true)}>
              <Text style={sb.bookTourBtnText}>+ Book a Tour</Text>
            </TouchableOpacity>
            <TouchableOpacity style={sb.sortBtn} activeOpacity={0.8} onPress={() => setSortDesc((v) => !v)}>
              <SortIcon />
              <Text style={sb.sortBtnText}>Sort: by date</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
          {loading ? (
            <View style={sb.emptyWrap}>
              <ActivityIndicator color={C.amber} />
            </View>
          ) : error ? (
            <View style={sb.emptyWrap}>
              <Text style={{ fontSize: 36 }}>⚠️</Text>
              <Text style={sb.emptyTitle}>{error}</Text>
              <TouchableOpacity onPress={refresh}><Text style={[sb.emptyText, { color: C.amber, fontWeight: '800' }]}>Tap to retry</Text></TouchableOpacity>
            </View>
          ) : filtered.length === 0 ? (
            <View style={sb.emptyWrap}>
              <Text style={{ fontSize: 36 }}>🧳</Text>
              <Text style={sb.emptyTitle}>No bookings found</Text>
              <Text style={sb.emptyText}>Try a different filter or search term.</Text>
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              {filtered.map((b) => (
                <BookingRow
                  key={b.id}
                  booking={b}
                  onViewDetails={() => setDetailBooking(b)}
                  onCancel={() => cancelBooking(b.id)}
                  menuOpenId={menuOpenId}
                  setMenuOpenId={setMenuOpenId}
                />
              ))}
            </View>
          )}
        </View>

        <Copyright />
      </ScrollView>

      <ChooseTourModal
        visible={chooseTourVisible}
        onClose={() => setChooseTourVisible(false)}
        onBrowseTours={() => { setChooseTourVisible(false); onBrowseTours(); }}
      />
      <BookingDetailModal booking={detailBooking} onClose={() => setDetailBooking(null)} onViewDocuments={onViewDocuments} />
    </View>
  );
}

/* ── Styles ── */
const sb = StyleSheet.create({
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.cardBg, borderRadius: 12, borderWidth: 1, borderColor: C.divider,
    paddingHorizontal: 14, paddingVertical: 12, marginHorizontal: 16, marginTop: 12,
  },
  searchInput: { flex: 1, fontSize: 13, color: C.brown, padding: 0 },

  controlsRow: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
    gap: 10, paddingHorizontal: 16, marginTop: 12, zIndex: 10, elevation: 10,
  },

  rightControls: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  bookTourBtn: { backgroundColor: C.danger, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9 },
  bookTourBtnText: { fontSize: 11.5, fontWeight: '800', color: '#FFFFFF' },
  sortBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: C.divider, backgroundColor: C.cardBg,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 9,
  },
  sortBtnText: { fontSize: 11, fontWeight: '700', color: C.brown },

  emptyWrap: { alignItems: 'center', paddingVertical: 48, gap: 6 },
  emptyTitle: { fontSize: 14, fontWeight: '900', color: C.brown },
  emptyText: { fontSize: 12, color: C.brownMid },
});

const fd = StyleSheet.create({
  trigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6,
    alignSelf: 'flex-start', minWidth: 0, flexShrink: 1,
    borderWidth: 1, borderColor: C.divider, backgroundColor: C.cardBg, borderRadius: 12,
    paddingHorizontal: 11, paddingVertical: 9,
  },
  triggerText: { fontSize: 11, fontWeight: '800', color: C.brown, flexShrink: 1 },
  menu: {
    position: 'absolute', top: 40, left: 0, minWidth: 180,
    backgroundColor: C.cardBg, borderRadius: 12, borderWidth: 1, borderColor: C.divider,
    paddingVertical: 4,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 8 },
    }),
  },
  menuItem: { paddingHorizontal: 14, paddingVertical: 11 },
  menuItemText: { fontSize: 12, fontWeight: '700', color: C.brownMid },
  menuItemTextActive: { color: C.brown, fontWeight: '900' },
});

const r = StyleSheet.create({
  card: {
    flexDirection: 'row', backgroundColor: C.cardBg, borderRadius: 14,
    borderWidth: 1, borderColor: C.divider, overflow: 'hidden',
  },
  banner: { width: 100, backgroundColor: C.brown, alignItems: 'center', justifyContent: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  dest: { fontSize: 15, fontWeight: '900', color: C.brown, flexShrink: 1 },

  statusPill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusPillText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },

  menu: {
    position: 'absolute', top: 28, right: 0, zIndex: 20, minWidth: 150,
    backgroundColor: C.cardBg, borderRadius: 10, borderWidth: 1, borderColor: C.divider,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 6 },
    }),
  },
  menuItem: { paddingHorizontal: 14, paddingVertical: 10 },
  menuItemDanger: { fontSize: 12, fontWeight: '800', color: C.danger },
  menuItemMuted: { fontSize: 11, color: C.brownMid, opacity: 0.7 },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5, marginTop: 8 },
  metaText: { fontSize: 10.5, color: C.brownMid, marginRight: 6 },

  smallText: { fontSize: 11, color: C.brownMid, marginTop: 6 },
  smallTextBold: { fontWeight: '800', color: C.brown },

  detailsBtn: { backgroundColor: C.brown, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 10, alignSelf: 'flex-end', paddingHorizontal: 18 },
  detailsBtnText: { fontSize: 11.5, fontWeight: '800', color: '#FFFFFF' },
});

const ct = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(59,26,12,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 420, backgroundColor: C.cardBg, borderRadius: 20, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 18 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
  sub: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  closeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  body: { padding: 20 },
  bodyText: { fontSize: 12.5, color: C.brownMid, lineHeight: 18, marginBottom: 16 },
  browseBtn: { backgroundColor: C.danger, borderRadius: 12, alignItems: 'center', paddingVertical: 14 },
  browseBtnText: { fontSize: 13, fontWeight: '900', color: '#FFFFFF' },
});

const df = StyleSheet.create({
  box: { width: '48%', backgroundColor: C.lightBg, borderRadius: 10, borderWidth: 1, borderColor: C.divider, padding: 12, marginBottom: 10 },
  label: { fontSize: 9.5, fontWeight: '800', color: C.brownMid, opacity: 0.7, letterSpacing: 0.4 },
  value: { fontSize: 12.5, fontWeight: '800', color: C.brown, marginTop: 3 },
});

const dt = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(59,26,12,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 460, backgroundColor: C.cardBg, borderRadius: 20, overflow: 'hidden' },
  header: { padding: 18, paddingTop: 22 },
  headerEyebrow: { fontSize: 10.5, color: 'rgba(255,255,255,0.8)', fontWeight: '700' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', marginTop: 2 },
  statusPill: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8 },
  statusPillText: { fontSize: 10.5, fontWeight: '800', color: '#FFFFFF' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },

  paymentCard: { backgroundColor: C.lightBg, borderRadius: 12, borderWidth: 1, borderColor: C.divider, padding: 14, marginTop: 4 },
  paymentTitle: { fontSize: 13, fontWeight: '900', color: C.brown, marginBottom: 10 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.divider },
  paymentLabel: { fontSize: 12, color: C.brownMid },
  paymentValue: { fontSize: 12.5, fontWeight: '800', color: C.brown },

  reviewCard: { marginTop: 14 },
  reviewDoneText: { fontSize: 12, color: C.success, fontWeight: '700', textAlign: 'center' },
  myReviewCard: {
    backgroundColor: C.lightBg, borderRadius: 12, borderWidth: 1, borderColor: C.divider,
    padding: 14, alignItems: 'center', gap: 8,
  },
  myReviewStarsRow: { flexDirection: 'row', gap: 2 },
  myReviewText: { fontSize: 12, color: C.brownMid, fontStyle: 'italic', textAlign: 'center', lineHeight: 17 },
  rateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.lightBg, borderWidth: 1, borderColor: C.amber, borderRadius: 12, paddingVertical: 12,
  },
  rateBtnText: { fontSize: 12.5, fontWeight: '800', color: C.brown },

  footer: { flexDirection: 'row', gap: 10, padding: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.divider },
  footerCloseBtn: { flex: 1, backgroundColor: C.brown, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 13 },
  footerCloseText: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' },
  footerDownloadBtn: {
    flex: 1.4, flexDirection: 'row', gap: 6, backgroundColor: C.danger, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', paddingVertical: 13,
  },
  footerDownloadText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
});

const rt = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(59,26,12,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%', maxWidth: 380, backgroundColor: C.cardBg, borderRadius: 18, padding: 20,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 8 },
    }),
  },
  title: { fontSize: 15.5, fontWeight: '900', color: C.brown, textAlign: 'center' },
  subtitle: { fontSize: 12, color: C.brownMid, marginTop: 4, textAlign: 'center' },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 16 },
  input: {
    marginTop: 16, backgroundColor: C.lightBg, borderRadius: 12, borderWidth: 1, borderColor: C.divider,
    paddingHorizontal: 13, paddingVertical: 11, fontSize: 13, color: C.brown, textAlignVertical: 'top', minHeight: 70,
  },
  errorText: { color: C.danger, fontSize: 11.5, fontWeight: '700', marginTop: 8, textAlign: 'center' },
  cancelBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: C.divider, backgroundColor: C.lightBg },
  cancelText: { fontSize: 12.5, fontWeight: '800', color: C.brownMid },
  submitBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 12, backgroundColor: C.amber },
  submitText: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' },
});

const rs = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(59,26,12,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%', maxWidth: 340, backgroundColor: C.cardBg, borderRadius: 18, padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 8 },
    }),
  },
  iconCircle: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: '#E7F7F1',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  title: { fontSize: 15.5, fontWeight: '900', color: C.brown, textAlign: 'center' },
  body: { fontSize: 12, color: C.brownMid, marginTop: 6, textAlign: 'center', lineHeight: 17 },
  okBtn: { marginTop: 18, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 12, backgroundColor: C.amber },
  okBtnText: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' },
});
