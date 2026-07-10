/**
 * BookingWizardModal.tsx
 * 3-step booking flow: Customer Information → Payment Details → Confirmation.
 * No backend yet, so payment is simulated (a tap-to-attach "proof" and a
 * decorative QR code) and the booking ID/receipt are generated client-side.
 */

import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView, Share,
  StyleSheet, Platform, useWindowDimensions, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import { C } from '../theme';
import { Tour, DepartureOption, SERVICE_FEE } from './mockData';
import { useBookings } from '../bookings/BookingsContext';

const WIDE_BREAKPOINT = 760;

const CloseIcon = () => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
    <Path d="M6 6l12 12M18 6L6 18" stroke={C.brown} strokeWidth={2.4} strokeLinecap="round" />
  </Svg>
);
const BackIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M15 19l-7-7 7-7" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const CheckIcon = ({ color = '#FFFFFF', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 12l6 6L20 6" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const HeartWalletIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M12 20s-7-4.2-9.3-8.5C1.2 8.3 2.8 5 6 5c1.8 0 3 .9 6 3.5C15 5.9 16.2 5 18 5c3.2 0 4.8 3.3 3.3 6.5C19 15.8 12 20 12 20z" fill={color} />
  </Svg>
);
const BankIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M3 10l9-6 9 6M5 10v9M9 10v9M15 10v9M19 10v9M3 21h18" stroke={C.brown} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const UploadIcon = () => (
  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
    <Path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" stroke={C.brownMid} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Purely decorative placeholder QR pattern (no backend to generate a real one yet).
const QrPlaceholder = () => (
  <Svg width={110} height={110} viewBox="0 0 100 100">
    <Rect x={0} y={0} width={100} height={100} fill="#FFFFFF" />
    {[
      [4, 4], [4, 12], [4, 20], [12, 4], [20, 4], [12, 20], [20, 20],
      [40, 6], [50, 14], [60, 6], [44, 22], [56, 24],
      [4, 40], [4, 50], [4, 60], [12, 44], [20, 56], [12, 60],
      [80, 4], [88, 4], [80, 12], [88, 20], [76, 20],
      [40, 40], [50, 44], [60, 50], [46, 56], [58, 60], [70, 44], [80, 56], [40, 70], [56, 76], [70, 80], [86, 70], [90, 90], [30, 88], [16, 80],
    ].map(([x, y], i) => (
      <Rect key={i} x={x} y={y} width={6} height={6} fill={C.brown} />
    ))}
  </Svg>
);

