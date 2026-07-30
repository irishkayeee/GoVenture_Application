/**
 * DashboardPanels.tsx
 * Stat cards + chart/list panels that make up the Dashboard Overview tab.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { DONUT_COLORS, C as LIGHT_C } from './theme';
import { useAppTheme, ColorPalette } from '../ThemeContext';
import { MiniLineChart, MiniBarChart, MiniDualBarChart, DonutChart } from './charts';
import {
  DashboardData, StatCardData, BookingRowData, ActivityData, ActivityType,
  CommissionSummaryData, CommissionTableRow,
} from './mockData';

const { width: SCREEN_W } = Dimensions.get('window');
const PANEL_INNER_W = SCREEN_W - 32 - 28; // screen minus outer margin minus panel padding

/* ── Icons ── */
const TrendUpIcon = ({ color = LIGHT_C.success }: { color?: string }) => (
  <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
    <Path d="M22 7l-9 9-4-4L2 18" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16 7h6v6" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const TrendDownIcon = ({ color = LIGHT_C.danger }: { color?: string }) => (
  <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
    <Path d="M22 17l-9-9-4 4L2 6" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16 17h6v-6" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const BookingsGlyph = ({ color, size = 20 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M2 9a3 3 0 100 6v2a2 2 0 002 2h16a2 2 0 002-2v-2a3 3 0 100-6V7a2 2 0 00-2-2H4a2 2 0 00-2 2z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" /><Path d="M13 5v2M13 17v2M13 11v2" stroke={color} strokeWidth={1.8} strokeLinecap="round" /></Svg>
);
const SalesGlyph = ({ color, size = 20 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M12 2v20" stroke={color} strokeWidth={1.8} strokeLinecap="round" /><Path d="M17 6.5H9.5a3 3 0 000 6h5a3 3 0 010 6H6" stroke={color} strokeWidth={1.8} strokeLinecap="round" /></Svg>
);
const PendingBookingsGlyph = ({ color, size = 20 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M4.5 4h15A1.5 1.5 0 0121 5.5v15a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 20.5v-15A1.5 1.5 0 014.5 4z" stroke={color} strokeWidth={1.8} /><Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth={1.8} strokeLinecap="round" /></Svg>
);
const PendingPaymentsGlyph = ({ color, size = 20 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M4 7a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" stroke={color} strokeWidth={1.8} /><Path d="M2 10h20" stroke={color} strokeWidth={1.8} strokeLinecap="round" /></Svg>
);
const LocationGlyph = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"><Path d="M12 21s-7-6.4-7-11.5A7 7 0 0119 9.5C19 14.6 12 21 12 21z" stroke="#fff" strokeWidth={1.8} strokeLinejoin="round" opacity={0.9} /><Path d="M14.5 9.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" stroke="#fff" strokeWidth={1.8} opacity={0.9} /></Svg>
);
const ACTIVITY_ICON: Record<ActivityType, { bg: string; color: string; icon: React.FC<{ color: string }> }> = {
  booking: { bg: '#FFF3E8', color: LIGHT_C.amber,   icon: BookingsGlyph },
  payment: { bg: '#FCE4E1', color: LIGHT_C.danger,  icon: PendingPaymentsGlyph },
  client:  { bg: '#E8F5E9', color: LIGHT_C.success, icon: PendingBookingsGlyph },
  review:  { bg: '#EDE7F6', color: LIGHT_C.purple,  icon: SalesGlyph },
};

/* ── Shared panel wrapper ── */
export const Panel = ({
  title, subtitle, right, children, style,
}: { title: string; subtitle?: string; right?: React.ReactNode; children: React.ReactNode; style?: object }) => {
  const { C } = useAppTheme();
  const p = useMemo(() => makePanelStyles(C), [C]);
  return (
    <View style={[p.panel, style]}>
      <View style={p.header}>
        <View style={{ flex: 1 }}>
          <Text style={p.title}>{title}</Text>
          {!!subtitle && <Text style={p.subtitle}>{subtitle}</Text>}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
};

const makePanelStyles = (C: ColorPalette) => StyleSheet.create({
  panel: {
    backgroundColor: C.cardBg, borderRadius: 14, padding: 14,
    marginHorizontal: 16, marginBottom: 12,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 2 },
    }),
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10, gap: 8 },
  title:    { fontSize: 13, fontWeight: '900', color: C.brown },
  subtitle: { fontSize: 10, color: C.brownMid, opacity: 0.7, marginTop: 2 },
});

