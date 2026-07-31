/**
 * BookingWizardModal.tsx
 * 3-step booking flow: Customer Information → Payment Details → Confirmation.
 * Payment proof/QR are still simulated (no payment gateway), but the booking
 * itself is created server-side via BookingsContext.createBooking, which
 * generates the real booking reference and persists it to the database.
 */

import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Image,
  StyleSheet, Platform, useWindowDimensions, KeyboardAvoidingView, ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { C } from '../theme';
import { Tour, DepartureOption, SERVICE_FEE } from './mockData';
import { useBookings } from '../bookings/BookingsContext';
import { downloadReceiptPdf } from './downloadReceipt';

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
const ChevronDownIcon = ({ open }: { open?: boolean }) => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
    <Path d="M6 9l6 6 6-6" stroke={C.brownMid} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
/** Generic travel-photo glyph — shown when the tour has no image, or its image fails to load. */
const PhotoFallbackIcon = ({ color = 'rgba(255,255,255,0.85)', size = 32 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 18l5-6 4 4.5 3-3.5 4 5H4z" fill={color} />
    <Circle cx={8} cy={7.5} r={2} fill={color} />
    <Path d="M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z" stroke={color} strokeWidth={1.6} />
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
type Step = 1 | 2 | 3;
type PaymentMethod = 'GCash' | 'Maya' | 'Bank Transfer';

type Props = {
  tour:    Tour | null;
  prefill: { departure: DepartureOption; travelers: number } | null;
  visible: boolean;
  onClose: () => void;
};

function Stepper({ step }: { step: Step }) {
  const labels = ['Customer', 'Payment', 'Confirmation'] as const;
  return (
    <View style={wz.stepperRow}>
      {labels.map((label, i) => {
        const n = (i + 1) as Step;
        const isActive = step === n;
        const isDone = step > n;
        return (
          <React.Fragment key={label}>
            <View style={wz.stepItem}>
              <View style={[wz.stepDot, isActive && wz.stepDotActive, isDone && wz.stepDotDone]}>
                {isDone ? <CheckIcon size={12} /> : <Text style={[wz.stepDotText, isActive && wz.stepDotTextActive]}>{n}</Text>}
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

function CountStepper({ label, value, onChange, min = 0, max = 20 }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  const [text, setText] = useState(String(value));

  useEffect(() => { setText(String(value)); }, [value]);

  const handleChangeText = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '');
    setText(digits);
    if (digits === '') { onChange(min); return; }
    onChange(Math.max(min, Math.min(max, parseInt(digits, 10))));
  };

  return (
    <View style={fm.counterItem}>
      <Text style={fm.label}>{label}</Text>
      <View style={fm.stepperRow}>
        <TouchableOpacity style={fm.stepperBtn} activeOpacity={0.8} onPress={() => onChange(Math.max(min, value - 1))}>
          <Text style={fm.stepperBtnText}>−</Text>
        </TouchableOpacity>
        <TextInput
          style={fm.stepperInput}
          value={text}
          onChangeText={handleChangeText}
          onBlur={() => setText(String(value))}
          keyboardType="number-pad"
          maxLength={2}
          selectTextOnFocus
        />
        <TouchableOpacity style={fm.stepperBtn} activeOpacity={0.8} onPress={() => onChange(Math.min(max, value + 1))}>
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
  const { createBooking } = useBookings();

  const [step, setStep] = useState<Step>(1);
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contact, setContact] = useState('');
  const [gender, setGender] = useState<'Female' | 'Male'>('Female');
  const [departureIdx, setDepartureIdx] = useState(0);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [imageFailed, setImageFailed] = useState(false);
  const [dateMenuOpen, setDateMenuOpen] = useState(false);

  const [method, setMethod] = useState<PaymentMethod>('GCash');
  const [refNumber, setRefNumber] = useState('');
  const [proofAttached, setProofAttached] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [bookingId, setBookingId] = useState('');
  const [confirmedTotal, setConfirmedTotal] = useState(0);

  useEffect(() => {
    if (!visible || !tour) return;
    setStep(1);
    setFirstName(''); setMiddleName(''); setLastName(''); setContact('');
    setGender('Female'); setNotes(''); setFormError(''); setDateMenuOpen(false);
    setMethod('GCash'); setRefNumber(''); setProofAttached(false); setPaymentError('');
    const idx = prefill ? tour.departures.findIndex((d) => d.id === prefill.departure.id) : 0;
    setDepartureIdx(idx >= 0 ? idx : 0);
    setAdults(prefill?.travelers ?? 1);
    setChildren(0); setInfants(0);
    setBookingId('');
    setConfirmedTotal(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, tour?.id]);

  if (!tour) return null;

  const departure = tour.departures[Math.min(departureIdx, tour.departures.length - 1)];
  const total = (departure?.adultPrice ?? tour.pricePerPerson) * adults;
  const amountDue = total + SERVICE_FEE;

  const goNext = () => {
    if (!firstName.trim() || !lastName.trim() || !contact.trim()) {
      setFormError('Please fill in your first name, last name, and contact number.');
      return;
    }
    setFormError('');
    setStep(2);
  };

  const confirmBooking = async () => {
    if (!refNumber.trim()) {
      setPaymentError('Please enter your payment reference number.');
      return;
    }
    if (!departure) {
      setPaymentError('No departure date selected.');
      return;
    }
    setPaymentError('');
    setSubmitting(true);
    const result = await createBooking({
      tourId: tour.id,
      departureId: departure.id,
      travelers: adults,
      paymentMethod: method,
    });
    setSubmitting(false);
    if (!result.ok) {
      setPaymentError(result.message);
      return;
    }
    setBookingId(result.reference);
    setConfirmedTotal(result.totalAmount + SERVICE_FEE);
    setStep(3);
  };

  const handleDownloadReceipt = async () => {
    const travelersLine = `${adults} ${adults === 1 ? 'Adult' : 'Adults'}`
      + (children ? `, ${children} ${children === 1 ? 'Child' : 'Children'}` : '')
      + (infants ? `, ${infants} ${infants === 1 ? 'Infant' : 'Infants'}` : '');

    const row = (label: string, value: string) => `
      <tr>
        <td style="padding:8px 0;color:#6B3318;font-size:12px;font-weight:700;">${label}</td>
        <td style="padding:8px 0;color:#3B1A0C;font-size:12px;font-weight:800;text-align:right;">${value}</td>
      </tr>`;

    const html = `
      <html>
        <head><meta charset="utf-8" /></head>
        <body style="font-family:-apple-system,Helvetica,Arial,sans-serif;margin:0;padding:0;background:#FDF0E6;">
          <div style="background:#3B1A0C;padding:28px 32px;">
            <div style="color:#FFFFFF;font-size:20px;font-weight:900;">GOVENTURE TRAVEL AND TOURS</div>
            <div style="color:rgba(255,255,255,0.85);font-size:13px;margin-top:4px;">Official Booking Receipt</div>
          </div>
          <div style="padding:28px 32px;">
            <table width="100%" style="border-collapse:collapse;">
              ${row('Booking ID', bookingId)}
              ${row('Issued', formatDateTime(new Date().toISOString()))}
            </table>
            <div style="height:1px;background:#E8C4A0;margin:14px 0;"></div>
            <table width="100%" style="border-collapse:collapse;">
              ${row('Destination', tour.destination)}
              ${row('Travel Dates', `${formatDateTime(departure.startISO)} – ${formatDateTime(departure.endISO)}`)}
              ${row('Travelers', travelersLine)}
            </table>
            <div style="height:1px;background:#E8C4A0;margin:14px 0;"></div>
            <table width="100%" style="border-collapse:collapse;">
              ${row('Payment Method', method)}
              ${row('Reference No.', refNumber)}
            </table>
            <div style="height:1px;background:#E8C4A0;margin:14px 0;"></div>
            <table width="100%" style="border-collapse:collapse;">
              ${row('Total Amount', money(confirmedTotal))}
              ${row('Amount Paid', money(confirmedTotal))}
              ${row('Payment Status', 'Pending Verification')}
            </table>
            <div style="height:1px;background:#E8C4A0;margin:20px 0;"></div>
            <div style="color:#3B1A0C;font-size:13px;font-weight:800;">Thank you for booking with GoVenture!</div>
            <div style="color:#6B3318;font-size:11.5px;margin-top:6px;line-height:1.6;">
              This receipt confirms your submission — our team will verify your payment
              and update your booking status shortly.
            </div>
          </div>
        </body>
      </html>`;

    try {
      const result = await downloadReceiptPdf(`GoVenture-Receipt-${bookingId}`, html);
      if (!result.ok) {
        Alert.alert('Download failed', result.message);
      } else if (result.silent) {
        Alert.alert('Receipt saved', 'Your PDF receipt was saved to your device automatically — no need to pick a share option.');
      }
    } catch {
      Alert.alert('Download failed', 'Something went wrong while saving your receipt. Please try again.');
    }
  };

  /* ── Step 1: Customer Information ── */
  const tripSummary = (
    <View style={sm.card}>
      <Text style={sm.title}>Trip Summary</Text>
      <View style={sm.banner}>
        {tour.imageUrl && !imageFailed ? (
          <Image
            source={{ uri: tour.imageUrl }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <PhotoFallbackIcon />
        )}
      </View>
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
              <TouchableOpacity
                style={fm.dropdownTrigger}
                activeOpacity={0.8}
                disabled={tour.departures.length === 0}
                onPress={() => setDateMenuOpen(true)}
              >
                <Text style={fm.dropdownTriggerText}>
                  {departure
                    ? `${formatShort(departure.startISO)} – ${formatShort(departure.endISO)}`
                    : 'No available dates'}
                </Text>
                <ChevronDownIcon />
              </TouchableOpacity>
            </View>
          </View>

          <View style={fm.countersRow}>
            <CountStepper label="Adults" value={adults} onChange={setAdults} min={1} />
            <View style={fm.counterDivider} />
            <CountStepper label="Children" value={children} onChange={setChildren} />
            <View style={fm.counterDivider} />
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
            <TouchableOpacity style={fm.backBtn} activeOpacity={0.85} onPress={() => setStep(1)} disabled={submitting}>
              <BackIcon />
              <Text style={fm.backBtnText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[fm.confirmBtn, submitting && { opacity: 0.7 }]} activeOpacity={0.85} onPress={confirmBooking} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={fm.confirmBtnText}>Confirm Booking ✓</Text>
              )}
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
        <View style={cf.totalsRow}><Text style={cf.totalsLabel}>Total Amount</Text><Text style={cf.totalsValue}>{money(confirmedTotal)}</Text></View>
        <View style={cf.totalsRow}><Text style={cf.totalsLabel}>Amount Paid</Text><Text style={cf.totalsValue}>{money(confirmedTotal)}</Text></View>
        <View style={cf.totalsRow}><Text style={cf.totalsLabel}>Payment Status</Text><Text style={cf.pendingText}>Pending</Text></View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
        <TouchableOpacity style={fm.backBtn} activeOpacity={0.85} onPress={onClose}>
          <Text style={fm.backBtnText}>Close</Text>
        </TouchableOpacity>
        <TouchableOpacity style={fm.confirmBtn} activeOpacity={0.85} onPress={handleDownloadReceipt}>
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
          <TouchableOpacity style={[m.closeBtn, { top: insets.top + 14 }]} activeOpacity={0.85} onPress={onClose}>
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

      <Modal visible={dateMenuOpen} transparent animationType="fade" onRequestClose={() => setDateMenuOpen(false)} statusBarTranslucent>
        <TouchableOpacity style={dd.backdrop} activeOpacity={1} onPress={() => setDateMenuOpen(false)}>
          <TouchableOpacity style={dd.sheet} activeOpacity={1}>
            <Text style={dd.title}>Select Travel Date</Text>
            <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
              {tour.departures.map((d, i) => {
                const active = i === departureIdx;
                return (
                  <TouchableOpacity
                    key={d.id}
                    style={[dd.row, active && dd.rowActive]}
                    activeOpacity={0.75}
                    onPress={() => { setDepartureIdx(i); setDateMenuOpen(false); }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[dd.rowText, active && dd.rowTextActive]}>
                        {formatShort(d.startISO)} – {formatShort(d.endISO)}
                      </Text>
                      <Text style={dd.rowSub}>{money(d.adultPrice)} / adult · {d.slots} slots left</Text>
                    </View>
                    {active && <CheckIcon color={C.amber} size={16} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={dd.cancelBtn} activeOpacity={0.85} onPress={() => setDateMenuOpen(false)}>
              <Text style={dd.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      </SafeAreaProvider>
    </Modal>
  );
}

const m = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.lightBg },
  header: { backgroundColor: C.brown, paddingHorizontal: 16, paddingBottom: 16, position: 'relative' },
  closeBtn: {
    position: 'absolute', right: 16, flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFFFFF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  closeText: { fontSize: 11, fontWeight: '800', color: C.brown },
  headerTitle: { fontSize: 19, fontWeight: '900', color: '#FFFFFF', marginTop: 30, maxWidth: '75%' },
  headerSub: { fontSize: 11.5, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
});

const wz = StyleSheet.create({
  stepperRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap', marginBottom: 16 },
  stepItem: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  stepDot: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: C.divider,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepDotActive: { backgroundColor: C.danger },
  stepDotDone: { backgroundColor: C.success },
  stepDotText: { fontSize: 10.5, fontWeight: '800', color: C.brownMid },
  stepDotTextActive: { color: '#FFFFFF' },
  stepLabel: { fontSize: 10.5, fontWeight: '700', color: C.brownMid, opacity: 0.7, flexShrink: 1 },
  stepLabelActive: { color: C.brown, opacity: 1 },
  stepLine: { flex: 1, minWidth: 10, maxWidth: 28, height: 1, backgroundColor: C.divider, marginHorizontal: 6 },
});

const fm = StyleSheet.create({
  card: {
    backgroundColor: C.cardBg, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.divider, marginBottom: 14, width: '100%',
  },
  cardTitle: { fontSize: 13.5, fontWeight: '900', color: C.brown, marginBottom: 12 },
  fieldRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  countersRow: { flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'stretch', marginBottom: 12 },
  counterItem: { flex: 1, paddingHorizontal: 8 },
  counterDivider: { width: 1, backgroundColor: C.divider, marginTop: 2, marginBottom: 2 },
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

  dropdownTrigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: C.divider, backgroundColor: C.lightBg, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  dropdownTriggerText: { fontSize: 12.5, fontWeight: '700', color: C.brown },

  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepperBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.lightBg, borderWidth: 1, borderColor: C.divider, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepperBtnText: { fontSize: 15, fontWeight: '900', color: C.brown },
  stepperInput: {
    flex: 1, minWidth: 0, borderWidth: 1, borderColor: C.divider, backgroundColor: C.lightBg,
    borderRadius: 8, paddingVertical: 6, paddingHorizontal: 2,
    fontSize: 13.5, fontWeight: '800', color: C.brown, textAlign: 'center',
  },

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
  banner: { height: 90, borderRadius: 12, backgroundColor: C.brown, alignItems: 'center', justifyContent: 'center', marginBottom: 10, overflow: 'hidden', position: 'relative' },
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

const dd = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(59,26,12,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.cardBg, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 18, paddingTop: 18, paddingBottom: 28,
  },
  title: { fontSize: 14.5, fontWeight: '900', color: C.brown, marginBottom: 12 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, marginBottom: 6,
  },
  rowActive: { backgroundColor: C.lightBg },
  rowText: { fontSize: 12.5, fontWeight: '800', color: C.brown },
  rowTextActive: { color: C.amber },
  rowSub: { fontSize: 10.5, color: C.brownMid, opacity: 0.75, marginTop: 3 },
  cancelBtn: { alignItems: 'center', paddingVertical: 13, marginTop: 6 },
  cancelText: { fontSize: 12.5, fontWeight: '800', color: C.brownMid },
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