const money = (n: number) => `₱${n.toLocaleString('en-US')}`;
const formatShort = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date} ${time}`;
};
const genBookingId = () => `GV-2026-${String(Math.floor(Math.random() * 90000) + 10000).padStart(5, '0')}`;

type Step = 1 | 2 | 3;
type PaymentMethod = 'GCash' | 'Maya' | 'Bank Transfer';

type Props = {
  tour:    Tour | null;
  prefill: { departure: DepartureOption; travelers: number } | null;
  visible: boolean;
  onClose: () => void;
};

function Stepper({ step }: { step: Step }) {
  const labels = ['Customer Information', 'Payment Details', 'Confirmation'] as const;
  return (
    <View style={wz.stepperRow}>
      {labels.map((label, i) => {
        const n = (i + 1) as Step;
        const isActive = step === n;
        const isDone = step > n;
        return (
          <React.Fragment key={label}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={[wz.stepDot, isActive && wz.stepDotActive, isDone && wz.stepDotDone]}>
                {isDone ? <CheckIcon size={13} /> : <Text style={[wz.stepDotText, isActive && wz.stepDotTextActive]}>{n}</Text>}
              </View>
              <Text style={[wz.stepLabel, isActive && wz.stepLabelActive]} numberOfLines={1}>{label}</Text>
            </View>
            {i < 2 && <View style={wz.stepLine} />}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function CountStepper({ label, value, onChange, min = 0 }: { label: string; value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <View style={{ flex: 1, minWidth: 120 }}>
      <Text style={fm.label}>{label}</Text>
      <View style={fm.stepperRow}>
        <TouchableOpacity style={fm.stepperBtn} activeOpacity={0.8} onPress={() => onChange(Math.max(min, value - 1))}>
          <Text style={fm.stepperBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={fm.stepperValue}>{value}</Text>
        <TouchableOpacity style={fm.stepperBtn} activeOpacity={0.8} onPress={() => onChange(Math.min(10, value + 1))}>
          <Text style={fm.stepperBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function BookingWizardModal({ tour, prefill, visible, onClose }: Props) {
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;
  const insets = useSafeAreaInsets();
  const { addBooking } = useBookings();

  const [step, setStep] = useState<Step>(1);
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contact, setContact] = useState('');
  const [gender, setGender] = useState<'Female' | 'Male'>('Female');
  const [departureIdx, setDepartureIdx] = useState(0);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const [method, setMethod] = useState<PaymentMethod>('GCash');
  const [refNumber, setRefNumber] = useState('');
  const [proofAttached, setProofAttached] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const [bookingId, setBookingId] = useState('');

  useEffect(() => {
    if (!visible || !tour) return;
    setStep(1);
    setFirstName(''); setMiddleName(''); setLastName(''); setContact('');
    setGender('Female'); setNotes(''); setFormError('');
    setMethod('GCash'); setRefNumber(''); setProofAttached(false); setPaymentError('');
    const idx = prefill ? tour.departures.findIndex((d) => d.startISO === prefill.departure.startISO) : 0;
    setDepartureIdx(idx >= 0 ? idx : 0);
    setAdults(prefill?.travelers ?? 2);
    setChildren(0); setInfants(0);
    setBookingId(genBookingId());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, tour?.id]);

  if (!tour) return null;

  const departure = tour.departures[Math.min(departureIdx, tour.departures.length - 1)];
  const total = tour.pricePerPerson * adults;
  const amountDue = total + SERVICE_FEE;

  const goNext = () => {
    if (!firstName.trim() || !lastName.trim() || !contact.trim()) {
      setFormError('Please fill in your first name, last name, and contact number.');
      return;
    }
    setFormError('');
    setStep(2);
  };

  const confirmBooking = () => {
    if (!refNumber.trim()) {
      setPaymentError('Please enter your payment reference number.');
      return;
    }
    setPaymentError('');
    addBooking({
      id: bookingId,
      destination: tour.destination,
      location: tour.destination,
      emoji: tour.emoji,
      dateFrom: departure.startISO,
      dateTo: departure.endISO,
      travelers: adults,
      bookedOn: new Date().toISOString(),
      totalAmount: amountDue,
      balanceDue: 0,
      paymentMethod: method,
      paymentStatus: 'Pending',
      status: 'Upcoming',
    });
    setStep(3);
  };

  const downloadReceipt = async () => {
    const receipt = [
      'GoVenture Travel and Tours — Booking Receipt',
      `Booking ID: ${bookingId}`,
      `Destination: ${tour.destination}`,
      `Travel Dates: ${formatDateTime(departure.startISO)} – ${formatDateTime(departure.endISO)}`,
      `Payment Method: ${method}`,
      `Total Amount: ${money(amountDue)}`,
      `Amount Paid: ${money(amountDue)}`,
      'Payment Status: Pending',
    ].join('\n');
    try {
      await Share.share({ message: receipt, title: `Receipt ${bookingId}` });
    } catch {
      // sharing cancelled or unsupported — nothing to do
    }
  };

  /* ── Step 1: Customer Information ── */
  const tripSummary = (
    <View style={sm.card}>
      <Text style={sm.title}>Trip Summary</Text>
      <View style={sm.banner}><Text style={{ fontSize: 32 }}>{tour.emoji}</Text></View>
      <Text style={sm.dest}>{tour.destination}</Text>
      <View style={sm.row}><Text style={sm.rowIcon}>📍</Text><Text style={sm.rowText}>{tour.destination}</Text></View>
      <View style={sm.row}><Text style={sm.rowIcon}>📅</Text><Text style={sm.rowText}>{formatShort(departure.startISO)} – {formatShort(departure.endISO)}</Text></View>
      <View style={sm.row}><Text style={sm.rowIcon}>👤</Text><Text style={sm.rowText}>{adults} {adults === 1 ? 'Adult' : 'Adults'}</Text></View>

      <View style={sm.totalBox}>
        <Text style={sm.totalLabel}>TOTAL</Text>
        <Text style={sm.totalValue}>{money(total)}</Text>
      </View>

      {step === 1 && (
        <>
          {!!formError && <Text style={sm.errorText}>{formError}</Text>}
          <TouchableOpacity style={sm.nextBtn} activeOpacity={0.85} onPress={goNext}>
            <Text style={sm.nextBtnText}>Next Step →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={sm.cancelBtn} activeOpacity={0.85} onPress={onClose}>
            <Text style={sm.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  const step1 = (
    <View style={{ flexDirection: isWide ? 'row' : 'column', gap: 16, alignItems: 'flex-start' }}>
      <View style={{ flex: 1, minWidth: 0, width: '100%' }}>
        <View style={fm.card}>
          <Text style={fm.cardTitle}>Customer Information</Text>

          <View style={fm.fieldRow}>
            <View style={fm.field}>
              <Text style={fm.label}>First Name</Text>
              <TextInput style={fm.input} placeholder="First name" placeholderTextColor={C.brownMid + '80'} value={firstName} onChangeText={setFirstName} />
            </View>
            <View style={fm.field}>
              <Text style={fm.label}>Middle Name</Text>
              <TextInput style={fm.input} placeholder="Middle name" placeholderTextColor={C.brownMid + '80'} value={middleName} onChangeText={setMiddleName} />
            </View>
            <View style={fm.field}>
              <Text style={fm.label}>Last Name</Text>
              <TextInput style={fm.input} placeholder="Last name" placeholderTextColor={C.brownMid + '80'} value={lastName} onChangeText={setLastName} />
            </View>
          </View>

          <View style={fm.fieldRow}>
            <View style={[fm.field, { flexGrow: 2 }]}>
              <Text style={fm.label}>Contact Number</Text>
              <TextInput style={fm.input} placeholder="+63 9XX XXX XXXX" placeholderTextColor={C.brownMid + '80'} value={contact} onChangeText={setContact} keyboardType="phone-pad" />
            </View>
            <View style={fm.field}>
              <Text style={fm.label}>Gender</Text>
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 6 }}>
                {(['Female', 'Male'] as const).map((g) => (
                  <TouchableOpacity key={g} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} activeOpacity={0.75} onPress={() => setGender(g)}>
                    <View style={[fm.radio, gender === g && fm.radioActive]}>{gender === g && <View style={fm.radioDot} />}</View>
                    <Text style={fm.radioLabel}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={fm.fieldRow}>
            <View style={[fm.field, { flexGrow: 2 }]}>
              <Text style={fm.label}>Travel Date</Text>
              <View style={fm.chipWrap}>
                {tour.departures.map((d, i) => {
                  const active = i === departureIdx;
                  return (
                    <TouchableOpacity key={i} style={[fm.chip, active && fm.chipActive]} activeOpacity={0.8} onPress={() => setDepartureIdx(i)}>
                      <Text style={[fm.chipText, active && fm.chipTextActive]}>{formatShort(d.startISO)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={fm.fieldRow}>
            <CountStepper label="Adults" value={adults} onChange={setAdults} min={1} />
            <CountStepper label="Children" value={children} onChange={setChildren} />
            <CountStepper label="Infants" value={infants} onChange={setInfants} />
          </View>
        </View>

        <View style={fm.card}>
          <Text style={fm.cardTitle}>Special Request/s</Text>
          <TextInput
            style={fm.textarea}
            placeholder="Write any requests..."
            placeholderTextColor={C.brownMid + '80'}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />
        </View>
      </View>

      <View style={{ width: isWide ? 300 : '100%', flexShrink: 0 }}>{tripSummary}</View>
    </View>
  );

  /* ── Step 2: Payment Details ── */
  const paymentSummary = (
    <View style={sm.card}>
      <Text style={sm.title}>QR Code</Text>
      <View style={sm.qrBox}><QrPlaceholder /></View>
      <Text style={sm.qrHint}>Scan to pay via your selected wallet. Enter the reference number after payment.</Text>
      <View style={sm.totalBox}>
        <Text style={sm.totalLabel}>AMOUNT DUE</Text>
        <Text style={sm.totalValue}>{money(amountDue)}</Text>
      </View>
    </View>
  );

  const step2 = (
    <View style={{ flexDirection: isWide ? 'row' : 'column', gap: 16, alignItems: 'flex-start' }}>
      <View style={{ flex: 1, minWidth: 0, width: '100%' }}>
        <View style={fm.card}>
          <Text style={fm.cardTitle}>Payment Method</Text>
          <View style={pm.methodRow}>
            {([
              ['GCash', <HeartWalletIcon key="g" color="#2563EB" />],
              ['Maya', <HeartWalletIcon key="m" color="#16A34A" />],
              ['Bank Transfer', <BankIcon key="b" />],
            ] as [PaymentMethod, React.ReactNode][]).map(([opt, icon]) => {
              const active = method === opt;
              return (
                <TouchableOpacity key={opt} style={[pm.methodCard, active && pm.methodCardActive]} activeOpacity={0.85} onPress={() => setMethod(opt)}>
                  {icon}
                  <Text style={pm.methodLabel}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={fm.label}>Reference Number</Text>
          <TextInput
            style={fm.input}
            placeholder="Enter payment reference number"
            placeholderTextColor={C.brownMid + '80'}
            value={refNumber}
            onChangeText={setRefNumber}
          />

          <Text style={[fm.label, { marginTop: 16 }]}>Upload Payment Proof</Text>
          <TouchableOpacity style={pm.uploadBox} activeOpacity={0.8} onPress={() => setProofAttached((v) => !v)}>
            {proofAttached ? (
              <>
                <CheckIcon color={C.success} size={26} />
                <Text style={pm.uploadTitle}>payment-proof.jpg attached</Text>
                <Text style={pm.uploadHint}>Tap to remove</Text>
              </>
            ) : (
              <>
                <UploadIcon />
                <Text style={pm.uploadTitle}>Tap to attach a screenshot</Text>
                <Text style={pm.uploadHint}>PNG, JPG or PDF · Max 10MB</Text>
              </>
            )}
          </TouchableOpacity>

          {!!paymentError && <Text style={sm.errorText}>{paymentError}</Text>}

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
            <TouchableOpacity style={fm.backBtn} activeOpacity={0.85} onPress={() => setStep(1)}>
              <BackIcon />
              <Text style={fm.backBtnText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={fm.confirmBtn} activeOpacity={0.85} onPress={confirmBooking}>
              <Text style={fm.confirmBtnText}>Confirm Booking ✓</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={{ width: isWide ? 300 : '100%', flexShrink: 0 }}>{paymentSummary}</View>
    </View>
  );

  /* ── Step 3: Confirmation ── */
  const step3 = (
    <View style={fm.card}>
      <View style={cf.successBanner}>
        <View style={cf.successCircle}><CheckIcon size={26} /></View>
        <Text style={cf.successTitle}>Booking Confirmed!</Text>
        <Text style={cf.successSub}>Your booking has been submitted. Our team will review your payment and confirm shortly.</Text>
      </View>

      <View style={cf.grid}>
        <View style={cf.gridItem}>
          <Text style={cf.gridLabel}>BOOKING ID</Text>
          <Text style={cf.gridValue}>{bookingId}</Text>
        </View>
        <View style={cf.gridItem}>
          <Text style={cf.gridLabel}>DESTINATION</Text>
          <Text style={cf.gridValue}>{tour.destination}</Text>
        </View>
        <View style={cf.gridItem}>
          <Text style={cf.gridLabel}>TRAVEL DATES</Text>
          <Text style={cf.gridValue}>{formatDateTime(departure.startISO)} – {formatDateTime(departure.endISO)}</Text>
        </View>
        <View style={cf.gridItem}>
          <Text style={cf.gridLabel}>PAYMENT METHOD</Text>
          <Text style={cf.gridValue}>{method}</Text>
        </View>
      </View>

      <View style={cf.totalsBox}>
        <View style={cf.totalsRow}><Text style={cf.totalsLabel}>Total Amount</Text><Text style={cf.totalsValue}>{money(amountDue)}</Text></View>
        <View style={cf.totalsRow}><Text style={cf.totalsLabel}>Amount Paid</Text><Text style={cf.totalsValue}>{money(amountDue)}</Text></View>
        <View style={cf.totalsRow}><Text style={cf.totalsLabel}>Payment Status</Text><Text style={cf.pendingText}>Pending</Text></View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
        <TouchableOpacity style={fm.backBtn} activeOpacity={0.85} onPress={onClose}>
          <Text style={fm.backBtnText}>Close</Text>
        </TouchableOpacity>
        <TouchableOpacity style={fm.confirmBtn} activeOpacity={0.85} onPress={downloadReceipt}>
          <Text style={fm.confirmBtnText}>Download Receipt</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaProvider>
      <View style={m.safe}>
        <View style={[m.header, { paddingTop: insets.top + 14 }]}>
          <Text style={m.headerTitle}>Book Your Tour</Text>
          <Text style={m.headerSub}>Complete your booking in 3 easy steps</Text>
          <TouchableOpacity style={m.closeBtn} activeOpacity={0.85} onPress={onClose}>
            <CloseIcon />
            <Text style={m.closeText}>Close</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
            keyboardShouldPersistTaps="handled"
          >
            <Stepper step={step} />
            {step === 1 && step1}
            {step === 2 && step2}
            {step === 3 && step3}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
      </SafeAreaProvider>
    </Modal>
  );
}

const m = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.lightBg },
  header: { backgroundColor: C.brown, paddingHorizontal: 16, paddingBottom: 16, position: 'relative' },
  closeBtn: {
    position: 'absolute', top: 14, right: 16, flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFFFFF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  closeText: { fontSize: 11, fontWeight: '800', color: C.brown },
  headerTitle: { fontSize: 19, fontWeight: '900', color: '#FFFFFF', marginTop: 30, maxWidth: '75%' },
  headerSub: { fontSize: 11.5, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
});

const wz = StyleSheet.create({
  stepperRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  stepDot: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: C.divider,
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: C.danger },
  stepDotDone: { backgroundColor: C.success },
  stepDotText: { fontSize: 11, fontWeight: '800', color: C.brownMid },
  stepDotTextActive: { color: '#FFFFFF' },
  stepLabel: { fontSize: 11, fontWeight: '700', color: C.brownMid, opacity: 0.7 },
  stepLabelActive: { color: C.brown, opacity: 1 },
  stepLine: { width: 18, height: 1, backgroundColor: C.divider },
});

const fm = StyleSheet.create({
  card: {
    backgroundColor: C.cardBg, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.divider, marginBottom: 14, width: '100%',
  },
  cardTitle: { fontSize: 13.5, fontWeight: '900', color: C.brown, marginBottom: 12 },
  fieldRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  field: { flexGrow: 1, flexBasis: 130, minWidth: 100 },
  label: { fontSize: 10.5, fontWeight: '800', color: C.brownMid, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: C.divider, backgroundColor: C.lightBg, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 12.5, color: C.brown,
  },
  textarea: {
    borderWidth: 1, borderColor: C.divider, backgroundColor: C.lightBg, borderRadius: 10,
    padding: 12, fontSize: 12.5, color: C.brown, minHeight: 90, textAlignVertical: 'top',
  },

  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: C.divider, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: C.success },
  radioDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: C.success },
  radioLabel: { fontSize: 12, fontWeight: '600', color: C.brown },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: C.divider, backgroundColor: C.lightBg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  chipActive: { backgroundColor: C.brown, borderColor: C.brown },
  chipText: { fontSize: 11, fontWeight: '700', color: C.brown },
  chipTextActive: { color: '#FFFFFF' },

  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepperBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.lightBg, borderWidth: 1, borderColor: C.divider, alignItems: 'center', justifyContent: 'center' },
  stepperBtnText: { fontSize: 16, fontWeight: '900', color: C.brown },
  stepperValue: { fontSize: 13.5, fontWeight: '800', color: C.brown, minWidth: 18, textAlign: 'center' },

  backBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: C.brown, borderRadius: 12, paddingVertical: 13,
  },
  backBtnText: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' },
  confirmBtn: { flex: 1.4, alignItems: 'center', justifyContent: 'center', backgroundColor: C.danger, borderRadius: 12, paddingVertical: 13 },
  confirmBtnText: { fontSize: 12.5, fontWeight: '900', color: '#FFFFFF' },
});

const sm = StyleSheet.create({
  card: {
    backgroundColor: C.cardBg, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.divider, width: '100%',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 1 },
    }),
  },
  title: { fontSize: 13, fontWeight: '900', color: C.brown, marginBottom: 10 },
  banner: { height: 90, borderRadius: 12, backgroundColor: C.brown, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  dest: { fontSize: 14.5, fontWeight: '900', color: C.brown, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  rowIcon: { fontSize: 11 },
  rowText: { fontSize: 11.5, color: C.brownMid, flexShrink: 1 },

  totalBox: { backgroundColor: C.lightBg, borderRadius: 10, alignItems: 'center', paddingVertical: 12, marginTop: 10 },
  totalLabel: { fontSize: 9.5, fontWeight: '800', color: C.brownMid, opacity: 0.7, letterSpacing: 0.5 },
  totalValue: { fontSize: 19, fontWeight: '900', color: C.brown, marginTop: 2 },

  errorText: { fontSize: 11, color: C.danger, fontWeight: '700', marginTop: 10 },
  nextBtn: { backgroundColor: C.danger, borderRadius: 12, alignItems: 'center', paddingVertical: 13, marginTop: 12 },
  nextBtnText: { fontSize: 12.5, fontWeight: '900', color: '#FFFFFF' },
  cancelBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 8 },
  cancelBtnText: { fontSize: 12, fontWeight: '800', color: C.brownMid },

  qrBox: { alignItems: 'center', justifyContent: 'center', backgroundColor: C.lightBg, borderRadius: 12, borderWidth: 2, borderColor: '#2563EB', padding: 10, alignSelf: 'center' },
  qrHint: { fontSize: 10.5, color: C.brownMid, textAlign: 'center', marginTop: 10, lineHeight: 15 },
});

const pm = StyleSheet.create({
  methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  methodCard: {
    flexGrow: 1, flexBasis: 100, alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: C.divider, borderRadius: 12, paddingVertical: 14,
    backgroundColor: C.lightBg,
  },
  methodCardActive: { borderColor: C.info, backgroundColor: '#EAF2FE' },
  methodLabel: { fontSize: 11.5, fontWeight: '800', color: C.brown },

  uploadBox: {
    alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: C.divider, borderStyle: 'dashed', borderRadius: 12,
    paddingVertical: 24, backgroundColor: C.lightBg,
  },
  uploadTitle: { fontSize: 12, fontWeight: '700', color: C.brown },
  uploadHint: { fontSize: 10, color: C.brownMid, opacity: 0.7 },
});

const cf = StyleSheet.create({
  successBanner: { alignItems: 'center', backgroundColor: '#E7F7F1', borderRadius: 14, padding: 20, marginBottom: 16 },
  successCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.success, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  successTitle: { fontSize: 16, fontWeight: '900', color: C.brown },
  successSub: { fontSize: 11.5, color: C.brownMid, textAlign: 'center', marginTop: 6, lineHeight: 16, maxWidth: 320 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  gridItem: { flexGrow: 1, flexBasis: '46%', backgroundColor: C.lightBg, borderRadius: 10, borderWidth: 1, borderColor: C.divider, padding: 12 },
  gridLabel: { fontSize: 9.5, fontWeight: '800', color: C.brownMid, opacity: 0.7, letterSpacing: 0.4 },
  gridValue: { fontSize: 12.5, fontWeight: '800', color: C.brown, marginTop: 3 },

  totalsBox: { borderTopWidth: 1, borderTopColor: C.divider, paddingTop: 10, gap: 8 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalsLabel: { fontSize: 12, color: C.brownMid },
  totalsValue: { fontSize: 13, fontWeight: '800', color: C.brown },
  pendingText: { fontSize: 12, fontWeight: '800', color: '#B8860B' },
});
