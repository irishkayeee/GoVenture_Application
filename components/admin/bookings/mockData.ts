/**
 * mockData.ts
 * Client-side mock data for the admin Bookings tab.
 */

export type BookingStatus = 'Confirmed' | 'Pending' | 'Cancelled';
export type PaymentStatus = 'Paid' | 'Pending' | 'Refunded';

export type Booking = {
  id:            string;
  reference:     string;
  clientName:    string;
  clientEmail:   string;
  initials:      string;
  tourPackage:   string;
  destination:   string;
  startDate:     string;
  startDateISO:  string; // YYYY-MM-DD, used for calendar placement
  startTime:     string;
  endDate:       string;
  endTime:       string;
  pax:           number;
  price:         number;
  status:        BookingStatus;
  paymentStatus: PaymentStatus;
};

export const BOOKINGS: Booking[] = [
  {
    id: '1', reference: 'GV-2026-00017',
    clientName: 'Jared Abellera', clientEmail: 'jaredabellera@gmail.com', initials: 'JA',
    tourPackage: 'Bali Island Escape', destination: 'Bali, Indonesia',
    startDate: 'Jul 10, 2026', startDateISO: '2026-07-10', startTime: '08:00', endDate: 'Jul 14, 2026', endTime: '22:00',
    pax: 1, price: 25999, status: 'Confirmed', paymentStatus: 'Paid',
  },
  {
    id: '2', reference: 'GV-2026-00016',
    clientName: 'Jared Abellera', clientEmail: 'jaredabellera@gmail.com', initials: 'JA',
    tourPackage: 'Bali Island Escape', destination: 'Bali, Indonesia',
    startDate: 'Jul 10, 2026', startDateISO: '2026-07-10', startTime: '08:00', endDate: 'Jul 14, 2026', endTime: '22:00',
    pax: 5, price: 83995, status: 'Pending', paymentStatus: 'Pending',
  },
  {
    id: '3', reference: 'GV-2026-00015',
    clientName: 'Mia Reyes', clientEmail: 'mia.reyes@gmail.com', initials: 'MR',
    tourPackage: 'Phuket Beach Getaway', destination: 'Phuket, Thailand',
    startDate: 'Aug 20, 2026', startDateISO: '2026-08-20', startTime: '09:00', endDate: 'Aug 24, 2026', endTime: '20:00',
    pax: 2, price: 11000, status: 'Pending', paymentStatus: 'Pending',
  },
  {
    id: '4', reference: 'GV-2026-00014',
    clientName: 'Jared Abellera', clientEmail: 'jaredabellera@gmail.com', initials: 'JA',
    tourPackage: 'Tokyo Highlights Tour', destination: 'Tokyo, Japan',
    startDate: 'Sep 1, 2026', startDateISO: '2026-09-01', startTime: '22:00', endDate: 'Sep 6, 2026', endTime: '18:00',
    pax: 1, price: 22000, status: 'Pending', paymentStatus: 'Pending',
  },
  {
    id: '5', reference: 'GV-2026-00013',
    clientName: 'Rico Santos', clientEmail: 'rico.santos@gmail.com', initials: 'RS',
    tourPackage: 'El Nido Island Hopping', destination: 'El Nido, Palawan',
    startDate: 'Jun 28, 2026', startDateISO: '2026-06-28', startTime: '07:00', endDate: 'Jul 1, 2026', endTime: '19:00',
    pax: 3, price: 18500, status: 'Pending', paymentStatus: 'Pending',
  },
  {
    id: '6', reference: 'GV-2026-00012',
    clientName: 'Anna Cruz', clientEmail: 'anna.cruz@gmail.com', initials: 'AC',
    tourPackage: 'Kyoto Cultural Trail', destination: 'Kyoto, Japan',
    startDate: 'Jun 26, 2026', startDateISO: '2026-06-26', startTime: '10:00', endDate: 'Jun 30, 2026', endTime: '16:00',
    pax: 2, price: 35200, status: 'Confirmed', paymentStatus: 'Paid',
  },
  {
    id: '7', reference: 'GV-2026-00011',
    clientName: 'Carlos Reyes', clientEmail: 'carlos.reyes@gmail.com', initials: 'CR',
    tourPackage: 'Santorini Getaway', destination: 'Santorini, Greece',
    startDate: 'Jun 25, 2026', startDateISO: '2026-06-25', startTime: '12:00', endDate: 'Jun 29, 2026', endTime: '11:00',
    pax: 2, price: 51000, status: 'Cancelled', paymentStatus: 'Refunded',
  },
  {
    id: '8', reference: 'GV-2026-00010',
    clientName: 'Bea Ramos', clientEmail: 'bea.ramos@gmail.com', initials: 'BR',
    tourPackage: 'Boracay Beach Escape', destination: 'Boracay, Philippines',
    startDate: 'Jun 24, 2026', startDateISO: '2026-06-24', startTime: '09:00', endDate: 'Jun 27, 2026', endTime: '17:00',
    pax: 4, price: 9800, status: 'Confirmed', paymentStatus: 'Paid',
  },
  {
    id: '9', reference: 'GV-2026-00018',
    clientName: 'Liza Fernandez', clientEmail: 'liza.fernandez@gmail.com', initials: 'LF',
    tourPackage: 'Cebu South Adventure', destination: 'Cebu, Philippines',
    startDate: 'Jul 20, 2026', startDateISO: '2026-07-20', startTime: '06:30', endDate: 'Jul 22, 2026', endTime: '18:00',
    pax: 2, price: 14500, status: 'Confirmed', paymentStatus: 'Paid',
  },
];

export const STATUS_FILTER_OPTIONS: { value: BookingStatus | ''; label: string }[] = [
  { value: '',          label: 'All Status' },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Pending',   label: 'Pending' },
  { value: 'Cancelled', label: 'Cancelled' },
];

export function formatPeso(n: number): string {
  return `₱${n.toLocaleString('en-US')}`;
}

export function formatCompactPeso(n: number): string {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `₱${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return `₱${n}`;
}
