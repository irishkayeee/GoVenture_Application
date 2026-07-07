/**
 * mockData.ts
 * Client-side mock data for the admin Messages tab.
 */

export type ChatSender = 'admin' | 'client';

export type ChatMessage = {
  id:     string;
  sender: ChatSender;
  text:   string;
  time:   string;
};

export type ActiveBooking = {
  destination:  string;
  travelDates:  string;
  guests:       number;
};

export type Conversation = {
  id:            string;
  clientName:    string;
  initials:      string;
  destination:   string;
  lastMessage:   string;
  timeAgo:       string;
  unread:        boolean;
  activeBooking?: ActiveBooking;
  messages:      ChatMessage[];
};

export const CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    clientName: 'Jared Abellera', initials: 'JA', destination: 'Bali, Indonesia',
    lastMessage: 'hello', timeAgo: '4d ago', unread: true,
    activeBooking: {
      destination: 'Bali, Indonesia',
      travelDates: 'Jul 10 2026 08:00 – Jul 14 2026 22:00',
      guests: 1,
    },
    messages: [
      { id: 'm1', sender: 'client', text: 'Hi! I just booked the Bali tour. Can you confirm my booking and let me know what documents I need to prepare?', time: '2:00 PM' },
      { id: 'm2', sender: 'admin',  text: 'Hello Jared! Thank you for booking with GoVenture. Your booking GV-2026-00001 is confirmed. Please prepare your passport, 2x2 ID photos, and travel insurance. We will send the full checklist via email shortly!', time: '3:00 PM' },
      { id: 'm3', sender: 'client', text: 'Great, thank you! One more question – is the Bali visa on arrival still free for Filipinos?', time: '9:30 AM' },
      { id: 'm4', sender: 'admin',  text: 'Yes! As of 2026, Filipinos can enter Bali visa-on-arrival for free for up to 30 days. No need to arrange anything in advance.', time: '10:00 AM' },
      { id: 'm5', sender: 'client', text: 'hi', time: '9:41 AM' },
      { id: 'm6', sender: 'client', text: 'hello', time: '10:08 AM' },
    ],
  },
  {
    id: '2',
    clientName: 'Grace Tan', initials: 'GT', destination: 'Bali, Indonesia',
    lastMessage: 'hi', timeAgo: '19d ago', unread: true,
    messages: [
      { id: 'm1', sender: 'client', text: 'Hi, is the Bali Island Escape package still available for August?', time: '11:12 AM' },
      { id: 'm2', sender: 'admin',  text: 'Hi Grace! Yes, we still have slots open for August. Would you like me to reserve one for you?', time: '11:20 AM' },
      { id: 'm3', sender: 'client', text: 'hi', time: '1:04 PM' },
    ],
  },
  {
    id: '3',
    clientName: 'Benjamin Lim', initials: 'BL', destination: 'Da Nang, Vietnam',
    lastMessage: 'Perfect! I will send the details tomorrow.', timeAgo: '84d ago', unread: true,
    messages: [
      { id: 'm1', sender: 'client', text: 'Can I move my Da Nang trip a week later? Something came up at work.', time: '8:02 AM' },
      { id: 'm2', sender: 'admin',  text: 'Of course! I can shift your travel dates by a week at no extra charge. Let me update your booking.', time: '8:15 AM' },
      { id: 'm3', sender: 'client', text: 'Perfect! I will send the details tomorrow.', time: '8:16 AM' },
    ],
  },
  {
    id: '4',
    clientName: 'Mia Reyes', initials: 'MR', destination: 'Phuket, Thailand',
    lastMessage: 'Yes please, that would be very helpful.', timeAgo: '85d ago', unread: true,
    messages: [
      { id: 'm1', sender: 'client', text: 'Do you have any recommendations for island hopping add-ons in Phuket?', time: '4:30 PM' },
      { id: 'm2', sender: 'admin',  text: 'We have a Phi Phi Islands day tour that pairs really well with your package. Want me to add it to your booking?', time: '4:45 PM' },
      { id: 'm3', sender: 'client', text: 'Yes please, that would be very helpful.', time: '4:47 PM' },
    ],
  },
  {
    id: '5',
    clientName: 'Carlos Garcia', initials: 'CG', destination: 'Boracay Island',
    lastMessage: 'We are very sorry to hear that, please give us a moment.', timeAgo: '92d ago', unread: false,
    messages: [
      { id: 'm1', sender: 'client', text: 'Our flight got cancelled and we might miss the first day of the tour.', time: '6:10 AM' },
      { id: 'm2', sender: 'admin',  text: 'We are very sorry to hear that, please give us a moment while we check rebooking options for you.', time: '6:15 AM' },
    ],
  },
];