/* ════════════════════════════════════════
   STAT ROW
════════════════════════════════════════ */
const STAT_CARDS: { key: keyof DashboardData['stats']; label: string; Icon: React.FC<{ color: string; size?: number }> }[] = [
  { key: 'successfulBookings', label: 'SUCCESSFUL BOOKINGS', Icon: BookingsGlyph },
  { key: 'totalSales',         label: 'TOTAL SALES',         Icon: SalesGlyph },
  { key: 'pendingBookings',    label: 'PENDING BOOKINGS',    Icon: PendingBookingsGlyph },
  { key: 'pendingPayments',    label: 'PENDING PAYMENTS',    Icon: PendingPaymentsGlyph },
];

export const StatRow = ({ stats }: { stats: DashboardData['stats'] }) => {
  const { C } = useAppTheme();
  const sr = useMemo(() => makeStatRowStyles(C), [C]);
  return (
    <View style={sr.row}>
      {STAT_CARDS.map(({ key, label, Icon }) => {
        const s: StatCardData = stats[key];
        return (
          <View key={key} style={sr.card}>
            <View style={sr.icoWrap}>
              <Icon color={C.amber} size={15} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={sr.label} numberOfLines={2}>{label}</Text>
              <Text style={sr.value} numberOfLines={1}>{s.value}</Text>
              <View style={sr.trendRow}>
                {s.trendPositive ? <TrendUpIcon color={C.success} /> : <TrendDownIcon color={C.danger} />}
                <Text
                  style={[sr.trendText, { color: s.trendPositive ? C.success : C.danger }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  {s.trend}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const makeStatRowStyles = (C: ColorPalette) => StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginBottom: 16 },
  card: {
    flex: 1, minWidth: (SCREEN_W - 32 - 8) / 2,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.cardBg, borderRadius: 16, padding: 10,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 2 },
    }),
  },
  icoWrap: {
    width: 30, height: 30, borderRadius: 9, backgroundColor: '#FFF3E8',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  label: { fontSize: 7.5, fontWeight: '800', color: C.brownMid, opacity: 0.65, letterSpacing: 0.3, lineHeight: 10 },
  value: { fontSize: 16, fontWeight: '900', color: C.brown, marginTop: 2 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  trendText: { fontSize: 8.5, fontWeight: '700', flexShrink: 1 },
});

/* ════════════════════════════════════════
   BOOKING TRENDS + DESTINATION POPULARITY
════════════════════════════════════════ */
export const BookingTrendsPanel = ({ trend }: { trend: DashboardData['trend'] }) => {
  const { C } = useAppTheme();
  return (
    <Panel
      title="Booking Trends"
      subtitle={`${trend.granularity === 'monthly' ? 'Monthly' : 'Daily'} booking trends for the selected range`}
    >
      <MiniLineChart values={trend.values} labels={trend.labels} color={C.amber} width={PANEL_INNER_W} />
    </Panel>
  );
};

export const DestinationPopularityPanel = ({ destinations }: { destinations: DashboardData['destinations'] }) => {
  const { C } = useAppTheme();
  const dp = useMemo(() => makeDestinationStyles(C), [C]);
  const max = Math.max(1, ...destinations.map((d) => d.bookings));
  return (
    <Panel title="Destination Popularity" subtitle="Top performing destinations">
      {destinations.length === 0 ? (
        <Text style={dp.empty}>No bookings in this range.</Text>
      ) : destinations.map((d, i) => (
        <View key={d.name} style={[dp.row, i === destinations.length - 1 && { borderBottomWidth: 0 }]}>
          <View style={dp.rank}><Text style={dp.rankText}>{i + 1}</Text></View>
          <View style={[dp.thumb, { backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }]}>
            <LocationGlyph />
          </View>
          <View style={dp.info}>
            <Text style={dp.name} numberOfLines={1}>{d.name}</Text>
            <Text style={dp.count}>{d.bookings} Bookings</Text>
          </View>
          <View style={dp.barTrack}>
            <View style={[dp.barFill, { width: `${Math.round((d.bookings / max) * 100)}%` as any }]} />
          </View>
          <Text style={[dp.trend, { color: d.trendPositive ? C.success : C.danger }]}>{d.trendShort}</Text>
        </View>
      ))}
    </Panel>
  );
};

const makeDestinationStyles = (C: ColorPalette) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.divider },
  rank: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#FFF3E8', alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 9, fontWeight: '800', color: C.amber },
  thumb: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  info: { width: 92 },
  name: { fontSize: 11, fontWeight: '700', color: C.brown },
  count: { fontSize: 9, color: C.brownMid, opacity: 0.65, marginTop: 1 },
  barTrack: { flex: 1, height: 6, backgroundColor: C.divider, borderRadius: 3, overflow: 'hidden', minWidth: 20 },
  barFill: { height: '100%', backgroundColor: C.amber, borderRadius: 3 },
  trend: { fontSize: 10, fontWeight: '800', width: 40, textAlign: 'right' },
  empty: { fontSize: 11, color: C.brownMid, opacity: 0.6, textAlign: 'center', paddingVertical: 12 },
});

/* ════════════════════════════════════════
   BOOKING HEATMAP + PEAK HOURS
════════════════════════════════════════ */
const HEAT_COLORS = ['#F3E6DA', '#F0CBA0', '#E3A466', '#D07E30', '#A85E1B'];

export const BookingHeatmapPanel = ({ heatmap }: { heatmap: DashboardData['heatmap'] }) => {
  const { C } = useAppTheme();
  const hm = useMemo(() => makeHeatmapStyles(C), [C]);
  return (
    <Panel title="Booking Heatmap" subtitle="Busiest days of the week">
      <View style={{ gap: 5 }}>
        {heatmap.dayLabels.map((label, di) => (
          <View key={label} style={hm.row}>
            <Text style={hm.dayLabel}>{label}</Text>
            <View style={hm.cells}>
              {heatmap.matrix[di].map((count, hi) => {
                const level = count === 0 ? 0 : Math.min(4, 1 + Math.floor((count / heatmap.max) * 3));
                return <View key={hi} style={[hm.cell, { backgroundColor: HEAT_COLORS[level] }]} />;
              })}
            </View>
          </View>
        ))}
      </View>
      <View style={hm.legendRow}>
        <Text style={hm.legendText}>Low</Text>
        <View style={{ flexDirection: 'row', gap: 3 }}>
          {HEAT_COLORS.map((c) => <View key={c} style={[hm.legendCell, { backgroundColor: c }]} />)}
        </View>
        <Text style={hm.legendText}>High</Text>
      </View>
    </Panel>
  );
};

const makeHeatmapStyles = (C: ColorPalette) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dayLabel: { width: 26, fontSize: 9.5, fontWeight: '700', color: C.brown },
  cells: { flexDirection: 'row', gap: 2, flex: 1 },
  cell: { flex: 1, aspectRatio: 1, maxHeight: 14, borderRadius: 3 },
  legendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 10 },
  legendText: { fontSize: 9, color: C.brownMid, opacity: 0.7 },
  legendCell: { width: 11, height: 11, borderRadius: 3 },
});

