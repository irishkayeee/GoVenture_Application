/**
 * EditProfileModal.tsx
 * Fetches the traveler's real account record (client_account_get) and lets
 * them edit their profile picture, name, email, contact number, gender, and
 * date of birth, saving via client_profile_update. On success the change is
 * pushed into AuthContext (updateUser) so it shows up everywhere the user is
 * read from — the Account page, the top nav avatar, etc. — without needing
 * to log out and back in.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView, Image,
  StyleSheet, ActivityIndicator, Alert, Animated, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path, Circle } from 'react-native-svg';
import { C } from '../theme';
import { useAuth } from '@/components/auth/AuthContext';
import { CLIENT_ACCOUNT_GET_API_URL, CLIENT_PROFILE_UPDATE_API_URL, CLIENT_AVATAR_UPDATE_API_URL } from '@/constants/api';

/* ── Icons (solid-style, no emoji) ── */
const BackIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M15 19l-7-7 7-7" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const CameraIcon = () => (
  <Svg width={13} height={13} viewBox="0 0 24 24">
    <Path fill="#FFFFFF" d="M9 3L7.5 5H4a2 2 0 00-2 2v11a2 2 0 002 2h16a2 2 0 002-2V7a2 2 0 00-2-2h-3.5L15 3H9zm3 5a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6z" />
  </Svg>
);
const PersonPlaceholderIcon = () => (
  <Svg width={36} height={36} viewBox="0 0 24 24">
    <Circle cx={12} cy={8} r={4} fill="#FFFFFF" opacity={0.9} />
    <Path fill="#FFFFFF" opacity={0.9} d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7v1H4v-1z" />
  </Svg>
);
const CalendarIcon = () => (
  <Svg width={15} height={15} viewBox="0 0 24 24">
    <Path fill={C.amber} d="M7 2a1 1 0 011 1v1h8V3a1 1 0 112 0v1h1a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h1V3a1 1 0 011-1zM5 10v10h14V10H5z" />
  </Svg>
);
const CheckCircleIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24">
    <Circle cx={12} cy={12} r={10} fill="#FFFFFF" />
    <Path d="M7 12.5l3 3 7-7" stroke="#12946F" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg>
);
const CameraOptionIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24">
    <Path fill={C.amber} d="M9 3L7.5 5H4a2 2 0 00-2 2v11a2 2 0 002 2h16a2 2 0 002-2V7a2 2 0 00-2-2h-3.5L15 3H9zm3 5a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6z" />
  </Svg>
);
const LibraryOptionIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24">
    <Path fill={C.amber} d="M4 5a2 2 0 012-2h9a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm2 9l2.3-2.9a1 1 0 011.6.05L11.5 13l1.8-2.3a1 1 0 011.6 0L17 14v2H6v-2z" />
    <Path fill={C.amber} opacity={0.55} d="M20 6.5v12a2.5 2.5 0 01-2.5 2.5H8v-1.5h9.5a1 1 0 001-1V6.5H20z" />
  </Svg>
);
const BigCheckIcon = () => (
  <Svg width={30} height={30} viewBox="0 0 24 24">
    <Path d="M4 12.5l5.5 5.5L20 7" stroke="#12946F" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg>
);

