/**
 * mockData.ts
 * Shared type defs for the client dashboard home screen. The actual values
 * (stats, favorites, recommended tours, upcoming trip) are now derived from
 * real bookings/tours data in ClientDashboardHome.tsx — no seed data here.
 */

export type StatIcon = 'calendar' | 'clipboard' | 'pin' | 'card';

export type StatCard = {
  key:           string;
  label:         string;
  value:         string;
  icon:          StatIcon;
  iconBg:        string;
  iconColor:     string;
  trend:         string;
  trendPositive: boolean;
};

export type FavoriteTour = {
  id:             string;
  destination:    string;
  rating:         number;
  reviews:        number;
  pricePerPerson: string;
  emoji:          string;
};

export type RecommendedTour = {
  id:             string;
  destination:    string;
  pricePerPerson: string;
  emoji:          string;
};

export type UpcomingTrip = {
  destination: string;
  venue:       string;
  startISO:    string;
  endISO:      string;
  travelers:   number;
  emoji:       string;
};
