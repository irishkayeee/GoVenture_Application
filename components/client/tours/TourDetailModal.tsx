/**
 * TourDetailModal.tsx
 * Full tour detail — cover banner with favorite/close, About, Available
 * Dates, Pricing by Age Group, a day-by-day itinerary accordion (rich
 * accommodation/meals/activities view for tours with showcase content,
 * simple text view otherwise), inclusions & exclusions, guest reviews, and a
 * bottom "Book Now" CTA banner that opens the booking wizard (which has its
 * own departure-date and traveler pickers).
 */

import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, ScrollView, Image,
  StyleSheet, Platform, useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { C } from '../theme';
import { Tour, DepartureOption } from './mockData';
import { getTourDetailContent, DetailItineraryDay } from './tourDetailContent';
import { useFavorites } from './FavoritesContext';
import LeafletMap from './LeafletMap';

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
const HeartIcon = ({ filled }: { filled: boolean }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill={filled ? C.danger : 'none'}>
    <Path d="M12 21s-7.5-4.6-10.2-9.3C.3 8.7 1.9 5 5.6 5c2 0 3.4 1 4.4 2.4C11 6 12.4 5 14.4 5c3.7 0 5.3 3.7 3.8 6.7C19.5 16.4 12 21 12 21z" stroke={filled ? C.danger : C.brownMid} strokeWidth={1.8} />
  </Svg>
);
const BedIcon = () => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
    <Path d="M3 18v-7a2 2 0 012-2h14a2 2 0 012 2v7M3 18v2M21 18v2M3 13h18" stroke={C.amber} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M6 11V8a2 2 0 012-2h2a2 2 0 012 2v3" stroke={C.amber} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const MealIcon = () => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
    <Path d="M6 3v7a2 2 0 002 2v9M6 3v9M9 3v9M15 3c-1.5 0-2 2-2 4.5S14 12 15 12v9M15 3v9" stroke={C.amber} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const PinIcon = ({ color = C.amber }: { color?: string }) => (
  <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
    <Path d="M12 21s7-7.58 7-12a7 7 0 10-14 0c0 4.42 7 12 7 12z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
  </Svg>
);
const money = (n: number) => `₱${n.toLocaleString('en-US')}`;
const formatDateRange = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

type Props = {
  tour:    Tour | null;
  visible: boolean;
  onClose: () => void;
  onBook:  (departure: DepartureOption, travelers: number) => void;
};

export default function TourDetailModal({ tour, visible, onClose, onBook }: Props) {
  const { width } = useWindowDimensions();

  const [expandedDay, setExpandedDay] = useState<number>(1);

  const tourId = tour?.id;
  useEffect(() => {
    setExpandedDay(1);
  }, [tourId]);

  if (!tour) return null;

  const departure = tour.departures[0];
  const defaultTravelers = 1;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaProvider>
        <DetailModalBody
          tour={tour}
          width={width}
          expandedDay={expandedDay}
          setExpandedDay={setExpandedDay}
          onClose={onClose}
          onBook={onBook}
          departure={departure}
          travelers={defaultTravelers}
        />
      </SafeAreaProvider>
    </Modal>
  );
}

/** One day of the rich (accommodation/meals/numbered activities + mock map) itinerary view. */
function RichItineraryDay({ day, open, onToggle }: { day: DetailItineraryDay; open: boolean; onToggle: () => void }) {
  const [activeActivity, setActiveActivity] = useState(0);

  return (
    <View style={it.dayWrap}>
      <TouchableOpacity style={it.dayHeader} activeOpacity={0.8} onPress={onToggle}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
          <View style={it.dayPill}><Text style={it.dayPillText}>DAY {day.day}</Text></View>
          <Text style={it.dayTitle} numberOfLines={1}>{day.title}</Text>
        </View>
        <ChevronIcon open={open} />
      </TouchableOpacity>

      {open && (
        <View style={it.dayBody}>
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 10 }}>
            {day.accommodation && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <BedIcon />
                <View style={{ flex: 1 }}>
                  <Text style={it.factLabel}>Accommodation</Text>
                  <Text style={it.factValue} numberOfLines={1}>{day.accommodation}</Text>
                </View>
              </View>
            )}
            {day.meals && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <MealIcon />
                <View style={{ flex: 1 }}>
                  <Text style={it.factLabel}>Meals</Text>
                  <Text style={it.factValue} numberOfLines={1}>{day.meals}</Text>
                </View>
              </View>
            )}
          </View>

          {day.activities.map((act, i) => (
            <View key={i} style={it.activityRow}>
              <View style={it.activityNum}><Text style={it.activityNumText}>{i + 1}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={it.activityTitle}>{act.title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <PinIcon />
                  <Text style={it.activityLocation}>{act.location}</Text>
                </View>
                <TouchableOpacity style={it.mapLink} activeOpacity={0.75} onPress={() => setActiveActivity(i)}>
                  <Text style={it.mapLinkText}>📍 View on map</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <View style={{ marginTop: 14 }}>
            <LeafletMap
              pins={day.activities.map((act) => ({ lat: act.lat, lng: act.lng, label: act.location }))}
              activeIndex={activeActivity}
            />
          </View>
        </View>
      )}
    </View>
  );
}

