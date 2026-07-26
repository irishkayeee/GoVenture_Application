/**
 * mockData.ts
 * Type defs for the client Messages tab. Conversations are fetched from the
 * real backend (client_conversations_list) in ClientMessagesScreen.tsx —
 * no seed data here.
 */

export type ChatSender = 'team' | 'client';

export type ChatMessage = {
  id:     string;
  sender: ChatSender;
  text:   string;
  date:   string; // ISO 'YYYY-MM-DD'
  time:   string; // display time, e.g. '10:00 AM'
};

export type BookingStatus = 'Pending' | 'Confirmed' | 'Ongoing' | 'Cancelled' | 'Completed';

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
