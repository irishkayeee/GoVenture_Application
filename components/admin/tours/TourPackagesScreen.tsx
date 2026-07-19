/**
 * TourPackagesScreen.tsx
 * Tours tab — search + status filter, an "Add New Package" action, and a
 * responsive grid of tour package cards (destination banner, rating, price,
 * duration). Tapping "Add New Package" opens the 5-step AddTourPackageModal
 * wizard.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Platform, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import Copyright from '@/components/Copyright';
import { useAppTheme, ColorPalette } from '../ThemeContext';
import { TourPackage, TourStatus, TourType, TOUR_TYPE_META, TOUR_TYPE_TABS, formatPeso } from './mockData';
import { TOURS_LIST_API_URL } from '@/constants/api';
import AddTourPackageModal from './AddTourPackageModal';
import TourDetailModal from './TourDetailModal';

const STATUS_FILTER_OPTIONS: { value: TourStatus | ''; label: string }[] = [
  { value: '',         label: 'All Status' },
  { value: 'Active',   label: 'Active' },
  { value: 'Draft',    label: 'Draft' },
  { value: 'Inactive', label: 'Inactive' },
];

/* ── Icons ── */
const SearchIcon = ({ color }: { color: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);
const FunnelIcon = ({ color }: { color: string }) => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Path d="M3 4h18l-7 8.5V19l-4 2v-8.5L3 4z" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
  </Svg>
);
const PackageIcon = ({ color }: { color: string }) => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const CheckIcon = ({ color }: { color: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const ChevronDownIcon = ({ color }: { color: string }) => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const PlusIcon = () => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5v14M5 12h14" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" />
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
const StarIcon = ({ filled }: { filled: boolean }) => (
  <Svg width={11} height={11} viewBox="0 0 24 24" fill={filled ? '#E0A72E' : 'none'}>
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="#E0A72E" strokeWidth={1.4} strokeLinejoin="round" />
  </Svg>
);
const ArrowRightIcon = ({ color }: { color: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12h14M13 6l6 6-6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

type PickerModalProps = {
  visible: boolean; title: string;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
};

const StatusPickerModal = ({ visible, title, options, selected, onSelect, onClose, C, ts }: PickerModalProps & { C: ColorPalette; ts: ReturnType<typeof makeStyles> }) => {
  if (!visible) return null;
  return (
    <View style={ts.pmBackdropWrap} pointerEvents="box-none">
      <TouchableOpacity style={ts.pmBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={ts.pmSheet}>
        <Text style={ts.pmTitle}>{title}</Text>
        {options.map((opt) => {
          const isSelected = opt.value === selected;
          return (
            <TouchableOpacity
              key={opt.value || '__all__'}
              style={ts.pmRow}
              activeOpacity={0.75}
              onPress={() => { onSelect(opt.value); onClose(); }}
            >
              <Text style={[ts.pmRowText, isSelected && ts.pmRowTextSelected]}>{opt.label}</Text>
              {isSelected && <CheckIcon color={C.amber} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const TourCard = ({ pkg, onPress, ts, C }: { pkg: TourPackage; onPress: () => void; ts: ReturnType<typeof makeStyles>; C: ColorPalette }) => {
  const typeMeta = TOUR_TYPE_META[pkg.tourType] ?? TOUR_TYPE_META.custom;
  return (
  <TouchableOpacity style={ts.card} activeOpacity={0.85} onPress={onPress}>
    <View style={ts.cardBanner}>
      {pkg.imageUrl ? (
        <Image source={{ uri: pkg.imageUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      ) : (
        <LinearGradient colors={pkg.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject}>
          <PlaneWatermarkIcon />
        </LinearGradient>
      )}
      <View style={[ts.tagBadge, { backgroundColor: typeMeta.color }]}>
        <Text style={ts.tagBadgeText}>{typeMeta.label}</Text>
      </View>
    </View>

    <View style={ts.cardInfo}>
      <Text style={ts.cardDest} numberOfLines={1}>{pkg.destination}</Text>
      <Text style={ts.cardTagline} numberOfLines={1}>{pkg.tagline}</Text>

      <View style={ts.ratingRow}>
        {[0, 1, 2, 3, 4].map((i) => <StarIcon key={i} filled={i < Math.round(pkg.rating)} />)}
        <Text style={ts.ratingValue}>{pkg.rating}</Text>
        <Text style={ts.ratingCount}>({pkg.reviewCount})</Text>
      </View>

      <Text style={ts.priceText}>
        from <Text style={ts.priceValue}>{formatPeso(pkg.priceFrom)}</Text> / person
      </Text>
      <Text style={ts.durationText}>{pkg.duration}</Text>

      <View style={ts.viewBtn}>
        <Text style={ts.viewBtnText}>View Details</Text>
        <ArrowRightIcon color={C.amber} />
      </View>
    </View>
  </TouchableOpacity>
  );
};

export default function TourPackagesScreen() {
  const { C } = useAppTheme();
  const ts = useMemo(() => makeStyles(C), [C]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TourStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<TourType | ''>('');
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<TourPackage | null>(null);
  const [tours, setTours] = useState<TourPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTours = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(TOURS_LIST_API_URL);
      const result = await res.json();
      if (result.status === 'success') setTours(result.data);
      else setError(result.message || 'Failed to load tour packages.');
    } catch {
      setError("Can't connect to the server. Please check if XAMPP is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTours(); }, [loadTours]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tours.filter((p) => {
      const matchesQuery = !q || p.destination.toLowerCase().includes(q) || p.tagline.toLowerCase().includes(q);
      const matchesStatus = !statusFilter || p.status === statusFilter;
      const matchesType = !typeFilter || p.tourType === typeFilter;
      return matchesQuery && matchesStatus && matchesType;
    });
  }, [tours, query, statusFilter, typeFilter]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tab of TOUR_TYPE_TABS) {
      counts[tab.value] = tab.value ? tours.filter((p) => p.tourType === tab.value).length : tours.length;
    }
    return counts;
  }, [tours]);

  const statusLabel = STATUS_FILTER_OPTIONS.find((o) => o.value === statusFilter)?.label ?? 'All Status';

  const typeOptions = TOUR_TYPE_TABS.map((tab) => ({ value: tab.value, label: `${tab.label} (${typeCounts[tab.value] ?? 0})` }));
  const typeLabel = TOUR_TYPE_TABS.find((t) => t.value === typeFilter)?.label ?? 'All Packages';

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 8 }} keyboardShouldPersistTaps="handled">
        <LinearGradient
          colors={['#6B2E10', '#B85F17', '#D17B2E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={ts.headerCard}
        >
          <View style={ts.headerDecorLayer} pointerEvents="none">
            <Text style={[ts.headerDecorEmoji, { top: 8, right: 66, fontSize: 15, opacity: 0.55, transform: [{ rotate: '18deg' }] }]}>✈️</Text>
            <Text style={[ts.headerDecorEmoji, { top: 2, right: 4, fontSize: 20, opacity: 0.5 }]}>📍</Text>
            <Text style={[ts.headerDecorEmoji, { bottom: -14, right: 74, fontSize: 60, opacity: 0.14 }]}>🏝️</Text>
          </View>

          <Text style={ts.headerEyebrow}>CATALOG</Text>
          <Text style={ts.headerTitle}>Tour Packages</Text>
          <Text style={ts.headerSub}>Manage tour packages and update pricing and availability.</Text>
        </LinearGradient>

        <View style={ts.searchRow}>
          <View style={ts.searchBox}>
            <SearchIcon color={C.brownMid} />
            <TextInput
              style={ts.searchInput}
              placeholder="Search tour package..."
              placeholderTextColor={C.brownMid + '80'}
              value={query}
              onChangeText={setQuery}
            />
          </View>
          <TouchableOpacity
            style={[ts.filterBtn, statusFilter && ts.filterBtnActive]}
            activeOpacity={0.8}
            onPress={() => setShowStatusPicker(true)}
          >
            <FunnelIcon color={statusFilter ? '#FFFFFF' : C.amber} />
            <Text style={[ts.filterBtnText, statusFilter && ts.filterBtnTextActive]}>Filter</Text>
          </TouchableOpacity>
        </View>

        <View style={ts.addRow}>
          <TouchableOpacity style={ts.typeDropdownBtn} activeOpacity={0.8} onPress={() => setShowTypePicker(true)}>
            <PackageIcon color={C.amber} />
            <Text style={ts.typeDropdownText} numberOfLines={1}>{typeLabel}</Text>
            <ChevronDownIcon color={C.brownMid} />
          </TouchableOpacity>
          <TouchableOpacity style={ts.addBtn} activeOpacity={0.85} onPress={() => setShowAddModal(true)}>
            <PlusIcon />
            <Text style={ts.addBtnText}>Add New</Text>
          </TouchableOpacity>
        </View>

        {!!statusFilter && (
          <View style={ts.activeFilterRow}>
            <View style={ts.activeFilterChip}>
              <Text style={ts.activeFilterText}>{statusLabel}</Text>
              <TouchableOpacity onPress={() => setStatusFilter('')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Text style={ts.activeFilterClear}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={ts.countRow}>
          <Text style={ts.countText}>{filtered.length} package{filtered.length === 1 ? '' : 's'}</Text>
        </View>

        <View style={ts.grid}>
          {loading ? (
            <View style={ts.emptyWrap}><ActivityIndicator color={C.amber} /></View>
          ) : error ? (
            <View style={ts.emptyWrap}>
              <Text style={ts.emptyEmoji}>⚠️</Text>
              <Text style={ts.emptyText}>{error}</Text>
              <TouchableOpacity onPress={loadTours}><Text style={[ts.emptyText, { color: C.amber, fontWeight: '800' }]}>Tap to retry</Text></TouchableOpacity>
            </View>
          ) : filtered.length === 0 ? (
            <View style={ts.emptyWrap}>
              <Text style={ts.emptyEmoji}>🔍</Text>
              <Text style={ts.emptyText}>No tour packages match your search.</Text>
            </View>
          ) : (
            filtered.map((p) => <TourCard key={p.id} pkg={p} onPress={() => setSelectedPkg(p)} ts={ts} C={C} />)
          )}
        </View>

        <Copyright />
      </ScrollView>

      <StatusPickerModal
        visible={showStatusPicker}
        title="Filter by Status"
        options={STATUS_FILTER_OPTIONS}
        selected={statusFilter}
        onSelect={(v) => setStatusFilter(v as TourStatus | '')}
        onClose={() => setShowStatusPicker(false)}
        C={C}
        ts={ts}
      />

      <StatusPickerModal
        visible={showTypePicker}
        title="Filter by Type"
        options={typeOptions}
        selected={typeFilter}
        onSelect={(v) => setTypeFilter(v as TourType | '')}
        onClose={() => setShowTypePicker(false)}
        C={C}
        ts={ts}
      />

      <AddTourPackageModal visible={showAddModal} onClose={() => setShowAddModal(false)} onCreated={loadTours} />
      <TourDetailModal visible={!!selectedPkg} pkg={selectedPkg} onClose={() => setSelectedPkg(null)} onUpdated={loadTours} />
    </View>
  );
}

const makeStyles = (C: ColorPalette) => StyleSheet.create({
  headerCard: {
    marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    borderRadius: 20, padding: 18,
    overflow: 'hidden', position: 'relative',
    ...Platform.select({
      ios:     { shadowColor: '#3B1A0C', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 5 },
    }),
  },
  headerDecorLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  headerDecorEmoji: { position: 'absolute' },
  headerEyebrow: { fontSize: 10.5, fontWeight: '800', color: '#FFD9A0', letterSpacing: 0.6 },
  headerTitle: { fontSize: 21, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3, marginTop: 4 },
  headerSub: { fontSize: 11.5, color: 'rgba(255,255,255,0.85)', marginTop: 6, lineHeight: 16, maxWidth: 260 },

  searchRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 14 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.cardBg, borderRadius: 12, paddingHorizontal: 12, height: 42,
    borderWidth: 1, borderColor: C.divider,
  },
  searchInput: { flex: 1, fontSize: 13, color: C.brown },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.cardBg, borderRadius: 12, paddingHorizontal: 14, height: 42,
    borderWidth: 1.5, borderColor: C.amber,
  },
  filterBtnActive: { backgroundColor: C.amber },
  filterBtnText: { fontSize: 12.5, fontWeight: '800', color: C.amber },
  filterBtnTextActive: { color: '#FFFFFF' },

  addRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 10 },
  typeDropdownBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6,
    backgroundColor: C.cardBg, borderRadius: 12, paddingHorizontal: 14, height: 44,
    borderWidth: 1, borderColor: C.divider,
  },
  typeDropdownText: { flex: 1, fontSize: 12.5, fontWeight: '700', color: C.brown },
  addBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.amber, borderRadius: 12, height: 44,
    ...Platform.select({
      ios:     { shadowColor: C.amber, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 2 },
    }),
  },
  addBtnText: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' },

  activeFilterRow: { paddingHorizontal: 16, marginTop: 10 },
  activeFilterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
    backgroundColor: C.lightBg, borderRadius: 20, borderWidth: 1, borderColor: C.divider,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  activeFilterText: { fontSize: 11.5, fontWeight: '700', color: C.brown },
  activeFilterClear: { fontSize: 12, fontWeight: '900', color: C.brownMid },

  countRow: { paddingHorizontal: 16, marginTop: 14, marginBottom: 8 },
  countText: { fontSize: 12.5, fontWeight: '800', color: C.brownMid, opacity: 0.75, letterSpacing: 0.3 },

  grid: { paddingHorizontal: 16, gap: 12 },
  card: {
    flexDirection: 'row', backgroundColor: C.cardBg, borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: C.divider,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1 },
    }),
  },
  cardBanner: { width: 130, alignItems: 'flex-start', justifyContent: 'flex-start', padding: 8 },
  tagBadge: { backgroundColor: 'rgba(0,0,0,0.28)', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  tagBadgeText: { fontSize: 9.5, fontWeight: '800', color: '#FFFFFF' },
  cardInfo: { flex: 1, minWidth: 0, padding: 9, gap: 1 },
  cardDest: { fontSize: 13, fontWeight: '900', color: C.brown },
  cardTagline: { fontSize: 10, color: C.brownMid, opacity: 0.75 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  ratingValue: { fontSize: 10.5, fontWeight: '800', color: C.brown, marginLeft: 4 },
  ratingCount: { fontSize: 9.5, color: C.brownMid, opacity: 0.6 },
  priceText: { fontSize: 10, color: C.brownMid, opacity: 0.8, marginTop: 3 },
  priceValue: { fontSize: 12.5, fontWeight: '900', color: C.amber },
  durationText: { fontSize: 9.5, color: C.brownMid, opacity: 0.7, marginTop: 1 },
  viewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 6, backgroundColor: '#FFF5E0', borderRadius: 18, paddingVertical: 7,
  },
  viewBtnText: { fontSize: 11, fontWeight: '800', color: C.amber },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 50, gap: 8 },
  emptyEmoji: { fontSize: 34 },
  emptyText: { fontSize: 12.5, color: C.brownMid, opacity: 0.7, fontWeight: '600' },

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
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  pmRowText: { fontSize: 13, color: C.brownMid, fontWeight: '600' },
  pmRowTextSelected: { color: C.amber, fontWeight: '800' },
});
