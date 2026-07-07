/**
 * ForgotPasswordModal.tsx
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  useWindowDimensions,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useFonts, DancingScript_700Bold } from '@expo-google-fonts/dancing-script';
import { C, CloseIcon, EmailIcon, LockIcon, EyeIcon } from './Authshared';

/* ── Step Indicator ── */
const StepIndicator = ({ current }: { current: number }) => (
  <View style={si.row}>
    {[1, 2, 3].map((step) => (
      <React.Fragment key={step}>
        <View style={[si.dot, current >= step && si.dotActive]}>
          <Text style={[si.dotText, current >= step && si.dotTextActive]}>{step}</Text>
        </View>
        {step < 3 && (
          <View style={[si.line, current > step && si.lineActive]} />
        )}
      </React.Fragment>
    ))}
  </View>
);
const si = StyleSheet.create({
  row:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  dot:           { width: 26, height: 26, borderRadius: 13, backgroundColor: '#F0E4D8', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.divider },
  dotActive:     { backgroundColor: C.amber, borderColor: C.amber },
  dotText:       { fontSize: 10, fontWeight: '800', color: C.brownMid },
  dotTextActive: { color: C.white },
  line:          { flex: 1, height: 2, backgroundColor: C.divider, marginHorizontal: 4 },
  lineActive:    { backgroundColor: C.amber },
});

