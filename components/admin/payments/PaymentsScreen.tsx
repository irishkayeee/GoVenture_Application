/**
 * PaymentsScreen.tsx
 * Payments tab — stat summary grid, QR payment methods, filterable/tabbed
 * payment records list. Tapping "+ Add Payment" opens AddPaymentMethodModal;
 * tapping a record's eye icon opens PaymentDetailModal.
 */

import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import Copyright from '@/components/Copyright';
import { C as LIGHT_C } from '../dashboard/theme';
import { useAppTheme, ColorPalette } from '../ThemeContext';
import {
  PAYMENTS, Payment, PaymentStatus, PaymentMethod,
  INITIAL_QR_METHODS, QRPaymentMethod,
  STATUS_FILTER_OPTIONS, METHOD_FILTER_OPTIONS,
  formatPeso2,
} from './mockData';
import AddPaymentMethodModal from './AddPaymentMethodModal';
import PaymentDetailModal from './PaymentDetailModal';

const STATUS_STYLE: Record<PaymentStatus, { bg: string; color: string }> = {
  Pending:      { bg: '#FFF5E0', color: '#B8922E' },
  'Fully Paid': { bg: '#E7F9F3', color: '#12946F' },
  Partial:      { bg: '#EAF1FB', color: LIGHT_C.info },
  Overdue:      { bg: '#FDEAEA', color: LIGHT_C.danger },
};
const METHOD_STYLE: Record<PaymentMethod, { bg: string }> = {
  GCash:           { bg: '#1D6FB8' },
  Maya:            { bg: '#0C6B4F' },
  'Bank Transfer': { bg: '#5B21A6' },
};

type TabKey = 'all' | 'pending' | 'partial' | 'overdue';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'all',     label: 'All Payments' },
  { key: 'pending', label: 'Pending Verification' },
  { key: 'partial', label: 'Partial Payments' },
  { key: 'overdue', label: 'Overdue' },
];

/* ── Icons ── */
const SearchIcon = ({ color }: { color: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);
const FunnelIcon = ({ color = LIGHT_C.amber }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M3 4h18l-7 8.5V19l-4 2v-8.5L3 4z" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
  </Svg>
);
const CheckIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke={LIGHT_C.amber} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const PlusIcon = () => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5v14M5 12h14" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" />
  </Svg>
);
const DownloadIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const EyeIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={LIGHT_C.amber} strokeWidth={1.8} strokeLinejoin="round" />
    <Path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke={LIGHT_C.amber} strokeWidth={1.8} />
  </Svg>
);
const QRIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M4 4h6v6H4V4zM14 4h6v6h-6V4zM4 14h6v6H4v-6zM14 14h3v3M20 14v3h-3M14 20h3M20 20h-1" stroke={LIGHT_C.amber} strokeWidth={1.7} strokeLinejoin="round" />
  </Svg>
);

