/**
 * mockData.ts
 * Client-side mock data for the admin Dashboard Overview.
 * No backend exists yet, so getDashboardData() derives all panel data
 * from a small base dataset, scaled/filtered by the active slicer bar filters.
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

export const TOUR_OPTIONS: { id: number; label: string }[] = [
  { id: 1, label: 'El Nido Island Hopping' },
  { id: 2, label: 'Japan Highlights Tour' },
  { id: 3, label: 'Cappadocia Adventure' },
  { id: 4, label: 'Santorini Getaway' },
  { id: 5, label: 'Boracay Beach Escape' },
];

export const DESTINATION_OPTIONS = [
  'El Nido, Palawan', 'Kyoto, Japan', 'Cappadocia, Turkey', 'Santorini, Greece', 'Boracay, Philippines',
];

export const BOOKING_STATUS_OPTIONS: BookingStatus[] = ['Confirmed', 'Completed', 'Pending', 'Cancelled'];
export const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = ['Paid', 'Partial', 'Unpaid', 'Refunded'];

const RANGE_MULTIPLIER: Record<DateRangeKey, number> = {
  this_month:   1,
  last_month:   0.86,
  this_year:    11.4,
  last_7_days:  0.24,
  last_30_days: 1.02,
  all_time:     34.5,
};

const RANGE_TREND_LABEL: Record<DateRangeKey, string> = {
  this_month:   'vs last month',
  last_month:   'vs prior month',
  this_year:    'vs last year',
  last_7_days:  'vs prior week',
  last_30_days: 'vs prior 30 days',
  all_time:     'all-time',
};

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

function buildStats(dateRange: DateRangeKey): StatsData {
  const m = RANGE_MULTIPLIER[dateRange];
  const suffix = RANGE_TREND_LABEL[dateRange];
  const successfulBookings = Math.round(248 * m);
  const totalSales         = 1_240_000 * m;
  const pendingBookings    = Math.max(0, Math.round(16 * m));
  const pendingPayments    = Math.max(0, Math.round(9 * m));

  return {
    successfulBookings: { value: successfulBookings.toLocaleString('en-US'), trend: `+12% ${suffix}`, trendPositive: true },
    totalSales:          { value: formatPeso(totalSales),                    trend: `+8% ${suffix}`,  trendPositive: true },
    pendingBookings:     { value: pendingBookings.toLocaleString('en-US'),    trend: `-3% ${suffix}`,  trendPositive: false },
    pendingPayments:     { value: pendingPayments.toLocaleString('en-US'),   trend: `+5% ${suffix}`,  trendPositive: true },
  };
}

/* ── Booking trends (line chart) ── */
export type TrendData = { labels: string[]; values: number[]; granularity: 'daily' | 'monthly' };

function buildTrend(dateRange: DateRangeKey): TrendData {
  const m = RANGE_MULTIPLIER[dateRange];
  const monthly = dateRange === 'this_year' || dateRange === 'all_time';

  if (monthly) {
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const values = labels.map((_, i) => Math.max(2, Math.round((60 + 40 * Math.sin(i / 1.8) + i * 3) * (m / 11))));
    return { labels, values, granularity: 'monthly' };
  }

  const days = dateRange === 'last_7_days' ? 7 : 30;
  const labels = Array.from({ length: days }, (_, i) => `${i + 1}`);
  const values = labels.map((_, i) => Math.max(1, Math.round((8 + 6 * Math.sin(i / 3) + (i % 5)) * m)));
  return { labels, values, granularity: 'daily' };
}

/* ── Destination popularity ── */
export type DestinationData = { name: string; bookings: number; trendShort: string; trendPositive: boolean };

const BASE_DESTINATIONS: DestinationData[] = [
  { name: 'El Nido, Palawan',      bookings: 42, trendShort: '+15%', trendPositive: true  },
  { name: 'Kyoto, Japan',          bookings: 36, trendShort: '+9%',  trendPositive: true  },
  { name: 'Cappadocia, Turkey',    bookings: 30, trendShort: '-4%',  trendPositive: false },
  { name: 'Santorini, Greece',     bookings: 24, trendShort: '+6%',  trendPositive: true  },
  { name: 'Boracay, Philippines',  bookings: 19, trendShort: '+21%', trendPositive: true  },
];

