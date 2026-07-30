/**
 * mockData.ts
 * Type defs + filter option lists for the admin Dashboard Overview. All
 * panel data itself comes from the real `dashboard_data` API endpoint
 * (see DashboardOverview.tsx) — this file only holds shared types and the
 * static option lists the filter bar's date-range/status pickers use.
 */

export type DateRangeKey = 'this_month' | 'last_month' | 'this_year' | 'last_7_days' | 'last_30_days' | 'all_time';

export type BookingStatus = 'Confirmed' | 'Completed' | 'Pending' | 'Cancelled';
export type PaymentStatus = 'Paid' | 'Partial' | 'Unpaid' | 'Refunded';

export type DashboardFilters = {
  dateRange:      DateRangeKey;
  destination:    string;   // '' = all
  tourId:         number;   // 0 = all
  bookingStatus:  BookingStatus | '';
  paymentStatus:  PaymentStatus | '';
};

export const DEFAULT_FILTERS: DashboardFilters = {
  dateRange:     'this_month',
  destination:   '',
  tourId:        0,
  bookingStatus: '',
  paymentStatus: '',
};

export const DATE_RANGE_OPTIONS: { value: DateRangeKey; label: string }[] = [
  { value: 'this_month',   label: 'This Month' },
  { value: 'last_month',   label: 'Last Month' },
  { value: 'this_year',    label: 'This Year' },
  { value: 'last_7_days',  label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'all_time',     label: 'All Time' },
];

export const BOOKING_STATUS_OPTIONS: BookingStatus[] = ['Confirmed', 'Completed', 'Pending', 'Cancelled'];
export const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = ['Paid', 'Partial', 'Unpaid', 'Refunded'];

export function formatPeso(n: number): string {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `₱${(n / 1_000).toFixed(1)}K`;
  return `₱${Math.round(n).toLocaleString('en-US')}`;
}

/* ── Stat cards ── */
export type StatCardData = { value: string; trend: string; trendPositive: boolean };
export type StatsData = {
  successfulBookings: StatCardData;
  totalSales:         StatCardData;
  pendingBookings:    StatCardData;
  pendingPayments:    StatCardData;
};

/* ── Booking trends (line chart) ── */
export type TrendData = { labels: string[]; values: number[]; granularity: 'daily' | 'monthly' };

/* ── Destination popularity ── */
export type DestinationData = { name: string; bookings: number; trendShort: string; trendPositive: boolean };

/* ── Peak booking hours (bar chart) ── */
export type PeakHoursData = { labels: string[]; values: number[] };

/* ── Booking heatmap (day x 2-hour bucket) ── */
export type HeatmapData = { dayLabels: string[]; matrix: number[][]; max: number };

/* ── Donut slice (revenue breakdown / booking status / commission breakdowns) ── */
export type DonutSlice = { name: string; value: number; pct: number };

/* ── Recent bookings ── */
export type BookingRowData = {
  ref: string; name: string; tour: string; tourId: number; date: string;
  amount: string; status: BookingStatus; paymentStatus: PaymentStatus; initials: string;
};

/* ── Recent activities ── */
export type ActivityType = 'booking' | 'payment' | 'client' | 'review';
export type ActivityData = { type: ActivityType; message: string; timeAgo: string };

/* ── Commission (agency's cut of confirmed/ongoing/completed bookings) ── */
export type CommissionSummaryData = {
  total:           number;
  totalLabel:      string;
  trend:           string;
  trendPositive:   boolean;
  bookingCount:    number;
  avgPerBooking:   number;
  highestBooking:  number;
  basedOn:         string;
};
export type CommissionTrendData = { dates: string[]; commission: number[] };
export type CommissionTableRow = {
  reference: string; customer: string; destination: string;
  bookingAmount: string; commission: string; date: string;
};
export type RevenueVsCommissionData = { labels: string[]; revenue: number[]; commission: number[] };
export type BookingsByCategoryRow = { name: string; bookings: number; revenue: number };

/* ── Composed dashboard data (shape returned by the dashboard_data endpoint) ── */
export type DashboardData = {
  stats:              StatsData;
  trend:              TrendData;
  destinations:       DestinationData[];
  peakHours:          PeakHoursData;
  heatmap:            HeatmapData;
  revenueBreakdown:   DonutSlice[];
  revenueTotalLabel:  string;
  bookingStatusRows:  DonutSlice[];
  bookingStatusTotal: number;
  recentBookings:     BookingRowData[];
  recentActivities:   ActivityData[];
  commissionSummary:       CommissionSummaryData;
  commissionTrend:         CommissionTrendData;
  commissionByPackage:     DonutSlice[];
  commissionByDestination: DonutSlice[];
  commissionTable:         CommissionTableRow[];
  revenueVsCommission:     RevenueVsCommissionData;
  bookingsByCategory:      BookingsByCategoryRow[];
};
