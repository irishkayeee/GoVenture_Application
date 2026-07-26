/**
 * EditProfileModal.tsx
 * Fetches the traveler's real account record (client_account_get) and lets
 * them edit address/phone, saving via the existing account_update endpoint.
 */

import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { C } from '../theme';
import { CLIENT_ACCOUNT_GET_API_URL, ACCOUNT_UPDATE_API_URL } from '@/constants/api';

const BackIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M15 19l-7-7 7-7" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={s.infoRow}>
    <Text style={s.infoLabel}>{label}</Text>
    <Text style={s.infoValue}>{value}</Text>
  </View>
);

type Props = {
  visible:  boolean;
  userId:   string | undefined;
  onClose:  () => void;
};

export default function EditProfileModal({ visible, userId, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [memberSince, setMemberSince] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (!visible || !userId) return;
    setLoading(true);
    setError('');
    fetch(`${CLIENT_ACCOUNT_GET_API_URL}&userId=${userId}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.status !== 'success') throw new Error(result.message || 'Failed to load account.');
        setFullName(result.data.fullName);
        setEmail(result.data.email);
        setMemberSince(result.data.memberSince);
        setAddress(result.data.address);
        setPhone(result.data.phone);
      })
      .catch((e) => setError(e.message || 'Failed to load account.'))
      .finally(() => setLoading(false));
  }, [visible, userId]);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(ACCOUNT_UPDATE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, address: address.trim(), cellphone: phone.trim() }),
      });
      const result = await res.json();
      if (result.status !== 'success') throw new Error(result.message || 'Failed to save.');
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={s.safe}>
        <View style={[s.header, { paddingTop: insets.top + 14 }]}>
          <TouchableOpacity style={s.backBtn} activeOpacity={0.85} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Edit Profile</Text>
          <View style={{ width: 34 }} />
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator color={C.amber} /></View>
        ) : (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={s.body}>
            <Text style={s.sectionLabel}>ACCOUNT INFORMATION</Text>
            <View style={s.infoCard}>
              <InfoRow label="Full Name" value={fullName} />
              <InfoRow label="Email" value={email} />
              <InfoRow label="Member Since" value={memberSince} />
            </View>

            <Text style={[s.sectionLabel, { marginTop: 18 }]}>CONTACT DETAILS</Text>
            <View style={s.infoCard}>
              <Text style={s.editFieldLabel}>Address</Text>
              <TextInput style={s.editInput} value={address} onChangeText={setAddress} placeholder="Your address" placeholderTextColor={C.brownMid + '80'} />
              <Text style={s.editFieldLabel}>Cellphone Number</Text>
              <TextInput style={s.editInput} value={phone} onChangeText={setPhone} placeholder="+63 9XX XXX XXXX" placeholderTextColor={C.brownMid + '80'} keyboardType="phone-pad" />
            </View>

            {!!error && <Text style={s.errorText}>{error}</Text>}

            <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.7 }]} activeOpacity={0.85} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.lightBg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 14, backgroundColor: C.amber,
  },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '900', color: '#FFFFFF' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  body: { padding: 16, paddingBottom: 32 },
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

  errorText: { color: C.danger, fontSize: 12, fontWeight: '700', marginTop: 12, marginHorizontal: 4 },

  saveBtn: {
    backgroundColor: C.amber, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, marginTop: 20,
  },
  saveBtnText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
});
