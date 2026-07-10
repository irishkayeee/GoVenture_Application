/**
 * mockData.ts
 * Types and option lists for the client "Plan a Trip" tab — a request form
 * that builds a live summary, then adds the result to a local trip list
 * (no backend yet, so "generating" just saves the request client-side).
 */

export type TripPace = 'Relaxed' | 'Balanced' | 'Adventure';
export type AccommodationTier = 'Budget' | 'Mid Range' | 'Luxury';

export const BUDGET_PRESETS = [
  '₱10,000 and below',
  '₱10,000 – ₱20,000',
  '₱20,000 – ₱30,000',
  '₱30,000 and above',
] as const;

export const TRIP_PACE_OPTIONS: { key: TripPace; emoji: string; desc: string }[] = [
  { key: 'Relaxed',   emoji: '🌿', desc: 'Take it slow and enjoy' },
  { key: 'Balanced',  emoji: '⚖️', desc: 'Mix of activities and leisure' },
  { key: 'Adventure', emoji: '🥾', desc: 'Go, explore, and push limits' },
];

export const ACCOMMODATION_OPTIONS: { key: AccommodationTier; emoji: string; desc: string }[] = [
  { key: 'Budget',    emoji: '🏨', desc: 'Budget Hotel' },
  { key: 'Mid Range', emoji: '🏩', desc: '3-star Hotel' },
  { key: 'Luxury',    emoji: '🏰', desc: '4-5 star Hotel' },
];

export const INTEREST_OPTIONS: { label: string; emoji: string }[] = [
  { label: 'Beaches',       emoji: '🏖️' },
  { label: 'Island Hopping', emoji: '🏝️' },
  { label: 'Nature',        emoji: '🌿' },
  { label: 'Food',          emoji: '🍜' },
  { label: 'History',       emoji: '🏛️' },
  { label: 'Culture',       emoji: '🎭' },
  { label: 'Adventure',     emoji: '🎢' },
  { label: 'Nightlife',     emoji: '🌙' },
  { label: 'Shopping',      emoji: '🛍️' },
];

export type PersonalizedTrip = {
  id:              string;
  destination:     string;
  dateFrom:        string;
  dateTo:          string;
  travelers:       number;
  budgetRange:     string;
  tripPace:        TripPace;
  accommodation:   AccommodationTier;
  interests:       string[];
  specialRequests: string;
  createdAt:       string;
};

export type TripFormState = {
  destination:     string;
  dateFrom:        string;
  dateTo:          string;
  travelers:       number;
  budgetRange:     string;
  customBudget:    string;
  tripPace:        TripPace;
  accommodation:   AccommodationTier;
  interests:       string[];
  specialRequests: string;
};

export const DEFAULT_FORM: TripFormState = {
  destination: '',
  dateFrom: '',
  dateTo: '',
  travelers: 2,
  budgetRange: '',
  customBudget: '',
  tripPace: 'Balanced',
  accommodation: 'Mid Range',
  interests: [],
  specialRequests: '',
};