type PickerModalProps = {
  visible: boolean; title: string;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
};
const SelectModal = ({ visible, title, options, selected, onSelect, onClose }: PickerModalProps) => {
  const { C } = useAppTheme();
  const ps = useMemo(() => makeStyles(C), [C]);
  if (!visible) return null;
  return (
    <View style={ps.pmBackdropWrap} pointerEvents="box-none">
      <TouchableOpacity style={ps.pmBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={ps.pmSheet}>
        <Text style={ps.pmTitle}>{title}</Text>
        {options.map((opt) => {
          const isSelected = opt.value === selected;
          return (
            <TouchableOpacity key={opt.value || '__all__'} style={ps.pmRow} activeOpacity={0.75} onPress={() => { onSelect(opt.value); onClose(); }}>
              <Text style={[ps.pmRowText, isSelected && ps.pmRowTextSelected]}>{opt.label}</Text>
              {isSelected && <CheckIcon />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const StatCard = ({ emoji, emojiBg, label, value, sub }: { emoji: string; emojiBg: string; label: string; value: string; sub: string }) => {
  const { C } = useAppTheme();
  const ps = useMemo(() => makeStyles(C), [C]);
  return (
    <View style={ps.statCard}>
      <View style={[ps.statIconWrap, { backgroundColor: emojiBg }]}><Text style={{ fontSize: 18 }}>{emoji}</Text></View>
      <Text style={ps.statLabel}>{label}</Text>
      <Text style={ps.statValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={ps.statSub}>{sub}</Text>
    </View>
  );
};

const PaymentCard = ({ payment, onView }: { payment: Payment; onView: () => void }) => {
  const { C } = useAppTheme();
  const ps = useMemo(() => makeStyles(C), [C]);
  const st = STATUS_STYLE[payment.status];
  const mt = METHOD_STYLE[payment.method];
  return (
    <View style={ps.card}>
      <View style={ps.cardTopRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={ps.cardBookingId}>{payment.bookingId}</Text>
          <Text style={ps.cardClient} numberOfLines={1}>{payment.clientName}</Text>
          <Text style={ps.cardTour} numberOfLines={1}>{payment.tourPackage}</Text>
        </View>
        <TouchableOpacity style={ps.eyeBtn} activeOpacity={0.8} onPress={onView}>
          <EyeIcon />
        </TouchableOpacity>
      </View>

      <View style={ps.cardAmountRow}>
        <View>
          <Text style={ps.cardAmountLabel}>Total</Text>
          <Text style={ps.cardAmountValue}>{formatPeso2(payment.totalAmount)}</Text>
        </View>
        <View>
          <Text style={ps.cardAmountLabel}>Balance</Text>
          <Text style={[ps.cardAmountValue, { color: payment.balance > 0 ? C.danger : '#12946F' }]}>{formatPeso2(payment.balance)}</Text>
        </View>
      </View>

      <View style={ps.cardBottomRow}>
        <View style={[ps.methodBadge, { backgroundColor: mt.bg }]}>
          <Text style={ps.methodBadgeText}>{payment.method}</Text>
        </View>
        <View style={[ps.statusBadge, { backgroundColor: st.bg }]}>
          <Text style={[ps.statusBadgeText, { color: st.color }]}>{payment.status}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <Text style={ps.cardDate}>{payment.date}</Text>
      </View>
    </View>
  );
};

export default function PaymentsScreen() {
  const { C } = useAppTheme();
  const ps = useMemo(() => makeStyles(C), [C]);
  const [payments, setPayments] = useState<Payment[]>(PAYMENTS);
  const [qrMethods, setQrMethods] = useState<QRPaymentMethod[]>(INITIAL_QR_METHODS);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | ''>('');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | ''>('');
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const [showAddMethodModal, setShowAddMethodModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const stats = useMemo(() => {
    const totalSales = payments.reduce((sum, p) => sum + (p.totalAmount - p.balance), 0);
    const paidBookings = payments.filter((p) => p.status === 'Fully Paid').length;
    const pendingPayments = payments.filter((p) => p.status === 'Pending' || p.status === 'Partial').length;
    const overduePayments = payments.filter((p) => p.status === 'Overdue').length;
    return { totalSales, paidBookings, pendingPayments, overduePayments };
  }, [payments]);

  const tabFilteredStatus: PaymentStatus | null =
    activeTab === 'pending' ? 'Pending' : activeTab === 'partial' ? 'Partial' : activeTab === 'overdue' ? 'Overdue' : null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return payments.filter((p) => {
      const matchesQuery = !q || p.bookingId.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q);
      const matchesTab = !tabFilteredStatus || p.status === tabFilteredStatus;
      const matchesStatus = !statusFilter || p.status === statusFilter;
      const matchesMethod = !methodFilter || p.method === methodFilter;
      return matchesQuery && matchesTab && matchesStatus && matchesMethod;
    });
  }, [payments, query, tabFilteredStatus, statusFilter, methodFilter]);

  const statusLabel = STATUS_FILTER_OPTIONS.find((o) => o.value === statusFilter)?.label ?? 'All Status';
  const methodLabel = METHOD_FILTER_OPTIONS.find((o) => o.value === methodFilter)?.label ?? 'All Payment Methods';

  const handleMarkPaid = (id: string) => {
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, balance: 0, status: 'Fully Paid' } : p)));
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 8 }} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={['#6B2E10', '#B85F17', '#D17B2E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={ps.headerCard}>
          <View style={ps.headerDecorLayer} pointerEvents="none">
            <Text style={[ps.headerDecorEmoji, { top: 8, right: 66, fontSize: 15, opacity: 0.55, transform: [{ rotate: '18deg' }] }]}>✈️</Text>
            <Text style={[ps.headerDecorEmoji, { top: 2, right: 4, fontSize: 20, opacity: 0.5 }]}>📍</Text>
            <Text style={[ps.headerDecorEmoji, { bottom: -14, right: 74, fontSize: 60, opacity: 0.14 }]}>🏝️</Text>
          </View>
          <Text style={ps.headerEyebrow}>FINANCE</Text>
          <Text style={ps.headerTitle}>Payment Management</Text>
          <Text style={ps.headerSub}>Track, verify and manage all client payments in one place.</Text>
        </LinearGradient>

        <View style={ps.statsGrid}>
          <StatCard emoji="💰" emojiBg="#EAF1FB" label="TOTAL SALES" value={formatPeso2(stats.totalSales)} sub="All time total" />
          <StatCard emoji="✅" emojiBg="#E7F9F3" label="PAID BOOKINGS" value={String(stats.paidBookings)} sub="Fully paid" />
          <StatCard emoji="⏳" emojiBg="#FFF5E0" label="PENDING PAYMENTS" value={String(stats.pendingPayments)} sub="Awaiting verification" />
          <StatCard emoji="🚨" emojiBg="#FDEAEA" label="OVERDUE PAYMENTS" value={String(stats.overduePayments)} sub="Past due" />
        </View>

        <View style={ps.actionRow}>
          <TouchableOpacity style={ps.filterBtn} activeOpacity={0.8} onPress={() => setShowStatusPicker(true)}>
            <FunnelIcon />
            <Text style={ps.filterBtnText}>Filter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={ps.exportBtn} activeOpacity={0.85}>
            <DownloadIcon />
            <Text style={ps.exportBtnText}>Export</Text>
          </TouchableOpacity>
        </View>
        <View style={ps.addRow}>
          <TouchableOpacity style={ps.addBtn} activeOpacity={0.85} onPress={() => setShowAddMethodModal(true)}>
            <PlusIcon />
            <Text style={ps.addBtnText}>Add Payment</Text>
          </TouchableOpacity>
        </View>

        <View style={ps.sectionWrap}>
          <Text style={ps.sectionTitle}>Payment Methods (QR)</Text>
          <View style={ps.qrCard}>
            {qrMethods.length === 0 ? (
              <Text style={ps.qrEmptyText}>No payment methods yet. Tap "Add Payment" to upload a GCash, Maya, or Bank Transfer QR code.</Text>
            ) : (
              <View style={{ gap: 10 }}>
                {qrMethods.map((m) => (
                  <View key={m.id} style={ps.qrRow}>
                    <View style={ps.qrIconWrap}><QRIcon /></View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={ps.qrMethodName}>{m.method}</Text>
                      <Text style={ps.qrAccountName} numberOfLines={1}>{m.accountName}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={ps.tabBar} contentContainerStyle={ps.tabBarContent}>
          {TABS.map((t) => {
            const isActive = t.key === activeTab;
            return (
              <TouchableOpacity key={t.key} style={ps.tabItem} activeOpacity={0.8} onPress={() => setActiveTab(t.key)}>
                <Text style={[ps.tabText, isActive && ps.tabTextActive]}>{t.label}</Text>
                {isActive && <View style={ps.tabUnderline} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={ps.searchRow}>
          <View style={ps.searchBox}>
            <SearchIcon color={C.brownMid} />
            <TextInput
              style={ps.searchInput}
              placeholder="Search by booking ID, client name..."
              placeholderTextColor={C.brownMid + '80'}
              value={query}
              onChangeText={setQuery}
            />
          </View>
        </View>
        <View style={ps.filterChipsRow}>
          <TouchableOpacity style={[ps.miniFilterBtn, !!statusFilter && ps.miniFilterBtnActive]} activeOpacity={0.8} onPress={() => setShowStatusPicker(true)}>
            <Text style={[ps.miniFilterText, !!statusFilter && ps.miniFilterTextActive]} numberOfLines={1}>{statusLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[ps.miniFilterBtn, !!methodFilter && ps.miniFilterBtnActive]} activeOpacity={0.8} onPress={() => setShowMethodPicker(true)}>
            <Text style={[ps.miniFilterText, !!methodFilter && ps.miniFilterTextActive]} numberOfLines={1}>{methodLabel}</Text>
          </TouchableOpacity>
        </View>

        <View style={ps.countRow}>
          <Text style={ps.countText}>{filtered.length} payment{filtered.length === 1 ? '' : 's'}</Text>
        </View>

        <View style={ps.list}>
          {filtered.length === 0 ? (
            <View style={ps.emptyWrap}>
              <Text style={ps.emptyEmoji}>🔍</Text>
              <Text style={ps.emptyText}>No payments match your search.</Text>
            </View>
          ) : (
            filtered.map((p) => <PaymentCard key={p.id} payment={p} onView={() => setSelectedPayment(p)} />)
          )}
        </View>

        <Copyright />
      </ScrollView>

      <SelectModal visible={showStatusPicker} title="Filter by Status" options={STATUS_FILTER_OPTIONS} selected={statusFilter} onSelect={(v) => setStatusFilter(v as PaymentStatus | '')} onClose={() => setShowStatusPicker(false)} />
      <SelectModal visible={showMethodPicker} title="Filter by Payment Method" options={METHOD_FILTER_OPTIONS} selected={methodFilter} onSelect={(v) => setMethodFilter(v as PaymentMethod | '')} onClose={() => setShowMethodPicker(false)} />

      <AddPaymentMethodModal
        visible={showAddMethodModal}
        onClose={() => setShowAddMethodModal(false)}
        onSave={(m) => setQrMethods((prev) => [...prev, m])}
      />
      <PaymentDetailModal
        visible={!!selectedPayment}
        payment={selectedPayment}
        onClose={() => setSelectedPayment(null)}
        onMarkPaid={handleMarkPaid}
      />
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
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3, marginTop: 4 },
  headerSub: { fontSize: 11.5, color: 'rgba(255,255,255,0.85)', marginTop: 6, lineHeight: 16, maxWidth: 260 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, marginTop: 14 },
  statCard: {
    flexBasis: '47%', flexGrow: 1,
    backgroundColor: C.cardBg, borderRadius: 14, padding: 12,
    borderLeftWidth: 3, borderLeftColor: C.amber,
    borderWidth: 1, borderColor: C.divider,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1 },
    }),
  },
  statIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statLabel: { fontSize: 8.5, fontWeight: '800', color: C.brownMid, opacity: 0.65, letterSpacing: 0.4 },
  statValue: { fontSize: 16.5, fontWeight: '900', color: C.brown, marginTop: 3 },
  statSub: { fontSize: 9.5, color: C.brownMid, opacity: 0.6, marginTop: 1 },

  actionRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 14 },
  filterBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: C.cardBg, borderRadius: 12, height: 42, borderWidth: 1.5, borderColor: C.amber,
  },
  filterBtnText: { fontSize: 12.5, fontWeight: '800', color: C.amber },
  exportBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#12946F', borderRadius: 12, height: 42,
  },
  exportBtnText: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' },
  addRow: { paddingHorizontal: 16, marginTop: 8 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.amber, borderRadius: 12, height: 44,
    ...Platform.select({
      ios:     { shadowColor: C.amber, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 2 },
    }),
  },
  addBtnText: { fontSize: 13.5, fontWeight: '800', color: '#FFFFFF' },

  sectionWrap: { paddingHorizontal: 16, marginTop: 18 },
  sectionTitle: { fontSize: 14.5, fontWeight: '900', color: C.brown, marginBottom: 10 },
  qrCard: {
    backgroundColor: C.cardBg, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: C.divider,
  },
  qrEmptyText: { fontSize: 12, color: C.brownMid, opacity: 0.7, lineHeight: 18 },
  qrRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qrIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.lightBg, alignItems: 'center', justifyContent: 'center' },
  qrMethodName: { fontSize: 12.5, fontWeight: '800', color: C.brown },
  qrAccountName: { fontSize: 11, color: C.brownMid, opacity: 0.75, marginTop: 1 },

  tabBar: { marginTop: 18, borderBottomWidth: 1, borderBottomColor: C.divider, flexGrow: 0 },
  tabBarContent: { paddingHorizontal: 16, gap: 20 },
  tabItem: { paddingBottom: 10, alignItems: 'center' },
  tabText: { fontSize: 12.5, fontWeight: '700', color: C.brownMid, opacity: 0.7 },
  tabTextActive: { color: C.amber, fontWeight: '800', opacity: 1 },
  tabUnderline: { height: 2.5, backgroundColor: C.amber, borderRadius: 2, marginTop: 8, width: '100%' },

  searchRow: { paddingHorizontal: 16, marginTop: 14 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.cardBg, borderRadius: 12, paddingHorizontal: 12, height: 42,
    borderWidth: 1, borderColor: C.divider,
  },
  searchInput: { flex: 1, fontSize: 13, color: C.brown },
  filterChipsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 10 },
  miniFilterBtn: {
    flex: 1, backgroundColor: C.cardBg, borderRadius: 10, borderWidth: 1, borderColor: C.divider,
    paddingHorizontal: 10, paddingVertical: 9, alignItems: 'center',
  },
  miniFilterBtnActive: { borderColor: C.amber, backgroundColor: '#FDF0E6' },
  miniFilterText: { fontSize: 11, fontWeight: '700', color: C.brownMid },
  miniFilterTextActive: { color: C.amber, fontWeight: '800' },

  countRow: { paddingHorizontal: 16, marginTop: 14, marginBottom: 8 },
  countText: { fontSize: 12.5, fontWeight: '800', color: C.brownMid, opacity: 0.75, letterSpacing: 0.3 },

  list: { paddingHorizontal: 16, gap: 10 },
  card: {
    backgroundColor: C.cardBg, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: C.divider,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1 },
    }),
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardBookingId: { fontSize: 12.5, fontWeight: '900', color: C.amber },
  cardClient: { fontSize: 13, fontWeight: '800', color: C.brown, marginTop: 3 },
  cardTour: { fontSize: 11, color: C.brownMid, opacity: 0.7, marginTop: 1 },
  eyeBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.lightBg, borderWidth: 1, borderColor: C.divider, alignItems: 'center', justifyContent: 'center' },

  cardAmountRow: { flexDirection: 'row', gap: 28, marginTop: 10 },
  cardAmountLabel: { fontSize: 9, color: C.brownMid, opacity: 0.6, fontWeight: '700' },
  cardAmountValue: { fontSize: 13, fontWeight: '900', color: C.brown, marginTop: 2 },

  cardBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  methodBadge: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  methodBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  cardDate: { fontSize: 10.5, color: C.brownMid, opacity: 0.6, fontWeight: '600' },

  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50, gap: 8 },
  emptyEmoji: { fontSize: 34 },
  emptyText: { fontSize: 12.5, color: C.brownMid, opacity: 0.7, fontWeight: '600' },

  pmBackdropWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 },
  pmBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(59,26,12,0.5)' },
  pmSheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: C.cardBg, borderTopLeftRadius: 22, borderTopRightRadius: 22,
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
