/**
 * BookingsContext.tsx
 * Shared "My Bookings" store for the client area. Lets the Tours booking
 * wizard add a confirmed booking and have it immediately show up on the
 * My Bookings tab — no backend yet, so this lives in memory for the
 * session (seeded with a few past requests for a realistic starting list).
 */

import React, { createContext, useContext, useMemo, useState } from 'react';

export type BookingStatus = 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';

export type Booking = {
  id:             string;
  destination:    string;
  location:       string;
  emoji:          string;
  dateFrom:       string;
  dateTo:         string;
  travelers:      number;
  bookedOn:       string;
  totalAmount:    number;
  balanceDue:     number;
  paymentMethod:  string;
  paymentStatus:  'Pending' | 'Paid';
  status:         BookingStatus;
};

const SEED_BOOKINGS: Booking[] = [
  {
    id: 'GV-2026-00021',
    destination: 'Bali, Indonesia', location: 'Bali, Indonesia', emoji: '🌏',
    dateFrom: '2026-08-05', dateTo: '2026-08-09', travelers: 1,
    bookedOn: '2026-07-10',
    totalAmount: 26499, balanceDue: 0, paymentMethod: 'GCash', paymentStatus: 'Pending',
    status: 'Upcoming',
  },
  {
    id: 'GV-2026-00020',
    destination: 'Bali, Indonesia', location: 'Bali, Indonesia', emoji: '🌏',
    dateFrom: '2026-07-10', dateTo: '2026-07-14', travelers: 1,
    bookedOn: '2026-07-03',
    totalAmount: 25999, balanceDue: 0, paymentMethod: 'GCash', paymentStatus: 'Pending',
    status: 'Upcoming',
  },
  {
    id: 'GV-2026-00019',
    destination: 'Bali, Indonesia', location: 'Bali, Indonesia', emoji: '🌏',
    dateFrom: '2026-07-10', dateTo: '2026-07-14', travelers: 4,
    bookedOn: '2026-06-28',
    totalAmount: 103996, balanceDue: 0, paymentMethod: 'GCash', paymentStatus: 'Pending',
    status: 'Upcoming',
  },
];

type BookingsContextValue = {
  bookings:            Booking[];
  addBooking:          (booking: Booking) => void;
  updateBookingStatus: (id: string, status: BookingStatus) => void;
};

const BookingsContext = createContext<BookingsContextValue | null>(null);

export function BookingsProvider({ children }: { children: React.ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>(SEED_BOOKINGS);

  const addBooking = (booking: Booking) => setBookings((prev) => [booking, ...prev]);

  const updateBookingStatus = (id: string, status: BookingStatus) =>
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));

  const value = useMemo(() => ({ bookings, addBooking, updateBookingStatus }), [bookings]);

  return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>;
}

export function useBookings() {
  const ctx = useContext(BookingsContext);
  if (!ctx) throw new Error('useBookings must be used within a BookingsProvider');
  return ctx;
}
