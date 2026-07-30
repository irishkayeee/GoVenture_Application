/**
 * mockData.ts
 * Type defs for the client Documents tab. Everything here is filled from the
 * real backend (client_documents_overview, client_documents_list) — no seed
 * data lives in this file.
 */

export type DocumentStatus = 'Pending Upload' | 'Submitted' | 'Approved' | 'Rejected' | 'Reupload Requested';

export type RequiredDocument = {
  id:           string;
  title:        string;
  description:  string;
  instructions: string;
  status:       DocumentStatus;
  fileName:     string | null;
  adminComment: string | null;
};

export type BookingStatus = 'Pending' | 'Confirmed' | 'Ongoing' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Unpaid' | 'Partial' | 'Fully Paid' | 'Overdue' | 'Refunded';
export type TravelerDocsStatus = 'Not Started' | 'In Progress' | 'Needs Attention' | 'Complete';
export type AgencyDocStatus = 'Waiting for Agency' | 'Available';
export type TravelDocStatus = 'Not Yet Available' | 'Available';

export type AgencyDocument = { type: string; title: string; status: AgencyDocStatus; dependsOn: string[] };
export type TravelDocument = { type: string; title: string; status: TravelDocStatus; dependsOn: string[] };

/** One row from client_documents_overview — everything the Bookings list and Document Detail screens need for one booking. */
export type DocumentsOverview = {
  id:                    string; // booking reference, e.g. "GV-2026-04949"
  destination:           string;
  dateFrom:              string;
  dateTo:                string;
  passengerName:         string;
  bookingStatus:         BookingStatus;
  paymentStatus:         PaymentStatus;
  totalAmount:           number;
  balanceDue:            number;
  travelerDocsStatus:    TravelerDocsStatus;
  travelerDocsApproved:  number;
  travelerDocsTotal:     number;
  agencyDocuments:       AgencyDocument[];
  travelDocuments:       TravelDocument[];
};

export const AGENCY_DOC_DESCRIPTIONS: Record<string, string> = {
  quotation:            'Prepared by the agency — not yet available.',
  statement_of_account: 'Prepared by the agency — not yet available.',
  invoice:              'Prepared by the agency — not yet available.',
  official_receipt:     'Prepared by the agency — not yet available.',
};

export const TRAVEL_DOC_DESCRIPTIONS: Record<string, string> = {
  tour_voucher:   'Your redeemable voucher for this tour.',
  tour_itinerary: 'Your day-by-day travel schedule.',
  memo:           'Trip notes and reminders from the agency.',
};
