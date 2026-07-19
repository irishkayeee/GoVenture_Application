/**
 * DashboardOverview.tsx
 * Composes the slicer bar + stat cards + chart/table panels into the
 * Admin Dashboard's "Dashboard" tab content.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
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
import { DEFAULT_FILTERS, DashboardData } from './mockData';
import { DASHBOARD_DATA_API_URL } from '@/constants/api';

export default function DashboardOverview() {
  const { C } = useAppTheme();
  const s = useMemo(() => makeStyles(C), [C]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        dateRange: filters.dateRange,
        destination: filters.destination,
        tourId: String(filters.tourId),
        bookingStatus: filters.bookingStatus,
        paymentStatus: filters.paymentStatus,
      });
      const res = await fetch(`${DASHBOARD_DATA_API_URL}&${params.toString()}`);
      const result = await res.json();
      if (result.status === 'success') setData(result.data);
      else setError(result.message || 'Failed to load dashboard data.');
    } catch {
      setError("Can't connect to the server. Please check if XAMPP is running.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }}>
      <WelcomeBanner />

      <View style={s.filterSection}>
        <FilterBar filters={filters} onChange={setFilters} />
        <Text style={s.filterNote}>All panels update based on the selected filters.</Text>
      </View>

      {loading ? (
        <View style={s.centerWrap}><ActivityIndicator color={C.amber} /></View>
      ) : error || !data ? (
        <View style={s.centerWrap}>
          <Text style={s.errorText}>{error || 'Something went wrong.'}</Text>
          <TouchableOpacity onPress={loadData}><Text style={[s.errorText, { color: C.amber, fontWeight: '800' }]}>Tap to retry</Text></TouchableOpacity>
        </View>
      ) : (
        <>
          <StatRow stats={data.stats} />

          <BookingTrendsPanel trend={data.trend} />
          <DestinationPopularityPanel destinations={data.destinations} />

          <BookingHeatmapPanel heatmap={data.heatmap} />
          <PeakHoursPanel peakHours={data.peakHours} />

          <RevenueBreakdownPanel slices={data.revenueBreakdown} totalLabel={data.revenueTotalLabel} />
          <BookingStatusPanel rows={data.bookingStatusRows} total={data.bookingStatusTotal} />

          <RecentBookingsPanel bookings={data.recentBookings} />
          <RecentActivitiesPanel activities={data.recentActivities} />
        </>
      )}

      <Copyright />
    </ScrollView>
  );
}

const makeStyles = (C: ColorPalette) => StyleSheet.create({
  filterSection: { marginBottom: 14 },
  filterNote: { fontSize: 9.5, color: C.brownMid, opacity: 0.6, textAlign: 'right', marginHorizontal: 16, marginTop: 6 },
  centerWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8 },
  errorText: { fontSize: 12.5, color: C.brownMid, opacity: 0.7, fontWeight: '600' },
});
