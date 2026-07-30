/**
 * TripRequestsScreen.tsx
 * Admin "Plan a Trip" tab — review custom itinerary requests travelers
 * submit, move them through a quotation workflow (Reviewing → Quoted →
 * Confirmed/Declined), and send a quoted amount + note back to the client.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Platform, ActivityIndicator, Modal } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Copyright from '@/components/Copyright';
import { useAppTheme, ColorPalette } from '../ThemeContext';
import { ADMIN_TRIP_REQUESTS_LIST_API_URL, ADMIN_TRIP_REQUEST_UPDATE_API_URL } from '@/constants/api';

type TripRequestStatus = 'Pending' | 'Reviewing' | 'Quoted' | 'Confirmed' | 'Declined';

type TripRequest = {
  id:              string;
  clientName:      string;
  clientEmail:     string;
  destination:     string;
  dateFrom:        string;
  dateTo:          string;
  travelers:       number;
  status:          TripRequestStatus;
  budgetRange:     string;
  tripPace:        string;
  accommodation:   string;
  interests:       string[];
  specialRequests: string;
  adminNote:       string | null;
  quotedAmount:    number | null;
  createdAt:       string;
};

const STATUS_FILTERS: { value: TripRequestStatus | ''; label: string }[] = [
  { value: '',           label: 'All' },
  { value: 'Pending',    label: 'Pending' },
  { value: 'Reviewing',  label: 'Reviewing' },
  { value: 'Quoted',     label: 'Quoted' },
  { value: 'Confirmed',  label: 'Confirmed' },
  { value: 'Declined',   label: 'Declined' },
];

const STATUS_STYLE: Record<TripRequestStatus, { bg: string; color: string }> = {
  Pending:   { bg: '#FFF5E0', color: '#B8922E' },
  Reviewing: { bg: '#E8F1FC', color: '#2196F3' },
  Quoted:    { bg: '#EDE7F6', color: '#9C27B0' },
  Confirmed: { bg: '#E7F9F3', color: '#12946F' },
  Declined:  { bg: '#FDEAEA', color: '#F44336' },
};

const money = (n: number) => `₱${n.toLocaleString('en-US')}`;

const SearchIcon = ({ color }: { color: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);
const PlaneIcon = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M21 3L3 10.5l7 2.5 2.5 7L21 3z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
  </Svg>
);

export default function TripRequestsScreen() {
  const { C } = useAppTheme();
  const ts = useMemo(() => makeStyles(C), [C]);

  const [requests, setRequests] = useState<TripRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<TripRequestStatus | ''>('');
  const [query, setQuery] = useState('');
  const [reviewModal, setReviewModal] = useState<{ req: TripRequest; status: TripRequestStatus } | null>(null);
  const [note, setNote] = useState('');
  const [quotedAmount, setQuotedAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    fetch(`${ADMIN_TRIP_REQUESTS_LIST_API_URL}&${params.toString()}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.status !== 'success') throw new Error(result.message || 'Failed to load trip requests.');
        setRequests(result.data);
      })
      .catch((e) => setError(e.message || 'Failed to load trip requests.'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = requests.filter((r) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return r.clientName.toLowerCase().includes(q) || r.destination.toLowerCase().includes(q);
  });

  const openReviewModal = (req: TripRequest, status: TripRequestStatus) => {
    setNote(req.adminNote ?? '');
    setQuotedAmount(req.quotedAmount ? String(req.quotedAmount) : '');
    setReviewModal({ req, status });
  };

  const confirmReview = async () => {
    if (!reviewModal) return;
    setBusy(true);
    try {
      const res = await fetch(ADMIN_TRIP_REQUEST_UPDATE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: reviewModal.req.id,
          status: reviewModal.status,
          note: note.trim(),
          quotedAmount: quotedAmount.trim() ? Number(quotedAmount) : null,
        }),
      });
      const result = await res.json();
      if (result.status !== 'success') return;
      setRequests((prev) =>
        prev.map((r) =>
          r.id === reviewModal.req.id
            ? { ...r, status: reviewModal.status, adminNote: note.trim() || null, quotedAmount: quotedAmount.trim() ? Number(quotedAmount) : null }
            : r
        )
      );
      setReviewModal(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 8 }} keyboardShouldPersistTaps="handled">
        <View style={ts.headerRow}>
          <Text style={ts.headerTitle}>Trip Requests</Text>
          <Text style={ts.headerSub}>Review custom itinerary requests and send quotes to travelers.</Text>
        </View>

        <View style={ts.searchRow}>
          <View style={ts.searchBox}>
            <SearchIcon color={C.brownMid} />
            <TextInput
              style={ts.searchInput}
              placeholder="Client or destination"
              placeholderTextColor={C.brownMid + '80'}
              value={query}
              onChangeText={setQuery}
            />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
          {STATUS_FILTERS.map((f) => {
            const active = f.value === statusFilter;
            return (
              <TouchableOpacity key={f.value || 'all'} style={[ts.filterChip, active && ts.filterChipActive]} activeOpacity={0.8} onPress={() => setStatusFilter(f.value)}>
                <Text style={[ts.filterChipText, active && ts.filterChipTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={ts.countRow}>
          <Text style={ts.countText}>{filtered.length} request{filtered.length === 1 ? '' : 's'}</Text>
        </View>

        <View style={ts.list}>
          {loading ? (
            <View style={ts.emptyWrap}><ActivityIndicator color={C.amber} /></View>
          ) : error ? (
            <View style={ts.emptyWrap}>
              <Text style={ts.emptyText}>{error}</Text>
              <TouchableOpacity onPress={load}><Text style={[ts.emptyText, { color: C.amber, fontWeight: '800' }]}>Tap to retry</Text></TouchableOpacity>
            </View>
          ) : filtered.length === 0 ? (
            <View style={ts.emptyWrap}>
              <Text style={ts.emptyText}>No trip requests match this filter.</Text>
            </View>
          ) : (
            filtered.map((req) => {
              const st = STATUS_STYLE[req.status];
              return (
                <View key={req.id} style={ts.card}>
                  <View style={ts.cardTopRow}>
                    <View style={ts.iconBox}><PlaneIcon color={C.amber} /></View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={ts.dest} numberOfLines={1}>{req.destination}</Text>
                      <Text style={ts.metaText} numberOfLines={1}>{req.clientName} · {req.travelers} pax</Text>
                    </View>
                    <View style={[ts.badge, { backgroundColor: st.bg }]}>
                      <Text style={[ts.badgeText, { color: st.color }]}>{req.status}</Text>
                    </View>
                  </View>

                  <View style={ts.tagWrap}>
                    <View style={ts.tag}><Text style={ts.tagText}>{req.tripPace}</Text></View>
                    <View style={ts.tag}><Text style={ts.tagText}>{req.accommodation}</Text></View>
                    <View style={ts.tag}><Text style={ts.tagText}>{req.budgetRange || 'Budget not set'}</Text></View>
                  </View>

                  {req.interests.length > 0 && (
                    <Text style={ts.interests} numberOfLines={1}>Interests: {req.interests.join(', ')}</Text>
                  )}
                  {!!req.specialRequests && (
                    <Text style={ts.specialText} numberOfLines={2}>"{req.specialRequests}"</Text>
                  )}
                  {req.quotedAmount !== null && (
                    <Text style={ts.quoteText}>Quoted: {money(req.quotedAmount)}</Text>
                  )}
                  {!!req.adminNote && (
                    <Text style={ts.noteText} numberOfLines={2}>Note: {req.adminNote}</Text>
                  )}

                  <View style={ts.actionsRow}>
                    <TouchableOpacity style={[ts.actionBtn, { backgroundColor: '#E8F1FC' }]} activeOpacity={0.8} onPress={() => openReviewModal(req, 'Reviewing')}>
                      <Text style={[ts.actionBtnText, { color: '#2196F3' }]}>Reviewing</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[ts.actionBtn, { backgroundColor: '#EDE7F6' }]} activeOpacity={0.8} onPress={() => openReviewModal(req, 'Quoted')}>
                      <Text style={[ts.actionBtnText, { color: '#9C27B0' }]}>Send Quote</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[ts.actionBtn, { backgroundColor: '#E7F9F3' }]} activeOpacity={0.8} onPress={() => openReviewModal(req, 'Confirmed')}>
                      <Text style={[ts.actionBtnText, { color: '#12946F' }]}>Confirm</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[ts.actionBtn, { backgroundColor: '#FDEAEA' }]} activeOpacity={0.8} onPress={() => openReviewModal(req, 'Declined')}>
                      <Text style={[ts.actionBtnText, { color: '#F44336' }]}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <Copyright />
      </ScrollView>

      <Modal visible={!!reviewModal} transparent animationType="fade" onRequestClose={() => setReviewModal(null)}>
        <View style={ts.modalOverlay}>
          <View style={ts.modalCard}>
            <Text style={ts.modalTitle}>Mark as "{reviewModal?.status}"</Text>
            <Text style={ts.modalSub}>{reviewModal?.req.clientName} — {reviewModal?.req.destination}</Text>

            {reviewModal?.status === 'Quoted' && (
              <>
                <Text style={ts.modalFieldLabel}>Quoted Amount (₱)</Text>
                <TextInput
                  style={ts.modalInput}
                  placeholder="e.g. 28000"
                  placeholderTextColor={C.brownMid + '80'}
                  value={quotedAmount}
                  onChangeText={setQuotedAmount}
                  keyboardType="numeric"
                />
              </>
            )}

            <Text style={ts.modalFieldLabel}>Note to Traveler</Text>
            <TextInput
              style={[ts.modalInput, { minHeight: 70, textAlignVertical: 'top' }]}
              placeholder="Add a message the traveler will see..."
              placeholderTextColor={C.brownMid + '80'}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity style={ts.modalCancelBtn} activeOpacity={0.8} onPress={() => setReviewModal(null)} disabled={busy}>
                <Text style={ts.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[ts.modalConfirmBtn, busy && { opacity: 0.7 }]} activeOpacity={0.85} onPress={confirmReview} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={ts.modalConfirmText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (C: ColorPalette) => StyleSheet.create({
  headerRow: { paddingHorizontal: 16, paddingTop: 16 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: C.brown },
  headerSub: { fontSize: 11.5, color: C.brownMid, opacity: 0.75, marginTop: 4 },

  searchRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 14 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.cardBg, borderRadius: 12, paddingHorizontal: 14, height: 42,
    borderWidth: 1, borderColor: C.divider,
  },
  searchInput: { flex: 1, fontSize: 12.5, color: C.brown },

  filterChip: { borderWidth: 1, borderColor: C.divider, backgroundColor: C.cardBg, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 8 },
  filterChipActive: { backgroundColor: C.amber, borderColor: C.amber },
  filterChipText: { fontSize: 11.5, fontWeight: '700', color: C.brown },
  filterChipTextActive: { color: C.white },

  countRow: { paddingHorizontal: 16, marginTop: 14, marginBottom: 8 },
  countText: { fontSize: 12.5, fontWeight: '800', color: C.brownMid, opacity: 0.75, letterSpacing: 0.3 },

  list: { paddingHorizontal: 16, gap: 10 },
  card: {
    backgroundColor: C.cardBg, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: C.divider,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1 },
    }),
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.lightBg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  dest: { fontSize: 13, fontWeight: '900', color: C.brown },
  metaText: { fontSize: 10.5, color: C.brownMid, opacity: 0.8, marginTop: 2 },
  badge: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4, flexShrink: 0 },
  badgeText: { fontSize: 9.5, fontWeight: '800' },

  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: { backgroundColor: C.lightBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 10, fontWeight: '700', color: C.brown },

  interests: { fontSize: 10.5, color: C.brownMid, opacity: 0.8, marginTop: 8 },
  specialText: { fontSize: 10.5, color: C.brownMid, marginTop: 6, fontStyle: 'italic' },
  quoteText: { fontSize: 11.5, color: '#9C27B0', fontWeight: '800', marginTop: 8 },
  noteText: { fontSize: 10.5, color: C.brownMid, marginTop: 4 },

  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  actionBtn: { borderRadius: 16, paddingHorizontal: 11, paddingVertical: 7 },
  actionBtnText: { fontSize: 10.5, fontWeight: '800' },

  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50, gap: 8 },
  emptyText: { fontSize: 12.5, color: C.brownMid, opacity: 0.7, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(59,26,12,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: {
    width: '100%', maxWidth: 380, backgroundColor: C.cardBg, borderRadius: 18, padding: 20,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 8 },
    }),
  },
  modalTitle: { fontSize: 15.5, fontWeight: '900', color: C.brown },
  modalSub: { fontSize: 12, color: C.brownMid, marginTop: 4 },
  modalFieldLabel: { fontSize: 10.5, fontWeight: '800', color: C.brownMid, opacity: 0.75, marginBottom: 6, marginTop: 14 },
  modalInput: {
    backgroundColor: C.lightBg, borderRadius: 12, borderWidth: 1, borderColor: C.divider,
    paddingHorizontal: 13, paddingVertical: 11, fontSize: 13, color: C.brown,
  },
  modalCancelBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: C.divider, backgroundColor: C.lightBg },
  modalCancelText: { fontSize: 12.5, fontWeight: '800', color: C.brownMid },
  modalConfirmBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 12, backgroundColor: C.amber },
  modalConfirmText: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' },
});
