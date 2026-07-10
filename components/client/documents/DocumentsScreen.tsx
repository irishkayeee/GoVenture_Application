/**
 * DocumentsScreen.tsx
 * Client Documents tab — pick a booking, see its required-document
 * checklist and overall progress, and simulate uploading each file (no
 * document backend yet, so uploads just toggle a "Submitted" state).
 */

import React, { useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Platform, useWindowDimensions,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import Copyright from '@/components/Copyright';
import { C } from '../theme';
import ClientPageHero from '../ClientPageHero';
import { useBookings } from '../bookings/BookingsContext';
import { RequiredDocument, buildDocumentChecklist } from './mockData';

const WIDE_BREAKPOINT = 900;

/* ── Icons ── */
const DocIcon = ({ color = C.brown }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M7 3h7l4 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    <Path d="M14 3v4h4" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
  </Svg>
);
const ChevronIcon = ({ open }: { open: boolean }) => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
    <Path d="M6 9l6 6 6-6" stroke={C.brown} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const CheckIcon = () => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
    <Path d="M4 12l6 6L20 6" stroke={C.success} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

function ProgressRing({ percent }: { percent: number }) {
  const size = 72, stroke = 7, r = (size - stroke) / 2, c = 2 * Math.PI * r;
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
      <View style={pr.center}>
        <Text style={pr.centerText}>{percent}%</Text>
      </View>
    </View>
  );
}

function DocumentCard({ doc, onToggleUpload, width }: { doc: RequiredDocument; onToggleUpload: () => void; width: any }) {
  const [expanded, setExpanded] = useState(false);
  const submitted = doc.status !== 'Pending Upload';

  return (
    <View style={[dc.card, { width }]}>
      <View style={dc.topRow}>
        <View style={dc.iconBox}><DocIcon /></View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            {!submitted && <View style={dc.dot} />}
            <Text style={dc.title}>{doc.title}</Text>
          </View>
        </View>
        <View style={[dc.statusPill, submitted && dc.statusPillDone]}>
          <Text style={[dc.statusPillText, submitted && dc.statusPillTextDone]}>{doc.status}</Text>
        </View>
      </View>

      <Text style={dc.desc}>{doc.description}</Text>

      <TouchableOpacity style={dc.instructionsRow} activeOpacity={0.75} onPress={() => setExpanded((v) => !v)}>
        <DocIcon color={C.amber} />
        <Text style={dc.instructionsLabel}>Upload Instructions</Text>
        <View style={{ flex: 1 }} />
        <ChevronIcon open={expanded} />
      </TouchableOpacity>
      {expanded && <Text style={dc.instructionsText}>{doc.instructions}</Text>}

      <View style={dc.footerRow}>
        <Text style={dc.fileText} numberOfLines={1}>
          {doc.fileName ? (submitted ? `✓ ${doc.fileName}` : doc.fileName) : 'No file uploaded yet'}
        </Text>
        <TouchableOpacity style={[dc.uploadBtn, submitted && dc.uploadBtnDone]} activeOpacity={0.85} onPress={onToggleUpload}>
          {submitted ? <CheckIcon /> : null}
          <Text style={[dc.uploadBtnText, submitted && dc.uploadBtnTextDone]}>{submitted ? 'Uploaded' : '+ Upload'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function DocumentsScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;
  const { bookings } = useBookings();
  const scrollRef = useRef<ScrollView>(null);
  const checklistY = useRef(0);

  const [selectedId, setSelectedId] = useState<string | null>(bookings[0]?.id ?? null);
  const [byBooking, setByBooking] = useState<Record<string, RequiredDocument[]>>({});

  const selectedBooking = bookings.find((b) => b.id === selectedId) ?? bookings[0] ?? null;

  const documents = useMemo(() => {
    if (!selectedBooking) return [];
    return byBooking[selectedBooking.id] ?? buildDocumentChecklist();
  }, [selectedBooking, byBooking]);

  const toggleUpload = (docId: string) => {
    if (!selectedBooking) return;
    setByBooking((prev) => {
      const current = prev[selectedBooking.id] ?? buildDocumentChecklist();
      const next = current.map((d) =>
        d.id === docId
          ? d.status === 'Pending Upload'
            ? { ...d, status: 'Submitted' as const, fileName: `${d.id}.jpg` }
            : { ...d, status: 'Pending Upload' as const, fileName: null }
          : d
      );
      return { ...prev, [selectedBooking.id]: next };
    });
  };

  const required = documents.length;
  const submittedCount = documents.filter((d) => d.status === 'Submitted').length;
  const approvedCount = documents.filter((d) => d.status === 'Approved').length;
  const percent = required === 0 ? 0 : Math.round(((submittedCount + approvedCount) / required) * 100);

  const columns = isWide ? 3 : (width >= 620 ? 2 : 1);
  const cardWidth = columns === 1 ? '100%' : columns === 2 ? '48.5%' : '32%';

  if (bookings.length === 0 || !selectedBooking) {
    return (
      <View style={{ flex: 1 }}>
        <ClientPageHero icon="📄" title="Documents" subtitle="Upload the documents required for your bookings." />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 }}>
          <Text style={{ fontSize: 40 }}>📄</Text>
          <Text style={{ fontSize: 15, fontWeight: '900', color: C.brown }}>No bookings yet</Text>
          <Text style={{ fontSize: 12, color: C.brownMid, textAlign: 'center' }}>
            Once you book a tour, its required documents will show up here.
          </Text>
        </View>
        <Copyright />
      </View>
    );
  }

  return (
    <ScrollView ref={scrollRef} style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      <ClientPageHero icon="📄" title="Documents" subtitle="Upload the documents required for your bookings." />

      <View style={pl.wrap}>
        {bookings.map((b) => {
          const active = b.id === selectedBooking.id;
          return (
            <TouchableOpacity key={b.id} style={[pl.pill, active && pl.pillActive]} activeOpacity={0.8} onPress={() => setSelectedId(b.id)}>
              <Text style={[pl.pillText, active && pl.pillTextActive]}>{b.destination} · {b.id}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={pg.card}>
        <ProgressRing percent={percent} />
        <View style={{ flex: 1, minWidth: 160 }}>
          <Text style={pg.title}>Documents Progress</Text>
          <View style={pg.barTrack}>
            <View style={[pg.barFill, { width: `${percent}%` }]} />
          </View>
          <View style={pg.statsRow}>
            <View style={pg.statPill}><Text style={pg.statPillText}>📁 {required} Required</Text></View>
            <View style={[pg.statPill, pg.statPillBlue]}><Text style={pg.statPillText}>📤 {submittedCount} Submitted</Text></View>
            <View style={[pg.statPill, pg.statPillGreen]}><Text style={pg.statPillText}>✓ {approvedCount} Approved</Text></View>
          </View>
        </View>
        <TouchableOpacity
          style={pg.uploadBtn}
          activeOpacity={0.85}
          onPress={() => scrollRef.current?.scrollTo({ y: checklistY.current, animated: true })}
        >
          <Text style={pg.uploadBtnText}>+ Upload Document</Text>
        </TouchableOpacity>
      </View>

      <View
        style={{ paddingHorizontal: 16, marginTop: 18, marginBottom: 10 }}
        onLayout={(e) => { checklistY.current = e.nativeEvent.layout.y; }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={sec.title}>Required Documents</Text>
          <View style={sec.countBadge}><Text style={sec.countBadgeText}>{required}</Text></View>
        </View>
        <Text style={sec.sub}>Documents you need to provide</Text>
      </View>

      <View style={{ paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: '2%', rowGap: 14 }}>
        {documents.map((doc) => (
          <DocumentCard key={doc.id} doc={doc} width={cardWidth} onToggleUpload={() => toggleUpload(doc.id)} />
        ))}
      </View>

      <Copyright />
    </ScrollView>
  );
}

/* ── Styles ── */
const pl = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginTop: 14 },
  pill: { borderWidth: 1, borderColor: C.divider, backgroundColor: C.cardBg, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9 },
  pillActive: { backgroundColor: C.brown, borderColor: C.brown },
  pillText: { fontSize: 11.5, fontWeight: '700', color: C.brown },
  pillTextActive: { color: '#FFFFFF' },
});

const pr = StyleSheet.create({
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  centerText: { fontSize: 14, fontWeight: '900', color: C.brown },
});

const pg = StyleSheet.create({
  card: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16,
    backgroundColor: C.cardBg, borderRadius: 16, borderWidth: 1, borderColor: C.divider,
    padding: 16, marginHorizontal: 16, marginTop: 16,
  },
  title: { fontSize: 15, fontWeight: '900', color: C.brown },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: C.divider, marginTop: 10, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: C.amber },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  statPill: { backgroundColor: C.lightBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  statPillBlue: { backgroundColor: '#E8F1FC' },
  statPillGreen: { backgroundColor: '#EAF7EC' },
  uploadBtn: { backgroundColor: C.danger, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, alignSelf: 'flex-start' },
  uploadBtnText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  statPillText: { fontSize: 10.5, fontWeight: '700', color: C.brown },
});

const sec = StyleSheet.create({
  title: { fontSize: 15.5, fontWeight: '900', color: C.brown },
  countBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.lightBg, borderWidth: 1, borderColor: C.amber, alignItems: 'center', justifyContent: 'center' },
  countBadgeText: { fontSize: 10.5, fontWeight: '900', color: C.amber },
  sub: { fontSize: 11.5, color: C.brownMid, opacity: 0.75, marginTop: 2 },
});

