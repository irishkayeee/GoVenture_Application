/**
 * LogoutConfirmModal.tsx
 * Confirmation dialog shown before logging out, mirroring the admin
 * dashboard's LogoutConfirmModal.
 */

import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { C } from './theme';

const LogoutIcon = () => (
  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
    <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="#E5473A" strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M16 17l5-5-5-5M21 12H9" stroke="#E5473A" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

type Props = { visible: boolean; onCancel: () => void; onConfirm: () => void };

export default function LogoutConfirmModal({ visible, onCancel, onConfirm }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={lc.backdrop}>
        <View style={lc.card}>
          <View style={lc.iconCircle}>
            <LogoutIcon />
          </View>
          <Text style={lc.title}>Log Out?</Text>
          <Text style={lc.message}>Are you sure you want to log out of your GoVenture account?</Text>
          <View style={lc.btnRow}>
            <TouchableOpacity style={[lc.btn, lc.cancelBtn]} activeOpacity={0.85} onPress={onCancel}>
              <Text style={lc.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[lc.btn, lc.confirmBtn]} activeOpacity={0.85} onPress={onConfirm}>
              <Text style={lc.confirmText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const lc = StyleSheet.create({
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
  iconCircle: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#FCE4E1', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title:   { fontSize: 18, fontWeight: '900', color: C.brown, textAlign: 'center', marginBottom: 8 },
  message: { fontSize: 12, color: C.brownMid, textAlign: 'center', lineHeight: 18, opacity: 0.85, marginBottom: 20 },
  btnRow:  { flexDirection: 'row', gap: 10, width: '100%' },
  btn:     { flex: 1, borderRadius: 50, paddingVertical: 12, alignItems: 'center' },
  cancelBtn:   { backgroundColor: C.lightBg, borderWidth: 1, borderColor: C.divider },
  cancelText:  { color: C.brownMid, fontWeight: '800', fontSize: 12, letterSpacing: 0.6 },
  confirmBtn:  { backgroundColor: '#E5473A' },
  confirmText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12, letterSpacing: 0.6 },
});