export const PeakHoursPanel = ({ peakHours }: { peakHours: DashboardData['peakHours'] }) => {
  const { C } = useAppTheme();
  return (
    <Panel title="Peak Booking Hours" subtitle="Most active booking times">
      <MiniBarChart values={peakHours.values} labels={peakHours.labels} color={C.amber} width={PANEL_INNER_W} height={170} />
    </Panel>
  );
};

/* ════════════════════════════════════════
   DONUT PANELS — Revenue Breakdown / Booking Status
════════════════════════════════════════ */
const DonutLegend = ({ items }: { items: { name: string; pct: number; valueText: string }[] }) => {
  const { C } = useAppTheme();
  const dg = useMemo(() => makeDonutLegendStyles(C), [C]);
  return (
    <View style={{ flex: 1, gap: 8, minWidth: 0 }}>
      {items.map((it, i) => (
        <View key={it.name} style={dg.row}>
          <View style={[dg.dot, { backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }]} />
          <Text style={dg.label} numberOfLines={1}>{it.name}</Text>
          <Text style={dg.value}>{it.pct}% · {it.valueText}</Text>
        </View>
      ))}
    </View>
  );
};

const makeDonutLegendStyles = (C: ColorPalette) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { flex: 1, fontSize: 10.5, fontWeight: '700', color: C.brown },
  value: { fontSize: 9.5, color: C.brownMid, opacity: 0.75 },
});

