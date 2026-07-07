/**
 * AddPaymentMethodModal.tsx
 * Bottom-sheet form for registering a QR payment method (GCash, Maya, or
 * Bank Transfer) — method selector, account name, and a QR image dropzone
 * placeholder.
 */

import React, { useMemo, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useAppTheme, ColorPalette } from '../ThemeContext';
import { PaymentMethod, QRPaymentMethod } from './mockData';

const CloseIcon = ({ color }: { color: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);
const CameraIcon = ({ color }: { color: string }) => (
  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
    <Path d="M4 8a2 2 0 012-2h1.5l1-1.5h7l1 1.5H18a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
    <Path d="M12 16a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" stroke={color} strokeWidth={1.7} />
  </Svg>
);

const METHODS: PaymentMethod[] = ['GCash', 'Maya', 'Bank Transfer'];

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave:  (method: QRPaymentMethod) => void;
};

export default function AddPaymentMethodModal({ visible, onClose, onSave }: Props) {
  const { C } = useAppTheme();
  const pm = useMemo(() => makeStyles(C), [C]);
  const [method, setMethod] = useState<PaymentMethod>('GCash');
  const [accountName, setAccountName] = useState('');

  const handleClose = () => {
    onClose();
    setMethod('GCash');
    setAccountName('');
  };

  const handleSave = () => {
    if (!accountName.trim()) return;
    onSave({ id: `qr${Date.now()}`, method, accountName: accountName.trim() });
    handleClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose} statusBarTranslucent>
      <View style={pm.backdrop}>
        <View style={pm.sheet}>
          <View style={pm.headerRow}>
            <Text style={pm.title}>Add Payment Method</Text>
            <TouchableOpacity style={pm.closeBtn} activeOpacity={0.8} onPress={handleClose}>
              <CloseIcon color={C.brownMid} />
            </TouchableOpacity>
          </View>

          <Text style={pm.fieldLabel}>METHOD</Text>
          <View style={pm.methodRow}>
            {METHODS.map((m) => {
              const isSelected = m === method;
              return (
                <TouchableOpacity
                  key={m}
                  style={[pm.methodBtn, isSelected && pm.methodBtnSelected]}
                  activeOpacity={0.8}
                  onPress={() => setMethod(m)}
                >
                  <Text style={[pm.methodBtnText, isSelected && pm.methodBtnTextSelected]} numberOfLines={1}>{m}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={pm.fieldLabel}>ACCOUNT NAME</Text>
          <TextInput
            style={pm.input}
            placeholder="e.g. GoVenture Travel & Tours"
            placeholderTextColor={C.brownMid + '80'}
            value={accountName}
            onChangeText={setAccountName}
          />

          <Text style={pm.fieldLabel}>QR CODE</Text>
          <View style={pm.dropzone}>
            <CameraIcon color={C.amber} />
            <Text style={pm.dropzoneTitle}>Upload your QR image here</Text>
            <Text style={pm.dropzoneHint}>Tap to browse your files</Text>
          </View>
          <Text style={pm.acceptedText}>Accepted: JPG, PNG, WEBP · Max: 5 MB</Text>

          <View style={pm.footerRow}>
            <TouchableOpacity style={pm.cancelBtn} activeOpacity={0.8} onPress={handleClose}>
              <Text style={pm.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[pm.saveBtn, !accountName.trim() && pm.saveBtnDisabled]}
              activeOpacity={0.85}
              onPress={handleSave}
              disabled={!accountName.trim()}
            >
              <Text style={pm.saveText}>Save Payment Method</Text>
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
    backgroundColor: C.cardBg,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingHorizontal: 18, paddingTop: 18, paddingBottom: 30,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 16, fontWeight: '900', color: C.brown },
  closeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.lightBg, alignItems: 'center', justifyContent: 'center' },

  fieldLabel: { fontSize: 10, fontWeight: '800', color: C.brownMid, opacity: 0.7, letterSpacing: 0.5, marginBottom: 8, marginTop: 14 },
  methodRow: { flexDirection: 'row', gap: 8 },
  methodBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12,
    borderRadius: 12, borderWidth: 1.5, borderColor: C.divider, backgroundColor: C.lightBg,
  },
  methodBtnSelected: { borderColor: '#12946F', backgroundColor: '#E7F9F3' },
  methodBtnText: { fontSize: 12, fontWeight: '700', color: C.brownMid },
  methodBtnTextSelected: { color: '#12946F', fontWeight: '900' },

  input: {
    backgroundColor: C.lightBg, borderRadius: 12, borderWidth: 1, borderColor: C.divider,
    paddingHorizontal: 13, paddingVertical: 12, fontSize: 13, color: C.brown,
  },

  dropzone: {
    borderWidth: 1.5, borderColor: C.divider, borderStyle: 'dashed', borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', paddingVertical: 28, gap: 4,
    backgroundColor: C.lightBg,
  },
  dropzoneTitle: { fontSize: 12.5, fontWeight: '800', color: C.brown, marginTop: 4 },
  dropzoneHint: { fontSize: 11, color: C.amber, fontWeight: '700' },
  acceptedText: { fontSize: 10, color: C.brownMid, opacity: 0.6, marginTop: 6 },

  footerRow: { flexDirection: 'row', gap: 10, marginTop: 22 },
  cancelBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: 22, borderWidth: 1.5, borderColor: C.divider },
  cancelText: { fontSize: 13, fontWeight: '800', color: C.brownMid },
  saveBtn: {
    flex: 1.6, alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: 22,
    backgroundColor: C.amber,
    ...Platform.select({
      ios:     { shadowColor: C.amber, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 2 },
    }),
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveText: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' },
});
