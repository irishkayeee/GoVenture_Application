/**
 * mockData.ts
 * Client-side mock data for the admin Tour Packages tab.
 */

export type TourTag = 'charter' | 'custom';
export type TourStatus = 'Active' | 'Draft' | 'Inactive';

export type TourItineraryDay = {
  day:          number;
  time:         string;
  title:        string;
  description:  string;
};

export type TourReview = {
  id:       string;
  name:     string;
  initials: string;
  rating:   number;
  text:     string;
};

export type TourPackage = {
  id:            string;
  destination:   string;
  tagline:       string;
  tag:           TourTag;
  secondaryTag:  string;
  rating:        number;
  reviewCount:   number;
  priceFrom:     number;
  duration:      string;
  status:        TourStatus;
  gradient:      [string, string];
  fullLocation:  string;
  description:   string;
  itinerary:     TourItineraryDay[];
};

export const DEFAULT_INCLUSIONS = [
  'Room accommodation with daily breakfast',
  'Sightseeing tours as specified in the itinerary',
  'Private coach with English-speaking tour guide',
  'Round-trip airfare via Philippine Airlines',
];

export const DEFAULT_EXCLUSIONS = [
  'Expenses of a personal nature (calls, mini bar, etc.)',
  'Tips for drivers and guide',
  'Single supplement',
  'Travel Insurance',
  'Philippine Travel tax',
];

export const DEFAULT_REVIEWS: TourReview[] = [
  { id: 'r1', name: 'Emily R.', initials: 'E', rating: 5, text: 'Absolutely amazing experience! The scenery was even more beautiful in person. Super friendly and professional guides. Would highly recommend!' },
  { id: 'r2', name: 'Miguel S.', initials: 'M', rating: 5, text: 'Great value for money. Everything was well organized and the itinerary was perfect. Booked again for next year!' },
];

