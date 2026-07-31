/**
 * ToursScreen.tsx
 * Client Tours tab — search bar, filters (sidebar on wide screens, a
 * bottom-sheet modal on phones), and a responsive tour grid. Tapping a card
 * opens TourDetailModal; "Book Now" jumps straight into BookingWizardModal.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Image,
  StyleSheet, Platform, useWindowDimensions, DimensionValue, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import Copyright from '@/components/Copyright';
import { C } from '../theme';
import ClientPageHero from '../ClientPageHero';
import { fetchTours, Tour, INCLUDE_OPTIONS, IncludeOption, SortOption, DepartureOption } from './mockData';
import TourDetailModal from './TourDetailModal';
import BookingWizardModal from './BookingWizardModal';
import { useFavorites } from './FavoritesContext';

const WIDE_BREAKPOINT = 900;
const PRICE_STOPS = [15000, 25000, 35000, 50000, Infinity];

/* ── Icons ── */
const PinIcon = ({ color = C.amber }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M12 21s7-7.58 7-12a7 7 0 10-14 0c0 4.42 7 12 7 12z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    <Circle cx={12} cy={9} r={2.4} stroke={color} strokeWidth={2} />
  </Svg>
);
const CalendarIcon = ({ color = C.amber }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M7 3v4M17 3v4M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const PersonIcon = ({ color = C.amber }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={8} r={3.4} stroke={color} strokeWidth={2} />
    <Path d="M5 20c0-3.6 3.1-6.5 7-6.5s7 2.9 7 6.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);
const SearchIcon = ({ color = '#FFFFFF' }: { color?: string }) => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Circle cx={11} cy={11} r={7} stroke={color} strokeWidth={2} />
    <Path d="M21 21l-4.3-4.3" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);
const HeartIcon = ({ filled }: { filled: boolean }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill={filled ? C.danger : 'none'}>
    <Path d="M12 21s-7.5-4.6-10.2-9.3C.3 8.7 1.9 5 5.6 5c2 0 3.4 1 4.4 2.4C11 6 12.4 5 14.4 5c3.7 0 5.3 3.7 3.8 6.7C19.5 16.4 12 21 12 21z" stroke={filled ? C.danger : C.brownMid} strokeWidth={1.8} />
  </Svg>
);
const StarIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="#F5A623">
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
  </Svg>
);
const CheckIcon = () => (
  <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
    <Path d="M4 12l6 6L20 6" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const FilterIcon = () => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Path d="M4 6h16M7 12h10M10 18h4" stroke={C.brown} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);
