/**
 * TourDetailModal.tsx
 * Full-screen "View Details" page for a tour package — cover photo banner
 * followed by the same summary content shown at the end of the "Add New
 * Tour Package" wizard (Basic Information, Availability & Pricing per Date
 * Range, and Itinerary).
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, TouchableOpacity, Text, ScrollView, StyleSheet, Image, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useAppTheme, ColorPalette } from '../ThemeContext';
import { TourPackage, TourDateBatch, TOUR_TYPE_META, formatPeso } from './mockData';
import { DEPARTURE_UPDATE_AVAILABILITY_API_URL } from '@/constants/api';

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function formatIsoDateShort(iso: string, withYear = false): string {
  const [y, m, d] = iso.split('-').map(Number);
  const base = `${MONTH_ABBR[(m || 1) - 1]} ${d}`;
  return withYear ? `${base}, ${y}` : base;
}
function formatDateRangeLabel(startIso: string, endIso: string): string {
  if (!endIso || endIso === startIso) return formatIsoDateShort(startIso, true);
  const sameYear = startIso.slice(0, 4) === endIso.slice(0, 4);
  return `${formatIsoDateShort(startIso, !sameYear)} – ${formatIsoDateShort(endIso, true)}`;
}

/* ── Icons ── */
const BackIcon = () => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
    <Path d="M15 19l-7-7 7-7" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const MapPinIcon = ({ color }: { color: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M12 21s-7-6.4-7-11.5A7 7 0 0119 9.5C19 14.6 12 21 12 21z" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
    <Path d="M12 11.5a2 2 0 100-4 2 2 0 000 4z" stroke={color} strokeWidth={1.7} />
  </Svg>
);
const ForkKnifeIcon = ({ color }: { color: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M7 2v7a2 2 0 002 2v11M7 2v7M9 2v7M5 2v7" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M17 2c-1.5 0-2.5 2-2.5 5s1 5 2.5 5v10" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const BuildingIcon = ({ color }: { color: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M4 21V5a1 1 0 011-1h9a1 1 0 011 1v16M15 21h5v-9a1 1 0 00-1-1h-4" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
    <Path d="M7.5 8h1M11.5 8h1M7.5 12h1M11.5 12h1M7.5 16h1M11.5 16h1" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
  </Svg>
);
const StarIcon = ({ size = 14, color }: { size?: number; color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2.5l2.9 6.1 6.6.7-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.1 1.3-6.6-4.9-4.6 6.6-.7L12 2.5z" fill={color} />
  </Svg>
);

const SummaryLine = ({ label, value, bold, td }: { label: string; value: string; bold?: boolean; td: ReturnType<typeof makeStyles> }) => (
  <View style={td.summaryLineRow}>
    <Text style={td.summaryLineLabel}>{label}</Text>
    <Text style={[td.summaryLineValue, bold && { fontWeight: '900' }]} numberOfLines={1}>{value}</Text>
  </View>
);

type Props = {
  visible: boolean;
  pkg:     TourPackage | null;
  onClose: () => void;
  onUpdated?: () => void;
};

export default function TourDetailModal({ visible, pkg, onClose, onUpdated }: Props) {
  const { C } = useAppTheme();
  const td = useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const [batches, setBatches] = useState<TourDateBatch[]>(pkg?.dateBatches ?? []);

  useEffect(() => {
    setBatches(pkg?.dateBatches ?? []);
  }, [pkg]);

  if (!pkg) return null;

  const typeMeta = TOUR_TYPE_META[pkg.tourType] ?? TOUR_TYPE_META.custom;

  const toggleAvailability = async (batchId: string, current: boolean) => {
    const next = !current;
    setBatches((prev) => prev.map((b) => (b.id === batchId ? { ...b, available: next } : b)));
    try {
      const res = await fetch(DEPARTURE_UPDATE_AVAILABILITY_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: batchId, available: next }),
      });
      const result = await res.json();
      if (result.status !== 'success') throw new Error(result.message || 'Update failed.');
      onUpdated?.();
    } catch (e) {
      setBatches((prev) => prev.map((b) => (b.id === batchId ? { ...b, available: current } : b)));
      Alert.alert('Update failed', e instanceof Error ? e.message : "Can't connect to the server.");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={td.safe}>
        <View style={td.header}>
          {pkg.imageUrl ? (
            <Image source={{ uri: pkg.imageUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          ) : (
            <LinearGradient colors={pkg.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
          )}

          <TouchableOpacity style={[td.backBtn, { top: insets.top + 14 }]} activeOpacity={0.85} onPress={onClose}>
            <BackIcon />
            <Text style={td.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={td.body}>
          <View style={td.card}>
            <Text style={td.cardTitle}>Basic Information</Text>
            {!!pkg.tourCode && <SummaryLine label="Tour Code" value={pkg.tourCode} bold td={td} />}
            <SummaryLine label="Tour Type" value={typeMeta.label} bold td={td} />
            <SummaryLine label="Destination" value={pkg.destination || '—'} td={td} />
            <SummaryLine label="Tour Name" value={pkg.name || '—'} td={td} />
            <SummaryLine label="Duration" value={pkg.duration || '—'} td={td} />
            <SummaryLine label="Status" value={pkg.status} bold td={td} />
          </View>

          <View style={td.card}>
            <Text style={td.cardTitle}>Availability & Pricing per Date Range</Text>
            {batches.length === 0 ? (
              <Text style={td.emptyHint}>No date ranges added yet.</Text>
            ) : (
              batches.map((b) => (
                <View key={b.id} style={td.batchRow}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={td.batchDates}>{formatDateRangeLabel(b.startDate, b.endDate)}</Text>
                    <Text style={td.batchSlots}>{formatPeso(b.adultPrice)} adult · {b.slots} slots</Text>
                    {b.downpayment > 0 && (
                      <Text style={td.batchDownpayment}>Downpayment: {formatPeso(b.downpayment)}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[td.availToggle, !b.available && td.availToggleOff]}
                    activeOpacity={0.8}
                    onPress={() => toggleAvailability(b.id, b.available)}
                  >
                    <Text style={[td.availToggleText, !b.available && td.availToggleTextOff]}>
                      {b.available ? 'Available' : 'Unavailable'}
                    </Text>
                    <View style={[td.miniSwitch, b.available && td.miniSwitchOn]}>
                      <View style={[td.miniSwitchThumb, b.available && td.miniSwitchThumbOn]} />
                    </View>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          <View style={td.card}>
            <Text style={td.cardTitle}>Itinerary</Text>
            {pkg.itinerary.length === 0 ? (
              <Text style={td.emptyHint}>No itinerary days added yet.</Text>
            ) : (
              pkg.itinerary.map((day) => {
                const mealsList = day.meals ?? [];
                const mealsText = mealsList.length ? mealsList.map((m) => m[0].toUpperCase() + m.slice(1)).join(', ') : '—';
                const activities = day.description.split('\n').map((s) => s.trim()).filter(Boolean);
                return (
                  <View key={day.day} style={td.dayCard}>
                    <View style={td.dayHeaderRow}>
                      <View style={td.dayBadge}><Text style={td.dayBadgeText}>DAY {day.day}</Text></View>
                    </View>

                    {!!day.photoUrl && <Image source={{ uri: day.photoUrl }} style={td.dayPhoto} />}

                    <View style={td.dayInfoRow}>
                      <View style={td.dayInfoCol}>
                        <View style={td.dayInfoIconWrap}><MapPinIcon color={C.amber} /></View>
                        <Text style={td.dayInfoLabel}>Location</Text>
                        <Text style={td.dayInfoValue} numberOfLines={1}>{day.location || '—'}</Text>
                      </View>
                      <View style={td.dayInfoDivider} />
                      <View style={td.dayInfoCol}>
                        <View style={td.dayInfoIconWrap}><ForkKnifeIcon color={C.amber} /></View>
                        <Text style={td.dayInfoLabel}>Meals</Text>
                        <Text style={td.dayInfoValue} numberOfLines={1}>{mealsText}</Text>
                      </View>
                      <View style={td.dayInfoDivider} />
                      <View style={td.dayInfoCol}>
                        <View style={td.dayInfoIconWrap}><BuildingIcon color={C.amber} /></View>
                        <Text style={td.dayInfoLabel}>Stay</Text>
                        <Text style={td.dayInfoValue} numberOfLines={1}>{day.accommodation || '—'}</Text>
                      </View>
                    </View>

                    {activities.length > 0 && (
                      <>
                        <View style={td.dayDivider} />
                        <View style={td.dayActivitiesHeader}>
                          <StarIcon size={14} color={C.amber} />
                          <Text style={td.dayActivitiesTitle}>Activities</Text>
                        </View>
                        <View style={td.activitiesGrid}>
                          {activities.map((line, idx) => (
                            <View key={idx} style={td.activityItem}>
                              <View style={td.activityDot} />
                              <Text style={td.activityText}>{line}</Text>
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
        </ScrollView>
      </View>
    </Modal>
  );
}

const makeStyles = (C: ColorPalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.lightBg },

  header: { width: '100%', aspectRatio: 16 / 9, position: 'relative', overflow: 'hidden' },
  backBtn: {
    position: 'absolute', left: 18,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 18,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  backText: { fontSize: 11.5, fontWeight: '800', color: '#FFFFFF' },

  body: { padding: 16, paddingBottom: 24, gap: 14 },
  card: {
    backgroundColor: C.cardBg, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.divider,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1 },
    }),
  },
  cardTitle: { fontSize: 14.5, fontWeight: '900', color: C.brown, marginBottom: 4 },
  emptyHint: { fontSize: 11, color: C.brownMid, opacity: 0.6 },

  summaryLineRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.divider },
  summaryLineLabel: { fontSize: 11.5, color: C.brownMid },
  summaryLineValue: { fontSize: 11.5, fontWeight: '700', color: C.brown, flexShrink: 1, textAlign: 'right', marginLeft: 10 },

  batchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  batchDates: { fontSize: 12.5, fontWeight: '800', color: C.brown },
  batchSlots: { fontSize: 10.5, color: C.brownMid, opacity: 0.7, marginTop: 2 },
  batchDownpayment: { fontSize: 10.5, fontWeight: '700', color: C.amber, marginTop: 2 },
  availToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: '#E4F5EC', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6,
  },
  availToggleOff: { backgroundColor: C.divider + '55' },
  availToggleText: { fontSize: 11, fontWeight: '800', color: '#12946F' },
  availToggleTextOff: { color: C.brownMid },
  miniSwitch: {
    width: 30, height: 17, borderRadius: 9, backgroundColor: C.divider,
    padding: 2, justifyContent: 'center',
  },
  miniSwitchOn: { backgroundColor: '#12946F' },
  miniSwitchThumb: { width: 13, height: 13, borderRadius: 7, backgroundColor: '#FFFFFF' },
  miniSwitchThumbOn: { alignSelf: 'flex-end' },

  dayCard: {
    marginTop: 12, backgroundColor: C.lightBg, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.divider,
  },
  dayHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  dayBadge: { backgroundColor: C.amber, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 5 },
  dayBadgeText: { fontSize: 11, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
  dayPhoto: {
    width: '80%', aspectRatio: 1, borderRadius: 14, alignSelf: 'center',
    marginTop: 16, marginBottom: 16, borderWidth: 1, borderColor: C.divider,
  },
  dayInfoRow: { flexDirection: 'row', alignItems: 'flex-start' },
  dayInfoCol: { flex: 1, alignItems: 'center', gap: 3 },
  dayInfoIconWrap: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFF5E0',
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  dayInfoLabel: { fontSize: 9.5, color: C.brownMid, opacity: 0.7 },
  dayInfoValue: { fontSize: 11.5, fontWeight: '800', color: C.brown, textAlign: 'center' },
  dayInfoDivider: { width: 1, alignSelf: 'stretch', backgroundColor: C.divider, marginTop: 6 },
  dayDivider: { height: 1, backgroundColor: C.divider, marginTop: 16, marginBottom: 12 },
  dayActivitiesHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  dayActivitiesTitle: { fontSize: 12.5, fontWeight: '900', color: C.amber },
  activitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, columnGap: 12 },
  activityItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, width: '46%' },
  activityDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.amber, marginTop: 6 },
  activityText: { fontSize: 11, color: C.brown, flexShrink: 1, lineHeight: 15 },
});