/**
 * Split out so useSafeAreaInsets() reads from the SafeAreaProvider mounted
 * just above it — RN's Modal renders in its own native surface, so a hook
 * call in the parent (outside that provider's subtree) would pick up the
 * app-root insets instead of this modal's own, leaving the close button
 * pinned under the status bar with no top padding.
 */
function DetailModalBody({
  tour, width, expandedDay, setExpandedDay, onClose, onBook, departure, travelers,
}: {
  tour: Tour;
  width: number;
  expandedDay: number;
  setExpandedDay: (day: number) => void;
  onClose: () => void;
  onBook: (departure: DepartureOption, travelers: number) => void;
  departure?: DepartureOption;
  travelers: number;
}) {
  const insets = useSafeAreaInsets();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const favorited = favoriteIds.has(tour.id);
  const detail = getTourDetailContent(tour.destination);

  const displayName = detail?.displayName ?? tour.destination;
  const displaySubtitle = detail?.subtitle || tour.subtitle;
  const typeBadge = tour.tags[1];
  const inclusions = detail?.inclusions ?? tour.included;
  const exclusions = detail?.exclusions ?? tour.excluded;
  const reviews = detail?.reviews ?? tour.reviews;
  const availableDateRows = detail
    ? detail.availableDates.map((d) => ({ id: d.id, label: d.label, price: d.adultPrice }))
    : tour.departures.map((d) => ({
        id: d.id,
        label: `${formatDateRange(d.startISO)} – ${formatDateRange(d.endISO)}`,
        price: d.adultPrice,
      }));

  return (
    <View style={m.safe}>
      <View style={m.banner}>
        {tour.imageUrl ? (
          <Image source={{ uri: tour.imageUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <View style={m.bannerFallback}><Text style={{ fontSize: 48 }}>{tour.emoji}</Text></View>
        )}
        <View style={[m.bannerOverlayRow, { top: insets.top + 10 }]}>
          <TouchableOpacity style={m.iconBtn} activeOpacity={0.8} onPress={() => toggleFavorite(tour.id)}>
            <HeartIcon filled={favorited} />
          </TouchableOpacity>
          <TouchableOpacity style={m.iconBtn} activeOpacity={0.85} onPress={onClose}>
            <CloseIcon />
          </TouchableOpacity>
        </View>
      </View>

      <View style={m.header}>
        <Text style={m.headerTitle}>{displayName}</Text>
        {!!displaySubtitle && <Text style={m.headerSubtitle}>{displaySubtitle}</Text>}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          {!!typeBadge && <View style={m.typeBadge}><Text style={m.typeBadgeText}>{typeBadge}</Text></View>}
          {tour.isNew ? (
            <Text style={m.headerMetaNew}>★ New</Text>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <StarIcon />
              <Text style={m.headerMeta}>{tour.rating.toFixed(1)} ({tour.reviewCount})</Text>
            </View>
          )}
        </View>

        <View style={m.priceTeaser}>
          <View>
            <Text style={m.priceTeaserLabel}>FROM</Text>
            <Text style={m.priceTeaserValue}>{money(tour.pricePerPerson)} <Text style={m.priceTeaserPerson}>/ person</Text></Text>
            <Text style={m.priceTeaserDuration}>{tour.duration}</Text>
          </View>
          {!!detail?.bestDeal && (
            <View style={m.bestDealPill}><Text style={m.bestDealText}>★ BEST DEAL</Text></View>
          )}
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <View style={{ padding: 16 }}>
            <View style={sec.card}>
              <Text style={sec.title}>About This Tour</Text>
              <Text style={sec.body}>{tour.description}</Text>
              <View style={sec.tagWrap}>
                {tour.tags.map((tag) => (
                  <View key={tag} style={sec.tag}><Text style={sec.tagText}>{tag}</Text></View>
                ))}
              </View>
              {!!detail && (
                <Text style={sec.downpayment}>Downpayment: <Text style={{ fontWeight: '900', color: C.brown }}>{money(detail.downpayment)}</Text></Text>
              )}
            </View>

            <View style={sec.card}>
              <Text style={sec.title}>Available Dates</Text>
              {availableDateRows.length === 0 ? (
                <Text style={sec.body}>No upcoming departures right now — check back soon.</Text>
              ) : (
                <View style={{ gap: 10, marginTop: 4 }}>
                  {availableDateRows.map((d) => (
                    <View key={d.id} style={ad.row}>
                      <View style={{ flex: 1 }}>
                        <Text style={ad.label}>{d.label}</Text>
                        <Text style={ad.price}>{money(d.price)} / adult</Text>
                      </View>
                      <View style={ad.badge}><Text style={ad.badgeText}>Available</Text></View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {!!detail && (
              <View style={sec.card}>
                <Text style={sec.title}>Pricing by Age Group</Text>
                <View style={ag.row}>
                  <View style={ag.card}>
                    <Text style={ag.label}>ADULT</Text>
                    <Text style={ag.price}>{money(detail.agePricing.adult)}</Text>
                    <Text style={ag.per}>/ person</Text>
                  </View>
                  <View style={ag.card}>
                    <Text style={ag.label}>CHILD</Text>
                    <Text style={ag.price}>{money(detail.agePricing.child)}</Text>
                    <Text style={ag.per}>/ person</Text>
                  </View>
                  <View style={ag.card}>
                    <Text style={ag.label}>TODDLER</Text>
                    <Text style={ag.price}>{money(detail.agePricing.toddler)}</Text>
                    <Text style={ag.per}>/ person</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={sec.card}>
              <Text style={sec.title}>Itinerary</Text>
              {detail ? (
                detail.itinerary.map((day) => (
                  <RichItineraryDay
                    key={day.day}
                    day={day}
                    open={expandedDay === day.day}
                    onToggle={() => setExpandedDay(expandedDay === day.day ? -1 : day.day)}
                  />
                ))
              ) : tour.itinerary.length === 0 ? (
                <Text style={sec.body}>Full day-by-day itinerary coming soon for this tour.</Text>
              ) : (
                tour.itinerary.map((day) => {
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
                })
              )}
            </View>

            <View style={sec.card}>
              <Text style={sec.title}>Inclusions & Exclusions</Text>
              {inclusions.length === 0 && exclusions.length === 0 ? (
                <Text style={sec.body}>Inclusions and exclusions coming soon for this tour.</Text>
              ) : (
                <View style={{ flexDirection: width >= 560 ? 'row' : 'column', gap: 12, marginTop: 4 }}>
                  <View style={ie.box}>
                    <Text style={ie.boxTitleGood}>What's Included</Text>
                    {inclusions.map((line) => (
                      <View key={line} style={ie.row}>
                        <CheckIcon />
                        <Text style={ie.rowText}>{line}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={[ie.box, ie.boxBad]}>
                    <Text style={ie.boxTitleBad}>Not Included</Text>
                    {exclusions.map((line) => (
                      <View key={line} style={ie.row}>
                        <XMarkIcon />
                        <Text style={ie.rowText}>{line}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            <View style={sec.card}>
              <Text style={sec.title}>Guest Reviews ({reviews.length})</Text>
              {reviews.length === 0 ? (
                <Text style={sec.body}>No reviews yet — be the first to book and share your experience!</Text>
              ) : (
                <View style={{ gap: 10 }}>
                  {reviews.map((r) => (
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

        <View style={cta.banner}>
          <Text style={{ fontSize: 30 }}>🧳</Text>
          <View style={{ flex: 1 }}>
            <Text style={cta.title}>Ready for an unforgettable adventure?</Text>
            <Text style={cta.text}>Book now and experience the best of {tour.destination} with GoVenture!</Text>
          </View>
          <TouchableOpacity
            style={[cta.bookBtn, !departure && { opacity: 0.5 }]}
            activeOpacity={0.85}
            disabled={!departure}
            onPress={() => departure && onBook(departure, travelers)}
          >
            <Text style={cta.bookBtnText}>Book Now</Text>
          </TouchableOpacity>
        </View>
        <Text style={cta.note}>Note: Itinerary is subject to change due to local condition.</Text>
      </ScrollView>
    </View>
  );
}

const m = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.lightBg },

  banner: { height: 170, backgroundColor: C.brown, position: 'relative', overflow: 'hidden' },
  bannerFallback: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  bannerOverlayRow: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  iconBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
  },

  header: { backgroundColor: C.brown, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16 },
  headerTitle: { fontSize: 21, fontWeight: '900', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginTop: 2, fontStyle: 'italic' },
  headerMeta: { fontSize: 11.5, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  headerMetaNew: { fontSize: 11.5, color: '#FFD9A0', fontWeight: '800' },

  typeBadge: { backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  typeBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },

  priceTeaser: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginTop: 14,
  },
  priceTeaserLabel: { fontSize: 9.5, fontWeight: '800', color: C.brownMid, opacity: 0.7, letterSpacing: 0.5 },
  priceTeaserValue: { fontSize: 18, fontWeight: '900', color: C.brown, marginTop: 2 },
  priceTeaserPerson: { fontSize: 11, fontWeight: '600', color: C.brownMid },
  priceTeaserDuration: { fontSize: 10.5, color: C.brownMid, opacity: 0.8, marginTop: 2 },
  bestDealPill: { backgroundColor: C.amber, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  bestDealText: { fontSize: 10, fontWeight: '900', color: '#FFFFFF' },
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
  downpayment: { fontSize: 11.5, color: C.brownMid, marginTop: 12 },
});

const ad = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.lightBg, borderRadius: 12, borderWidth: 1, borderColor: C.divider,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  label: { fontSize: 12.5, fontWeight: '800', color: C.brown },
  price: { fontSize: 11, color: C.brownMid, marginTop: 2 },
  badge: { backgroundColor: '#EFF8F0', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontSize: 10, fontWeight: '800', color: C.success },
});

const ag = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, marginTop: 4 },
  card: { flex: 1, backgroundColor: C.lightBg, borderRadius: 12, borderWidth: 1, borderColor: C.divider, padding: 12 },
  label: { fontSize: 9.5, fontWeight: '800', color: C.brownMid, opacity: 0.7, letterSpacing: 0.4 },
  price: { fontSize: 14, fontWeight: '900', color: C.brown, marginTop: 5 },
  per: { fontSize: 9.5, color: C.brownMid, fontWeight: '600' },
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

  dayPill: { backgroundColor: C.brown, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  dayPillText: { fontSize: 9.5, fontWeight: '900', color: '#FFFFFF' },
  dayTitle: { fontSize: 12.5, fontWeight: '800', color: C.brown, flexShrink: 1 },

  factLabel: { fontSize: 9.5, fontWeight: '800', color: C.brownMid, opacity: 0.7 },
  factValue: { fontSize: 11.5, fontWeight: '700', color: C.brown, marginTop: 1 },

  activityRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  activityNum: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: C.amber, flexShrink: 0,
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  activityNumText: { fontSize: 10.5, fontWeight: '900', color: '#FFFFFF' },
  activityTitle: { fontSize: 12, fontWeight: '700', color: C.brown, lineHeight: 17 },
  activityLocation: { fontSize: 10.5, color: C.brownMid, opacity: 0.85 },
  mapLink: { alignSelf: 'flex-start', marginTop: 6 },
  mapLinkText: { fontSize: 10.5, fontWeight: '800', color: C.amber },
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

const cta = StyleSheet.create({
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.brown, borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 2,
  },
  title: { fontSize: 12.5, fontWeight: '900', color: '#FFFFFF' },
  text: { fontSize: 10.5, color: 'rgba(255,255,255,0.85)', marginTop: 3, lineHeight: 15 },
  bookBtn: { backgroundColor: C.danger, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  bookBtnText: { fontSize: 11.5, fontWeight: '900', color: '#FFFFFF' },
  note: { fontSize: 10, color: C.brownMid, opacity: 0.65, textAlign: 'center', marginTop: 10, marginHorizontal: 16, fontStyle: 'italic' },
});

