/**
 * StatDetailModal.tsx
 * Generic modal used by all four dashboard stat cards (Upcoming Tours,
 * Total Bookings, Places Visited, Pending Payment) — header with icon +
 * title + subtitle, a search bar, a record-count/total summary, a
 * sortable table, and a footer link. Each caller just supplies its own
 * rows/columns; the search/sort/summary behavior is shared.
 */

import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, StyleSheet, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { C } from '../theme';

const CloseIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M6 6l12 12M18 6L6 18" stroke={C.brownMid} strokeWidth={2.2} strokeLinecap="round" />
  </Svg>
);
const SearchIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35" stroke={C.brownMid} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);
const SortIcon = ({ direction }: { direction: 'asc' | 'desc' | null }) => (
  <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
    {direction !== 'desc' && <Path d="M6 10l6-6 6 6" stroke={direction === 'asc' ? C.amber : C.brownMid} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" opacity={direction === 'asc' ? 1 : 0.4} />}
    {direction !== 'asc' && <Path d="M6 14l6 6 6-6" stroke={direction === 'desc' ? C.amber : C.brownMid} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" opacity={direction === 'desc' ? 1 : 0.4} />}
  </Svg>
);

export type StatColumn<T> = {
  key:        string;
  label:      string;
  flex?:      number;
  accessor:   (row: T) => string;
  sortValue:  (row: T) => number | string;
};

type Props<T> = {
  visible:       boolean;
  onClose:       () => void;
  icon:          React.ReactNode;
  title:         string;
  subtitle:      string;
  rows:          T[];
  columns:       StatColumn<T>[];
  keyAccessor:   (row: T) => string;
  searchAccessor:(row: T) => string;
  summaryAmount?:(filtered: T[]) => string | null;
  emptyText:     string;
  footerLabel:   string;
  onFooterPress: () => void;
  defaultSortKey?: string;
  defaultSortDir?: 'asc' | 'desc';
};

export default function StatDetailModal<T>({
  visible, onClose, icon, title, subtitle, rows, columns, keyAccessor, searchAccessor,
  summaryAmount, emptyText, footerLabel, onFooterPress, defaultSortKey, defaultSortDir = 'asc',
}: Props<T>) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<string>(defaultSortKey ?? columns[0]?.key ?? '');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultSortDir);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = q ? rows.filter((r) => searchAccessor(r).toLowerCase().includes(q)) : rows;
    const col = columns.find((c) => c.key === sortKey);
    if (col) {
      list = [...list].sort((a, b) => {
        const av = col.sortValue(a);
        const bv = col.sortValue(b);
        const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return list;
  }, [rows, query, sortKey, sortDir, columns, searchAccessor]);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleClose = () => { setQuery(''); onClose(); };
  const amountText = summaryAmount ? summaryAmount(filtered) : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={s.overlay}>
        <View style={s.card}>
          <View style={s.header}>
            <View style={s.headerIconWrap}>{icon}</View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.title}>{title}</Text>
              <Text style={s.subtitle}>{subtitle}</Text>
            </View>
            <TouchableOpacity style={s.closeBtn} activeOpacity={0.8} onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <CloseIcon />
            </TouchableOpacity>
          </View>

          <View style={s.searchRow}>
            <SearchIcon />
            <TextInput
              style={s.searchInput}
              placeholder="Search by reference or destination"
              placeholderTextColor={C.brownMid + '80'}
              value={query}
              onChangeText={setQuery}
            />
          </View>

          <View style={s.summaryRow}>
            <Text style={s.summaryText}>
              {filtered.length} of {rows.length} record{rows.length === 1 ? '' : 's'}
              {amountText ? ` · ${amountText}` : ''}
            </Text>
          </View>

          <ScrollView style={s.tableScroll} contentContainerStyle={{ flexGrow: 1 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ minWidth: '100%' }}>
                <View style={s.headRow}>
                  {columns.map((col) => (
                    <TouchableOpacity
                      key={col.key}
                      style={[s.headCell, { flex: col.flex ?? 1 }]}
                      activeOpacity={0.7}
                      onPress={() => toggleSort(col.key)}
                    >
                      <Text style={s.headCellText} numberOfLines={1}>{col.label}</Text>
                      <SortIcon direction={sortKey === col.key ? sortDir : null} />
                    </TouchableOpacity>
                  ))}
                </View>

                {filtered.length === 0 ? (
                  <View style={s.emptyWrap}><Text style={s.emptyText}>{emptyText}</Text></View>
                ) : (
                  filtered.map((row, i) => (
                    <View key={keyAccessor(row)} style={[s.bodyRow, i === filtered.length - 1 && { borderBottomWidth: 0 }]}>
                      {columns.map((col) => (
                        <Text key={col.key} style={[s.bodyCellText, { flex: col.flex ?? 1 }]} numberOfLines={1}>
                          {col.accessor(row)}
                        </Text>
                      ))}
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          </ScrollView>

          <TouchableOpacity style={s.footerLink} activeOpacity={0.8} onPress={() => { handleClose(); onFooterPress(); }}>
            <Text style={s.footerLinkText}>{footerLabel} →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(59,26,12,0.5)', alignItems: 'center', justifyContent: 'center', padding: 18 },
  card: {
    width: '100%', maxWidth: 480, maxHeight: '82%', backgroundColor: C.cardBg, borderRadius: 18, padding: 18,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 10 },
    }),
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  headerIconWrap: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.lightBg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title: { fontSize: 15.5, fontWeight: '900', color: C.brown },
  subtitle: { fontSize: 11, color: C.brownMid, opacity: 0.75, marginTop: 2, lineHeight: 15 },
  closeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.lightBg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.lightBg, borderRadius: 10, borderWidth: 1, borderColor: C.divider,
    paddingHorizontal: 12, paddingVertical: 9, marginTop: 14,
  },
  searchInput: { flex: 1, fontSize: 12.5, color: C.brown, padding: 0 },

  summaryRow: { marginTop: 10 },
  summaryText: { fontSize: 11, fontWeight: '800', color: C.brownMid, opacity: 0.75 },

  tableScroll: { marginTop: 10, maxHeight: 320 },
  headRow: {
    flexDirection: 'row', gap: 6, borderBottomWidth: 1.5, borderBottomColor: C.divider, paddingBottom: 8, minWidth: 320,
  },
  headCell: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 80 },
  headCellText: { fontSize: 9.5, fontWeight: '800', color: C.brownMid, opacity: 0.75, letterSpacing: 0.4 },

  bodyRow: {
    flexDirection: 'row', gap: 6, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.divider, minWidth: 320,
  },
  bodyCellText: { fontSize: 12, color: C.brown, minWidth: 80 },

  emptyWrap: { paddingVertical: 30, alignItems: 'center' },
  emptyText: { fontSize: 11.5, color: C.brownMid, opacity: 0.65 },

  footerLink: { marginTop: 14, alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.divider },
  footerLinkText: { fontSize: 12.5, fontWeight: '800', color: C.amber },
});
