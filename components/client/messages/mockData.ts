/**
 * mockData.ts
 * Client-side mock data for the client Messages tab — one thread per active
 * booking, with the GoVenture Travel Team on the other end.
 */

export type ChatSender = 'team' | 'client';

export type ChatMessage = {
  id:     string;
  sender: ChatSender;
  text:   string;
  date:   string; // ISO 'YYYY-MM-DD'
  time:   string; // display time, e.g. '10:00 AM'
};

export type BookingStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';

export type TourConversation = {
  id:            string;
  destination:   string;
  bookingId:     string;
  location:      string;
  travelDates:   string;
  guestLabel:    string;
  bookingStatus: BookingStatus;
  totalAmount:   string;
  emoji:         string;
  lastMessage:   string;
  timeAgo:       string;
  unread:        boolean;
  ended:         boolean;
  messages:      ChatMessage[];
};

export const CLIENT_CONVERSATIONS: TourConversation[] = [
  {
    id: '1',
    destination:   'Bali, Indonesia',
    bookingId:     'GV-2026-00020',
    location:      'Bali, Indonesia',
    travelDates:   'Jul 10 – Jul 14, 2026',
    guestLabel:    '1 Adult',
    bookingStatus: 'Pending',
    totalAmount:   '₱25,999',
    emoji:         '🌏',
    lastMessage:   'hello',
    timeAgo:       'Jul 3',
    unread:        false,
    ended:         false,
    messages: [
      { id: 'm1', sender: 'team',   text: 'hi',    date: '2026-07-01', time: '2:35 AM' },
      { id: 'm2', sender: 'client', text: 'hello', date: '2026-07-02', time: '10:00 AM' },
      { id: 'm3', sender: 'team',   text: 'hello', date: '2026-07-03', time: '9:41 AM' },
      { id: 'm4', sender: 'team',   text: 'hello', date: '2026-07-03', time: '10:08 AM' },
    ],
  },
];
