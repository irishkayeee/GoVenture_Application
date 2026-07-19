/**
 * app/(landing)/login.tsx
 * Full-screen Log In / Sign Up screen — the final step of the onboarding flow.
 */

import { DancingScript_700Bold, useFonts } from '@expo-google-fonts/dancing-script';
import React, { useMemo, useState } from 'react';
import {
  View, Text, Image,
  KeyboardAvoidingView, Platform, StyleSheet, StatusBar, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C } from '@/components/auth/Authshared';
import LoginForm from '@/components/auth/LoginForm';
import SignUpForm from '@/components/auth/SignUpForm';

const CONTENT_MAX_W = 440;
const FOOTER_ASPECT = 1774 / 887;

export default function LoginScreen() {
  const [fontsLoaded] = useFonts({ DancingScript_700Bold });
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const isLogin = activeTab === 'login';
  const { width } = useWindowDimensions();

  const s = useMemo(() => createStyles(width), [width]);

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={s.flex}
        >
          <View style={[s.contentOuter, !isLogin && s.contentOuterTop]}>
            <View style={s.contentWrap}>
              <Image
                source={require('../../assets/images/go_logo.png')}
                style={[s.logo, !isLogin && s.logoTight]}
                resizeMode="contain"
              />

              <View style={s.card}>
                <View style={s.headlineWrap}>
                  <Text style={[s.welcome, fontsLoaded && { fontFamily: 'DancingScript_700Bold', fontWeight: 'normal' as const }]}>
                    {isLogin ? 'Welcome Back!' : 'Join Us!'}
                  </Text>
                  <Text style={s.spark}>✦</Text>
                </View>
                <Text style={s.sub}>
                  {isLogin ? 'Log in to continue your adventure' : 'Create your GoVenture account'}
                </Text>
                <View style={s.cardUnderline} />

                {isLogin
                  ? <LoginForm onSwitchToSignUp={() => setActiveTab('signup')} />
                  : <SignUpForm onSwitchToLogin={() => setActiveTab('login')} />
                }
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {isLogin && (
        <View style={s.footerFixed} pointerEvents="none">
          <Image
            source={require('../../assets/images/loginfooter.png')}
            style={{ width, height: (width / FOOTER_ASPECT) * 1.4 }}
            resizeMode="cover"
          />
        </View>
      )}
    </View>
  );
}

/* ── Styles — recomputed whenever the window width changes ── */
function createStyles(width: number) {
  const logoW = Math.min(180, Math.max(130, width * 0.44));
  const welcomeSize = width >= 400 ? 34 : width >= 360 ? 30 : 26;

  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    safe: { flex: 1, backgroundColor: C.bg, paddingTop: 12, zIndex: 2 },
    flex: { flex: 1 },
    // Card sits above the footer image (zIndex 2) so its bottom content
    // (e.g. the "Sign Up" switch link) never gets covered by it.
    footerFixed: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 1 },
    contentOuter: { flex: 1, justifyContent: 'center' },
    contentOuterTop: { justifyContent: 'flex-start', paddingTop: 40 },
    contentWrap: { width: '100%', maxWidth: CONTENT_MAX_W, alignSelf: 'center', paddingHorizontal: 24 },
    logo: { width: logoW, height: logoW * (593 / 981), alignSelf: 'center', marginBottom: 24 },
    logoTight: { marginBottom: 24 },
    headlineWrap: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginBottom: 4 },
    welcome: { fontSize: welcomeSize, fontWeight: '700', color: C.brown, textAlign: 'center' },
    spark: { fontSize: 15, color: C.amber, marginTop: 5, marginLeft: 3 },
    sub: { fontSize: 13.5, color: C.brownMid, textAlign: 'center', opacity: 0.7, marginBottom: 10 },
    card: {
      backgroundColor: '#FFF8F2',
      borderRadius: 24,
      padding: 16,
      ...Platform.select({
        ios:     { shadowColor: '#3B1A0C', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
        android: { elevation: 6 },
      }),
    },
    cardUnderline: { width: 40, height: 3, borderRadius: 2, backgroundColor: C.amber, alignSelf: 'center', marginTop: 8, marginBottom: 14 },
  });
}