export const RevenueBreakdownPanel = ({ slices, totalLabel }: { slices: DashboardData['revenueBreakdown']; totalLabel: string }) => {
  const { C } = useAppTheme();
  const dw = useMemo(() => makeDonutWrapStyles(C), [C]);
  return (
    <Panel title="Revenue Breakdown" subtitle="Where your revenue comes from">
      <View style={dw.row}>
        <View style={dw.donutWrap}>
          <DonutChart slices={slices.map((s, i) => ({ value: s.value, color: DONUT_COLORS[i % DONUT_COLORS.length] }))} />
          <View style={dw.center}>
            <Text style={dw.centerValue} numberOfLines={1}>{totalLabel}</Text>
            <Text style={dw.centerLabel}>Total Revenue</Text>
          </View>
        </View>
        <DonutLegend items={slices.map((s) => ({ name: s.name, pct: s.pct, valueText: `₱${Math.round(s.value).toLocaleString('en-US')}` }))} />
      </View>
    </Panel>
  );
};

export const BookingStatusPanel = ({ rows, total }: { rows: DashboardData['bookingStatusRows']; total: number }) => {
  const { C } = useAppTheme();
  const dw = useMemo(() => makeDonutWrapStyles(C), [C]);
  return (
    <Panel title="Booking Status" subtitle="Overview of all bookings">
      <View style={dw.row}>
        <View style={dw.donutWrap}>
          <DonutChart slices={rows.map((s, i) => ({ value: s.value, color: DONUT_COLORS[i % DONUT_COLORS.length] }))} />
          <View style={dw.center}>
            <Text style={dw.centerValue}>{total.toLocaleString('en-US')}</Text>
            <Text style={dw.centerLabel}>Total</Text>
          </View>
        </View>
        <DonutLegend items={rows.map((r) => ({ name: r.name, pct: r.pct, valueText: `${r.value}` }))} />
      </View>
    </Panel>
  );
};

const makeDonutWrapStyles = (C: ColorPalette) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  donutWrap: { width: 110, height: 110, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  centerValue: { fontSize: 13, fontWeight: '900', color: C.brown, maxWidth: 90, textAlign: 'center' },
  centerLabel: { fontSize: 8, color: C.brownMid, opacity: 0.65, marginTop: 1 },
});

/* ════════════════════════════════════════
   RECENT BOOKINGS (horizontal-scroll table)
════════════════════════════════════════ */
const STATUS_STYLE: Record<BookingRowData['status'], { bg: string; color: string }> = {
  Confirmed: { bg: '#E7F9F3', color: '#12946F' },
  Completed: { bg: '#EAF1FB', color: LIGHT_C.info },
  Pending:   { bg: '#FFF5E0', color: '#B8922E' },
  Cancelled: { bg: '#FDEAEA', color: LIGHT_C.danger },
};
const AVATAR_COLORS = [LIGHT_C.amber, LIGHT_C.purple, LIGHT_C.info, LIGHT_C.danger];

