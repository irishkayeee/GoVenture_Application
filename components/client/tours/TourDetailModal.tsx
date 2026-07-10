/**
 * TourDetailModal.tsx
 * Full tour detail — About, a day-by-day itinerary accordion, inclusions &
 * exclusions, guest reviews, and a booking box (departure date, traveler
 * count, total estimate, "Book This Tour"). Wide screens get a two-column
 * layout with a sticky booking sidebar; phones get a single scrolling column
 * with the booking box placed right under the header for easy reach.
 */

import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Platform, useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { C } from '../theme';
import { Tour, DepartureOption } from './mockData';

const WIDE_BREAKPOINT = 900;

const CloseIcon = () => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
    <Path d="M6 6l12 12M18 6L6 18" stroke={C.brown} strokeWidth={2.4} strokeLinecap="round" />
  </Svg>
);
const ChevronIcon = ({ open }: { open: boolean }) => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}>
    <Path d="M9 6l6 6-6 6" stroke={C.brown} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const CheckIcon = ({ color = C.success }: { color?: string }) => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
    <Path d="M4 12l6 6L20 6" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const XMarkIcon = () => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
    <Path d="M6 6l12 12M18 6L6 18" stroke={C.danger} strokeWidth={2.6} strokeLinecap="round" />
  </Svg>
);
const StarIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="#F5A623">
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
  </Svg>
);
const ShieldIcon = () => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2l8 3v6c0 5-3.4 8.5-8 11-4.6-2.5-8-6-8-11V5l8-3z" stroke={C.amber} strokeWidth={1.8} strokeLinejoin="round" />
  </Svg>
);
const LockIcon = () => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Path d="M6 11V8a6 6 0 1112 0v3" stroke={C.amber} strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M5 11h14v9H5z" stroke={C.amber} strokeWidth={1.8} strokeLinejoin="round" />
  </Svg>
);
const PhoneIcon = () => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2C9.6 21 3 14.4 3 6a2 2 0 012-2z" stroke={C.amber} strokeWidth={1.8} strokeLinejoin="round" />
  </Svg>
);

const money = (n: number) => `₱${n.toLocaleString('en-US')}`;
const formatShort = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

type Props = {
  tour:    Tour | null;
  visible: boolean;
  onClose: () => void;
  onBook:  (departure: DepartureOption, travelers: number) => void;
};

