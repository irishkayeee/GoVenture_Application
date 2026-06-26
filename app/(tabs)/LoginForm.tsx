/**
 * LoginForm.tsx
 * Handles the Log In form with validation and backend-ready handlers.
 *
 * HOW TO WIRE YOUR BACKEND:
 *   Replace the `// 🔌 BACKEND` comment block in handleLogin() with your API call.
 *   The function already handles loading state, field errors, and general errors.
 */

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform,
} from 'react-native';
import {
  C, AuthError,
  EmailIcon, LockIcon, CheckIcon,
  InputField, ErrorBanner,
  validateEmail, validatePassword,
} from './Authshared';

interface LoginFormProps {
  onSwitchToSignUp: () => void;
  onSuccess?:       () => void; // called after successful login
}

export default function LoginForm({ onSwitchToSignUp, onSuccess }: LoginFormProps) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState<AuthError>({});

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
  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    try {
      // 🔌 BACKEND — replace this block with your real API call
      // Example:
      // const res = await fetch('https://your-api.com/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password }),
      // });
      // const data = await res.json();
      // if (!res.ok) throw new Error(data.message || 'Login failed.');
      // await AsyncStorage.setItem('token', data.token);

      // ── Simulated delay (remove when backend is ready) ──
      await new Promise(r => setTimeout(r, 1000));
      // ── End simulation ──

      onSuccess?.();
    } catch (err: any) {
      // Map backend error messages to the right field or general banner
      const msg: string = err?.message || 'Something went wrong. Please try again.';
      if (msg.toLowerCase().includes('email'))    setErrors({ email: msg });
      else if (msg.toLowerCase().includes('pass')) setErrors({ password: msg });
      else                                         setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {/* General error banner */}
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
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={s.forgot}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      {/* Submit */}
      <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleLogin} activeOpacity={0.85} disabled={loading}>
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
    </View>
  );
}

const s = StyleSheet.create({
  rememberRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, marginTop: 2 },
  rememberLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  checkbox:     { width: 16, height: 16, borderRadius: 4, borderWidth: 2, borderColor: C.amber, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: C.amber, borderColor: C.amber },
  rememberText: { fontSize: 11, color: C.amber, fontWeight: '600' },
  forgot:       { fontSize: 11, color: C.amber, fontWeight: '600' },
  btn: {
    backgroundColor: C.amber, borderRadius: 50, height: 44,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    ...Platform.select({
      ios:     { shadowColor: C.amber, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 4 },
    }),
  },
  btnDisabled: { opacity: 0.7 },
  btnText:     { color: C.white, fontWeight: '800', fontSize: 12, letterSpacing: 1.4 },
  switchRow:   { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  switchText:  { fontSize: 11, color: C.brownMid, opacity: 0.75 },
  switchLink:  { fontSize: 11, color: C.amber, fontWeight: '700' },
});