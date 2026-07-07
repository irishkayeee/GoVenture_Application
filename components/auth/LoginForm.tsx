/**
 * LoginForm.tsx
 * Handles the Log In form with validation.
 */

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  C, AuthError,
  EmailIcon, LockIcon, CheckIcon,
  InputField, ErrorBanner,
  validateEmail, validatePassword,
} from './Authshared';
import ForgotPasswordModal from './ForgotPasswordModal';

/* ─────────────────────────────────────────────
   Hardcoded demo credentials.
   Replace with your real API response check.
───────────────────────────────────────────── */
const ADMIN_EMAIL    = 'admin@goventure.com';
const ADMIN_PASSWORD = 'Admin@123';

const CLIENT_EMAIL    = 'client@goventure.com';
const CLIENT_PASSWORD = 'Client@123';

interface LoginFormProps {
  onSwitchToSignUp: () => void;
  onSuccess?:       () => void;
}

export default function LoginForm({ onSwitchToSignUp, onSuccess }: LoginFormProps) {
  const router = useRouter();

  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [remember,   setRemember]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [errors,     setErrors]     = useState<AuthError>({});
  const [showForgot, setShowForgot] = useState(false);

  /* ── Validation ── */
  const validate = (): boolean => {
    const e: AuthError = {
      email:    validateEmail(email),
      password: validatePassword(password),
    };
    setErrors(e);
    return !e.email && !e.password;
  };

  /* ── Submit ── */
  const performLogin = async (loginEmail: string, loginPassword: string) => {
    setLoading(true);
    setErrors({});

    try {
      // 🔌 BACKEND — replace this block with your real API call
      // const res = await fetch('https://your-api.com/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      // });
      // const data = await res.json();
      // if (!res.ok) throw new Error(data.message || 'Login failed.');
      // const isAdmin = data.role === 'admin';

      await new Promise(r => setTimeout(r, 1000)); // simulated network delay

      const normalizedEmail = loginEmail.trim().toLowerCase();
      const isAdmin  = normalizedEmail === ADMIN_EMAIL.toLowerCase()  && loginPassword === ADMIN_PASSWORD;
      const isClient = normalizedEmail === CLIENT_EMAIL.toLowerCase() && loginPassword === CLIENT_PASSWORD;

      if (!isAdmin && !isClient) {
        setErrors({ general: 'Invalid email or password.' });
        return;
      }

      // Close the modal first, then navigate
      onSuccess?.();

      // Small timeout lets the modal finish closing before navigation
      setTimeout(() => {
        router.push((isAdmin ? '/admin-dashboard' : '/client-dashboard') as any);
      }, 150);

    } catch (err: any) {
      const msg: string = err?.message || 'Something went wrong. Please try again.';
      if (msg.toLowerCase().includes('email'))     setErrors({ email: msg });
      else if (msg.toLowerCase().includes('pass')) setErrors({ password: msg });
      else                                         setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    if (!validate()) return;
    performLogin(email, password);
  };

  const handleDemoLogin = (role: 'admin' | 'client') => {
    const demoEmail    = role === 'admin' ? ADMIN_EMAIL    : CLIENT_EMAIL;
    const demoPassword = role === 'admin' ? ADMIN_PASSWORD : CLIENT_PASSWORD;
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrors({});
    performLogin(demoEmail, demoPassword);
  };

  return (
    <View>
      {/* Demo login shortcuts — remove this block once real auth/database is wired up */}
      <View style={s.demoBox}>
        <Text style={s.demoTitle}>QUICK DEMO LOGIN</Text>
        <View style={s.demoBtnRow}>
          <TouchableOpacity
            style={s.demoBtn}
            activeOpacity={0.85}
            disabled={loading}
            onPress={() => handleDemoLogin('admin')}
          >
            <Text style={s.demoBtnText}>Log in as Admin</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.demoBtn, s.demoBtnOutline]}
            activeOpacity={0.85}
            disabled={loading}
            onPress={() => handleDemoLogin('client')}
          >
            <Text style={[s.demoBtnText, s.demoBtnTextOutline]}>Log in as Client</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!!errors.general && <ErrorBanner message={errors.general} />}

      <InputField
        icon={<EmailIcon />}
        placeholder="Email Address"
        value={email}
        onChangeText={t => { setEmail(t); setErrors(p => ({ ...p, email: undefined })); }}
        errorMsg={errors.email}
        keyboardType="email-address"
      />

      <InputField
        icon={<LockIcon />}
        placeholder="Password"
        value={password}
        onChangeText={t => { setPassword(t); setErrors(p => ({ ...p, password: undefined })); }}
        secureEntry={!showPass}
        hasToggle
        toggleSecure={() => setShowPass(v => !v)}
        errorMsg={errors.password}
      />

      {/* Remember / Forgot row */}
      <View style={s.rememberRow}>
        <TouchableOpacity style={s.rememberLeft} onPress={() => setRemember(r => !r)} activeOpacity={0.7}>
          <View style={[s.checkbox, remember && s.checkboxActive]}>
            {remember && <CheckIcon />}
          </View>
          <Text style={s.rememberText}>Remember me</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={() => setShowForgot(true)}>
          <Text style={s.forgot}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[s.btn, loading && s.btnDisabled]}
        onPress={handleLogin}
        activeOpacity={0.85}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color={C.white} size="small" />
          : <Text style={s.btnText}>LOG IN</Text>
        }
      </TouchableOpacity>

      {/* Switch to Sign Up */}
      <View style={s.switchRow}>
        <Text style={s.switchText}>Don't have an account? </Text>
        <TouchableOpacity onPress={onSwitchToSignUp} activeOpacity={0.7}>
          <Text style={s.switchLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      <ForgotPasswordModal
        visible={showForgot}
        onClose={() => setShowForgot(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  demoBox:      { backgroundColor: '#FFF3E8', borderWidth: 1, borderColor: C.divider, borderRadius: 10, padding: 10, marginBottom: 14 },
  demoTitle:    { fontSize: 9, fontWeight: '800', color: C.amber, letterSpacing: 0.8, marginBottom: 7 },
  demoBtnRow:   { flexDirection: 'row', gap: 8 },
  demoBtn:      { flex: 1, backgroundColor: C.amber, borderRadius: 10, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  demoBtnOutline:     { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: C.amber },
  demoBtnText:        { fontSize: 10.5, fontWeight: '800', color: C.white },
  demoBtnTextOutline: { color: C.amber },
  rememberRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, marginTop: 4 },
  rememberLeft:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox:       { width: 19, height: 19, borderRadius: 5, borderWidth: 2, borderColor: C.amber, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: C.amber, borderColor: C.amber },
  rememberText:   { fontSize: 13, color: C.amber, fontWeight: '600' },
  forgot:         { fontSize: 13, color: C.amber, fontWeight: '600' },
  btn: {
    backgroundColor: C.amber, borderRadius: 50, height: 42,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    ...Platform.select({
      ios:     { shadowColor: C.amber, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 4 },
    }),
  },
  btnDisabled: { opacity: 0.7 },
  btnText:     { color: C.white, fontWeight: '800', fontSize: 15, letterSpacing: 1.4 },
  switchRow:   { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  switchText:  { fontSize: 13, color: C.brownMid, opacity: 0.75 },
  switchLink:  { fontSize: 13, color: C.amber, fontWeight: '700' },
});
