/**
 * FilterBar.tsx
 * Collapsible slicer bar: a "Filters (N Applied)" header that expands into a
 * vertical list of fields (Date Range, Destination, Tour, Status, Payment
 * Status). Each field opens a bottom-sheet picker; changes are staged into a
 * local draft and only committed when "Apply Filters" is pressed.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { C as LIGHT_C } from './theme';
import { useAppTheme, ColorPalette } from '../ThemeContext';
import {
  DashboardFilters, DEFAULT_FILTERS,
  DATE_RANGE_OPTIONS, TOUR_OPTIONS, DESTINATION_OPTIONS,
  BOOKING_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS,
} from './mockData';

const ResetIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M21 12a9 9 0 11-2.64-6.36" stroke={LIGHT_C.amber} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M21 4v6h-6" stroke={LIGHT_C.amber} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronDownIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9l6 6 6-6" stroke={LIGHT_C.amber} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const FunnelIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M3 4h18l-7 8.5V19l-4 2v-8.5L3 4z" stroke={LIGHT_C.amber} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
  </Svg>
);

const CheckIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke={LIGHT_C.amber} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CalendarFieldIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M5 6a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6z" stroke={LIGHT_C.amber} strokeWidth={1.8} />
    <Path d="M16 2v4M8 2v4M3 10h18" stroke={LIGHT_C.amber} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const PinFieldIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M12 21s-7-6.4-7-11.5A7 7 0 0119 9.5C19 14.6 12 21 12 21z" stroke={LIGHT_C.amber} strokeWidth={1.8} strokeLinejoin="round" />
    <Path d="M14.5 9.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" stroke={LIGHT_C.amber} strokeWidth={1.8} />
  </Svg>
);

const BriefcaseFieldIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M3 8a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" stroke={LIGHT_C.amber} strokeWidth={1.8} />
    <Path d="M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2M3 13h18" stroke={LIGHT_C.amber} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const ClipboardFieldIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M7 4.5A1.5 1.5 0 018.5 3h7A1.5 1.5 0 0117 4.5V6H7V4.5z" stroke={LIGHT_C.amber} strokeWidth={1.8} />
    <Path d="M6 5h12a1 1 0 011 1v13a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 015 19V6a1 1 0 011-1z" stroke={LIGHT_C.amber} strokeWidth={1.8} />
    <Path d="M9 12h6M9 16h6" stroke={LIGHT_C.amber} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const CardFieldIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6z" stroke={LIGHT_C.amber} strokeWidth={1.8} />
    <Path d="M3 10h18M7 15h4" stroke={LIGHT_C.amber} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

type PickerOption = { value: string; label: string };

type PickerModalProps = {
  visible:  boolean;
  title:    string;
  options:  PickerOption[];
  selected: string;
  onSelect: (value: string) => void;
  onClose:  () => void;
};

const PickerModal = ({ visible, title, options, selected, onSelect, onClose }: PickerModalProps) => {
  const { C } = useAppTheme();
  const pm = useMemo(() => makePickerModalStyles(C), [C]);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <TouchableOpacity style={pm.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={pm.sheet} activeOpacity={1}>
          <Text style={pm.title}>{title}</Text>
          {options.map((opt) => {
            const isSelected = opt.value === selected;
            return (
              <TouchableOpacity
                key={opt.value || '__all__'}
                style={[pm.row, isSelected && pm.rowSelected]}
                activeOpacity={0.75}
                onPress={() => { onSelect(opt.value); onClose(); }}
              >
                <Text style={[pm.rowText, isSelected && pm.rowTextSelected]}>{opt.label}</Text>
                {isSelected && <CheckIcon />}
              </TouchableOpacity>
            );
          })}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const makePickerModalStyles = (C: ColorPalette) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(59,26,12,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.cardBg,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 30,
    maxHeight: '65%',
  },
  title: { fontSize: 13, fontWeight: '900', color: C.brown, marginBottom: 10, letterSpacing: 0.3 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  rowSelected:     {},
  rowText:         { fontSize: 13, color: C.brownMid, fontWeight: '600' },
  rowTextSelected: { color: C.amber, fontWeight: '800' },
});

type FieldKey = 'dateRange' | 'destination' | 'tour' | 'bookingStatus' | 'paymentStatus';

type FilterBarProps = {
  filters:  DashboardFilters;
  onChange: (next: DashboardFilters) => void;
};

const FilterField = ({
  icon, label, value, onPress, fb,
}: { icon: React.ReactNode; label: string; value: string; onPress: () => void; fb: ReturnType<typeof makeFilterBarStyles> }) => (
  <View style={fb.field}>
    <Text style={fb.fieldLabel}>{label}</Text>
    <TouchableOpacity style={fb.fieldBox} activeOpacity={0.8} onPress={onPress}>
      {icon}
      <Text style={fb.fieldValue} numberOfLines={1}>{value}</Text>
      <View style={{ flex: 1 }} />
      <ChevronDownIcon />
    </TouchableOpacity>
  </View>
);

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const { C } = useAppTheme();
  const fb = useMemo(() => makeFilterBarStyles(C), [C]);
  const [openField, setOpenField] = useState<FieldKey | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState<DashboardFilters>(filters);

  useEffect(() => {
    if (!expanded) setDraft(filters);
  }, [filters, expanded]);

  const dateRangeLabel = DATE_RANGE_OPTIONS.find((o) => o.value === draft.dateRange)?.label ?? 'This Month';
  const destinationLabel = draft.destination || 'All Destinations';
  const tourLabel = TOUR_OPTIONS.find((t) => t.id === draft.tourId)?.label ?? 'All Tours';
  const bookingStatusLabel = draft.bookingStatus || 'All Status';
  const paymentStatusLabel = draft.paymentStatus || 'All Payment Status';

  const appliedCount = (Object.keys(DEFAULT_FILTERS) as (keyof DashboardFilters)[])
    .filter((k) => filters[k] !== DEFAULT_FILTERS[k]).length;

  const handleReset = () => {
    setDraft(DEFAULT_FILTERS);
    onChange(DEFAULT_FILTERS);
    setExpanded(false);
  };

  const handleApply = () => {
    onChange(draft);
    setExpanded(false);
  };

  return (
    <View>
      <TouchableOpacity
        style={fb.header}
        activeOpacity={0.8}
        onPress={() => setExpanded((v) => !v)}
      >
        <FunnelIcon />
        <Text style={fb.headerTitle}>Filters</Text>
        {appliedCount > 0 && (
          <Text style={fb.headerCount}>({appliedCount} Applied)</Text>
        )}
        <View style={{ flex: 1 }} />
        <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
          <ChevronDownIcon />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={fb.panel}>
          <FilterField fb={fb} icon={<CalendarFieldIcon />} label="DATE RANGE" value={dateRangeLabel} onPress={() => setOpenField('dateRange')} />
          <FilterField fb={fb} icon={<PinFieldIcon />} label="DESTINATION" value={destinationLabel} onPress={() => setOpenField('destination')} />
          <FilterField fb={fb} icon={<BriefcaseFieldIcon />} label="TOUR PACKAGE" value={tourLabel} onPress={() => setOpenField('tour')} />
          <FilterField fb={fb} icon={<ClipboardFieldIcon />} label="STATUS" value={bookingStatusLabel} onPress={() => setOpenField('bookingStatus')} />
          <FilterField fb={fb} icon={<CardFieldIcon />} label="PAYMENT STATUS" value={paymentStatusLabel} onPress={() => setOpenField('paymentStatus')} />

          <View style={fb.btnRow}>
            <TouchableOpacity style={fb.resetBtn} activeOpacity={0.8} onPress={handleReset}>
              <ResetIcon />
              <Text style={fb.resetText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={fb.applyBtn} activeOpacity={0.85} onPress={handleApply}>
              <Text style={fb.applyText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <PickerModal
        visible={openField === 'dateRange'}
        title="Date Range"
        options={DATE_RANGE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        selected={draft.dateRange}
        onSelect={(value) => setDraft({ ...draft, dateRange: value as DashboardFilters['dateRange'] })}
        onClose={() => setOpenField(null)}
      />
      <PickerModal
        visible={openField === 'destination'}
        title="Destination"
        options={[{ value: '', label: 'All Destinations' }, ...DESTINATION_OPTIONS.map((d) => ({ value: d, label: d }))]}
        selected={draft.destination}
        onSelect={(value) => setDraft({ ...draft, destination: value })}
        onClose={() => setOpenField(null)}
      />
      <PickerModal
        visible={openField === 'tour'}
        title="Tour Package"
        options={[{ value: '0', label: 'All Tours' }, ...TOUR_OPTIONS.map((t) => ({ value: String(t.id), label: t.label }))]}
        selected={String(draft.tourId)}
        onSelect={(value) => setDraft({ ...draft, tourId: Number(value) })}
        onClose={() => setOpenField(null)}
      />
      <PickerModal
        visible={openField === 'bookingStatus'}
        title="Status"
        options={[{ value: '', label: 'All Status' }, ...BOOKING_STATUS_OPTIONS.map((s) => ({ value: s, label: s }))]}
        selected={draft.bookingStatus}
        onSelect={(value) => setDraft({ ...draft, bookingStatus: value as DashboardFilters['bookingStatus'] })}
        onClose={() => setOpenField(null)}
      />
      <PickerModal
        visible={openField === 'paymentStatus'}
        title="Payment Status"
        options={[{ value: '', label: 'All Payment Status' }, ...PAYMENT_STATUS_OPTIONS.map((s) => ({ value: s, label: s }))]}
        selected={draft.paymentStatus}
        onSelect={(value) => setDraft({ ...draft, paymentStatus: value as DashboardFilters['paymentStatus'] })}
        onClose={() => setOpenField(null)}
      />
    </View>
  );
}

const makeFilterBarStyles = (C: ColorPalette) => StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.cardBg, borderRadius: 14,
    marginHorizontal: 16, paddingVertical: 12, paddingHorizontal: 14,
    borderWidth: 1, borderColor: C.divider,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1 },
    }),
  },
  headerTitle: { fontSize: 13, fontWeight: '800', color: C.brown },
  headerCount: { fontSize: 12, fontWeight: '700', color: C.amber },
  panel: {
    marginHorizontal: 16, marginTop: 10, paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: C.cardBg, borderRadius: 14,
    borderWidth: 1, borderColor: C.divider,
    gap: 12,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1 },
    }),
  },
  field: { gap: 6 },
  fieldLabel: { fontSize: 9.5, fontWeight: '800', color: C.brownMid, opacity: 0.65, letterSpacing: 0.5 },
  fieldBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.lightBg, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 14,
    borderWidth: 1, borderColor: C.divider,
  },
  fieldValue: { fontSize: 13, fontWeight: '700', color: C.brown, flexShrink: 1 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
  resetBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: C.cardBg, borderRadius: 24,
    paddingVertical: 12,
    borderWidth: 1.5, borderColor: C.amber,
  },
  resetText: { fontSize: 13, fontWeight: '800', color: C.amber },
  applyBtn: {
    flex: 1.4, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.amber, borderRadius: 24,
    paddingVertical: 12,
    ...Platform.select({
      ios:     { shadowColor: C.amber, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 2 },
    }),
  },
  applyText: { fontSize: 13, fontWeight: '800', color: C.white },
});
