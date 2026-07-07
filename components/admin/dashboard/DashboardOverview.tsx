/**
 * DashboardOverview.tsx
 * Composes the slicer bar + stat cards + chart/table panels into the
 * Admin Dashboard's "Dashboard" tab content.
 */

import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useAppTheme, ColorPalette } from '../ThemeContext';
import Copyright from '@/components/Copyright';
import WelcomeBanner from './WelcomeBanner';
import FilterBar from './FilterBar';
import {
  StatRow, BookingTrendsPanel, DestinationPopularityPanel,
  BookingHeatmapPanel, PeakHoursPanel,
  RevenueBreakdownPanel, BookingStatusPanel,
  RecentBookingsPanel, RecentActivitiesPanel,
} from './DashboardPanels';
import { DEFAULT_FILTERS, getDashboardData } from './mockData';

export default function DashboardOverview() {
  const { C } = useAppTheme();
  const s = useMemo(() => makeStyles(C), [C]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const data = useMemo(() => getDashboardData(filters), [filters]);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }}>
      <WelcomeBanner />

      <View style={s.filterSection}>
        <FilterBar filters={filters} onChange={setFilters} />
        <Text style={s.filterNote}>All panels update based on the selected filters.</Text>
      </View>

      <StatRow stats={data.stats} />

      <BookingTrendsPanel trend={data.trend} />
      <DestinationPopularityPanel destinations={data.destinations} />

      <BookingHeatmapPanel heatmap={data.heatmap} />
      <PeakHoursPanel peakHours={data.peakHours} />

      <RevenueBreakdownPanel slices={data.revenueBreakdown} totalLabel={data.revenueTotalLabel} />
      <BookingStatusPanel rows={data.bookingStatusRows} total={data.bookingStatusTotal} />

      <RecentBookingsPanel bookings={data.recentBookings} />
      <RecentActivitiesPanel activities={data.recentActivities} />

      <Copyright />
    </ScrollView>
  );
}

const makeStyles = (C: ColorPalette) => StyleSheet.create({
  filterSection: { marginBottom: 14 },
  filterNote: { fontSize: 9.5, color: C.brownMid, opacity: 0.6, textAlign: 'right', marginHorizontal: 16, marginTop: 6 },
});