export default function TourDetailModal({ tour, visible, onClose, onBook }: Props) {
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;
  const insets = useSafeAreaInsets();

  const [expandedDay, setExpandedDay] = useState<number>(1);
  const [departureIdx, setDepartureIdx] = useState(0);
  const [travelers, setTravelers] = useState(2);

  const tourId = tour?.id;
  useEffect(() => {
    setExpandedDay(1);
    setDepartureIdx(0);
    setTravelers(2);
  }, [tourId]);

  if (!tour) return null;

  const departure = tour.departures[Math.min(departureIdx, tour.departures.length - 1)];
  const total = tour.pricePerPerson * travelers;

  const bookingBox = (
    <View style={bx.card}>
      <View style={bx.fromRow}>
        <Text style={bx.fromLabel}>FROM</Text>
        <Text style={bx.fromPrice}>{money(tour.pricePerPerson)} <Text style={bx.fromPerson}>/ person</Text></Text>
        <View style={bx.guaranteeBadge}><Text style={bx.guaranteeText}>Best Price Guaranteed</Text></View>
      </View>

      <Text style={bx.fieldLabel}>Departure Date</Text>
      <View style={bx.chipWrap}>
        {tour.departures.map((d, i) => {
          const active = i === departureIdx;
          return (
            <TouchableOpacity key={i} style={[bx.chip, active && bx.chipActive]} activeOpacity={0.8} onPress={() => setDepartureIdx(i)}>
              <Text style={[bx.chipText, active && bx.chipTextActive]}>{formatShort(d.startISO)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={bx.fieldLabel}>Travelers (Adults)</Text>
      <View style={bx.stepperRow}>
        <TouchableOpacity style={bx.stepperBtn} activeOpacity={0.8} onPress={() => setTravelers((n) => Math.max(1, n - 1))}>
          <Text style={bx.stepperBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={bx.stepperValue}>{travelers}</Text>
        <TouchableOpacity style={bx.stepperBtn} activeOpacity={0.8} onPress={() => setTravelers((n) => Math.min(10, n + 1))}>
          <Text style={bx.stepperBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={bx.fieldLabel}>Total Estimate</Text>
      <Text style={bx.total}>{money(total)}</Text>

      <TouchableOpacity style={bx.bookBtn} activeOpacity={0.85} onPress={() => onBook(departure, travelers)}>
        <Text style={bx.bookBtnText}>Book This Tour</Text>
      </TouchableOpacity>

      <View style={{ gap: 10, marginTop: 14 }}>
        <View style={bx.trustRow}>
          <ShieldIcon />
          <View style={{ flex: 1 }}>
            <Text style={bx.trustTitle}>Instant Confirmation</Text>
            <Text style={bx.trustSub}>Your booking is confirmed immediately</Text>
          </View>
        </View>
        <View style={bx.trustRow}>
          <LockIcon />
          <View style={{ flex: 1 }}>
            <Text style={bx.trustTitle}>Secure Payment</Text>
            <Text style={bx.trustSub}>Your data is protected & encrypted</Text>
          </View>
        </View>
        <View style={bx.trustRow}>
          <PhoneIcon />
          <View style={{ flex: 1 }}>
            <Text style={bx.trustTitle}>24/7 Support</Text>
            <Text style={bx.trustSub}>We're here whenever you need us</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaProvider>
      <View style={m.safe}>
        <View style={[m.header, { paddingTop: insets.top + 14 }]}>
          <TouchableOpacity style={m.closeBtn} activeOpacity={0.85} onPress={onClose}>
            <CloseIcon />
            <Text style={m.closeText}>Close</Text>
          </TouchableOpacity>
          <Text style={m.headerTitle}>{tour.destination}</Text>
          <Text style={m.headerSubtitle}>{tour.subtitle}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
            {tour.isNew ? (
              <Text style={m.headerMetaNew}>★ New</Text>
            ) : (
              <>
                <StarIcon />
                <Text style={m.headerMeta}>{tour.rating.toFixed(1)} ({tour.reviewCount})</Text>
              </>
            )}
            <Text style={m.headerMeta}>•</Text>
            <Text style={m.headerMeta}>{tour.duration}</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
          <View style={{ flexDirection: isWide ? 'row' : 'column', padding: 16, gap: 16, alignItems: 'flex-start' }}>
            <View style={{ flex: 1, minWidth: 0, width: '100%' }}>
              {!isWide && bookingBox}

              <View style={sec.card}>
                <Text style={sec.title}>About This Tour</Text>
                <Text style={sec.body}>{tour.description}</Text>
                <View style={sec.tagWrap}>
                  {tour.tags.map((tag) => (
                    <View key={tag} style={sec.tag}><Text style={sec.tagText}>{tag}</Text></View>
                  ))}
                </View>
              </View>

              <View style={sec.card}>
                <Text style={sec.title}>Itinerary</Text>
                {tour.itinerary.map((day) => {
                  const open = expandedDay === day.day;
                  return (
                    <View key={day.day} style={it.dayWrap}>
                      <TouchableOpacity style={it.dayHeader} activeOpacity={0.8} onPress={() => setExpandedDay(open ? -1 : day.day)}>
                        <Text style={it.dayLabel}>Day {day.day}</Text>
                        <ChevronIcon open={open} />
                      </TouchableOpacity>
                      {open && (
                        <View style={it.dayBody}>
                          <Text style={it.dayText}>{day.details}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              <View style={sec.card}>
                <Text style={sec.title}>Inclusions & Exclusions</Text>
                <View style={{ flexDirection: width >= 560 ? 'row' : 'column', gap: 12, marginTop: 4 }}>
                  <View style={ie.box}>
                    <Text style={ie.boxTitleGood}>What's Included</Text>
                    {tour.included.map((line) => (
                      <View key={line} style={ie.row}>
                        <CheckIcon />
                        <Text style={ie.rowText}>{line}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={[ie.box, ie.boxBad]}>
                    <Text style={ie.boxTitleBad}>Not Included</Text>
                    {tour.excluded.map((line) => (
                      <View key={line} style={ie.row}>
                        <XMarkIcon />
                        <Text style={ie.rowText}>{line}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              <View style={sec.card}>
                <Text style={sec.title}>Guest Reviews ({tour.reviews.length})</Text>
                {tour.reviews.length === 0 ? (
                  <Text style={sec.body}>No reviews yet — be the first to book and share your experience!</Text>
                ) : (
                  <View style={{ gap: 10 }}>
                    {tour.reviews.map((r) => (
                      <View key={r.name} style={rv.card}>
                        <Text style={rv.name}>{r.name}</Text>
                        <View style={{ flexDirection: 'row', gap: 2, marginVertical: 4 }}>
                          {Array.from({ length: 5 }).map((_, i) => <StarIcon key={i} />)}
                        </View>
                        <Text style={rv.text}>"{r.text}"</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {isWide && <View style={{ width: 320, flexShrink: 0 }}>{bookingBox}</View>}
          </View>
        </ScrollView>
      </View>
      </SafeAreaProvider>
    </Modal>
  );
}

const m = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.lightBg },
  header: { backgroundColor: C.brown, paddingHorizontal: 16, paddingBottom: 16, position: 'relative' },
  closeBtn: {
    position: 'absolute', top: 14, right: 16, flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFFFFF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  closeText: { fontSize: 11, fontWeight: '800', color: C.brown },
  headerTitle: { fontSize: 21, fontWeight: '900', color: '#FFFFFF', marginTop: 30, maxWidth: '80%' },
  headerSubtitle: { fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginTop: 2, fontStyle: 'italic' },
  headerMeta: { fontSize: 11.5, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  headerMetaNew: { fontSize: 11.5, color: '#FFD9A0', fontWeight: '800' },
});

const sec = StyleSheet.create({
  card: {
    backgroundColor: C.cardBg, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.divider, marginBottom: 14, width: '100%',
  },
  title: { fontSize: 14, fontWeight: '900', color: C.amber, marginBottom: 8 },
  body: { fontSize: 12.5, color: C.brownMid, lineHeight: 19 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  tag: { backgroundColor: C.lightBg, borderWidth: 1, borderColor: C.divider, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  tagText: { fontSize: 10.5, fontWeight: '700', color: C.brown },
});

const it = StyleSheet.create({
  dayWrap: { borderTopWidth: 1, borderTopColor: C.divider, paddingVertical: 4 },
  dayHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.lightBg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, marginVertical: 6,
  },
  dayLabel: { fontSize: 12.5, fontWeight: '800', color: C.brown },
  dayBody: { paddingHorizontal: 6, paddingBottom: 6 },
  dayText: { fontSize: 12, color: C.brownMid, lineHeight: 18 },
});

const ie = StyleSheet.create({
  box: { flex: 1, backgroundColor: '#EFF8F0', borderRadius: 12, padding: 12, gap: 8 },
  boxBad: { backgroundColor: '#FDECEA' },
  boxTitleGood: { fontSize: 12, fontWeight: '900', color: C.success, marginBottom: 2 },
  boxTitleBad: { fontSize: 12, fontWeight: '900', color: C.danger, marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  rowText: { fontSize: 11.5, color: C.brownMid, flexShrink: 1, lineHeight: 16 },
});

const rv = StyleSheet.create({
  card: { backgroundColor: C.lightBg, borderRadius: 12, padding: 12 },
  name: { fontSize: 12.5, fontWeight: '900', color: C.brown },
  text: { fontSize: 12, color: C.brownMid, lineHeight: 18, fontStyle: 'italic' },
});

const bx = StyleSheet.create({
  card: {
    backgroundColor: C.cardBg, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.divider, width: '100%', marginBottom: 14,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 2 },
    }),
  },
  fromRow: { marginBottom: 14 },
  fromLabel: { fontSize: 10, fontWeight: '800', color: C.brownMid, opacity: 0.7, letterSpacing: 0.5 },
  fromPrice: { fontSize: 22, fontWeight: '900', color: C.brown, marginTop: 2 },
  fromPerson: { fontSize: 12, fontWeight: '600', color: C.brownMid },
  guaranteeBadge: { backgroundColor: '#EFF8F0', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginTop: 6 },
  guaranteeText: { fontSize: 10, fontWeight: '800', color: C.success },

  fieldLabel: { fontSize: 11, fontWeight: '800', color: C.brown, marginBottom: 8, marginTop: 12 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: C.divider, backgroundColor: C.lightBg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  chipActive: { backgroundColor: C.brown, borderColor: C.brown },
  chipText: { fontSize: 10.5, fontWeight: '700', color: C.brown },
  chipTextActive: { color: '#FFFFFF' },

  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepperBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.lightBg, borderWidth: 1, borderColor: C.divider, alignItems: 'center', justifyContent: 'center' },
  stepperBtnText: { fontSize: 18, fontWeight: '900', color: C.brown },
  stepperValue: { fontSize: 15, fontWeight: '900', color: C.brown },

  total: { fontSize: 20, fontWeight: '900', color: C.brown },

  bookBtn: { backgroundColor: C.danger, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  bookBtnText: { fontSize: 13, fontWeight: '900', color: '#FFFFFF' },

  trustRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  trustTitle: { fontSize: 11.5, fontWeight: '800', color: C.brown },
  trustSub: { fontSize: 10, color: C.brownMid, opacity: 0.8, marginTop: 1 },
});