function buildDestinations(dateRange: DateRangeKey, destinationFilter: string): DestinationData[] {
  const m = RANGE_MULTIPLIER[dateRange];
  let list = BASE_DESTINATIONS.map((d) => ({ ...d, bookings: Math.max(1, Math.round(d.bookings * m)) }));
  if (destinationFilter) list = list.filter((d) => d.name === destinationFilter);
  return list.sort((a, b) => b.bookings - a.bookings);
}

/* ── Peak booking hours (bar chart, all-time — unaffected by date range) ── */
export type PeakHoursData = { labels: string[]; values: number[] };

const BASE_PEAK_HOURS: PeakHoursData = {
  labels: ['12AM', '2AM', '4AM', '6AM', '8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM', '10PM'],
  values: [4, 2, 1, 6, 22, 38, 45, 40, 33, 48, 30, 12],
};

/* ── Booking heatmap (day x 2-hour bucket) ── */
export type HeatmapData = { dayLabels: string[]; matrix: number[][]; max: number };

const HEAT_DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildHeatmap(dateRange: DateRangeKey): HeatmapData {
  const m = RANGE_MULTIPLIER[dateRange];
  const matrix = HEAT_DAY_LABELS.map((_, day) =>
    Array.from({ length: 12 }, (_, hour) => {
      const weekendBoost = day === 0 || day === 6 ? 3 : 0;
      const base = 3 + 5 * Math.sin((hour + day) / 3) + weekendBoost;
      return Math.max(0, Math.round(base * m));
    })
  );
  const max = Math.max(1, ...matrix.flat());
  return { dayLabels: HEAT_DAY_LABELS, matrix, max };
}

/* ── Revenue breakdown (donut) ── */
export type DonutSlice = { name: string; value: number; pct: number };

function buildRevenueBreakdown(destinations: DestinationData[]): { slices: DonutSlice[]; totalLabel: string } {
  const avgPricePerBooking = 8500;
  const values = destinations.map((d) => d.bookings * avgPricePerBooking);
  const total = values.reduce((a, b) => a + b, 0) || 1;

  const top = destinations.slice(0, 4).map((d, i) => ({
    name: d.name,
    value: values[i],
    pct: Math.round((values[i] / total) * 100),
  }));

  const usedValue = top.reduce((a, s) => a + s.value, 0);
  const othersValue = total - usedValue;
  const slices = othersValue > 0
    ? [...top, { name: 'Others', value: othersValue, pct: Math.max(0, 100 - top.reduce((a, s) => a + s.pct, 0)) }]
    : top;

  return { slices, totalLabel: formatPeso(total) };
}

/* ── Booking status (donut) ── */
const BASE_STATUS_COUNTS: Record<BookingStatus, number> = { Confirmed: 120, Completed: 88, Pending: 28, Cancelled: 12 };

function buildBookingStatus(dateRange: DateRangeKey, statusFilter: BookingStatus | ''): { rows: DonutSlice[]; total: number } {
  const m = RANGE_MULTIPLIER[dateRange];
  let counts = (Object.entries(BASE_STATUS_COUNTS) as [BookingStatus, number][])
    .map(([name, v]) => ({ name, value: Math.max(0, Math.round(v * m)) }));
  if (statusFilter) counts = counts.filter((c) => c.name === statusFilter);

  const total = counts.reduce((a, c) => a + c.value, 0) || 1;
  const rows = counts.map((c) => ({ name: c.name, value: c.value, pct: Math.round((c.value / total) * 100) }));
  return { rows, total };
}

/* ── Recent bookings ── */
export type BookingRowData = {
  ref: string; name: string; tour: string; tourId: number; date: string;
  amount: string; status: BookingStatus; paymentStatus: PaymentStatus; initials: string;
};

