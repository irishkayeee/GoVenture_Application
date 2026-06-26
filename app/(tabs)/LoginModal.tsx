/**
 * LoginModal.tsx
 * Modal shell that switches between LoginForm and SignUpForm.
 * Fonts, close button, tabs, and headline live here.
 */

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet,
  Dimensions, Platform, KeyboardAvoidingView,
  TouchableWithoutFeedback, Keyboard, ScrollView,
} from 'react-native';
import { useFonts, DancingScript_700Bold } from '@expo-google-fonts/dancing-script';
import { C, CloseIcon } from './Authshared';
import LoginForm  from './LoginForm';
import SignUpForm from './SignUpForm';
const { width } = Dimensions.get('window');
const CARD_W = Math.min(width * 0.88, 340);

/* ── Tab ── */
const Tab = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
  <TouchableOpacity style={[t.btn, active && t.btnActive]} onPress={onPress} activeOpacity={0.75}>
    <Text style={[t.label, active && t.labelActive]}>{label}</Text>
    {active && <View style={t.underline} />}
  </TouchableOpacity>
);
const t = StyleSheet.create({
  btn:         { flex: 1, alignItems: 'center', paddingVertical: 10, position: 'relative' },
  btnActive:   {},
  label:       { fontSize: 11.5, fontWeight: '700', color: C.brownMid, opacity: 0.5, letterSpacing: 0.5 },
  labelActive: { color: C.amber, opacity: 1 },
  underline:   { position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 2, backgroundColor: C.amber, borderRadius: 2 },
});

/* ══════════════════════════════════════════════════════════ */
interface LoginModalProps {
  visible:  boolean;
  onClose:  () => void;
}

export default function LoginModal({ visible, onClose }: LoginModalProps) {
  const [fontsLoaded] = useFonts({ DancingScript_700Bold });
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  const isLogin = activeTab === 'login';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={m.backdrop}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={m.card}>

                {/* ── Close Button ── */}
                <TouchableOpacity
                  style={m.closeBtn}
                  onPress={onClose}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <CloseIcon />
                </TouchableOpacity>

                {/* ── Headline ── */}
                <View style={m.headlineWrap}>
                  <Text style={[m.welcome, fontsLoaded && { fontFamily: 'DancingScript_700Bold' }]}>
                    {isLogin ? 'Welcome Back!' : 'Join Us!'}
                  </Text>
                  <Text style={m.spark}>✦</Text>
                </View>
                <Text style={m.sub}>
                  {isLogin
                    ? 'Log in to continue your adventure'
                    : 'Create your GoVenture account'}
                </Text>

                {/* ── Tabs ── */}
                <View style={m.tabRow}>
                  <Tab label="LOG IN"  active={isLogin}  onPress={() => setActiveTab('login')}  />
                  <Tab label="SIGN UP" active={!isLogin} onPress={() => setActiveTab('signup')} />
                </View>

                {/* ── Form (scrollable so keyboard doesn't clip) ── */}
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  style={m.formScroll}
                >
                  {isLogin
                    ? <LoginForm
                        onSwitchToSignUp={() => setActiveTab('signup')}
                        onSuccess={onClose}
                      />
                    : <SignUpForm
                        onSwitchToLogin={() => setActiveTab('login')}
                        onSuccess={onClose}
                      />
                  }
                  <View style={{ height: 8 }} />
                </ScrollView>

              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const m = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(59,26,12,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width:             CARD_W,
    backgroundColor:   C.white,
    borderRadius:      22,
    paddingHorizontal: 20,
    paddingTop:        28,
    paddingBottom:     20,
    position:          'relative',
    maxHeight:         '88%',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 12 },
    }),
  },
  closeBtn: {
    position:        'absolute',
    top:             12,
    right:           12,
    width:           28,
    height:          28,
    borderRadius:    14,
    backgroundColor: C.bg,
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          10,
  },
  headlineWrap: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'center',
    marginBottom:   2,
  },
  welcome: {
    fontSize:   27,
    fontWeight: '700',
    color:      C.brown,
    textAlign:  'center',
  },
  spark: {
    fontSize:   12,
    color:      C.amber,
    marginTop:  5,
    marginLeft: 2,
  },
  sub: {
    fontSize:     11,
    color:        C.brownMid,
    textAlign:    'center',
    opacity:      0.7,
    marginBottom: 14,
  },
  tabRow: {
    flexDirection:     'row',
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    marginBottom:      14,
  },
  formScroll: {
    flexGrow: 0,
  },
});