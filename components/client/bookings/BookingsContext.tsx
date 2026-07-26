/**
 * BookingsContext.tsx
 * Shared "My Bookings" store for the client area — fetches the logged-in
 * user's real bookings from the database, and exposes createBooking/
 * cancelBooking which call the backend directly (booking_create /
 * client_cancel_booking) so the Tours booking wizard and My Bookings tab
 * both operate on the same server-backed list.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CLIENT_BOOKINGS_LIST_API_URL, BOOKING_CREATE_API_URL, CLIENT_CANCEL_BOOKING_API_URL } from '@/constants/api';
import { useAuth } from '@/components/auth/AuthContext';

export type BookingStatus = 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';

export type Booking = {
  id:             string;
  destination:    string;
  location:       string;
  imageUrl:       string | null;
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

export type CreateBookingInput = {
  tourId:        string;
  departureId:   string;
  travelers:     number;
  paymentMethod?: 'GCash' | 'Maya' | 'Bank Transfer';
};

export type CreateBookingResult =
  | { ok: true; reference: string; totalAmount: number }
  | { ok: false; message: string };

type BookingsContextValue = {
  bookings:      Booking[];
  loading:       boolean;
  error:         string;
  refresh:       () => void;
  createBooking: (input: CreateBookingInput) => Promise<CreateBookingResult>;
  cancelBooking: (reference: string) => Promise<boolean>;
};

const BookingsContext = createContext<BookingsContextValue | null>(null);

export function BookingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(() => {
    if (!user) { setBookings([]); setLoading(false); return; }
    setLoading(true);
    setError('');
    fetch(`${CLIENT_BOOKINGS_LIST_API_URL}&userId=${user.id}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.status !== 'success') throw new Error(result.message || 'Failed to load bookings.');
        setBookings(result.data);
      })
      .catch(() => setError("Can't connect to the server. Please check if XAMPP is running."))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const createBooking = async (input: CreateBookingInput): Promise<CreateBookingResult> => {
    if (!user) return { ok: false, message: 'You must be logged in to book.' };
    try {
      const res = await fetch(BOOKING_CREATE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          tourId: input.tourId,
          departureId: input.departureId,
          travelers: input.travelers,
          paymentMethod: input.paymentMethod ?? null,
        }),
      });
      const result = await res.json();
      if (result.status !== 'success') return { ok: false, message: result.message || 'Booking failed.' };
      refresh();
      return { ok: true, reference: result.data.reference, totalAmount: result.data.totalAmount };
    } catch {
      return { ok: false, message: "Can't connect to the server. Please check if XAMPP is running." };
    }
  };

  const cancelBooking = async (reference: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch(CLIENT_CANCEL_BOOKING_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, reference }),
      });
      const result = await res.json();
      if (result.status !== 'success') return false;
      setBookings((prev) => prev.map((b) => (b.id === reference ? { ...b, status: 'Cancelled' } : b)));
      return true;
    } catch {
      return false;
    }
  };

  const value = useMemo(
    () => ({ bookings, loading, error, refresh, createBooking, cancelBooking }),
    [bookings, loading, error, refresh, user],
  );

  return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>;
}

export function useBookings() {
  const ctx = useContext(BookingsContext);
  if (!ctx) throw new Error('useBookings must be used within a BookingsProvider');
  return ctx;
}
