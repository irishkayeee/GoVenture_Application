/**
 * mockData.ts
 * Client-side mock data for the admin Payment Management tab.
 */

export type PaymentMethod = 'GCash' | 'Maya' | 'Bank Transfer';
export type PaymentStatus = 'Pending' | 'Fully Paid' | 'Partial' | 'Overdue';

export type Payment = {
  id:          string;
  bookingId:   string;
  clientName:  string;
  initials:    string;
  tourPackage: string;
  totalAmount: number;
  balance:     number;
  method:      PaymentMethod;
  status:      PaymentStatus;
  date:        string;
};

export const PAYMENTS: Payment[] = [
  { id: '1',  bookingId: 'GV-2026-00017', clientName: 'Jared Abellera',  initials: 'JA', tourPackage: 'Bali, Indonesia',   totalAmount: 25999, balance: 25999, method: 'GCash',         status: 'Pending',    date: 'Jun 19, 2026' },
  { id: '2',  bookingId: 'GV-2026-00016', clientName: 'Jared Abellera',  initials: 'JA', tourPackage: 'Bali, Indonesia',   totalAmount: 83995, balance: 83995, method: 'Maya',          status: 'Pending',    date: 'Jun 18, 2026' },
  { id: '3',  bookingId: 'GV-2026-00002', clientName: 'Mia Reyes',       initials: 'MR', tourPackage: 'Tokyo, Japan',      totalAmount: 23999, balance: 0,     method: 'Bank Transfer', status: 'Fully Paid', date: 'May 1, 2026' },
  { id: '4',  bookingId: 'GV-2026-00015', clientName: 'Mia Reyes',       initials: 'MR', tourPackage: 'Phuket, Thailand',  totalAmount: 11000, balance: 11000, method: 'GCash',         status: 'Pending',    date: 'Aug 20, 2026' },
  { id: '5',  bookingId: 'GV-2026-00014', clientName: 'Jared Abellera',  initials: 'JA', tourPackage: 'Tokyo, Japan',      totalAmount: 22000, balance: 11000, method: 'Maya',          status: 'Partial',    date: 'Jul 1, 2026' },
  { id: '6',  bookingId: 'GV-2026-00013', clientName: 'Rico Santos',     initials: 'RS', tourPackage: 'El Nido, Palawan',  totalAmount: 18500, balance: 18500, method: 'Bank Transfer', status: 'Pending',    date: 'Jun 28, 2026' },
  { id: '7',  bookingId: 'GV-2026-00012', clientName: 'Anna Cruz',       initials: 'AC', tourPackage: 'Kyoto, Japan',      totalAmount: 35200, balance: 0,     method: 'GCash',         status: 'Fully Paid', date: 'Jun 26, 2026' },
  { id: '8',  bookingId: 'GV-2026-00011', clientName: 'Carlos Reyes',    initials: 'CR', tourPackage: 'Santorini, Greece', totalAmount: 51000, balance: 51000, method: 'Maya',          status: 'Overdue',    date: 'Jun 10, 2026' },
  { id: '9',  bookingId: 'GV-2026-00010', clientName: 'Bea Ramos',       initials: 'BR', tourPackage: 'Boracay, Philippines', totalAmount: 9800, balance: 0,   method: 'Bank Transfer', status: 'Fully Paid', date: 'Jun 24, 2026' },
  { id: '10', bookingId: 'GV-2026-00018', clientName: 'Liza Fernandez',  initials: 'LF', tourPackage: 'Cebu, Philippines', totalAmount: 14500, balance: 7250,  method: 'GCash',         status: 'Partial',    date: 'Jul 20, 2026' },
];

export type QRPaymentMethod = {
  id:          string;
  method:      PaymentMethod;
  accountName: string;
};

export const INITIAL_QR_METHODS: QRPaymentMethod[] = [];

export const STATUS_FILTER_OPTIONS: { value: PaymentStatus | ''; label: string }[] = [
  { value: '',           label: 'All Status' },
  { value: 'Pending',    label: 'Pending' },
  { value: 'Fully Paid', label: 'Fully Paid' },
  { value: 'Partial',    label: 'Partial' },
  { value: 'Overdue',    label: 'Overdue' },
];

export const METHOD_FILTER_OPTIONS: { value: PaymentMethod | ''; label: string }[] = [
  { value: '',              label: 'All Payment Methods' },
  { value: 'GCash',         label: 'GCash' },
  { value: 'Maya',          label: 'Maya' },
  { value: 'Bank Transfer', label: 'Bank Transfer' },
];

export function formatPeso2(n: number): string {
  return `₱${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