/** Generic travel-photo glyph — shown when a tour has no image, or its image fails to load. */
const PhotoFallbackIcon = ({ color = 'rgba(255,255,255,0.85)', size = 36 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 18l5-6 4 4.5 3-3.5 4 5H4z" fill={color} />
    <Circle cx={8} cy={7.5} r={2} fill={color} />
    <Path d="M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z" stroke={color} strokeWidth={1.6} />
  </Svg>
);

const money = (n: number) => `₱${n.toLocaleString('en-US')}`;

export type FilterState = {
  priceMax: number;
  ratingMin: number | null;
  sort:      SortOption;
  includes:  IncludeOption[];
};

const DEFAULT_FILTERS: FilterState = { priceMax: Infinity, ratingMin: null, sort: 'popular', includes: [] };

/* ── Price range (tap-to-select track, no drag gesture needed) ── */
function PriceRangeControl({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const idx = PRICE_STOPS.indexOf(value) === -1 ? PRICE_STOPS.length - 1 : PRICE_STOPS.indexOf(value);
  const pct = (idx / (PRICE_STOPS.length - 1)) * 100;
  return (
    <View>
      <View style={fl.trackWrap}>
        <View style={fl.track} />
        <View style={[fl.trackFill, { width: `${pct}%` }]} />
        <View style={[fl.thumb, { left: `${pct}%` }]} />
        <View style={fl.trackTapRow}>
          {PRICE_STOPS.map((stop, i) => (
            <TouchableOpacity key={i} style={{ flex: 1, height: 28 }} onPress={() => onChange(stop)} />
          ))}
        </View>
      </View>
      <View style={fl.trackLabels}>
        <Text style={fl.trackLabelText}>₱0</Text>
        <Text style={fl.trackLabelText}>₱50,000 +</Text>
      </View>
    </View>
  );
}

/* ── Filters panel content (shared by sidebar + sheet) ── */
function FiltersPanel({ filters, setFilters, onApply }: {
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  onApply?: () => void;
}) {
  const toggleRating = (r: number) => setFilters({ ...filters, ratingMin: filters.ratingMin === r ? null : r });
  const toggleInclude = (opt: IncludeOption) =>
    setFilters({
      ...filters,
      includes: filters.includes.includes(opt) ? filters.includes.filter((i) => i !== opt) : [...filters.includes, opt],
    });

  return (
    <View>
      <View style={fl.headerRow}>
        <Text style={fl.title}>Filters</Text>
        <TouchableOpacity onPress={() => setFilters(DEFAULT_FILTERS)}>
          <Text style={fl.clearAll}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <Text style={fl.sectionLabel}>PRICE RANGE</Text>
      <PriceRangeControl value={filters.priceMax} onChange={(v) => setFilters({ ...filters, priceMax: v })} />

      <Text style={fl.sectionLabel}>RATINGS</Text>
      <View style={fl.pillWrap}>
        {[4.5, 4.0, 3.0].map((r) => {
          const active = filters.ratingMin === r;
          return (
            <TouchableOpacity key={r} style={[fl.pill, active && fl.pillActive]} activeOpacity={0.8} onPress={() => toggleRating(r)}>
              <StarIcon />
              <Text style={[fl.pillText, active && fl.pillTextActive]}>{r.toFixed(1)} & up</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={fl.sectionLabel}>SORT</Text>
      <View style={fl.pillWrap}>
        {([
          ['popular', 'Most popular'], ['lowest', 'Lowest price'],
          ['highest', 'Highest rated'], ['newest', 'Newest'],
        ] as [SortOption, string][]).map(([key, label]) => {
          const active = filters.sort === key;
          return (
            <TouchableOpacity key={key} style={[fl.pill, active && fl.pillActive]} activeOpacity={0.8} onPress={() => setFilters({ ...filters, sort: key })}>
              <Text style={[fl.pillText, active && fl.pillTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={fl.sectionLabel}>INCLUDES</Text>
      <View style={{ gap: 10 }}>
        {INCLUDE_OPTIONS.map((opt) => {
          const checked = filters.includes.includes(opt);
          return (
            <TouchableOpacity key={opt} style={fl.checkRow} activeOpacity={0.75} onPress={() => toggleInclude(opt)}>
              <View style={[fl.checkbox, checked && fl.checkboxChecked]}>
                {checked && <CheckIcon />}
              </View>
              <Text style={fl.checkLabel}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={fl.applyBtn} activeOpacity={0.85} onPress={onApply}>
        <Text style={fl.applyBtnText}>Apply Filters</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ── Tour card ── */
function TourCard({ tour, favorited, onToggleFavorite, onViewDetails, onBookNow, width }: {
  tour: Tour;
  favorited: boolean;
  onToggleFavorite: () => void;
  onViewDetails: () => void;
  onBookNow: () => void;
  width: DimensionValue;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = !!tour.imageUrl && !imageFailed;

  return (
    <View style={[tc.card, { width }]}>
      <View style={tc.banner}>
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
        <TouchableOpacity style={tc.heart} activeOpacity={0.8} onPress={onToggleFavorite} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <HeartIcon filled={favorited} />
        </TouchableOpacity>
      </View>
      <View style={tc.body}>
        <View style={tc.titleRow}>
          <Text style={tc.dest} numberOfLines={1}>{tour.destination}</Text>
          {tour.isNew ? (
            <Text style={tc.newBadge}>★ New</Text>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <StarIcon />
              <Text style={tc.rating}>{tour.rating.toFixed(1)} ({tour.reviewCount})</Text>
            </View>
          )}
        </View>
        <Text style={tc.price}>from <Text style={tc.priceAmt}>{money(tour.pricePerPerson)}</Text> / person</Text>
        <View style={tc.btnRow}>
          <TouchableOpacity style={tc.detailsBtn} activeOpacity={0.85} onPress={onViewDetails}>
            <Text style={tc.detailsBtnText}>View Details</Text>
          </TouchableOpacity>
          <TouchableOpacity style={tc.bookBtn} activeOpacity={0.85} onPress={onBookNow}>
            <Text style={tc.bookBtnText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

/* ── Small popover for a search field ── */
function FieldPopover({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  if (!visible) return null;
  return <View style={sb.popover}>{children}</View>;
}

/* ── Travel-date range calendar ── */
const pad2 = (n: number) => String(n).padStart(2, '0');
const toISODate = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function buildMonthCells(year: number, month: number): (Date | null)[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function formatDateLabel(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function MonthGrid({
  year, month, today, rangeStart, rangeEnd, onSelectDay,
}: {
  year: number;
  month: number;
  today: Date;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  onSelectDay: (d: Date) => void;
}) {
  const cells = buildMonthCells(year, month);
  return (
    <View style={{ flex: 1 }}>
      <Text style={cal.monthTitle}>{MONTH_NAMES[month]} {year}</Text>
      <View style={cal.weekRow}>
        {WEEKDAY_LETTERS.map((w, i) => (
          <Text key={i} style={cal.weekLetter}>{w}</Text>
        ))}
      </View>
      <View style={cal.grid}>
        {cells.map((d, i) => {
          if (!d) return <View key={i} style={cal.cell} />;
          const isPast = d.getTime() < today.getTime();
          const isStart = rangeStart !== null && isSameDay(d, rangeStart);
          const isEnd = rangeEnd !== null && isSameDay(d, rangeEnd);
          const inRange = rangeStart !== null && rangeEnd !== null && d.getTime() > rangeStart.getTime() && d.getTime() < rangeEnd.getTime();
          return (
            <View key={i} style={cal.cell}>
              {inRange && <View style={cal.rangeFill} pointerEvents="none" />}
              <TouchableOpacity
                disabled={isPast}
                activeOpacity={0.7}
                onPress={() => onSelectDay(d)}
                style={[cal.dayBtn, (isStart || isEnd) && cal.dayBtnActive]}
              >
                <Text style={[cal.dayText, isPast && cal.dayTextPast, (isStart || isEnd) && cal.dayTextActive]}>
                  {d.getDate()}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function TravelDateCalendarModal({
  visible, onClose, initialStart, initialEnd, onApply,
}: {
  visible: boolean;
  onClose: () => void;
  initialStart: string | null;
  initialEnd: string | null;
  onApply: (start: string | null, end: string | null) => void;
}) {
  const today = dayStart(new Date());
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [rangeStart, setRangeStart] = useState<Date | null>(initialStart ? dayStart(new Date(`${initialStart}T00:00:00`)) : null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(initialEnd ? dayStart(new Date(`${initialEnd}T00:00:00`)) : null);

  useEffect(() => {
    if (!visible) return;
    setRangeStart(initialStart ? dayStart(new Date(`${initialStart}T00:00:00`)) : null);
    setRangeEnd(initialEnd ? dayStart(new Date(`${initialEnd}T00:00:00`)) : null);
    const base = initialStart ? dayStart(new Date(`${initialStart}T00:00:00`)) : today;
    setCursor(new Date(base.getFullYear(), base.getMonth(), 1));
  }, [visible]);

  if (!visible) return null;

  const handleSelectDay = (d: Date) => {
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(d);
      setRangeEnd(null);
    } else if (d.getTime() < rangeStart.getTime()) {
      setRangeStart(d);
      setRangeEnd(null);
    } else if (d.getTime() === rangeStart.getTime()) {
      setRangeStart(null);
      setRangeEnd(null);
    } else {
      setRangeEnd(d);
    }
  };

  const nextMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={cal.overlay}>
        <View style={cal.card}>
          <View style={cal.headerRow}>
            <Text style={cal.headerTitle}>Select Travel Dates</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={cal.closeX}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={cal.navRow}>
            <TouchableOpacity
              style={cal.navBtn}
              onPress={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={cal.navBtnText}>‹</Text>
            </TouchableOpacity>
            <Text style={cal.navRangeText}>
              {MONTH_NAMES[cursor.getMonth()]} – {MONTH_NAMES[nextMonth.getMonth()]} {nextMonth.getFullYear()}
            </Text>
            <TouchableOpacity
              style={cal.navBtn}
              onPress={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={cal.navBtnText}>›</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={cal.monthsRow} showsVerticalScrollIndicator={false}>
            <MonthGrid
              year={cursor.getFullYear()} month={cursor.getMonth()} today={today}
              rangeStart={rangeStart} rangeEnd={rangeEnd} onSelectDay={handleSelectDay}
            />
            <MonthGrid
              year={nextMonth.getFullYear()} month={nextMonth.getMonth()} today={today}
              rangeStart={rangeStart} rangeEnd={rangeEnd} onSelectDay={handleSelectDay}
            />
          </ScrollView>

          <Text style={cal.helperText}>
            You can search with just a start date, or a start date with an end date — either works.
          </Text>

          <View style={cal.footerRow}>
            <TouchableOpacity onPress={() => { setRangeStart(null); setRangeEnd(null); }}>
              <Text style={cal.clearText}>Clear dates</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={cal.applyBtn}
              activeOpacity={0.85}
              onPress={() => { onApply(rangeStart ? toISODate(rangeStart) : null, rangeEnd ? toISODate(rangeEnd) : null); onClose(); }}
            >
              <Text style={cal.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

type Props = { initialSearch?: string };

export default function ToursScreen({ initialSearch }: Props) {
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState(initialSearch ?? '');
  const [appliedSearch, setAppliedSearch] = useState(initialSearch ?? '');
  const [dateStart, setDateStart] = useState<string | null>(null);
  const [dateEnd, setDateEnd] = useState<string | null>(null);
  const [appliedDateStart, setAppliedDateStart] = useState<string | null>(null);
  const [appliedDateEnd, setAppliedDateEnd] = useState<string | null>(null);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [travelers, setTravelers] = useState(1);
  const [travelersOpen, setTravelersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const { favoriteIds, toggleFavorite } = useFavorites();

  const [detailTour, setDetailTour] = useState<Tour | null>(null);
  const [bookingTour, setBookingTour] = useState<Tour | null>(null);
  const [bookingPrefill, setBookingPrefill] = useState<{ departure: DepartureOption; travelers: number } | null>(null);

  const [tours, setTours] = useState<Tour[]>([]);
  const [toursLoading, setToursLoading] = useState(true);
  const [toursError, setToursError] = useState('');

  const loadTours = () => {
    setToursLoading(true);
    setToursError('');
    fetchTours()
      .then(setTours)
      .catch(() => setToursError("Can't connect to the server. Please check if XAMPP is running."))
      .finally(() => setToursLoading(false));
  };

  useEffect(() => { loadTours(); }, []);

  const results = useMemo(() => {
    const rangeStart = appliedDateStart ? new Date(`${appliedDateStart}T00:00:00`) : null;
    const rangeEnd = appliedDateEnd ? new Date(`${appliedDateEnd}T23:59:59`) : null;

    const dateMatches = (t: Tour) => {
      if (!rangeStart) return true;
      return t.departures.some((d) => {
        const depStart = new Date(d.startISO);
        const depEnd = new Date(d.endISO);
        if (rangeEnd) {
          // Start + end selected: any departure overlapping the searched range counts as available within it.
          return depStart.getTime() <= rangeEnd.getTime() && depEnd.getTime() >= rangeStart.getTime();
        }
        // Start date only: available on or after that date.
        return depEnd.getTime() >= rangeStart.getTime();
      });
    };

    let list = tours.filter((t) => {
      if (appliedSearch.trim() && !t.destination.toLowerCase().includes(appliedSearch.trim().toLowerCase())) return false;
      if (t.pricePerPerson > filters.priceMax) return false;
      if (filters.ratingMin !== null && t.rating < filters.ratingMin) return false;
      if (filters.includes.some((opt) => !t.includes.includes(opt))) return false;
      if (!dateMatches(t)) return false;
      return true;
    });
    switch (filters.sort) {
      case 'lowest':  list = [...list].sort((a, b) => a.pricePerPerson - b.pricePerPerson); break;
      case 'highest': list = [...list].sort((a, b) => b.rating - a.rating); break;
      case 'newest':  list = [...list].sort((a, b) => Number(b.isNew) - Number(a.isNew)); break;
      default:        list = [...list].sort((a, b) => b.reviewCount - a.reviewCount);
    }
    return list;
  }, [appliedSearch, appliedDateStart, appliedDateEnd, tours, filters]);

  const runSearch = () => {
    setAppliedSearch(search);
    setAppliedDateStart(dateStart);
    setAppliedDateEnd(dateEnd);
  };

  const dateFieldLabel = dateStart
    ? dateEnd
      ? `${formatDateLabel(dateStart)} – ${formatDateLabel(dateEnd)}`
      : `${formatDateLabel(dateStart)} onward`
    : 'Any dates';

  const columns = isWide ? (width >= 1200 ? 3 : 2) : (width >= 620 ? 2 : 1);
  const cardWidth = columns === 1 ? '100%' : columns === 2 ? '48.5%' : '32%';

  const openBooking = (tour: Tour, departure?: DepartureOption, travelerCount?: number) => {
    const chosen = departure ?? tour.departures[0];
    if (!chosen) return; // no upcoming departures to book
    setBookingPrefill({ departure: chosen, travelers: travelerCount ?? travelers });
    setBookingTour(tour);
  };

  const filtersPanel = (
    <FiltersPanel filters={filters} setFilters={setFilters} onApply={() => setFilterSheetVisible(false)} />
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }} keyboardShouldPersistTaps="handled">
        <ClientPageHero
          icon="🗺️"
          title="Where do you want to go?"
          subtitle="Find unforgettable tours, experiences, and destinations."
        />

        <View style={sb.wrap}>
          <View style={sb.field}>
            <Text style={sb.fieldLabel}>WHERE TO?</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <PinIcon />
              <TextInput
                style={sb.fieldInput}
                placeholder="Search destination"
                placeholderTextColor={C.brownMid + '80'}
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>

          <TouchableOpacity
            style={sb.field}
            activeOpacity={0.8}
            onPress={() => { setCalendarVisible(true); setTravelersOpen(false); }}
          >
            <Text style={sb.fieldLabel}>TRAVEL DATE</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <CalendarIcon />
              <Text style={sb.fieldValue} numberOfLines={1}>{dateFieldLabel}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={sb.field}
            activeOpacity={0.8}
            onPress={() => setTravelersOpen((v) => !v)}
          >
            <Text style={sb.fieldLabel}>TRAVELERS</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <PersonIcon />
              <Text style={sb.fieldValue}>{travelers} {travelers === 1 ? 'Adult' : 'Adults'}</Text>
            </View>
            <FieldPopover visible={travelersOpen}>
              <View style={sb.stepperRow}>
                <TouchableOpacity style={sb.stepperBtn} onPress={() => setTravelers((n) => Math.max(1, n - 1))}>
                  <Text style={sb.stepperBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={sb.stepperValue}>{travelers}</Text>
                <TouchableOpacity style={sb.stepperBtn} onPress={() => setTravelers((n) => Math.min(10, n + 1))}>
                  <Text style={sb.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </FieldPopover>
          </TouchableOpacity>

          <TouchableOpacity style={sb.searchBtn} activeOpacity={0.85} onPress={() => { runSearch(); setTravelersOpen(false); }}>
            <SearchIcon />
            <Text style={sb.searchBtnText}>Search Tours</Text>
          </TouchableOpacity>
        </View>

        {!isWide && (
          <TouchableOpacity style={mf.btn} activeOpacity={0.8} onPress={() => setFilterSheetVisible(true)}>
            <FilterIcon />
            <Text style={mf.btnText}>Filters</Text>
            {(filters.ratingMin !== null || filters.includes.length > 0 || filters.priceMax !== Infinity || filters.sort !== 'popular') && (
              <View style={mf.dot} />
            )}
          </TouchableOpacity>
        )}

        <View style={{ flexDirection: isWide ? 'row' : 'column', alignItems: 'flex-start', paddingHorizontal: 16, gap: 16, marginTop: 12 }}>
          {isWide && (
            <View style={ly.sidebar}>
              {filtersPanel}
            </View>
          )}

          <View style={{ flex: 1, minWidth: 0, width: '100%' }}>
            {toursLoading ? (
              <View style={ly.emptyWrap}>
                <ActivityIndicator color={C.amber} />
              </View>
            ) : toursError ? (
              <View style={ly.emptyWrap}>
                <Text style={{ fontSize: 34 }}>⚠️</Text>
                <Text style={ly.emptyTitle}>{toursError}</Text>
                <TouchableOpacity onPress={loadTours}><Text style={[ly.emptyText, { color: C.amber, fontWeight: '800' }]}>Tap to retry</Text></TouchableOpacity>
              </View>
            ) : results.length === 0 ? (
              <View style={ly.emptyWrap}>
                <Text style={{ fontSize: 34 }}>🧭</Text>
                <Text style={ly.emptyTitle}>No tours match your filters</Text>
                <Text style={ly.emptyText}>Try clearing some filters or searching a different destination.</Text>
              </View>
            ) : (
              <View style={ly.grid}>
                {results.map((t) => (
                  <TourCard
                    key={t.id}
                    tour={t}
                    width={cardWidth}
                    favorited={favoriteIds.has(t.id)}
                    onToggleFavorite={() => toggleFavorite(t.id)}
                    onViewDetails={() => setDetailTour(t)}
                    onBookNow={() => openBooking(t)}
                  />
                ))}
              </View>
            )}
          </View>
        </View>

        <Copyright />
      </ScrollView>

      <Modal visible={filterSheetVisible} transparent animationType="slide" onRequestClose={() => setFilterSheetVisible(false)}>
        <View style={sheet.overlay}>
          <View style={[sheet.card, { paddingBottom: insets.bottom }]}>
            <View style={sheet.handle} />
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {filtersPanel}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <TourDetailModal
        tour={detailTour}
        visible={!!detailTour}
        onClose={() => setDetailTour(null)}
        onBook={(departure, travelerCount) => {
          if (!detailTour) return;
          setDetailTour(null);
          openBooking(detailTour, departure, travelerCount);
        }}
      />

      <BookingWizardModal
        tour={bookingTour}
        prefill={bookingPrefill}
        visible={!!bookingTour}
        onClose={() => setBookingTour(null)}
      />

      <TravelDateCalendarModal
        visible={calendarVisible}
        onClose={() => setCalendarVisible(false)}
        initialStart={dateStart}
        initialEnd={dateEnd}
        onApply={(start, end) => { setDateStart(start); setDateEnd(end); }}
      />
    </View>
  );
}

/* ── Styles ── */
const sb = StyleSheet.create({
  wrap: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    marginHorizontal: 16, marginTop: 8, backgroundColor: C.cardBg,
    borderRadius: 14, borderWidth: 1, borderColor: C.divider, padding: 10,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 1 },
    }),
  },
  field: { flexGrow: 1, flexBasis: 150, position: 'relative', paddingHorizontal: 4, paddingVertical: 2 },
  fieldLabel: { fontSize: 9, fontWeight: '800', color: C.brownMid, opacity: 0.7, letterSpacing: 0.4, marginBottom: 3 },
  fieldInput: { flex: 1, fontSize: 12.5, color: C.brown, padding: 0 },
  fieldValue: { fontSize: 12.5, color: C.brown, fontWeight: '700' },

  popover: {
    position: 'absolute', top: 46, left: 0, zIndex: 20,
    backgroundColor: C.cardBg, borderRadius: 12, borderWidth: 1, borderColor: C.divider,
    paddingVertical: 6, minWidth: 160,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 8 },
    }),
  },
  popoverItem: { paddingHorizontal: 14, paddingVertical: 9 },
  popoverItemText: { fontSize: 12, fontWeight: '600', color: C.brown },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 6, gap: 14 },
  stepperBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.lightBg, borderWidth: 1, borderColor: C.divider, alignItems: 'center', justifyContent: 'center' },
  stepperBtnText: { fontSize: 15, fontWeight: '900', color: C.brown },
  stepperValue: { fontSize: 13, fontWeight: '800', color: C.brown },

  searchBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.brown, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 12,
    flexGrow: 1, flexBasis: 140,
  },
  searchBtnText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
});

const cal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(59,26,12,0.45)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: {
    width: '100%', maxWidth: 460, maxHeight: '86%',
    backgroundColor: C.cardBg, borderRadius: 18, padding: 18,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 8 },
    }),
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 15, fontWeight: '900', color: C.brown },
  closeX: { fontSize: 16, fontWeight: '800', color: C.brownMid },

  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  navBtn: {
    width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.lightBg, borderWidth: 1, borderColor: C.divider,
  },
  navBtnText: { fontSize: 16, fontWeight: '900', color: C.brown, marginTop: -2 },
  navRangeText: { fontSize: 12, fontWeight: '800', color: C.brown },

  monthsRow: { flexDirection: 'row', gap: 14, marginTop: 12 },

  monthTitle: { fontSize: 11.5, fontWeight: '800', color: C.brown, textAlign: 'center', marginBottom: 6 },
  weekRow: { flexDirection: 'row' },
  weekLetter: { flex: 1, textAlign: 'center', fontSize: 9.5, fontWeight: '800', color: C.brownMid, opacity: 0.6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  rangeFill: { position: 'absolute', left: 0, right: 0, top: '12%', bottom: '12%', backgroundColor: C.amber + '26' },
  dayBtn: { width: '80%', aspectRatio: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  dayBtnActive: { backgroundColor: C.amber },
  dayText: { fontSize: 10.5, fontWeight: '600', color: C.brown },
  dayTextPast: { color: C.brownMid, opacity: 0.32 },
  dayTextActive: { color: '#FFFFFF', fontWeight: '800' },

  helperText: { fontSize: 10.5, color: C.brownMid, opacity: 0.75, lineHeight: 14, textAlign: 'center', marginTop: 14 },

  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  clearText: { fontSize: 12, fontWeight: '800', color: C.amber },
  applyBtn: { backgroundColor: C.brown, borderRadius: 12, paddingHorizontal: 26, paddingVertical: 11 },
  applyBtnText: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' },
});

const mf = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', marginHorizontal: 16, marginTop: 12,
    backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.divider,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9,
  },
  btnText: { fontSize: 12, fontWeight: '800', color: C.brown },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.danger },
});

const ly = StyleSheet.create({
  sidebar: { width: 260, flexShrink: 0 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: '3%', rowGap: 16 },
  emptyWrap: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 14, fontWeight: '900', color: C.brown },
  emptyText: { fontSize: 12, color: C.brownMid, textAlign: 'center', maxWidth: 260 },
});

const fl = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 15, fontWeight: '900', color: C.brown },
  clearAll: { fontSize: 11.5, fontWeight: '700', color: C.amber },
  sectionLabel: { fontSize: 10.5, fontWeight: '800', color: C.brown, letterSpacing: 0.5, marginTop: 18, marginBottom: 10 },

  trackWrap: { height: 28, justifyContent: 'center', position: 'relative' },
  track: { height: 4, borderRadius: 2, backgroundColor: C.divider },
  trackFill: { position: 'absolute', height: 4, borderRadius: 2, backgroundColor: C.amber },
  thumb: {
    position: 'absolute', width: 16, height: 16, borderRadius: 8, backgroundColor: C.brown,
    marginLeft: -8, borderWidth: 2, borderColor: '#FFFFFF',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
      android: { elevation: 2 },
    }),
  },
  trackTapRow: { position: 'absolute', left: 0, right: 0, flexDirection: 'row' },
  trackLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  trackLabelText: { fontSize: 10, color: C.brownMid, opacity: 0.7 },

  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.lightBg, borderWidth: 1, borderColor: C.divider,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
  },
  pillActive: { backgroundColor: C.brown, borderColor: C.brown },
  pillText: { fontSize: 11, fontWeight: '700', color: C.brown },
  pillTextActive: { color: '#FFFFFF' },

  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: C.divider, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: C.amber, borderColor: C.amber },
  checkLabel: { fontSize: 12.5, color: C.brown, fontWeight: '600' },

  applyBtn: { backgroundColor: C.brown, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 20 },
  applyBtnText: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 },
});

const tc = StyleSheet.create({
  card: {
    borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: C.divider, backgroundColor: C.cardBg,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1 },
    }),
  },
  banner: { width: '100%', aspectRatio: 16 / 9, backgroundColor: C.brown, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  heart: {
    position: 'absolute', top: 10, right: 10,
    width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
  },
  body: { padding: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  dest: { fontSize: 14, fontWeight: '900', color: C.brown, flexShrink: 1 },
  rating: { fontSize: 11, fontWeight: '700', color: C.brownMid },
  newBadge: { fontSize: 10.5, fontWeight: '800', color: C.amber },
  price: { fontSize: 11.5, color: C.brownMid, marginTop: 8 },
  priceAmt: { fontWeight: '900', color: C.amber },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  detailsBtn: { flex: 1, borderWidth: 1, borderColor: C.divider, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  detailsBtnText: { fontSize: 11, fontWeight: '800', color: C.brown },
  bookBtn: { flex: 1, backgroundColor: C.brown, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  bookBtnText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
});

const sheet = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(59,26,12,0.4)', justifyContent: 'flex-end' },
  card: { backgroundColor: C.cardBg, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '85%', paddingTop: 10 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.divider, alignSelf: 'center', marginBottom: 4 },
});
