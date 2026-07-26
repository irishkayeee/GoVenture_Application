/**
 * mockData.ts
 * Tour catalog types for the client Tours tab, plus fetchTours() which loads
 * the real catalog from the same tours_list endpoint the admin side uses
 * and maps it into the shape this tab's UI expects.
 */

import { TOURS_LIST_API_URL } from '@/constants/api';

export const INCLUDE_OPTIONS = ['Tour guide', 'Transport', 'Buffet Meal'] as const;
export type IncludeOption = typeof INCLUDE_OPTIONS[number];

export type SortOption = 'popular' | 'lowest' | 'highest' | 'newest';

export type DepartureOption = { id: string; startISO: string; endISO: string; adultPrice: number; slots: number };
export type ItineraryDay = { day: number; details: string };
export type Review = { name: string; rating: number; text: string };

export type Tour = {
  id:             string;
  destination:    string;
  subtitle:       string;
  emoji:          string;
  imageUrl:       string | null;
  rating:         number;
  reviewCount:    number;
  isNew:          boolean;
  pricePerPerson: number;
  duration:       string;
  tags:           string[];
  includes:       IncludeOption[];
  description:    string;
  itinerary:      ItineraryDay[];
  included:       string[];
  excluded:       string[];
  reviews:        Review[];
  departures:     DepartureOption[];
};

export const SERVICE_FEE = 500;

const TOUR_TYPE_LABELS: Record<string, string> = {
  charter_flight: 'Charter Flight',
  cruise:         'Cruise',
  land_tour:      'Land Tour',
  custom:         'Custom Tour',
};

/** Maps one tours_list API row (same shape the admin side consumes) into this tab's Tour type. */
function mapApiTour(row: any): Tour {
  const dateBatches = Array.isArray(row.dateBatches) ? row.dateBatches : [];
  const availableBatches = dateBatches.filter((b: any) => b.available !== false);

  return {
    id: String(row.id),
    destination: row.destination ?? '',
    subtitle: row.tagline || row.fullLocation || '',
    emoji: '🌏',
    imageUrl: row.imageUrl ?? null,
    rating: Number(row.rating) || 0,
    reviewCount: Number(row.reviewCount) || 0,
    isNew: (Number(row.reviewCount) || 0) === 0,
    pricePerPerson: Number(row.priceFrom) || 0,
    duration: row.duration || '',
    tags: [
      row.secondaryTag === 'domestic' ? 'Domestic' : 'International',
      TOUR_TYPE_LABELS[row.tourType] ?? 'Custom Tour',
      row.duration || '',
    ].filter(Boolean),
    includes: [],
    description: row.description || '',
    itinerary: (Array.isArray(row.itinerary) ? row.itinerary : []).map((d: any) => ({
      day: Number(d.day) || 0,
      details: d.description || d.location || '',
    })),
    included: Array.isArray(row.inclusions) ? row.inclusions : [],
    excluded: Array.isArray(row.exclusions) ? row.exclusions : [],
    reviews: (Array.isArray(row.reviews) ? row.reviews : []).map((r: any) => ({
      name: r.name || 'Traveler',
      rating: Number(r.rating) || 0,
      text: r.text || '',
    })),
    departures: availableBatches.map((b: any) => ({
      id: String(b.id),
      startISO: `${b.startDate}T08:00:00`,
      endISO: `${b.endDate}T20:00:00`,
      adultPrice: Number(b.adultPrice) || 0,
      slots: Number(b.slots) || 0,
    })),
  };
}

/** Fetches the live tour catalog — only "Active" packages, matching what travelers should see. */
export async function fetchTours(): Promise<Tour[]> {
  const res = await fetch(TOURS_LIST_API_URL);
  const result = await res.json();
  if (result.status !== 'success') throw new Error(result.message || 'Failed to load tours.');
  return (result.data as any[])
    .filter((row) => row.status === 'Active')
    .map(mapApiTour);
}
