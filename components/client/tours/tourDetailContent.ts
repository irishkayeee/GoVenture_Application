/**
 * tourDetailContent.ts
 * Rich "View Details" content for the Tours tab — Available Dates,
 * Pricing by Age Group, and a day-by-day itinerary with accommodation/meals/
 * numbered activities. This is demo content for ONE showcase package (Cebu)
 * only, keyed by destination; tours without an entry here fall back to the
 * simpler, fully real-data-driven detail view. Not wired to any DB table —
 * this is intentionally scoped dummy content per an explicit one-off request,
 * not a general "no dummy data" exception.
 */

export type AvailableDateEntry = { id: string; label: string; adultPrice: number };
export type AgeGroupPricing = { adult: number; child: number; toddler: number };
export type DetailActivity = { title: string; location: string; lat: number; lng: number };
export type DetailItineraryDay = {
  day: number;
  title: string;
  accommodation?: string;
  meals?: string;
  activities: DetailActivity[];
};
export type DetailReview = { name: string; rating: number; text: string };

export type TourDetailContent = {
  displayName: string;
  subtitle: string;
  bestDeal: boolean;
  downpayment: number;
  availableDates: AvailableDateEntry[];
  agePricing: AgeGroupPricing;
  itinerary: DetailItineraryDay[];
  inclusions: string[];
  exclusions: string[];
  reviews: DetailReview[];
};

export const TOUR_DETAIL_CONTENT: Record<string, TourDetailContent> = {
  'Cebu, Philippines': {
    displayName: 'Cebu Island Getaway',
    subtitle: '4D3N Beach Getaway (Cebu Pacific)',
    bestDeal: true,
    downpayment: 5000,
    availableDates: [
      { id: 'aug', label: 'Aug 6, 2026 – Aug 9, 2026', adultPrice: 14500 },
      { id: 'sep', label: 'Sep 5, 2026 – Sep 8, 2026',  adultPrice: 14500 },
      { id: 'oct', label: 'Oct 10, 2026 – Oct 13, 2026', adultPrice: 15800 },
      { id: 'dec', label: 'Dec 20, 2026 – Dec 23, 2026', adultPrice: 18500 },
    ],
    agePricing: { adult: 14500, child: 11600, toddler: 5800 },
    itinerary: [
      {
        day: 1,
        title: 'Arrival in Cebu',
        accommodation: 'Seaside Resort, Mactan',
        meals: 'Dinner',
        activities: [
          { title: 'Fly into Mactan-Cebu International Airport, transfer to the hotel.', location: 'Mactan-Cebu International Airport', lat: 10.3075, lng: 123.9789 },
          { title: 'Free afternoon to relax, then a welcome dinner by the beach.', location: 'Mactan Beachfront', lat: 10.2870, lng: 123.9880 },
        ],
      },
      {
        day: 2,
        title: 'Island Hopping',
        accommodation: 'Seaside Resort, Mactan',
        meals: 'Breakfast, Lunch',
        activities: [
          { title: 'Boat trip to Nalusuan Island for snorkeling and swimming.', location: 'Nalusuan Island', lat: 10.1970, lng: 123.9420 },
          { title: 'Lunch on a floating raft, then a stop at Hilutungan Island.', location: 'Hilutungan Island', lat: 10.2100, lng: 123.9330 },
        ],
      },
      {
        day: 3,
        title: 'Cebu City Heritage Tour',
        accommodation: 'Seaside Resort, Mactan',
        meals: 'Breakfast',
        activities: [
          { title: "Visit Magellan's Cross and the Basilica del Santo Niño.", location: 'Basilica del Santo Niño', lat: 10.2938, lng: 123.9018 },
          { title: 'Explore Fort San Pedro and the Taoist Temple.', location: 'Fort San Pedro', lat: 10.2925, lng: 123.9058 },
        ],
      },
      {
        day: 4,
        title: 'Departure',
        meals: 'Breakfast',
        activities: [
          { title: 'Free time for last-minute souvenir shopping.', location: 'Ayala Center Cebu', lat: 10.3181, lng: 123.9058 },
          { title: 'Transfer to the airport for the departure flight.', location: 'Mactan-Cebu International Airport', lat: 10.3075, lng: 123.9789 },
        ],
      },
    ],
    inclusions: [
      'Round-trip Cebu Pacific airfare',
      'Airport transfers',
      '3 nights hotel accommodation',
      'Daily breakfast',
      'Island hopping tour with snorkeling gear',
      'Cebu city heritage tour with guide',
      'Environmental & terminal fees',
    ],
    exclusions: [
      'Personal expenses & shopping',
      'Travel insurance',
      'Meals not mentioned in the itinerary',
      'Optional side trips',
      'Alcoholic beverages',
    ],
    reviews: [
      { name: 'Irish Kaye C.', rating: 5, text: 'Best girls trip with my bestfriend! The island hopping was so much fun and the water was so clear. Highly recommended!' },
      { name: 'Marco D.',      rating: 5, text: 'Great value for the price. The heritage tour guide was very knowledgeable and the hotel was right by the beach.' },
      { name: 'Angela R.',     rating: 4, text: 'Overall a smooth trip. Would have loved more free time on the last day, but everything else was well organized.' },
    ],
  },
};

export function getTourDetailContent(destination: string): TourDetailContent | null {
  return TOUR_DETAIL_CONTENT[destination] ?? null;
}
