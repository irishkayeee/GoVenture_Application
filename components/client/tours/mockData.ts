/**
 * mockData.ts
 * Mock tour catalog for the client Tours tab — listing, detail, itinerary,
 * inclusions/exclusions, and reviews.
 */

export const INCLUDE_OPTIONS = ['Tour guide', 'Transport', 'Buffet Meal'] as const;
export type IncludeOption = typeof INCLUDE_OPTIONS[number];

export type SortOption = 'popular' | 'lowest' | 'highest' | 'newest';

export type DepartureOption = { startISO: string; endISO: string };
export type ItineraryDay = { day: number; details: string };
export type Review = { name: string; rating: number; text: string };

export type Tour = {
  id:             string;
  destination:    string;
  subtitle:       string;
  emoji:          string;
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

export const TOURS: Tour[] = [
  {
    id: 'bali',
    destination: 'Bali, Indonesia',
    subtitle: 'Island of the Gods',
    emoji: '🌏',
    rating: 5.0,
    reviewCount: 1,
    isNew: false,
    pricePerPerson: 25999,
    duration: '5 Days / 4 Nights',
    tags: ['International', 'Charter Tour', '5 Days / 4 Nights'],
    includes: ['Tour guide', 'Transport'],
    description: 'Explore lush rice terraces, ancient temples, and pristine beaches in the heart of Southeast Asia.',
    itinerary: [
      { day: 1, details: 'Arrival in Ngurah Rai International Airport. Transfer to hotel. Welcome dinner at Jimbaran Bay seafood restaurant.' },
      { day: 2, details: 'Sunrise trek at Mount Batur, followed by a visit to the Tegallalang Rice Terraces and Ubud Art Market.' },
      { day: 3, details: 'Temple hopping: Tanah Lot, Uluwatu, and a traditional Kecak fire dance at sunset.' },
      { day: 4, details: 'Free day for optional water sports at Nusa Dua or a spa and relaxation day at the villa.' },
      { day: 5, details: 'Last-minute souvenir shopping in Seminyak, then transfer to the airport for departure.' },
    ],
    included: [
      'Round-trip airfare (Manila – Bali – Manila)',
      'Hotel accommodation (4 nights)',
      'Daily breakfast',
      'Airport transfers',
      'Licensed English-speaking tour guide',
    ],
    excluded: ['Travel insurance', 'Personal expenses & shopping', 'Visa fees'],
    reviews: [
      { name: 'Grace T.', rating: 5, text: 'Absolutely magical trip! Bali exceeded all our expectations. Wayan was an incredible guide – knowledgeable, funny, and very attentive. The villa was stunning. Will definitely book again!' },
    ],
    departures: [
      { startISO: '2026-08-05T08:00:00', endISO: '2026-08-09T22:00:00' },
      { startISO: '2026-09-02T08:00:00', endISO: '2026-09-06T22:00:00' },
      { startISO: '2026-10-14T08:00:00', endISO: '2026-10-18T22:00:00' },
    ],
  },
  {
    id: 'da-nang',
    destination: 'Da Nang, Vietnam',
    subtitle: 'Coastal Charm of Central Vietnam',
    emoji: '🌏',
    rating: 5.0,
    reviewCount: 1,
    isNew: false,
    pricePerPerson: 18999,
    duration: '4 Days / 3 Nights',
    tags: ['International', 'Group Tour', '4 Days / 3 Nights'],
    includes: ['Tour guide', 'Transport', 'Buffet Meal'],
    description: 'Golden beaches, the iconic Golden Bridge, and the lantern-lit streets of Hoi An Ancient Town.',
    itinerary: [
      { day: 1, details: 'Arrival, transfer to hotel, evening stroll along My Khe Beach.' },
      { day: 2, details: 'Ba Na Hills day trip featuring the Golden Bridge and French Village.' },
      { day: 3, details: 'Hoi An Ancient Town walking tour and a lantern boat ride at night.' },
      { day: 4, details: 'Free morning, then transfer to the airport for departure.' },
    ],
    included: ['Round-trip airfare', 'Hotel accommodation (3 nights)', 'Daily buffet breakfast', 'Airport transfers', 'English-speaking tour guide'],
    excluded: ['Travel insurance', 'Personal expenses', 'Visa fees'],
    reviews: [
      { name: 'Miguel S.', rating: 5, text: 'Da Nang was such a pleasant surprise — clean beaches, great food, and the Golden Bridge is unreal in person.' },
    ],
    departures: [
      { startISO: '2026-08-20T09:00:00', endISO: '2026-08-23T20:00:00' },
      { startISO: '2026-09-15T09:00:00', endISO: '2026-09-18T20:00:00' },
    ],
  },
  {
    id: 'cebu',
    destination: 'Cebu, Philippines',
    subtitle: 'Queen City of the South',
    emoji: '🌏',
    rating: 5.0,
    reviewCount: 1,
    isNew: false,
    pricePerPerson: 12999,
    duration: '3 Days / 2 Nights',
    tags: ['Domestic', 'Group Tour', '3 Days / 2 Nights'],
    includes: ['Tour guide', 'Transport', 'Buffet Meal'],
    description: 'Swim with whale sharks in Oslob, canyoneer through Kawasan Falls, and dive into Cebu\'s rich history.',
    itinerary: [
      { day: 1, details: 'Arrival, city tour of Magellan\'s Cross and Basilica del Santo Niño.' },
      { day: 2, details: 'Oslob whale shark encounter followed by Kawasan Falls canyoneering.' },
      { day: 3, details: 'Free morning for souvenir shopping, then departure.' },
    ],
    included: ['Hotel accommodation (2 nights)', 'Daily buffet breakfast', 'Land transfers', 'Licensed tour guide'],
    excluded: ['Airfare', 'Travel insurance', 'Personal expenses'],
    reviews: [
      { name: 'Anna P.', rating: 5, text: 'Swimming with the whale sharks was a bucket-list moment. The itinerary was well-paced and the guide was great with kids too.' },
    ],
    departures: [
      { startISO: '2026-08-10T07:00:00', endISO: '2026-08-13T18:00:00' },
      { startISO: '2026-09-05T07:00:00', endISO: '2026-09-08T18:00:00' },
    ],
  },
  {
    id: 'boracay',
    destination: 'Boracay Island',
    subtitle: 'World-Famous White Beach',
    emoji: '🌏',
    rating: 4.0,
    reviewCount: 1,
    isNew: false,
    pricePerPerson: 15999,
    duration: '3 Days / 2 Nights',
    tags: ['Domestic', 'Group Tour', '3 Days / 2 Nights'],
    includes: ['Transport', 'Buffet Meal'],
    description: 'Powder-white sand, breathtaking sunsets, and the best island-hopping in the Philippines.',
    itinerary: [
      { day: 1, details: 'Arrival, transfer to hotel, sunset sailing on a traditional paraw boat.' },
      { day: 2, details: 'Island-hopping tour: Crystal Cove, Puka Shell Beach, and snorkeling at Crocodile Island.' },
      { day: 3, details: 'Free morning at White Beach, then departure.' },
    ],
    included: ['Hotel accommodation (2 nights)', 'Daily buffet breakfast', 'Island-hopping tour', 'Land & sea transfers'],
    excluded: ['Airfare', 'Travel insurance', 'Personal expenses'],
    reviews: [
      { name: 'Kevin D.', rating: 4, text: 'Great value trip, the island-hopping was the highlight. Would\'ve liked a bit more free time at White Beach.' },
    ],
    departures: [
      { startISO: '2026-07-25T08:00:00', endISO: '2026-07-28T20:00:00' },
      { startISO: '2026-08-15T08:00:00', endISO: '2026-08-18T20:00:00' },
    ],
  },
  {
    id: 'bangkok',
    destination: 'Bangkok, Thailand',
    subtitle: 'City of Angels',
    emoji: '🌏',
    rating: 4.0,
    reviewCount: 1,
    isNew: false,
    pricePerPerson: 18999,
    duration: '4 Days / 3 Nights',
    tags: ['International', 'Group Tour', '4 Days / 3 Nights'],
    includes: ['Tour guide', 'Transport'],
    description: 'Glittering temples, floating markets, and unbeatable street food in Thailand\'s vibrant capital.',
    itinerary: [
      { day: 1, details: 'Arrival, transfer to hotel, evening at Asiatique The Riverfront.' },
      { day: 2, details: 'Grand Palace, Wat Pho, and a Chao Phraya River cruise.' },
      { day: 3, details: 'Damnoen Saduak floating market and Maeklong Railway Market day trip.' },
      { day: 4, details: 'Free morning for shopping at Chatuchak, then departure.' },
    ],
    included: ['Hotel accommodation (3 nights)', 'Daily breakfast', 'Airport transfers', 'English-speaking tour guide'],
    excluded: ['Airfare', 'Travel insurance', 'Personal expenses', 'Visa fees'],
    reviews: [
      { name: 'Patricia L.', rating: 4, text: 'Loved the floating market day trip! Bangkok traffic made some transfers longer than expected, but overall a fun trip.' },
    ],
    departures: [
      { startISO: '2026-08-08T10:00:00', endISO: '2026-08-11T21:00:00' },
      { startISO: '2026-09-10T10:00:00', endISO: '2026-09-13T21:00:00' },
    ],
  },
  {
    id: 'tokyo',
    destination: 'Tokyo, Japan',
    subtitle: 'Where Tradition Meets the Future',
    emoji: '🌏',
    rating: 0,
    reviewCount: 0,
    isNew: true,
    pricePerPerson: 45999,
    duration: '6 Days / 5 Nights',
    tags: ['International', 'Group Tour', '6 Days / 5 Nights'],
    includes: ['Tour guide', 'Transport'],
    description: 'Neon-lit streets, serene temples, and world-class cuisine — the ultimate first-timer\'s Tokyo itinerary.',
    itinerary: [
      { day: 1, details: 'Arrival at Narita/Haneda, transfer to hotel, evening in Shinjuku.' },
      { day: 2, details: 'Asakusa\'s Senso-ji Temple, Tokyo Skytree, and a Sumida River cruise.' },
      { day: 3, details: 'Day trip to Mt. Fuji and Lake Kawaguchiko.' },
      { day: 4, details: 'Shibuya Crossing, Harajuku, and Meiji Shrine.' },
      { day: 5, details: 'Free day for optional Disneyland/DisneySea or Odaiba shopping.' },
      { day: 6, details: 'Last-minute shopping in Akihabara, then transfer to the airport for departure.' },
    ],
    included: ['Round-trip airfare', 'Hotel accommodation (5 nights)', 'Daily breakfast', 'Airport transfers', 'English-speaking tour guide'],
    excluded: ['Travel insurance', 'Personal expenses', 'Optional theme park tickets'],
    reviews: [],
    departures: [
      { startISO: '2026-09-20T08:00:00', endISO: '2026-09-25T21:00:00' },
      { startISO: '2026-10-05T08:00:00', endISO: '2026-10-10T21:00:00' },
    ],
  },
];
