/**
 * documentContent.ts
 * Builds the HTML used both for previewing and for downloading (via
 * expo-print) each Agency/Travel document — Quotation, Statement of Account,
 * Invoice, Official Receipt, Tour Voucher, Tour Itinerary, Memo. Content is
 * placeholder/demo copy, but every field pulled in (booking ref, passenger,
 * destination, dates, amounts) is the booking's real data from
 * client_documents_overview, not hardcoded.
 */

import { DocumentsOverview } from './mockData';

const money = (n: number) => `₱${n.toLocaleString('en-US')}`;
const formatDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export type DocumentContent = { title: string; html: string };

function renderDocument(title: string, rows: [string, string][], note: string): DocumentContent {
  const rowsHtml = rows.map(([label, value]) => `
    <tr>
      <td style="padding:8px 0;color:#6B3318;font-size:12px;font-weight:700;">${escapeHtml(label)}</td>
      <td style="padding:8px 0;color:#3B1A0C;font-size:12px;font-weight:800;text-align:right;">${escapeHtml(value)}</td>
    </tr>`).join('');

  const html = `
    <html>
      <head><meta charset="utf-8" /></head>
      <body style="font-family:-apple-system,Helvetica,Arial,sans-serif;margin:0;padding:0;background:#FDF0E6;">
        <div style="background:#3B1A0C;padding:28px 32px;">
          <div style="color:#FFFFFF;font-size:20px;font-weight:900;">GOVENTURE TRAVEL AND TOURS</div>
          <div style="color:rgba(255,255,255,0.85);font-size:13px;margin-top:4px;">${escapeHtml(title)}</div>
        </div>
        <div style="padding:28px 32px;">
          <table width="100%" style="border-collapse:collapse;">${rowsHtml}</table>
          ${note ? `
            <div style="height:1px;background:#E8C4A0;margin:20px 0;"></div>
            <div style="color:#6B3318;font-size:11.5px;line-height:1.6;">${escapeHtml(note)}</div>
          ` : ''}
        </div>
      </body>
    </html>`;

  return { title, html };
}

export function buildDocumentContent(docType: string, overview: DocumentsOverview): DocumentContent {
  const amountPaid = overview.totalAmount - overview.balanceDue;
  const dateRange = `${formatDate(overview.dateFrom)} – ${formatDate(overview.dateTo)}`;
  const shortRef = overview.id.replace('GV-', '');

  switch (docType) {
    case 'quotation':
      return renderDocument('Quotation', [
        ['Booking Reference', overview.id],
        ['Destination', overview.destination],
        ['Proposed Travel Dates', dateRange],
        ['Estimated Total Cost', money(overview.totalAmount)],
      ], 'This quotation is valid for 7 days from the date of issue and is subject to availability at the time of confirmation.');

    case 'statement_of_account':
      return renderDocument('Statement of Account', [
        ['Booking Reference', overview.id],
        ['Total Amount', money(overview.totalAmount)],
        ['Amount Paid', money(amountPaid)],
        ['Balance Due', money(overview.balanceDue)],
        ['Payment Status', overview.paymentStatus],
      ], 'Please settle any outstanding balance before your scheduled departure date.');

    case 'invoice':
      return renderDocument('Invoice', [
        ['Invoice No.', `INV-${shortRef}`],
        ['Booking Reference', overview.id],
        ['Destination', overview.destination],
        ['Amount Due', money(overview.balanceDue)],
        ['Due Date', formatDate(overview.dateFrom)],
      ], 'Kindly settle this invoice at your earliest convenience to confirm your reservation.');

    case 'official_receipt':
      return renderDocument('Official Receipt', [
        ['OR No.', `OR-${shortRef}`],
        ['Booking Reference', overview.id],
        ['Received From', overview.passengerName],
        ['Amount Received', money(amountPaid)],
        ['Payment Status', 'Fully Paid'],
      ], 'Thank you for your payment. This receipt serves as proof of full payment for your booking.');

    case 'tour_voucher':
      return renderDocument('Tour Voucher', [
        ['Booking Reference', overview.id],
        ['Passenger', overview.passengerName],
        ['Destination', overview.destination],
        ['Travel Dates', dateRange],
      ], 'Present this voucher upon check-in. Non-transferable and valid only for the traveler named above.');

    case 'tour_itinerary': {
      const days = Math.max(1, Math.round((new Date(overview.dateTo).getTime() - new Date(overview.dateFrom).getTime()) / 86400000) + 1);
      const itineraryRows: [string, string][] = Array.from({ length: days }, (_, i) => [
        `Day ${i + 1}`,
        i === 0 ? `Arrival in ${overview.destination}` : i === days - 1 ? `Departure from ${overview.destination}` : `Free time to explore ${overview.destination}`,
      ]);
      return renderDocument('Tour Itinerary', [
        ['Booking Reference', overview.id],
        ['Destination', overview.destination],
        ['Travel Dates', dateRange],
        ...itineraryRows,
      ], 'Itinerary is subject to change due to local conditions and weather.');
    }

    case 'memo':
      return renderDocument('Memo', [
        ['Booking Reference', overview.id],
        ['Destination', overview.destination],
      ], `Dear ${overview.passengerName}, please arrive at least 3 hours before your scheduled departure to ${overview.destination}. Bring a valid government ID and a copy of this document. For concerns, reach out to our team via the Messages tab.`);

    default:
      return renderDocument('Document', [['Booking Reference', overview.id]], '');
  }
}
