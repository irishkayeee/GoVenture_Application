import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

/* ── Colors ── */
export const C = {
  bg:       '#F8E4D5',
  brown:    '#3B1A0C',
  brownMid: '#6B3318',
  amber:    '#C46B1A',
  border:   '#C86820',
  white:    '#FFFFFF',
  divider:  '#E8C4A0',
  inputBg:  '#FFF8F2',
  error:    '#D64C1A',
  success:  '#2E7D32',
};

/* ── Shared Error/Success Types ── */
export interface AuthError {
  email?:       string;
  password?:    string;
  confirmPass?: string;
  fullName?:    string;
  firstName?:   string;
  lastName?:    string;
  general?:     string;
}

export interface AuthSuccess {
  message: string;
}

/* ── Validation Helpers (ready for backend wiring) ── */
export const validateEmail = (email: string): string | undefined => {
  if (!email.trim()) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
};

export const validatePassword = (password: string): string | undefined => {
  if (!password) return 'Password is required.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
};

export const validateConfirmPass = (pass: string, confirm: string): string | undefined => {
  if (!confirm) return 'Please confirm your password.';
  if (pass !== confirm) return 'Passwords do not match.';
};

export const validateFullName = (name: string): string | undefined => {
  if (!name.trim()) return 'Full name is required.';
  if (name.trim().length < 2) return 'Name must be at least 2 characters.';
};

export const validateFirstName = (name: string): string | undefined => {
  if (!name.trim()) return 'First name is required.';
  if (name.trim().length < 2) return 'First name must be at least 2 characters.';
};

export const validateLastName = (name: string): string | undefined => {
  if (!name.trim()) return 'Last name is required.';
  if (name.trim().length < 2) return 'Last name must be at least 2 characters.';
};

/* ── Icons ── */
export const EmailIcon = () => (
  <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      stroke={C.brownMid} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

export const LockIcon = () => (
  <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17 11H7a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2z"
      stroke={C.brownMid} strokeWidth={1.8} strokeLinejoin="round"
    />
    <Path
      d="M12 16a1 1 0 100-2 1 1 0 000 2zM8 11V7a4 4 0 018 0v4"
      stroke={C.brownMid} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

export const UserIcon = () => (
  <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
    <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={C.brownMid} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 11a4 4 0 100-8 4 4 0 000 8z" stroke={C.brownMid} strokeWidth={1.8} />
  </Svg>
);

export const EyeIcon = ({ visible }: { visible: boolean }) => (
  <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
    {visible ? (
      <>
        <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={C.brownMid} strokeWidth={1.8} strokeLinejoin="round" />
        <Path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke={C.brownMid} strokeWidth={1.8} />
      </>
    ) : (
      <Path
        d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"
        stroke={C.brownMid} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
      />
    )}
  </Svg>
);

export const CloseIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={C.brownMid} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const CheckIcon = () => (
  <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke={C.white} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/* ── InputField ── */
interface InputFieldProps {
  icon:          React.ReactNode;
  placeholder:   string;
  value:         string;
  onChangeText:  (t: string) => void;
  secureEntry?:  boolean;
  toggleSecure?: () => void;
  hasToggle?:    boolean;
  errorMsg?:     string;
  keyboardType?: 'default' | 'email-address';
}

export const InputField = ({
  icon, placeholder, value, onChangeText,
  secureEntry, toggleSecure, hasToggle,
  errorMsg, keyboardType = 'default',
}: InputFieldProps) => (
  <View style={inp.container}>
    <View style={[inp.wrap, !!errorMsg && inp.wrapError]}>
      <View style={inp.iconWrap}>{icon}</View>
      <TextInput
        style={inp.input}
        placeholder={placeholder}
        placeholderTextColor="rgba(107,51,24,0.38)"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureEntry}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={keyboardType}
      />
      {hasToggle && (
        <TouchableOpacity style={inp.eyeBtn} onPress={toggleSecure} activeOpacity={0.7}>
          <EyeIcon visible={!secureEntry} />
        </TouchableOpacity>
      )}
    </View>
    {!!errorMsg && <Text style={inp.errorText}>⚠ {errorMsg}</Text>}
  </View>
);

const inp = StyleSheet.create({
  container: { marginBottom: 10 },
  wrap:      { flexDirection: 'row', alignItems: 'center', backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.divider, borderRadius: 12, paddingHorizontal: 10, height: 44 },
  wrapError: { borderColor: C.error },
  iconWrap:  { width: 28, height: 28, borderRadius: 8, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  input:     { flex: 1, fontSize: 14, color: C.brown, fontWeight: '500' },
  eyeBtn:    { padding: 5 },
  errorText: { fontSize: 11, color: C.error, marginTop: 3, marginLeft: 4 },
});

/* ── General Error Banner ── */
export const ErrorBanner = ({ message }: { message: string }) => (
  <View style={eb.wrap}>
    <Text style={eb.text}>⚠ {message}</Text>
  </View>
);

export const SuccessBanner = ({ message }: { message: string }) => (
  <View style={sb.wrap}>
    <Text style={sb.text}>✓ {message}</Text>
  </View>
);

const eb = StyleSheet.create({
  wrap: { backgroundColor: '#FEE8E4', borderWidth: 1, borderColor: '#F5C0B4', borderRadius: 10, padding: 10, marginBottom: 10 },
  text: { fontSize: 11, color: C.error, fontWeight: '600', textAlign: 'center' },
});

const sb = StyleSheet.create({
  wrap: { backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#A5D6A7', borderRadius: 10, padding: 10, marginBottom: 10 },
  text: { fontSize: 11, color: C.success, fontWeight: '600', textAlign: 'center' },
});