const dc = StyleSheet.create({
  card: { backgroundColor: C.cardBg, borderRadius: 14, borderWidth: 1, borderColor: C.divider, padding: 14 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.lightBg, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.danger },
  title: { fontSize: 12.5, fontWeight: '900', color: C.brown, flexShrink: 1 },

  statusPill: { backgroundColor: C.lightBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusPillDone: { backgroundColor: '#EAF7EC' },
  statusPillText: { fontSize: 9.5, fontWeight: '800', color: C.brownMid },
  statusPillTextDone: { color: C.success },

  desc: { fontSize: 11, color: C.brownMid, marginTop: 10, lineHeight: 15 },

  instructionsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, borderTopColor: C.divider, marginTop: 12, paddingTop: 10 },
  instructionsLabel: { fontSize: 11, fontWeight: '800', color: C.brown },
  instructionsText: { fontSize: 10.5, color: C.brownMid, lineHeight: 15, marginTop: 6 },

  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 12 },
  fileText: { fontSize: 10, color: C.brownMid, opacity: 0.75, flexShrink: 1 },
  uploadBtn: { backgroundColor: C.danger, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, flexShrink: 0 },
  uploadBtnDone: { backgroundColor: '#EAF7EC', flexDirection: 'row', alignItems: 'center', gap: 4 },
  uploadBtnText: { fontSize: 10.5, fontWeight: '800', color: '#FFFFFF' },
  uploadBtnTextDone: { color: C.success },
});