/* ── Change Profile Picture action sheet (custom-styled, not the native Alert) ── */
function ChangePhotoModal({ visible, onClose, onTakePhoto, onChooseLibrary }: {
  visible: boolean; onClose: () => void; onTakePhoto: () => void; onChooseLibrary: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={cp.backdrop}>
        <View style={cp.card}>
          <Text style={cp.title}>Change Profile Picture</Text>
          <Text style={cp.subtitle}>Choose a source</Text>

          <TouchableOpacity style={cp.optionRow} activeOpacity={0.75} onPress={onTakePhoto}>
            <View style={cp.optionIconWrap}><CameraOptionIcon /></View>
            <Text style={cp.optionText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={cp.optionRow} activeOpacity={0.75} onPress={onChooseLibrary}>
            <View style={cp.optionIconWrap}><LibraryOptionIcon /></View>
            <Text style={cp.optionText}>Choose from Library</Text>
          </TouchableOpacity>

          <TouchableOpacity style={cp.cancelBtn} activeOpacity={0.85} onPress={onClose}>
            <Text style={cp.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ── Success confirmation shown right after a new photo is saved ── */
function PhotoUpdatedModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={pu.backdrop}>
        <View style={pu.card}>
          <View style={pu.iconCircle}><BigCheckIcon /></View>
          <Text style={pu.title}>Profile Picture Updated</Text>
          <Text style={pu.message}>Your new profile picture has been saved successfully.</Text>
          <TouchableOpacity style={pu.closeBtn} activeOpacity={0.85} onPress={onClose}>
            <Text style={pu.closeBtnText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const pad2 = (n: number) => String(n).padStart(2, '0');
const formatDobDisplay = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

/* ── Date of Birth picker ── */
function DOBPickerModal({ visible, value, onClose, onSelect }: {
  visible: boolean; value: string; onClose: () => void; onSelect: (iso: string) => void;
}) {
  const today = new Date();
  const defaultDate = () => (value ? new Date(`${value}T00:00:00`) : new Date(today.getFullYear() - 25, 0, 1));

  const [year, setYear] = useState(defaultDate().getFullYear());
  const [month, setMonth] = useState(defaultDate().getMonth());
  const [selectedDay, setSelectedDay] = useState(defaultDate().getDate());
  const [yearMenuOpen, setYearMenuOpen] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const d = defaultDate();
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    setSelectedDay(d.getDate());
    setYearMenuOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, value]);

  if (!visible) return null;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const years = Array.from({ length: 100 }, (_, i) => today.getFullYear() - i);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={dp.overlay}>
        <View style={dp.card}>
          <Text style={dp.title}>Date of Birth</Text>

          <View style={dp.navRow}>
            <TouchableOpacity style={dp.monthBtn} onPress={() => setMonth((m) => (m === 0 ? 11 : m - 1))}>
              <Text style={dp.navArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={dp.monthLabel}>{MONTH_NAMES[month]}</Text>
            <TouchableOpacity style={dp.monthBtn} onPress={() => setMonth((m) => (m === 11 ? 0 : m + 1))}>
              <Text style={dp.navArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dp.yearBtn} activeOpacity={0.8} onPress={() => setYearMenuOpen((v) => !v)}>
              <Text style={dp.yearLabel}>{year} ▾</Text>
            </TouchableOpacity>
          </View>

          {yearMenuOpen ? (
            <ScrollView style={dp.yearMenu} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {years.map((y) => (
                <TouchableOpacity key={y} style={dp.yearMenuItem} activeOpacity={0.75} onPress={() => { setYear(y); setYearMenuOpen(false); }}>
                  <Text style={[dp.yearMenuItemText, y === year && dp.yearMenuItemTextActive]}>{y}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <>
              <View style={dp.weekRow}>
                {WEEKDAY_LETTERS.map((w, i) => <Text key={i} style={dp.weekLetter}>{w}</Text>)}
              </View>
              <View style={dp.grid}>
                {cells.map((d, i) => {
                  if (!d) return <View key={i} style={dp.cell} />;
                  const isFuture = new Date(year, month, d).getTime() > today.getTime();
                  const isSelected = d === selectedDay;
                  return (
                    <View key={i} style={dp.cell}>
                      <TouchableOpacity
                        disabled={isFuture}
                        activeOpacity={0.7}
                        style={[dp.dayBtn, isSelected && dp.dayBtnActive]}
                        onPress={() => setSelectedDay(d)}
                      >
                        <Text style={[dp.dayText, isFuture && dp.dayTextDisabled, isSelected && dp.dayTextActive]}>{d}</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          <View style={dp.footerRow}>
            <TouchableOpacity onPress={onClose}><Text style={dp.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity
              style={dp.applyBtn}
              activeOpacity={0.85}
              onPress={() => { onSelect(`${year}-${pad2(month + 1)}-${pad2(selectedDay)}`); onClose(); }}
            >
              <Text style={dp.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

type Props = {
  visible:  boolean;
  userId:   string | undefined;
  onClose:  () => void;
};

export default function EditProfileModal({ visible, userId, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'Female' | 'Male'>('Female');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [dobPickerVisible, setDobPickerVisible] = useState(false);

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [changePhotoVisible, setChangePhotoVisible] = useState(false);
  const [photoUpdatedVisible, setPhotoUpdatedVisible] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const toastAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible || !userId) return;
    setLoading(true);
    setError('');
    fetch(`${CLIENT_ACCOUNT_GET_API_URL}&userId=${userId}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.status !== 'success') throw new Error(result.message || 'Failed to load account.');
        setFirstName(result.data.firstName);
        setLastName(result.data.lastName);
        setEmail(result.data.email);
        setPhone(result.data.phone ?? '');
        setGender(result.data.gender === 'Male' ? 'Male' : 'Female');
        setDateOfBirth(result.data.dateOfBirth ?? '');
        setAvatarUri(result.data.avatarUrl ?? null);
      })
      .catch((e) => setError(e.message || 'Failed to load account.'))
      .finally(() => setLoading(false));
  }, [visible, userId]);

  const launchPicker = async (source: 'camera' | 'library') => {
    setChangePhotoVisible(false);
    const perm = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', source === 'camera' ? 'Allow camera access to take a photo.' : 'Allow photo library access to choose a photo.');
      return;
    }
    const options = { allowsEditing: true, aspect: [1, 1] as [number, number], quality: 0.7, base64: true };
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], ...options });
    const asset = result.canceled ? null : result.assets?.[0];
    if (!asset?.base64) return;

    const mimeType = asset.mimeType ?? 'image/jpeg';
    setAvatarSaving(true);
    try {
      const res = await fetch(CLIENT_AVATAR_UPDATE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, avatarDataUri: `data:${mimeType};base64,${asset.base64}` }),
      });
      const result2 = await res.json();
      if (result2.status !== 'success') throw new Error(result2.message || 'Failed to save photo.');
      setAvatarUri(result2.data.avatarUrl);
      await updateUser({ avatarUrl: result2.data.avatarUrl });
      setPhotoUpdatedVisible(true);
    } catch (e: any) {
      Alert.alert('Upload failed', e.message || 'Please check your connection and try again.');
    } finally {
      setAvatarSaving(false);
    }
  };

  const showToast = () => {
    setToastVisible(true);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setToastVisible(false));
  };

  const validate = (): string | null => {
    if (!firstName.trim()) return 'First name is required.';
    if (!lastName.trim()) return 'Last name is required.';
    if (!email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Please enter a valid email address.';
    if (!phone.trim()) return 'Contact number is required.';
    if (!/^[0-9+\-\s()]{7,20}$/.test(phone.trim())) return 'Please enter a valid contact number.';
    return null;
  };

  const handleSave = async () => {
    if (!userId) return;
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError('');
    setSaving(true);
    try {
      const res = await fetch(CLIENT_PROFILE_UPDATE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          gender,
          dateOfBirth,
        }),
      });
      const result = await res.json();
      if (result.status !== 'success') throw new Error(result.message || 'Failed to save.');

      await updateUser({
        firstName: result.data.firstName,
        lastName: result.data.lastName,
        fullName: result.data.fullName,
        email: result.data.email,
      });
      showToast();
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
          <ScrollView style={{ flex: 1 }} contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
            <View style={s.avatarSection}>
              <TouchableOpacity style={s.avatarWrap} activeOpacity={0.85} onPress={() => setChangePhotoVisible(true)} disabled={avatarSaving}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={s.avatarImage} resizeMode="cover" />
                ) : (
                  <View style={s.avatarPlaceholder}><PersonPlaceholderIcon /></View>
                )}
                {avatarSaving && (
                  <View style={s.avatarSavingOverlay}><ActivityIndicator color="#FFFFFF" /></View>
                )}
                <View style={s.cameraBadge}><CameraIcon /></View>
              </TouchableOpacity>
              <Text style={s.avatarHint}>{avatarSaving ? 'Saving photo…' : 'Tap to change photo'}</Text>
            </View>

            <Text style={s.sectionLabel}>PERSONAL INFORMATION</Text>
            <View style={s.infoCard}>
              <View style={s.fieldRow}>
                <View style={s.fieldHalf}>
                  <Text style={s.editFieldLabel}>First Name</Text>
                  <TextInput style={s.editInput} value={firstName} onChangeText={setFirstName} placeholder="First name" placeholderTextColor={C.brownMid + '80'} />
                </View>
                <View style={s.fieldHalf}>
                  <Text style={s.editFieldLabel}>Last Name</Text>
                  <TextInput style={s.editInput} value={lastName} onChangeText={setLastName} placeholder="Last name" placeholderTextColor={C.brownMid + '80'} />
                </View>
              </View>

              <Text style={s.editFieldLabel}>Email</Text>
              <TextInput
                style={s.editInput} value={email} onChangeText={setEmail}
                placeholder="you@email.com" placeholderTextColor={C.brownMid + '80'}
                keyboardType="email-address" autoCapitalize="none"
              />

              <Text style={s.editFieldLabel}>Contact Number</Text>
              <TextInput
                style={s.editInput} value={phone} onChangeText={setPhone}
                placeholder="+63 9XX XXX XXXX" placeholderTextColor={C.brownMid + '80'}
                keyboardType="phone-pad"
              />

              <Text style={s.editFieldLabel}>Gender</Text>
              <View style={s.genderRow}>
                {(['Female', 'Male'] as const).map((g) => (
                  <TouchableOpacity key={g} style={s.genderOption} activeOpacity={0.75} onPress={() => setGender(g)}>
                    <View style={[s.radio, gender === g && s.radioActive]}>{gender === g && <View style={s.radioDot} />}</View>
                    <Text style={s.radioLabel}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.editFieldLabel}>Date of Birth (optional)</Text>
              <TouchableOpacity style={s.editInput} activeOpacity={0.8} onPress={() => setDobPickerVisible(true)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: dateOfBirth ? C.brown : C.brownMid + '80' }}>
                    {dateOfBirth ? formatDobDisplay(dateOfBirth) : 'Select date of birth'}
                  </Text>
                  <CalendarIcon />
                </View>
              </TouchableOpacity>
            </View>

            {!!error && <Text style={s.errorText}>{error}</Text>}

            <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.7 }]} activeOpacity={0.85} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          </ScrollView>
        )}

        {toastVisible && (
          <Animated.View
            style={[
              s.toast,
              { bottom: insets.bottom + 20, opacity: toastAnim, transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
            ]}
          >
            <CheckCircleIcon />
            <Text style={s.toastText}>Profile updated successfully</Text>
          </Animated.View>
        )}
      </View>

      <DOBPickerModal
        visible={dobPickerVisible}
        value={dateOfBirth}
        onClose={() => setDobPickerVisible(false)}
        onSelect={setDateOfBirth}
      />

      <ChangePhotoModal
        visible={changePhotoVisible}
        onClose={() => setChangePhotoVisible(false)}
        onTakePhoto={() => launchPicker('camera')}
        onChooseLibrary={() => launchPicker('library')}
      />
      <PhotoUpdatedModal visible={photoUpdatedVisible} onClose={() => setPhotoUpdatedVisible(false)} />
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

  avatarSection: { alignItems: 'center', marginBottom: 20 },
  avatarWrap: { width: 92, height: 92, borderRadius: 46, position: 'relative' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 46 },
  avatarPlaceholder: {
    width: '100%', height: '100%', borderRadius: 46, backgroundColor: C.amber,
    alignItems: 'center', justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute', bottom: -2, right: -2, width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.brown, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: C.lightBg,
  },
  avatarSavingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 46,
    backgroundColor: 'rgba(59,26,12,0.45)', alignItems: 'center', justifyContent: 'center',
  },
  avatarHint: { fontSize: 11, fontWeight: '700', color: C.brownMid, opacity: 0.75, marginTop: 10 },

  sectionLabel: { fontSize: 10.5, fontWeight: '800', color: C.brownMid, opacity: 0.65, letterSpacing: 0.6, marginBottom: 8 },
  infoCard: {
    backgroundColor: C.cardBg, borderRadius: 14, padding: 10,
    borderWidth: 1, borderColor: C.divider,
  },

  fieldRow: { flexDirection: 'row', gap: 10 },
  fieldHalf: { flex: 1 },

  editFieldLabel: { fontSize: 10.5, fontWeight: '800', color: C.brownMid, opacity: 0.75, marginBottom: 6, marginTop: 12, marginHorizontal: 4 },
  editInput: {
    marginHorizontal: 4, backgroundColor: C.lightBg, borderRadius: 12, borderWidth: 1, borderColor: C.divider,
    paddingHorizontal: 13, paddingVertical: 11, fontSize: 13, color: C.brown, marginBottom: 4,
  },

  genderRow: { flexDirection: 'row', gap: 22, marginHorizontal: 4, marginTop: 2 },
  genderOption: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: C.divider, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: C.success },
  radioDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: C.success },
  radioLabel: { fontSize: 12.5, fontWeight: '600', color: C.brown },

  errorText: { color: C.danger, fontSize: 12, fontWeight: '700', marginTop: 12, marginHorizontal: 4 },

  saveBtn: {
    backgroundColor: C.amber, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, marginTop: 20,
  },
  saveBtnText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },

  toast: {
    position: 'absolute', left: 20, right: 20,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#12946F', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 6 },
    }),
  },
  toastText: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' },
});

const dp = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(59,26,12,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: {
    width: '100%', maxWidth: 340, maxHeight: '80%',
    backgroundColor: C.cardBg, borderRadius: 18, padding: 18,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 8 },
    }),
  },
  title: { fontSize: 15, fontWeight: '900', color: C.brown, marginBottom: 12 },

  navRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  monthBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.lightBg, borderWidth: 1, borderColor: C.divider, alignItems: 'center', justifyContent: 'center' },
  navArrow: { fontSize: 16, fontWeight: '900', color: C.brown, marginTop: -2 },
  monthLabel: { fontSize: 12.5, fontWeight: '800', color: C.brown, flex: 1 },
  yearBtn: { borderWidth: 1, borderColor: C.divider, backgroundColor: C.lightBg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  yearLabel: { fontSize: 12, fontWeight: '800', color: C.brown },

  yearMenu: { maxHeight: 260, marginTop: 10 },
  yearMenuItem: { paddingVertical: 10, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.divider },
  yearMenuItemText: { fontSize: 13, fontWeight: '700', color: C.brownMid },
  yearMenuItemTextActive: { color: C.amber, fontWeight: '900' },

  weekRow: { flexDirection: 'row', marginTop: 12 },
  weekLetter: { flex: 1, textAlign: 'center', fontSize: 9.5, fontWeight: '800', color: C.brownMid, opacity: 0.6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayBtn: { width: '78%', aspectRatio: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  dayBtnActive: { backgroundColor: C.amber },
  dayText: { fontSize: 11, fontWeight: '600', color: C.brown },
  dayTextDisabled: { color: C.brownMid, opacity: 0.3 },
  dayTextActive: { color: '#FFFFFF', fontWeight: '800' },

  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  cancelText: { fontSize: 12, fontWeight: '800', color: C.brownMid },
  applyBtn: { backgroundColor: C.brown, borderRadius: 12, paddingHorizontal: 22, paddingVertical: 10 },
  applyBtnText: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' },
});

const cp = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(59,26,12,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%', maxWidth: 340,
    backgroundColor: C.cardBg, borderRadius: 20, padding: 8, paddingTop: 20,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 12 },
    }),
  },
  title: { fontSize: 16, fontWeight: '900', color: C.brown, textAlign: 'center', paddingHorizontal: 14 },
  subtitle: { fontSize: 11.5, color: C.brownMid, opacity: 0.75, textAlign: 'center', marginTop: 3, marginBottom: 12, paddingHorizontal: 14 },

  optionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: C.divider,
  },
  optionIconWrap: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: C.lightBg,
    alignItems: 'center', justifyContent: 'center',
  },
  optionText: { fontSize: 13.5, fontWeight: '800', color: C.brown },

  cancelBtn: {
    marginTop: 8, borderTopWidth: 1, borderTopColor: C.divider,
    paddingVertical: 14, alignItems: 'center',
  },
  cancelText: { fontSize: 13, fontWeight: '800', color: C.danger },
});

const pu = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(59,26,12,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%', maxWidth: 320,
    backgroundColor: C.cardBg, borderRadius: 22,
    paddingHorizontal: 22, paddingVertical: 26,
    alignItems: 'center',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 12 },
    }),
  },
  iconCircle: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#EAF7EC', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { fontSize: 17, fontWeight: '900', color: C.brown, textAlign: 'center', marginBottom: 8 },
  message: { fontSize: 12, color: C.brownMid, textAlign: 'center', lineHeight: 18, opacity: 0.85, marginBottom: 20 },
  closeBtn: { width: '100%', borderRadius: 50, paddingVertical: 12, alignItems: 'center', backgroundColor: '#12946F' },
  closeBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12, letterSpacing: 0.6 },
});
