/**
 * TourDetailModal.tsx
 * Full-screen "View Details" page for a tour package — banner header (using
 * the package's own accent gradient), about section, price/booking card,
 * trust badges, inclusions/exclusions, an expandable day-by-day itinerary,
 * a map placeholder, and reviews.
 */

import React, { useMemo, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import Copyright from '@/components/Copyright';
import { C as LIGHT_C } from '../dashboard/theme';
import { useAppTheme, ColorPalette } from '../ThemeContext';
import { TourPackage, DEFAULT_INCLUSIONS, DEFAULT_EXCLUSIONS, DEFAULT_REVIEWS, formatPeso } from './mockData';

const REVIEW_AVATAR_COLORS = ['#12946F', LIGHT_C.amber, LIGHT_C.info, LIGHT_C.purple];

/* ── Icons ── */
const BackIcon = () => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
    <Path d="M15 19l-7-7 7-7" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const StarIcon = ({ filled, size = 11 }: { filled: boolean; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? '#F2C14E' : 'none'}>
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="#F2C14E" strokeWidth={1.4} strokeLinejoin="round" />
  </Svg>
);
const PinIcon = ({ color = 'rgba(255,255,255,0.85)' }: { color?: string }) => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
    <Path d="M12 21s-7-6.4-7-11.5A7 7 0 0119 9.5C19 14.6 12 21 12 21z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    <Path d="M14.5 9.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" stroke={color} strokeWidth={1.8} />
  </Svg>
);
const CheckIcon = () => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke="#12946F" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const XIcon = ({ color }: { color: string }) => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
  </Svg>
);
const HeartIcon = ({ color }: { color: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M20.8 4.6a5.4 5.4 0 00-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 00-7.6 7.6l1.2 1.2L12 21l7.6-7.6 1.2-1.2a5.4 5.4 0 000-7.6z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
  </Svg>
);
const ShieldIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#12946F" strokeWidth={1.8} strokeLinejoin="round" />
    <Path d="M9 12l2 2 4-4" stroke="#12946F" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const BoltIcon = ({ color }: { color: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" fill={color} />
  </Svg>
);
const ChevronDownIcon = ({ color }: { color: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const BoatIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M3 16h18l-2 4H5l-2-4zM6 16V9h12v7M12 9V3M9 6h6" stroke="rgba(255,255,255,0.8)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const MountainIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M3 19L9 8l4 6 2-3 6 8H3z" fill="rgba(255,255,255,0.85)" />
  </Svg>
);
const SunsetIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M12 17a5 5 0 100-10 5 5 0 000 10zM3 21h18M4 17l2-2m12 2l-2-2" stroke="rgba(255,255,255,0.85)" strokeWidth={1.6} strokeLinecap="round" />
  </Svg>
);

const SectionTitle = ({ children, td }: { children: React.ReactNode; td: ReturnType<typeof makeStyles> }) => (
  <Text style={td.sectionTitle}>{children}</Text>
);

const Chip = ({ label, tone, td }: { label: string; tone?: 'default' | 'status'; td: ReturnType<typeof makeStyles> }) => (
  <View style={[td.chip, tone === 'status' && td.chipStatus]}>
    <Text style={[td.chipText, tone === 'status' && td.chipTextStatus]}>{label}</Text>
  </View>
);

const TrustItem = ({ icon, title, sub, td }: { icon: React.ReactNode; title: string; sub: string; td: ReturnType<typeof makeStyles> }) => (
  <View style={td.trustRow}>
    <View style={td.trustIconWrap}>{icon}</View>
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text style={td.trustTitle}>{title}</Text>
      <Text style={td.trustSub}>{sub}</Text>
    </View>
  </View>
);

type Props = {
  visible: boolean;
  pkg:     TourPackage | null;
  onClose: () => void;
};

export default function TourDetailModal({ visible, pkg, onClose }: Props) {
  const { C } = useAppTheme();
  const td = useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const [expandedDay, setExpandedDay] = useState<number>(1);

  if (!pkg) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={td.safe}>
        <LinearGradient colors={pkg.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[td.header, { paddingTop: insets.top + 14 }]}>
          <TouchableOpacity style={td.backBtn} activeOpacity={0.85} onPress={onClose}>
            <BackIcon />
            <Text style={td.backText}>Back</Text>
          </TouchableOpacity>

          <Text style={td.destText}>{pkg.destination}</Text>
          <Text style={td.taglineText}>{pkg.tagline}</Text>

          <View style={td.ratingRow}>
            {[0, 1, 2, 3, 4].map((i) => <StarIcon key={i} filled={i < Math.round(pkg.rating)} />)}
            <Text style={td.ratingValue}>{pkg.rating}</Text>
            <Text style={td.ratingCount}>({pkg.reviewCount} Reviews)</Text>
          </View>

          <View style={td.locationRow}>
            <PinIcon />
            <Text style={td.locationText}>{pkg.fullLocation}</Text>
          </View>
        </LinearGradient>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={td.body}>
          <SectionTitle td={td}>About This Experience</SectionTitle>
          <Text style={td.aboutText}>{pkg.description}</Text>

          <View style={td.thumbRow}>
            <LinearGradient colors={pkg.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={td.thumbBox}><BoatIcon /></LinearGradient>
            <LinearGradient colors={['#C9A227', '#E0C34F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={td.thumbBox}><MountainIcon /></LinearGradient>
            <LinearGradient colors={['#8B4FD1', '#B279E8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={td.thumbBox}><SunsetIcon /></LinearGradient>
          </View>

          <View style={td.tagRow}>
            <Chip label={pkg.tag} td={td} />
            <Chip label={pkg.secondaryTag} td={td} />
            <Chip label={pkg.duration} td={td} />
            <Chip label={pkg.status} tone="status" td={td} />
          </View>

          <View style={td.priceCard}>
            <Text style={td.priceSmall}>{formatPeso(pkg.priceFrom)} / person</Text>
            <Text style={td.priceBig}>{formatPeso(pkg.priceFrom)}</Text>
            <Text style={td.priceSub}>Adult price · taxes and fees</Text>

            <TouchableOpacity style={td.bookBtn} activeOpacity={0.85}>
              <Text style={td.bookBtnText}>Book Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={td.favBtn} activeOpacity={0.8}>
              <HeartIcon color={C.amber} />
              <Text style={td.favBtnText}>Add to Favorites</Text>
            </TouchableOpacity>
          </View>

          <View style={td.trustList}>
            <TrustItem icon={<ShieldIcon />} title="Free Cancellation" sub="Up to 24 hrs in advance" td={td} />
            <TrustItem icon={<BoltIcon color={C.amber} />} title="Instant Confirmation" sub="Book and Pay securely" td={td} />
            <TrustItem icon={<StarIcon filled size={16} />} title="Top Rated Experience" sub="Loved by 20+ travelers" td={td} />
          </View>

          <SectionTitle td={td}>Inclusions</SectionTitle>
          <View style={{ gap: 8 }}>
            {DEFAULT_INCLUSIONS.map((item, i) => (
              <View key={i} style={td.listRow}>
                <CheckIcon />
                <Text style={td.listText}>{item}</Text>
              </View>
            ))}
          </View>

          <SectionTitle td={td}>Exclusions</SectionTitle>
          <View style={{ gap: 8 }}>
            {DEFAULT_EXCLUSIONS.map((item, i) => (
              <View key={i} style={td.listRow}>
                <XIcon color={C.danger} />
                <Text style={td.listText}>{item}</Text>
              </View>
            ))}
          </View>

          <SectionTitle td={td}>Tour Itinerary</SectionTitle>
          <View style={{ gap: 8 }}>
            {pkg.itinerary.map((d) => {
              const isOpen = expandedDay === d.day;
              return (
                <View key={d.day} style={td.dayCard}>
                  <TouchableOpacity style={td.dayHeaderRow} activeOpacity={0.8} onPress={() => setExpandedDay(isOpen ? -1 : d.day)}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={td.dayTitle}>Day {d.day}</Text>
                      <Text style={td.daySub} numberOfLines={1}>{d.time} · {d.title}</Text>
                    </View>
                    <View style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}>
                      <ChevronDownIcon color={C.brownMid} />
                    </View>
                  </TouchableOpacity>
                  {isOpen && (
                    <View style={td.dayBody}>
                      <Text style={td.dayDescription}>{d.description}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          <SectionTitle td={td}>Map View</SectionTitle>
          <View style={td.mapBox}>
            <Text style={td.mapText}>Interactive map preview</Text>
          </View>

          <View style={td.reviewsHeaderRow}>
            <SectionTitle td={td}>Reviews</SectionTitle>
            <View style={td.reviewsHeaderRating}>
              <StarIcon filled size={13} />
              <Text style={td.reviewsHeaderText}>{pkg.rating} ({pkg.reviewCount} Reviews)</Text>
            </View>
          </View>
          <View style={{ gap: 10 }}>
            {DEFAULT_REVIEWS.map((r, i) => (
              <View key={r.id} style={td.reviewCard}>
                <View style={td.reviewTopRow}>
                  <View style={[td.reviewAvatar, { backgroundColor: REVIEW_AVATAR_COLORS[i % REVIEW_AVATAR_COLORS.length] }]}><Text style={td.reviewAvatarText}>{r.initials}</Text></View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={td.reviewName}>{r.name}</Text>
                    <View style={{ flexDirection: 'row', gap: 1, marginTop: 2 }}>
                      {[0, 1, 2, 3, 4].map((i) => <StarIcon key={i} filled={i < r.rating} size={10} />)}
                    </View>
                  </View>
                </View>
                <Text style={td.reviewText}>"{r.text}"</Text>
              </View>
            ))}
          </View>

          <Copyright />
        </ScrollView>
      </View>
    </Modal>
  );
}

const makeStyles = (C: ColorPalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.lightBg },

  header: { paddingBottom: 18, paddingHorizontal: 18 },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 18,
    paddingHorizontal: 12, paddingVertical: 7, marginBottom: 14,
  },
  backText: { fontSize: 11.5, fontWeight: '800', color: '#FFFFFF' },
  destText: { fontSize: 21, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3 },
  taglineText: { fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginTop: 3 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 10 },
  ratingValue: { fontSize: 12, fontWeight: '800', color: '#FFFFFF', marginLeft: 5 },
  ratingCount: { fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  locationText: { fontSize: 11.5, color: 'rgba(255,255,255,0.85)' },

  body: { padding: 16, paddingBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: C.brown, marginTop: 20, marginBottom: 10 },
  aboutText: { fontSize: 12.5, color: C.brownMid, lineHeight: 19 },

  thumbRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  thumbBox: { flex: 1, aspectRatio: 1.5, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  chip: { backgroundColor: C.lightBg, borderWidth: 1, borderColor: C.divider, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 5 },
  chipStatus: { backgroundColor: '#E7F9F3', borderColor: '#B7E4D5' },
  chipText: { fontSize: 10.5, fontWeight: '700', color: C.brownMid },
  chipTextStatus: { color: '#12946F', fontWeight: '800' },

  priceCard: {
    marginTop: 18, backgroundColor: C.cardBg, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.divider,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1 },
    }),
  },
  priceSmall: { fontSize: 11, color: C.brownMid, opacity: 0.7 },
  priceBig: { fontSize: 26, fontWeight: '900', color: C.brown, marginTop: 2 },
  priceSub: { fontSize: 11, color: C.brownMid, opacity: 0.7, marginTop: 2, marginBottom: 14 },
  bookBtn: {
    backgroundColor: C.amber, borderRadius: 24, alignItems: 'center', justifyContent: 'center', paddingVertical: 14,
    ...Platform.select({
      ios:     { shadowColor: C.amber, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 2 },
    }),
  },
  bookBtnText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  favBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    marginTop: 10, borderRadius: 24, paddingVertical: 13,
    borderWidth: 1.5, borderColor: C.divider,
  },
  favBtnText: { fontSize: 13, fontWeight: '800', color: C.brown },

  trustList: { marginTop: 16, gap: 12 },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  trustIconWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.divider, alignItems: 'center', justifyContent: 'center' },
  trustTitle: { fontSize: 12.5, fontWeight: '800', color: C.brown },
  trustSub: { fontSize: 10.5, color: C.brownMid, opacity: 0.7, marginTop: 1 },

  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  listText: { flex: 1, fontSize: 12, color: C.brownMid, lineHeight: 17 },

  dayCard: { backgroundColor: C.cardBg, borderRadius: 12, borderWidth: 1, borderColor: C.divider, overflow: 'hidden' },
  dayHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  dayTitle: { fontSize: 12.5, fontWeight: '800', color: C.brown },
  daySub: { fontSize: 11, color: C.brownMid, opacity: 0.75, marginTop: 2 },
  dayBody: { paddingHorizontal: 12, paddingBottom: 12 },
  dayDescription: { fontSize: 11.5, color: C.brownMid, lineHeight: 17 },

  mapBox: { height: 110, backgroundColor: C.cardBg, borderRadius: 12, borderWidth: 1, borderColor: C.divider, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  mapText: { fontSize: 11.5, color: C.brownMid, opacity: 0.6 },

  reviewsHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewsHeaderRating: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  reviewsHeaderText: { fontSize: 11.5, fontWeight: '700', color: C.brownMid },
  reviewCard: { backgroundColor: C.cardBg, borderRadius: 12, borderWidth: 1, borderColor: C.divider, padding: 12 },
  reviewTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#12946F', alignItems: 'center', justifyContent: 'center' },
  reviewAvatarText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  reviewName: { fontSize: 12.5, fontWeight: '800', color: C.brown },
  reviewText: { fontSize: 11.5, color: C.brownMid, lineHeight: 17, marginTop: 8 },
});