export const RecentBookingsPanel = ({ bookings }: { bookings: BookingRowData[] }) => {
  const { C } = useAppTheme();
  const dp = useMemo(() => makeDestinationStyles(C), [C]);
  const rb = useMemo(() => makeRecentBookingsStyles(C), [C]);
  return (
    <Panel title="Recent Bookings" subtitle="Latest bookings made by customers">
      {bookings.length === 0 ? (
        <Text style={dp.empty}>No bookings match the selected filters.</Text>
      ) : (
        <View style={rb.table}>
          <View style={rb.headRow}>
            <Text style={[rb.headCell, { flex: 1.9 }]}>CUSTOMER</Text>
            <Text style={[rb.headCell, { flex: 2.1 }]}>TOUR</Text>
            <Text style={[rb.headCell, { flex: 1 }]}>DATE</Text>
            <Text style={[rb.headCell, { flex: 1.1 }]}>AMOUNT</Text>
            <Text style={[rb.headCell, { flex: 1.3 }]}>STATUS</Text>
          </View>
          {bookings.map((b, i) => {
            const st = STATUS_STYLE[b.status];
            return (
              <View key={b.ref} style={[rb.row, i === bookings.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={[{ flex: 1.9 }, rb.customerCell]}>
                  <View style={[rb.avatar, { backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }]}>
                    <Text style={rb.avatarText}>{b.initials}</Text>
                  </View>
                  <Text style={[rb.cellText, { flex: 1 }]} numberOfLines={1}>{b.name}</Text>
                </View>
                <Text style={[rb.cellText, { flex: 2.1 }]} numberOfLines={1}>{b.tour}</Text>
                <Text style={[rb.cellText, { flex: 1 }]} numberOfLines={1}>{b.date}</Text>
                <Text style={[rb.amount, { flex: 1.1 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{b.amount}</Text>
                <View style={{ flex: 1.3 }}>
                  <View style={[rb.statusBadge, { backgroundColor: st.bg, alignSelf: 'flex-start' }]}>
                    <Text style={[rb.statusText, { color: st.color }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{b.status}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Panel>
  );
};

const makeRecentBookingsStyles = (C: ColorPalette) => StyleSheet.create({
  table: {},
  headRow: { flexDirection: 'row', gap: 4, borderBottomWidth: 1.5, borderBottomColor: C.divider, paddingBottom: 8, marginBottom: 4 },
  headCell: { fontSize: 8.5, fontWeight: '800', color: C.brownMid, opacity: 0.65, letterSpacing: 0.4, minWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.divider },
  customerCell: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
  avatar: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 8, fontWeight: '800', color: C.white },
  cellText: { fontSize: 10.5, color: C.brown, minWidth: 0 },
  amount: { fontSize: 10.5, fontWeight: '800', color: C.brown, minWidth: 0 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 9, fontWeight: '800' },
});

/* ════════════════════════════════════════
   RECENT ACTIVITIES
════════════════════════════════════════ */
export const RecentActivitiesPanel = ({ activities }: { activities: ActivityData[] }) => {
  const { C } = useAppTheme();
  const ac = useMemo(() => makeActivitiesStyles(C), [C]);
  return (
    <Panel title="Recent Activities" subtitle="See what's happening in your business">
      {activities.map((a, i) => {
        const style = ACTIVITY_ICON[a.type];
        const Icon = style.icon;
        return (
          <View key={i} style={[ac.row, i === activities.length - 1 && { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <View style={[ac.icoWrap, { backgroundColor: style.bg }]}>
              <Icon color={style.color} />
            </View>
            <Text style={ac.text}>{a.message}</Text>
            <Text style={ac.time}>{a.timeAgo}</Text>
          </View>
        );
      })}
    </Panel>
  );
};

const makeActivitiesStyles = (C: ColorPalette) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.divider },
  icoWrap: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  text: { flex: 1, fontSize: 11, color: C.brown, lineHeight: 15 },
  time: { fontSize: 9, color: C.brownMid, opacity: 0.6, marginTop: 1 },
});

/* ════════════════════════════════════════
   COMMISSION SUMMARY
════════════════════════════════════════ */
export const CommissionSummaryPanel = ({ summary }: { summary: CommissionSummaryData }) => {
  const { C } = useAppTheme();
  const cs = useMemo(() => makeCommissionSummaryStyles(C), [C]);
  return (
    <Panel title="Commission Summary" subtitle={summary.basedOn}>
      <View style={cs.headRow}>
        <Text style={cs.totalValue}>{summary.totalLabel}</Text>
        <View style={cs.trendRow}>
          {summary.trendPositive ? <TrendUpIcon color={C.success} /> : <TrendDownIcon color={C.danger} />}
          <Text style={[cs.trendText, { color: summary.trendPositive ? C.success : C.danger }]}>{summary.trend}</Text>
        </View>
      </View>
      <View style={cs.metaRow}>
        <View style={cs.metaCell}>
          <Text style={cs.metaLabel}>BOOKINGS</Text>
          <Text style={cs.metaValue}>{summary.bookingCount}</Text>
        </View>
        <View style={cs.metaCell}>
          <Text style={cs.metaLabel}>AVG / BOOKING</Text>
          <Text style={cs.metaValue}>₱{Math.round(summary.avgPerBooking).toLocaleString('en-US')}</Text>
        </View>
        <View style={cs.metaCell}>
          <Text style={cs.metaLabel}>HIGHEST</Text>
          <Text style={cs.metaValue}>₱{Math.round(summary.highestBooking).toLocaleString('en-US')}</Text>
        </View>
      </View>
    </Panel>
  );
};

const makeCommissionSummaryStyles = (C: ColorPalette) => StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 },
  totalValue: { fontSize: 22, fontWeight: '900', color: C.brown },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trendText: { fontSize: 10.5, fontWeight: '700' },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  metaCell: { flex: 1, backgroundColor: C.lightBg, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  metaLabel: { fontSize: 7.5, fontWeight: '800', color: C.brownMid, opacity: 0.65, letterSpacing: 0.3 },
  metaValue: { fontSize: 12, fontWeight: '900', color: C.brown, marginTop: 3 },
});

/* ════════════════════════════════════════
   COMMISSION TREND
════════════════════════════════════════ */
export const CommissionTrendPanel = ({ trend }: { trend: DashboardData['commissionTrend'] }) => {
  const { C } = useAppTheme();
  return (
    <Panel title="Commission Trend" subtitle="Agency commission over the selected range">
      <MiniLineChart values={trend.commission} labels={trend.dates} color="#9C27B0" width={PANEL_INNER_W} />
    </Panel>
  );
};

/* ════════════════════════════════════════
   COMMISSION BY PACKAGE / DESTINATION
════════════════════════════════════════ */
export const CommissionByPackagePanel = ({ slices }: { slices: DashboardData['commissionByPackage'] }) => {
  const { C } = useAppTheme();
  const dw = useMemo(() => makeDonutWrapStyles(C), [C]);
  return (
    <Panel title="Commission by Package" subtitle="Top-earning tour packages">
      {slices.length === 0 ? (
        <Text style={{ fontSize: 11, opacity: 0.6 }}>No confirmed bookings in this range.</Text>
      ) : (
        <View style={dw.row}>
          <View style={dw.donutWrap}>
            <DonutChart slices={slices.map((s, i) => ({ value: s.value, color: DONUT_COLORS[i % DONUT_COLORS.length] }))} />
          </View>
          <DonutLegend items={slices.map((s) => ({ name: s.name, pct: s.pct, valueText: `₱${Math.round(s.value).toLocaleString('en-US')}` }))} />
        </View>
      )}
    </Panel>
  );
};

export const CommissionByDestinationPanel = ({ slices }: { slices: DashboardData['commissionByDestination'] }) => {
  const { C } = useAppTheme();
  const dp = useMemo(() => makeDestinationStyles(C), [C]);
  const max = Math.max(1, ...slices.map((s) => s.value));
  return (
    <Panel title="Commission by Destination" subtitle="Top-earning destinations">
      {slices.length === 0 ? (
        <Text style={dp.empty}>No confirmed bookings in this range.</Text>
      ) : slices.map((s, i) => (
        <View key={s.name} style={[dp.row, i === slices.length - 1 && { borderBottomWidth: 0 }]}>
          <View style={dp.rank}><Text style={dp.rankText}>{i + 1}</Text></View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={dp.name} numberOfLines={1}>{s.name}</Text>
            <Text style={dp.count}>₱{Math.round(s.value).toLocaleString('en-US')}</Text>
          </View>
          <View style={dp.barTrack}>
            <View style={[dp.barFill, { width: `${Math.round((s.value / max) * 100)}%` as any, backgroundColor: '#9C27B0' }]} />
          </View>
          <Text style={[dp.trend, { color: C.brownMid, width: 32 }]}>{s.pct}%</Text>
        </View>
      ))}
    </Panel>
  );
};

/* ════════════════════════════════════════
   REVENUE VS COMMISSION
════════════════════════════════════════ */
export const RevenueVsCommissionPanel = ({ data }: { data: DashboardData['revenueVsCommission'] }) => {
  const { C } = useAppTheme();
  const rv = useMemo(() => makeRvcStyles(C), [C]);
  return (
    <Panel
      title="Revenue vs. Commission"
      subtitle="Total booking revenue against agency commission"
      right={
        <View style={rv.legendRow}>
          <View style={rv.legendItem}><View style={[rv.dot, { backgroundColor: C.amber }]} /><Text style={rv.legendText}>Revenue</Text></View>
          <View style={rv.legendItem}><View style={[rv.dot, { backgroundColor: '#9C27B0' }]} /><Text style={rv.legendText}>Commission</Text></View>
        </View>
      }
    >
      <MiniDualBarChart
        valuesA={data.revenue} valuesB={data.commission} labels={data.labels}
        colorA={C.amber} colorB="#9C27B0" width={PANEL_INNER_W}
      />
    </Panel>
  );
};

const makeRvcStyles = (C: ColorPalette) => StyleSheet.create({
  legendRow: { flexDirection: 'row', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  legendText: { fontSize: 9, color: C.brownMid, opacity: 0.75 },
});

/* ════════════════════════════════════════
   COMMISSION TABLE
════════════════════════════════════════ */
export const CommissionTablePanel = ({ rows }: { rows: CommissionTableRow[] }) => {
  const { C } = useAppTheme();
  const dp = useMemo(() => makeDestinationStyles(C), [C]);
  const rb = useMemo(() => makeRecentBookingsStyles(C), [C]);
  return (
    <Panel title="Commission Details" subtitle="Per-booking commission breakdown">
      {rows.length === 0 ? (
        <Text style={dp.empty}>No confirmed bookings in this range.</Text>
      ) : (
        <View style={rb.table}>
          <View style={rb.headRow}>
            <Text style={[rb.headCell, { flex: 1.7 }]}>BOOKING</Text>
            <Text style={[rb.headCell, { flex: 1.8 }]}>DESTINATION</Text>
            <Text style={[rb.headCell, { flex: 1.2 }]}>AMOUNT</Text>
            <Text style={[rb.headCell, { flex: 1.2 }]}>COMMISSION</Text>
          </View>
          {rows.map((r, i) => (
            <View key={r.reference} style={[rb.row, i === rows.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1.7, minWidth: 0 }}>
                <Text style={rb.cellText} numberOfLines={1}>{r.reference}</Text>
                <Text style={[rb.cellText, { fontSize: 9, opacity: 0.6 }]} numberOfLines={1}>{r.customer}</Text>
              </View>
              <Text style={[rb.cellText, { flex: 1.8 }]} numberOfLines={1}>{r.destination}</Text>
              <Text style={[rb.cellText, { flex: 1.2 }]} numberOfLines={1}>{r.bookingAmount}</Text>
              <Text style={[rb.amount, { flex: 1.2, color: '#9C27B0' }]} numberOfLines={1}>{r.commission}</Text>
            </View>
          ))}
        </View>
      )}
    </Panel>
  );
};

/* ════════════════════════════════════════
   BOOKINGS BY CATEGORY (Domestic vs International)
════════════════════════════════════════ */
export const BookingsByCategoryPanel = ({ rows }: { rows: DashboardData['bookingsByCategory'] }) => {
  const { C } = useAppTheme();
  const bc = useMemo(() => makeCategoryStyles(C), [C]);
  const totalBookings = rows.reduce((a, r) => a + r.bookings, 0) || 1;
  return (
    <Panel title="Bookings by Category" subtitle="Domestic vs. international demand">
      <View style={bc.row}>
        {rows.map((r, i) => (
          <View key={r.name} style={bc.card}>
            <View style={[bc.dot, { backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }]} />
            <Text style={bc.name}>{r.name}</Text>
            <Text style={bc.count}>{r.bookings}</Text>
            <Text style={bc.pct}>{Math.round((r.bookings / totalBookings) * 100)}% of bookings</Text>
            <Text style={bc.revenue}>₱{Math.round(r.revenue).toLocaleString('en-US')} revenue</Text>
          </View>
        ))}
      </View>
    </Panel>
  );
};

const makeCategoryStyles = (C: ColorPalette) => StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  card: { flex: 1, backgroundColor: C.lightBg, borderRadius: 12, padding: 12, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginBottom: 6 },
  name: { fontSize: 10.5, fontWeight: '800', color: C.brown },
  count: { fontSize: 18, fontWeight: '900', color: C.brown, marginTop: 4 },
  pct: { fontSize: 9, color: C.brownMid, opacity: 0.7, marginTop: 2 },
  revenue: { fontSize: 9.5, fontWeight: '700', color: C.amber, marginTop: 4 },
});
