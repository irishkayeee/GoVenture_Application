/**
 * EditProfileModal.tsx
 * Fetches the traveler's real account record (client_account_get) and lets
 * them edit their profile picture, name, email, contact number, gender, date
 * of birth (Personal Information), password (Privacy & Security), and
 * passport/valid-ID details + scans (Travel Documents). Saves via
 * client_profile_update / change_password / client_travel_documents_update.
 * On profile save the change is pushed into AuthContext (updateUser) so it
 * shows up everywhere the user is read from — the Account page, the top nav
 * avatar, etc. — without needing to log out and back in.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView, Image,
  StyleSheet, ActivityIndicator, Alert, Animated, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { C } from '../theme';
import { useAuth } from '@/components/auth/AuthContext';
import {
  CLIENT_ACCOUNT_GET_API_URL, CLIENT_PROFILE_UPDATE_API_URL, CLIENT_AVATAR_UPDATE_API_URL,
  CHANGE_PASSWORD_API_URL, CLIENT_TRAVEL_DOCUMENTS_UPDATE_API_URL,
} from '@/constants/api';

/* ── Icons (solid-style, no emoji) ── */
const BackIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M15 19l-7-7 7-7" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const CameraIcon = () => (
  <Svg width={13} height={13} viewBox="0 0 24 24">
    <Path fill="#FFFFFF" d="M9 3L7.5 5H4a2 2 0 00-2 2v11a2 2 0 002 2h16a2 2 0 002-2V7a2 2 0 00-2-2h-3.5L15 3H9zm3 5a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6z" />
  </Svg>
);
const PersonPlaceholderIcon = () => (
  <Svg width={36} height={36} viewBox="0 0 24 24">
    <Circle cx={12} cy={8} r={4} fill="#FFFFFF" opacity={0.9} />
    <Path fill="#FFFFFF" opacity={0.9} d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7v1H4v-1z" />
  </Svg>
);
const CalendarIcon = () => (
  <Svg width={15} height={15} viewBox="0 0 24 24">
    <Path fill={C.amber} d="M7 2a1 1 0 011 1v1h8V3a1 1 0 112 0v1h1a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h1V3a1 1 0 011-1zM5 10v10h14V10H5z" />
  </Svg>
);
const CheckCircleIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24">
    <Circle cx={12} cy={12} r={10} fill="#FFFFFF" />
    <Path d="M7 12.5l3 3 7-7" stroke="#12946F" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg>
);
const CameraOptionIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24">
    <Path fill={C.amber} d="M9 3L7.5 5H4a2 2 0 00-2 2v11a2 2 0 002 2h16a2 2 0 002-2V7a2 2 0 00-2-2h-3.5L15 3H9zm3 5a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6z" />
  </Svg>
);
const LibraryOptionIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24">
    <Path fill={C.amber} d="M4 5a2 2 0 012-2h9a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm2 9l2.3-2.9a1 1 0 011.6.05L11.5 13l1.8-2.3a1 1 0 011.6 0L17 14v2H6v-2z" />
    <Path fill={C.amber} opacity={0.55} d="M20 6.5v12a2.5 2.5 0 01-2.5 2.5H8v-1.5h9.5a1 1 0 001-1V6.5H20z" />
  </Svg>
);
const BigCheckIcon = () => (
  <Svg width={30} height={30} viewBox="0 0 24 24">
    <Path d="M4 12.5l5.5 5.5L20 7" stroke="#12946F" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg>
);
const ShieldLockIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24">
    <Path fill={C.amber} d="M12 2l8 3.5v6c0 5-3.4 8.9-8 10.5-4.6-1.6-8-5.5-8-10.5v-6L12 2z" opacity={0.18} />
    <Path stroke={C.amber} strokeWidth={1.8} strokeLinejoin="round" fill="none" d="M12 2l8 3.5v6c0 5-3.4 8.9-8 10.5-4.6-1.6-8-5.5-8-10.5v-6L12 2z" />
    <Path stroke={C.amber} strokeWidth={1.7} strokeLinecap="round" d="M9.5 12.2V10a2.5 2.5 0 015 0v2.2" />
    <Path fill={C.amber} d="M8.7 12h6.6a.9.9 0 01.9.9v2.9a.9.9 0 01-.9.9H8.7a.9.9 0 01-.9-.9v-2.9a.9.9 0 01.9-.9z" />
  </Svg>
);
const DocumentSectionIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24">
    <Path fill={C.amber} d="M7 3h7l4 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" opacity={0.18} />
    <Path stroke={C.amber} strokeWidth={1.8} strokeLinejoin="round" fill="none" d="M7 3h7l4 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" />
    <Path stroke={C.amber} strokeWidth={1.8} strokeLinejoin="round" d="M14 3v4h4" />
    <Path stroke={C.amber} strokeWidth={1.5} strokeLinecap="round" d="M9 13h6M9 16.5h4" />
  </Svg>
);
const EyeIcon = () => (
  <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
    <Path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" stroke={C.brownMid} strokeWidth={1.7} strokeLinejoin="round" />
    <Circle cx={12} cy={12} r={3} stroke={C.brownMid} strokeWidth={1.7} />
  </Svg>
);
const EyeOffIcon = () => (
  <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
    <Path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" stroke={C.brownMid} strokeWidth={1.7} strokeLinejoin="round" />
    <Circle cx={12} cy={12} r={3} stroke={C.brownMid} strokeWidth={1.7} />
    <Line x1={3} y1={3} x2={21} y2={21} stroke={C.brownMid} strokeWidth={1.7} strokeLinecap="round" />
  </Svg>
);
const CheckDotIcon = ({ active }: { active: boolean }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24">
    <Circle cx={12} cy={12} r={11} fill={active ? C.success : 'transparent'} stroke={active ? C.success : C.divider} strokeWidth={1.6} />
    {active && <Path d="M7 12.5l3 3 7-7" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />}
  </Svg>
);
const WarningIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24">
    <Path fill={C.danger} d="M12 2.5L1.5 21h21L12 2.5z" opacity={0.16} />
    <Path stroke={C.danger} strokeWidth={1.8} strokeLinejoin="round" fill="none" d="M12 2.5L1.5 21h21L12 2.5z" />
    <Path stroke={C.danger} strokeWidth={1.9} strokeLinecap="round" d="M12 9.5v5" />
    <Circle cx={12} cy={17.2} r={1} fill={C.danger} />
  </Svg>
);
const ScanCameraIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24">
    <Path fill={C.amber} d="M9 3L7.5 5H4a2 2 0 00-2 2v11a2 2 0 002 2h16a2 2 0 002-2V7a2 2 0 00-2-2h-3.5L15 3H9zm3 5a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6z" />
  </Svg>
);
const UploadTrayIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M12 3v11" stroke={C.amber} strokeWidth={1.9} strokeLinecap="round" />
    <Path d="M8 7l4-4 4 4" stroke={C.amber} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" stroke={C.amber} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const ChevronDownIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 24 24">
    <Path fill={C.amber} d="M12 16L4 8h16z" />
  </Svg>
);
const DocPlaceholderIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24">
    <Path fill={C.brownMid} opacity={0.35} d="M7 3h7l4 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" />
  </Svg>
);
const CloseXIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24">
    <Path fill="#FFFFFF" d="M6.4 5L12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4L12 13.4 6.4 19 5 17.6 10.6 12 5 6.4z" />
  </Svg>
);
const LockIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24">
    <Path stroke={C.amber} strokeWidth={1.8} strokeLinecap="round" fill="none" d="M6 11V8a6 6 0 1112 0v3" />
    <Path fill={C.amber} d="M5 11h14v9a1 1 0 01-1 1H6a1 1 0 01-1-1v-9z" opacity={0.9} />
  </Svg>
);

