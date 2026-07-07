/**
 * AddTourPackageModal.tsx
 * 5-step "Add New Tour Package" wizard: Tour Details, Pricing & Availability,
 * Itinerary, Inclusions & Exclusions, and a final Summary. All form state is
 * local/mock — this demonstrates the flow without a backend.
 */

import React, { useMemo, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform, KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { C as LIGHT_C } from '../dashboard/theme';
import { useAppTheme, ColorPalette } from '../ThemeContext';
import { TOUR_PACKAGES, CATEGORY_OPTIONS, FLIGHT_TYPE_OPTIONS, formatPeso } from './mockData';

/* ════════════════════════════════════════
   TYPES
════════════════════════════════════════ */
type MealsFlags = { breakfast: boolean; lunch: boolean; dinner: boolean };

type ItineraryDay = {
  id:             string;
  title:          string;
  startTime:      string;
  endTime:        string;
  location:       string;
  description:    string;
  meals:          MealsFlags;
  accommodation:  string;
};

type AdditionalCharge = { id: string; label: string; amount: string };

type TourFormState = {
  destination:        string;
  tourName:           string;
  duration:           string;
  category:           string;
  status:              'Active' | 'Draft' | 'Inactive';
  shortDescription:   string;
  tourCode:           string;
  flightType:         string;
  adultPrice:         string;
  childPrice:         string;
  infantPrice:        string;
  additionalCharges:  AdditionalCharge[];
  selectedDates:      string[];
  itineraryDays:      ItineraryDay[];
  activeDayId:        string;
  inclusions:         string[];
  exclusions:         string[];
};

type StepProps = { form: TourFormState; update: (patch: Partial<TourFormState>) => void };

const STEP_LABELS = ['Tour Details', 'Pricing & Availability', 'Itinerary', 'Inclusions & Exclusions', 'Summary'];
const DESTINATION_OPTIONS = TOUR_PACKAGES.map((p) => p.destination);
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAY_LABELS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function generateTourCode(): string {
  return `TRK-${Math.floor(100000 + Math.random() * 900000)}`;
}

function createInitialForm(): TourFormState {
  const day1: ItineraryDay = {
    id: 'day1', title: 'Arrival', startTime: '', endTime: '', location: '',
    description: '', meals: { breakfast: false, lunch: false, dinner: false }, accommodation: '',
  };
  return {
    destination: '', tourName: '', duration: '', category: '', status: 'Active',
    shortDescription: '', tourCode: generateTourCode(), flightType: FLIGHT_TYPE_OPTIONS[0],
    adultPrice: '', childPrice: '', infantPrice: '', additionalCharges: [],
    selectedDates: [], itineraryDays: [day1], activeDayId: day1.id,
    inclusions: [], exclusions: [],
  };
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
function formatShortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTH_NAMES[m - 1].slice(0, 3)} ${d}`;
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
const UploadIcon = ({ color = LIGHT_C.amber }: { color?: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M12 16V4M7 9l5-5 5 5M4 20h16" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
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

type SelectOption = { value: string; label: string };
const SelectModal = ({
  visible, title, options, selected, onSelect, onClose,
}: { visible: boolean; title: string; options: SelectOption[]; selected: string; onSelect: (v: string) => void; onClose: () => void }) => {
  const { C } = useAppTheme();
  const aw = useMemo(() => makeStyles(C), [C]);
  if (!visible) return null;
  return (
    <View style={aw.pmBackdropWrap} pointerEvents="box-none">
      <TouchableOpacity style={aw.pmBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={aw.pmSheet}>
        <Text style={aw.pmTitle}>{title}</Text>
        <ScrollView style={{ maxHeight: 340 }}>
          {options.map((opt) => {
            const isSelected = opt.value === selected;
            return (
              <TouchableOpacity key={opt.value} style={aw.pmRow} activeOpacity={0.75} onPress={() => { onSelect(opt.value); onClose(); }}>
                <Text style={[aw.pmRowText, isSelected && aw.pmRowTextSelected]}>{opt.label}</Text>
                {isSelected && <CheckIcon size={14} color={C.amber} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
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
const MiniCalendar = ({ selectedDates, onToggleDate }: { selectedDates: string[]; onToggleDate: (iso: string) => void }) => {
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
          return (
            <TouchableOpacity
              key={cell.iso}
              style={aw.calDayCell}
              activeOpacity={cell.inMonth ? 0.7 : 1}
              disabled={!cell.inMonth}
              onPress={() => onToggleDate(cell.iso)}
            >
              <View style={[aw.calDayNumWrap, isSelected && aw.calDayNumSelected, isToday && !isSelected && aw.calDayNumToday]}>
                <Text style={[aw.calDayNumText, !cell.inMonth && aw.calDayNumTextDim, isSelected && aw.calDayNumTextSelected]}>{cell.day}</Text>
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
  const [openPicker, setOpenPicker] = useState<'destination' | 'category' | 'status' | 'flight' | null>(null);

  return (
    <View style={{ gap: 14 }}>
      <View style={aw.card}>
        <Text style={aw.cardTitle}>Basic Information</Text>
        <Text style={aw.cardSub}>Provide the basic details about your tour package.</Text>

        <FieldLabel>Destination</FieldLabel>
        <TouchableOpacity style={aw.selectBox} activeOpacity={0.8} onPress={() => setOpenPicker('destination')}>
          <Text style={[aw.selectText, !form.destination && aw.placeholderText]} numberOfLines={1}>{form.destination || 'Select destination'}</Text>
          <ChevronDownIcon />
        </TouchableOpacity>

        <FieldLabel>Tour Name</FieldLabel>
        <TextInput
          style={aw.input} placeholder="Enter tour title" placeholderTextColor={C.brownMid + '80'}
          value={form.tourName} onChangeText={(t) => update({ tourName: t })}
        />

        <FieldLabel>Duration</FieldLabel>
        <TextInput
          style={aw.input} placeholder="5 days, 4 nights" placeholderTextColor={C.brownMid + '80'}
          value={form.duration} onChangeText={(t) => update({ duration: t })}
        />

        <View style={aw.row2}>
          <View style={{ flex: 1 }}>
            <FieldLabel>Tour Category</FieldLabel>
            <TouchableOpacity style={aw.selectBox} activeOpacity={0.8} onPress={() => setOpenPicker('category')}>
              <Text style={[aw.selectText, !form.category && aw.placeholderText]} numberOfLines={1}>{form.category || 'Select Category'}</Text>
              <ChevronDownIcon />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <FieldLabel>Status</FieldLabel>
            <TouchableOpacity style={aw.selectBox} activeOpacity={0.8} onPress={() => setOpenPicker('status')}>
              <Text style={aw.selectText}>{form.status}</Text>
              <ChevronDownIcon />
            </TouchableOpacity>
          </View>
        </View>

        <FieldLabel>Short Description</FieldLabel>
        <TextInput
          style={[aw.input, aw.textarea]} placeholder="Enter a short description about the tour..." placeholderTextColor={C.brownMid + '80'}
          multiline maxLength={300} value={form.shortDescription} onChangeText={(t) => update({ shortDescription: t })}
        />
        <Text style={aw.counterText}>{form.shortDescription.length}/300</Text>

        <View style={aw.row2}>
          <View style={{ flex: 1 }}>
            <FieldLabel>Tour Code</FieldLabel>
            <View style={[aw.input, aw.inputDisabled]}>
              <Text style={aw.disabledText}>{form.tourCode}</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <FieldLabel>Flight Type</FieldLabel>
            <TouchableOpacity style={aw.selectBox} activeOpacity={0.8} onPress={() => setOpenPicker('flight')}>
              <Text style={aw.selectText}>{form.flightType}</Text>
              <ChevronDownIcon />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={aw.card}>
        <Text style={aw.cardTitle}>Tour Image Preview</Text>
        <Text style={aw.cardSub}>This image will represent your tour package.</Text>

        <View style={aw.uploadBox}>
          <UploadIcon />
          <Text style={aw.uploadTitle}>Upload Cover Image</Text>
          <Text style={aw.uploadHint}>JPG, PNG up to 5MB</Text>
          <View style={aw.chooseFileBtn}><Text style={aw.chooseFileText}>Choose File</Text></View>
        </View>

        <View style={aw.thumbRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={aw.thumbBox}><PlusIcon color={C.divider} /></View>
          ))}
        </View>

        <Text style={aw.guidelineTitle}>Image Guidelines</Text>
        <Text style={aw.guidelineItem}>• Recommended size 1200×800 px</Text>
        <Text style={aw.guidelineItem}>• Use high-quality images</Text>
        <Text style={aw.guidelineItem}>• Show the best view of the destination</Text>
      </View>

      <SelectModal visible={openPicker === 'destination'} title="Destination" options={DESTINATION_OPTIONS.map((d) => ({ value: d, label: d }))} selected={form.destination} onSelect={(v) => update({ destination: v })} onClose={() => setOpenPicker(null)} />
      <SelectModal visible={openPicker === 'category'} title="Tour Category" options={CATEGORY_OPTIONS.map((c) => ({ value: c, label: c }))} selected={form.category} onSelect={(v) => update({ category: v })} onClose={() => setOpenPicker(null)} />
      <SelectModal visible={openPicker === 'status'} title="Status" options={['Active', 'Draft', 'Inactive'].map((s) => ({ value: s, label: s }))} selected={form.status} onSelect={(v) => update({ status: v as TourFormState['status'] })} onClose={() => setOpenPicker(null)} />
      <SelectModal visible={openPicker === 'flight'} title="Flight Type" options={FLIGHT_TYPE_OPTIONS.map((f) => ({ value: f, label: f }))} selected={form.flightType} onSelect={(v) => update({ flightType: v })} onClose={() => setOpenPicker(null)} />
    </View>
  );
};

/* ════════════════════════════════════════
   STEP 2 — PRICING & AVAILABILITY
════════════════════════════════════════ */
const Step2PricingAvailability = ({ form, update }: StepProps) => {
  const { C } = useAppTheme();
  const aw = useMemo(() => makeStyles(C), [C]);
  const addCharge = () => update({ additionalCharges: [...form.additionalCharges, { id: `c${Date.now()}`, label: '', amount: '' }] });
  const updateCharge = (id: string, patch: Partial<AdditionalCharge>) =>
    update({ additionalCharges: form.additionalCharges.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  const removeCharge = (id: string) => update({ additionalCharges: form.additionalCharges.filter((c) => c.id !== id) });

  const adultNum = Number(form.adultPrice) || 0;
  const childNum = Number(form.childPrice) || 0;
  const infantNum = Number(form.infantPrice) || 0;

  const toggleDate = (iso: string) => {
    const has = form.selectedDates.includes(iso);
    update({ selectedDates: has ? form.selectedDates.filter((d) => d !== iso) : [...form.selectedDates, iso] });
  };

  return (
    <View style={{ gap: 14 }}>
      <View style={aw.card}>
        <Text style={aw.cardTitle}>Pricing and Rates</Text>
        <Text style={aw.cardSub}>Set the prices for your tour package.</Text>

        <Text style={aw.subheading}>Base Pricing (per person)</Text>
        <FieldLabel>Adult Price (12+ yrs)</FieldLabel>
        <View style={aw.priceInputWrap}>
          <Text style={aw.pesoSign}>₱</Text>
          <TextInput style={aw.priceInput} keyboardType="numeric" placeholder="0" placeholderTextColor={C.brownMid + '80'} value={form.adultPrice} onChangeText={(t) => update({ adultPrice: t.replace(/[^0-9]/g, '') })} />
        </View>
        <FieldLabel>Child Price (3–11 yrs)</FieldLabel>
        <View style={aw.priceInputWrap}>
          <Text style={aw.pesoSign}>₱</Text>
          <TextInput style={aw.priceInput} keyboardType="numeric" placeholder="0" placeholderTextColor={C.brownMid + '80'} value={form.childPrice} onChangeText={(t) => update({ childPrice: t.replace(/[^0-9]/g, '') })} />
        </View>
        <FieldLabel>Infant Price (0–2 yrs)</FieldLabel>
        <View style={aw.priceInputWrap}>
          <Text style={aw.pesoSign}>₱</Text>
          <TextInput style={aw.priceInput} keyboardType="numeric" placeholder="0" placeholderTextColor={C.brownMid + '80'} value={form.infantPrice} onChangeText={(t) => update({ infantPrice: t.replace(/[^0-9]/g, '') })} />
        </View>

        <Text style={aw.subheading}>Additional Charges</Text>
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

        <View style={aw.summaryBox}>
          <Text style={aw.summaryTitle}>Price Summary (per person)</Text>
          <View style={aw.summaryRow}><Text style={aw.summaryLabel}>Adult Price</Text><Text style={aw.summaryValue}>{formatPeso(adultNum)}</Text></View>
          <View style={aw.summaryRow}><Text style={aw.summaryLabel}>Child Price</Text><Text style={aw.summaryValue}>{formatPeso(childNum)}</Text></View>
          <View style={aw.summaryRow}><Text style={aw.summaryLabel}>Infant Price</Text><Text style={aw.summaryValue}>{formatPeso(infantNum)}</Text></View>
          <Text style={aw.summaryNote}>*Final price may vary based on selected dates and availability.</Text>
        </View>
      </View>

      <View style={aw.card}>
        <Text style={aw.cardTitle}>Availability</Text>
        <Text style={aw.cardSub}>Set the available dates for this tour package.</Text>

        <MiniCalendar selectedDates={form.selectedDates} onToggleDate={toggleDate} />

        <View style={aw.multiSelectRow}>
          <View style={{ flex: 1 }}>
            <Text style={aw.multiSelectTitle}>Multiple Date Selection</Text>
            <Text style={aw.multiSelectHint}>Tap dates to set them as available</Text>
          </View>
          <TouchableOpacity style={aw.clearAllBtn} activeOpacity={0.8} onPress={() => update({ selectedDates: [] })}>
            <Text style={aw.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        <View style={aw.selectedDatesBox}>
          <Text style={aw.selectedDatesTitle}>Selected Dates ({form.selectedDates.length})</Text>
          {form.selectedDates.length === 0 ? (
            <Text style={aw.emptyHint}>No dates selected yet.</Text>
          ) : (
            <View style={aw.dateChipsRow}>
              {[...form.selectedDates].sort().map((d) => (
                <View key={d} style={aw.dateChip}><Text style={aw.dateChipText}>{formatShortDate(d)}</Text></View>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
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

  const addDay = () => {
    const newDay: ItineraryDay = {
      id: `day${Date.now()}`, title: '', startTime: '', endTime: '', location: '',
      description: '', meals: { breakfast: false, lunch: false, dinner: false }, accommodation: '',
    };
    update({ itineraryDays: [...form.itineraryDays, newDay], activeDayId: newDay.id });
  };
  const removeDay = (id: string) => {
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
          <TouchableOpacity style={aw.smallAddBtn} activeOpacity={0.85} onPress={addDay}>
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
        <Text style={aw.dragHint}>Tap a day to edit its details.</Text>
      </View>

      {activeDay && (
        <View style={aw.card}>
          <View style={aw.rowBetween}>
            <Text style={aw.cardTitle} numberOfLines={1}>
              Day {activeIndex + 1}{activeDay.title ? `: ${activeDay.title}` : ''}
            </Text>
            {form.itineraryDays.length > 1 && (
              <TouchableOpacity onPress={() => removeDay(activeDay.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <TrashIcon />
              </TouchableOpacity>
            )}
          </View>

          <FieldLabel>Day Title</FieldLabel>
          <TextInput style={aw.input} placeholder="Arrival in Manila" placeholderTextColor={C.brownMid + '80'} value={activeDay.title} onChangeText={(t) => updateDay(activeDay.id, { title: t })} />

          <View style={aw.row2}>
            <View style={{ flex: 1 }}>
              <FieldLabel>Start Time</FieldLabel>
              <TextInput style={aw.input} placeholder="08:00 AM" placeholderTextColor={C.brownMid + '80'} value={activeDay.startTime} onChangeText={(t) => updateDay(activeDay.id, { startTime: t })} />
            </View>
            <View style={{ flex: 1 }}>
              <FieldLabel>End Time</FieldLabel>
              <TextInput style={aw.input} placeholder="06:00 PM" placeholderTextColor={C.brownMid + '80'} value={activeDay.endTime} onChangeText={(t) => updateDay(activeDay.id, { endTime: t })} />
            </View>
          </View>

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

          <FieldLabel>Accommodation</FieldLabel>
          <TextInput style={aw.input} placeholder="Hotel name (optional)" placeholderTextColor={C.brownMid + '80'} value={activeDay.accommodation} onChangeText={(t) => updateDay(activeDay.id, { accommodation: t })} />

          <FieldLabel>Route Map</FieldLabel>
          <View style={aw.routeMapBox}>
            <Text style={aw.routeMapText}>Route map preview</Text>
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
  const adultNum = Number(form.adultPrice) || 0;
  const childNum = Number(form.childPrice) || 0;
  const infantNum = Number(form.infantPrice) || 0;

  return (
    <View style={{ gap: 14 }}>
      <View style={aw.card}>
        <View style={aw.rowBetween}>
          <Text style={aw.cardTitle}>Basic Information</Text>
          <TouchableOpacity onPress={() => goToStep(0)}><Text style={aw.editLink}>Edit</Text></TouchableOpacity>
        </View>
        <SummaryLine label="Destination" value={form.destination || '—'} />
        <SummaryLine label="Tour Name" value={form.tourName || '—'} />
        <SummaryLine label="Tour Code" value={form.tourCode} bold />
        <SummaryLine label="Duration" value={form.duration || '—'} />
        <SummaryLine label="Status" value={form.status} bold />
      </View>

      <View style={aw.card}>
        <View style={aw.rowBetween}>
          <Text style={aw.cardTitle}>Pricing & Rates</Text>
          <TouchableOpacity onPress={() => goToStep(1)}><Text style={aw.editLink}>Edit</Text></TouchableOpacity>
        </View>
        <SummaryLine label="Adult Price (12+ yrs)" value={formatPeso(adultNum)} />
        <SummaryLine label="Child Price (3–11 yrs)" value={formatPeso(childNum)} />
        <SummaryLine label="Infant Price (0–2 yrs)" value={formatPeso(infantNum)} />
      </View>

      <View style={aw.card}>
        <View style={aw.rowBetween}>
          <Text style={aw.cardTitle}>Availability</Text>
          <TouchableOpacity onPress={() => goToStep(1)}><Text style={aw.editLink}>Edit</Text></TouchableOpacity>
        </View>
        <SummaryLine label="Available Dates" value={form.selectedDates.length ? `${form.selectedDates.length} selected` : 'None selected'} />
        <SummaryLine label="Status" value="Available" bold color="#12946F" />
      </View>

      <View style={aw.card}>
        <Text style={aw.cardTitle}>Tour Package Preview</Text>
        <LinearGradient colors={['#6B2E10', '#B85F17', '#D17B2E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={aw.previewBanner}>
          <PlaneWatermarkIcon />
        </LinearGradient>
        <Text style={[aw.cardTitle, { marginTop: 10 }]}>{form.destination || '—'}</Text>
        <View style={aw.previewMetaRow}>
          <View><Text style={aw.previewMetaLabel}>Duration</Text><Text style={aw.previewMetaValue}>{form.duration || '—'}</Text></View>
          <View><Text style={aw.previewMetaLabel}>Guests</Text><Text style={aw.previewMetaValue}>2 Adults</Text></View>
        </View>
        <View style={aw.previewPriceBox}>
          <Text style={aw.previewPriceLabel}>From</Text>
          <Text style={aw.previewPriceValue}>{formatPeso(adultNum)} / Adult</Text>
        </View>
        <View style={{ gap: 6, marginTop: 10 }}>
          <Text style={aw.previewBullet}>✓ Confirmed bookings instantly</Text>
          <Text style={aw.previewBullet}>✓ Hassle-free travel</Text>
          <Text style={aw.previewBullet}>✓ Free cancellation up to 7 days</Text>
        </View>
        <View style={aw.lookGoodBox}>
          <Text style={aw.lookGoodTitle}>Looks Good?</Text>
          <Text style={aw.lookGoodText}>Once published, this tour package will be visible to travelers on the app.</Text>
        </View>
      </View>
    </View>
  );
};

/* ════════════════════════════════════════
   STEP INDICATOR
════════════════════════════════════════ */
const StepIndicator = ({ currentStep, onStepPress }: { currentStep: number; onStepPress: (i: number) => void }) => {
  const { C } = useAppTheme();
  const aw = useMemo(() => makeStyles(C), [C]);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={aw.stepBar} contentContainerStyle={aw.stepBarContent}>
      {STEP_LABELS.map((label, i) => {
        const isDone = i < currentStep;
        const isCurrent = i === currentStep;
        return (
          <React.Fragment key={label}>
            {i > 0 && <View style={[aw.stepConnector, (isDone || isCurrent) && aw.stepConnectorActive]} />}
            <TouchableOpacity style={aw.stepItem} activeOpacity={0.7} disabled={i > currentStep} onPress={() => onStepPress(i)}>
              <View style={[aw.stepCircle, isDone && aw.stepCircleDone, isCurrent && aw.stepCircleCurrent]}>
                <Text style={[aw.stepCircleText, (isDone || isCurrent) && aw.stepCircleTextActive]}>{i + 1}</Text>
              </View>
              <Text style={[aw.stepLabel, isCurrent && aw.stepLabelCurrent, isDone && aw.stepLabelDone]} numberOfLines={1}>{label}</Text>
            </TouchableOpacity>
          </React.Fragment>
        );
      })}
    </ScrollView>
  );
};

/* ════════════════════════════════════════
   MAIN MODAL
════════════════════════════════════════ */
type Props = { visible: boolean; onClose: () => void };

export default function AddTourPackageModal({ visible, onClose }: Props) {
  const { C } = useAppTheme();
  const aw = useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<TourFormState>(createInitialForm);

  const update = (patch: Partial<TourFormState>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleClose = () => {
    onClose();
    setStep(0);
    setForm(createInitialForm());
  };

  const goNext = () => setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
  const goPrev = () => setStep((s) => Math.max(s - 1, 0));
  const isLastStep = step === STEP_LABELS.length - 1;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose} statusBarTranslucent>
      <View style={aw.safe}>
        <LinearGradient
          colors={['#6B2E10', '#B85F17', '#D17B2E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[aw.header, { paddingTop: insets.top + 14 }]}
        >
          <View style={aw.headerTopRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={aw.headerTitle}>Add New Tour Package</Text>
              <Text style={aw.headerSub}>Follow the steps to create a complete and amazing tour package.</Text>
            </View>
            <TouchableOpacity style={aw.backToToursBtn} activeOpacity={0.85} onPress={handleClose}>
              <BackIcon />
              <Text style={aw.backToToursText}>Back to Tours</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

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
            <View style={aw.footerRow}>
              <TouchableOpacity style={aw.cancelBtn} activeOpacity={0.8} onPress={handleClose}>
                <Text style={aw.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={aw.saveDraftBtn} activeOpacity={0.8} onPress={handleClose}>
                <Text style={aw.saveDraftText}>Save as Draft</Text>
              </TouchableOpacity>
            </View>
            <View style={aw.footerRow}>
              {step > 0 && (
                <TouchableOpacity style={aw.prevBtn} activeOpacity={0.8} onPress={goPrev}>
                  <Text style={aw.prevText}>← Previous</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={aw.nextBtn} activeOpacity={0.85} onPress={isLastStep ? handleClose : goNext}>
                <Text style={aw.nextText}>{isLastStep ? 'Publish Tour' : 'Next Step →'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

/* ════════════════════════════════════════
   STYLES
════════════════════════════════════════ */
const makeStyles = (C: ColorPalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.lightBg },

  header: { paddingBottom: 16, paddingHorizontal: 18 },
  headerTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.2 },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 4, lineHeight: 15 },
  backToToursBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 7, flexShrink: 0,
  },
  backToToursText: { fontSize: 10.5, fontWeight: '800', color: '#FFFFFF' },

  stepBar: { backgroundColor: C.cardBg, borderBottomWidth: 1, borderBottomColor: C.divider, flexGrow: 0 },
  stepBarContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 4 },
  stepItem: { alignItems: 'center', width: 78 },
  stepCircle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: C.lightBg, borderWidth: 1.5, borderColor: C.divider,
    alignItems: 'center', justifyContent: 'center',
  },
  stepCircleDone: { backgroundColor: '#12946F', borderColor: '#12946F' },
  stepCircleCurrent: { backgroundColor: C.amber, borderColor: C.amber },
  stepCircleText: { fontSize: 10.5, fontWeight: '800', color: C.brownMid },
  stepCircleTextActive: { color: '#FFFFFF' },
  stepLabel: { fontSize: 8.5, fontWeight: '700', color: C.brownMid, opacity: 0.6, marginTop: 4, textAlign: 'center' },
  stepLabelCurrent: { color: C.amber, opacity: 1, fontWeight: '800' },
  stepLabelDone: { color: '#12946F', opacity: 1 },
  stepConnector: { width: 18, height: 1.5, backgroundColor: C.divider, marginBottom: 16 },
  stepConnectorActive: { backgroundColor: '#12946F' },

  body: { padding: 16, paddingBottom: 24 },
  card: {
    backgroundColor: C.cardBg, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.divider,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1 },
    }),
  },
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
  inputDisabled: { backgroundColor: C.divider + '33', justifyContent: 'center' },
  disabledText: { fontSize: 13, color: C.brownMid, fontWeight: '700' },

  uploadBox: {
    borderWidth: 1.5, borderColor: C.divider, borderStyle: 'dashed', borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', paddingVertical: 26, gap: 4,
    backgroundColor: C.lightBg,
  },
  uploadTitle: { fontSize: 12.5, fontWeight: '800', color: C.brown, marginTop: 4 },
  uploadHint: { fontSize: 10.5, color: C.brownMid, opacity: 0.7 },
  chooseFileBtn: { marginTop: 8, borderWidth: 1.5, borderColor: C.amber, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  chooseFileText: { fontSize: 11, fontWeight: '800', color: C.amber },
  thumbRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  thumbBox: {
    flex: 1, aspectRatio: 1.4, borderRadius: 10,
    borderWidth: 1.5, borderColor: C.divider, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', backgroundColor: C.lightBg,
  },
  guidelineTitle: { fontSize: 11.5, fontWeight: '800', color: C.brown, marginTop: 14, marginBottom: 4 },
  guidelineItem: { fontSize: 10.5, color: C.brownMid, opacity: 0.75, lineHeight: 16 },

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
  summaryBox: { marginTop: 16, backgroundColor: C.lightBg, borderRadius: 12, padding: 12, gap: 6 },
  summaryTitle: { fontSize: 11.5, fontWeight: '800', color: C.brown, marginBottom: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 12, color: C.brownMid },
  summaryValue: { fontSize: 12, fontWeight: '800', color: C.amber },
  summaryNote: { fontSize: 9.5, color: C.brownMid, opacity: 0.65, fontStyle: 'italic', marginTop: 4 },

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

  mealsRow: { flexDirection: 'row', gap: 16, marginTop: 2 },
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

  previewBanner: { height: 84, borderRadius: 12, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 14, marginTop: 4 },
  previewMetaRow: { flexDirection: 'row', gap: 24, marginTop: 8 },
  previewMetaLabel: { fontSize: 9.5, fontWeight: '800', color: C.brownMid, opacity: 0.6, letterSpacing: 0.3 },
  previewMetaValue: { fontSize: 12, fontWeight: '700', color: C.brown, marginTop: 2 },
  previewPriceBox: { marginTop: 12, backgroundColor: C.lightBg, borderRadius: 12, padding: 12 },
  previewPriceLabel: { fontSize: 10, color: C.brownMid, opacity: 0.7 },
  previewPriceValue: { fontSize: 16, fontWeight: '900', color: C.amber, marginTop: 2 },
  previewBullet: { fontSize: 11.5, color: '#12946F', fontWeight: '600' },
  lookGoodBox: { marginTop: 12, backgroundColor: '#FFF5E0', borderRadius: 12, padding: 12 },
  lookGoodTitle: { fontSize: 11.5, fontWeight: '800', color: C.brown },
  lookGoodText: { fontSize: 10.5, color: C.brownMid, opacity: 0.8, marginTop: 3, lineHeight: 15 },

  footer: {
    paddingHorizontal: 16, paddingTop: 10,
    backgroundColor: C.cardBg, borderTopWidth: 1, borderTopColor: C.divider,
    gap: 8,
  },
  footerRow: { flexDirection: 'row', gap: 8 },
  cancelBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: 22, borderWidth: 1.5, borderColor: C.divider },
  cancelText: { fontSize: 12.5, fontWeight: '800', color: C.brownMid },
  saveDraftBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: 22, borderWidth: 1.5, borderColor: '#12946F' },
  saveDraftText: { fontSize: 12.5, fontWeight: '800', color: '#12946F' },
  prevBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 22, borderWidth: 1.5, borderColor: C.amber },
  prevText: { fontSize: 12.5, fontWeight: '800', color: C.amber },
  nextBtn: {
    flex: 1.4, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 22,
    backgroundColor: C.amber,
    ...Platform.select({
      ios:     { shadowColor: C.amber, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 2 },
    }),
  },
  nextText: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' },

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
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.divider + '55',
  },
  pmRowText: { fontSize: 13, color: C.brownMid, fontWeight: '600' },
  pmRowTextSelected: { color: C.amber, fontWeight: '800' },
});
