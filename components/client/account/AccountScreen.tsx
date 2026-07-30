/**
 * AccountScreen.tsx
 * Client Account tab — profile summary (real avatar when set, initials
 * fallback otherwise) and a trimmed menu (Edit Profile, Help & Support).
 * Logging out is handled from the sidebar, not this page.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Modal, StyleSheet, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Copyright from '@/components/Copyright';
import { C } from '../theme';
import ClientPageHero from '../ClientPageHero';
import { useAuth } from '@/components/auth/AuthContext';
import EditProfileModal from './EditProfileModal';

const ChevronIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
    <Path d="M9 6l6 6-6 6" stroke={C.brownMid} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const HelpIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22a10 10 0 100-20 10 10 0 000 20z" stroke={C.amber} strokeWidth={1.8} />
    <Path d="M9.2 9a2.8 2.8 0 015.4.9c0 1.9-2.6 1.8-2.6 3.6" stroke={C.amber} strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M12 17.2a.1.1 0 11-.001 0" stroke={C.amber} strokeWidth={2.4} strokeLinecap="round" />
  </Svg>
);
const MailIcon = () => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Path d="M4 5h16a1 1 0 011 1v11a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z" stroke={C.amber} strokeWidth={1.8} strokeLinejoin="round" />
    <Path d="M3.5 6l8.5 6 8.5-6" stroke={C.amber} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const PhoneIcon = () => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2C9.6 21 3 14.4 3 6a2 2 0 012-2z" stroke={C.amber} strokeWidth={1.8} strokeLinejoin="round" />
  </Svg>
);

const initialsOf = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');

const MENU_ROWS = ['Edit Profile', 'Help & Support'] as const;

/* ── Help & Support ── */
function HelpSupportModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={hp.backdrop}>
        <View style={hp.card}>
          <View style={hp.iconCircle}><HelpIcon /></View>
          <Text style={hp.title}>Help &amp; Support</Text>
          <Text style={hp.message}>
            Need help with a booking, payment, or your account? Reach out to the GoVenture team —
            we're happy to help.
          </Text>

          <View style={hp.contactRow}>
            <MailIcon />
            <Text style={hp.contactText}>support@goventure.com</Text>
          </View>
          <View style={hp.contactRow}>
            <PhoneIcon />
            <Text style={hp.contactText}>+63 2 8888 4368</Text>
          </View>

          <TouchableOpacity style={hp.closeBtn} activeOpacity={0.85} onPress={onClose}>
            <Text style={hp.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

type Props = {
  name?: string;
  email?: string;
  /** True right after arriving here via a "Add in Account…" link elsewhere (e.g. Documents' missing Passport/ID) — opens Edit Profile straight to Travel Documents. */
  autoOpenEditProfile?: boolean;
  onConsumedAutoOpenEditProfile?: () => void;
};

export default function AccountScreen({
  name = 'Jared Abellera', email = 'jared.abellera@email.com',
  autoOpenEditProfile, onConsumedAutoOpenEditProfile,
}: Props) {
  const { user } = useAuth();
  const [editVisible, setEditVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [editFocusSection, setEditFocusSection] = useState<'travelDocuments' | null>(null);

  useEffect(() => {
    if (!autoOpenEditProfile) return;
    setEditFocusSection('travelDocuments');
    setEditVisible(true);
    onConsumedAutoOpenEditProfile?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenEditProfile]);

  const displayName = user?.fullName ?? name;
  const displayEmail = user?.email ?? email;

  const handleRowPress = (label: (typeof MENU_ROWS)[number]) => {
    if (label === 'Edit Profile') setEditVisible(true);
    else if (label === 'Help & Support') setHelpVisible(true);
  };

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      <ClientPageHero icon="👤" title="Account" subtitle="Manage your profile and preferences" />

      <View style={pc.card}>
        <View style={pc.avatar}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={pc.avatarImage} resizeMode="cover" />
          ) : (
            <Text style={pc.avatarText}>{initialsOf(displayName)}</Text>
          )}
        </View>
        <Text style={pc.name}>{displayName}</Text>
        <Text style={pc.email}>{displayEmail}</Text>
      </View>

      <View style={mn.card}>
        {MENU_ROWS.map((label, i) => (
          <TouchableOpacity
            key={label}
            style={[mn.row, i === MENU_ROWS.length - 1 && mn.rowLast]}
            activeOpacity={0.75}
            onPress={() => handleRowPress(label)}
          >
            <Text style={mn.rowText}>{label}</Text>
            <ChevronIcon />
          </TouchableOpacity>
        ))}
      </View>

      <Copyright />

      <EditProfileModal
        visible={editVisible}
        userId={user?.id}
        focusSection={editFocusSection}
        onClose={() => { setEditVisible(false); setEditFocusSection(null); }}
      />
      <HelpSupportModal visible={helpVisible} onClose={() => setHelpVisible(false)} />
    </ScrollView>
  );
}

const pc = StyleSheet.create({
  card: {
    alignItems: 'center', backgroundColor: C.cardBg, borderRadius: 16,
    marginHorizontal: 16, marginTop: 14, padding: 22,
    borderWidth: 1, borderColor: C.divider,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 2 },
    }),
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: C.amber,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10, overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { fontSize: 24, fontWeight: '900', color: '#FFFFFF' },
  name: { fontSize: 16, fontWeight: '900', color: C.brown },
  email: { fontSize: 11.5, color: C.brownMid, opacity: 0.75, marginTop: 2 },
});

const mn = StyleSheet.create({
  card: {
    backgroundColor: C.cardBg, borderRadius: 14, marginHorizontal: 16, marginTop: 16,
    borderWidth: 1, borderColor: C.divider, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  rowLast: { borderBottomWidth: 0 },
  rowText: { fontSize: 12.5, fontWeight: '700', color: C.brown },
});

const hp = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(59,26,12,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%', maxWidth: 340,
    backgroundColor: C.cardBg, borderRadius: 22,
    paddingHorizontal: 22, paddingVertical: 26,
    alignItems: 'center',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 12 },
    }),
  },
  iconCircle: { width: 58, height: 58, borderRadius: 29, backgroundColor: C.lightBg, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { fontSize: 17, fontWeight: '900', color: C.brown, textAlign: 'center', marginBottom: 8 },
  message: { fontSize: 12, color: C.brownMid, textAlign: 'center', lineHeight: 18, opacity: 0.85, marginBottom: 16 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginBottom: 8, paddingHorizontal: 6 },
  contactText: { fontSize: 12.5, fontWeight: '700', color: C.brown },
  closeBtn: { width: '100%', borderRadius: 50, paddingVertical: 12, alignItems: 'center', backgroundColor: C.amber, marginTop: 10 },
  closeBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12, letterSpacing: 0.6 },
});
