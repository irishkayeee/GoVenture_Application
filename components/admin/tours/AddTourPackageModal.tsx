/**
 * AddTourPackageModal.tsx
 * 5-step "Add New Tour Package" wizard: Tour Details, Pricing & Availability,
 * Itinerary, Inclusions & Exclusions, and a final Summary. "Publish Tour" and
 * "Save as Draft" POST the full form to the backend (tour_create).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform, KeyboardAvoidingView, ActivityIndicator, Dimensions, Image, Alert, Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { C as LIGHT_C } from '../dashboard/theme';
import { useAppTheme, ColorPalette } from '../ThemeContext';
import { TOUR_PACKAGES, TourType, TOUR_TYPE_TABS, formatPeso } from './mockData';
import { TOUR_CREATE_API_URL } from '@/constants/api';

const TOUR_TYPE_OPTIONS = TOUR_TYPE_TABS.filter((t) => t.value !== '') as { value: TourType; label: string }[];

/* ════════════════════════════════════════
   TYPES
════════════════════════════════════════ */
type MealsFlags = { breakfast: boolean; lunch: boolean; dinner: boolean };

type ItineraryDay = {
  id:             string;
  photoUri:       string | null;
  photoBase64:    string | null;
  photoMimeType:  string | null;
  location:       string;
  description:    string;
  meals:          MealsFlags;
  accommodation:  string;
};

type AdditionalCharge = { id: string; label: string; amount: string };

// One departure batch: an explicit start/end date range with its own slot
// count and per-person pricing — different batches (e.g. peak vs regular
// season) can run on different dates and charge different prices.
type DateBatch = {
  id:           string;
  startDate:    string;
  endDate:      string;
  slots:        string;
  adultPrice:   string;
  childPrice:   string;
  additionalPrice: string;
  downpayment:  string;
  available:    boolean;
};

type TourFormState = {
  coverImageUri:       string | null;
  coverImageBase64:    string | null;
  coverImageMimeType:  string | null;
  destination:        string;
  airline:            string;
  cruiseLine:         string;
  tourName:           string;
  duration:           string;
  durationDays:       string;
  durationNights:     string;
  status:              'Active' | 'Draft' | 'Inactive';
  shortDescription:   string;
  tourCode:           string;
  tourType:           TourType;
  additionalCharges:  AdditionalCharge[];
  dateBatches:        DateBatch[];
  itineraryDays:      ItineraryDay[];
  activeDayId:        string;
  inclusions:         string[];
  exclusions:         string[];
};

type StepProps = { form: TourFormState; update: (patch: Partial<TourFormState>) => void };

const STEP_LABELS = ['Tour Details', 'Pricing & Availability', 'Itinerary', 'Inclusions & Exclusions', 'Summary'];
const STEP_LABELS_SHORT = ['Details', 'Pricing', 'Itinerary', 'Inclusions', 'Summary'];
const DESTINATION_OPTIONS = TOUR_PACKAGES.map((p) => p.destination);
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAY_LABELS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function generateTourCode(): string {
  return `TRK-${Math.floor(100000 + Math.random() * 900000)}`;
}

function createInitialForm(): TourFormState {
  const day1: ItineraryDay = {
    id: 'day1', photoUri: null, photoBase64: null, photoMimeType: null, location: '',
    description: '', meals: { breakfast: false, lunch: false, dinner: false }, accommodation: '',
  };
  return {
    coverImageUri: null, coverImageBase64: null, coverImageMimeType: null,
    destination: '', airline: '', cruiseLine: '', tourName: '', duration: '', durationDays: '', durationNights: '', status: 'Active',
    shortDescription: '', tourCode: generateTourCode(), tourType: TOUR_TYPE_OPTIONS[0].value,
    additionalCharges: [], dateBatches: [],
    itineraryDays: [day1], activeDayId: day1.id,
    inclusions: [], exclusions: [],
  };
}

type PickedImage = { uri: string; base64: string | null; mimeType: string };

async function pickImageAsset(aspect: [number, number]): Promise<PickedImage | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Permission needed', 'Allow photo library access to set a photo.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect,
    quality: 0.6,
    base64: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, base64: asset.base64 ?? null, mimeType: asset.mimeType ?? 'image/jpeg' };
}

async function pickCoverImage(update: (patch: Partial<TourFormState>) => void) {
  const img = await pickImageAsset([16, 9]);
  if (!img) return;
  update({ coverImageUri: img.uri, coverImageBase64: img.base64, coverImageMimeType: img.mimeType });
}

async function pickDayPhoto(dayId: string, updateDay: (id: string, patch: Partial<ItineraryDay>) => void) {
  const img = await pickImageAsset([1, 1]);
  if (!img) return;
  updateDay(dayId, { photoUri: img.uri, photoBase64: img.base64, photoMimeType: img.mimeType });
}

function formatDateRangeLabel(startIso: string, endIso: string): string {
  if (!endIso || endIso === startIso) return formatShortDate(startIso, true);
  const sameYear = startIso.slice(0, 4) === endIso.slice(0, 4);
  return `${formatShortDate(startIso, !sameYear)} – ${formatShortDate(endIso, true)}`;
}