/* ── Change Profile Picture action sheet (custom-styled, not the native Alert) ── */
function ChangePhotoModal({ visible, onClose, onTakePhoto, onChooseLibrary }: {
  visible: boolean; onClose: () => void; onTakePhoto: () => void; onChooseLibrary: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={cp.backdrop}>
        <View style={cp.card}>
          <Text style={cp.title}>Change Profile Picture</Text>
          <Text style={cp.subtitle}>Choose a source</Text>

          <TouchableOpacity style={cp.optionRow} activeOpacity={0.75} onPress={onTakePhoto}>
            <View style={cp.optionIconWrap}><CameraOptionIcon /></View>
            <Text style={cp.optionText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={cp.optionRow} activeOpacity={0.75} onPress={onChooseLibrary}>
            <View style={cp.optionIconWrap}><LibraryOptionIcon /></View>
            <Text style={cp.optionText}>Choose from Library</Text>
          </TouchableOpacity>

          <TouchableOpacity style={cp.cancelBtn} activeOpacity={0.85} onPress={onClose}>
            <Text style={cp.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ── Success confirmation shown right after a new photo is saved ── */
function PhotoUpdatedModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={pu.backdrop}>
        <View style={pu.card}>
          <View style={pu.iconCircle}><BigCheckIcon /></View>
          <Text style={pu.title}>Profile Picture Updated</Text>
          <Text style={pu.message}>Your new profile picture has been saved successfully.</Text>
          <TouchableOpacity style={pu.closeBtn} activeOpacity={0.85} onPress={onClose}>
            <Text style={pu.closeBtnText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const pad2 = (n: number) => String(n).padStart(2, '0');
const formatDobDisplay = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

/* ── Generic date picker (used for Date of Birth, Passport Expiry, ID Expiry) ── */
function DatePickerModal({ visible, title, value, disableFutureDates, onClose, onSelect }: {
  visible: boolean; title: string; value: string; disableFutureDates?: boolean; onClose: () => void; onSelect: (iso: string) => void;
}) {
  const today = new Date();
  const defaultDate = () => (value ? new Date(`${value}T00:00:00`) : new Date(today.getFullYear() - (disableFutureDates ? 25 : 0), 0, 1));

  const [year, setYear] = useState(defaultDate().getFullYear());
  const [month, setMonth] = useState(defaultDate().getMonth());
  const [selectedDay, setSelectedDay] = useState(defaultDate().getDate());
  const [yearMenuOpen, setYearMenuOpen] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const d = defaultDate();
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    setSelectedDay(d.getDate());
    setYearMenuOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, value]);

  if (!visible) return null;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const years = disableFutureDates
    ? Array.from({ length: 100 }, (_, i) => today.getFullYear() - i)
    : Array.from({ length: 30 }, (_, i) => today.getFullYear() - 10 + i);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={dp.overlay}>
        <View style={dp.card}>
          <Text style={dp.title}>{title}</Text>

          <View style={dp.navRow}>
            <TouchableOpacity style={dp.monthBtn} onPress={() => setMonth((m) => (m === 0 ? 11 : m - 1))}>
              <Text style={dp.navArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={dp.monthLabel}>{MONTH_NAMES[month]}</Text>
            <TouchableOpacity style={dp.monthBtn} onPress={() => setMonth((m) => (m === 11 ? 0 : m + 1))}>
              <Text style={dp.navArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dp.yearBtn} activeOpacity={0.8} onPress={() => setYearMenuOpen((v) => !v)}>
              <Text style={dp.yearLabel}>{year} ▾</Text>
            </TouchableOpacity>
          </View>

          {yearMenuOpen ? (
            <ScrollView style={dp.yearMenu} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {years.map((y) => (
                <TouchableOpacity key={y} style={dp.yearMenuItem} activeOpacity={0.75} onPress={() => { setYear(y); setYearMenuOpen(false); }}>
                  <Text style={[dp.yearMenuItemText, y === year && dp.yearMenuItemTextActive]}>{y}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <>
              <View style={dp.weekRow}>
                {WEEKDAY_LETTERS.map((w, i) => <Text key={i} style={dp.weekLetter}>{w}</Text>)}
              </View>
              <View style={dp.grid}>
                {cells.map((d, i) => {
                  if (!d) return <View key={i} style={dp.cell} />;
                  const isFuture = disableFutureDates && new Date(year, month, d).getTime() > today.getTime();
                  const isSelected = d === selectedDay;
                  return (
                    <View key={i} style={dp.cell}>
                      <TouchableOpacity
                        disabled={isFuture}
                        activeOpacity={0.7}
                        style={[dp.dayBtn, isSelected && dp.dayBtnActive]}
                        onPress={() => setSelectedDay(d)}
                      >
                        <Text style={[dp.dayText, isFuture && dp.dayTextDisabled, isSelected && dp.dayTextActive]}>{d}</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          <View style={dp.footerRow}>
            <TouchableOpacity onPress={onClose}><Text style={dp.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity
              style={dp.applyBtn}
              activeOpacity={0.85}
              onPress={() => { onSelect(`${year}-${pad2(month + 1)}-${pad2(selectedDay)}`); onClose(); }}
            >
              <Text style={dp.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ── Valid ID Type picker ── */
const VALID_ID_TYPES = ['PhilSys National ID', "Driver's License", 'Passport', 'UMID', 'Postal ID', 'SSS ID', 'PhilHealth ID', "Voter's ID"];

function ValidIdTypeModal({ visible, value, onClose, onSelect }: {
  visible: boolean; value: string; onClose: () => void; onSelect: (v: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={cp.backdrop}>
        <View style={cp.card}>
          <Text style={cp.title}>Valid ID Type</Text>
          <Text style={cp.subtitle}>Choose your ID type</Text>
          <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
            {VALID_ID_TYPES.map((opt) => (
              <TouchableOpacity key={opt} style={cp.idOptionRow} activeOpacity={0.75} onPress={() => { onSelect(opt); onClose(); }}>
                <Text style={[cp.optionText, opt === value && { color: C.amber }]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={cp.cancelBtn} activeOpacity={0.85} onPress={onClose}>
            <Text style={cp.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ── Full-screen viewer for an attached passport/ID image ── */
function ImageViewerModal({ uri, onClose }: { uri: string | null; onClose: () => void }) {
  return (
    <Modal visible={!!uri} transparent animationType="fade" onRequestClose={onClose}>
      <View style={iv.backdrop}>
        <TouchableOpacity style={iv.closeBtn} activeOpacity={0.85} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <CloseXIcon />
        </TouchableOpacity>
        {uri ? <Image source={{ uri }} style={iv.image} resizeMode="contain" /> : null}
      </View>
    </Modal>
  );
}

/* ── Scan / Upload attach control with thumbnail + view/remove links ── */
function DocumentAttachRow({ imageUri, onScan, onUpload, onView, onRemove, scanLabel, uploadLabel, viewLabel }: {
  imageUri: string | null; onScan: () => void; onUpload: () => void; onView: () => void; onRemove: () => void;
  scanLabel: string; uploadLabel: string; viewLabel: string;
}) {
  return (
    <View style={s.attachRow}>
      <View style={s.attachThumbWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={s.attachThumb} resizeMode="cover" />
        ) : (
          <View style={s.attachThumbPlaceholder}><DocPlaceholderIcon /></View>
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 7 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={s.attachBtn} activeOpacity={0.8} onPress={onScan}>
            <ScanCameraIcon />
            <Text style={s.attachBtnText} numberOfLines={1}>{scanLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.attachBtn} activeOpacity={0.8} onPress={onUpload}>
            <UploadTrayIcon />
            <Text style={s.attachBtnText} numberOfLines={1}>{uploadLabel}</Text>
          </TouchableOpacity>
        </View>
        {imageUri ? (
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <TouchableOpacity activeOpacity={0.75} onPress={onView}><Text style={s.attachLink}>{viewLabel}</Text></TouchableOpacity>
            <TouchableOpacity activeOpacity={0.75} onPress={onRemove}><Text style={[s.attachLink, { color: C.danger }]}>Remove</Text></TouchableOpacity>
          </View>
        ) : (
          <Text style={s.attachHint}>No file attached yet</Text>
        )}
      </View>
    </View>
  );
}

/* ── Terms & Conditions / Privacy Policy full-screen viewer ── */
type LegalSection = { title: string; body: string };

function LegalDocumentModal({ visible, title, effectiveDate, sections, onClose }: {
  visible: boolean; title: string; effectiveDate: string; sections: LegalSection[]; onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={s.safe}>
        <View style={[s.header, { paddingTop: insets.top + 14 }]}>
          <TouchableOpacity style={s.backBtn} activeOpacity={0.85} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{title}</Text>
          <View style={{ width: 34 }} />
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={lg.body} showsVerticalScrollIndicator={false}>
          <Text style={lg.docTitle}>{title}</Text>
          <Text style={lg.effectiveDate}>Effective Date: {effectiveDate}</Text>
          {sections.map((sec) => (
            <View key={sec.title} style={lg.section}>
              <Text style={lg.sectionTitle}>{sec.title}</Text>
              <Text style={lg.sectionBody}>{sec.body}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const TERMS_SECTIONS: LegalSection[] = [
  { title: '1. Acceptance of Terms', body: 'By creating an account and using the GoVenture Travel and Tours mobile application, website, and booking services ("Services"), you agree to be bound by these Terms & Conditions. If you do not agree, please do not use our Services.' },
  { title: '2. Eligibility', body: 'You must be at least 18 years old, or have the consent of a parent or legal guardian, to create an account and book travel services through GoVenture.' },
  { title: '3. Account Registration', body: 'You must provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials. You are responsible for all activities that occur under your account.' },
  { title: '4. Bookings and Payments', body: 'All bookings are subject to availability and confirmation by GoVenture and its partner airlines, hotels, and tour providers. Prices, packages, and schedules are subject to change without prior notice unless already confirmed. Full or partial payment may be required to confirm a reservation, in accordance with the payment terms shown at checkout.' },
  { title: '5. Cancellations and Refunds', body: 'Cancellation, rebooking, and refund policies vary depending on the tour package, airline, or hotel partner involved, and will be disclosed at the time of booking. GoVenture is not liable for losses arising from cancellations made by third-party providers.' },
  { title: '6. User Conduct', body: 'You agree not to misuse the Services, including but not limited to submitting false information, attempting to gain unauthorized access to other accounts, or using the platform for any unlawful purpose.' },
  { title: '7. Limitation of Liability', body: 'GoVenture acts as an intermediary between you and third-party travel service providers. We are not liable for delays, cancellations, accidents, loss of belongings, or other issues caused by airlines, hotels, transportation providers, or circumstances beyond our reasonable control.' },
  { title: '8. Amendments', body: 'GoVenture may update these Terms & Conditions from time to time. Continued use of the Services after changes take effect constitutes acceptance of the revised terms.' },
  { title: '9. Governing Law', body: 'These Terms & Conditions shall be governed by and construed in accordance with the laws of the Republic of the Philippines.' },
  { title: '10. Contact Information', body: 'For questions regarding these Terms & Conditions, you may contact us at goventure.travelagency@gmail.com or call us at 0936 281 8335.' },
];

const PRIVACY_SECTIONS: LegalSection[] = [
  { title: '1. Introduction', body: 'GoVenture Travel and Tours ("GoVenture," "we," "our," or "us") values your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and protect your personal data when you use the GoVenture mobile application and booking services. This Privacy Policy is implemented in accordance with Republic Act No. 10173 (Data Privacy Act of 2012) and its Implementing Rules and Regulations.' },
  { title: '2. Scope', body: 'This Privacy Policy applies to all users of the GoVenture Travel and Tours mobile application, website, and official communication channels used for inquiries, reservations, bookings, payments, and customer support. By using our services, you acknowledge that you have read and understood this Privacy Policy and consent to the processing of your personal information as described herein.' },
  { title: '3. Information We Collect', body: 'Personal Information: Full Name, Mobile Number, Email Address, Home Address (if required), Date of Birth (if required), Government-issued Identification, Passport Information (for international travel).\n\nBooking Information: Destination, Travel Dates, Tour Package Selected, Number of Travelers, Special Requests.\n\nPayment Information: Payment Reference Number, Proof of Payment, Transaction History.\n\nInformation from Social Login (Google / Facebook): If you choose to sign in using Google or Facebook, we receive your basic profile information (name, email address, and profile ID) from that provider, which we use solely to create or match your GoVenture account. We do not receive or store your social media password.' },
  { title: '4. Purpose of Collecting Information', body: 'Your personal information is collected only for legitimate business purposes, including: processing booking reservations, preparing travel itineraries, confirming bookings, coordinating with partner airlines, hotels, and tour providers, processing payments, providing customer support, sending booking confirmations and travel updates, improving our services, and complying with legal obligations.' },
  { title: '5. Data Security', body: 'GoVenture Travel and Tours implements appropriate organizational, physical, and technical safeguards to protect your personal information from unauthorized access, disclosure, alteration, or destruction. Although we take reasonable measures to secure your information, no electronic storage or internet transmission is completely secure.' },
  { title: '6. Sharing of Information', body: 'Your information may only be shared when necessary with: Airlines, Hotels, Tour Operators, Transportation Providers, Payment Service Providers, Government Agencies when required by law. GoVenture Travel and Tours does not sell, rent, or trade your personal information to third parties for marketing purposes.' },
  { title: '7. Data Retention', body: 'We retain your personal information only for as long as necessary to: complete your booking transactions; provide customer support; comply with Philippine laws and regulations; resolve disputes and enforce agreements. Once the information is no longer necessary, it will be securely deleted or anonymized.' },
  { title: '8. Your Rights', body: 'Under the Data Privacy Act of 2012, you have the right to: be informed, access your personal information, correct inaccurate information, object to data processing, request deletion of your information when applicable, request data portability, and file a complaint with the National Privacy Commission if your rights have been violated.' },
  { title: '9. Updates to this Privacy Policy', body: 'GoVenture Travel and Tours may revise this Privacy Policy from time to time. Any updates will be posted within the application, and the Effective Date will be updated accordingly.' },
  { title: '10. Contact Information', body: 'For questions regarding this Privacy Policy or your personal information, you may contact: GoVenture Travel and Tours, Email: goventure.travelagency@gmail.com, Phone: 0936 281 8335, Office Address: 12 Zorsozo St, Lian, Batangas.' },
];

const PASSWORD_RULES: { label: string; test: (pw: string) => boolean }[] = [
  { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'One lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { label: 'One number', test: (pw) => /[0-9]/.test(pw) },
  { label: 'One special character', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

const daysUntil = (iso: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${iso}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
};

const expiryWarning = (label: string, iso: string): string | null => {
  if (!iso) return null;
  const days = daysUntil(iso);
  if (days > 30) return null;
  const dateStr = formatDobDisplay(iso);
  if (days < 0) return `Your ${label} expired ${Math.abs(days)} day(s) ago (${dateStr}).`;
  if (days === 0) return `Your ${label} expires today (${dateStr}).`;
  return `Your ${label} expires in ${days} day(s) (${dateStr}).`;
};

type Props = {
  visible:  boolean;
  userId:   string | undefined;
  onClose:  () => void;
  /** Auto-scrolls to the Travel Documents card once loaded, e.g. when arriving from the Documents tab's "Add in Account…" link on a missing Passport/Government ID. */
  focusSection?: 'travelDocuments' | null;
};

export default function EditProfileModal({ visible, userId, onClose, focusSection }: Props) {
  const insets = useSafeAreaInsets();
  const { updateUser } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  const travelDocsY = useRef(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'Female' | 'Male'>('Female');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [dobPickerVisible, setDobPickerVisible] = useState(false);

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [changePhotoVisible, setChangePhotoVisible] = useState(false);
  const [photoUpdatedVisible, setPhotoUpdatedVisible] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('Profile updated successfully');
  const toastAnim = useRef(new Animated.Value(0)).current;

  // Privacy & Security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  // Travel Documents
  const [passportNumber, setPassportNumber] = useState('');
  const [passportExpiry, setPassportExpiry] = useState('');
  const [passportExpiryPickerVisible, setPassportExpiryPickerVisible] = useState(false);
  const [validIdType, setValidIdType] = useState('');
  const [validIdTypePickerVisible, setValidIdTypePickerVisible] = useState(false);
  const [idExpiry, setIdExpiry] = useState('');
  const [idExpiryPickerVisible, setIdExpiryPickerVisible] = useState(false);

  const [passportImageUri, setPassportImageUri] = useState<string | null>(null);
  const [passportImageDataUri, setPassportImageDataUri] = useState<string | null>(null);
  const [passportImageRemoved, setPassportImageRemoved] = useState(false);

  const [validIdImageUri, setValidIdImageUri] = useState<string | null>(null);
  const [validIdImageDataUri, setValidIdImageDataUri] = useState<string | null>(null);
  const [validIdImageRemoved, setValidIdImageRemoved] = useState(false);

  const [docError, setDocError] = useState('');
  const [docSaving, setDocSaving] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);

  // Legal & Account
  const [termsVisible, setTermsVisible] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);

  useEffect(() => {
    if (!visible || !userId) return;
    setLoading(true);
    setError('');
    fetch(`${CLIENT_ACCOUNT_GET_API_URL}&userId=${userId}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.status !== 'success') throw new Error(result.message || 'Failed to load account.');
        setFirstName(result.data.firstName);
        setLastName(result.data.lastName);
        setEmail(result.data.email);
        setPhone(result.data.phone ?? '');
        setGender(result.data.gender === 'Male' ? 'Male' : 'Female');
        setDateOfBirth(result.data.dateOfBirth ?? '');
        setAvatarUri(result.data.avatarUrl ?? null);
        setPassportNumber(result.data.passportNumber ?? '');
        setPassportExpiry(result.data.passportExpiry ?? '');
        setValidIdType(result.data.validIdType ?? '');
        setIdExpiry(result.data.idExpiry ?? '');
        setPassportImageUri(result.data.passportImageUrl ?? null);
        setValidIdImageUri(result.data.validIdImageUrl ?? null);
        setPassportImageDataUri(null);
        setValidIdImageDataUri(null);
        setPassportImageRemoved(false);
        setValidIdImageRemoved(false);
      })
      .catch((e) => setError(e.message || 'Failed to load account.'))
      .finally(() => setLoading(false));
  }, [visible, userId]);

  useEffect(() => {
    if (!visible || loading || focusSection !== 'travelDocuments') return;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(travelDocsY.current - 12, 0), animated: true });
    }, 250);
    return () => clearTimeout(timer);
  }, [visible, loading, focusSection]);

  const launchPicker = async (source: 'camera' | 'library') => {
    setChangePhotoVisible(false);
    const perm = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', source === 'camera' ? 'Allow camera access to take a photo.' : 'Allow photo library access to choose a photo.');
      return;
    }
    const options = { allowsEditing: true, aspect: [1, 1] as [number, number], quality: 0.7, base64: true };
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], ...options });
    const asset = result.canceled ? null : result.assets?.[0];
    if (!asset?.base64) return;

    const mimeType = asset.mimeType ?? 'image/jpeg';
    setAvatarSaving(true);
    try {
      const res = await fetch(CLIENT_AVATAR_UPDATE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, avatarDataUri: `data:${mimeType};base64,${asset.base64}` }),
      });
      const result2 = await res.json();
      if (result2.status !== 'success') throw new Error(result2.message || 'Failed to save photo.');
      setAvatarUri(result2.data.avatarUrl);
      await updateUser({ avatarUrl: result2.data.avatarUrl });
      setPhotoUpdatedVisible(true);
    } catch (e: any) {
      Alert.alert('Upload failed', e.message || 'Please check your connection and try again.');
    } finally {
      setAvatarSaving(false);
    }
  };

  const pickDocumentImage = async (docType: 'passport' | 'validId', source: 'camera' | 'library') => {
    const perm = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', source === 'camera' ? 'Allow camera access to scan the document.' : 'Allow photo library access to choose a file.');
      return;
    }
    const options = { allowsEditing: true, aspect: [3, 2] as [number, number], quality: 0.7, base64: true };
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], ...options });
    const asset = result.canceled ? null : result.assets?.[0];
    if (!asset?.base64) return;

    const mimeType = asset.mimeType ?? 'image/jpeg';
    const dataUri = `data:${mimeType};base64,${asset.base64}`;
    if (docType === 'passport') {
      setPassportImageUri(asset.uri);
      setPassportImageDataUri(dataUri);
      setPassportImageRemoved(false);
    } else {
      setValidIdImageUri(asset.uri);
      setValidIdImageDataUri(dataUri);
      setValidIdImageRemoved(false);
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setToastVisible(false));
  };

  const validate = (): string | null => {
    if (!firstName.trim()) return 'First name is required.';
    if (!lastName.trim()) return 'Last name is required.';
    if (!email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Please enter a valid email address.';
    if (!phone.trim()) return 'Contact number is required.';
    if (!/^[0-9+\-\s()]{7,20}$/.test(phone.trim())) return 'Please enter a valid contact number.';
    return null;
  };

  const handleSave = async () => {
    if (!userId) return;
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError('');
    setSaving(true);
    try {
      const res = await fetch(CLIENT_PROFILE_UPDATE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          gender,
          dateOfBirth,
        }),
      });
      const result = await res.json();
      if (result.status !== 'success') throw new Error(result.message || 'Failed to save.');

      await updateUser({
        firstName: result.data.firstName,
        lastName: result.data.lastName,
        fullName: result.data.fullName,
        email: result.data.email,
      });
      showToast('Profile updated successfully');
    } catch (e: any) {
      setError(e.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const validatePassword = (): string | null => {
    if (!currentPassword) return 'Please enter your current password.';
    if (!newPassword) return 'Please enter a new password.';
    if (!PASSWORD_RULES.every((r) => r.test(newPassword))) return 'New password does not meet all requirements.';
    if (newPassword !== confirmPassword) return 'New password and confirmation do not match.';
    return null;
  };

  const handleSavePassword = async () => {
    if (!userId) return;
    const validationError = validatePassword();
    if (validationError) { setPwError(validationError); return; }
    setPwError('');
    setPwSaving(true);
    try {
      const res = await fetch(CHANGE_PASSWORD_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currentPassword, newPassword }),
      });
      const result = await res.json();
      if (result.status !== 'success') throw new Error(result.message || 'Failed to update password.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password updated successfully');
    } catch (e: any) {
      setPwError(e.message || 'Failed to update password.');
    } finally {
      setPwSaving(false);
    }
  };

  const handleSaveTravelDocuments = async () => {
    if (!userId) return;
    setDocError('');
    setDocSaving(true);
    try {
      const res = await fetch(CLIENT_TRAVEL_DOCUMENTS_UPDATE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          passportNumber: passportNumber.trim(),
          passportExpiry,
          validIdType,
          idExpiry,
          passportImageDataUri: passportImageDataUri || undefined,
          validIdImageDataUri: validIdImageDataUri || undefined,
          removePassportImage: passportImageRemoved && !passportImageDataUri,
          removeValidIdImage: validIdImageRemoved && !validIdImageDataUri,
        }),
      });
      const result = await res.json();
      if (result.status !== 'success') throw new Error(result.message || 'Failed to save travel documents.');
      setPassportImageUri(result.data.passportImageUrl ?? null);
      setValidIdImageUri(result.data.validIdImageUrl ?? null);
      setPassportImageDataUri(null);
      setValidIdImageDataUri(null);
      setPassportImageRemoved(false);
      setValidIdImageRemoved(false);
      showToast('Travel documents updated successfully');
    } catch (e: any) {
      setDocError(e.message || 'Failed to save travel documents.');
    } finally {
      setDocSaving(false);
    }
  };

  const passportBanner = expiryWarning('passport', passportExpiry);
  const idBanner = expiryWarning('valid ID', idExpiry);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={s.safe}>
        <View style={[s.header, { paddingTop: insets.top + 14 }]}>
          <TouchableOpacity style={s.backBtn} activeOpacity={0.85} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Edit Profile</Text>
          <View style={{ width: 34 }} />
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator color={C.amber} /></View>
        ) : (
          <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
            <View style={s.avatarSection}>
              <TouchableOpacity style={s.avatarWrap} activeOpacity={0.85} onPress={() => setChangePhotoVisible(true)} disabled={avatarSaving}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={s.avatarImage} resizeMode="cover" />
                ) : (
                  <View style={s.avatarPlaceholder}><PersonPlaceholderIcon /></View>
                )}
                {avatarSaving && (
                  <View style={s.avatarSavingOverlay}><ActivityIndicator color="#FFFFFF" /></View>
                )}
                <View style={s.cameraBadge}><CameraIcon /></View>
              </TouchableOpacity>
              <Text style={s.avatarHint}>{avatarSaving ? 'Saving photo…' : 'Tap to change photo'}</Text>
            </View>

            {/* ── Personal Information ── */}
            <Text style={s.sectionLabel}>PERSONAL INFORMATION</Text>
            <View style={s.infoCard}>
              <View style={s.fieldRow}>
                <View style={s.fieldHalf}>
                  <Text style={s.editFieldLabel}>First Name</Text>
                  <TextInput style={s.editInput} value={firstName} onChangeText={setFirstName} placeholder="First name" placeholderTextColor={C.brownMid + '80'} />
                </View>
                <View style={s.fieldHalf}>
                  <Text style={s.editFieldLabel}>Last Name</Text>
                  <TextInput style={s.editInput} value={lastName} onChangeText={setLastName} placeholder="Last name" placeholderTextColor={C.brownMid + '80'} />
                </View>
              </View>

              <Text style={s.editFieldLabel}>Email</Text>
              <TextInput
                style={s.editInput} value={email} onChangeText={setEmail}
                placeholder="you@email.com" placeholderTextColor={C.brownMid + '80'}
                keyboardType="email-address" autoCapitalize="none"
              />

              <Text style={s.editFieldLabel}>Contact Number</Text>
              <TextInput
                style={s.editInput} value={phone} onChangeText={setPhone}
                placeholder="+63 9XX XXX XXXX" placeholderTextColor={C.brownMid + '80'}
                keyboardType="phone-pad"
              />

              <Text style={s.editFieldLabel}>Gender</Text>
              <View style={s.genderRow}>
                {(['Female', 'Male'] as const).map((g) => (
                  <TouchableOpacity key={g} style={s.genderOption} activeOpacity={0.75} onPress={() => setGender(g)}>
                    <View style={[s.radio, gender === g && s.radioActive]}>{gender === g && <View style={s.radioDot} />}</View>
                    <Text style={s.radioLabel}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.editFieldLabel}>Date of Birth (optional)</Text>
              <TouchableOpacity style={s.editInput} activeOpacity={0.8} onPress={() => setDobPickerVisible(true)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: dateOfBirth ? C.brown : C.brownMid + '80' }}>
                    {dateOfBirth ? formatDobDisplay(dateOfBirth) : 'Select date of birth'}
                  </Text>
                  <CalendarIcon />
                </View>
              </TouchableOpacity>

              {!!error && <Text style={s.errorText}>{error}</Text>}

              <TouchableOpacity style={[s.saveBtn, { marginTop: 16 }, saving && { opacity: 0.7 }]} activeOpacity={0.85} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Save Changes</Text>}
              </TouchableOpacity>
            </View>

            {/* ── Privacy & Security ── */}
            <Text style={s.sectionLabel}>PRIVACY & SECURITY</Text>
            <View style={s.infoCard}>
              <View style={s.cardHeaderRow}>
                <ShieldLockIcon />
                <Text style={s.cardHeaderText}>Change Password</Text>
              </View>

              <Text style={s.editFieldLabel}>Current Password</Text>
              <View style={s.pwInputWrap}>
                <TextInput
                  style={s.pwInput} value={currentPassword} onChangeText={setCurrentPassword}
                  secureTextEntry={!showCurrentPw} placeholder="Enter current password" placeholderTextColor={C.brownMid + '80'}
                />
                <TouchableOpacity onPress={() => setShowCurrentPw((v) => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  {showCurrentPw ? <EyeOffIcon /> : <EyeIcon />}
                </TouchableOpacity>
              </View>

              <Text style={s.editFieldLabel}>New Password</Text>
              <View style={s.pwInputWrap}>
                <TextInput
                  style={s.pwInput} value={newPassword} onChangeText={setNewPassword}
                  secureTextEntry={!showNewPw} placeholder="Enter new password" placeholderTextColor={C.brownMid + '80'}
                />
                <TouchableOpacity onPress={() => setShowNewPw((v) => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  {showNewPw ? <EyeOffIcon /> : <EyeIcon />}
                </TouchableOpacity>
              </View>

              <Text style={s.editFieldLabel}>Confirm New Password</Text>
              <View style={s.pwInputWrap}>
                <TextInput
                  style={s.pwInput} value={confirmPassword} onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPw} placeholder="Re-enter new password" placeholderTextColor={C.brownMid + '80'}
                />
                <TouchableOpacity onPress={() => setShowConfirmPw((v) => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  {showConfirmPw ? <EyeOffIcon /> : <EyeIcon />}
                </TouchableOpacity>
              </View>

              <View style={s.checklistBox}>
                <Text style={s.checklistTitle}>Password must contain:</Text>
                {PASSWORD_RULES.map((rule) => {
                  const passed = rule.test(newPassword);
                  return (
                    <View key={rule.label} style={s.checklistRow}>
                      <CheckDotIcon active={passed} />
                      <Text style={[s.checklistText, passed && s.checklistTextActive]}>{rule.label}</Text>
                    </View>
                  );
                })}
              </View>

              {!!pwError && <Text style={s.errorText}>{pwError}</Text>}

              <TouchableOpacity style={[s.saveBtn, { marginTop: 16 }, pwSaving && { opacity: 0.7 }]} activeOpacity={0.85} onPress={handleSavePassword} disabled={pwSaving}>
                {pwSaving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Update Password</Text>}
              </TouchableOpacity>
            </View>

            {/* ── Travel Documents ── */}
            <View onLayout={(e) => { travelDocsY.current = e.nativeEvent.layout.y; }}>
              <Text style={s.sectionLabel}>TRAVEL DOCUMENTS</Text>
              <View style={s.infoCard}>
                <View style={s.cardHeaderRow}>
                  <DocumentSectionIcon />
                  <Text style={s.cardHeaderText}>Passport & Valid ID</Text>
                </View>

              {!!passportBanner && (
                <View style={s.warningBanner}>
                  <WarningIcon />
                  <Text style={s.warningText}>{passportBanner}</Text>
                </View>
              )}
              {!!idBanner && (
                <View style={s.warningBanner}>
                  <WarningIcon />
                  <Text style={s.warningText}>{idBanner}</Text>
                </View>
              )}

              <Text style={s.docGroupTitle}>Passport</Text>
              <DocumentAttachRow
                imageUri={passportImageUri}
                onScan={() => pickDocumentImage('passport', 'camera')}
                onUpload={() => pickDocumentImage('passport', 'library')}
                onView={() => setPreviewImageUri(passportImageUri)}
                onRemove={() => { setPassportImageUri(null); setPassportImageDataUri(null); setPassportImageRemoved(true); }}
                scanLabel="Scan Passport"
                uploadLabel="Upload Passport"
                viewLabel="View current passport"
              />

              <Text style={s.editFieldLabel}>Passport Number</Text>
              <TextInput
                style={s.editInput} value={passportNumber} onChangeText={setPassportNumber}
                placeholder="e.g. P1234567A" placeholderTextColor={C.brownMid + '80'} autoCapitalize="characters"
              />

              <Text style={s.editFieldLabel}>Passport Expiry</Text>
              <TouchableOpacity style={s.editInput} activeOpacity={0.8} onPress={() => setPassportExpiryPickerVisible(true)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: passportExpiry ? C.brown : C.brownMid + '80' }}>
                    {passportExpiry ? formatDobDisplay(passportExpiry) : 'Select passport expiry'}
                  </Text>
                  <CalendarIcon />
                </View>
              </TouchableOpacity>

              <View style={s.groupDivider} />

              <Text style={s.docGroupTitle}>Valid ID</Text>
              <DocumentAttachRow
                imageUri={validIdImageUri}
                onScan={() => pickDocumentImage('validId', 'camera')}
                onUpload={() => pickDocumentImage('validId', 'library')}
                onView={() => setPreviewImageUri(validIdImageUri)}
                onRemove={() => { setValidIdImageUri(null); setValidIdImageDataUri(null); setValidIdImageRemoved(true); }}
                scanLabel="Scan ID"
                uploadLabel="Upload ID"
                viewLabel="View current ID"
              />

              <Text style={s.editFieldLabel}>Valid ID Type</Text>
              <TouchableOpacity style={s.editInput} activeOpacity={0.8} onPress={() => setValidIdTypePickerVisible(true)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: validIdType ? C.brown : C.brownMid + '80' }} numberOfLines={1}>
                    {validIdType || 'Select ID type'}
                  </Text>
                  <ChevronDownIcon />
                </View>
              </TouchableOpacity>

              <Text style={s.editFieldLabel}>ID Expiry</Text>
              <TouchableOpacity style={s.editInput} activeOpacity={0.8} onPress={() => setIdExpiryPickerVisible(true)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: idExpiry ? C.brown : C.brownMid + '80' }}>
                    {idExpiry ? formatDobDisplay(idExpiry) : 'Select ID expiry'}
                  </Text>
                  <CalendarIcon />
                </View>
              </TouchableOpacity>

              {!!docError && <Text style={s.errorText}>{docError}</Text>}

                <TouchableOpacity style={[s.saveBtn, { marginTop: 16 }, docSaving && { opacity: 0.7 }]} activeOpacity={0.85} onPress={handleSaveTravelDocuments} disabled={docSaving}>
                  {docSaving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Save Travel Documents</Text>}
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Legal & Account ── */}
            <Text style={s.sectionLabel}>LEGAL & ACCOUNT</Text>
            <View style={s.infoCard}>
              <View style={s.cardHeaderRow}>
                <DocumentSectionIcon />
                <Text style={s.cardHeaderText}>Legal & Account</Text>
              </View>

              <Text style={s.legalSubheading}>LEGAL</Text>
              <View style={s.legalRow}>
                <TouchableOpacity style={s.legalBtn} activeOpacity={0.8} onPress={() => setTermsVisible(true)}>
                  <DocumentSectionIcon />
                  <Text style={s.legalBtnText}>Terms & Conditions</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.legalBtn} activeOpacity={0.8} onPress={() => setPrivacyVisible(true)}>
                  <LockIcon />
                  <Text style={s.legalBtnText}>Privacy Policy</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}

        {toastVisible && (
          <Animated.View
            style={[
              s.toast,
              { bottom: insets.bottom + 20, opacity: toastAnim, transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
            ]}
          >
            <CheckCircleIcon />
            <Text style={s.toastText}>{toastMessage}</Text>
          </Animated.View>
        )}
      </View>

      <DatePickerModal
        visible={dobPickerVisible}
        title="Date of Birth"
        value={dateOfBirth}
        disableFutureDates
        onClose={() => setDobPickerVisible(false)}
        onSelect={setDateOfBirth}
      />
      <DatePickerModal
        visible={passportExpiryPickerVisible}
        title="Passport Expiry"
        value={passportExpiry}
        onClose={() => setPassportExpiryPickerVisible(false)}
        onSelect={setPassportExpiry}
      />
      <DatePickerModal
        visible={idExpiryPickerVisible}
        title="ID Expiry"
        value={idExpiry}
        onClose={() => setIdExpiryPickerVisible(false)}
        onSelect={setIdExpiry}
      />
      <ValidIdTypeModal
        visible={validIdTypePickerVisible}
        value={validIdType}
        onClose={() => setValidIdTypePickerVisible(false)}
        onSelect={setValidIdType}
      />
      <ImageViewerModal uri={previewImageUri} onClose={() => setPreviewImageUri(null)} />

      <LegalDocumentModal
        visible={termsVisible}
        title="Terms & Conditions"
        effectiveDate="July 2026"
        sections={TERMS_SECTIONS}
        onClose={() => setTermsVisible(false)}
      />
      <LegalDocumentModal
        visible={privacyVisible}
        title="Privacy Policy"
        effectiveDate="July 2026"
        sections={PRIVACY_SECTIONS}
        onClose={() => setPrivacyVisible(false)}
      />

      <ChangePhotoModal
        visible={changePhotoVisible}
        onClose={() => setChangePhotoVisible(false)}
        onTakePhoto={() => launchPicker('camera')}
        onChooseLibrary={() => launchPicker('library')}
      />
      <PhotoUpdatedModal visible={photoUpdatedVisible} onClose={() => setPhotoUpdatedVisible(false)} />
    </Modal>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.lightBg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 14, backgroundColor: C.amber,
  },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '900', color: '#FFFFFF' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  body: { padding: 16, paddingBottom: 32 },

  avatarSection: { alignItems: 'center', marginBottom: 20 },
  avatarWrap: { width: 92, height: 92, borderRadius: 46, position: 'relative' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 46 },
  avatarPlaceholder: {
    width: '100%', height: '100%', borderRadius: 46, backgroundColor: C.amber,
    alignItems: 'center', justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute', bottom: -2, right: -2, width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.brown, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: C.lightBg,
  },
  avatarSavingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 46,
    backgroundColor: 'rgba(59,26,12,0.45)', alignItems: 'center', justifyContent: 'center',
  },
  avatarHint: { fontSize: 11, fontWeight: '700', color: C.brownMid, opacity: 0.75, marginTop: 10 },

  sectionLabel: { fontSize: 10.5, fontWeight: '800', color: C.brownMid, opacity: 0.65, letterSpacing: 0.6, marginBottom: 8, marginTop: 22 },
  infoCard: {
    backgroundColor: C.cardBg, borderRadius: 14, padding: 10,
    borderWidth: 1, borderColor: C.divider,
  },

  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 4, marginBottom: 4 },
  cardHeaderText: { fontSize: 12.5, fontWeight: '900', color: C.brown },

  fieldRow: { flexDirection: 'row', gap: 10 },
  fieldHalf: { flex: 1 },

  editFieldLabel: { fontSize: 10.5, fontWeight: '800', color: C.brownMid, opacity: 0.75, marginBottom: 6, marginTop: 12, marginHorizontal: 4 },
  editInput: {
    marginHorizontal: 4, backgroundColor: C.lightBg, borderRadius: 12, borderWidth: 1, borderColor: C.divider,
    paddingHorizontal: 13, paddingVertical: 11, fontSize: 13, color: C.brown, marginBottom: 4,
  },

  genderRow: { flexDirection: 'row', gap: 22, marginHorizontal: 4, marginTop: 2 },
  genderOption: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: C.divider, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: C.success },
  radioDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: C.success },
  radioLabel: { fontSize: 12.5, fontWeight: '600', color: C.brown },

  errorText: { color: C.danger, fontSize: 12, fontWeight: '700', marginTop: 12, marginHorizontal: 4 },

  saveBtn: {
    backgroundColor: C.amber, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, marginTop: 20,
  },
  saveBtnText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },

  toast: {
    position: 'absolute', left: 20, right: 20,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#12946F', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 6 },
    }),
  },
  toastText: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' },

  /* Privacy & Security */
  pwInputWrap: {
    marginHorizontal: 4, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.lightBg, borderRadius: 12, borderWidth: 1, borderColor: C.divider,
    paddingHorizontal: 13, paddingVertical: 4, marginBottom: 4,
  },
  pwInput: { flex: 1, fontSize: 13, color: C.brown, paddingVertical: 9 },

  checklistBox: {
    marginHorizontal: 4, marginTop: 14, backgroundColor: C.lightBg, borderRadius: 12,
    borderWidth: 1, borderColor: C.divider, padding: 12, gap: 8,
  },
  checklistTitle: { fontSize: 11, fontWeight: '800', color: C.brownMid, marginBottom: 2 },
  checklistRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checklistText: { fontSize: 11.5, fontWeight: '600', color: C.brownMid, opacity: 0.75 },
  checklistTextActive: { color: C.success, opacity: 1, fontWeight: '800' },

  /* Travel Documents */
  warningBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#FCE4E1', borderRadius: 12, borderWidth: 1, borderColor: '#F4B4AC',
    paddingHorizontal: 12, paddingVertical: 10, marginHorizontal: 4, marginBottom: 10,
  },
  warningText: { flex: 1, fontSize: 11.5, fontWeight: '700', color: C.danger, lineHeight: 16 },

  docGroupTitle: { fontSize: 11.5, fontWeight: '900', color: C.brown, marginHorizontal: 4, marginTop: 4, marginBottom: 8 },
  groupDivider: { height: 1, backgroundColor: C.divider, marginHorizontal: 4, marginTop: 14, marginBottom: 4 },

  attachRow: { flexDirection: 'row', gap: 12, marginHorizontal: 4, marginBottom: 6 },
  attachThumbWrap: { width: 58, height: 58, borderRadius: 10, overflow: 'hidden', flexShrink: 0 },
  attachThumb: { width: '100%', height: '100%' },
  attachThumbPlaceholder: {
    width: '100%', height: '100%', backgroundColor: C.lightBg, borderWidth: 1, borderColor: C.divider,
    alignItems: 'center', justifyContent: 'center',
  },
  attachBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1,
    backgroundColor: C.lightBg, borderWidth: 1, borderColor: C.divider, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 9,
  },
  attachBtnText: { fontSize: 11, fontWeight: '800', color: C.brownMid, flexShrink: 1 },
  attachLink: { fontSize: 11, fontWeight: '800', color: C.amber },
  attachHint: { fontSize: 10.5, fontWeight: '600', color: C.brownMid, opacity: 0.6 },

  /* Legal & Account */
  legalSubheading: { fontSize: 10, fontWeight: '800', color: C.brownMid, opacity: 0.6, letterSpacing: 0.6, marginHorizontal: 4, marginTop: 10, marginBottom: 8 },
  legalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginHorizontal: 4 },
  legalBtn: {
    flexGrow: 1, flexBasis: '46%', flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.lightBg, borderWidth: 1, borderColor: C.divider, borderRadius: 12,
    paddingHorizontal: 13, paddingVertical: 13,
  },
  legalBtnText: { fontSize: 12, fontWeight: '800', color: C.brown, flexShrink: 1 },
});

const dp = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(59,26,12,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: {
    width: '100%', maxWidth: 340, maxHeight: '80%',
    backgroundColor: C.cardBg, borderRadius: 18, padding: 18,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 8 },
    }),
  },
  title: { fontSize: 15, fontWeight: '900', color: C.brown, marginBottom: 12 },

  navRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  monthBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.lightBg, borderWidth: 1, borderColor: C.divider, alignItems: 'center', justifyContent: 'center' },
  navArrow: { fontSize: 16, fontWeight: '900', color: C.brown, marginTop: -2 },
  monthLabel: { fontSize: 12.5, fontWeight: '800', color: C.brown, flex: 1 },
  yearBtn: { borderWidth: 1, borderColor: C.divider, backgroundColor: C.lightBg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  yearLabel: { fontSize: 12, fontWeight: '800', color: C.brown },

  yearMenu: { maxHeight: 260, marginTop: 10 },
  yearMenuItem: { paddingVertical: 10, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.divider },
  yearMenuItemText: { fontSize: 13, fontWeight: '700', color: C.brownMid },
  yearMenuItemTextActive: { color: C.amber, fontWeight: '900' },

  weekRow: { flexDirection: 'row', marginTop: 12 },
  weekLetter: { flex: 1, textAlign: 'center', fontSize: 9.5, fontWeight: '800', color: C.brownMid, opacity: 0.6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayBtn: { width: '78%', aspectRatio: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  dayBtnActive: { backgroundColor: C.amber },
  dayText: { fontSize: 11, fontWeight: '600', color: C.brown },
  dayTextDisabled: { color: C.brownMid, opacity: 0.3 },
  dayTextActive: { color: '#FFFFFF', fontWeight: '800' },

  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  cancelText: { fontSize: 12, fontWeight: '800', color: C.brownMid },
  applyBtn: { backgroundColor: C.brown, borderRadius: 12, paddingHorizontal: 22, paddingVertical: 10 },
  applyBtnText: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' },
});

const cp = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(59,26,12,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%', maxWidth: 340,
    backgroundColor: C.cardBg, borderRadius: 20, padding: 8, paddingTop: 20,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 12 },
    }),
  },
  title: { fontSize: 16, fontWeight: '900', color: C.brown, textAlign: 'center', paddingHorizontal: 14 },
  subtitle: { fontSize: 11.5, color: C.brownMid, opacity: 0.75, textAlign: 'center', marginTop: 3, marginBottom: 12, paddingHorizontal: 14 },

  optionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: C.divider,
  },
  optionIconWrap: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: C.lightBg,
    alignItems: 'center', justifyContent: 'center',
  },
  optionText: { fontSize: 13.5, fontWeight: '800', color: C.brown },

  idOptionRow: {
    paddingHorizontal: 14, paddingVertical: 13,
    borderTopWidth: 1, borderTopColor: C.divider,
  },

  cancelBtn: {
    marginTop: 8, borderTopWidth: 1, borderTopColor: C.divider,
    paddingVertical: 14, alignItems: 'center',
  },
  cancelText: { fontSize: 13, fontWeight: '800', color: C.danger },
});

const pu = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(59,26,12,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%', maxWidth: 320,
    backgroundColor: C.cardBg, borderRadius: 22,
    paddingHorizontal: 22, paddingVertical: 26,
    alignItems: 'center',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 12 },
    }),
  },
  iconCircle: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#EAF7EC', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { fontSize: 17, fontWeight: '900', color: C.brown, textAlign: 'center', marginBottom: 8 },
  message: { fontSize: 12, color: C.brownMid, textAlign: 'center', lineHeight: 18, opacity: 0.85, marginBottom: 20 },
  closeBtn: { width: '100%', borderRadius: 50, paddingVertical: 12, alignItems: 'center', backgroundColor: '#12946F' },
  closeBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12, letterSpacing: 0.6 },
});

const iv = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center' },
  closeBtn: {
    position: 'absolute', top: 50, right: 20, zIndex: 1,
    width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  image: { width: '100%', height: '80%' },
});

const lg = StyleSheet.create({
  body: { padding: 20, paddingBottom: 40 },
  docTitle: { fontSize: 17, fontWeight: '900', color: C.brown },
  effectiveDate: { fontSize: 11.5, fontWeight: '700', color: C.brownMid, opacity: 0.7, marginTop: 4, marginBottom: 18 },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: C.brown, marginBottom: 6 },
  sectionBody: { fontSize: 12.5, color: C.brownMid, lineHeight: 20, opacity: 0.9 },
});