const BASE_RECENT_BOOKINGS: BookingRowData[] = [
  { ref: 'BK-1042', name: 'Maria Santos', tour: 'El Nido Island Hopping', tourId: 1, date: 'Jun 28', amount: '₱18,500', status: 'Confirmed', paymentStatus: 'Paid',     initials: 'MS' },
  { ref: 'BK-1041', name: 'James Lim',    tour: 'Cappadocia Adventure',   tourId: 3, date: 'Jun 27', amount: '₱42,000', status: 'Pending',   paymentStatus: 'Partial',  initials: 'JL' },
  { ref: 'BK-1040', name: 'Anna Cruz',    tour: 'Japan Highlights Tour',  tourId: 2, date: 'Jun 26', amount: '₱35,200', status: 'Completed', paymentStatus: 'Paid',     initials: 'AC' },
  { ref: 'BK-1039', name: 'Carlos Reyes', tour: 'Santorini Getaway',      tourId: 4, date: 'Jun 25', amount: '₱51,000', status: 'Cancelled', paymentStatus: 'Refunded', initials: 'CR' },
  { ref: 'BK-1038', name: 'Bea Ramos',    tour: 'Boracay Beach Escape',   tourId: 5, date: 'Jun 24', amount: '₱9,800',  status: 'Confirmed', paymentStatus: 'Paid',     initials: 'BR' },
  { ref: 'BK-1037', name: 'Tom Villar',   tour: 'El Nido Island Hopping', tourId: 1, date: 'Jun 23', amount: '₱18,500', status: 'Pending',   paymentStatus: 'Unpaid',   initials: 'TV' },
];

function buildRecentBookings(filters: DashboardFilters): BookingRowData[] {
  return BASE_RECENT_BOOKINGS.filter((b) =>
    (filters.tourId === 0 || b.tourId === filters.tourId) &&
    (!filters.bookingStatus || b.status === filters.bookingStatus) &&
    (!filters.paymentStatus || b.paymentStatus === filters.paymentStatus)
  );
}

/* ── Recent activities ── */
export type ActivityType = 'booking' | 'payment' | 'client' | 'review';
export type ActivityData = { type: ActivityType; message: string; timeAgo: string };

const BASE_ACTIVITIES: ActivityData[] = [
  { type: 'booking', message: 'Maria Santos booked El Nido Island Hopping',        timeAgo: '12m ago' },
  { type: 'payment', message: 'Payment received for booking BK-1040 (₱35,200)',    timeAgo: '48m ago' },
  { type: 'client',  message: 'New client account created — Bea Ramos',            timeAgo: '2h ago'  },
  { type: 'review',  message: 'Anna Cruz left a 5-star review for Kyoto tour',      timeAgo: '3h ago'  },
  { type: 'booking', message: 'James Lim booked Cappadocia Adventure',              timeAgo: '5h ago'  },
  { type: 'payment', message: 'Refund processed for booking BK-1039 (₱51,000)',    timeAgo: '1d ago'  },
];

/* ── Composed dashboard data ── */
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
};

export function getDashboardData(filters: DashboardFilters): DashboardData {
  const destinations = buildDestinations(filters.dateRange, filters.destination);
  const { slices: revenueBreakdown, totalLabel: revenueTotalLabel } = buildRevenueBreakdown(destinations);
  const { rows: bookingStatusRows, total: bookingStatusTotal } = buildBookingStatus(filters.dateRange, filters.bookingStatus);

  return {
    stats: buildStats(filters.dateRange),
    trend: buildTrend(filters.dateRange),
    destinations,
    peakHours: BASE_PEAK_HOURS,
    heatmap: buildHeatmap(filters.dateRange),
    revenueBreakdown,
    revenueTotalLabel,
    bookingStatusRows,
    bookingStatusTotal,
    recentBookings: buildRecentBookings(filters),
    recentActivities: BASE_ACTIVITIES,
  };
}
