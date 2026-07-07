/**
 * AddStaffModal.tsx
 * Bottom-sheet form for creating a new Staff or Admin account — account type
 * toggle, name fields, email, optional contact info, and password.
 */

import React, { useMemo, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useAppTheme, ColorPalette } from '../ThemeContext';
import { Account, AccountRole } from './mockData';

const CloseIcon = ({ color }: { color: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const FieldLabel = ({ children, sm }: { children: React.ReactNode; sm: ReturnType<typeof makeStyles> }) => <Text style={sm.fieldLabel}>{children}</Text>;

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreate: (account: Account) => void;
};

export default function AddStaffModal({ visible, onClose, onCreate }: Props) {
  const { C } = useAppTheme();
  const sm = useMemo(() => makeStyles(C), [C]);
  const [accountType, setAccountType] = useState<'Staff' | 'Admin'>('Staff');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const isValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    password.length >= 8 &&
    password === confirmPassword;

  const reset = () => {
    setAccountType('Staff');
    setFirstName(''); setLastName(''); setMiddleName('');
    setEmail(''); setContactNumber(''); setAddress('');
    setPassword(''); setConfirmPassword('');
  };

  const handleClose = () => { onClose(); reset(); };

  const handleCreate = () => {
    if (!isValid) return;
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const initials = `${firstName.trim()[0] ?? ''}${lastName.trim()[0] ?? ''}`.toUpperCase();
    const account: Account = {
      id: `acct${Date.now()}`,
      name: fullName,
      initials,
      email: email.trim(),
      role: accountType as AccountRole,
      address: address.trim() || '—',
      cellphone: contactNumber.trim() || '—',
      createdDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    };
    onCreate(account);
    handleClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose} statusBarTranslucent>
      <View style={sm.backdrop}>
        <View style={sm.sheet}>
          <View style={sm.headerRow}>
            <Text style={sm.title}>Add Staff Account</Text>
            <TouchableOpacity style={sm.closeBtn} activeOpacity={0.8} onPress={handleClose}>
              <CloseIcon />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 480 }} keyboardShouldPersistTaps="handled">
            <FieldLabel>Account Type</FieldLabel>
            <View style={sm.typeRow}>
              {(['Staff', 'Admin'] as const).map((t) => {
                const isSelected = t === accountType;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[sm.typeBtn, isSelected && sm.typeBtnSelected]}
                    activeOpacity={0.8}
                    onPress={() => setAccountType(t)}
                  >
                    <Text style={[sm.typeBtnText, isSelected && sm.typeBtnTextSelected]}>{t}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={sm.row2}>
              <View style={{ flex: 1 }}>
                <FieldLabel>First Name</FieldLabel>
                <TextInput style={sm.input} value={firstName} onChangeText={setFirstName} placeholder="Juan" placeholderTextColor={C.brownMid + '80'} />
              </View>
              <View style={{ flex: 1 }}>
                <FieldLabel>Last Name</FieldLabel>
                <TextInput style={sm.input} value={lastName} onChangeText={setLastName} placeholder="Dela Cruz" placeholderTextColor={C.brownMid + '80'} />
              </View>
            </View>

            <FieldLabel>Middle Name (optional)</FieldLabel>
            <TextInput style={sm.input} value={middleName} onChangeText={setMiddleName} placeholder="" placeholderTextColor={C.brownMid + '80'} />

            <FieldLabel>Email</FieldLabel>
            <TextInput style={sm.input} value={email} onChangeText={setEmail} placeholder="name@goventure.com" placeholderTextColor={C.brownMid + '80'} autoCapitalize="none" keyboardType="email-address" />

            <View style={sm.row2}>
              <View style={{ flex: 1 }}>
                <FieldLabel>Contact Number (optional)</FieldLabel>
                <TextInput style={sm.input} value={contactNumber} onChangeText={setContactNumber} placeholder="+63 9XX XXX XXXX" placeholderTextColor={C.brownMid + '80'} keyboardType="phone-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <FieldLabel>Address (optional)</FieldLabel>
                <TextInput style={sm.input} value={address} onChangeText={setAddress} placeholder="City" placeholderTextColor={C.brownMid + '80'} />
              </View>
            </View>

            <View style={sm.row2}>
              <View style={{ flex: 1 }}>
                <FieldLabel>Password</FieldLabel>
                <TextInput style={sm.input} value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor={C.brownMid + '80'} secureTextEntry />
              </View>
              <View style={{ flex: 1 }}>
                <FieldLabel>Confirm Password</FieldLabel>
                <TextInput style={sm.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="••••••••" placeholderTextColor={C.brownMid + '80'} secureTextEntry />
              </View>
            </View>
            <Text style={sm.hintText}>At least 8 characters, with letters and numbers. A username will be generated automatically.</Text>
          </ScrollView>

          <View style={sm.footerRow}>
            <TouchableOpacity style={sm.cancelBtn} activeOpacity={0.8} onPress={handleClose}>
              <Text style={sm.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[sm.createBtn, !isValid && sm.createBtnDisabled]}
              activeOpacity={0.85}
              disabled={!isValid}
              onPress={handleCreate}
            >
              <Text style={sm.createText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (C: ColorPalette) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(59,26,12,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingHorizontal: 18, paddingTop: 18, paddingBottom: 30,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  title: { fontSize: 16, fontWeight: '900', color: C.brown },
  closeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.lightBg, alignItems: 'center', justifyContent: 'center' },

  fieldLabel: { fontSize: 10.5, fontWeight: '800', color: C.brownMid, opacity: 0.75, marginBottom: 6, marginTop: 12 },
  row2: { flexDirection: 'row', gap: 10 },
  input: {
    backgroundColor: C.lightBg, borderRadius: 12, borderWidth: 1, borderColor: C.divider,
    paddingHorizontal: 13, paddingVertical: 11, fontSize: 13, color: C.brown,
  },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12,
    borderRadius: 12, borderWidth: 1.5, borderColor: C.divider, backgroundColor: C.lightBg,
  },
  typeBtnSelected: { borderColor: '#12946F', backgroundColor: '#E7F9F3' },
  typeBtnText: { fontSize: 12.5, fontWeight: '700', color: C.brownMid },
  typeBtnTextSelected: { color: '#12946F', fontWeight: '900' },
  hintText: { fontSize: 10, color: C.brownMid, opacity: 0.65, marginTop: 10, lineHeight: 15 },

  footerRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  cancelBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: 22, borderWidth: 1.5, borderColor: C.divider },
  cancelText: { fontSize: 13, fontWeight: '800', color: C.brownMid },
  createBtn: {
    flex: 1.6, alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: 22,
    backgroundColor: C.amber,
    ...Platform.select({
      ios:     { shadowColor: C.amber, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 2 },
    }),
  },
  createBtnDisabled: { opacity: 0.5 },
  createText: { fontSize: 12.5, fontWeight: '800', color: C.white },
});
