/**
 * mockData.ts
 * Mock data for the client dashboard home screen — stats, favorites,
 * recommended tours, and the upcoming trip countdown.
 */

import { C } from '../theme';

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

export const STAT_CARDS: StatCard[] = [
  {
    key: 'tours', label: 'Upcoming Tours', value: '2', icon: 'calendar',
    iconBg: '#FFF3E8', iconColor: C.amber, trend: '+1 vs last month', trendPositive: true,
  },
  {
    key: 'bookings', label: 'Total Bookings', value: '7', icon: 'clipboard',
    iconBg: '#E8F5E9', iconColor: C.success, trend: '+2 this year', trendPositive: true,
  },
  {
    key: 'places', label: 'Places Visited', value: '0', icon: 'pin',
    iconBg: '#EDE7F6', iconColor: '#9C27B0', trend: 'Your journey begins!', trendPositive: true,
  },
  {
    key: 'payments', label: 'Pending Payments', value: '₱391,984', icon: 'card',
    iconBg: '#FCE4E1', iconColor: C.danger, trend: 'Due Jul 20', trendPositive: false,
  },
];

export type FavoriteTour = {
  id:             string;
  destination:    string;
  rating:         number;
  reviews:        number;
  pricePerPerson: string;
  emoji:          string;
};

export const FAVORITE_TOURS: FavoriteTour[] = [
  { id: 'f1', destination: 'Bali, Indonesia', rating: 5.0, reviews: 1, pricePerPerson: '₱25,999', emoji: '🌏' },
  { id: 'f2', destination: 'Bali, Indonesia', rating: 5.0, reviews: 1, pricePerPerson: '₱25,999', emoji: '🌏' },
];

export type RecommendedTour = {
  id:             string;
  destination:    string;
  pricePerPerson: string;
  emoji:          string;
};

export const RECOMMENDED_TOURS: RecommendedTour[] = [
  { id: 'r1', destination: 'Da Nang, Vietnam', pricePerPerson: '₱18,999', emoji: '🌏' },
  { id: 'r2', destination: 'Phuket, Thailand', pricePerPerson: '₱21,499', emoji: '🌏' },
  { id: 'r3', destination: 'Boracay Island',   pricePerPerson: '₱14,500', emoji: '🌏' },
];

export type UpcomingTrip = {
  destination: string;
  venue:       string;
  startISO:    string;
  endISO:      string;
  travelers:   number;
  emoji:       string;
};

export const UPCOMING_TRIP: UpcomingTrip = {
  destination: 'Bali, Indonesia',
  venue:       'The Layar Villa',
  startISO:    '2026-08-05T08:00:00',
  endISO:      '2026-08-09T22:00:00',
  travelers:   2,
  emoji:       '🌏',
};
