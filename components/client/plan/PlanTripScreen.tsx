/**
 * PlanTripScreen.tsx
 * Client "Plan a Trip" tab — a list of submitted trip requests (empty state
 * until the first one), and a multi-section form that builds a live summary
 * as you fill it in. No backend yet, so "Generate My Itinerary" just saves
 * the request locally as a "submitted" card rather than fabricating an
 * actual AI-built itinerary.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform, useWindowDimensions, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import Copyright from '@/components/Copyright';
import { C } from '../theme';
import ClientPageHero from '../ClientPageHero';
import {
  PersonalizedTrip, TripFormState, DEFAULT_FORM,
  BUDGET_PRESETS, TRIP_PACE_OPTIONS, ACCOMMODATION_OPTIONS, INTEREST_OPTIONS,
} from './mockData';

const WIDE_BREAKPOINT = 900;
const GRADIENT = ['#C46B1A', '#DC8B34'] as const;

/* ── Icons ── */
const PinIcon = ({ color = C.amber }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M12 21s7-7.58 7-12a7 7 0 10-14 0c0 4.42 7 12 7 12z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    <Circle cx={12} cy={9} r={2.4} stroke={color} strokeWidth={2} />
  </Svg>
);
const CalendarIcon = ({ color = C.brownMid }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M7 3v4M17 3v4M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const PlaneIcon = ({ color = '#FFFFFF' }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M2 16l7-2 3.5-7.5c.3-.6 1.2-.6 1.5 0L14 8l6.5-2c1-.3 2 .6 1.6 1.6l-2 6.5-2 3.5c-.2.4-.9.4-1 0l-1.5-3.5-7 3-4.5-.6c-.4 0-.6-.5-.3-.8L6 13" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const BackIcon = () => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
    <Path d="M15 19l-7-7 7-7" stroke={C.brown} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const TrashIcon = () => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-8 0v13a1 1 0 001 1h8a1 1 0 001-1V7" stroke={C.danger} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const CheckIcon = () => (
  <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
    <Path d="M4 12l6 6L20 6" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const money = (n: number) => `₱${n.toLocaleString('en-US')}`;
const genId = () => `pt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <LinearGradient colors={GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={sc.header}>
      <Text style={sc.headerTitle}>{title}</Text>
      <Text style={sc.headerSub}>{subtitle}</Text>
    </LinearGradient>
  );
}

function SummaryRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={sm.row}>
      <Text style={sm.rowIcon}>{icon}</Text>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={sm.rowLabel}>{label}</Text>
        <Text style={sm.rowValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

/* ── Trip request card (list view) ── */
function TripCard({ trip, onRemove }: { trip: PersonalizedTrip; onRemove: () => void }) {
  const dates = trip.dateFrom || trip.dateTo ? `${trip.dateFrom || '—'} – ${trip.dateTo || '—'}` : 'Dates flexible';
  return (
    <View style={tc.card}>
      <View style={tc.topRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={tc.dest} numberOfLines={1}>{trip.destination}</Text>
          <Text style={tc.meta}>{dates} · {trip.travelers} {trip.travelers === 1 ? 'Traveler' : 'Travelers'}</Text>
        </View>
        <TouchableOpacity style={tc.trashBtn} activeOpacity={0.8} onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <TrashIcon />
        </TouchableOpacity>
      </View>
      <View style={tc.tagWrap}>
        <View style={tc.tag}><Text style={tc.tagText}>{trip.tripPace}</Text></View>
        <View style={tc.tag}><Text style={tc.tagText}>{trip.accommodation}</Text></View>
        <View style={tc.tag}><Text style={tc.tagText}>{trip.budgetRange || 'Budget not set'}</Text></View>
      </View>
      {trip.interests.length > 0 && (
        <Text style={tc.interests} numberOfLines={1}>Interests: {trip.interests.join(', ')}</Text>
      )}
      <View style={tc.statusBox}>
        <Text style={tc.statusText}>✓ Request submitted — our team will get back to you with a personalized itinerary.</Text>
      </View>
    </View>
  );
}

export default function PlanTripScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;

  const [view, setView] = useState<'list' | 'form'>('list');
  const [trips, setTrips] = useState<PersonalizedTrip[]>([]);
  const [form, setForm] = useState<TripFormState>(DEFAULT_FORM);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const set = <K extends keyof TripFormState>(key: K, value: TripFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleInterest = (label: string) =>
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(label) ? f.interests.filter((i) => i !== label) : [...f.interests, label],
    }));

  const startNewTrip = () => {
    setForm(DEFAULT_FORM);
    setError('');
    setView('form');
  };

  const generateItinerary = () => {
    if (!form.destination.trim()) {
      setError('Please tell us where you want to go.');
      return;
    }
    setError('');
    setGenerating(true);
    timerRef.current = setTimeout(() => {
      const trip: PersonalizedTrip = {
        id: genId(),
        destination: form.destination.trim(),
        dateFrom: form.dateFrom.trim(),
        dateTo: form.dateTo.trim(),
        travelers: form.travelers,
        budgetRange: form.customBudget.trim() ? money(Number(form.customBudget) || 0) : form.budgetRange,
        tripPace: form.tripPace,
        accommodation: form.accommodation,
        interests: form.interests,
        specialRequests: form.specialRequests.trim(),
        createdAt: new Date().toISOString(),
      };
      setTrips((prev) => [trip, ...prev]);
      setGenerating(false);
      setView('list');
    }, 900);
  };

  const removeTrip = (id: string) => setTrips((prev) => prev.filter((t) => t.id !== id));

  const summaryDates = form.dateFrom || form.dateTo ? `${form.dateFrom || '—'} – ${form.dateTo || '—'}` : '—';
  const summaryBudget = form.customBudget.trim() ? money(Number(form.customBudget) || 0) : (form.budgetRange || 'Not set');

  const summaryCard = (
    <View style={sm.card}>
      <LinearGradient colors={GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={sm.header}>
        <PlaneIcon />
        <Text style={sm.headerTitle}>Your Trip Summary</Text>
      </LinearGradient>
      <View style={sm.body}>
        <SummaryRow icon="📍" label="DESTINATION" value={form.destination || '—'} />
        <SummaryRow icon="📅" label="TRAVEL DATES" value={summaryDates} />
        <SummaryRow icon="👤" label="TRAVELERS" value={`${form.travelers} ${form.travelers === 1 ? 'Adult' : 'Adults'}`} />
        <SummaryRow icon="🚀" label="TRIP PACE" value={form.tripPace} />
        <SummaryRow icon="💰" label="BUDGET RANGE" value={summaryBudget} />
        <SummaryRow icon="🏨" label="ACCOMMODATION" value={form.accommodation} />
      </View>
    </View>
  );

  const formView = (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <ClientPageHero icon="✈️" title="Plan a Trip" subtitle="Tell us your preferences and we'll build a personalized itinerary for you." />

      <View style={{ paddingHorizontal: 16 }}>
        <TouchableOpacity style={ph.backBtn} activeOpacity={0.8} onPress={() => setView('list')}>
          <BackIcon />
          <Text style={ph.backBtnText}>Back to My Trips</Text>
        </TouchableOpacity>
        <Text style={ph.formTitle}>Let's personalize your trip</Text>
      </View>

      <View style={{ flexDirection: isWide ? 'row' : 'column', alignItems: 'flex-start', paddingHorizontal: 16, gap: 16, marginTop: 14 }}>
        <View style={{ flex: 1, minWidth: 0, width: '100%' }}>
          {!isWide && summaryCard}

          <View style={sc.card}>
            <SectionHeader title="Trip Information" subtitle="Where and when do you want to travel?" />
            <View style={sc.body}>
              <Text style={fm.label}>Destination</Text>
              <View style={fm.inputRow}>
                <PinIcon />
                <TextInput
                  style={fm.inputFlex}
                  placeholder="e.g. Palawan, Philippines"
                  placeholderTextColor={C.brownMid + '80'}
                  value={form.destination}
                  onChangeText={(v) => set('destination', v)}
                />
              </View>

              <View style={fm.fieldRow}>
                <View style={{ flex: 1, minWidth: 130 }}>
                  <Text style={fm.label}>Date From</Text>
                  <View style={fm.inputRow}>
                    <TextInput
                      style={fm.inputFlex}
                      placeholder="mm/dd/yyyy"
                      placeholderTextColor={C.brownMid + '80'}
                      value={form.dateFrom}
                      onChangeText={(v) => set('dateFrom', v)}
                    />
                    <CalendarIcon />
                  </View>
                </View>
                <View style={{ flex: 1, minWidth: 130 }}>
                  <Text style={fm.label}>Date To</Text>
                  <View style={fm.inputRow}>
                    <TextInput
                      style={fm.inputFlex}
                      placeholder="mm/dd/yyyy"
                      placeholderTextColor={C.brownMid + '80'}
                      value={form.dateTo}
                      onChangeText={(v) => set('dateTo', v)}
                    />
                    <CalendarIcon />
                  </View>
                </View>
              </View>

              <Text style={fm.label}>Number of Travelers</Text>
              <View style={fm.stepperRow}>
                <TouchableOpacity style={fm.stepperBtn} activeOpacity={0.8} onPress={() => set('travelers', Math.max(1, form.travelers - 1))}>
                  <Text style={fm.stepperBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={fm.stepperValue}>{form.travelers}</Text>
                <TouchableOpacity style={fm.stepperBtn} activeOpacity={0.8} onPress={() => set('travelers', Math.min(20, form.travelers + 1))}>
                  <Text style={fm.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={sc.card}>
            <SectionHeader title="Budget Range" subtitle="What's your budget for this trip?" />
            <View style={sc.body}>
              <View style={fm.pillGrid}>
                {BUDGET_PRESETS.map((preset) => {
                  const active = form.budgetRange === preset;
                  return (
                    <TouchableOpacity
                      key={preset}
                      style={[fm.budgetPill, active && fm.budgetPillActive]}
                      activeOpacity={0.8}
                      onPress={() => { set('budgetRange', preset); set('customBudget', ''); }}
                    >
                      <Text style={[fm.budgetPillText, active && fm.budgetPillTextActive]}>{preset}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={[fm.label, { marginTop: 14 }]}>Custom Budget (optional)</Text>
              <View style={fm.inputRow}>
                <Text style={{ color: C.brownMid, fontWeight: '700' }}>₱</Text>
                <TextInput
                  style={fm.inputFlex}
                  placeholder="Enter amount"
                  placeholderTextColor={C.brownMid + '80'}
                  value={form.customBudget}
                  onChangeText={(v) => { set('customBudget', v); if (v.trim()) set('budgetRange', ''); }}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View style={sc.card}>
            <SectionHeader title="Trip Pace" subtitle="How fast-paced do you want your trip to be?" />
            <View style={sc.body}>
              {TRIP_PACE_OPTIONS.map((opt) => {
                const active = form.tripPace === opt.key;
                return (
                  <TouchableOpacity key={opt.key} style={[fm.optionRow, active && fm.optionRowActive]} activeOpacity={0.8} onPress={() => set('tripPace', opt.key)}>
                    <Text style={{ fontSize: 20 }}>{opt.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={fm.optionTitle}>{opt.key}</Text>
                      <Text style={fm.optionDesc}>{opt.desc}</Text>
                    </View>
                    <View style={[fm.radio, active && fm.radioActive]}>{active && <View style={fm.radioDot} />}</View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={sc.card}>
            <SectionHeader title="Accommodation Preference" subtitle="What type of accommodation do you prefer?" />
            <View style={sc.body}>
              <View style={fm.accomGrid}>
                {ACCOMMODATION_OPTIONS.map((opt) => {
                  const active = form.accommodation === opt.key;
                  return (
                    <TouchableOpacity key={opt.key} style={[fm.accomCard, active && fm.accomCardActive]} activeOpacity={0.8} onPress={() => set('accommodation', opt.key)}>
                      <Text style={{ fontSize: 26 }}>{opt.emoji}</Text>
                      <Text style={fm.accomTitle}>{opt.key}</Text>
                      <Text style={fm.accomDesc}>{opt.desc}</Text>
                      <View style={[fm.radio, active && fm.radioActive]}>{active && <View style={fm.radioDot} />}</View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={sc.card}>
            <SectionHeader title="Interests" subtitle="Select all that apply" />
            <View style={sc.body}>
              <View style={fm.pillGrid}>
                {INTEREST_OPTIONS.map((opt) => {
                  const active = form.interests.includes(opt.label);
                  return (
                    <TouchableOpacity key={opt.label} style={[fm.interestPill, active && fm.interestPillActive]} activeOpacity={0.8} onPress={() => toggleInterest(opt.label)}>
                      {active && <View style={fm.interestCheck}><CheckIcon /></View>}
                      <Text style={{ fontSize: 13 }}>{opt.emoji}</Text>
                      <Text style={[fm.interestText, active && fm.interestTextActive]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={sc.card}>
            <SectionHeader title="Special Requests" subtitle="Anything specific we should know?" />
            <View style={sc.body}>
              <TextInput
                style={fm.textarea}
                placeholder="e.g. Honeymoon trip, senior-friendly itinerary, avoid strenuous activities..."
                placeholderTextColor={C.brownMid + '80'}
                value={form.specialRequests}
                onChangeText={(v) => set('specialRequests', v)}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          {!!error && <Text style={ph.errorText}>{error}</Text>}

          <TouchableOpacity style={ph.generateBtn} activeOpacity={0.85} onPress={generateItinerary} disabled={generating}>
            {generating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={ph.generateBtnText}>✨ Generate My Itinerary</Text>
            )}
          </TouchableOpacity>
        </View>

        {isWide && <View style={{ width: 300, flexShrink: 0 }}>{summaryCard}</View>}
      </View>

      <Copyright />
    </ScrollView>
  );

  const listView = (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      <ClientPageHero icon="✈️" title="Plan a Trip" subtitle="Tell us your preferences and we'll build a personalized itinerary for you." />

      <View style={lv.sectionHeaderRow}>
        <View>
          <Text style={lv.sectionTitle}>My Personalized Trips</Text>
          <Text style={lv.sectionSub}>Your custom itineraries and trip requests</Text>
        </View>
        {trips.length > 0 && (
          <TouchableOpacity style={lv.newTripBtn} activeOpacity={0.85} onPress={startNewTrip}>
            <PlaneIcon />
            <Text style={lv.newTripBtnText}>Plan New Trip</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        {trips.length === 0 ? (
          <View style={lv.emptyCard}>
            <Text style={{ fontSize: 44 }}>🗺️</Text>
            <Text style={lv.emptyTitle}>No personalized trips yet.</Text>
            <Text style={lv.emptyText}>Tell us where you want to go and we'll build a custom itinerary just for you.</Text>
            <TouchableOpacity style={lv.emptyBtn} activeOpacity={0.85} onPress={startNewTrip}>
              <PlaneIcon />
              <Text style={lv.emptyBtnText}>Plan My First Trip</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {trips.map((t) => <TripCard key={t.id} trip={t} onRemove={() => removeTrip(t.id)} />)}
          </View>
        )}
      </View>

      <Copyright />
    </ScrollView>
  );

  return (
    <View style={{ flex: 1 }}>
      {view === 'list' ? listView : formView}
    </View>
  );
}

/* ── Styles ── */
const lv = StyleSheet.create({
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 16, marginTop: 14, marginBottom: 12, flexWrap: 'wrap', gap: 10,
  },
  sectionTitle: { fontSize: 15.5, fontWeight: '900', color: C.brown },
  sectionSub: { fontSize: 11.5, color: C.brownMid, opacity: 0.75, marginTop: 2 },
  newTripBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.danger, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9,
  },
  newTripBtnText: { fontSize: 11.5, fontWeight: '800', color: '#FFFFFF' },

  emptyCard: {
    alignItems: 'center', backgroundColor: C.cardBg, borderRadius: 16, padding: 32,
    borderWidth: 1, borderColor: C.divider, borderStyle: 'dashed', gap: 8,
  },
  emptyTitle: { fontSize: 14.5, fontWeight: '900', color: C.brown, marginTop: 6 },
  emptyText: { fontSize: 12, color: C.brownMid, textAlign: 'center', maxWidth: 280, lineHeight: 17 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.danger, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12, marginTop: 10,
  },
  emptyBtnText: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' },
});

const tc = StyleSheet.create({
  card: { backgroundColor: C.cardBg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.divider },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  dest: { fontSize: 14.5, fontWeight: '900', color: C.brown },
  meta: { fontSize: 11, color: C.brownMid, opacity: 0.8, marginTop: 2 },
  trashBtn: { padding: 4 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: { backgroundColor: C.lightBg, borderWidth: 1, borderColor: C.divider, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 10, fontWeight: '700', color: C.brown },
  interests: { fontSize: 10.5, color: C.brownMid, opacity: 0.8, marginTop: 8 },
  statusBox: { backgroundColor: '#EFF8F0', borderRadius: 10, padding: 10, marginTop: 10 },
  statusText: { fontSize: 10.5, color: C.success, fontWeight: '600', lineHeight: 14 },
});

const ph = StyleSheet.create({
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.divider,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10,
  },
  backBtnText: { fontSize: 11.5, fontWeight: '800', color: C.brown },
  formTitle: { fontSize: 17, fontWeight: '900', color: C.brown },
  errorText: { fontSize: 11.5, color: C.danger, fontWeight: '700', marginTop: 6, textAlign: 'center' },
  generateBtn: {
    backgroundColor: C.danger, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 15, marginTop: 14, minHeight: 50,
    ...Platform.select({
      ios:     { shadowColor: C.danger, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 3 },
    }),
  },
  generateBtnText: { fontSize: 13.5, fontWeight: '900', color: '#FFFFFF' },
});

const sc = StyleSheet.create({
  card: {
    backgroundColor: C.cardBg, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: C.divider, marginBottom: 14, width: '100%',
  },
  header: { paddingHorizontal: 14, paddingVertical: 12 },
  headerTitle: { fontSize: 13.5, fontWeight: '900', color: '#FFFFFF' },
  headerSub: { fontSize: 10.5, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  body: { padding: 14 },
});

const fm = StyleSheet.create({
  label: { fontSize: 11, fontWeight: '800', color: C.brown, marginBottom: 6, marginTop: 10 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: C.divider, backgroundColor: C.lightBg, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  inputFlex: { flex: 1, fontSize: 12.5, color: C.brown, padding: 0 },
  fieldRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

  stepperRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.divider, borderRadius: 10, overflow: 'hidden' },
  stepperBtn: { width: 44, height: 44, backgroundColor: C.lightBg, alignItems: 'center', justifyContent: 'center' },
  stepperBtnText: { fontSize: 18, fontWeight: '900', color: C.brown },
  stepperValue: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '800', color: C.brown },

  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  budgetPill: {
    flexGrow: 1, flexBasis: '46%', alignItems: 'center', borderWidth: 1.5, borderColor: C.brown,
    borderRadius: 24, paddingVertical: 12, paddingHorizontal: 10,
  },
  budgetPillActive: { backgroundColor: C.brown },
  budgetPillText: { fontSize: 11.5, fontWeight: '800', color: C.brown },
  budgetPillTextActive: { color: '#FFFFFF' },

  optionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: C.divider, borderRadius: 12, padding: 12, marginBottom: 10,
  },
  optionRowActive: { borderColor: C.amber, backgroundColor: C.lightBg },
  optionTitle: { fontSize: 12.5, fontWeight: '900', color: C.brown },
  optionDesc: { fontSize: 10.5, color: C.brownMid, opacity: 0.8, marginTop: 1 },

  accomGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  accomCard: {
    flexGrow: 1, flexBasis: 100, alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: C.divider, borderRadius: 12, paddingVertical: 16,
  },
  accomCardActive: { borderColor: C.amber, backgroundColor: C.lightBg },
  accomTitle: { fontSize: 12, fontWeight: '900', color: C.brown, marginTop: 2 },
  accomDesc: { fontSize: 10, color: C.brownMid, opacity: 0.8 },

  interestPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: C.divider, backgroundColor: C.lightBg,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8,
  },
  interestPillActive: { backgroundColor: C.brown, borderColor: C.brown },
  interestText: { fontSize: 11.5, fontWeight: '700', color: C.brown },
  interestTextActive: { color: '#FFFFFF' },
  interestCheck: { width: 14, height: 14, borderRadius: 7, backgroundColor: C.success, alignItems: 'center', justifyContent: 'center' },

  textarea: {
    borderWidth: 1, borderColor: C.divider, backgroundColor: C.lightBg, borderRadius: 10,
    padding: 12, fontSize: 12.5, color: C.brown, minHeight: 90, textAlignVertical: 'top',
  },

  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: C.divider, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: C.amber },
  radioDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: C.amber },
});

const sm = StyleSheet.create({
  card: { backgroundColor: C.cardBg, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.divider, marginBottom: 14, width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 12 },
  headerTitle: { fontSize: 13, fontWeight: '900', color: '#FFFFFF' },
  body: { padding: 14, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  rowIcon: { fontSize: 13 },
  rowLabel: { fontSize: 9.5, fontWeight: '800', color: C.brownMid, opacity: 0.7, letterSpacing: 0.4 },
  rowValue: { fontSize: 12.5, fontWeight: '800', color: C.brown, marginTop: 2 },
});
