/**
 * SettingsScreen.tsx
 * Admin Settings tab — Dark Mode / Language (local prefs), Company Branding
 * (name, contact info, logo — shown on generated documents/reports), and
 * My Profile (address/phone + change password for the logged-in admin).
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Switch, Image, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path } from 'react-native-svg';
import Copyright from '@/components/Copyright';
import { useAppTheme, ColorPalette } from '../ThemeContext';
import { useAuth } from '@/components/auth/AuthContext';
import {
  ACCOUNT_UPDATE_API_URL, CHANGE_PASSWORD_API_URL, CLIENT_ACCOUNT_GET_API_URL,
  COMPANY_BRANDING_GET_API_URL, COMPANY_BRANDING_UPDATE_API_URL,
} from '@/constants/api';

const SettingsChevronIcon = ({ color }: { color: string }) => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const MoonFieldIcon = ({ color }: { color: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M20 14.5A8.5 8.5 0 119.5 4a7 7 0 0010.5 10.5z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
  </Svg>
);
const GlobeFieldIcon = ({ color }: { color: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M12 21a9 9 0 100-18 9 9 0 000 18z" stroke={color} strokeWidth={1.8} />
    <Path d="M3 12h18M12 3c2.4 2.5 3.6 5.6 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.6-3.6-9S9.6 5.5 12 3z" stroke={color} strokeWidth={1.8} />
  </Svg>
);
const BuildingIcon = ({ color }: { color: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M4 21V5a1 1 0 011-1h10a1 1 0 011 1v16M4 21h16M4 21h1M19 21h1M9 8h.01M13 8h.01M9 12h.01M13 12h.01M9 16h.01M13 16h.01" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const LockIcon = ({ color }: { color: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M6 11V8a6 6 0 1112 0v3" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M5 11h14v9a1 1 0 01-1 1H6a1 1 0 01-1-1v-9z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
  </Svg>
);

const LANGUAGE_OPTIONS = ['English', 'Filipino'];

type BrandingForm = {
  companyName: string; businessAddress: string; contactNumber: string;
  email: string; website: string; tinNumber: string; registrationNumber: string;
};
const EMPTY_BRANDING: BrandingForm = {
  companyName: '', businessAddress: '', contactNumber: '', email: '', website: '', tinNumber: '', registrationNumber: '',
};

export default function SettingsScreen() {
  const { C, isDark, toggleDarkMode } = useAppTheme();
  const { user } = useAuth();
  const st = useMemo(() => makeStyles(C), [C]);

  const [language, setLanguage] = useState('English');
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  const [branding, setBranding] = useState<BrandingForm>(EMPTY_BRANDING);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [logoMime, setLogoMime] = useState<string | null>(null);
  const [brandingLoading, setBrandingLoading] = useState(true);
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingSaved, setBrandingSaved] = useState(false);

  const [profileAddress, setProfileAddress] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [pwModalVisible, setPwModalVisible] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch(`${CLIENT_ACCOUNT_GET_API_URL}&userId=${user.id}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.status === 'success') {
          setProfileAddress(result.data.address ?? '');
          setProfilePhone(result.data.phone ?? '');
        }
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    fetch(COMPANY_BRANDING_GET_API_URL)
      .then((res) => res.json())
      .then((result) => {
        if (result.status === 'success' && result.data) {
          setBranding({
            companyName: result.data.companyName ?? '',
            businessAddress: result.data.businessAddress ?? '',
            contactNumber: result.data.contactNumber ?? '',
            email: result.data.email ?? '',
            website: result.data.website ?? '',
            tinNumber: result.data.tinNumber ?? '',
            registrationNumber: result.data.registrationNumber ?? '',
          });
          setLogoUri(result.data.logoUrl ?? null);
        }
      })
      .catch(() => {})
      .finally(() => setBrandingLoading(false));
  }, []);

  const pickLogo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: true });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setLogoUri(asset.uri);
    setLogoBase64(asset.base64 ?? null);
    setLogoMime(asset.mimeType ?? 'image/jpeg');
  };

  const saveBranding = async () => {
    setBrandingSaving(true);
    setBrandingSaved(false);
    try {
      const res = await fetch(COMPANY_BRANDING_UPDATE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...branding,
          logoDataUri: logoBase64 ? `data:${logoMime || 'image/jpeg'};base64,${logoBase64}` : null,
        }),
      });
      const result = await res.json();
      if (result.status === 'success') {
        setBrandingSaved(true);
        if (result.data?.logoUrl) setLogoUri(result.data.logoUrl);
      }
    } finally {
      setBrandingSaving(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setProfileSaving(true);
    setProfileSaved(false);
    try {
      const res = await fetch(ACCOUNT_UPDATE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, address: profileAddress.trim(), cellphone: profilePhone.trim() }),
      });
      const result = await res.json();
      if (result.status === 'success') setProfileSaved(true);
    } finally {
      setProfileSaving(false);
    }
  };

  const submitPasswordChange = async () => {
    if (!user) return;
    if (newPw.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
    setPwError('');
    setPwSaving(true);
    try {
      const res = await fetch(CHANGE_PASSWORD_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, currentPassword: currentPw, newPassword: newPw }),
      });
      const result = await res.json();
      if (result.status !== 'success') { setPwError(result.message || 'Failed to update password.'); return; }
      setPwModalVisible(false);
      setCurrentPw('');
      setNewPw('');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <Text style={st.sectionTitle}>Preferences</Text>
        <View style={st.panel}>
          <View style={st.field}>
            <Text style={st.fieldLabel}>DARK MODE</Text>
            <View style={st.fieldBox}>
              <MoonFieldIcon color={C.amber} />
              <Text style={st.fieldValue}>{isDark ? 'On' : 'Off'}</Text>
              <View style={{ flex: 1 }} />
              <Switch value={isDark} onValueChange={(v) => toggleDarkMode(v)} trackColor={{ false: C.divider, true: C.amber }} thumbColor={C.white} />
            </View>
          </View>

          <View style={st.field}>
            <Text style={st.fieldLabel}>LANGUAGE</Text>
            <TouchableOpacity style={st.fieldBox} activeOpacity={0.8} onPress={() => setShowLanguagePicker(true)}>
              <GlobeFieldIcon color={C.amber} />
              <Text style={st.fieldValue}>{language}</Text>
              <View style={{ flex: 1 }} />
              <SettingsChevronIcon color={C.amber} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={st.sectionTitle}>My Profile</Text>
        <View style={st.panel}>
          <View style={st.field}>
            <Text style={st.fieldLabel}>NAME</Text>
            <View style={st.fieldBox}><Text style={st.fieldValue}>{user?.fullName}</Text></View>
          </View>
          <View style={st.field}>
            <Text style={st.fieldLabel}>EMAIL</Text>
            <View style={st.fieldBox}><Text style={st.fieldValue}>{user?.email}</Text></View>
          </View>
          <View style={st.field}>
            <Text style={st.fieldLabel}>ADDRESS</Text>
            <TextInput style={st.textInput} value={profileAddress} onChangeText={setProfileAddress} placeholder="Your address" placeholderTextColor={C.brownMid + '80'} />
          </View>
          <View style={st.field}>
            <Text style={st.fieldLabel}>CELLPHONE NUMBER</Text>
            <TextInput style={st.textInput} value={profilePhone} onChangeText={setProfilePhone} placeholder="+63 9XX XXX XXXX" placeholderTextColor={C.brownMid + '80'} keyboardType="phone-pad" />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={st.saveBtn} activeOpacity={0.85} onPress={saveProfile} disabled={profileSaving}>
              {profileSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={st.saveBtnText}>{profileSaved ? 'Saved ✓' : 'Save Profile'}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={st.pwBtn} activeOpacity={0.85} onPress={() => setPwModalVisible(true)}>
              <LockIcon color={C.brownMid} />
              <Text style={st.pwBtnText}>Change Password</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={st.sectionTitle}>Company Branding</Text>
        <View style={st.panel}>
          {brandingLoading ? (
            <ActivityIndicator color={C.amber} />
          ) : (
            <>
              <TouchableOpacity style={st.logoBox} activeOpacity={0.8} onPress={pickLogo}>
                {logoUri ? (
                  <Image source={{ uri: logoUri }} style={st.logoImage} resizeMode="cover" />
                ) : (
                  <>
                    <BuildingIcon color={C.brownMid} />
                    <Text style={st.logoHint}>Tap to upload logo</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={st.field}>
                <Text style={st.fieldLabel}>COMPANY NAME</Text>
                <TextInput style={st.textInput} value={branding.companyName} onChangeText={(v) => setBranding((b) => ({ ...b, companyName: v }))} placeholderTextColor={C.brownMid + '80'} />
              </View>
              <View style={st.field}>
                <Text style={st.fieldLabel}>BUSINESS ADDRESS</Text>
                <TextInput style={st.textInput} value={branding.businessAddress} onChangeText={(v) => setBranding((b) => ({ ...b, businessAddress: v }))} placeholderTextColor={C.brownMid + '80'} />
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={[st.field, { flex: 1 }]}>
                  <Text style={st.fieldLabel}>CONTACT NUMBER</Text>
                  <TextInput style={st.textInput} value={branding.contactNumber} onChangeText={(v) => setBranding((b) => ({ ...b, contactNumber: v }))} placeholderTextColor={C.brownMid + '80'} keyboardType="phone-pad" />
                </View>
                <View style={[st.field, { flex: 1 }]}>
                  <Text style={st.fieldLabel}>EMAIL</Text>
                  <TextInput style={st.textInput} value={branding.email} onChangeText={(v) => setBranding((b) => ({ ...b, email: v }))} placeholderTextColor={C.brownMid + '80'} keyboardType="email-address" autoCapitalize="none" />
                </View>
              </View>
              <View style={st.field}>
                <Text style={st.fieldLabel}>WEBSITE</Text>
                <TextInput style={st.textInput} value={branding.website} onChangeText={(v) => setBranding((b) => ({ ...b, website: v }))} placeholderTextColor={C.brownMid + '80'} autoCapitalize="none" />
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={[st.field, { flex: 1 }]}>
                  <Text style={st.fieldLabel}>TIN NUMBER</Text>
                  <TextInput style={st.textInput} value={branding.tinNumber} onChangeText={(v) => setBranding((b) => ({ ...b, tinNumber: v }))} placeholderTextColor={C.brownMid + '80'} />
                </View>
                <View style={[st.field, { flex: 1 }]}>
                  <Text style={st.fieldLabel}>DTI/SEC REG. NO.</Text>
                  <TextInput style={st.textInput} value={branding.registrationNumber} onChangeText={(v) => setBranding((b) => ({ ...b, registrationNumber: v }))} placeholderTextColor={C.brownMid + '80'} />
                </View>
              </View>

              <TouchableOpacity style={st.saveBtn} activeOpacity={0.85} onPress={saveBranding} disabled={brandingSaving}>
                {brandingSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={st.saveBtnText}>{brandingSaved ? 'Saved ✓' : 'Save Branding'}</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>

        <Copyright />
      </ScrollView>

      <Modal visible={showLanguagePicker} transparent animationType="fade" onRequestClose={() => setShowLanguagePicker(false)} statusBarTranslucent>
        <TouchableOpacity style={st.pmBackdrop} activeOpacity={1} onPress={() => setShowLanguagePicker(false)}>
          <TouchableOpacity style={st.pmSheet} activeOpacity={1}>
            <Text style={st.pmTitle}>Language</Text>
            {LANGUAGE_OPTIONS.map((opt) => {
              const isSelected = opt === language;
              return (
                <TouchableOpacity key={opt} style={[st.pmRow, isSelected && st.pmRowSelected]} activeOpacity={0.75} onPress={() => { setLanguage(opt); setShowLanguagePicker(false); }}>
                  <Text style={[st.pmRowText, isSelected && st.pmRowTextSelected]}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={pwModalVisible} transparent animationType="fade" onRequestClose={() => setPwModalVisible(false)}>
        <View style={st.modalOverlay}>
          <View style={st.modalCard}>
            <Text style={st.modalTitle}>Change Password</Text>
            <Text style={st.fieldLabel}>CURRENT PASSWORD</Text>
            <TextInput style={st.textInput} value={currentPw} onChangeText={setCurrentPw} secureTextEntry placeholderTextColor={C.brownMid + '80'} />
            <View style={{ height: 10 }} />
            <Text style={st.fieldLabel}>NEW PASSWORD</Text>
            <TextInput style={st.textInput} value={newPw} onChangeText={setNewPw} secureTextEntry placeholderTextColor={C.brownMid + '80'} />
            {!!pwError && <Text style={st.pwError}>{pwError}</Text>}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity style={st.modalCancelBtn} activeOpacity={0.8} onPress={() => { setPwModalVisible(false); setPwError(''); }} disabled={pwSaving}>
                <Text style={st.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[st.modalConfirmBtn, pwSaving && { opacity: 0.7 }]} activeOpacity={0.85} onPress={submitPasswordChange} disabled={pwSaving}>
                {pwSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={st.modalConfirmText}>Update</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (C: ColorPalette) => StyleSheet.create({
  sectionTitle: { fontSize: 12, fontWeight: '900', color: C.brownMid, opacity: 0.7, letterSpacing: 0.6, marginHorizontal: 16, marginTop: 18, marginBottom: 4 },
  panel: {
    marginHorizontal: 16, marginTop: 10, paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: C.cardBg, borderRadius: 14,
    borderWidth: 1, borderColor: C.divider,
    gap: 12,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1 },
    }),
  },
  field: { gap: 6 },
  fieldLabel: { fontSize: 9.5, fontWeight: '800', color: C.brownMid, opacity: 0.65, letterSpacing: 0.5 },
  fieldBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.lightBg, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 14,
    borderWidth: 1, borderColor: C.divider,
  },
  fieldValue: { fontSize: 13, fontWeight: '700', color: C.brown, flexShrink: 1 },
  textInput: {
    backgroundColor: C.lightBg, borderRadius: 12, borderWidth: 1, borderColor: C.divider,
    paddingVertical: 11, paddingHorizontal: 14, fontSize: 13, color: C.brown,
  },

  logoBox: {
    height: 90, width: 90, borderRadius: 14, borderWidth: 1, borderColor: C.divider, borderStyle: 'dashed',
    backgroundColor: C.lightBg, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', overflow: 'hidden', gap: 4,
  },
  logoImage: { width: '100%', height: '100%' },
  logoHint: { fontSize: 9, color: C.brownMid, fontWeight: '700', textAlign: 'center', paddingHorizontal: 6 },

  saveBtn: { flex: 1, backgroundColor: C.amber, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 13 },
  saveBtnText: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' },
  pwBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.lightBg, borderWidth: 1, borderColor: C.divider, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13 },
  pwBtnText: { fontSize: 12, fontWeight: '800', color: C.brownMid },

  pmBackdrop: { flex: 1, backgroundColor: 'rgba(59,26,12,0.5)', justifyContent: 'flex-end' },
  pmSheet: {
    backgroundColor: C.cardBg,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 30,
  },
  pmTitle: { fontSize: 13, fontWeight: '900', color: C.brown, marginBottom: 10, letterSpacing: 0.3 },
  pmRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.divider + '55',
  },
  pmRowSelected:     {},
  pmRowText:         { fontSize: 13, color: C.brownMid, fontWeight: '600' },
  pmRowTextSelected: { color: C.amber, fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(59,26,12,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: {
    width: '100%', maxWidth: 380, backgroundColor: C.cardBg, borderRadius: 18, padding: 20,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 8 },
    }),
  },
  modalTitle: { fontSize: 15.5, fontWeight: '900', color: C.brown, marginBottom: 14 },
  pwError: { color: C.danger, fontSize: 11.5, fontWeight: '700', marginTop: 8 },
  modalCancelBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: C.divider, backgroundColor: C.lightBg },
  modalCancelText: { fontSize: 12.5, fontWeight: '800', color: C.brownMid },
  modalConfirmBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 12, backgroundColor: C.amber },
  modalConfirmText: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' },
});
