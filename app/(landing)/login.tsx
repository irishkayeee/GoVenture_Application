/**
 * app/(landing)/login.tsx
 * Full-screen Log In / Sign Up screen — the final step of the onboarding flow.
 */

import { DancingScript_700Bold, useFonts } from '@expo-google-fonts/dancing-script';
import React, { useMemo, useState } from 'react';
import {
  View, Text, Image, ScrollView,
  KeyboardAvoidingView, Platform, StyleSheet, StatusBar, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C } from '@/components/auth/Authshared';
import LoginForm from '@/components/auth/LoginForm';
import SignUpForm from '@/components/auth/SignUpForm';

const CONTENT_MAX_W = 440;

export default function LoginScreen() {
  const [fontsLoaded] = useFonts({ DancingScript_700Bold });
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const isLogin = activeTab === 'login';
  const { width } = useWindowDimensions();

  const s = useMemo(() => createStyles(width), [width]);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.contentWrap}>
            <Image
              source={require('../../assets/images/go_logo.png')}
              style={s.logo}
              resizeMode="contain"
            />

            <View style={s.headerIconWrap}>
              <Image
                source={require('../../assets/images/explore4.png')}
                style={s.headerIcon}
                resizeMode="cover"
              />
            </View>

            <View style={s.headlineWrap}>
              <Text style={[s.welcome, fontsLoaded && { fontFamily: 'DancingScript_700Bold', fontWeight: 'normal' as const }]}>
                {isLogin ? 'Welcome Back!' : 'Join Us!'}
              </Text>
              <Text style={s.spark}>✦</Text>
            </View>
            <Text style={s.sub}>
              {isLogin ? 'Log in to continue your adventure' : 'Create your GoVenture account'}
            </Text>

            {isLogin
              ? <LoginForm onSwitchToSignUp={() => setActiveTab('signup')} />
              : <SignUpForm onSwitchToLogin={() => setActiveTab('login')} />
            }
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ── Styles — recomputed whenever the window width changes ── */
function createStyles(width: number) {
  const logoW = Math.min(180, Math.max(130, width * 0.46));

  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24 },
    contentWrap: { width: '100%', maxWidth: CONTENT_MAX_W, alignSelf: 'center' },
    logo: { width: logoW, height: logoW * 0.5, alignSelf: 'center', marginBottom: -10 },
    headerIconWrap: {
      width: 190, height: 190, borderRadius: 95,
      alignSelf: 'center', marginBottom: -24,
      overflow: 'hidden',
    },
    headerIcon: { width: '100%', height: '100%' },
    headlineWrap: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginBottom: 4 },
    welcome: { fontSize: 34, fontWeight: '700', color: C.brown, textAlign: 'center' },
    spark: { fontSize: 15, color: C.amber, marginTop: 5, marginLeft: 3 },
    sub: { fontSize: 13.5, color: C.brownMid, textAlign: 'center', opacity: 0.7, marginBottom: 26 },
  });
}