export const TOUR_PACKAGES: TourPackage[] = [
  {
    id: '1', destination: 'Bali, Indonesia', tagline: 'Island of the Gods',
    tag: 'charter', secondaryTag: 'overseas', rating: 4.8, reviewCount: 4,
    priceFrom: 25999, duration: '5 Days / 4 Nights', status: 'Active',
    gradient: ['#1B3A66', '#2E5C94'], fullLocation: 'Denpasar, Bali, Indonesia',
    description: 'Discover the cultural and natural beauty of Bali with our immersive full-day adventure. Wander through iconic landmarks, experience authentic local hospitality along the way, and create unforgettable memories that last a lifetime.',
    itinerary: [
      { day: 1, time: '8:00 AM – 6:00 PM', title: 'Arrival & City Tour', description: 'Arrive at the airport and meet your tour guide. Proceed to the hotel, freshen up, then explore the city’s top landmarks including the historic district, local markets, and scenic viewpoints.' },
      { day: 2, time: '7:30 AM – 4:00 PM', title: 'Nature Adventure', description: 'Head out to Bali’s lush countryside for a guided trek through rice terraces, waterfalls, and jungle viewpoints, capped off with a traditional lunch overlooking the valley.' },
      { day: 3, time: 'Full Day', title: 'Free Day / Optional Activities', description: 'Enjoy a free day to relax at the resort or join optional add-ons like a spa session, surfing lesson, or a sunset cruise along the coast.' },
      { day: 4, time: '6:00 AM – 12:00 PM', title: 'Departure', description: 'Early breakfast at the hotel, followed by a transfer to the airport for your flight home. End of tour.' },
    ],
  },
  {
    id: '2', destination: 'Bangkok, Thailand', tagline: 'City of Angels',
    tag: 'custom', secondaryTag: 'overseas', rating: 4.8, reviewCount: 2,
    priceFrom: 18999, duration: '5 Days / 4 Nights', status: 'Active',
    gradient: ['#1D6FB8', '#4FA8E0'], fullLocation: 'Bangkok, Thailand',
    description: 'Immerse yourself in the vibrant energy of Bangkok — from golden temples to bustling floating markets. This package blends culture, food, and city life into one unforgettable escape.',
    itinerary: [
      { day: 1, time: '9:00 AM – 5:00 PM', title: 'Arrival & Temple Tour', description: 'Arrive and check in, then visit the Grand Palace and Wat Arun with a licensed local guide.' },
      { day: 2, time: '6:30 AM – 1:00 PM', title: 'Floating Market Tour', description: 'Early trip to the Damnoen Saduak floating market followed by a Thai cooking demonstration.' },
      { day: 3, time: 'Full Day', title: 'Free Day / Optional Activities', description: 'Explore on your own or join an optional day trip to Ayutthaya’s ancient ruins.' },
      { day: 4, time: '5:00 AM – 11:00 AM', title: 'Departure', description: 'Breakfast at the hotel, then transfer to the airport for departure.' },
    ],
  },
  {
    id: '3', destination: 'Boracay Island', tagline: 'White Beach Paradise',
    tag: 'charter', secondaryTag: 'domestic', rating: 4.8, reviewCount: 2,
    priceFrom: 15999, duration: '4 Days / 3 Nights', status: 'Active',
    gradient: ['#5B21A6', '#8B4FD1'], fullLocation: 'Boracay Island, Aklan, Philippines',
    description: 'Sink your feet into the powder-white sands of Boracay. This getaway is built for relaxation — turquoise water, island hopping, and unforgettable sunsets on White Beach.',
    itinerary: [
      { day: 1, time: '10:00 AM – 6:00 PM', title: 'Arrival & Beach Time', description: 'Arrive via Caticlan, transfer to the resort, and spend the afternoon relaxing on White Beach.' },
      { day: 2, time: '8:00 AM – 3:00 PM', title: 'Island Hopping', description: 'Visit Crystal Cove, Puka Shell Beach, and Crocodile Island with snorkeling stops along the way.' },
      { day: 3, time: '6:00 AM – 10:00 AM', title: 'Departure', description: 'Sunrise breakfast on the beach, then transfer back to Caticlan for your flight home.' },
    ],
  },
  {
    id: '4', destination: 'Da Nang, Vietnam', tagline: 'The Coastal Dream',
    tag: 'charter', secondaryTag: 'overseas', rating: 4.8, reviewCount: 2,
    priceFrom: 18999, duration: '5 Days / 4 Nights', status: 'Active',
    gradient: ['#1F5C42', '#3E8A64'], fullLocation: 'Da Nang, Vietnam',
    description: 'Explore Vietnam’s coastal gem — golden bridges, ancient towns, and pristine beaches. Da Nang offers the perfect mix of culture, cuisine, and seaside relaxation.',
    itinerary: [
      { day: 1, time: '9:00 AM – 5:00 PM', title: 'Arrival & Golden Bridge', description: 'Arrive and transfer to Ba Na Hills to see the iconic Golden Bridge and French Village.' },
      { day: 2, time: '8:00 AM – 4:00 PM', title: 'Hoi An Ancient Town', description: 'Guided walking tour of Hoi An’s lantern-lit streets, tailor shops, and riverside markets.' },
      { day: 3, time: 'Full Day', title: 'Free Day / Optional Activities', description: 'Relax at My Khe Beach or join an optional Marble Mountains excursion.' },
      { day: 4, time: '6:00 AM – 12:00 PM', title: 'Departure', description: 'Breakfast at the hotel, then transfer to the airport for your flight home.' },
    ],
  },
  {
    id: '5', destination: 'Tokyo, Japan', tagline: 'Neon Lights & Zen Gardens',
    tag: 'custom', secondaryTag: 'overseas', rating: 4.8, reviewCount: 2,
    priceFrom: 32999, duration: '6 Days / 5 Nights', status: 'Active',
    gradient: ['#C9A227', '#E0C34F'], fullLocation: 'Tokyo, Japan',
    description: 'Experience the striking contrast of Tokyo — futuristic skylines beside centuries-old shrines. This tour covers the city’s icons plus quieter moments of calm.',
    itinerary: [
      { day: 1, time: '10:00 AM – 6:00 PM', title: 'Arrival & Shinjuku', description: 'Arrive and settle in, then explore Shinjuku’s skyline and neon-lit streets by night.' },
      { day: 2, time: '8:00 AM – 5:00 PM', title: 'Asakusa & Senso-ji', description: 'Visit Senso-ji Temple, Nakamise shopping street, and a river cruise along the Sumida.' },
      { day: 3, time: '9:00 AM – 5:00 PM', title: 'Mt. Fuji Day Trip', description: 'Full-day excursion to the Mt. Fuji area with a scenic lake cruise and cable car ride.' },
      { day: 4, time: 'Full Day', title: 'Free Day / Optional Activities', description: 'Explore Shibuya and Harajuku at your own pace, or join an optional theme park add-on.' },
      { day: 5, time: '6:00 AM – 12:00 PM', title: 'Departure', description: 'Breakfast at the hotel, then transfer to Narita/Haneda for your flight home.' },
    ],
  },
  {
    id: '6', destination: 'Cebu, Philippines', tagline: 'Queen City of the South',
    tag: 'charter', secondaryTag: 'domestic', rating: 4.8, reviewCount: 1,
    priceFrom: 14500, duration: '4 Days / 3 Nights', status: 'Active',
    gradient: ['#B8871F', '#D9A83E'], fullLocation: 'Cebu City, Cebu, Philippines',
    description: 'From historic landmarks to swimming with whale sharks, Cebu packs adventure and heritage into one dynamic escape in the heart of the Visayas.',
    itinerary: [
      { day: 1, time: '10:00 AM – 6:00 PM', title: 'Arrival & City Tour', description: 'Arrive and visit Magellan’s Cross, Basilica del Santo Niño, and Fort San Pedro.' },
      { day: 2, time: '5:00 AM – 3:00 PM', title: 'Oslob & Kawasan Falls', description: 'Early trip to swim with whale sharks in Oslob, followed by canyoneering at Kawasan Falls.' },
      { day: 3, time: '6:00 AM – 10:00 AM', title: 'Departure', description: 'Free morning at leisure, then transfer to the airport for your flight home.' },
    ],
  },
  {
    id: '7', destination: 'Kyoto, Japan', tagline: 'City of Ten Thousand Shrines',
    tag: 'custom', secondaryTag: 'overseas', rating: 4.8, reviewCount: 1,
    priceFrom: 35200, duration: '5 Days / 4 Nights', status: 'Active',
    gradient: ['#B85F17', '#D17B2E'], fullLocation: 'Kyoto, Japan',
    description: 'Step back into old Japan among Kyoto’s bamboo groves, geisha districts, and thousands of vermillion torii gates. A tour built for culture and quiet beauty.',
    itinerary: [
      { day: 1, time: '10:00 AM – 6:00 PM', title: 'Arrival & Gion District', description: 'Arrive and stroll through Gion, Kyoto’s historic geisha district, by early evening.' },
      { day: 2, time: '8:00 AM – 5:00 PM', title: 'Fushimi Inari & Arashiyama', description: 'Visit the iconic torii gates of Fushimi Inari, then the bamboo grove in Arashiyama.' },
      { day: 3, time: 'Full Day', title: 'Free Day / Optional Activities', description: 'Explore Kinkaku-ji at your own pace or join an optional tea ceremony experience.' },
      { day: 4, time: '6:00 AM – 12:00 PM', title: 'Departure', description: 'Breakfast at the hotel, then transfer to Kansai Airport for your flight home.' },
    ],
  },
  {
    id: '8', destination: 'Phuket, Thailand', tagline: 'Pearl of the Andaman',
    tag: 'charter', secondaryTag: 'overseas', rating: 4.8, reviewCount: 1,
    priceFrom: 11000, duration: '5 Days / 4 Nights', status: 'Active',
    gradient: ['#0F8C7C', '#2FBFA8'], fullLocation: 'Phuket, Thailand',
    description: 'Turquoise waters, limestone cliffs, and vibrant nightlife — Phuket delivers the best of Thailand’s Andaman coast in one relaxed island getaway.',
    itinerary: [
      { day: 1, time: '10:00 AM – 6:00 PM', title: 'Arrival & Patong Beach', description: 'Arrive and check in, then unwind at Patong Beach as the sun sets.' },
      { day: 2, time: '8:00 AM – 4:00 PM', title: 'Phi Phi Islands Tour', description: 'Speedboat day trip to Phi Phi Islands with snorkeling stops at Maya Bay and Monkey Beach.' },
      { day: 3, time: 'Full Day', title: 'Free Day / Optional Activities', description: 'Relax at the resort or join an optional Big Buddha and old town tour.' },
      { day: 4, time: '6:00 AM – 12:00 PM', title: 'Departure', description: 'Breakfast at the hotel, then transfer to Phuket International Airport.' },
    ],
  },
];

export const CATEGORY_OPTIONS = ['Beach & Island', 'Cultural & Heritage', 'City & Urban', 'Adventure & Nature'];
export const FLIGHT_TYPE_OPTIONS = ['Round Trip', 'One Way', 'Multi-City'];

export function formatPeso(n: number): string {
  return `₱${n.toLocaleString('en-US')}`;
}