/* ── Field ── */
const Field = ({
  label, placeholder, value, onChangeText, icon, secureEntry = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  icon: React.ReactNode;
  secureEntry?: boolean;
}) => {
  const [show, setShow] = useState(false);
  return (
    <View style={fi.wrap}>
      <Text style={fi.label}>{label}</Text>
      <View style={fi.row}>
        <View style={fi.iconWrap}>{icon}</View>
        <TextInput
          style={fi.input}
          placeholder={placeholder}
          placeholderTextColor="rgba(107,51,24,0.35)"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureEntry && !show}
          autoCapitalize="none"
          keyboardType={label.toLowerCase().includes('email') ? 'email-address' : 'default'}
        />
        {secureEntry && (
          <TouchableOpacity onPress={() => setShow(p => !p)} style={fi.eyeBtn}>
            <EyeIcon visible={show} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
const fi = StyleSheet.create({
  wrap:    { marginBottom: 14 },
  label:   { fontSize: 10.5, fontWeight: '700', color: C.brown, marginBottom: 5, letterSpacing: 0.3 },
  row:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDF5EE', borderWidth: 1.5, borderColor: C.divider, borderRadius: 12, paddingHorizontal: 12, height: 46 },
  iconWrap:{ marginRight: 8 },
  input:   { flex: 1, fontSize: 13, color: C.brown, fontWeight: '500' },
  eyeBtn:  { padding: 4 },
});

/* ── OTP Input ── */
const OTPInput = ({ value, onChange }: { value: string; onChange: (t: string) => void }) => {
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');
  return (
    <View style={oi.row}>
      {digits.map((d, i) => (
        <View key={i} style={[oi.box, !!d && oi.boxFilled]}>
          <Text style={oi.digit}>{d || '·'}</Text>
        </View>
      ))}
      <TextInput
        style={oi.hidden}
        value={value}
        onChangeText={t => onChange(t.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
      />
    </View>
  );
};
const oi = StyleSheet.create({
  row:       { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 16, position: 'relative' },
  box:       { width: 42, height: 50, borderRadius: 10, borderWidth: 1.5, borderColor: C.divider, backgroundColor: '#FDF5EE', alignItems: 'center', justifyContent: 'center' },
  boxFilled: { borderColor: C.amber, backgroundColor: '#FFF3E8' },
  digit:     { fontSize: 20, fontWeight: '700', color: C.brown },
  hidden:    { position: 'absolute', opacity: 0, width: '100%', height: '100%' },
});

/* ── Primary Button ── */
const PrimaryBtn = ({
  label, onPress, loading = false,
}: { label: string; onPress: () => void; loading?: boolean }) => (
  <TouchableOpacity style={pb.btn} onPress={onPress} activeOpacity={0.85} disabled={loading}>
    {loading
      ? <ActivityIndicator color={C.white} />
      : <Text style={pb.label}>{label}</Text>
    }
  </TouchableOpacity>
);
const pb = StyleSheet.create({
  btn:   { backgroundColor: C.amber, borderRadius: 50, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', marginTop: 4, ...Platform.select({ ios: { shadowColor: C.amber, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 4 } }) },
  label: { color: C.white, fontWeight: '800', fontSize: 12, letterSpacing: 1.2 },
});

/* ══════════════════════════════════════════════════════════ */
interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ visible, onClose }: ForgotPasswordModalProps) {
  const [fontsLoaded] = useFonts({ DancingScript_700Bold });
  const { width } = useWindowDimensions();
  const cardW = Math.min(width * 0.88, 340);

  const [step,        setStep]        = useState<1 | 2 | 3>(1);
  const [email,       setEmail]       = useState('');
  const [otp,         setOtp]         = useState('');
  const [newPass,     setNewPass]     = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  const reset = () => {
    setStep(1); setEmail(''); setOtp('');
    setNewPass(''); setConfirmPass('');
    setError(''); setLoading(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const fakeAsync = (cb: () => void) => {
    setLoading(true);
    setTimeout(() => { setLoading(false); cb(); }, 1200);
  };

  const handleSendOTP = () => {
    if (!email.includes('@')) { setError('Please enter a valid email address.'); return; }
    setError('');
    fakeAsync(() => setStep(2));
  };

  const handleVerifyOTP = () => {
    if (otp.length < 6) { setError('Please enter the 6-digit code.'); return; }
    setError('');
    fakeAsync(() => setStep(3));
  };

  const handleResetPassword = () => {
    if (newPass.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPass !== confirmPass) { setError('Passwords do not match.'); return; }
    setError('');
    fakeAsync(() => handleClose());
  };

  const stepTitles: Record<1 | 2 | 3, { script: string; sub: string }> = {
    1: { script: 'Forgot Password?',  sub: 'Enter your email to receive a reset code' },
    2: { script: 'Check Your Email!', sub: `We sent a 6-digit code to ${email}` },
    3: { script: 'New Password',      sub: 'Create a strong new password' },
  };
  const { script, sub } = stepTitles[step];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={m.backdrop}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={[m.card, { width: cardW }]}>

                {/* Close */}
                <TouchableOpacity
                  style={m.closeBtn} onPress={handleClose} activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <CloseIcon />
                </TouchableOpacity>

                {/* Headline */}
                <View style={m.headlineWrap}>
                  <Text style={[m.scriptTitle, fontsLoaded && { fontFamily: 'DancingScript_700Bold', fontWeight: 'normal' as const }]}>
                    {script}
                  </Text>
                  <Text style={m.spark}>✦</Text>
                </View>
                <Text style={m.sub}>{sub}</Text>

                {/* Step Indicator */}
                <StepIndicator current={step} />

                {/* Error */}
                {!!error && (
                  <View style={m.errorBanner}>
                    <Text style={m.errorText}>⚠ {error}</Text>
                  </View>
                )}

                {/* Step 1: Email */}
                {step === 1 && (
                  <View>
                    <Field
                      label="EMAIL ADDRESS"
                      placeholder="you@example.com"
                      value={email}
                      onChangeText={setEmail}
                      icon={<EmailIcon />}
                    />
                    <PrimaryBtn label="SEND RESET CODE →" onPress={handleSendOTP} loading={loading} />
                  </View>
                )}

                {/* Step 2: OTP */}
                {step === 2 && (
                  <View>
                    <Text style={m.otpHint}>Enter the 6-digit code</Text>
                    <OTPInput value={otp} onChange={setOtp} />
                    <PrimaryBtn label="VERIFY CODE →" onPress={handleVerifyOTP} loading={loading} />
                    <TouchableOpacity style={m.resendRow} onPress={() => fakeAsync(() => {})}>
                      <Text style={m.resendText}>Didn't receive it? </Text>
                      <Text style={m.resendLink}>Resend code</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Step 3: New Password */}
                {step === 3 && (
                  <View>
                    <Field
                      label="NEW PASSWORD"
                      placeholder="Min. 6 characters"
                      value={newPass}
                      onChangeText={setNewPass}
                      icon={<LockIcon />}
                      secureEntry
                    />
                    <Field
                      label="CONFIRM PASSWORD"
                      placeholder="Re-enter password"
                      value={confirmPass}
                      onChangeText={setConfirmPass}
                      icon={<LockIcon />}
                      secureEntry
                    />
                    <PrimaryBtn label="RESET PASSWORD ✓" onPress={handleResetPassword} loading={loading} />
                  </View>
                )}

                {/* Back */}
                {step > 1 && (
                  <TouchableOpacity
                    style={m.backRow}
                    onPress={() => { setError(''); setStep((step - 1) as 1 | 2); }}
                  >
                    <Text style={m.backText}>← Back</Text>
                  </TouchableOpacity>
                )}

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
    backgroundColor:   C.white,
    borderRadius:      22,
    paddingHorizontal: 20,
    paddingTop:        28,
    paddingBottom:     24,
    position:          'relative',
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
  scriptTitle: {
    fontSize:   26,
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
    marginBottom: 16,
  },
  otpHint: {
    fontSize:     11,
    color:        C.brownMid,
    textAlign:    'center',
    opacity:      0.7,
    marginBottom: 4,
  },
  errorBanner: {
    backgroundColor: '#FFF0ED',
    borderWidth:     1,
    borderColor:     '#F5C6B8',
    borderRadius:    10,
    paddingHorizontal: 12,
    paddingVertical:   8,
    marginBottom:    12,
  },
  errorText: {
    fontSize:   11,
    color:      '#C0392B',
    fontWeight: '600',
    textAlign:  'center',
  },
  resendRow: {
    flexDirection:  'row',
    justifyContent: 'center',
    marginTop:      14,
  },
  resendText: { fontSize: 11, color: C.brownMid, opacity: 0.7 },
  resendLink: { fontSize: 11, color: C.amber, fontWeight: '700' },
  backRow:    { alignItems: 'center', marginTop: 14 },
  backText:   { fontSize: 11, color: C.brownMid, fontWeight: '600', opacity: 0.7 },
});
