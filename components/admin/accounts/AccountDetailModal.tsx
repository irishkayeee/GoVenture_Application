/**
 * AccountDetailModal.tsx
 * Full-screen detail view for a single account — profile header, role badge,
 * and an "Account Information" section with an inline Edit mode for the
 * address and cellphone number.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useAppTheme, ColorPalette } from '../ThemeContext';
import { Account, AccountRole, AVATAR_COLORS } from './mockData';

const BackIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M15 19l-7-7 7-7" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const EditIcon = () => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
    <Path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const InfoRow = ({ label, value, ad }: { label: string; value: string; ad: ReturnType<typeof makeStyles> }) => (
  <View style={ad.infoRow}>
    <Text style={ad.infoLabel}>{label}</Text>
    <Text style={ad.infoValue}>{value}</Text>
  </View>
);

type Props = {
  visible: boolean;
  account: Account | null;
  onClose: () => void;
  onSave:  (id: string, patch: Partial<Account>) => void;
};

export default function AccountDetailModal({ visible, account, onClose, onSave }: Props) {
  const { C } = useAppTheme();
  const ad = useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState(false);
  const [address, setAddress] = useState('');
  const [cellphone, setCellphone] = useState('');

  useEffect(() => {
    if (account) { setAddress(account.address); setCellphone(account.cellphone); }
    setEditing(false);
  }, [account]);

  if (!account) return null;
  const ROLE_STYLE: Record<AccountRole, { bg: string; color: string }> = {
    Admin:  { bg: '#F3EAFB', color: C.purple },
    Staff:  { bg: '#EAF1FB', color: C.info },
    Client: { bg: '#E7F9F3', color: '#12946F' },
  };
  const roleStyle = ROLE_STYLE[account.role];
  const avatarColor = AVATAR_COLORS[Number(account.id.replace(/\D/g, '') || 0) % AVATAR_COLORS.length];

  const handleClose = () => { setEditing(false); onClose(); };
  const handleSave = () => {
    onSave(account.id, { address: address.trim() || '—', cellphone: cellphone.trim() || '—' });
    setEditing(false);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose} statusBarTranslucent>
      <View style={ad.safe}>
        <LinearGradient colors={['#6B2E10', '#B85F17', '#D17B2E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[ad.header, { paddingTop: insets.top + 14 }]}>
          <View style={ad.headerTopRow}>
            <TouchableOpacity style={ad.backBtn} activeOpacity={0.85} onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <BackIcon />
            </TouchableOpacity>
            <TouchableOpacity
              style={ad.editBtn}
              activeOpacity={0.85}
              onPress={() => (editing ? handleSave() : setEditing(true))}
            >
              <EditIcon />
              <Text style={ad.editBtnText}>{editing ? 'Save' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          <View style={ad.profileRow}>
            <View style={[ad.avatar, { backgroundColor: avatarColor }]}>
              <Text style={ad.avatarText}>{account.initials}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={ad.name} numberOfLines={1}>{account.name}</Text>
              <Text style={ad.email} numberOfLines={1}>{account.email}</Text>
              <View style={[ad.roleBadge, { backgroundColor: roleStyle.bg, alignSelf: 'flex-start' }]}>
                <Text style={[ad.roleBadgeText, { color: roleStyle.color }]}>{account.role}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={ad.body}>
          <Text style={ad.sectionLabel}>ACCOUNT INFORMATION</Text>
          <View style={ad.infoCard}>
            {editing ? (
              <>
                <Text style={ad.editFieldLabel}>Address</Text>
                <TextInput style={ad.editInput} value={address} onChangeText={setAddress} placeholder="Address" placeholderTextColor={C.brownMid + '80'} />
                <Text style={ad.editFieldLabel}>Cellphone Number</Text>
                <TextInput style={ad.editInput} value={cellphone} onChangeText={setCellphone} placeholder="+63 9XX XXX XXXX" placeholderTextColor={C.brownMid + '80'} keyboardType="phone-pad" />
              </>
            ) : (
              <>
                <InfoRow label="Address" value={account.address} ad={ad} />
                <InfoRow label="Cellphone Number" value={account.cellphone} ad={ad} />
                <InfoRow label="Account Created" value={account.createdDate} ad={ad} />
                <InfoRow label="Password" value="••••••••••" ad={ad} />
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const makeStyles = (C: ColorPalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.lightBg },
  header: { paddingBottom: 20, paddingHorizontal: 20 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8,
  },
  editBtnText: { fontSize: 11.5, fontWeight: '800', color: '#FFFFFF' },

  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  name: { fontSize: 17, fontWeight: '900', color: '#FFFFFF' },
  email: { fontSize: 11.5, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  roleBadge: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3, marginTop: 7 },
  roleBadgeText: { fontSize: 10.5, fontWeight: '800' },

  body: { padding: 16, paddingBottom: 24 },
  sectionLabel: { fontSize: 10.5, fontWeight: '800', color: C.brownMid, opacity: 0.65, letterSpacing: 0.6, marginBottom: 8 },
  infoCard: {
    backgroundColor: C.cardBg, borderRadius: 14, padding: 4,
    borderWidth: 1, borderColor: C.divider,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  infoLabel: { fontSize: 12.5, color: C.brownMid, opacity: 0.8 },
  infoValue: { fontSize: 12.5, fontWeight: '800', color: C.brown, flexShrink: 1, textAlign: 'right', marginLeft: 10 },

  editFieldLabel: { fontSize: 10.5, fontWeight: '800', color: C.brownMid, opacity: 0.75, marginBottom: 6, marginTop: 12, marginHorizontal: 10 },
  editInput: {
    marginHorizontal: 10, backgroundColor: C.lightBg, borderRadius: 12, borderWidth: 1, borderColor: C.divider,
    paddingHorizontal: 13, paddingVertical: 11, fontSize: 13, color: C.brown, marginBottom: 4,
  },
});
