/**
 * ClientDashboardHome.tsx
 * Client dashboard home tab — gradient hero banner, stat cards, favorites,
 * recommended tours, an upcoming-trip countdown, and quick actions. Visual
 * language mirrors the admin dashboard (hero gradient + decor, top-striped
 * panels, icon-chip stat cards with trend indicators) for consistency.
 * Two-column on wide screens (tablet/web), single-column on phones.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, useWindowDimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import Copyright from '@/components/Copyright';
import { C, HERO_GRADIENT } from '../theme';
import { StatCard, FavoriteTour, RecommendedTour } from './mockData';
import { useBookings, Booking } from '../bookings/BookingsContext';
import { fetchTours, Tour } from '../tours/mockData';
import { useFavorites } from '../tours/FavoritesContext';
import { TRIP_WEATHER_API_URL } from '@/constants/api';
import StatDetailModal, { StatColumn } from './StatDetailModal';

const money = (n: number) => `₱${n.toLocaleString('en-US')}`;

const WIDE_BREAKPOINT = 900;

export type DashboardNavTarget = 'tours' | 'bookings' | 'documents' | 'messages';

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
/** Generic travel-photo glyph — shown when a tour has no image, or its image fails to load. */
const PhotoFallbackIcon = ({ color = 'rgba(255,255,255,0.85)', size = 30 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 18l5-6 4 4.5 3-3.5 4 5H4z" fill={color} />
    <Circle cx={8} cy={7.5} r={2} fill={color} />
    <Path d="M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z" stroke={color} strokeWidth={1.6} />
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
function StatCardItem({ card, onPress }: { card: StatCard; onPress: () => void }) {
  const Icon = STAT_ICONS[card.icon];
  return (
    <TouchableOpacity style={st.card} activeOpacity={0.8} onPress={onPress}>
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
    </TouchableOpacity>
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
function FavoriteCard({ tour, onPress, onToggleFavorite }: { tour: FavoriteTour; onPress: () => void; onToggleFavorite: () => void }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = !!tour.imageUrl && !imageFailed;
  return (
    <View style={fc.card}>
      <View style={fc.banner}>
        {showImage ? (
          <Image
            source={{ uri: tour.imageUrl! }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <PhotoFallbackIcon />
        )}
        <TouchableOpacity style={fc.heart} activeOpacity={0.8} onPress={onToggleFavorite} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <HeartIcon />
        </TouchableOpacity>
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
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = !!tour.imageUrl && !imageFailed;
  return (
    <View style={rc.row}>
      <View style={rc.thumb}>
        {showImage ? (
          <Image
            source={{ uri: tour.imageUrl! }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <PhotoFallbackIcon size={18} />
        )}
      </View>
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

type WeatherDay = { date: string; label: string; icon: string; tempMax: number; tempMin: number };
type TripWeather = {
  available: boolean;
  location?: string;
  daysUntil?: number;
  current?: { temp: number; label: string; icon: string };
  daily?: WeatherDay[];
};

const WEATHER_ICON_PATHS: Record<string, string> = {
  sun: 'M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zM12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8L6 18M18 6l1.8-1.8',
  'partly-cloudy': 'M9 8.5a3.5 3.5 0 016.9-.9M6.5 20h11a3.5 3.5 0 00.6-6.95A5 5 0 008.7 11.2 3.5 3.5 0 006.5 20z',
  cloudy: 'M6.5 19h11a3.5 3.5 0 00.6-6.95A5 5 0 008.7 10.2 3.5 3.5 0 006.5 19z',
  fog: 'M6.5 15h11a3.5 3.5 0 00.6-6.95A5 5 0 008.7 6.2 3.5 3.5 0 006.5 15zM4 18h16M6 21h12',
  rain: 'M6.5 13h11a3.5 3.5 0 00.6-6.95A5 5 0 008.7 4.2 3.5 3.5 0 006.5 13zM8 17l-1 3M12 17l-1 3M16 17l-1 3',
  snow: 'M6.5 13h11a3.5 3.5 0 00.6-6.95A5 5 0 008.7 4.2 3.5 3.5 0 006.5 13zM8 18v3M12 18v3M16 18v3',
  storm: 'M6.5 12h11a3.5 3.5 0 00.6-6.95A5 5 0 008.7 3.2 3.5 3.5 0 006.5 12zM13 14l-3 5h3l-2 4',
};

const WeatherIcon = ({ icon, color = C.amber, size = 14 }: { icon: string; color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d={WEATHER_ICON_PATHS[icon] ?? WEATHER_ICON_PATHS.cloudy} stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

function TripWeatherChip({ destination, dateFrom }: { destination: string; dateFrom: string }) {
  const [weather, setWeather] = useState<TripWeather | null>(null);

  useEffect(() => {
    let cancelled = false;
    const dateOnly = dateFrom.slice(0, 10);
    fetch(`${TRIP_WEATHER_API_URL}&destination=${encodeURIComponent(destination)}&date=${dateOnly}`)
      .then((res) => res.json())
      .then((result) => { if (!cancelled && result.status === 'success') setWeather(result.data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [destination, dateFrom]);

  if (!weather?.available || !weather.current) return null;

  return (
    <View style={ut.weatherChip}>
      <WeatherIcon icon={weather.current.icon} />
      <Text style={ut.weatherTemp}>{weather.current.temp}°C</Text>
      <Text style={ut.weatherLabel}>{weather.current.label}</Text>
    </View>
  );
}

const weekdayShort = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' });
const monthDayShort = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

function WeatherWidget({ destination, dateFrom }: { destination: string; dateFrom: string }) {
  const [weather, setWeather] = useState<TripWeather | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const dateOnly = dateFrom.slice(0, 10);
    fetch(`${TRIP_WEATHER_API_URL}&destination=${encodeURIComponent(destination)}&date=${dateOnly}`)
      .then((res) => res.json())
      .then((result) => { if (!cancelled && result.status === 'success') setWeather(result.data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [destination, dateFrom]);

  return (
    <View style={ww.card}>
      <Text style={ww.title}>Weather in {weather?.location ?? destination}</Text>

      {loading ? (
        <Text style={ww.hint}>Loading forecast…</Text>
      ) : !weather?.available || !weather.current ? (
        <Text style={ww.hint}>
          {weather && weather.daysUntil !== undefined && weather.daysUntil > 0
            ? `Forecast opens up ${weather.daysUntil <= 7 ? 'soon' : `${weather.daysUntil - 7} day${weather.daysUntil - 7 === 1 ? '' : 's'} before it's this accurate`} — check back closer to your trip.`
            : 'Forecast isn’t available for this trip yet.'}
        </Text>
      ) : (
        <>
          <View style={ww.currentRow}>
            <WeatherIcon icon={weather.current.icon} color={C.amber} size={34} />
            <View>
              <Text style={ww.currentTemp}>{weather.current.temp}°C</Text>
              <Text style={ww.currentLabel}>{weather.current.label}</Text>
            </View>
          </View>

          {expanded && weather.daily && (
            <View style={ww.forecastRow}>
              {weather.daily.map((d) => (
                <View key={d.date} style={ww.forecastDay}>
                  <Text style={ww.forecastDayLabel}>{weekdayShort(d.date)}</Text>
                  <Text style={ww.forecastDayDate}>{monthDayShort(d.date)}</Text>
                  <WeatherIcon icon={d.icon} color={C.amber} size={18} />
                  <Text style={ww.forecastTempMax}>{d.tempMax}°</Text>
                  <Text style={ww.forecastTempMin}>{d.tempMin}°</Text>
                </View>
              ))}
            </View>
          )}

          {weather.daily && weather.daily.length > 0 && (
            <TouchableOpacity style={ww.toggleBtn} activeOpacity={0.75} onPress={() => setExpanded((v) => !v)}>
              <Text style={ww.toggleBtnText}>{expanded ? 'Hide forecast' : 'View 7-day forecast'} →</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

/** Dummy PH-wide forecast (Manila) — always available, not tied to any trip. */
const PH_WEATHER_MOCK: TripWeather = {
  available: true,
  location: 'Manila, Philippines',
  current: { temp: 29, label: 'Partly Cloudy', icon: 'partly-cloudy' },
  daily: [
    { date: '2026-07-30', label: 'Rain',          icon: 'rain',          tempMax: 30, tempMin: 25 },
    { date: '2026-07-31', label: 'Thunderstorm',  icon: 'storm',         tempMax: 29, tempMin: 24 },
    { date: '2026-08-01', label: 'Rain',          icon: 'rain',          tempMax: 28, tempMin: 24 },
    { date: '2026-08-02', label: 'Partly Cloudy', icon: 'partly-cloudy', tempMax: 31, tempMin: 25 },
    { date: '2026-08-03', label: 'Sunny',         icon: 'sun',           tempMax: 32, tempMin: 26 },
    { date: '2026-08-04', label: 'Cloudy',        icon: 'cloudy',        tempMax: 29, tempMin: 25 },
    { date: '2026-08-05', label: 'Rain',          icon: 'rain',          tempMax: 28, tempMin: 24 },
  ],
};

/** Local PH weather (dummy data) — a separate, always-on widget distinct from the destination forecast below it. */
function PhilippinesWeatherWidget() {
  const [expanded, setExpanded] = useState(false);
  const weather = PH_WEATHER_MOCK;

  return (
    <View style={ww.card}>
      <Text style={ww.title}>Weather in the Philippines</Text>
      <Text style={ww.locationSub}>{weather.location}</Text>

      <View style={ww.currentRow}>
        <WeatherIcon icon={weather.current!.icon} color={C.amber} size={34} />
        <View>
          <Text style={ww.currentTemp}>{weather.current!.temp}°C</Text>
          <Text style={ww.currentLabel}>{weather.current!.label}</Text>
        </View>
      </View>

      {expanded && (
        <View style={ww.forecastRow}>
          {weather.daily!.map((d) => (
            <View key={d.date} style={ww.forecastDay}>
              <Text style={ww.forecastDayLabel}>{weekdayShort(d.date)}</Text>
              <Text style={ww.forecastDayDate}>{monthDayShort(d.date)}</Text>
              <WeatherIcon icon={d.icon} color={C.amber} size={18} />
              <Text style={ww.forecastTempMax}>{d.tempMax}°</Text>
              <Text style={ww.forecastTempMin}>{d.tempMin}°</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={ww.toggleBtn} activeOpacity={0.75} onPress={() => setExpanded((v) => !v)}>
        <Text style={ww.toggleBtnText}>{expanded ? 'Hide forecast' : 'View 7-day forecast'} →</Text>
      </TouchableOpacity>
    </View>
  );
}

const ww = StyleSheet.create({
  card: {
    backgroundColor: C.cardBg, borderRadius: 14, padding: 14, marginTop: 12,
    borderWidth: 1, borderColor: C.divider,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 2 },
    }),
  },
  title: { fontSize: 12.5, fontWeight: '900', color: C.brown },
  locationSub: { fontSize: 10, color: C.brownMid, opacity: 0.65, marginTop: 1 },
  hint: { fontSize: 11, color: C.brownMid, opacity: 0.7, marginTop: 10, lineHeight: 15 },
  currentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
  currentTemp: { fontSize: 26, fontWeight: '900', color: C.brown },
  currentLabel: { fontSize: 11, color: C.brownMid, opacity: 0.8, marginTop: 1 },

  forecastRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, gap: 4 },
  forecastDay: { alignItems: 'center', gap: 3, flex: 1 },
  forecastDayLabel: { fontSize: 9, fontWeight: '800', color: C.brownMid, opacity: 0.75 },
  forecastDayDate: { fontSize: 8, fontWeight: '600', color: C.brownMid, opacity: 0.55, marginTop: -2 },
  forecastTempMax: { fontSize: 10.5, fontWeight: '800', color: C.brown },
  forecastTempMin: { fontSize: 9.5, color: C.brownMid, opacity: 0.65 },

  toggleBtn: { marginTop: 12, alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: C.divider },
  toggleBtnText: { fontSize: 11.5, fontWeight: '800', color: C.amber },
});

function UpcomingTripCard({ trip, onViewAll }: { trip: Booking; onViewAll: () => void }) {
  const { days, hours, mins, secs } = useCountdown(trip.dateFrom);
  return (
    <Section title="Upcoming Trip" subtitle="Your next adventure is almost here" viewAllLabel="View all" onViewAll={onViewAll}>
      <View style={ut.row}>
        <View style={ut.thumb}>
          {trip.imageUrl ? (
            <Image source={{ uri: trip.imageUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          ) : (
            <Text style={{ fontSize: 26 }}>🌏</Text>
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={ut.dest} numberOfLines={1}>{trip.destination}</Text>
            <TripWeatherChip destination={trip.destination} dateFrom={trip.dateFrom} />
          </View>
          <Text style={ut.venue} numberOfLines={1}>{trip.location}</Text>
          <Text style={ut.dates}>{formatShort(trip.dateFrom)} – {formatShort(trip.dateTo)}</Text>
          <Text style={ut.travelers}>{trip.travelers} Travelers</Text>
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

function NoUpcomingTripCard({ onBrowse }: { onBrowse: () => void }) {
  return (
    <Section title="Upcoming Trip" subtitle="Your next adventure is almost here">
      <Text style={sec.emptyText}>No upcoming trips yet — browse tours to plan your next adventure!</Text>
      <TouchableOpacity style={rc.btn} activeOpacity={0.85} onPress={onBrowse}>
        <Text style={rc.btnText}>Browse Tours</Text>
      </TouchableOpacity>
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
  const { bookings } = useBookings();
  const { favoriteIds, toggleFavorite } = useFavorites();

  const [tours, setTours] = useState<Tour[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchTours()
      .then((data) => { if (!cancelled) setTours(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const recommended: RecommendedTour[] = useMemo(
    () =>
      [...tours]
        .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
        .slice(0, 3)
        .map((t) => ({ id: t.id, destination: t.destination, pricePerPerson: money(t.pricePerPerson), emoji: t.emoji, imageUrl: t.imageUrl })),
    [tours]
  );

  const favoriteTours: FavoriteTour[] = useMemo(
    () =>
      tours
        .filter((t) => favoriteIds.has(t.id))
        .map((t) => ({ id: t.id, destination: t.destination, rating: t.rating, reviews: t.reviewCount, pricePerPerson: money(t.pricePerPerson), emoji: t.emoji, imageUrl: t.imageUrl })),
    [tours, favoriteIds]
  );

  const upcomingTrip = useMemo(() => {
    const upcoming = bookings
      .filter((b) => b.status === 'Upcoming' || b.status === 'Ongoing')
      .sort((a, b) => new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime());
    return upcoming[0] ?? null;
  }, [bookings]);

  const placesVisited = useMemo(
    () => new Set(bookings.filter((b) => b.status === 'Completed').map((b) => b.destination)).size,
    [bookings]
  );
  const pendingPayments = useMemo(
    () => bookings.filter((b) => b.paymentStatus === 'Pending').reduce((sum, b) => sum + b.balanceDue, 0),
    [bookings]
  );
  const upcomingCount = useMemo(
    () => bookings.filter((b) => b.status === 'Upcoming' || b.status === 'Ongoing').length,
    [bookings]
  );

  const [activeModal, setActiveModal] = useState<'tours' | 'bookings' | 'places' | 'payments' | null>(null);

  const upcomingRows = useMemo(
    () =>
      [...bookings.filter((b) => b.status === 'Upcoming' || b.status === 'Ongoing')]
        .sort((a, b) => new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime()),
    [bookings]
  );
  const placesRows = useMemo(
    () =>
      [...bookings.filter((b) => b.status === 'Completed')]
        .sort((a, b) => new Date(b.dateFrom).getTime() - new Date(a.dateFrom).getTime()),
    [bookings]
  );
  const pendingRows = useMemo(
    () =>
      [...bookings.filter((b) => b.paymentStatus === 'Pending' && b.balanceDue > 0)]
        .sort((a, b) => new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime()),
    [bookings]
  );
  const allBookingsRows = useMemo(
    () => [...bookings].sort((a, b) => new Date(b.dateFrom).getTime() - new Date(a.dateFrom).getTime()),
    [bookings]
  );

  const refDestCol: StatColumn<Booking> = {
    key: 'ref', label: 'REF', flex: 1.1, accessor: (b) => b.id, sortValue: (b) => b.id,
  };
  const destCol: StatColumn<Booking> = {
    key: 'destination', label: 'DESTINATION', flex: 1.6, accessor: (b) => b.destination, sortValue: (b) => b.destination,
  };
  const dateCol: StatColumn<Booking> = {
    key: 'date', label: 'DATE', flex: 1, accessor: (b) => formatShort(b.dateFrom), sortValue: (b) => b.dateFrom,
  };

  const statCards: StatCard[] = [
    {
      key: 'tours', label: 'Upcoming Tours', value: String(upcomingCount), icon: 'calendar',
      iconBg: '#FFF3E8', iconColor: C.amber,
      trend: upcomingCount > 0 ? 'Get ready!' : 'Book your first tour', trendPositive: true,
    },
    {
      key: 'bookings', label: 'Total Bookings', value: String(bookings.length), icon: 'clipboard',
      iconBg: '#E8F5E9', iconColor: C.success,
      trend: 'All-time', trendPositive: true,
    },
    {
      key: 'places', label: 'Places Visited', value: String(placesVisited), icon: 'pin',
      iconBg: '#EDE7F6', iconColor: '#9C27B0',
      trend: placesVisited > 0 ? 'Your journey so far' : 'Your journey begins!', trendPositive: true,
    },
    {
      key: 'payments', label: 'Pending Payments', value: money(pendingPayments), icon: 'card',
      iconBg: '#FCE4E1', iconColor: C.danger,
      trend: pendingPayments > 0 ? 'Awaiting payment' : 'All settled', trendPositive: pendingPayments === 0,
    },
  ];

  const sidebar = upcomingTrip ? (
    <>
      <UpcomingTripCard trip={upcomingTrip} onViewAll={() => onNavigate('bookings')} />
      <PhilippinesWeatherWidget />
      <WeatherWidget destination={upcomingTrip.destination} dateFrom={upcomingTrip.dateFrom} />
    </>
  ) : (
    <NoUpcomingTripCard onBrowse={() => onNavigate('tours')} />
  );

  const main = (
    <>
      <Section title="My Favorites" subtitle="Tours you've saved for later" onViewAll={() => onNavigate('tours')}>
        {favoriteTours.length === 0 ? (
          <Text style={sec.emptyText}>No favorites yet — tap the heart on a tour to save it here.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={fc.grid}>
            {favoriteTours.map((f) => (
              <FavoriteCard key={f.id} tour={f} onPress={() => onNavigate('tours')} onToggleFavorite={() => toggleFavorite(f.id)} />
            ))}
          </ScrollView>
        )}
      </Section>

      <Section title="Recommended Tours" subtitle="Handpicked for your next trip" onViewAll={() => onNavigate('tours')}>
        {recommended.length === 0 ? (
          <Text style={sec.emptyText}>No tours available right now — check back soon.</Text>
        ) : (
          recommended.map((t) => (
            <RecommendedRow key={t.id} tour={t} onBook={() => onNavigate('tours')} />
          ))
        )}
      </Section>
    </>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 96 }}>
        <DashboardHero name={name} />

        <View style={st.grid}>
          {statCards.map((c) => (
            <StatCardItem key={c.key} card={c} onPress={() => setActiveModal(c.key as typeof activeModal)} />
          ))}
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

      <StatDetailModal
        visible={activeModal === 'tours'}
        onClose={() => setActiveModal(null)}
        icon={<CalendarIcon color={C.amber} />}
        title="Upcoming Tours"
        subtitle="Your confirmed trips that haven't departed yet."
        rows={upcomingRows}
        columns={[refDestCol, destCol, dateCol]}
        keyAccessor={(b) => b.id}
        searchAccessor={(b) => `${b.id} ${b.destination}`}
        summaryAmount={(rows) => money(rows.reduce((sum, b) => sum + b.totalAmount, 0))}
        emptyText="No upcoming tours match your search."
        footerLabel="View My Bookings"
        onFooterPress={() => onNavigate('bookings')}
      />

      <StatDetailModal
        visible={activeModal === 'bookings'}
        onClose={() => setActiveModal(null)}
        icon={<ClipboardIcon color={C.success} />}
        title="Total Bookings"
        subtitle="Every trip you've booked with us — past, ongoing, and upcoming."
        rows={allBookingsRows}
        columns={[
          refDestCol, destCol, dateCol,
          { key: 'status', label: 'STATUS', flex: 1, accessor: (b) => b.status, sortValue: (b) => b.status },
        ]}
        keyAccessor={(b) => b.id}
        searchAccessor={(b) => `${b.id} ${b.destination} ${b.status}`}
        summaryAmount={(rows) => money(rows.reduce((sum, b) => sum + b.totalAmount, 0))}
        emptyText="No bookings match your search."
        footerLabel="View My Bookings"
        onFooterPress={() => onNavigate('bookings')}
        defaultSortKey="date"
        defaultSortDir="desc"
      />

      <StatDetailModal
        visible={activeModal === 'places'}
        onClose={() => setActiveModal(null)}
        icon={<PinIcon color="#9C27B0" />}
        title="Places Visited"
        subtitle="Destinations from your completed trips."
        rows={placesRows}
        columns={[
          destCol,
          { key: 'date', label: 'DATE VISITED', flex: 1, accessor: (b) => formatShort(b.dateFrom), sortValue: (b) => b.dateFrom },
        ]}
        keyAccessor={(b) => b.id}
        searchAccessor={(b) => b.destination}
        emptyText="No completed trips yet — your visited places will show up here."
        footerLabel="View My Bookings"
        onFooterPress={() => onNavigate('bookings')}
        defaultSortKey="date"
        defaultSortDir="desc"
      />

      <StatDetailModal
        visible={activeModal === 'payments'}
        onClose={() => setActiveModal(null)}
        icon={<CardIcon color={C.danger} />}
        title="Pending Payment"
        subtitle="Bookings with a balance still due."
        rows={pendingRows}
        columns={[
          refDestCol, destCol,
          { key: 'amountDue', label: 'AMOUNT DUE', flex: 1, accessor: (b) => money(b.balanceDue), sortValue: (b) => b.balanceDue },
          // No separate due-date field exists on bookings — balance is due before departure, so the trip's start date is the due date.
          { key: 'dueDate', label: 'DUE DATE', flex: 1, accessor: (b) => formatShort(b.dateFrom), sortValue: (b) => b.dateFrom },
        ]}
        keyAccessor={(b) => b.id}
        searchAccessor={(b) => `${b.id} ${b.destination}`}
        summaryAmount={(rows) => `${money(rows.reduce((sum, b) => sum + b.balanceDue, 0))} pending`}
        emptyText="Nothing pending — you're all settled up!"
        footerLabel="View My Bookings"
        onFooterPress={() => onNavigate('bookings')}
      />
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
    height: 90, backgroundColor: C.amber, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden',
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
    width: 44, height: 44, borderRadius: 10, flexShrink: 0, overflow: 'hidden',
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
    width: 52, height: 52, borderRadius: 12, flexShrink: 0, overflow: 'hidden',
    backgroundColor: C.amber, alignItems: 'center', justifyContent: 'center',
  },
  dest: { fontSize: 13, fontWeight: '900', color: C.brown, flexShrink: 1 },
  weatherChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#FFF3E8', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, flexShrink: 0,
  },
  weatherTemp: { fontSize: 10.5, fontWeight: '900', color: C.amber },
  weatherLabel: { fontSize: 9, color: C.brownMid, opacity: 0.8 },
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

