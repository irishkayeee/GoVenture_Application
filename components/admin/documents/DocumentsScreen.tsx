/**
 * DocumentsScreen.tsx
 * Admin Documents tab — review documents travelers submit for their
 * bookings: approve, reject (with a note), or request a re-upload.
 * Backed by booking_documents via admin_documents_list/admin_document_review.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Platform, ActivityIndicator, Modal, Linking } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Copyright from '@/components/Copyright';
import { useAppTheme, ColorPalette } from '../ThemeContext';
import { useAuth } from '@/components/auth/AuthContext';
import { ADMIN_DOCUMENTS_LIST_API_URL, ADMIN_DOCUMENT_REVIEW_API_URL } from '@/constants/api';

type DocStatus = 'Pending Upload' | 'Submitted' | 'Approved' | 'Rejected' | 'Reupload Requested';

type AdminDocument = {
  id:            string;
  docType:       string;
  docTitle:      string;
  status:        DocStatus;
  fileUrl:       string | null;
  adminComment:  string | null;
  uploadedAt:    string;
  reviewedAt:    string | null;
  bookingId:     string;
  clientName:    string;
  destination:   string;
};

const STATUS_FILTERS: { value: DocStatus | ''; label: string }[] = [
  { value: '',                   label: 'All' },
  { value: 'Submitted',          label: 'Needs Review' },
  { value: 'Approved',           label: 'Approved' },
  { value: 'Rejected',           label: 'Rejected' },
  { value: 'Reupload Requested', label: 'Reupload Requested' },
];

const STATUS_STYLE: Record<DocStatus, { bg: string; color: string }> = {
  'Pending Upload':     { bg: '#F1F1F1', color: '#6B3318' },
  'Submitted':          { bg: '#FFF5E0', color: '#B8922E' },
  'Approved':           { bg: '#E7F9F3', color: '#12946F' },
  'Rejected':           { bg: '#FDEAEA', color: '#F44336' },
  'Reupload Requested': { bg: '#FCE4E1', color: '#E5473A' },
};

const SearchIcon = ({ color }: { color: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);
const DocIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M7 3h7l4 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    <Path d="M14 3v4h4" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
  </Svg>
);
const CheckIcon = ({ color }: { color: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none"><Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" /></Svg>
);
const CloseIcon = ({ color }: { color: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none"><Path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth={2.4} strokeLinecap="round" /></Svg>
);
const RefreshIcon = ({ color }: { color: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none"><Path d="M4 4v5h5M20 20v-5h-5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /><Path d="M5.5 15a7 7 0 0012.6 2M18.5 9A7 7 0 005.9 7" stroke={color} strokeWidth={2} strokeLinecap="round" /></Svg>
);

type ReviewAction = 'approve' | 'reject' | 'request_reupload';

export default function DocumentsScreen() {
  const { C } = useAppTheme();
  const ds = useMemo(() => makeStyles(C), [C]);
  const { user } = useAuth();

  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocStatus | ''>('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [commentModal, setCommentModal] = useState<{ doc: AdminDocument; action: ReviewAction } | null>(null);
  const [comment, setComment] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (query.trim()) params.set('search', query.trim());
    fetch(`${ADMIN_DOCUMENTS_LIST_API_URL}&${params.toString()}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.status !== 'success') throw new Error(result.message || 'Failed to load documents.');
        setDocuments(result.data);
      })
      .catch((e) => setError(e.message || 'Failed to load documents.'))
      .finally(() => setLoading(false));
  }, [statusFilter, query]);

  useEffect(() => { load(); }, [load]);

  const submitReview = async (doc: AdminDocument, action: ReviewAction, note: string) => {
    if (!user) return;
    setBusyId(doc.id);
    try {
      const res = await fetch(ADMIN_DOCUMENT_REVIEW_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: user.id, documentId: doc.id, action, comment: note }),
      });
      const result = await res.json();
      if (result.status !== 'success') return;
      setDocuments((prev) => prev.map((d) => (d.id === doc.id ? { ...d, status: result.data.status, adminComment: note || null } : d)));
    } finally {
      setBusyId(null);
    }
  };

  const handleApprove = (doc: AdminDocument) => submitReview(doc, 'approve', '');
  const openCommentModal = (doc: AdminDocument, action: ReviewAction) => {
    setComment('');
    setCommentModal({ doc, action });
  };
  const confirmCommentModal = () => {
    if (!commentModal) return;
    submitReview(commentModal.doc, commentModal.action, comment.trim());
    setCommentModal(null);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 8 }} keyboardShouldPersistTaps="handled">
        <View style={ds.headerRow}>
          <Text style={ds.headerTitle}>Documents</Text>
          <Text style={ds.headerSub}>Review documents travelers submit for their bookings.</Text>
        </View>

        <View style={ds.searchRow}>
          <View style={ds.searchBox}>
            <SearchIcon color={C.brownMid} />
            <TextInput
              style={ds.searchInput}
              placeholder="Client, booking reference, or destination"
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
              <TouchableOpacity key={f.value || 'all'} style={[ds.filterChip, active && ds.filterChipActive]} activeOpacity={0.8} onPress={() => setStatusFilter(f.value)}>
                <Text style={[ds.filterChipText, active && ds.filterChipTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={ds.countRow}>
          <Text style={ds.countText}>{documents.length} document{documents.length === 1 ? '' : 's'}</Text>
        </View>

        <View style={ds.list}>
          {loading ? (
            <View style={ds.emptyWrap}><ActivityIndicator color={C.amber} /></View>
          ) : error ? (
            <View style={ds.emptyWrap}>
              <Text style={ds.emptyText}>{error}</Text>
              <TouchableOpacity onPress={load}><Text style={[ds.emptyText, { color: C.amber, fontWeight: '800' }]}>Tap to retry</Text></TouchableOpacity>
            </View>
          ) : documents.length === 0 ? (
            <View style={ds.emptyWrap}>
              <Text style={ds.emptyText}>No documents match this filter.</Text>
            </View>
          ) : (
            documents.map((doc) => {
              const st = STATUS_STYLE[doc.status];
              const needsReview = doc.status === 'Submitted';
              const busy = busyId === doc.id;
              return (
                <View key={doc.id} style={ds.card}>
                  <View style={ds.cardTopRow}>
                    <View style={ds.iconBox}><DocIcon color={C.brownMid} /></View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={ds.docTitle} numberOfLines={1}>{doc.docTitle}</Text>
                      <Text style={ds.metaText} numberOfLines={1}>{doc.clientName} · {doc.destination} · {doc.bookingId}</Text>
                    </View>
                    <View style={[ds.badge, { backgroundColor: st.bg }]}>
                      <Text style={[ds.badgeText, { color: st.color }]}>{doc.status}</Text>
                    </View>
                  </View>

                  {!!doc.adminComment && (
                    <Text style={ds.commentText} numberOfLines={2}>Note: {doc.adminComment}</Text>
                  )}

                  <View style={ds.cardBottomRow}>
                    {doc.fileUrl && (
                      <TouchableOpacity onPress={() => Linking.openURL(doc.fileUrl!)} activeOpacity={0.75}>
                        <Text style={ds.viewFileText}>View File</Text>
                      </TouchableOpacity>
                    )}
                    <View style={{ flex: 1 }} />
                    {busy ? (
                      <ActivityIndicator color={C.amber} size="small" />
                    ) : needsReview ? (
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity style={[ds.actionBtn, { backgroundColor: '#E7F9F3' }]} activeOpacity={0.8} onPress={() => handleApprove(doc)}>
                          <CheckIcon color="#12946F" />
                          <Text style={[ds.actionBtnText, { color: '#12946F' }]}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[ds.actionBtn, { backgroundColor: '#FCE4E1' }]} activeOpacity={0.8} onPress={() => openCommentModal(doc, 'request_reupload')}>
                          <RefreshIcon color="#E5473A" />
                          <Text style={[ds.actionBtnText, { color: '#E5473A' }]}>Re-upload</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[ds.actionBtn, { backgroundColor: '#FDEAEA' }]} activeOpacity={0.8} onPress={() => openCommentModal(doc, 'reject')}>
                          <CloseIcon color="#F44336" />
                          <Text style={[ds.actionBtnText, { color: '#F44336' }]}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </View>

        <Copyright />
      </ScrollView>

      <Modal visible={!!commentModal} transparent animationType="fade" onRequestClose={() => setCommentModal(null)}>
        <View style={ds.modalOverlay}>
          <View style={ds.modalCard}>
            <Text style={ds.modalTitle}>{commentModal?.action === 'reject' ? 'Reject Document' : 'Request Re-upload'}</Text>
            <Text style={ds.modalSub}>Let the traveler know what needs fixing.</Text>
            <TextInput
              style={ds.modalInput}
              placeholder="e.g. Photo is blurry, please retake."
              placeholderTextColor={C.brownMid + '80'}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={3}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity style={ds.modalCancelBtn} activeOpacity={0.8} onPress={() => setCommentModal(null)}>
                <Text style={ds.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={ds.modalConfirmBtn} activeOpacity={0.85} onPress={confirmCommentModal}>
                <Text style={ds.modalConfirmText}>Send</Text>
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
  docTitle: { fontSize: 13, fontWeight: '900', color: C.brown },
  metaText: { fontSize: 10.5, color: C.brownMid, opacity: 0.8, marginTop: 2 },
  badge: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4, flexShrink: 0 },
  badgeText: { fontSize: 9.5, fontWeight: '800' },

  commentText: { fontSize: 11, color: C.brownMid, marginTop: 8, fontStyle: 'italic' },

  cardBottomRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 },
  viewFileText: { fontSize: 11.5, fontWeight: '800', color: C.amber },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 7 },
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
  modalSub: { fontSize: 12, color: C.brownMid, marginTop: 6 },
  modalInput: {
    marginTop: 14, backgroundColor: C.lightBg, borderRadius: 12, borderWidth: 1, borderColor: C.divider,
    paddingHorizontal: 13, paddingVertical: 11, fontSize: 13, color: C.brown, textAlignVertical: 'top', minHeight: 80,
  },
  modalCancelBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: C.divider, backgroundColor: C.lightBg },
  modalCancelText: { fontSize: 12.5, fontWeight: '800', color: C.brownMid },
  modalConfirmBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 12, backgroundColor: C.amber },
  modalConfirmText: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' },
});