// Builds the "5 Days / 4 Nights" display label from the two numeric
// Days/Nights fields, so date ranges can auto-follow the tour's duration
// without parsing free-typed text (e.g. a 5-day tour starting Jul 20 ends Jul 25).
function formatDuration(days: string, nights: string): string {
  const d = parseInt(days, 10) || 0;
  const n = parseInt(nights, 10) || 0;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d} Day${d === 1 ? '' : 's'}`);
  if (n > 0) parts.push(`${n} Night${n === 1 ? '' : 's'}`);
  return parts.join(' / ');
}
function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return isoOf(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

/* ── Date helpers (Asia/Manila) ── */
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
function formatShortDate(iso: string, withYear = false): string {
  const [y, m, d] = iso.split('-').map(Number);
  const base = `${MONTH_NAMES[m - 1].slice(0, 3)} ${d}`;
  return withYear ? `${base}, ${y}` : base;
}

/* ════════════════════════════════════════
   ICONS
════════════════════════════════════════ */
const BackIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M15 19l-7-7 7-7" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const ChevronDownIcon = ({ color = LIGHT_C.brownMid }: { color?: string }) => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const ChevronLeftIcon = ({ color = LIGHT_C.brownMid }: { color?: string }) => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
    <Path d="M15 19l-7-7 7-7" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const ChevronRightIcon = ({ color = LIGHT_C.brownMid }: { color?: string }) => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
    <Path d="M9 5l7 7-7 7" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const PlusIcon = ({ color = '#FFFFFF' }: { color?: string }) => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
  </Svg>
);
const TrashIcon = ({ color = LIGHT_C.danger }: { color?: string }) => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6h16z" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const CheckIcon = ({ size = 14, color = LIGHT_C.amber }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const CameraIcon = ({ size = 20, color = LIGHT_C.brownMid }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 8h3l2-2h6l2 2h3a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
    <Path d="M12 17a4 4 0 100-8 4 4 0 000 8z" stroke={color} strokeWidth={1.7} />
  </Svg>
);
const CalendarIcon = ({ size = 16, color = LIGHT_C.brownMid }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M7 2v3M17 2v3M3.5 9h17M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const PencilIcon = ({ size = 15, color = LIGHT_C.amber }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const XIcon = ({ size = 13, color = LIGHT_C.brownMid }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
  </Svg>
);
const DraftDocIcon = ({ size = 14, color = '#12946F' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M7 3h7l4 4v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
    <Path d="M14 3v4h4" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
  </Svg>
);
const DotsIcon = ({ size = 16, color = LIGHT_C.brown }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 6a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM12 13.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM12 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill={color} />
  </Svg>
);
const MapPinIcon = ({ size = 16, color = LIGHT_C.amber }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 21s-7-6.4-7-11.5A7 7 0 0119 9.5C19 14.6 12 21 12 21z" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
    <Path d="M12 11.5a2 2 0 100-4 2 2 0 000 4z" stroke={color} strokeWidth={1.7} />
  </Svg>
);
const ForkKnifeIcon = ({ size = 16, color = LIGHT_C.amber }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M7 2v7a2 2 0 002 2v11M7 2v7M9 2v7M5 2v7" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M17 2c-1.5 0-2.5 2-2.5 5s1 5 2.5 5v10" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const BuildingIcon = ({ size = 16, color = LIGHT_C.amber }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 21V5a1 1 0 011-1h9a1 1 0 011 1v16M15 21h5v-9a1 1 0 00-1-1h-4" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
    <Path d="M7.5 8h1M11.5 8h1M7.5 12h1M11.5 12h1M7.5 16h1M11.5 16h1" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
  </Svg>
);
const StarIcon = ({ size = 16, color = LIGHT_C.amber }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2.5l2.9 6.1 6.6.7-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.1 1.3-6.6-4.9-4.6 6.6-.7L12 2.5z" fill={color} />
  </Svg>
);
const PlaneWatermarkIcon = () => (
  <Svg width={44} height={44} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2.5 1.8V22l3.5-1 3.5 1v-1.2L12 19v-5.5l9 2.5z"
      fill="rgba(255,255,255,0.4)"
    />
  </Svg>
);

/* ════════════════════════════════════════
   SHARED FIELD PIECES
════════════════════════════════════════ */
const FieldLabel = ({ children }: { children: React.ReactNode }) => {
  const { C } = useAppTheme();
  const aw = useMemo(() => makeStyles(C), [C]);
  return <Text style={aw.fieldLabel}>{children}</Text>;
};

const SummaryLine = ({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) => {
  const { C } = useAppTheme();
  const aw = useMemo(() => makeStyles(C), [C]);
  return (
    <View style={aw.summaryLineRow}>
      <Text style={aw.summaryLineLabel}>{label}</Text>
      <Text style={[aw.summaryLineValue, bold && { fontWeight: '900' as const }, color && { color }]}>{value}</Text>
    </View>
  );
};

/* ════════════════════════════════════════
   MINI CALENDAR (multi-select availability)
════════════════════════════════════════ */
const MiniCalendar = ({
  selectedDates, onToggleDate, disablePast = false,
}: {
  selectedDates: string[]; onToggleDate: (iso: string) => void; disablePast?: boolean;
}) => {
  const { C } = useAppTheme();
  const aw = useMemo(() => makeStyles(C), [C]);
  const todayISO = useMemo(getManilaTodayISO, []);
  const [todayY, todayM] = todayISO.split('-').map(Number);
  const [cursorYear, setCursorYear] = useState(todayY);
  const [cursorMonth, setCursorMonth] = useState(todayM - 1);
  const grid = useMemo(() => buildMonthGrid(cursorYear, cursorMonth), [cursorYear, cursorMonth]);
  const selectedSet = useMemo(() => new Set(selectedDates), [selectedDates]);

  const goPrev = () => { if (cursorMonth === 0) { setCursorMonth(11); setCursorYear((y) => y - 1); } else setCursorMonth((m) => m - 1); };
  const goNext = () => { if (cursorMonth === 11) { setCursorMonth(0); setCursorYear((y) => y + 1); } else setCursorMonth((m) => m + 1); };
  const goToday = () => { setCursorYear(todayY); setCursorMonth(todayM - 1); };

  return (
    <View>
      <View style={aw.calNavRow}>
        <TouchableOpacity style={aw.calNavBtn} activeOpacity={0.8} onPress={goPrev}><ChevronLeftIcon /></TouchableOpacity>
        <TouchableOpacity style={aw.calNavBtn} activeOpacity={0.8} onPress={goNext}><ChevronRightIcon /></TouchableOpacity>
        <TouchableOpacity style={aw.calTodayBtn} activeOpacity={0.85} onPress={goToday}>
          <Text style={aw.calTodayText}>Today</Text>
        </TouchableOpacity>
        <Text style={aw.calMonthTitle} numberOfLines={1}>{MONTH_NAMES[cursorMonth]} {cursorYear}</Text>
      </View>

      <View style={aw.calWeekdayRow}>
        {WEEKDAY_LABELS.map((w) => (
          <View key={w} style={aw.calWeekdayCell}><Text style={aw.calWeekdayText}>{w}</Text></View>
        ))}
      </View>

      <View style={aw.calGrid}>
        {grid.map((cell) => {
          const isSelected = selectedSet.has(cell.iso);
          const isToday = cell.iso === todayISO;
          const isPast = disablePast && cell.iso < todayISO;
          const isDisabled = !cell.inMonth || isPast;
          return (
            <TouchableOpacity
              key={cell.iso}
              style={aw.calDayCell}
              activeOpacity={isDisabled ? 1 : 0.7}
              disabled={isDisabled}
              onPress={() => onToggleDate(cell.iso)}
            >
              <View style={[aw.calDayNumWrap, isSelected && aw.calDayNumSelected, isToday && !isSelected && aw.calDayNumToday]}>
                <Text style={[aw.calDayNumText, (!cell.inMonth || isPast) && aw.calDayNumTextDim, isSelected && aw.calDayNumTextSelected]}>{cell.day}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={aw.calLegendRow}>
        <View style={aw.calLegendItem}><View style={[aw.calLegendDot, { backgroundColor: C.amber }]} /><Text style={aw.calLegendText}>Selected</Text></View>
        <View style={aw.calLegendItem}><View style={[aw.calLegendDot, { backgroundColor: C.divider }]} /><Text style={aw.calLegendText}>Available</Text></View>
      </View>
    </View>
  );
};

/* ════════════════════════════════════════
   STEP 1 — TOUR DETAILS
════════════════════════════════════════ */
const Step1TourDetails = ({ form, update }: StepProps) => {
  const { C } = useAppTheme();
  const aw = useMemo(() => makeStyles(C), [C]);
  const [openPicker, setOpenPicker] = useState<'destination' | 'status' | 'tourType' | null>(null);
  const [nightsExceeded, setNightsExceeded] = useState(false);

  return (
    <View style={{ gap: 14 }}>
      <View style={[aw.card, !!openPicker && aw.cardElevated]}>
        <Text style={aw.cardTitle}>Basic Information</Text>
        <Text style={aw.cardSub}>Provide the basic details about your tour package.</Text>

        <FieldLabel>Tour Cover Photo</FieldLabel>
        <TouchableOpacity style={aw.coverPhotoBox} activeOpacity={0.85} onPress={() => pickCoverImage(update)}>
          {form.coverImageUri ? (
            <>
              <Image source={{ uri: form.coverImageUri }} style={aw.coverPhotoImage} />
              <View style={aw.coverPhotoOverlay}>
                <CameraIcon size={16} color="#FFFFFF" />
                <Text style={aw.coverPhotoOverlayText}>Change Photo</Text>
              </View>
              <TouchableOpacity
                style={aw.coverPhotoRemoveBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => update({ coverImageUri: null, coverImageBase64: null, coverImageMimeType: null })}
              >
                <TrashIcon color="#FFFFFF" />
              </TouchableOpacity>
            </>
          ) : (
            <View style={aw.coverPhotoEmpty}>
              <CameraIcon />
              <Text style={aw.coverPhotoEmptyText}>Add Cover Photo</Text>
              <Text style={aw.coverPhotoEmptyHint}>Recommended 16:9 · JPG or PNG</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={aw.row2}>
          <View style={{ flex: 1 }}>
            <FieldLabel>Tour Code</FieldLabel>
            <View style={[aw.input, aw.inputDisabled]}>
              <Text style={aw.disabledText}>{form.tourCode}</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <FieldLabel>Tour Type</FieldLabel>
            <View style={[aw.dropdownAnchor, openPicker === 'tourType' && { zIndex: 30 }]}>
              <TouchableOpacity
                style={aw.selectBox}
                activeOpacity={0.8}
                onPress={() => setOpenPicker(openPicker === 'tourType' ? null : 'tourType')}
              >
                <Text style={aw.selectText} numberOfLines={1}>
                  {TOUR_TYPE_OPTIONS.find((t) => t.value === form.tourType)?.label ?? form.tourType}
                </Text>
                <ChevronDownIcon />
              </TouchableOpacity>

              {openPicker === 'tourType' && (
                <View style={aw.dropdownMenu}>
                  {TOUR_TYPE_OPTIONS.map((opt) => {
                    const isSelected = opt.value === form.tourType;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={aw.dropdownRow}
                        activeOpacity={0.75}
                        onPress={() => { update({ tourType: opt.value }); setOpenPicker(null); }}
                      >
                        <Text style={[aw.dropdownRowText, isSelected && aw.dropdownRowTextSelected]} numberOfLines={1}>{opt.label}</Text>
                        {isSelected && <CheckIcon size={14} color={C.amber} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        </View>

        <FieldLabel>Tour Name</FieldLabel>
        <TextInput
          style={aw.input} placeholder="Enter tour title" placeholderTextColor={C.brownMid + '80'}
          value={form.tourName} onChangeText={(t) => update({ tourName: t })}
        />

        <FieldLabel>Destination</FieldLabel>
        <View style={[aw.dropdownAnchor, openPicker === 'destination' && { zIndex: 30 }]}>
          <View style={aw.selectBox}>
            <TextInput
              style={[aw.selectText, { flex: 1, padding: 0 }]}
              placeholder="Type or select a destination"
              placeholderTextColor={C.brownMid + '80'}
              value={form.destination}
              onChangeText={(t) => update({ destination: t })}
              onFocus={() => setOpenPicker('destination')}
            />
            <TouchableOpacity
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => setOpenPicker(openPicker === 'destination' ? null : 'destination')}
            >
              <ChevronDownIcon />
            </TouchableOpacity>
          </View>

          {openPicker === 'destination' && (() => {
            const filtered = DESTINATION_OPTIONS.filter((d) => d.toLowerCase().includes(form.destination.trim().toLowerCase()));
            return filtered.length > 0 ? (
              <View style={aw.dropdownMenu}>
                <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                  {filtered.map((d) => {
                    const isSelected = d === form.destination;
                    return (
                      <TouchableOpacity
                        key={d}
                        style={aw.dropdownRow}
                        activeOpacity={0.75}
                        onPress={() => { update({ destination: d }); setOpenPicker(null); }}
                      >
                        <Text style={[aw.dropdownRowText, isSelected && aw.dropdownRowTextSelected]} numberOfLines={1}>{d}</Text>
                        {isSelected && <CheckIcon size={14} color={C.amber} />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null;
          })()}
        </View>
        <Text style={aw.cardSub}>Don't see your destination in the list? Just type it in.</Text>

        {form.tourType === 'charter_flight' && (
          <>
            <FieldLabel>Airline</FieldLabel>
            <TextInput
              style={aw.input} placeholder="e.g. Philippine Airlines" placeholderTextColor={C.brownMid + '80'}
              value={form.airline} onChangeText={(t) => update({ airline: t })}
            />
          </>
        )}

        {form.tourType === 'cruise' && (
          <>
            <FieldLabel>Cruise Line</FieldLabel>
            <TextInput
              style={aw.input} placeholder="e.g. Royal Caribbean" placeholderTextColor={C.brownMid + '80'}
              value={form.cruiseLine} onChangeText={(t) => update({ cruiseLine: t })}
            />
          </>
        )}

        <FieldLabel>Duration</FieldLabel>
        <View style={aw.row2}>
          <View style={{ flex: 1 }}>
            <TextInput
              style={aw.input} placeholder="Days" placeholderTextColor={C.brownMid + '80'} keyboardType="numeric"
              value={form.durationDays}
              onChangeText={(t) => {
                const days = t.replace(/[^0-9]/g, '');
                // Nights can never exceed Days — clamp it down if the new Days shrinks past it.
                const daysNum = parseInt(days, 10) || 0;
                const nightsNum = parseInt(form.durationNights, 10) || 0;
                const exceeded = nightsNum > daysNum;
                const nights = exceeded ? days : form.durationNights;
                setNightsExceeded(exceeded);
                update({ durationDays: days, durationNights: nights, duration: formatDuration(days, nights) });
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <TextInput
              style={aw.input} placeholder="Nights" placeholderTextColor={C.brownMid + '80'} keyboardType="numeric"
              value={form.durationNights}
              onChangeText={(t) => {
                let nights = t.replace(/[^0-9]/g, '');
                const daysNum = parseInt(form.durationDays, 10) || 0;
                const exceeded = (parseInt(nights, 10) || 0) > daysNum;
                if (exceeded) nights = form.durationDays;
                setNightsExceeded(exceeded);
                update({ durationNights: nights, duration: formatDuration(form.durationDays, nights) });
              }}
            />
          </View>
        </View>
        {nightsExceeded && <Text style={aw.errorHint}>Nights can't exceed the number of Days.</Text>}

        <View style={aw.row2}>
          <View style={{ flex: 1 }}>
            <FieldLabel>Status</FieldLabel>
            <View style={[aw.dropdownAnchor, openPicker === 'status' && { zIndex: 30 }]}>
              <TouchableOpacity
                style={aw.selectBox}
                activeOpacity={0.8}
                onPress={() => setOpenPicker(openPicker === 'status' ? null : 'status')}
              >
                <Text style={aw.selectText} numberOfLines={1}>{form.status}</Text>
                <ChevronDownIcon />
              </TouchableOpacity>

              {openPicker === 'status' && (
                <View style={aw.dropdownMenu}>
                  {(['Active', 'Draft', 'Inactive'] as const).map((s) => {
                    const isSelected = s === form.status;
                    return (
                      <TouchableOpacity
                        key={s}
                        style={aw.dropdownRow}
                        activeOpacity={0.75}
                        onPress={() => { update({ status: s }); setOpenPicker(null); }}
                      >
                        <Text style={[aw.dropdownRowText, isSelected && aw.dropdownRowTextSelected]} numberOfLines={1}>{s}</Text>
                        {isSelected && <CheckIcon size={14} color={C.amber} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        </View>

        <FieldLabel>Short Description</FieldLabel>
        <TextInput
          style={[aw.input, aw.textarea]} placeholder="Enter a short description about the tour..." placeholderTextColor={C.brownMid + '80'}
          multiline maxLength={300} value={form.shortDescription} onChangeText={(t) => update({ shortDescription: t })}
        />
        <Text style={aw.counterText}>{form.shortDescription.length}/300</Text>
      </View>
    </View>
  );
};

/* ════════════════════════════════════════
   STEP 2 — PRICING & AVAILABILITY
════════════════════════════════════════ */
const Step2PricingAvailability = ({ form, update }: StepProps) => {
  const { C } = useAppTheme();
  const aw = useMemo(() => makeStyles(C), [C]);
  const [modalMode, setModalMode] = useState<{ open: boolean; editingId: string | null }>({ open: false, editingId: null });
  const [resetCounter, setResetCounter] = useState(0);

  const addCharge = () => update({ additionalCharges: [...form.additionalCharges, { id: `c${Date.now()}`, label: '', amount: '' }] });
  const updateCharge = (id: string, patch: Partial<AdditionalCharge>) =>
    update({ additionalCharges: form.additionalCharges.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  const removeCharge = (id: string) => update({ additionalCharges: form.additionalCharges.filter((c) => c.id !== id) });

  const updateBatch = (id: string, patch: Partial<DateBatch>) =>
    update({ dateBatches: form.dateBatches.map((b) => (b.id === id ? { ...b, ...patch } : b)) });
  const removeBatch = (id: string) => update({ dateBatches: form.dateBatches.filter((b) => b.id !== id) });

  const editingBatch = modalMode.editingId ? form.dateBatches.find((b) => b.id === modalMode.editingId) ?? null : null;

  // Closing an "add new" sheet (via Cancel/backdrop) should discard whatever
  // was typed, so the next "Add Date Range" open starts blank again.
  const closeModal = () => {
    if (!modalMode.editingId) setResetCounter((c) => c + 1);
    setModalMode({ open: false, editingId: null });
  };

  const handleSaveBatch = (data: Omit<DateBatch, 'id'>) => {
    if (modalMode.editingId) {
      updateBatch(modalMode.editingId, data);
    } else {
      update({ dateBatches: [...form.dateBatches, { id: `batch${Date.now()}`, ...data }] });
      setResetCounter((c) => c + 1);
    }
    setModalMode({ open: false, editingId: null });
  };

  return (
    <View style={{ gap: 14 }}>
      <View style={aw.card}>
        <View style={[aw.rowBetween, { alignItems: 'flex-start' }]}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={aw.cardTitle}>Availability and Pricing</Text>
            <Text style={aw.cardSub}>Add multiple date ranges when your tour is available.</Text>
          </View>
          <TouchableOpacity
            style={aw.addDateRangeBtn}
            activeOpacity={0.85}
            onPress={() => setModalMode({ open: true, editingId: null })}
          >
            <PlusIcon color={C.amber} />
            <Text style={aw.addDateRangeBtnText}>Add Date Range</Text>
          </TouchableOpacity>
        </View>

        <View style={aw.durationInfoBox}>
          <View style={aw.durationInfoIconWrap}><CalendarIcon color={C.amber} /></View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={aw.durationInfoTitle}>Duration: {form.duration || '—'}</Text>
            <Text style={aw.durationInfoSub}>Each date range you add will follow this duration</Text>
          </View>
        </View>

        <Text style={aw.subheading}>Date Ranges ({form.dateBatches.length})</Text>
        {form.dateBatches.length === 0 && <Text style={aw.emptyHint}>No date ranges added yet.</Text>}

        {form.dateBatches.map((batch, idx) => (
          <View key={batch.id} style={aw.batchCard}>
            <View style={aw.batchCardRow}>
              <View style={aw.batchNumberCircle}><Text style={aw.batchNumberText}>{idx + 1}</Text></View>
              <View style={aw.batchDateRow}>
                <View style={aw.batchDateGroup}>
                  <CalendarIcon size={13} color={C.brown} />
                  <Text style={aw.batchRangeText} numberOfLines={1}>{formatDateRangeLabel(batch.startDate, batch.endDate)}</Text>
                </View>
                <Text style={aw.batchDurationText} numberOfLines={1}>{form.duration || '—'}</Text>
              </View>
            </View>

            <View style={aw.batchCardFooterRow}>
              <TouchableOpacity
                style={[aw.availableToggle, !batch.available && aw.availableToggleOff]}
                activeOpacity={0.8}
                onPress={() => updateBatch(batch.id, { available: !batch.available })}
              >
                <Text style={[aw.availableToggleText, !batch.available && aw.availableToggleTextOff]}>
                  {batch.available ? 'Available' : 'Unavailable'}
                </Text>
                <View style={[aw.miniSwitch, batch.available && aw.miniSwitchOn]}>
                  <View style={[aw.miniSwitchThumb, batch.available && aw.miniSwitchThumbOn]} />
                </View>
              </TouchableOpacity>

              <View style={aw.batchActionIcons}>
                <TouchableOpacity
                  style={aw.batchIconBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => setModalMode({ open: true, editingId: batch.id })}
                >
                  <PencilIcon color={C.amber} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={aw.batchIconBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => removeBatch(batch.id)}
                >
                  <TrashIcon />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={aw.card}>
        <Text style={aw.cardTitle}>Additional Charges</Text>
        <Text style={aw.cardSub}>Optional fees that apply on top of per-date pricing below.</Text>

        {form.additionalCharges.map((c) => (
          <View key={c.id} style={aw.chargeRow}>
            <TextInput style={[aw.input, { flex: 1.4 }]} placeholder="Charge name" placeholderTextColor={C.brownMid + '80'} value={c.label} onChangeText={(t) => updateCharge(c.id, { label: t })} />
            <View style={aw.priceInputWrapSmall}>
              <Text style={aw.pesoSign}>₱</Text>
              <TextInput style={aw.priceInputSmall} keyboardType="numeric" placeholder="0" placeholderTextColor={C.brownMid + '80'} value={c.amount} onChangeText={(t) => updateCharge(c.id, { amount: t.replace(/[^0-9]/g, '') })} />
            </View>
            <TouchableOpacity onPress={() => removeCharge(c.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><TrashIcon /></TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={aw.addChargeBtn} activeOpacity={0.8} onPress={addCharge}>
          <PlusIcon color={C.amber} />
          <Text style={aw.addChargeText}>Add</Text>
        </TouchableOpacity>
      </View>

      <AddDateRangeModal
        key={modalMode.editingId ?? `add-${resetCounter}`}
        visible={modalMode.open}
        duration={form.duration}
        durationDays={parseInt(form.durationDays, 10) || 0}
        editingBatch={editingBatch}
        onClose={closeModal}
        onSave={handleSaveBatch}
      />
    </View>
  );
};

/* ════════════════════════════════════════
   ADD / EDIT DATE RANGE — bottom sheet
════════════════════════════════════════ */
const AddDateRangeModal = ({
  visible, duration, durationDays, editingBatch, onClose, onSave,
}: {
  visible: boolean;
  duration: string;
  durationDays: number;
  editingBatch: DateBatch | null;
  onClose: () => void;
  onSave: (data: Omit<DateBatch, 'id'>) => void;
}) => {
  const { C } = useAppTheme();
  const aw = useMemo(() => makeStyles(C), [C]);

  const [startDate, setStartDate] = useState<string | null>(editingBatch?.startDate ?? null);
  const [slots, setSlots] = useState(editingBatch?.slots ?? '');
  const [adultPrice, setAdultPrice] = useState(editingBatch?.adultPrice ?? '');
  const [childPrice, setChildPrice] = useState(editingBatch?.childPrice ?? '');
  const [additionalPrice, setAdditionalPrice] = useState(editingBatch?.additionalPrice ?? '');
  const [downpayment, setDownpayment] = useState(editingBatch?.downpayment ?? '');
  const [available, setAvailable] = useState(editingBatch?.available ?? true);

  const endDate = startDate ? addDaysISO(startDate, durationDays) : null;
  const canSave = !!startDate;

  const handleSave = () => {
    if (!startDate) return;
    onSave({ startDate, endDate: endDate ?? startDate, slots, adultPrice, childPrice, additionalPrice, downpayment, available });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={aw.sheetBackdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={aw.sheetContainer}>
          <View style={aw.sheetHandle} />
          <View style={aw.sheetHeaderRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={aw.sheetTitle}>{editingBatch ? 'Edit Date Range' : 'Add Date Range'}</Text>
              <Text style={aw.sheetSub}>Duration: {duration || '—'}</Text>
            </View>
            <TouchableOpacity style={aw.sheetCloseBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <XIcon size={14} color={C.brownMid} />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={aw.sheetSectionTitle}>1. Select Start Date</Text>
            <MiniCalendar
              selectedDates={startDate ? [startDate] : []}
              onToggleDate={(iso) => setStartDate((prev) => (prev === iso ? null : iso))}
              disablePast
            />

            <View style={aw.endDateBox}>
              <View style={aw.endDateIconWrap}><CalendarIcon color={C.amber} /></View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={aw.endDateLabel}>End Date (Auto)</Text>
                <Text style={aw.endDateValue}>{endDate ? formatShortDate(endDate, true) : '—'}</Text>
                <Text style={aw.endDateDuration}>{duration || '—'}</Text>
              </View>
              {!!endDate && (
                <View style={aw.autoCalcBadge}>
                  <CheckIcon size={11} color="#12946F" />
                  <Text style={aw.autoCalcBadgeText}>Auto-calculated{'\n'}based on duration</Text>
                </View>
              )}
            </View>

            <Text style={aw.sheetSectionTitle}>2. Set Availability & Pricing</Text>
            <View style={aw.row2}>
              <View style={{ flex: 1 }}>
                <FieldLabel>Available Slots</FieldLabel>
                <TextInput style={aw.input} keyboardType="numeric" placeholder="e.g. 25" placeholderTextColor={C.brownMid + '80'} value={slots} onChangeText={(t) => setSlots(t.replace(/[^0-9]/g, ''))} />
              </View>
              <View style={{ flex: 1 }}>
                <FieldLabel>Adult Price</FieldLabel>
                <View style={aw.priceInputWrap}>
                  <Text style={aw.pesoSign}>₱</Text>
                  <TextInput style={aw.priceInput} keyboardType="numeric" placeholder="0" placeholderTextColor={C.brownMid + '80'} value={adultPrice} onChangeText={(t) => setAdultPrice(t.replace(/[^0-9]/g, ''))} />
                </View>
              </View>
            </View>

            <View style={aw.row2}>
              <View style={{ flex: 1 }}>
                <FieldLabel>Child Price (2–5 yrs)</FieldLabel>
                <View style={aw.priceInputWrap}>
                  <Text style={aw.pesoSign}>₱</Text>
                  <TextInput style={aw.priceInput} keyboardType="numeric" placeholder="0" placeholderTextColor={C.brownMid + '80'} value={childPrice} onChangeText={(t) => setChildPrice(t.replace(/[^0-9]/g, ''))} />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <FieldLabel>Additional Price (Optional)</FieldLabel>
                <View style={aw.priceInputWrap}>
                  <Text style={aw.pesoSign}>₱</Text>
                  <TextInput style={aw.priceInput} keyboardType="numeric" placeholder="0" placeholderTextColor={C.brownMid + '80'} value={additionalPrice} onChangeText={(t) => setAdditionalPrice(t.replace(/[^0-9]/g, ''))} />
                </View>
              </View>
            </View>
            <Text style={aw.sheetHint}>For extra services, activities, or special arrangements.</Text>

            <FieldLabel>Downpayment</FieldLabel>
            <View style={aw.priceInputWrap}>
              <Text style={aw.pesoSign}>₱</Text>
              <TextInput style={aw.priceInput} keyboardType="numeric" placeholder="0" placeholderTextColor={C.brownMid + '80'} value={downpayment} onChangeText={(t) => setDownpayment(t.replace(/[^0-9]/g, ''))} />
            </View>
            <Text style={aw.sheetHint}>How much travelers need to pay upfront to reserve this date range.</Text>

            <Text style={aw.sheetSectionTitle}>3. Availability Status</Text>
            <TouchableOpacity style={aw.availabilityStatusRow} activeOpacity={0.8} onPress={() => setAvailable((a) => !a)}>
              <View style={[aw.miniSwitch, available && aw.miniSwitchOn]}>
                <View style={[aw.miniSwitchThumb, available && aw.miniSwitchThumbOn]} />
              </View>
              <Text style={aw.availabilityStatusText}>{available ? 'Available' : 'Unavailable'}</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={aw.sheetFooterRow}>
            <TouchableOpacity style={aw.cancelBtn} activeOpacity={0.8} onPress={onClose}>
              <Text style={aw.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[aw.nextBtn, !canSave && aw.nextBtnDisabled]} activeOpacity={0.85} onPress={handleSave} disabled={!canSave}>
              <Text style={aw.nextText}>{editingBatch ? 'Save Changes' : 'Add Date Range'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

/* ════════════════════════════════════════
   STEP 3 — ITINERARY
════════════════════════════════════════ */
const Step3Itinerary = ({ form, update }: StepProps) => {
  const { C } = useAppTheme();
  const aw = useMemo(() => makeStyles(C), [C]);
  const activeDay = form.itineraryDays.find((d) => d.id === form.activeDayId) ?? form.itineraryDays[0];
  const activeIndex = form.itineraryDays.findIndex((d) => d.id === activeDay?.id);

  // The number of itinerary days is locked to the tour's Duration (Step 1) —
  // can't add past it, can't remove below it.
  const durationDaysNum = parseInt(form.durationDays, 10) || 0;
  const minDays = durationDaysNum > 0 ? durationDaysNum : 1;
  const canAddDay = durationDaysNum > 0 && form.itineraryDays.length < durationDaysNum;
  const canRemoveDay = form.itineraryDays.length > minDays;

  const addDay = () => {
    if (!canAddDay) return;
    const newDay: ItineraryDay = {
      id: `day${Date.now()}`, photoUri: null, photoBase64: null, photoMimeType: null, location: '',
      description: '', meals: { breakfast: false, lunch: false, dinner: false }, accommodation: '',
    };
    update({ itineraryDays: [...form.itineraryDays, newDay], activeDayId: newDay.id });
  };
  const removeDay = (id: string) => {
    if (!canRemoveDay) return;
    const remaining = form.itineraryDays.filter((d) => d.id !== id);
    update({ itineraryDays: remaining, activeDayId: remaining[0]?.id ?? '' });
  };
  const updateDay = (id: string, patch: Partial<ItineraryDay>) =>
    update({ itineraryDays: form.itineraryDays.map((d) => (d.id === id ? { ...d, ...patch } : d)) });
  const toggleMeal = (id: string, meal: keyof MealsFlags) => {
    const day = form.itineraryDays.find((d) => d.id === id);
    if (!day) return;
    updateDay(id, { meals: { ...day.meals, [meal]: !day.meals[meal] } });
  };

  return (
    <View style={{ gap: 14 }}>
      <View style={aw.card}>
        <View style={aw.rowBetween}>
          <Text style={aw.cardTitle}>Itinerary</Text>
          <TouchableOpacity style={[aw.smallAddBtn, !canAddDay && { opacity: 0.4 }]} activeOpacity={0.85} onPress={addDay} disabled={!canAddDay}>
            <PlusIcon color={C.white} />
            <Text style={aw.smallAddText}>Add Day</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={aw.dayChipsRow}>
          {form.itineraryDays.map((d, i) => {
            const isActive = d.id === activeDay?.id;
            return (
              <TouchableOpacity key={d.id} style={[aw.dayChip, isActive && aw.dayChipActive]} activeOpacity={0.8} onPress={() => update({ activeDayId: d.id })}>
                <Text style={[aw.dayChipText, isActive && aw.dayChipTextActive]}>Day {i + 1}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <Text style={aw.dragHint}>
          {durationDaysNum > 0
            ? `${form.itineraryDays.length} of ${durationDaysNum} days added, based on your Duration in Step 1.`
            : 'Set your tour Duration in Step 1 to unlock adding itinerary days.'}
        </Text>
      </View>

      {activeDay && (
        <View style={aw.card}>
          <View style={aw.rowBetween}>
            <Text style={aw.cardTitle} numberOfLines={1}>Day {activeIndex + 1}</Text>
            {canRemoveDay && (
              <TouchableOpacity onPress={() => removeDay(activeDay.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <TrashIcon />
              </TouchableOpacity>
            )}
          </View>

          <FieldLabel>Day Photo</FieldLabel>
          <TouchableOpacity style={aw.dayPhotoBox} activeOpacity={0.85} onPress={() => pickDayPhoto(activeDay.id, updateDay)}>
            {activeDay.photoUri ? (
              <>
                <Image source={{ uri: activeDay.photoUri }} style={aw.coverPhotoImage} />
                <View style={aw.coverPhotoOverlay}>
                  <CameraIcon size={16} color="#FFFFFF" />
                  <Text style={aw.coverPhotoOverlayText}>Change Photo</Text>
                </View>
                <TouchableOpacity
                  style={aw.coverPhotoRemoveBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => updateDay(activeDay.id, { photoUri: null, photoBase64: null, photoMimeType: null })}
                >
                  <TrashIcon color="#FFFFFF" />
                </TouchableOpacity>
              </>
            ) : (
              <View style={aw.coverPhotoEmpty}>
                <CameraIcon />
                <Text style={aw.coverPhotoEmptyText}>Add Day Photo</Text>
                <Text style={aw.coverPhotoEmptyHint}>Square · JPG or PNG</Text>
              </View>
            )}
          </TouchableOpacity>

          <FieldLabel>Location</FieldLabel>
          <TextInput style={aw.input} placeholder="Manila" placeholderTextColor={C.brownMid + '80'} value={activeDay.location} onChangeText={(t) => updateDay(activeDay.id, { location: t })} />

          <FieldLabel>Description / Activities</FieldLabel>
          <TextInput style={[aw.input, aw.textarea]} placeholder="Write here..." placeholderTextColor={C.brownMid + '80'} multiline maxLength={1000} value={activeDay.description} onChangeText={(t) => updateDay(activeDay.id, { description: t })} />
          <Text style={aw.counterText}>{activeDay.description.length}/1000</Text>

          <FieldLabel>Meals</FieldLabel>
          <View style={aw.mealsRow}>
            {(['breakfast', 'lunch', 'dinner'] as const).map((meal) => (
              <TouchableOpacity key={meal} style={aw.mealCheckRow} activeOpacity={0.8} onPress={() => toggleMeal(activeDay.id, meal)}>
                <View style={[aw.checkbox, activeDay.meals[meal] && aw.checkboxChecked]}>
                  {activeDay.meals[meal] && <CheckIcon size={11} color={C.white} />}
                </View>
                <Text style={aw.mealLabel}>{meal[0].toUpperCase() + meal.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ marginTop: 14 }}>
            <FieldLabel>Accommodation</FieldLabel>
            <TextInput style={aw.input} placeholder="Hotel name (optional)" placeholderTextColor={C.brownMid + '80'} value={activeDay.accommodation} onChangeText={(t) => updateDay(activeDay.id, { accommodation: t })} />
          </View>

          <View style={{ marginTop: 14 }}>
            <FieldLabel>Route Map</FieldLabel>
            <View style={aw.routeMapBox}>
              <Text style={aw.routeMapText}>Route map preview</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

/* ════════════════════════════════════════
   STEP 4 — INCLUSIONS & EXCLUSIONS
════════════════════════════════════════ */
const Step4InclusionsExclusions = ({ form, update }: StepProps) => {
  const { C } = useAppTheme();
  const aw = useMemo(() => makeStyles(C), [C]);
  const addInclusion = () => update({ inclusions: [...form.inclusions, ''] });
  const updateInclusion = (i: number, val: string) => update({ inclusions: form.inclusions.map((v, idx) => (idx === i ? val : v)) });
  const removeInclusion = (i: number) => update({ inclusions: form.inclusions.filter((_, idx) => idx !== i) });

  const addExclusion = () => update({ exclusions: [...form.exclusions, ''] });
  const updateExclusion = (i: number, val: string) => update({ exclusions: form.exclusions.map((v, idx) => (idx === i ? val : v)) });
  const removeExclusion = (i: number) => update({ exclusions: form.exclusions.filter((_, idx) => idx !== i) });

  return (
    <View style={{ gap: 14 }}>
      <View style={[aw.card, aw.inclusionCard]}>
        <View style={aw.rowBetween}>
          <Text style={[aw.cardTitle, { color: '#12946F' }]}>Inclusion</Text>
          <TouchableOpacity style={aw.addPillBtn} activeOpacity={0.85} onPress={addInclusion}>
            <PlusIcon color={C.white} />
            <Text style={aw.addPillText}>Add</Text>
          </TouchableOpacity>
        </View>
        <Text style={aw.cardSub}>Items and service included in this tour package.</Text>
        {form.inclusions.length === 0 && <Text style={aw.emptyHint}>No inclusions added yet.</Text>}
        {form.inclusions.map((val, i) => (
          <View key={i} style={aw.listRow}>
            <TextInput style={aw.listInput} value={val} placeholder="Enter inclusion..." placeholderTextColor={C.brownMid + '80'} onChangeText={(t) => updateInclusion(i, t)} />
            <TouchableOpacity onPress={() => removeInclusion(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><TrashIcon /></TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={[aw.card, aw.exclusionCard]}>
        <View style={aw.rowBetween}>
          <Text style={[aw.cardTitle, { color: C.danger }]}>Exclusions</Text>
          <TouchableOpacity style={[aw.addPillBtn, { backgroundColor: C.danger }]} activeOpacity={0.85} onPress={addExclusion}>
            <PlusIcon color={C.white} />
            <Text style={aw.addPillText}>Add</Text>
          </TouchableOpacity>
        </View>
        <Text style={aw.cardSub}>Items and service not included in this tour package.</Text>
        {form.exclusions.length === 0 && <Text style={aw.emptyHint}>No exclusions added yet.</Text>}
        {form.exclusions.map((val, i) => (
          <View key={i} style={aw.listRow}>
            <TextInput style={aw.listInput} value={val} placeholder="Enter exclusion..." placeholderTextColor={C.brownMid + '80'} onChangeText={(t) => updateExclusion(i, t)} />
            <TouchableOpacity onPress={() => removeExclusion(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><TrashIcon /></TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};

/* ════════════════════════════════════════
   STEP 5 — SUMMARY
════════════════════════════════════════ */
const Step5Summary = ({ form, goToStep }: { form: TourFormState; goToStep: (n: number) => void }) => {
  const { C } = useAppTheme();
  const aw = useMemo(() => makeStyles(C), [C]);

  return (
    <View style={{ gap: 14 }}>
      <View style={aw.card}>
        <View style={aw.rowBetween}>
          <Text style={aw.cardTitle}>Basic Information</Text>
          <TouchableOpacity onPress={() => goToStep(0)}><Text style={aw.editLink}>Edit</Text></TouchableOpacity>
        </View>
        {form.coverImageUri ? (
          <Image source={{ uri: form.coverImageUri }} style={aw.previewBanner} resizeMode="cover" />
        ) : (
          <LinearGradient colors={['#6B2E10', '#B85F17', '#D17B2E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={aw.previewBanner}>
            <PlaneWatermarkIcon />
          </LinearGradient>
        )}
        <SummaryLine label="Tour Code" value={form.tourCode} bold />
        <SummaryLine label="Tour Type" value={TOUR_TYPE_OPTIONS.find((t) => t.value === form.tourType)?.label ?? form.tourType} bold />
        <SummaryLine label="Destination" value={form.destination || '—'} />
        {form.tourType === 'charter_flight' && <SummaryLine label="Airline" value={form.airline || '—'} />}
        {form.tourType === 'cruise' && <SummaryLine label="Cruise Line" value={form.cruiseLine || '—'} />}
        <SummaryLine label="Tour Name" value={form.tourName || '—'} />
        <SummaryLine label="Duration" value={form.duration || '—'} />
        <SummaryLine label="Status" value={form.status} bold />
      </View>

      <View style={aw.card}>
        <View style={aw.rowBetween}>
          <Text style={aw.cardTitle}>Availability & Pricing per Date Range</Text>
          <TouchableOpacity onPress={() => goToStep(1)}><Text style={aw.editLink}>Edit</Text></TouchableOpacity>
        </View>
        {form.dateBatches.length === 0 ? (
          <Text style={aw.emptyHint}>No date ranges added yet.</Text>
        ) : (
          form.dateBatches.map((b) => (
            <SummaryLine
              key={b.id}
              label={formatDateRangeLabel(b.startDate, b.endDate)}
              value={`${formatPeso(Number(b.adultPrice) || 0)} adult · ${b.slots || '0'} slots`}
            />
          ))
        )}
      </View>

      <View style={aw.card}>
        <View style={aw.rowBetween}>
          <Text style={aw.cardTitle}>Itinerary</Text>
          <TouchableOpacity onPress={() => goToStep(2)}><Text style={aw.editLink}>Edit</Text></TouchableOpacity>
        </View>
        {form.itineraryDays.length === 0 ? (
          <Text style={aw.emptyHint}>No itinerary days added yet.</Text>
        ) : (
          form.itineraryDays.map((day, i) => {
            const mealsList = (['breakfast', 'lunch', 'dinner'] as const).filter((m) => day.meals[m]);
            const mealsText = mealsList.length ? mealsList.map((m) => m[0].toUpperCase() + m.slice(1)).join(', ') : '—';
            const activities = day.description.split('\n').map((s) => s.trim()).filter(Boolean);
            return (
              <View key={day.id} style={aw.summaryDayCard}>
                <View style={aw.summaryDayHeaderRow}>
                  <View style={aw.summaryDayBadge}><Text style={aw.summaryDayBadgeText}>DAY {i + 1}</Text></View>
                  <TouchableOpacity style={aw.summaryDayMenuBtn} activeOpacity={0.8} onPress={() => goToStep(2)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <DotsIcon />
                  </TouchableOpacity>
                </View>

                {day.photoUri && <Image source={{ uri: day.photoUri }} style={aw.summaryDayPhoto} />}

                <View style={aw.summaryDayInfoRow}>
                  <View style={aw.summaryDayInfoCol}>
                    <View style={aw.summaryDayInfoIconWrap}><MapPinIcon /></View>
                    <Text style={aw.summaryDayInfoLabel}>Location</Text>
                    <Text style={aw.summaryDayInfoValue} numberOfLines={1}>{day.location || '—'}</Text>
                  </View>
                  <View style={aw.summaryDayInfoDivider} />
                  <View style={aw.summaryDayInfoCol}>
                    <View style={aw.summaryDayInfoIconWrap}><ForkKnifeIcon /></View>
                    <Text style={aw.summaryDayInfoLabel}>Meals</Text>
                    <Text style={aw.summaryDayInfoValue} numberOfLines={1}>{mealsText}</Text>
                  </View>
                  <View style={aw.summaryDayInfoDivider} />
                  <View style={aw.summaryDayInfoCol}>
                    <View style={aw.summaryDayInfoIconWrap}><BuildingIcon /></View>
                    <Text style={aw.summaryDayInfoLabel}>Stay</Text>
                    <Text style={aw.summaryDayInfoValue} numberOfLines={1}>{day.accommodation || '—'}</Text>
                  </View>
                </View>

                {activities.length > 0 && (
                  <>
                    <View style={aw.summaryDayDivider} />
                    <View style={aw.summaryDayActivitiesHeader}>
                      <StarIcon size={14} />
                      <Text style={aw.summaryDayActivitiesTitle}>Activities</Text>
                    </View>
                    <View style={aw.summaryActivitiesGrid}>
                      {activities.map((line, idx) => (
                        <View key={idx} style={aw.summaryActivityItem}>
                          <View style={aw.summaryActivityDot} />
                          <Text style={aw.summaryActivityText}>{line}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </View>
            );
          })
        )}
      </View>

    </View>
  );
};

/* ════════════════════════════════════════
   STEP INDICATOR
════════════════════════════════════════ */
const STEP_CONNECTOR_W = 10;

const StepIndicator = ({ currentStep, onStepPress }: { currentStep: number; onStepPress: (i: number) => void }) => {
  const { C } = useAppTheme();
  const aw = useMemo(() => makeStyles(C), [C]);
  const [barWidth, setBarWidth] = useState(Dimensions.get('window').width);

  const count = STEP_LABELS_SHORT.length;
  const paddingH = aw.stepBarContent.paddingHorizontal as number;
  const usable = Math.max(0, barWidth - paddingH * 2 - STEP_CONNECTOR_W * (count - 1));
  const itemWidth = usable / count;

  return (
    <View
      style={[aw.stepBar, aw.stepBarContent]}
      onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
    >
      {STEP_LABELS_SHORT.map((label, i) => {
        const isDone = i < currentStep;
        const isCurrent = i === currentStep;
        return (
          <React.Fragment key={label}>
            {i > 0 && <View style={[aw.stepConnector, { width: STEP_CONNECTOR_W }, (isDone || isCurrent) && aw.stepConnectorActive]} />}
            <TouchableOpacity style={[aw.stepItem, { width: itemWidth }]} activeOpacity={0.7} disabled={i > currentStep} onPress={() => onStepPress(i)}>
              <View style={[aw.stepCircle, (isDone || isCurrent) && aw.stepCircleCurrent]}>
                {isDone
                  ? <CheckIcon size={10} color="#FFFFFF" />
                  : <Text style={[aw.stepCircleText, isCurrent && aw.stepCircleTextCurrent]}>{i + 1}</Text>
                }
              </View>
              <Text style={[aw.stepLabel, (isCurrent || isDone) && aw.stepLabelCurrent]} numberOfLines={1}>{label}</Text>
            </TouchableOpacity>
          </React.Fragment>
        );
      })}
    </View>
  );
};

/* ════════════════════════════════════════
   MAIN MODAL
════════════════════════════════════════ */
type Props = { visible: boolean; onClose: () => void; onCreated?: () => void };

export default function AddTourPackageModal({ visible, onClose, onCreated }: Props) {
  const { C } = useAppTheme();
  const aw = useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<TourFormState>(createInitialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const submitErrorOpacity = useRef(new Animated.Value(0)).current;
  const submitErrorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss the error banner: fade it out 7s after it appears.
  useEffect(() => {
    if (submitErrorTimeoutRef.current) {
      clearTimeout(submitErrorTimeoutRef.current);
      submitErrorTimeoutRef.current = null;
    }
    if (submitError) {
      submitErrorOpacity.setValue(1);
      submitErrorTimeoutRef.current = setTimeout(() => {
        Animated.timing(submitErrorOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
          setSubmitError('');
        });
      }, 7000);
    }
    return () => {
      if (submitErrorTimeoutRef.current) clearTimeout(submitErrorTimeoutRef.current);
    };
  }, [submitError]);

  const update = (patch: Partial<TourFormState>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleClose = () => {
    onClose();
    setStep(0);
    setForm(createInitialForm());
    setSubmitError('');
  };

  const goPrev = () => setStep((s) => Math.max(s - 1, 0));
  const isLastStep = step === STEP_LABELS.length - 1;

  // Itinerary day count must exactly match the Duration set in Step 1 —
  // not more, not less.
  const itineraryDaysMismatch = () => {
    const durationDaysNum = parseInt(form.durationDays, 10) || 0;
    if (durationDaysNum > 0 && form.itineraryDays.length !== durationDaysNum) {
      return `Add exactly ${durationDaysNum} itinerary day${durationDaysNum === 1 ? '' : 's'} to match your tour Duration (currently ${form.itineraryDays.length}).`;
    }
    return null;
  };

  const goNext = () => {
    if (step === 2) {
      const mismatch = itineraryDaysMismatch();
      if (mismatch) { setSubmitError(mismatch); return; }
    }
    setSubmitError('');
    setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
  };

  const submitTour = async (statusOverride?: TourFormState['status']) => {
    if (!form.destination.trim()) {
      setSubmitError('Destination is required (Step 1).');
      setStep(0);
      return;
    }
    const mismatch = itineraryDaysMismatch();
    if (mismatch) {
      setSubmitError(mismatch);
      setStep(2);
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch(TOUR_CREATE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coverImage: form.coverImageBase64
            ? `data:${form.coverImageMimeType || 'image/jpeg'};base64,${form.coverImageBase64}`
            : null,
          destination: form.destination,
          name: form.tourName,
          tourCode: form.tourCode,
          duration: form.duration,
          tourType: form.tourType,
          airline: form.airline,
          cruiseLine: form.cruiseLine,
          status: statusOverride ?? form.status,
          shortDescription: form.shortDescription,
          additionalCharges: form.additionalCharges,
          dateBatches: form.dateBatches,
          itineraryDays: form.itineraryDays.map(({ photoUri, photoBase64, photoMimeType, ...day }) => ({
            ...day,
            photo: photoBase64 ? `data:${photoMimeType || 'image/jpeg'};base64,${photoBase64}` : null,
          })),
          inclusions: form.inclusions,
          exclusions: form.exclusions,
        }),
      });
      const result = await res.json();
      if (result.status !== 'success') {
        setSubmitError(result.message || 'Failed to create tour package.');
        return;
      }
      onCreated?.();
      handleClose();
    } catch {
      setSubmitError("Can't connect to the server. Please check if XAMPP is running.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose} statusBarTranslucent>
      <SafeAreaProvider>
      <View style={aw.safe}>
        <View style={[aw.headerGradient, { backgroundColor: C.amber, paddingTop: insets.top + 14 }]}>
          <TouchableOpacity style={aw.backToToursBtn} activeOpacity={0.85} onPress={handleClose}>
            <BackIcon />
            <Text style={aw.backToToursText}>Back to Tours</Text>
          </TouchableOpacity>

          <View style={aw.headerTitleBlock}>
            <Text style={aw.headerTitle}>New Tour Package</Text>
            <Text style={aw.headerSub}>Build your perfect tour package in a few easy steps.</Text>
          </View>
        </View>

        <StepIndicator currentStep={step} onStepPress={(i) => { if (i <= step) setStep(i); }} />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={aw.body} keyboardShouldPersistTaps="handled">
            {step === 0 && <Step1TourDetails form={form} update={update} />}
            {step === 1 && <Step2PricingAvailability form={form} update={update} />}
            {step === 2 && <Step3Itinerary form={form} update={update} />}
            {step === 3 && <Step4InclusionsExclusions form={form} update={update} />}
            {step === 4 && <Step5Summary form={form} goToStep={setStep} />}
          </ScrollView>

          <View style={[aw.footer, { paddingBottom: insets.bottom + 10 }]}>
            {!!submitError && (
              <Animated.Text style={[aw.submitErrorText, { opacity: submitErrorOpacity }]}>⚠ {submitError}</Animated.Text>
            )}
            <View style={aw.footerRow}>
              <TouchableOpacity style={aw.cancelBtn} activeOpacity={0.8} onPress={handleClose} disabled={submitting}>
                <XIcon color={C.brownMid} />
                <Text style={aw.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={aw.saveDraftBtn} activeOpacity={0.8} onPress={() => submitTour('Draft')} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#12946F" size="small" /> : (
                  <>
                    <DraftDocIcon />
                    <Text style={aw.saveDraftText}>Save as Draft</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            <View style={aw.footerRow}>
              {step > 0 && (
                <TouchableOpacity style={aw.prevBtn} activeOpacity={0.8} onPress={goPrev} disabled={submitting}>
                  <ChevronLeftIcon color={C.amber} />
                  <Text style={aw.prevText}>Previous</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[aw.nextBtn, submitting && aw.nextBtnDisabled]}
                activeOpacity={0.85}
                onPress={isLastStep ? () => submitTour() : goNext}
                disabled={submitting}
              >
                {submitting ? <ActivityIndicator color="#FFFFFF" size="small" /> : (
                  <>
                    <Text style={aw.nextText}>{isLastStep ? 'Publish Tour' : 'Next Step'}</Text>
                    {!isLastStep && <ChevronRightIcon color="#FFFFFF" />}
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
      </SafeAreaProvider>
    </Modal>
  );
}

/* ════════════════════════════════════════
   STYLES
════════════════════════════════════════ */
const makeStyles = (C: ColorPalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.lightBg },

  headerGradient: { paddingHorizontal: 18, paddingBottom: 20 },
  headerTitleBlock: { alignItems: 'center', marginTop: 14 },
  headerTitle: { fontSize: 21, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.2, textAlign: 'center' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 4, lineHeight: 16, textAlign: 'center' },
  backToToursBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 7, flexShrink: 0, alignSelf: 'flex-start',
  },
  backToToursText: { fontSize: 10.5, fontWeight: '800', color: '#FFFFFF' },

  stepBar: {
    backgroundColor: C.cardBg, flexGrow: 0,
    borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  stepBarContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  stepItem: { alignItems: 'center' },
  stepCircle: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: C.amber,
    alignItems: 'center', justifyContent: 'center',
  },
  stepCircleCurrent: { backgroundColor: C.amber, borderColor: C.amber },
  stepCircleText: { fontSize: 10.5, fontWeight: '800', color: C.amber },
  stepCircleTextCurrent: { color: '#FFFFFF' },
  stepLabel: { fontSize: 9, lineHeight: 12, fontWeight: '700', color: C.amber, opacity: 0.55, marginTop: 4, textAlign: 'center', flexShrink: 1, alignSelf: 'stretch' },
  stepLabelCurrent: { color: C.amber, opacity: 1, fontWeight: '800' },
  stepConnector: { height: 2, backgroundColor: C.amber + '30', marginBottom: 16 },
  stepConnectorActive: { backgroundColor: C.amber },

  body: { padding: 16, paddingBottom: 24 },
  card: {
    backgroundColor: C.cardBg, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.divider,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1 },
    }),
  },
  cardElevated: { zIndex: 50, ...Platform.select({ android: { elevation: 50 } }) },
  cardTitle: { fontSize: 14.5, fontWeight: '900', color: C.brown },
  cardSub: { fontSize: 11, color: C.brownMid, opacity: 0.75, marginTop: 3, marginBottom: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },

  fieldLabel: { fontSize: 10.5, fontWeight: '800', color: C.brownMid, opacity: 0.75, marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: C.lightBg, borderRadius: 12, borderWidth: 1, borderColor: C.divider,
    paddingHorizontal: 13, paddingVertical: 11, fontSize: 13, color: C.brown,
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  counterText: { fontSize: 9.5, color: C.brownMid, opacity: 0.55, textAlign: 'right', marginTop: 4 },
  row2: { flexDirection: 'row', gap: 10 },
  selectBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.lightBg, borderRadius: 12, borderWidth: 1, borderColor: C.divider,
    paddingHorizontal: 13, paddingVertical: 11,
  },
  selectText: { fontSize: 13, color: C.brown, fontWeight: '600', flexShrink: 1 },
  placeholderText: { color: C.brownMid, opacity: 0.55, fontWeight: '400' },
  dropdownAnchor: { position: 'relative' },
  dropdownMenu: {
    position: 'absolute', top: '100%', left: 0, right: 0,
    marginTop: 4, backgroundColor: C.cardBg, borderRadius: 12,
    borderWidth: 1, borderColor: C.divider, overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 6 },
    }),
  },
  dropdownRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: C.divider + '55',
  },
  dropdownRowText: { fontSize: 13, color: C.brownMid, fontWeight: '600', flex: 1 },
  dropdownRowTextSelected: { color: C.amber, fontWeight: '800' },
  inputDisabled: { backgroundColor: C.divider + '33', justifyContent: 'center' },
  disabledText: { fontSize: 13, color: C.brownMid, fontWeight: '700' },

  coverPhotoBox: {
    height: 140, borderRadius: 14, backgroundColor: C.lightBg,
    borderWidth: 1, borderColor: C.divider, overflow: 'hidden', marginBottom: 4,
  },
  dayPhotoBox: {
    width: 130, height: 130, borderRadius: 14, backgroundColor: C.lightBg,
    borderWidth: 1, borderColor: C.divider, overflow: 'hidden', marginBottom: 4, alignSelf: 'center',
  },
  coverPhotoImage: { width: '100%', height: '100%' },
  coverPhotoOverlay: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.45)',
  },
  coverPhotoOverlayText: { fontSize: 11.5, fontWeight: '700', color: '#FFFFFF' },
  coverPhotoRemoveBtn: {
    position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  coverPhotoEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  coverPhotoEmptyText: { fontSize: 12.5, fontWeight: '700', color: C.brownMid },
  coverPhotoEmptyHint: { fontSize: 10, color: C.brownMid, opacity: 0.6 },

  subheading: { fontSize: 11.5, fontWeight: '800', color: C.brown, marginTop: 4, marginBottom: 2 },
  priceInputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.lightBg, borderRadius: 12, borderWidth: 1, borderColor: C.divider,
    paddingHorizontal: 13,
  },
  pesoSign: { fontSize: 13, fontWeight: '800', color: C.brownMid },
  priceInput: { flex: 1, paddingVertical: 11, fontSize: 13, color: C.brown },
  chargeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  priceInputWrapSmall: {
    flexDirection: 'row', alignItems: 'center', gap: 4, width: 90,
    backgroundColor: C.lightBg, borderRadius: 12, borderWidth: 1, borderColor: C.divider,
    paddingHorizontal: 10,
  },
  priceInputSmall: { flex: 1, paddingVertical: 10, fontSize: 12.5, color: C.brown },
  addChargeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    marginTop: 10, borderWidth: 1.5, borderColor: C.amber, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  addChargeText: { fontSize: 11.5, fontWeight: '800', color: C.amber },
  batchCard: {
    marginTop: 12, backgroundColor: C.lightBg, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: C.divider,
  },
  batchRangeText: { fontSize: 13, fontWeight: '800', color: C.brown },

  addDateRangeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, flexShrink: 0,
    borderWidth: 1.5, borderColor: C.amber, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  addDateRangeBtnText: { fontSize: 11.5, fontWeight: '800', color: C.amber },
  durationInfoBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12,
    backgroundColor: '#FFF5E0', borderRadius: 12, padding: 12,
  },
  durationInfoIconWrap: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  durationInfoTitle: { fontSize: 12.5, fontWeight: '800', color: C.brown },
  durationInfoSub: { fontSize: 10.5, color: C.brownMid, opacity: 0.75, marginTop: 2 },

  batchCardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  batchNumberCircle: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: C.amber,
    alignItems: 'center', justifyContent: 'center', backgroundColor: C.cardBg,
  },
  batchNumberText: { fontSize: 11, fontWeight: '800', color: C.amber },
  batchDateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, flex: 1, minWidth: 0 },
  batchDateGroup: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, minWidth: 0 },
  batchDurationText: { fontSize: 10.5, fontWeight: '700', color: C.amber, flexShrink: 0, marginRight: 2 },
  batchCardFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },

  availableToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: '#E4F5EC', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6,
  },
  availableToggleOff: { backgroundColor: C.divider + '55' },
  availableToggleText: { fontSize: 11, fontWeight: '800', color: '#12946F' },
  availableToggleTextOff: { color: C.brownMid },
  miniSwitch: {
    width: 30, height: 17, borderRadius: 9, backgroundColor: C.divider,
    padding: 2, justifyContent: 'center',
  },
  miniSwitchOn: { backgroundColor: '#12946F' },
  miniSwitchThumb: { width: 13, height: 13, borderRadius: 7, backgroundColor: '#FFFFFF' },
  miniSwitchThumbOn: { alignSelf: 'flex-end' },
  batchActionIcons: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  batchIconBtn: { padding: 2 },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheetContainer: {
    backgroundColor: C.cardBg, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingHorizontal: 18, paddingTop: 10, paddingBottom: 18, maxHeight: '90%',
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.divider, alignSelf: 'center', marginBottom: 12 },
  sheetHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  sheetTitle: { fontSize: 17, fontWeight: '900', color: C.brown },
  sheetSub: { fontSize: 11.5, color: C.brownMid, opacity: 0.75, marginTop: 2 },
  sheetCloseBtn: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: C.lightBg,
    alignItems: 'center', justifyContent: 'center',
  },
  sheetSectionTitle: { fontSize: 12.5, fontWeight: '900', color: C.brown, marginTop: 14, marginBottom: 6 },
  sheetHint: { fontSize: 10, color: C.brownMid, opacity: 0.65, marginTop: 4 },

  endDateBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10,
    backgroundColor: C.lightBg, borderRadius: 12, borderWidth: 1, borderColor: C.divider, padding: 12,
  },
  endDateIconWrap: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFF5E0',
    alignItems: 'center', justifyContent: 'center',
  },
  endDateLabel: { fontSize: 10, color: C.brownMid, opacity: 0.7 },
  endDateValue: { fontSize: 13, fontWeight: '800', color: C.brown, marginTop: 1 },
  endDateDuration: { fontSize: 10, color: C.amber, fontWeight: '700', marginTop: 1 },
  autoCalcBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#E4F5EC', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 6, maxWidth: 90,
  },
  autoCalcBadgeText: { fontSize: 8, fontWeight: '700', color: '#12946F', lineHeight: 10 },

  availabilityStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  availabilityStatusText: { fontSize: 12.5, fontWeight: '800', color: C.brown },
  sheetFooterRow: { flexDirection: 'row', gap: 8, marginTop: 16 },

  calNavRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  calNavBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.lightBg, borderWidth: 1, borderColor: C.divider, alignItems: 'center', justifyContent: 'center' },
  calTodayBtn: { backgroundColor: C.amber, borderRadius: 8, paddingHorizontal: 10, height: 28, alignItems: 'center', justifyContent: 'center' },
  calTodayText: { fontSize: 10.5, fontWeight: '800', color: '#FFFFFF' },
  calMonthTitle: { flex: 1, textAlign: 'right', fontSize: 13, fontWeight: '900', color: C.brown },
  calWeekdayRow: { flexDirection: 'row' },
  calWeekdayCell: { width: '14.28%', alignItems: 'center', paddingBottom: 6 },
  calWeekdayText: { fontSize: 8.5, fontWeight: '800', color: C.brownMid, opacity: 0.6 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDayCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  calDayNumWrap: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  calDayNumSelected: { backgroundColor: C.amber },
  calDayNumToday: { borderWidth: 1.5, borderColor: C.amber },
  calDayNumText: { fontSize: 11.5, fontWeight: '700', color: C.brown },
  calDayNumTextDim: { color: C.brownMid, opacity: 0.3 },
  calDayNumTextSelected: { color: '#FFFFFF', fontWeight: '900' },
  calLegendRow: { flexDirection: 'row', gap: 14, marginTop: 8 },
  calLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  calLegendDot: { width: 8, height: 8, borderRadius: 4 },
  calLegendText: { fontSize: 9.5, color: C.brownMid, opacity: 0.7, fontWeight: '600' },

  multiSelectRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 8 },
  multiSelectTitle: { fontSize: 11.5, fontWeight: '800', color: C.brown },
  multiSelectHint: { fontSize: 10, color: C.brownMid, opacity: 0.7, marginTop: 1 },
  clearAllBtn: { backgroundColor: '#3B1A0C', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  clearAllText: { fontSize: 10.5, fontWeight: '800', color: '#FFFFFF' },
  selectedDatesBox: { marginTop: 10, backgroundColor: C.lightBg, borderRadius: 12, padding: 12 },
  selectedDatesTitle: { fontSize: 11.5, fontWeight: '800', color: C.brown, marginBottom: 4 },
  emptyHint: { fontSize: 11, color: C.brownMid, opacity: 0.6 },
  errorHint: { fontSize: 10.5, color: C.danger, fontWeight: '700', marginTop: 6 },
  dateChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  dateChip: { backgroundColor: C.amber, borderRadius: 14, paddingHorizontal: 9, paddingVertical: 4 },
  dateChipText: { fontSize: 10.5, fontWeight: '800', color: '#FFFFFF' },

  smallAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.amber, borderRadius: 18, paddingHorizontal: 11, paddingVertical: 7,
  },
  smallAddText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  dayChipsRow: { gap: 8, paddingVertical: 10 },
  dayChip: { backgroundColor: C.lightBg, borderWidth: 1, borderColor: C.divider, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  dayChipActive: { backgroundColor: C.amber, borderColor: C.amber },
  dayChipText: { fontSize: 12, fontWeight: '800', color: C.brownMid },
  dayChipTextActive: { color: '#FFFFFF' },
  dragHint: { fontSize: 10, color: C.brownMid, opacity: 0.55, fontStyle: 'italic' },

  mealsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 2 },
  mealCheckRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: C.divider, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: C.amber, borderColor: C.amber },
  mealLabel: { fontSize: 12, color: C.brown, fontWeight: '600' },
  routeMapBox: {
    height: 90, backgroundColor: C.lightBg, borderRadius: 12,
    borderWidth: 1, borderColor: C.divider, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  routeMapText: { fontSize: 11, color: C.brownMid, opacity: 0.6 },

  inclusionCard: { borderColor: '#B7E4D5' },
  exclusionCard: { borderColor: '#F5C6C6' },
  addPillBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#12946F', borderRadius: 18, paddingHorizontal: 11, paddingVertical: 7 },
  addPillText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  listInput: {
    flex: 1, backgroundColor: C.lightBg, borderRadius: 12, borderWidth: 1, borderColor: C.divider,
    paddingHorizontal: 13, paddingVertical: 10, fontSize: 12.5, color: C.brown,
  },

  editLink: { fontSize: 11.5, fontWeight: '800', color: C.amber },
  summaryLineRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.divider },
  summaryLineLabel: { fontSize: 11.5, color: C.brownMid },
  summaryLineValue: { fontSize: 11.5, fontWeight: '700', color: C.brown, flexShrink: 1, textAlign: 'right', marginLeft: 10 },

  previewBanner: { width: '100%', aspectRatio: 16 / 9, borderRadius: 12, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 14, marginTop: 4, marginBottom: 8, overflow: 'hidden' },

  summaryDayCard: {
    marginTop: 12, backgroundColor: C.lightBg, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.divider,
  },
  summaryDayHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  summaryDayBadge: { backgroundColor: C.amber, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 5 },
  summaryDayBadgeText: { fontSize: 11, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
  summaryDayMenuBtn: {
    position: 'absolute', right: 0, top: -6, width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.cardBg, alignItems: 'center', justifyContent: 'center',
  },
  summaryDayPhoto: {
    width: '80%', aspectRatio: 1, borderRadius: 14, alignSelf: 'center',
    marginTop: 16, marginBottom: 16, borderWidth: 1, borderColor: C.divider,
  },
  summaryDayInfoRow: { flexDirection: 'row', alignItems: 'flex-start' },
  summaryDayInfoCol: { flex: 1, alignItems: 'center', gap: 3 },
  summaryDayInfoIconWrap: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFF5E0',
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  summaryDayInfoLabel: { fontSize: 9.5, color: C.brownMid, opacity: 0.7 },
  summaryDayInfoValue: { fontSize: 11.5, fontWeight: '800', color: C.brown, textAlign: 'center' },
  summaryDayInfoDivider: { width: 1, alignSelf: 'stretch', backgroundColor: C.divider, marginTop: 6 },
  summaryDayDivider: { height: 1, backgroundColor: C.divider, marginTop: 16, marginBottom: 12 },
  summaryDayActivitiesHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  summaryDayActivitiesTitle: { fontSize: 12.5, fontWeight: '900', color: C.amber },
  summaryActivitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, columnGap: 12 },
  summaryActivityItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, width: '46%' },
  summaryActivityDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.amber, marginTop: 6 },
  summaryActivityText: { fontSize: 11, color: C.brown, flexShrink: 1, lineHeight: 15 },

  footer: {
    paddingHorizontal: 16, paddingTop: 10,
    backgroundColor: C.cardBg, borderTopWidth: 1, borderTopColor: C.divider,
    gap: 8,
  },
  footerRow: { flexDirection: 'row', gap: 8 },
  cancelBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 8, borderRadius: 18, borderWidth: 1.5, borderColor: C.divider,
  },
  cancelText: { fontSize: 12.5, fontWeight: '800', color: C.brownMid },
  saveDraftBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 8, borderRadius: 18, borderWidth: 1.5, borderColor: '#12946F',
  },
  saveDraftText: { fontSize: 12.5, fontWeight: '800', color: '#12946F' },
  prevBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 8, borderRadius: 18, borderWidth: 1.5, borderColor: C.amber,
  },
  prevText: { fontSize: 12.5, fontWeight: '800', color: C.amber },
  nextBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 8, borderRadius: 18,
    backgroundColor: C.amber,
    ...Platform.select({
      ios:     { shadowColor: C.amber, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 2 },
    }),
  },
  nextText: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' },
  nextBtnDisabled: { opacity: 0.6 },
  submitErrorText: { fontSize: 11.5, color: C.danger, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
});
