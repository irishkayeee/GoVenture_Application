/**
 * WelcomeModal.tsx
 * Shown once right after a successful login, before the dashboard content.
 */

import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { DancingScript_700Bold, useFonts } from '@expo-google-fonts/dancing-script';

const C = {
  brown:    '#3B1A0C',
  brownMid: '#6B3318',
  amber:    '#C46B1A',
  white:    '#FFFFFF',
  bg:       '#F8E4D5',
};

interface WelcomeModalProps {
  visible: boolean;
  onClose: () => void;
  emoji?:  string;
  title:   string;
  message: string;
}

export default function WelcomeModal({ visible, onClose, emoji = '✈️', title, message }: WelcomeModalProps) {
  const [fontsLoaded] = useFonts({ DancingScript_700Bold });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={s.backdrop}>
        <View style={s.card}>
          <View style={s.iconCircle}>
            <Text style={{ fontSize: 30 }}>{emoji}</Text>
          </View>
          <Text style={[
            s.title,
            fontsLoaded && { fontFamily: 'DancingScript_700Bold', fontWeight: 'normal' as const },
          ]}>
            {title}
          </Text>
          <Text style={s.message}>{message}</Text>
          <TouchableOpacity style={s.btn} activeOpacity={0.85} onPress={onClose}>
            <Text style={s.btnText}>CONTINUE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(59,26,12,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: C.white,
    borderRadius: 22,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 12 },
    }),
  },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: C.bg,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  title:   { fontSize: 26, fontWeight: '900', color: C.brown, textAlign: 'center', marginBottom: 8 },
  message: { fontSize: 12, color: C.brownMid, textAlign: 'center', lineHeight: 18, opacity: 0.85, marginBottom: 20 },
  btn: {
    backgroundColor: C.amber,
    borderRadius: 50,
    paddingHorizontal: 32,
    paddingVertical: 12,
    ...Platform.select({
      ios:     { shadowColor: C.amber, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 4 },
    }),
  },
  btnText: { color: C.white, fontWeight: '800', fontSize: 12, letterSpacing: 1.4 },
});
