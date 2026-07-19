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
import { LOGIN_API_URL } from '@/constants/api';
import {
  C, AuthError,
  EmailIcon, LockIcon,
  InputField, ErrorBanner, OrDivider,
  validateEmail, validatePassword,
} from './Authshared';
import ForgotPasswordModal from './ForgotPasswordModal';

interface LoginFormProps {
  onSwitchToSignUp: () => void;
  onSuccess?:       () => void;
}

export default function LoginForm({ onSwitchToSignUp, onSuccess }: LoginFormProps) {
  const router = useRouter();

  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
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
      const response = await fetch(LOGIN_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const result = await response.json();

      if (result.status !== 'success') {
        setErrors({ general: result.message || 'Invalid email or password.' });
        return;
      }

      const isAdmin = result.data.role === 'admin';

      // Close the modal first, then navigate
      onSuccess?.();

      // Small timeout lets the modal finish closing before navigation
      setTimeout(() => {
        router.push((isAdmin ? '/admin-dashboard' : '/client-dashboard') as any);
      }, 150);

    } catch {
      setErrors({ general: "Can't connect to the server. Please check if XAMPP is running." });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    if (!validate()) return;
    performLogin(email, password);
  };

  return (
    <View>
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

      {/* Forgot password */}
      <View style={s.forgotRow}>
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

      <OrDivider />

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
  forgotRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12, marginTop: 2 },
  forgot:    { fontSize: 13, color: C.amber, fontWeight: '600' },
  btn: {
    backgroundColor: C.amber, borderRadius: 50, height: 34,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
    ...Platform.select({
      ios:     { shadowColor: C.amber, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 4 },
    }),
  },
  btnDisabled: { opacity: 0.7 },
  btnText:     { color: C.white, fontWeight: '800', fontSize: 12.5, letterSpacing: 1.4 },
  switchRow:   { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  switchText:  { fontSize: 13, color: C.brownMid, opacity: 0.75 },
  switchLink:  { fontSize: 13, color: C.amber, fontWeight: '700' },
});
