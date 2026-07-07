import React, { useState } from 'react';
import {
  ActivityIndicator, Platform,
  StyleSheet,
  Text, TouchableOpacity,
  View,
} from 'react-native';
import {
  AuthError,
  C,
  ErrorBanner,
  InputField,
  LockIcon,
  SuccessBanner,
  UserIcon,
  validateConfirmPass,
  validateFirstName, validateLastName,
  validatePassword,
} from './Authshared';

interface SignUpFormProps {
  onSwitchToLogin: () => void;
  onSuccess?:      () => void;
}

export default function SignUpForm({ onSwitchToLogin, onSuccess }: SignUpFormProps) {
  const [firstName,   setFirstName]   = useState('');
  const [lastName,    setLastName]    = useState('');
  const [password,    setPassword]    = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [errors,      setErrors]      = useState<AuthError>({});
  const [successMsg,  setSuccessMsg]  = useState('');

  /* ── Validation ── */
  const validate = (): boolean => {
    const e: AuthError = {
      firstName:   validateFirstName(firstName),
      lastName:    validateLastName(lastName),
      password:    validatePassword(password),
      confirmPass: validateConfirmPass(password, confirmPass),
    };
    setErrors(e);
    return !e.firstName && !e.lastName && !e.password && !e.confirmPass;
  };

  /* ── Submit ── */
  const handleSignUp = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    setSuccessMsg('');

    try {
      // 🔌 BACKEND — replace this block with your real API call
      // Example:
      // const res = await fetch('https://your-api.com/auth/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ firstName, lastName, password }),
      // });
      // const data = await res.json();
      // if (!res.ok) throw new Error(data.message || 'Registration failed.');

      // ── Simulated delay (remove when backend is ready) ──
      await new Promise(r => setTimeout(r, 1000));
      // ── End simulation ──

      setSuccessMsg('Account created! You can now log in.');
      setTimeout(() => {
        onSuccess?.();
        onSwitchToLogin();
      }, 1500);
    } catch (err: any) {
      // Map backend error messages to the right field or general banner
      const msg: string = err?.message || 'Something went wrong. Please try again.';
      if (msg.toLowerCase().includes('first'))     setErrors({ firstName: msg });
      else if (msg.toLowerCase().includes('last'))  setErrors({ lastName: msg });
      else                                          setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {/* Banners */}
      {!!errors.general && <ErrorBanner message={errors.general} />}
      {!!successMsg     && <SuccessBanner message={successMsg} />}

      <InputField
        icon={<UserIcon />}
        placeholder="First Name"
        value={firstName}
        onChangeText={t => { setFirstName(t); setErrors(p => ({ ...p, firstName: undefined })); }}
        errorMsg={errors.firstName}
      />

      <InputField
        icon={<UserIcon />}
        placeholder="Last Name"
        value={lastName}
        onChangeText={t => { setLastName(t); setErrors(p => ({ ...p, lastName: undefined })); }}
        errorMsg={errors.lastName}
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

      <InputField
        icon={<LockIcon />}
        placeholder="Confirm Password"
        value={confirmPass}
        onChangeText={t => { setConfirmPass(t); setErrors(p => ({ ...p, confirmPass: undefined })); }}
        secureEntry={!showConfirm}
        hasToggle
        toggleSecure={() => setShowConfirm(v => !v)}
        errorMsg={errors.confirmPass}
      />

      {/* Submit */}
      <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleSignUp} activeOpacity={0.85} disabled={loading}>
        {loading
          ? <ActivityIndicator color={C.white} size="small" />
          : <Text style={s.btnText}>CREATE ACCOUNT</Text>
        }
      </TouchableOpacity>

      {/* Switch to Login */}
      <View style={s.switchRow}>
        <Text style={s.switchText}>Already have an account? </Text>
        <TouchableOpacity onPress={onSwitchToLogin} activeOpacity={0.7}>
          <Text style={s.switchLink}>Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  btn: {
    backgroundColor: C.amber, borderRadius: 50, height: 42,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14, marginTop: 4,
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
