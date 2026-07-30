/**
 * DocumentsScreen.tsx
 * Client Documents tab — mobile two-screen flow:
 *   Screen 1: a sortable list of the user's bookings, each showing Booking /
 *   Payment / Documents status badges (client_documents_overview).
 *   Screen 2: full document detail for one booking — a Travel Readiness
 *   ring, summary cards, and three expandable sections (Traveler Documents,
 *   showing the account's own Passport/Government ID from Edit Profile >
 *   Travel Documents; Agency Documents and Travel Documents, whose
 *   availability is computed live from the booking's real status/payment
 *   fields, not stored anywhere).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal, Image,
  StyleSheet, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import Copyright from '@/components/Copyright';
import { C } from '../theme';
import ClientPageHero from '../ClientPageHero';
import { useAuth } from '@/components/auth/AuthContext';
import { downloadReceiptPdf, downloadImageFromUrl } from '../tours/downloadReceipt';
import { buildDocumentContent } from './documentContent';
import {
  DocumentStatus, DocumentsOverview,
  AgencyDocument, TravelDocument, BookingStatus, PaymentStatus, TravelerDocsStatus,
  AGENCY_DOC_DESCRIPTIONS, TRAVEL_DOC_DESCRIPTIONS,
} from './mockData';
import {
  CLIENT_DOCUMENTS_OVERVIEW_API_URL, CLIENT_ACCOUNT_GET_API_URL,
} from '@/constants/api';

/* ── Icons (solid-style, no emoji) ── */
const BackIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M15 19l-7-7 7-7" stroke={C.brown} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const PinIcon = ({ color = C.amber, size = 12 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill={color} d="M12 22s7.5-7.94 7.5-13A7.5 7.5 0 004.5 9c0 5.06 7.5 13 7.5 13z" />
    <Circle cx={12} cy={9} r={2.6} fill="#FFFFFF" />
  </Svg>
);
const CalendarIcon = ({ color = C.brownMid, size = 13 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill={color} d="M7 2a1 1 0 011 1v1h8V3a1 1 0 112 0v1h1a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h1V3a1 1 0 011-1zM5 10v10h14V10H5z" />
  </Svg>
);
const PersonIcon = ({ color = C.brownMid, size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx={12} cy={8} r={4} fill={color} />
    <Path fill={color} d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7v1H4v-1z" />
  </Svg>
);
const ChevronIcon = ({ open, color = C.brown, size = 10 }: { open: boolean; color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
    <Path fill={color} d="M12 16L4 8h16z" />
  </Svg>
);
const ArrowRightIcon = ({ color = C.amber, size = 10 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill={color} d="M4 11h13.2l-4.6-4.6L14 5l7 7-7 7-1.4-1.4L17.2 13H4z" />
  </Svg>
);
const LockIcon = ({ color = C.brownMid, size = 13 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill={color} d="M12 2a5 5 0 015 5v3h1a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2h1V7a5 5 0 015-5zm0 2a3 3 0 00-3 3v3h6V7a3 3 0 00-3-3zm0 10a1.5 1.5 0 00-.34 2.96L11.3 19h1.4l-.36-2.04A1.5 1.5 0 0012 14z" />
  </Svg>
);
const CheckCircleIcon = ({ color = C.success, size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx={12} cy={12} r={10} fill={color} />
    <Path d="M7 12.5l3 3 7-7" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg>
);
const DownloadIcon = ({ color = C.brown, size = 13 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill={color} d="M12 3a1 1 0 011 1v8.6l2.3-2.3a1 1 0 111.4 1.4l-4 4a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4l2.3 2.3V4a1 1 0 011-1zM5 19a1 1 0 011-1h12a1 1 0 110 2H6a1 1 0 01-1-1z" />
  </Svg>
);

/** Shared solid document silhouette — folded top-right corner, colored fill, white accent glyph on top. */
function DocGlyph({ color, size = 18, children }: { color: string; size?: number; children?: React.ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path fill={color} d="M6 2h8l5 5v14a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z" />
      <Path fill="#FFFFFF" opacity={0.32} d="M14 2v5h5z" />
      {children}
    </Svg>
  );
}
const IdCardDocIcon = ({ color = C.brown, size = 18 }: { color?: string; size?: number }) => (
  <DocGlyph color={color} size={size}>
    <Circle cx={9.3} cy={12.6} r={1.7} fill="#FFFFFF" />
    <Path fill="#FFFFFF" d="M6.8 17.2c.3-1.5 1.4-2.4 2.5-2.4s2.2.9 2.5 2.4H6.8zM13 12h4v1.2h-4zM13 14.4h4v1.2h-4z" />
  </DocGlyph>
);
const PassportDocIcon = ({ color = C.brown, size = 18 }: { color?: string; size?: number }) => (
  <DocGlyph color={color} size={size}>
    <Circle cx={11} cy={13.3} r={3} stroke="#FFFFFF" strokeWidth={1.1} fill="none" />
    <Path stroke="#FFFFFF" strokeWidth={1.1} d="M8.2 13.3h5.6M11 10.4v5.8" fill="none" />
  </DocGlyph>
);
const QuotationDocIcon = ({ color = C.amber, size = 18 }: { color?: string; size?: number }) => (
  <DocGlyph color={color} size={size}>
    <Circle cx={15.3} cy={16.3} r={3.1} fill="#FFFFFF" />
    <Path stroke={color} strokeWidth={1.3} strokeLinecap="round" fill="none" d="M15.3 14.6v3.4M14.3 15.1c0-.5.5-.8 1-.8s1.1.3 1.1.8-.5.7-1.1.9-1 .4-1 .9.5.8 1 .8 1-.3 1-.8" />
  </DocGlyph>
);
const StatementDocIcon = ({ color = C.info, size = 18 }: { color?: string; size?: number }) => (
  <DocGlyph color={color} size={size}>
    <Path fill="#FFFFFF" d="M8 17.2v-3h1.7v3H8zm3-1.1v-4.4h1.7v4.4H11zm3 1.1v-2.2h1.7v2.2H14z" />
  </DocGlyph>
);
const InvoiceDocIcon = ({ color = C.brown, size = 18 }: { color?: string; size?: number }) => (
  <DocGlyph color={color} size={size}>
    <Path fill="#FFFFFF" d="M7.3 11.2h9v1.3h-9zM7.3 13.8h9v1.3h-9zM7.3 16.4h6v1.3h-6z" />
  </DocGlyph>
);
const ReceiptDocIcon = ({ color = C.success, size = 18 }: { color?: string; size?: number }) => (
  <DocGlyph color={color} size={size}>
    <Circle cx={15.4} cy={16.4} r={3.1} fill="#FFFFFF" />
    <Path d="M13.9 16.5l1.1 1 1.8-2" stroke={color} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </DocGlyph>
);
const VoucherDocIcon = ({ color = C.amber, size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill={color} d="M3 7a2 2 0 012-2h14a2 2 0 012 2v2a1.6 1.6 0 000 3.2v1.8a2 2 0 01-2 2H5a2 2 0 01-2-2v-1.8a1.6 1.6 0 000-3.2V7z" />
    <Path stroke="#FFFFFF" strokeWidth={1.2} strokeDasharray="2,2" d="M12 5.5v13" />
  </Svg>
);
const ItineraryDocIcon = ({ color = C.info, size = 18 }: { color?: string; size?: number }) => (
  <DocGlyph color={color} size={size}>
    <Circle cx={8.7} cy={11.8} r={1.1} fill="#FFFFFF" />
    <Circle cx={15} cy={13.6} r={1.1} fill="#FFFFFF" />
    <Circle cx={10.2} cy={17} r={1.1} fill="#FFFFFF" />
    <Path stroke="#FFFFFF" strokeWidth={1} strokeDasharray="1.4,1.4" fill="none" d="M8.7 11.8L15 13.6l-4.8 3.4" />
  </DocGlyph>
);
const MemoDocIcon = ({ color = C.brownMid, size = 18 }: { color?: string; size?: number }) => (
  <DocGlyph color={color} size={size}>
    <Circle cx={15.6} cy={11.4} r={1.3} fill="#FFFFFF" />
    <Path fill="#FFFFFF" d="M7.3 14.2h9v1.2h-9zM7.3 16.6h6v1.2h-6z" />
  </DocGlyph>
);
const DOC_TYPE_ICON: Record<string, React.FC<{ color?: string; size?: number }>> = {
  'valid-id': IdCardDocIcon,
  passport: PassportDocIcon,
  quotation: QuotationDocIcon,
  statement_of_account: StatementDocIcon,
  invoice: InvoiceDocIcon,
  official_receipt: ReceiptDocIcon,
  tour_voucher: VoucherDocIcon,
  tour_itinerary: ItineraryDocIcon,
  memo: MemoDocIcon,
};

/* ── Status color maps (soft bg + colored text, consistent across the screen) ── */
type StatusStyle = { bg: string; color: string };
const REQUIRED_DOC_STYLE: Record<DocumentStatus, StatusStyle> = {
  'Pending Upload':     { bg: '#F1F1F1', color: C.brownMid },
  Submitted:            { bg: '#FFF5E0', color: '#B8922E' },
  Approved:             { bg: '#E7F9F3', color: '#12946F' },
  Rejected:             { bg: '#FDEAEA', color: C.danger },
  'Reupload Requested': { bg: '#FCE4E1', color: '#E5473A' },
};
const BOOKING_STATUS_STYLE: Record<BookingStatus, StatusStyle> = {
  Pending:   { bg: '#FFF5E0', color: '#B8922E' },
  Confirmed: { bg: '#E8F1FC', color: C.info },
  Ongoing:   { bg: '#E8F1FC', color: C.info },
  Completed: { bg: '#E7F9F3', color: '#12946F' },
  Cancelled: { bg: '#FDEAEA', color: C.danger },
};
const PAYMENT_STATUS_STYLE: Record<PaymentStatus, StatusStyle> = {
  Unpaid:       { bg: '#FDEAEA', color: C.danger },
  Partial:      { bg: '#FFF5E0', color: '#B8922E' },
  'Fully Paid': { bg: '#E7F9F3', color: '#12946F' },
  Overdue:      { bg: '#FDEAEA', color: C.danger },
  Refunded:     { bg: '#F1F1F1', color: C.brownMid },
};
const TRAVELER_DOCS_STYLE: Record<TravelerDocsStatus, StatusStyle> = {
  'Not Started':     { bg: '#F1F1F1', color: C.brownMid },
  'In Progress':     { bg: '#FFF5E0', color: '#B8922E' },
  'Needs Attention': { bg: '#FDEAEA', color: C.danger },
  Complete:          { bg: '#E7F9F3', color: '#12946F' },
};
const WAITING_STYLE: StatusStyle = { bg: '#E8F1FC', color: C.info };
const AVAILABLE_STYLE: StatusStyle = { bg: '#E7F9F3', color: '#12946F' };

function StatusBadge({ label, style }: { label: string; style: StatusStyle }) {
  return (
    <View style={[bd.pill, { backgroundColor: style.bg }]}>
      <Text style={[bd.pillText, { color: style.color }]}>{label}</Text>
    </View>
  );
}
const bd = StyleSheet.create({
  pill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  pillText: { fontSize: 10, fontWeight: '800' },
});

const formatShort = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/* ── Travel Readiness ring ── */
function ReadinessRing({ percent }: { percent: number }) {
  const size = 70, stroke = 7, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={C.divider} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={C.amber} strokeWidth={stroke} fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c - (c * percent) / 100}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={rr.center}>
        <Text style={rr.centerText}>{percent}%</Text>
      </View>
    </View>
  );
}
const rr = StyleSheet.create({
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  centerText: { fontSize: 13, fontWeight: '900', color: C.brown },
});

/* ── Collapsible section shell ── */
function Section({ title, subtitle, open, onToggle, children }: {
  title: string; subtitle?: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <View style={sc.card}>
      <TouchableOpacity style={sc.header} activeOpacity={0.75} onPress={onToggle}>
        <ChevronIcon open={open} />
        <Text style={sc.title}>{title}</Text>
        <View style={{ flex: 1 }} />
        {!!subtitle && <Text style={sc.subtitle} numberOfLines={1}>{subtitle}</Text>}
      </TouchableOpacity>
      {open && <View style={sc.body}>{children}</View>}
    </View>
  );
}
const sc = StyleSheet.create({
  card: { backgroundColor: C.cardBg, borderRadius: 14, borderWidth: 1, borderColor: C.divider, marginHorizontal: 16, marginTop: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14 },
  title: { fontSize: 13.5, fontWeight: '900', color: C.brown },
  subtitle: { fontSize: 10, color: C.brownMid, opacity: 0.65, maxWidth: 140 },
  body: { paddingHorizontal: 14, paddingBottom: 14, gap: 10 },
});

/* ── A row inside Agency Documents / Travel Documents ── */
function DocRow({ icon: Icon, title, description, status, dependsOn, tint, onPress, onDownload }: {
  icon: React.FC<{ color?: string; size?: number }>;
  title: string; description: string; status: string; dependsOn: string[]; tint: string;
  onPress: () => void; onDownload: () => void;
}) {
  const available = status === 'Available';
  return (
    <View style={rw.row}>
      <TouchableOpacity style={rw.topLine} activeOpacity={available ? 0.7 : 1} disabled={!available} onPress={onPress}>
        <View style={[rw.iconBox, { backgroundColor: tint + '1A' }]}><Icon color={tint} /></View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={rw.title}>{title}</Text>
          <Text style={rw.desc} numberOfLines={2}>{description}</Text>
          {available && <Text style={rw.tapHint}>Tap to view</Text>}
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <StatusBadge label={status} style={available ? AVAILABLE_STYLE : WAITING_STYLE} />
          {available && (
            <TouchableOpacity
              style={[rw.downloadBtn, { borderColor: tint }]}
              activeOpacity={0.75}
              onPress={onDownload}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <DownloadIcon color={tint} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
      {!available && dependsOn.length > 0 && (
        <View style={rw.dependBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <LockIcon />
            <Text style={rw.dependLabel}>Complete these first:</Text>
          </View>
          {dependsOn.map((dep) => (
            <View key={dep} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3, marginLeft: 18 }}>
              <ArrowRightIcon />
              <Text style={rw.dependLink}>{dep}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
const rw = StyleSheet.create({
  row: { borderTopWidth: 1, borderTopColor: C.divider, paddingTop: 10 },
  topLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  iconBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title: { fontSize: 12.5, fontWeight: '800', color: C.brown },
  desc: { fontSize: 10.5, color: C.brownMid, opacity: 0.75, marginTop: 2, lineHeight: 14 },
  tapHint: { fontSize: 9.5, fontWeight: '800', color: C.amber, marginTop: 4 },
  downloadBtn: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  dependBox: { backgroundColor: C.lightBg, borderRadius: 10, padding: 10, marginTop: 8 },
  dependLabel: { fontSize: 10, fontWeight: '800', color: C.brownMid },
  dependLink: { fontSize: 10.5, fontWeight: '700', color: C.amber },
});

const tc = StyleSheet.create({
  card: { backgroundColor: C.lightBg, borderRadius: 12, borderWidth: 1, borderColor: C.divider, padding: 12, gap: 8 },
  iconBox: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title: { fontSize: 12, fontWeight: '800', color: C.brown },
  desc: { fontSize: 10, color: C.brownMid, opacity: 0.75, marginTop: 1 },
  commentBox: { backgroundColor: '#FCE4E1', borderRadius: 8, padding: 8 },
  commentLabel: { fontSize: 9, fontWeight: '800', color: C.danger },
  commentText: { fontSize: 10, color: C.brownMid, marginTop: 2, lineHeight: 13 },
  instructionsRow: { flexDirection: 'row', alignItems: 'center', gap: 5, borderTopWidth: 1, borderTopColor: C.divider, paddingTop: 8 },
  instructionsLabel: { fontSize: 10.5, fontWeight: '800', color: C.brown },
  instructionsText: { fontSize: 10, color: C.brownMid, lineHeight: 14 },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  fileText: { fontSize: 9.5, color: C.brownMid, opacity: 0.7, flexShrink: 1 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.danger, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7, flexShrink: 0 },
  actionBtnDone: { backgroundColor: '#EAF7EC' },
  actionBtnReupload: { backgroundColor: C.amber },
  actionBtnText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  actionBtnTextDone: { fontSize: 10, fontWeight: '800', color: '#12946F' },
  actionBtnTextReupload: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
});

/* ══════════════════════════ Screen 1: Bookings list ══════════════════════════ */
type SortKey = 'departure' | 'booking' | 'payment' | 'documents';
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'departure', label: 'Nearest Departure' },
  { key: 'booking', label: 'Booking Status' },
  { key: 'payment', label: 'Payment Status' },
  { key: 'documents', label: 'Documents Status' },
];

function BookingCard({ item, onPress }: { item: DocumentsOverview; onPress: () => void }) {
  return (
    <TouchableOpacity style={bc.card} activeOpacity={0.85} onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <PinIcon />
        <Text style={bc.dest} numberOfLines={1}>{item.destination}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 }}>
        <Text style={bc.ref}>{item.id}</Text>
        <Text style={bc.dot}>·</Text>
        <CalendarIcon size={11} />
        <Text style={bc.date}>Departs {formatShort(item.dateFrom)}</Text>
      </View>

      <View style={bc.statusList}>
        <View style={bc.statusRow}>
          <Text style={bc.statusLabel}>Booking</Text>
          <StatusBadge label={item.bookingStatus} style={BOOKING_STATUS_STYLE[item.bookingStatus]} />
        </View>
        <View style={bc.statusRow}>
          <Text style={bc.statusLabel}>Payment</Text>
          <StatusBadge label={item.paymentStatus} style={PAYMENT_STATUS_STYLE[item.paymentStatus]} />
        </View>
        <View style={bc.statusRow}>
          <Text style={bc.statusLabel}>Documents</Text>
          <StatusBadge label={item.travelerDocsStatus} style={TRAVELER_DOCS_STYLE[item.travelerDocsStatus]} />
        </View>
      </View>
    </TouchableOpacity>
  );
}
const bc = StyleSheet.create({
  card: {
    backgroundColor: C.cardBg, borderRadius: 14, borderWidth: 1, borderColor: C.divider,
    padding: 14, marginHorizontal: 16, marginBottom: 12,
  },
  dest: { fontSize: 14, fontWeight: '900', color: C.brown, flexShrink: 1 },
  ref: { fontSize: 10.5, fontWeight: '700', color: C.brownMid, opacity: 0.8 },
  dot: { fontSize: 10.5, color: C.brownMid, opacity: 0.5 },
  date: { fontSize: 10.5, color: C.brownMid, opacity: 0.8 },
  statusList: { marginTop: 10, gap: 7 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusLabel: { fontSize: 11, fontWeight: '700', color: C.brownMid, opacity: 0.75 },
});

function SortDropdown({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  const [open, setOpen] = useState(false);
  const activeLabel = SORT_OPTIONS.find((o) => o.key === value)?.label ?? '';
  return (
    <View style={{ marginHorizontal: 16, marginTop: 12, position: 'relative', zIndex: 10 }}>
      <TouchableOpacity style={sd.trigger} activeOpacity={0.8} onPress={() => setOpen((v) => !v)}>
        <Text style={sd.triggerLabel}>Sort by: <Text style={sd.triggerValue}>{activeLabel}</Text></Text>
        <ChevronIcon open={open} size={9} color={C.brownMid} />
      </TouchableOpacity>
      {open && (
        <View style={sd.menu}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={sd.menuItem}
              activeOpacity={0.75}
              onPress={() => { onChange(opt.key); setOpen(false); }}
            >
              <Text style={[sd.menuItemText, opt.key === value && sd.menuItemTextActive]}>{opt.label}</Text>
              {opt.key === value && <CheckCircleIcon size={13} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
const sd = StyleSheet.create({
  trigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.divider, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, alignSelf: 'flex-start', minWidth: 220,
  },
  triggerLabel: { fontSize: 11.5, fontWeight: '700', color: C.brownMid, marginRight: 10 },
  triggerValue: { color: C.brown, fontWeight: '900' },
  menu: {
    position: 'absolute', top: 46, left: 0, backgroundColor: C.cardBg, borderRadius: 12,
    borderWidth: 1, borderColor: C.divider, paddingVertical: 4, minWidth: 220,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 8 },
    }),
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 11 },
  menuItemText: { fontSize: 12, fontWeight: '700', color: C.brown },
  menuItemTextActive: { color: '#12946F', fontWeight: '900' },
});

/* ── Document preview modal — renders the same HTML that gets turned into the downloaded PDF ── */
function DocumentPreviewModal({ visible, content, onClose, onDownload, downloading }: {
  visible: boolean;
  content: { title: string; html: string } | null;
  onClose: () => void;
  onDownload: () => void;
  downloading: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={pv.safe}>
        <View style={[pv.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity style={pv.backBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={pv.headerTitle} numberOfLines={1}>{content?.title ?? 'Document'}</Text>
          <View style={{ width: 30 }} />
        </View>

        <View style={{ flex: 1 }}>
          {content && (
            <WebView
              originWhitelist={['*']}
              source={{ html: content.html }}
              style={{ flex: 1, backgroundColor: '#FFFFFF' }}
            />
          )}
        </View>

        <View style={pv.footer}>
          <TouchableOpacity
            style={[pv.downloadBtn, downloading && { opacity: 0.7 }]}
            activeOpacity={0.85}
            onPress={onDownload}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <DownloadIcon color="#FFFFFF" size={14} />
                <Text style={pv.downloadBtnText}>Download</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
const pv = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.lightBg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.divider, backgroundColor: C.cardBg,
  },
  backBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 14.5, fontWeight: '900', color: C.brown, flex: 1, textAlign: 'center' },
  footer: {
    padding: 14, borderTopWidth: 1, borderTopColor: C.divider, backgroundColor: C.cardBg,
  },
  downloadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.amber, borderRadius: 14, paddingVertical: 14,
  },
  downloadBtnText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
});

/* ── Full-screen viewer for a real passport/ID scan (image, not generated HTML) ── */
function ImageDocPreviewModal({ visible, title, imageUrl, onClose, onDownload, downloading }: {
  visible: boolean; title: string; imageUrl: string | null; onClose: () => void; onDownload: () => void; downloading: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={pv.safe}>
        <View style={[pv.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity style={pv.backBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={pv.headerTitle} numberOfLines={1}>{title}</Text>
          <View style={{ width: 30 }} />
        </View>

        <View style={{ flex: 1, backgroundColor: '#000000' }}>
          {imageUrl && <Image source={{ uri: imageUrl }} style={{ flex: 1 }} resizeMode="contain" />}
        </View>

        <View style={pv.footer}>
          <TouchableOpacity
            style={[pv.downloadBtn, downloading && { opacity: 0.7 }]}
            activeOpacity={0.85}
            onPress={onDownload}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <DownloadIcon color="#FFFFFF" size={14} />
                <Text style={pv.downloadBtnText}>Download</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Traveler Documents: the user's account-level Passport / Government ID
 * (uploaded via Account > Edit Profile > Travel Documents). Fetched straight
 * from client_account_get — the exact same endpoint Edit Profile reads and
 * writes — so this is always the same live record, never a separate copy.
 */
type AccountIdentityDoc = { key: 'passport' | 'valid-id'; title: string; imageUrl: string | null };

function AccountIdentityDocs({ userId, onGoToEditProfile }: { userId: string; onGoToEditProfile?: () => void }) {
  const [passportUrl, setPassportUrl] = useState<string | null>(null);
  const [validIdUrl, setValidIdUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<AccountIdentityDoc | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${CLIENT_ACCOUNT_GET_API_URL}&userId=${userId}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.status === 'success') {
          setPassportUrl(result.data.passportImageUrl ?? null);
          setValidIdUrl(result.data.validIdImageUrl ?? null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const handleDownload = async (doc: AccountIdentityDoc) => {
    if (!doc.imageUrl) return;
    setDownloading(true);
    try {
      const result = await downloadImageFromUrl(`GoVenture-${doc.title.replace(/\s+/g, '-')}`, doc.imageUrl);
      if (!result.ok) Alert.alert('Download failed', result.message);
      else if (result.silent) Alert.alert('Downloaded', `${doc.title} was saved to your device automatically.`);
    } catch {
      Alert.alert('Download failed', 'Something went wrong. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <ActivityIndicator color={C.amber} style={{ marginVertical: 12 }} />;

  const items: AccountIdentityDoc[] = [
    { key: 'passport', title: 'Passport', imageUrl: passportUrl },
    { key: 'valid-id', title: 'Government ID', imageUrl: validIdUrl },
  ];

  return (
    <>
      <Text style={aid.groupLabel}>IDENTITY DOCUMENTS (FROM YOUR ACCOUNT PROFILE)</Text>
      <View style={{ gap: 10 }}>
        {items.map((doc) => {
          const Icon = DOC_TYPE_ICON[doc.key];
          const uploaded = !!doc.imageUrl;
          const tint = uploaded ? '#12946F' : C.brownMid;
          return (
            <View key={doc.key} style={tc.card}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}
                activeOpacity={uploaded ? 0.7 : 1}
                disabled={!uploaded}
                onPress={() => setPreview(doc)}
              >
                <View style={[tc.iconBox, { backgroundColor: tint + '1A' }]}>
                  <Icon color={tint} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={tc.title}>{doc.title}</Text>
                  <Text style={tc.desc}>{uploaded ? 'Uploaded to your Account profile' : 'Not yet uploaded'}</Text>
                  {uploaded && <Text style={aid.tapHint}>Tap to view &amp; download</Text>}
                </View>
                <StatusBadge label={uploaded ? 'Uploaded' : 'Missing'} style={uploaded ? AVAILABLE_STYLE : REQUIRED_DOC_STYLE['Pending Upload']} />
              </TouchableOpacity>

              {!uploaded && (
                <TouchableOpacity style={aid.addLink} activeOpacity={0.75} onPress={onGoToEditProfile}>
                  <Text style={aid.addLinkText}>Add in Account &gt; Edit Profile &gt; Travel Documents</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      <ImageDocPreviewModal
        visible={!!preview}
        title={preview?.title ?? ''}
        imageUrl={preview?.imageUrl ?? null}
        onClose={() => setPreview(null)}
        onDownload={() => preview && handleDownload(preview)}
        downloading={downloading}
      />
    </>
  );
}
const aid = StyleSheet.create({
  groupLabel: { fontSize: 9.5, fontWeight: '800', color: C.brownMid, opacity: 0.6, letterSpacing: 0.4, marginTop: 6, marginBottom: 2 },
  tapHint: { fontSize: 9.5, fontWeight: '800', color: C.amber, marginTop: 4 },
  addLink: { borderTopWidth: 1, borderTopColor: C.divider, marginTop: 8, paddingTop: 8 },
  addLinkText: { fontSize: 10.5, fontWeight: '800', color: C.amber },
});

/* ══════════════════════════ Screen 2: Document Detail ══════════════════════════ */
function DocumentDetailScreen({ overview, onBack, onGoToEditProfile }: {
  overview: DocumentsOverview; onBack: () => void; onGoToEditProfile?: () => void;
}) {
  const { user } = useAuth();
  const [travelerOpen, setTravelerOpen] = useState(true);
  const [agencyOpen, setAgencyOpen] = useState(true);
  const [travelOpen, setTravelOpen] = useState(true);

  const [previewDocType, setPreviewDocType] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const percent = overview.travelerDocsTotal === 0 ? 0 : Math.round((overview.travelerDocsApproved / overview.travelerDocsTotal) * 100);
  const previewContent = previewDocType ? buildDocumentContent(previewDocType, overview) : null;

  const openPreview = (docType: string) => {
    setPreviewDocType(docType);
    setPreviewVisible(true);
  };

  const handleDownload = async (docType: string) => {
    const content = buildDocumentContent(docType, overview);
    setDownloading(true);
    try {
      const result = await downloadReceiptPdf(`${overview.id}-${docType}`, content.html);
      if (!result.ok) {
        Alert.alert('Download failed', result.message);
      } else if (result.silent) {
        Alert.alert('Downloaded', `${content.title} was saved to your device automatically.`);
      }
    } catch {
      Alert.alert('Download failed', 'Something went wrong. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={dh.topBar}>
        <TouchableOpacity style={dh.backBtn} onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={dh.topBarTitle}>Document Detail</Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={dh.banner}>
          <Text style={dh.bannerDest}>{overview.destination}</Text>
          <Text style={dh.bannerRef}>{overview.id}</Text>
          <View style={dh.bannerFactsRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <PersonIcon color="#FFFFFF" />
              <Text style={dh.bannerFactText}>{overview.passengerName}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <CalendarIcon color="#FFFFFF" />
              <Text style={dh.bannerFactText}>Departs {formatShort(overview.dateFrom)}</Text>
            </View>
          </View>
        </View>

        <View style={dh.readinessCard}>
          <ReadinessRing percent={percent} />
          <View style={{ flex: 1 }}>
            <Text style={dh.readinessTitle}>Travel Readiness</Text>
            <Text style={dh.readinessSub}>{overview.travelerDocsApproved} of {overview.travelerDocsTotal} Documents approved</Text>
          </View>
        </View>

        <View style={dh.summaryGrid}>
          <View style={dh.summaryCard}>
            <Text style={dh.summaryLabel}>BOOKING STATUS</Text>
            <StatusBadge label={overview.bookingStatus} style={BOOKING_STATUS_STYLE[overview.bookingStatus]} />
          </View>
          <View style={dh.summaryCard}>
            <Text style={dh.summaryLabel}>PAYMENT STATUS</Text>
            <StatusBadge label={overview.paymentStatus} style={PAYMENT_STATUS_STYLE[overview.paymentStatus]} />
          </View>
          <View style={dh.summaryCard}>
            <Text style={dh.summaryLabel}>TRAVELER DOCUMENTS</Text>
            <StatusBadge label={overview.travelerDocsStatus} style={TRAVELER_DOCS_STYLE[overview.travelerDocsStatus]} />
          </View>
          <View style={dh.summaryCard}>
            <Text style={dh.summaryLabel}>AGENCY DOCUMENTS</Text>
            <StatusBadge
              label={overview.agencyDocuments.every((d) => d.status === 'Available') ? 'Available' : 'Waiting for Agency'}
              style={overview.agencyDocuments.every((d) => d.status === 'Available') ? AVAILABLE_STYLE : WAITING_STYLE}
            />
          </View>
        </View>

        <Section
          title={`Traveler Documents (1 Traveler)`}
          open={travelerOpen}
          onToggle={() => setTravelerOpen((v) => !v)}
        >
          <View style={tr.ownerRow}>
            <View style={tr.avatar}><PersonIcon color="#FFFFFF" size={16} /></View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={tr.name}>{overview.passengerName}</Text>
                <View style={tr.ownerTag}><Text style={tr.ownerTagText}>BOOKING OWNER</Text></View>
              </View>
            </View>
          </View>
          {user && <AccountIdentityDocs userId={user.id} onGoToEditProfile={onGoToEditProfile} />}
        </Section>

        <Section
          title="Agency Documents"
          subtitle="Quotation · SOA · Invoice · Receipt"
          open={agencyOpen}
          onToggle={() => setAgencyOpen((v) => !v)}
        >
          {overview.agencyDocuments.map((doc: AgencyDocument) => (
            <DocRow
              key={doc.type}
              icon={DOC_TYPE_ICON[doc.type]}
              title={doc.title}
              description={AGENCY_DOC_DESCRIPTIONS[doc.type] ?? ''}
              status={doc.status}
              dependsOn={doc.dependsOn}
              tint={C.info}
              onPress={() => openPreview(doc.type)}
              onDownload={() => handleDownload(doc.type)}
            />
          ))}
        </Section>

        <Section
          title="Travel Documents"
          subtitle="Voucher · Itinerary · Memo"
          open={travelOpen}
          onToggle={() => setTravelOpen((v) => !v)}
        >
          {overview.travelDocuments.map((doc: TravelDocument) => (
            <DocRow
              key={doc.type}
              icon={DOC_TYPE_ICON[doc.type]}
              title={doc.title}
              description={TRAVEL_DOC_DESCRIPTIONS[doc.type] ?? ''}
              status={doc.status}
              dependsOn={doc.dependsOn}
              tint={C.amber}
              onPress={() => openPreview(doc.type)}
              onDownload={() => handleDownload(doc.type)}
            />
          ))}
        </Section>

        <Copyright />
      </ScrollView>

      <DocumentPreviewModal
        visible={previewVisible}
        content={previewContent}
        onClose={() => setPreviewVisible(false)}
        onDownload={() => previewDocType && handleDownload(previewDocType)}
        downloading={downloading}
      />
    </View>
  );
}
const dh = StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.divider, backgroundColor: C.cardBg,
  },
  backBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontSize: 14.5, fontWeight: '900', color: C.brown },

  banner: {
    backgroundColor: C.brown, borderRadius: 16, padding: 18,
    marginHorizontal: 16, marginTop: 16,
  },
  bannerDest: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  bannerRef: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2, fontWeight: '700' },
  bannerFactsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 12 },
  bannerFactText: { fontSize: 11.5, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },

  readinessCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.cardBg, borderRadius: 14, borderWidth: 1, borderColor: C.divider,
    padding: 14, marginHorizontal: 16, marginTop: 14,
  },
  readinessTitle: { fontSize: 13, fontWeight: '900', color: C.brown },
  readinessSub: { fontSize: 10.5, color: C.brownMid, opacity: 0.75, marginTop: 3 },

  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: '3%', paddingHorizontal: 16, marginTop: 14 },
  summaryCard: {
    width: '48.5%', backgroundColor: C.cardBg, borderRadius: 12, borderWidth: 1, borderColor: C.divider,
    padding: 12, marginBottom: 10, gap: 7,
  },
  summaryLabel: { fontSize: 9, fontWeight: '800', color: C.brownMid, opacity: 0.7, letterSpacing: 0.3 },
});
const tr = StyleSheet.create({
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.amber, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 12.5, fontWeight: '900', color: C.brown },
  ownerTag: { backgroundColor: '#EAF7EC', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  ownerTagText: { fontSize: 8, fontWeight: '800', color: '#12946F' },
});

/* ══════════════════════════ Main ══════════════════════════ */
type Props = {
  /** Booking reference (e.g. "GV-2026-07723") to open straight into Screen 2 for, e.g. when arriving from "View Documents" on a booking. */
  initialBookingId?: string | null;
  /** Called once the initial booking id above has been applied, so the caller can clear it and not re-trigger on a later, unrelated visit to this tab. */
  onConsumedInitialBooking?: () => void;
  /** Sends the user to Account > Edit Profile > Travel Documents, e.g. from the "Add in Account…" link on a missing Passport/Government ID. */
  onGoToEditProfile?: () => void;
};

export default function DocumentsScreen({ initialBookingId, onConsumedInitialBooking, onGoToEditProfile }: Props) {
  const { user } = useAuth();
  const [overview, setOverview] = useState<DocumentsOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(initialBookingId ?? null);
  const [sortBy, setSortBy] = useState<SortKey>('departure');

  useEffect(() => {
    if (initialBookingId) onConsumedInitialBooking?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(() => {
    if (!user) return;
    setLoading(true);
    setError('');
    fetch(`${CLIENT_DOCUMENTS_OVERVIEW_API_URL}&userId=${user.id}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.status !== 'success') throw new Error(result.message || 'Failed to load documents.');
        setOverview(result.data);
      })
      .catch((e) => setError(e.message || 'Failed to load documents.'))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const sorted = useMemo(() => {
    const list = [...overview];
    switch (sortBy) {
      case 'booking':    list.sort((a, b) => a.bookingStatus.localeCompare(b.bookingStatus)); break;
      case 'payment':    list.sort((a, b) => a.paymentStatus.localeCompare(b.paymentStatus)); break;
      case 'documents':  list.sort((a, b) => a.travelerDocsStatus.localeCompare(b.travelerDocsStatus)); break;
      default:           list.sort((a, b) => new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime());
    }
    return list;
  }, [overview, sortBy]);

  const selected = useMemo(() => overview.find((b) => b.id === selectedId) ?? null, [overview, selectedId]);

  if (selected) {
    return (
      <DocumentDetailScreen
        overview={selected}
        onBack={() => setSelectedId(null)}
        onGoToEditProfile={onGoToEditProfile}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ClientPageHero icon="📄" title="Documents" subtitle="Track and manage documents for every booking." />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={C.amber} />
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 }}>
          <Text style={{ fontSize: 12, color: C.danger, textAlign: 'center' }}>{error}</Text>
          <TouchableOpacity onPress={load}><Text style={{ fontSize: 12.5, fontWeight: '800', color: C.amber }}>Tap to retry</Text></TouchableOpacity>
        </View>
      ) : overview.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 }}>
          <Text style={{ fontSize: 15, fontWeight: '900', color: C.brown }}>No bookings yet</Text>
          <Text style={{ fontSize: 12, color: C.brownMid, textAlign: 'center' }}>Once you book a tour, its documents will show up here.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 4, paddingBottom: 30 }}>
          <SortDropdown value={sortBy} onChange={setSortBy} />
          <Text style={{ fontSize: 11, color: C.brownMid, opacity: 0.6, marginHorizontal: 16, marginTop: 10, marginBottom: 4 }}>
            {sorted.length} {sorted.length === 1 ? 'booking' : 'bookings'}
          </Text>
          <View style={{ marginTop: 8 }}>
            {sorted.map((item) => (
              <BookingCard key={item.id} item={item} onPress={() => setSelectedId(item.id)} />
            ))}
          </View>
          <Copyright />
        </ScrollView>
      )}
    </View>
  );
}
