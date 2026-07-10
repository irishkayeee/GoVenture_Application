/**
 * ClientDashboardHome.tsx
 * Client dashboard home tab — gradient hero banner, stat cards, favorites,
 * recommended tours, an upcoming-trip countdown, and quick actions. Visual
 * language mirrors the admin dashboard (hero gradient + decor, top-striped
 * panels, icon-chip stat cards with trend indicators) for consistency.
 * Two-column on wide screens (tablet/web), single-column on phones.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import Copyright from '@/components/Copyright';
import { C, HERO_GRADIENT } from '../theme';
import { STAT_CARDS, StatCard, FAVORITE_TOURS, FavoriteTour, RECOMMENDED_TOURS, RecommendedTour, UPCOMING_TRIP } from './mockData';

const WIDE_BREAKPOINT = 900;

export type DashboardNavTarget = 'tours' | 'plan' | 'bookings' | 'documents' | 'messages';

/* ── Icons ── */
const CalendarIcon = ({ color = C.amber, size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M7 3v4M17 3v4M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const ClipboardIcon = ({ color = C.amber, size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 5H7a1 1 0 00-1 1v13a1 1 0 001 1h10a1 1 0 001-1V6a1 1 0 00-1-1h-2" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    <Path d="M9 3h6a1 1 0 011 1v1a1 1 0 01-1 1H9a1 1 0 01-1-1V4a1 1 0 011-1zM9 11h6M9 15h6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);
const PinIcon = ({ color = C.amber, size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 21s7-7.58 7-12a7 7 0 10-14 0c0 4.42 7 12 7 12z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    <Circle cx={12} cy={9} r={2.4} stroke={color} strokeWidth={1.8} />
  </Svg>
);
const CardIcon = ({ color = C.amber, size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 7a1 1 0 011-1h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    <Path d="M3 10h18" stroke={color} strokeWidth={1.8} />
  </Svg>
);
const STAT_ICONS: Record<StatCard['icon'], (props: { color?: string; size?: number }) => React.JSX.Element> = {
  calendar: CalendarIcon, clipboard: ClipboardIcon, pin: PinIcon, card: CardIcon,
};
const TrendUpIcon = ({ color = C.success }: { color?: string }) => (
  <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
    <Path d="M22 7l-9 9-4-4L2 18" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16 7h6v6" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const TrendDownIcon = ({ color = C.danger }: { color?: string }) => (
  <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
    <Path d="M22 17l-9-9-4 4L2 6" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16 17h6v-6" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const HeartIcon = () => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill={C.amber}>
    <Path d="M12 21s-7.5-4.6-10.2-9.3C.3 8.7 1.9 5 5.6 5c2 0 3.4 1 4.4 2.4C11 6 12.4 5 14.4 5c3.7 0 5.3 3.7 3.8 6.7C19.5 16.4 12 21 12 21z" />
  </Svg>
);
const StarIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="#F5A623">
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
  </Svg>
);

function computeRemaining(targetISO: string) {
  const diff = Math.max(0, new Date(targetISO).getTime() - Date.now());
  return {
    days:  Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    mins:  Math.floor((diff % 3600000) / 60000),
    secs:  Math.floor((diff % 60000) / 1000),
  };
}

function useCountdown(targetISO: string) {
  const [remaining, setRemaining] = useState(() => computeRemaining(targetISO));
  useEffect(() => {
    const id = setInterval(() => setRemaining(computeRemaining(targetISO)), 1000);
    return () => clearInterval(id);
  }, [targetISO]);
  return remaining;
}

const formatShort = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/** Greeting + emoji based on the current hour, matching the admin dashboard's convention. */
function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good Morning', emoji: '☀️' };
  if (hour < 18) return { text: 'Good Afternoon', emoji: '🌤️' };
  return { text: 'Good Evening', emoji: '🌙' };
}

/* ── Hero banner ── */
function DashboardHero({ name }: { name: string }) {
  const greeting = getGreeting();
  const firstName = name.split(' ')[0];
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <LinearGradient colors={HERO_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={hero.card}>
      <View style={hero.decorLayer} pointerEvents="none">
        <Text style={[hero.decorEmoji, { top: 10, right: 66, fontSize: 15, opacity: 0.55, transform: [{ rotate: '18deg' }] }]}>✈️</Text>
        <Text style={[hero.decorEmoji, { top: 4, right: 4, fontSize: 20, opacity: 0.5 }]}>📍</Text>
        <Text style={[hero.decorEmoji, { bottom: -12, right: 78, fontSize: 62, opacity: 0.16 }]}>🏖️</Text>
        <Text style={[hero.decorEmoji, { bottom: -18, right: 2, fontSize: 50, opacity: 0.22 }]}>🌴</Text>
        <Text style={[hero.decorEmoji, { bottom: -22, right: 40, fontSize: 38, opacity: 0.2 }]}>🌴</Text>
      </View>

      <View style={hero.topRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={hero.eyebrowRow}>
            <Text style={hero.eyebrow} numberOfLines={1}>{greeting.text.toUpperCase()}, {firstName.toUpperCase()}!</Text>
            <Text style={hero.sun}>{greeting.emoji}</Text>
          </View>
          <Text style={hero.title}>Ready for your next journey?</Text>
          <Text style={hero.subtitle}>Browse tours, track bookings, and plan your next trip — all in one place.</Text>

          <View style={hero.datePill}>
            <CalendarIcon color="#FFFFFF" size={13} />
            <Text style={hero.dateText}>{today}</Text>
          </View>
        </View>

        <View style={hero.globeWrap}>
          <View style={hero.ring2} />
          <View style={hero.ring1} />
          <View style={hero.orbitDot1} />
          <View style={hero.orbitDot2} />
          <View style={hero.globeCircle}>
            <Text style={{ fontSize: 30 }}>🌍</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

/* ── Stat cards ── */
function StatCardItem({ card }: { card: StatCard }) {
  const Icon = STAT_ICONS[card.icon];
  return (
    <View style={st.card}>
      <View style={[st.iconWrap, { backgroundColor: card.iconBg }]}>
        <Icon color={card.iconColor} size={17} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={st.label} numberOfLines={2}>{card.label.toUpperCase()}</Text>
        <Text style={st.value} numberOfLines={1}>{card.value}</Text>
        <View style={st.trendRow}>
          {card.trendPositive ? <TrendUpIcon /> : <TrendDownIcon />}
          <Text
            style={[st.trendText, { color: card.trendPositive ? C.success : C.danger }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {card.trend}
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ── Section shell (matches admin Panel: top amber stripe, title + subtitle) ── */
function Section({ title, subtitle, viewAllLabel, onViewAll, children }: {
  title: string; subtitle?: string; viewAllLabel?: string; onViewAll?: () => void; children: React.ReactNode;
}) {
  return (
    <View style={sec.card}>
      <View style={sec.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={sec.title}>{title}</Text>
          {!!subtitle && <Text style={sec.subtitle}>{subtitle}</Text>}
        </View>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={sec.viewAll}>{viewAllLabel ?? 'View All'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

/* ── Favorites ── */
function FavoriteCard({ tour, onPress }: { tour: FavoriteTour; onPress: () => void }) {
  return (
    <View style={fc.card}>
      <View style={fc.banner}>
        <Text style={{ fontSize: 34 }}>{tour.emoji}</Text>
        <View style={fc.heart}><HeartIcon /></View>
      </View>
      <View style={fc.body}>
        <Text style={fc.dest} numberOfLines={1}>{tour.destination}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
          <StarIcon />
          <Text style={fc.rating}>{tour.rating.toFixed(1)} ({tour.reviews})</Text>
        </View>
        <Text style={fc.price}>from <Text style={fc.priceAmt}>{tour.pricePerPerson}</Text> / person</Text>
        <TouchableOpacity style={fc.btn} activeOpacity={0.85} onPress={onPress}>
          <Text style={fc.btnText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ── Recommended row ── */
function RecommendedRow({ tour, onBook }: { tour: RecommendedTour; onBook: () => void }) {
  return (
    <View style={rc.row}>
      <View style={rc.thumb}><Text style={{ fontSize: 20 }}>{tour.emoji}</Text></View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={rc.dest} numberOfLines={1}>{tour.destination}</Text>
        <Text style={rc.price}>from <Text style={rc.priceAmt}>{tour.pricePerPerson}</Text> / person</Text>
      </View>
      <TouchableOpacity style={rc.btn} activeOpacity={0.85} onPress={onBook}>
        <Text style={rc.btnText}>Book Now</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ── Upcoming trip ── */
function CountdownBox({ value, label }: { value: number; label: string }) {
  return (
    <View style={ut.cdBox}>
      <Text style={ut.cdValue}>{String(value).padStart(2, '0')}</Text>
      <Text style={ut.cdLabel}>{label}</Text>
    </View>
  );
}

function UpcomingTripCard({ onViewAll }: { onViewAll: () => void }) {
  const { days, hours, mins, secs } = useCountdown(UPCOMING_TRIP.startISO);
  return (
    <Section title="Upcoming Trip" subtitle="Your next adventure is almost here" viewAllLabel="View all" onViewAll={onViewAll}>
      <View style={ut.row}>
        <View style={ut.thumb}><Text style={{ fontSize: 26 }}>{UPCOMING_TRIP.emoji}</Text></View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={ut.dest} numberOfLines={1}>{UPCOMING_TRIP.destination}</Text>
          <Text style={ut.venue} numberOfLines={1}>{UPCOMING_TRIP.venue}</Text>
          <Text style={ut.dates}>{formatShort(UPCOMING_TRIP.startISO)} – {formatShort(UPCOMING_TRIP.endISO)}</Text>
          <Text style={ut.travelers}>{UPCOMING_TRIP.travelers} Travelers</Text>
        </View>
      </View>
      <View style={ut.countdownRow}>
        <CountdownBox value={days} label="Days" />
        <CountdownBox value={hours} label="Hours" />
        <CountdownBox value={mins} label="Mins" />
        <CountdownBox value={secs} label="Secs" />
      </View>
    </Section>
  );
}

/* ── Main screen ── */
type Props = {
  name?:       string;
  onNavigate: (tab: DashboardNavTarget) => void;
};

export default function ClientDashboardHome({ name = 'Jared Abellera', onNavigate }: Props) {
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;

  const sidebar = (
    <UpcomingTripCard onViewAll={() => onNavigate('bookings')} />
  );

  const main = (
    <>
      <Section title="My Favorites" subtitle="Tours you've saved for later" onViewAll={() => onNavigate('tours')}>
        {FAVORITE_TOURS.length === 0 ? (
          <Text style={sec.emptyText}>No favorites yet — tap the heart on a tour to save it here.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={fc.grid}>
            {FAVORITE_TOURS.map((f) => (
              <FavoriteCard key={f.id} tour={f} onPress={() => onNavigate('tours')} />
            ))}
          </ScrollView>
        )}
      </Section>

      <Section title="Recommended Tours" subtitle="Handpicked for your next trip" onViewAll={() => onNavigate('tours')}>
        {RECOMMENDED_TOURS.map((t) => (
          <RecommendedRow key={t.id} tour={t} onBook={() => onNavigate('tours')} />
        ))}
      </Section>
    </>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 96 }}>
        <DashboardHero name={name} />

        <View style={st.grid}>
          {STAT_CARDS.map((c) => <StatCardItem key={c.key} card={c} />)}
        </View>

        {isWide ? (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, gap: 16 }}>
            <View style={{ flex: 1, minWidth: 0 }}>{main}</View>
            <View style={{ width: 320, flexShrink: 0 }}>{sidebar}</View>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16 }}>
            {sidebar}
            {main}
          </View>
        )}

        <Copyright />
      </ScrollView>
    </View>
  );
}

/* ── Styles ── */
const hero = StyleSheet.create({
  card: {
    marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    borderRadius: 20, padding: 18,
    overflow: 'hidden', position: 'relative',
    ...Platform.select({
      ios:     { shadowColor: '#3B1A0C', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 5 },
    }),
  },
  decorLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  decorEmoji: { position: 'absolute' },
  topRow: { flexDirection: 'row', alignItems: 'flex-start' },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eyebrow: { fontSize: 10.5, fontWeight: '800', color: '#FFD9A0', letterSpacing: 0.6, flexShrink: 1 },
  sun: { fontSize: 12 },
  title: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3, marginTop: 4 },
  subtitle: { fontSize: 11.5, color: 'rgba(255,255,255,0.8)', lineHeight: 16, marginTop: 6, maxWidth: 230 },
  datePill: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    alignSelf: 'flex-start', marginTop: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
  },
  dateText: { fontSize: 10.5, fontWeight: '700', color: '#FFFFFF' },
  globeWrap: { width: 84, height: 84, alignItems: 'center', justifyContent: 'center', marginLeft: 8, flexShrink: 0 },
  ring2: { position: 'absolute', width: 84, height: 84, borderRadius: 42, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  ring1: { position: 'absolute', width: 68, height: 68, borderRadius: 34, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  orbitDot1: { position: 'absolute', top: 2, right: 2, width: 6, height: 6, borderRadius: 3, backgroundColor: C.amber },
  orbitDot2: { position: 'absolute', bottom: 6, left: 0, width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.amber },
  globeCircle: { width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
});

const st = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginTop: 16 },
  card: {
    width: '47%', flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.cardBg, borderRadius: 16, padding: 12,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 2 },
    }),
  },
  iconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  label: { fontSize: 8.5, fontWeight: '800', color: C.brownMid, opacity: 0.65, letterSpacing: 0.3, lineHeight: 11 },
  value: { fontSize: 17, fontWeight: '900', color: C.brown, marginTop: 3 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  trendText: { fontSize: 9, fontWeight: '700', flexShrink: 1 },
});

const sec = StyleSheet.create({
  card: {
    backgroundColor: C.cardBg, borderRadius: 14, padding: 14,
    marginTop: 16, borderTopWidth: 3, borderTopColor: C.amber,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 2 },
    }),
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, gap: 8 },
  title: { fontSize: 14, fontWeight: '900', color: C.brown },
  subtitle: { fontSize: 10, color: C.brownMid, opacity: 0.7, marginTop: 2 },
  viewAll: { fontSize: 11.5, fontWeight: '700', color: C.amber },
  emptyText: { fontSize: 11.5, color: C.brownMid, opacity: 0.7 },
});

const fc = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 12, paddingRight: 4 },
  card: {
    width: 168, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: C.divider, backgroundColor: C.cardBg,
  },
  banner: {
    height: 90, backgroundColor: C.amber, alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  heart: {
    position: 'absolute', top: 8, right: 8,
    width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
  },
  body: { padding: 10 },
  dest: { fontSize: 12.5, fontWeight: '900', color: C.brown },
  rating: { fontSize: 10.5, fontWeight: '700', color: C.brownMid },
  price: { fontSize: 10.5, color: C.brownMid, marginTop: 6 },
  priceAmt: { fontWeight: '900', color: C.amber },
  btn: {
    marginTop: 8, backgroundColor: C.lightBg, borderWidth: 1, borderColor: C.divider,
    borderRadius: 20, paddingVertical: 8, alignItems: 'center',
  },
  btnText: { fontSize: 10.5, fontWeight: '800', color: C.brown },
});

const rc = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  thumb: {
    width: 44, height: 44, borderRadius: 10, flexShrink: 0,
    backgroundColor: C.amber, alignItems: 'center', justifyContent: 'center',
  },
  dest: { fontSize: 12.5, fontWeight: '800', color: C.brown },
  price: { fontSize: 10.5, color: C.brownMid, marginTop: 2 },
  priceAmt: { fontWeight: '900', color: C.amber },
  btn: { backgroundColor: C.amber, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8, flexShrink: 0 },
  btnText: { fontSize: 10.5, fontWeight: '800', color: '#FFFFFF' },
});

const ut = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  thumb: {
    width: 52, height: 52, borderRadius: 12, flexShrink: 0,
    backgroundColor: C.amber, alignItems: 'center', justifyContent: 'center',
  },
  dest: { fontSize: 13, fontWeight: '900', color: C.brown },
  venue: { fontSize: 10.5, color: C.amber, fontWeight: '700', marginTop: 1 },
  dates: { fontSize: 10, color: C.brownMid, marginTop: 3 },
  travelers: { fontSize: 10, color: C.brownMid, opacity: 0.75, marginTop: 1 },

  countdownRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  cdBox: {
    flex: 1, alignItems: 'center', backgroundColor: C.amber, borderRadius: 10, paddingVertical: 8,
  },
  cdValue: { fontSize: 15, fontWeight: '900', color: '#FFFFFF' },
  cdLabel: { fontSize: 8, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginTop: 1, letterSpacing: 0.4 },
});

