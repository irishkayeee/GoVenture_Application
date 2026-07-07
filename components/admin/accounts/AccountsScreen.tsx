/**
 * AccountsScreen.tsx
 * Accounts tab — stat summary grid, role filter chips, search, and a
 * scrollable list of accounts. Tapping "+ Add Staff" opens AddStaffModal;
 * tapping an account row opens AccountDetailModal.
 */

import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import Copyright from '@/components/Copyright';
import { useAppTheme, ColorPalette } from '../ThemeContext';
import { ACCOUNTS, Account, AccountRole, AVATAR_COLORS } from './mockData';
import AddStaffModal from './AddStaffModal';
import AccountDetailModal from './AccountDetailModal';

const ROLE_FILTERS: { value: AccountRole | ''; label: string }[] = [
  { value: '',       label: 'All' },
  { value: 'Admin',  label: 'Admin' },
  { value: 'Staff',  label: 'Staff' },
  { value: 'Client', label: 'Client' },
];

/* ── Icons ── */
const SearchIcon = ({ color }: { color: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);
const PlusIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5v14M5 12h14" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" />
  </Svg>
);
const ChevronRightIcon = ({ color }: { color: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M9 5l7 7-7 7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const AccountRow = ({ account, index, onPress }: { account: Account; index: number; onPress: () => void }) => {
  const { C } = useAppTheme();
  const as = useMemo(() => makeStyles(C), [C]);
  const ROLE_STYLE: Record<AccountRole, { bg: string; color: string }> = {
    Admin:  { bg: '#F3EAFB', color: C.purple },
    Staff:  { bg: '#EAF1FB', color: C.info },
    Client: { bg: '#E7F9F3', color: '#12946F' },
  };
  const roleStyle = ROLE_STYLE[account.role];
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <TouchableOpacity style={as.row} activeOpacity={0.8} onPress={onPress}>
      <View style={[as.avatar, { backgroundColor: avatarColor }]}>
        <Text style={as.avatarText}>{account.initials}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={as.rowName} numberOfLines={1}>{account.name}</Text>
        <Text style={as.rowEmail} numberOfLines={1}>{account.email}</Text>
      </View>
      <View style={[as.roleBadge, { backgroundColor: roleStyle.bg }]}>
        <Text style={[as.roleBadgeText, { color: roleStyle.color }]}>{account.role}</Text>
      </View>
      <ChevronRightIcon color={C.brownMid} />
    </TouchableOpacity>
  );
};

export default function AccountsScreen() {
  const { C } = useAppTheme();
  const as = useMemo(() => makeStyles(C), [C]);
  const [accounts, setAccounts] = useState<Account[]>(ACCOUNTS);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<AccountRole | ''>('');
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const stats = useMemo(() => ({
    total:  accounts.length,
    admin:  accounts.filter((a) => a.role === 'Admin').length,
    staff:  accounts.filter((a) => a.role === 'Staff').length,
    client: accounts.filter((a) => a.role === 'Client').length,
  }), [accounts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return accounts.filter((a) => {
      const matchesQuery = !q || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || a.role.toLowerCase().includes(q);
      const matchesRole = !roleFilter || a.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [accounts, query, roleFilter]);

  const handleCreate = (account: Account) => setAccounts((prev) => [account, ...prev]);
  const handleSaveDetail = (id: string, patch: Partial<Account>) =>
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 8 }} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={['#6B2E10', '#B85F17', '#D17B2E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={as.headerCard}>
          <View style={as.headerDecorLayer} pointerEvents="none">
            <Text style={[as.headerDecorEmoji, { top: 8, right: 66, fontSize: 15, opacity: 0.55, transform: [{ rotate: '18deg' }] }]}>✈️</Text>
            <Text style={[as.headerDecorEmoji, { top: 2, right: 4, fontSize: 20, opacity: 0.5 }]}>📍</Text>
            <Text style={[as.headerDecorEmoji, { bottom: -14, right: 74, fontSize: 60, opacity: 0.14 }]}>🏝️</Text>
          </View>
          <Text style={as.headerEyebrow}>USER MANAGEMENT</Text>
          <Text style={as.headerTitle}>Accounts</Text>
          <Text style={as.headerSub}>Manage all account details.</Text>
        </LinearGradient>

        <View style={as.statsGrid}>
          <View style={as.statCard}>
            <View style={[as.statIconWrap, { backgroundColor: '#F3EAFB' }]}><Text style={{ fontSize: 18 }}>👥</Text></View>
            <Text style={as.statLabel}>TOTAL USERS</Text>
            <Text style={as.statValue}>{stats.total}</Text>
          </View>
          <View style={as.statCard}>
            <View style={[as.statIconWrap, { backgroundColor: '#EAF1FB' }]}><Text style={{ fontSize: 18 }}>🛡️</Text></View>
            <Text style={as.statLabel}>ADMIN</Text>
            <Text style={as.statValue}>{stats.admin}</Text>
          </View>
          <View style={as.statCard}>
            <View style={[as.statIconWrap, { backgroundColor: '#FFF5E0' }]}><Text style={{ fontSize: 18 }}>🧑‍💼</Text></View>
            <Text style={as.statLabel}>STAFF</Text>
            <Text style={as.statValue}>{stats.staff}</Text>
          </View>
          <View style={as.statCard}>
            <View style={[as.statIconWrap, { backgroundColor: '#E7F9F3' }]}><Text style={{ fontSize: 18 }}>🧳</Text></View>
            <Text style={as.statLabel}>CLIENTS</Text>
            <Text style={as.statValue}>{stats.client}</Text>
          </View>
        </View>

        <View style={as.sectionWrap}>
          <View style={as.sectionHeaderRow}>
            <Text style={as.sectionTitle}>All Accounts</Text>
            <TouchableOpacity style={as.addStaffBtn} activeOpacity={0.85} onPress={() => setShowAddStaff(true)}>
              <PlusIcon />
              <Text style={as.addStaffText}>Add Staff</Text>
            </TouchableOpacity>
          </View>

          <View style={as.searchBox}>
            <SearchIcon color={C.brownMid} />
            <TextInput
              style={as.searchInput}
              placeholder="Search by name, email or role..."
              placeholderTextColor={C.brownMid + '80'}
              value={query}
              onChangeText={setQuery}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={as.filterChipsRow}>
            {ROLE_FILTERS.map((f) => {
              const isSelected = f.value === roleFilter;
              return (
                <TouchableOpacity
                  key={f.value || '__all__'}
                  style={[as.filterChip, isSelected && as.filterChipSelected]}
                  activeOpacity={0.8}
                  onPress={() => setRoleFilter(f.value)}
                >
                  <Text style={[as.filterChipText, isSelected && as.filterChipTextSelected]}>{f.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={as.countRow}>
            <Text style={as.countText}>{filtered.length} account{filtered.length === 1 ? '' : 's'}</Text>
          </View>

          <View style={as.list}>
            {filtered.length === 0 ? (
              <View style={as.emptyWrap}>
                <Text style={as.emptyEmoji}>🔍</Text>
                <Text style={as.emptyText}>No accounts match your search.</Text>
              </View>
            ) : (
              filtered.map((a, i) => <AccountRow key={a.id} account={a} index={i} onPress={() => setSelectedAccount(a)} />)
            )}
          </View>
        </View>

        <Copyright />
      </ScrollView>

      <AddStaffModal visible={showAddStaff} onClose={() => setShowAddStaff(false)} onCreate={handleCreate} />
      <AccountDetailModal
        visible={!!selectedAccount}
        account={selectedAccount}
        onClose={() => setSelectedAccount(null)}
        onSave={handleSaveDetail}
      />
    </View>
  );
}

const makeStyles = (C: ColorPalette) => StyleSheet.create({
  headerCard: {
    marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    borderRadius: 20, padding: 18,
    overflow: 'hidden', position: 'relative',
    ...Platform.select({
      ios:     { shadowColor: '#3B1A0C', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 5 },
    }),
  },
  headerDecorLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  headerDecorEmoji: { position: 'absolute' },
  headerEyebrow: { fontSize: 10.5, fontWeight: '800', color: '#FFD9A0', letterSpacing: 0.6 },
  headerTitle: { fontSize: 21, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3, marginTop: 4 },
  headerSub: { fontSize: 11.5, color: 'rgba(255,255,255,0.85)', marginTop: 6, lineHeight: 16 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, marginTop: 14 },
  statCard: {
    flexBasis: '47%', flexGrow: 1,
    backgroundColor: C.cardBg, borderRadius: 14, padding: 12,
    borderLeftWidth: 3, borderLeftColor: C.amber,
    borderWidth: 1, borderColor: C.divider,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1 },
    }),
  },
  statIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statLabel: { fontSize: 8.5, fontWeight: '800', color: C.brownMid, opacity: 0.65, letterSpacing: 0.4 },
  statValue: { fontSize: 18, fontWeight: '900', color: C.brown, marginTop: 3 },

  sectionWrap: { paddingHorizontal: 16, marginTop: 18 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 14.5, fontWeight: '900', color: C.brown },
  addStaffBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.amber, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8,
  },
  addStaffText: { fontSize: 11.5, fontWeight: '800', color: '#FFFFFF' },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.cardBg, borderRadius: 12, paddingHorizontal: 12, height: 42,
    borderWidth: 1, borderColor: C.divider,
  },
  searchInput: { flex: 1, fontSize: 13, color: C.brown },

  filterChipsRow: { gap: 8, marginTop: 10, paddingVertical: 2 },
  filterChip: { backgroundColor: C.cardBg, borderRadius: 20, borderWidth: 1, borderColor: C.divider, paddingHorizontal: 14, paddingVertical: 8 },
  filterChipSelected: { backgroundColor: C.amber, borderColor: C.amber },
  filterChipText: { fontSize: 12, fontWeight: '700', color: C.brownMid },
  filterChipTextSelected: { color: '#FFFFFF', fontWeight: '800' },

  countRow: { marginTop: 12, marginBottom: 8 },
  countText: { fontSize: 12.5, fontWeight: '800', color: C.brownMid, opacity: 0.75, letterSpacing: 0.3 },

  list: { gap: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.cardBg, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: C.divider,
  },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' },
  rowName: { fontSize: 13, fontWeight: '800', color: C.brown },
  rowEmail: { fontSize: 11, color: C.brownMid, opacity: 0.7, marginTop: 2 },
  roleBadge: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 },
  roleBadgeText: { fontSize: 10, fontWeight: '800' },

  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50, gap: 8 },
  emptyEmoji: { fontSize: 34 },
  emptyText: { fontSize: 12.5, color: C.brownMid, opacity: 0.7, fontWeight: '600' },
});
