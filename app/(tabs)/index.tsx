import React, { useState, useEffect, useRef } from 'react';
import LoginModal from './LoginModal';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useFonts, DancingScript_700Bold } from '@expo-google-fonts/dancing-script';

const { width } = Dimensions.get('window');

const C = {
  bg:       '#F8E4D5',
  brown:    '#3B1A0C',
  brownMid: '#6B3318',
  amber:    '#C46B1A',
  border:   '#C86820',
  white:    '#FFFFFF',
  treeWarm: '#C8855A',
  cardBg:   '#FFFFFF',
  lightBg:  '#FDF0E6',
  star:     '#F5A623',
  divider:  '#E8C4A0',
};

const W = width;
const WAVE_H = 120;
const OFFSET = 20;
const SVG_H = WAVE_H + OFFSET + 20;

/* ── Typing Animation Hook ── */
const useTypingAnimation = (fullText: string, speed: number = 200) => {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [fullText, speed]);

  return { displayed, done };
};


/* ── Traveler Box ── */
const TravelerBox = () => {
  const SIZE = 60;
  const RING1 = SIZE + 8;
  const RING2 = SIZE + 16;

  return (
    <View style={tb.wrapper}>
      <View style={[tb.ring2, { width: RING2, height: RING2 }]} />
      <View style={[tb.ring1, { width: RING1, height: RING1 }]} />
      <View style={[tb.imgWrap, { width: SIZE, height: SIZE }]}>
        <Image
          source={require('../../assets/images/traveler.jpg')}
          style={{ width: SIZE, height: SIZE }}
          resizeMode="cover"
        />
      </View>
    </View>
  );
};

const tb = StyleSheet.create({
  wrapper: {
    alignItems:     'center',
    justifyContent: 'center',
    width:  84,
    height: 84,
  },
  ring2: {
    position:        'absolute',
    backgroundColor: 'transparent',
    borderWidth:     2,
    borderColor:     C.amber,
    borderRadius:    10,
    opacity:         0.45,
  },
  ring1: {
    position:        'absolute',
    backgroundColor: 'transparent',
    borderWidth:     2.5,
    borderColor:     C.amber,
    borderRadius:    8,
  },
  imgWrap: {
    overflow:     'hidden',
    borderWidth:  2,
    borderColor:  C.white,
    borderRadius: 6,
  },
});

/* ── Beach Circle ── */
const BeachCircle = () => {
  const SIZE  = 70;
  const RING1 = SIZE + 6;
  const RING2 = SIZE + 13;

  return (
    <View style={bc.wrapper}>
      <View style={[bc.ring2, { width: RING2, height: RING2, borderRadius: RING2 / 2 }]} />
      <View style={[bc.ring1, { width: RING1, height: RING1, borderRadius: RING1 / 2 }]} />
      <View style={[bc.imgWrap, { width: SIZE, height: SIZE, borderRadius: SIZE / 2 }]}>
        <Image
          source={require('../../assets/images/beachh.png')}
          style={{ width: SIZE, height: SIZE, borderRadius: SIZE / 2 }}
          resizeMode="cover"
        />
      </View>
    </View>
  );
};

const bc = StyleSheet.create({
  wrapper: {
    alignItems:     'center',
    justifyContent: 'center',
    width:  96,
    height: 96,
    marginBottom: 10,
  },
  ring2: {
    position:        'absolute',
    backgroundColor: 'transparent',
    borderWidth:     2,
    borderColor:     C.amber,
    opacity:         0.45,
  },
  ring1: {
    position:        'absolute',
    backgroundColor: 'transparent',
    borderWidth:     2.5,
    borderColor:     C.amber,
  },
  imgWrap: {
    overflow:    'hidden',
    borderWidth: 2,
    borderColor: C.white,
  },
});

/* ── Wave paths ── */
const waveFill = `
  M 0,${WAVE_H + OFFSET}
  C ${W * 0.15},${WAVE_H * 0.08 + OFFSET}
    ${W * 0.38},${WAVE_H * 1.12 + OFFSET}
    ${W * 0.55},${WAVE_H * 0.42 + OFFSET}
  S ${W * 0.80},${WAVE_H * -0.12 + OFFSET}
    ${W},${WAVE_H * 0.50 + OFFSET}
  L ${W},0
  L 0,0
  Z
`;
const waveMain = `
  M 0,${WAVE_H + OFFSET}
  C ${W * 0.15},${WAVE_H * 0.08 + OFFSET}
    ${W * 0.38},${WAVE_H * 1.12 + OFFSET}
    ${W * 0.55},${WAVE_H * 0.42 + OFFSET}
  S ${W * 0.80},${WAVE_H * -0.12 + OFFSET}
    ${W},${WAVE_H * 0.50 + OFFSET}
`;
const waveInner = `
  M 0,${WAVE_H + OFFSET - 8}
  C ${W * 0.15},${WAVE_H * 0.08 + OFFSET - 8}
    ${W * 0.38},${WAVE_H * 1.12 + OFFSET - 8}
    ${W * 0.55},${WAVE_H * 0.42 + OFFSET - 8}
  S ${W * 0.80},${WAVE_H * -0.12 + OFFSET - 8}
    ${W},${WAVE_H * 0.50 + OFFSET - 8}
`;
const waveShadow = `
  M 0,${WAVE_H + OFFSET + 4}
  C ${W * 0.15},${WAVE_H * 0.08 + OFFSET + 4}
    ${W * 0.38},${WAVE_H * 1.12 + OFFSET + 4}
    ${W * 0.55},${WAVE_H * 0.42 + OFFSET + 4}
  S ${W * 0.80},${WAVE_H * -0.12 + OFFSET + 4}
    ${W},${WAVE_H * 0.50 + OFFSET + 4}
`;

/* ── Wavy Divider ── */
const WavyDivider = () => (
  <View style={{ width: W, height: 280 }}>
    <Image
      source={require('../../assets/images/sunset-mountain.jpg')}
      style={{ position: 'absolute', top: 0, left: 0, width: W, height: 280 }}
      resizeMode="cover"
    />
    <Svg width={W} height={SVG_H} style={{ position: 'absolute', top: 0, left: 0 }}>
      <Path d={waveFill}   fill={C.bg} />
      <Path d={waveShadow} fill="none" stroke="#8B4513" strokeWidth={4} strokeLinecap="round" opacity={0.15} />
      <Path d={waveMain}   fill="none" stroke={C.border} strokeWidth={5.5} strokeLinecap="round" />
      <Path d={waveInner}  fill="none" stroke={C.border} strokeWidth={1.5} strokeLinecap="round" opacity={0.55} />
    </Svg>
  </View>
);

/* ── Light Label Pill ── */
const LightLabel = ({ text }: { text: string }) => (
  <View style={ll.pill}>
    <Text style={ll.text}>{text}</Text>
  </View>
);

const ll = StyleSheet.create({
  pill: {
    alignSelf:         'flex-start',
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   '#FFF3E8',
    borderWidth:       1,
    borderColor:       C.divider,
    borderRadius:      20,
    paddingHorizontal: 9,
    paddingVertical:   3,
    marginBottom:      6,
  },
  text: {
    fontSize:      8.5,
    fontWeight:    '800',
    color:         C.amber,
    letterSpacing: 1,
  },
});

/* ── Section Header ── */
const SectionHeader = ({
  eyebrow,
  title,
  onSeeAll,
  seeAllLabel = 'See all',
}: {
  eyebrow?: string;
  title: string;
  onSeeAll?: () => void;
  seeAllLabel?: string;
}) => (
  <View style={sec.row}>
    <View style={sec.titleBlock}>
      {eyebrow && <LightLabel text={eyebrow} />}
      <Text style={sec.title}>{title}</Text>
    </View>
    {onSeeAll && (
      <TouchableOpacity style={sec.seeAllBtn} onPress={onSeeAll} activeOpacity={0.8}>
        <Text style={sec.seeAll}>{seeAllLabel}</Text>
        <Text style={sec.seeAllArrow}>→</Text>
      </TouchableOpacity>
    )}
  </View>
);
const sec = StyleSheet.create({
  row:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 },
  titleBlock: { flex: 1, paddingRight: 10 },
  title:      { fontSize: 15, fontWeight: '800', color: C.brown, letterSpacing: 0.3 },
  seeAllBtn:  { flexDirection: 'row', alignItems: 'center', backgroundColor: C.amber, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 20, gap: 4, ...Platform.select({ ios: { shadowColor: C.amber, shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 2 } }) },
  seeAll:     { fontSize: 10.5, fontWeight: '700', color: C.white },
  seeAllArrow:{ fontSize: 10.5, fontWeight: '700', color: C.white },
});

/* ── Top Destinations ── */
const DESTINATIONS = [
  { name: 'PALAWAN',    country: 'Philippines', img: require('../../assets/images/sunset-mountain.jpg') },
  { name: 'CAPPADOCIA', country: 'Turkey',      img: require('../../assets/images/sunset-mountain.jpg') },
  { name: 'KYOTO',      country: 'Japan',       img: require('../../assets/images/sunset-mountain.jpg') },
  { name: 'SANTORINI',  country: 'Greece',      img: require('../../assets/images/sunset-mountain.jpg') },
];
const TopDestinations = () => (
  <View style={ds.wrapper}>
    <SectionHeader eyebrow="EXPLORE" title="TOP DESTINATIONS" seeAllLabel="See all" onSeeAll={() => {}} />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
      {DESTINATIONS.map((d) => (
        <TouchableOpacity key={d.name} style={ds.card} activeOpacity={0.88}>
          <Image source={d.img} style={ds.img} resizeMode="cover" />
          <View style={ds.overlay}>
            <Text style={ds.name}>{d.name}</Text>
            <View style={ds.countryRow}>
              <Text style={ds.pin}>📍</Text>
              <Text style={ds.country}>{d.country}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
);
const CARD_W = width * 0.38;
const ds = StyleSheet.create({
  wrapper:    { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  card:       { width: CARD_W, borderRadius: 14, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 4 } }) },
  img:        { width: CARD_W, height: CARD_W * 1.15 },
  overlay:    { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8, backgroundColor: 'rgba(0,0,0,0.32)' },
  name:       { color: C.white, fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },
  countryRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  pin:        { fontSize: 9 },
  country:    { color: 'rgba(255,255,255,0.85)', fontSize: 9, marginLeft: 2 },
});

/* ── Why Choose GoVenture ── */
const GlobeIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke={C.amber} strokeWidth={1.8}/>
    <Path d="M2 12h20M12 2c-2.76 3.45-4 6.9-4 10s1.24 6.55 4 10M12 2c2.76 3.45 4 6.9 4 10s-1.24 6.55-4 10" stroke={C.amber} strokeWidth={1.8} strokeLinecap="round"/>
  </Svg>
);
const TagIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke={C.amber} strokeWidth={1.8} strokeLinejoin="round"/>
    <Path d="M7 7h.01" stroke={C.amber} strokeWidth={2.2} strokeLinecap="round"/>
  </Svg>
);
const ShieldIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z" stroke={C.amber} strokeWidth={1.8} strokeLinejoin="round"/>
    <Path d="M9 12l2 2 4-4" stroke={C.amber} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const HeadsetIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path d="M12 3C7.03 3 3 7.03 3 12v4a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H5v-1a7 7 0 0114 0v1h-1a2 2 0 00-2 2v3a2 2 0 002 2h1a2 2 0 002-2v-4c0-4.97-4.03-9-9-9z" stroke={C.amber} strokeWidth={1.8}/>
  </Svg>
);
const WHY_ITEMS = [
  { IconComp: GlobeIcon,   title: 'Curated Travel\nExperiences',    desc: 'Handpicked destinations\nand unique activities.' },
  { IconComp: TagIcon,     title: 'Affordable Tour\nPackages',      desc: 'Best value for your\nbudget-friendly trips.' },
  { IconComp: ShieldIcon,  title: 'Safe & Trusted\nTravel Partner', desc: "Your safety is our\nhighest priority." },
  { IconComp: HeadsetIcon, title: '24/7 Customer\nSupport',         desc: "We're here anytime\nto assist you." },
];
const WhyChoose = () => (
  <View style={wc.wrapper}>
    <SectionHeader eyebrow="WHY US" title="WHY CHOOSE GOVENTURE?" />
    <View style={wc.grid}>
      {WHY_ITEMS.map((item) => (
        <View key={item.title} style={wc.card}>
          <View style={wc.iconCircle}><item.IconComp /></View>
          <Text style={wc.cardTitle}>{item.title}</Text>
          <Text style={wc.cardDesc}>{item.desc}</Text>
        </View>
      ))}
    </View>
  </View>
);
const wc = StyleSheet.create({
  wrapper:    { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  grid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card:       { width: (width - 42) / 2, backgroundColor: C.white, borderRadius: 12, padding: 14, alignItems: 'center', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 2 } }) },
  iconCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FFF3E8', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  cardTitle:  { fontSize: 11, fontWeight: '800', color: C.brown, textAlign: 'center', lineHeight: 16 },
  cardDesc:   { fontSize: 9.5, color: C.brownMid, textAlign: 'center', marginTop: 4, lineHeight: 14, opacity: 0.85 },
});

/* ── Featured Tours ── */
const TOURS = [
  { name: 'El Nido Island Hopping',   nights: '3 Days 2 Nights', price: '₱7,499',  img: require('../../assets/images/sunset-mountain.jpg') },
  { name: 'Cappadocia Adventure',     nights: '6 Days 4 Nights', price: '₱29,999', img: require('../../assets/images/sunset-mountain.jpg') },
  { name: 'Japan Highlights Tour',    nights: '6 Days 5 Nights', price: '₱49,999', img: require('../../assets/images/sunset-mountain.jpg') },
  { name: 'Santorini Getaway',        nights: '4 Days 5 Nights', price: '₱32,999', img: require('../../assets/images/sunset-mountain.jpg') },
];
const FeaturedTours = () => (
  <View style={ft.wrapper}>
    <SectionHeader eyebrow="HANDPICKED" title="FEATURED TOURS" seeAllLabel="View all" onSeeAll={() => {}} />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
      {TOURS.map((t) => (
        <TouchableOpacity key={t.name} style={ft.card} activeOpacity={0.88}>
          <Image source={t.img} style={ft.img} resizeMode="cover" />
          <View style={ft.info}>
            <Text style={ft.tourName}>{t.name}</Text>
            <Text style={ft.nights}>{t.nights}</Text>
            <Text style={ft.price}>{t.price} / person</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
);
const TOUR_W = width * 0.42;
const ft = StyleSheet.create({
  wrapper:  { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  card:     { width: TOUR_W, backgroundColor: C.white, borderRadius: 14, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 3 } }) },
  img:      { width: TOUR_W, height: TOUR_W * 0.72 },
  info:     { padding: 10 },
  tourName: { fontSize: 10.5, fontWeight: '700', color: C.brown, lineHeight: 14 },
  nights:   { fontSize: 9,    color: C.brownMid, marginTop: 2, opacity: 0.75 },
  price:    { fontSize: 10.5, fontWeight: '800', color: C.amber, marginTop: 4 },
});

/* ── Travelers Say ── */
const REVIEWS = [
  { name: 'Maria S.', rating: 5, text: 'GoVenture made our trip so smooth and memorable! Great service and amazing destinations.' },
  { name: 'James L.', rating: 5, text: "Highly recommended! The best travel experience I've ever had." },
];
const Stars = ({ count }: { count: number }) => (
  <View style={{ flexDirection: 'row' }}>
    {Array.from({ length: count }).map((_, i) => (
      <Text key={i} style={{ color: C.star, fontSize: 12 }}>★</Text>
    ))}
  </View>
);
const TravelersSay = () => (
  <View style={ts.wrapper}>
    <SectionHeader eyebrow="TESTIMONIALS" title="WHAT OUR TRAVELERS SAY" seeAllLabel="Read more" onSeeAll={() => {}} />
    <View style={ts.grid}>
      {REVIEWS.map((r) => (
        <View key={r.name} style={ts.card}>
          <View style={ts.avatarCircle}><Text style={{ fontSize: 22 }}>👤</Text></View>
          <View style={ts.body}>
            <Stars count={r.rating} />
            <Text style={ts.text}>{r.text}</Text>
            <Text style={ts.author}>– {r.name}</Text>
          </View>
        </View>
      ))}
    </View>
    <View style={ts.dots}>
      {[0,1,2].map((i) => (
        <View key={i} style={[ts.dot, i === 0 && ts.dotActive]} />
      ))}
    </View>
  </View>
);
const ts = StyleSheet.create({
  wrapper:      { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8, backgroundColor: C.lightBg },
  grid:         { flexDirection: 'row', gap: 10 },
  card:         { flex: 1, backgroundColor: C.white, borderRadius: 14, padding: 12, flexDirection: 'row', gap: 8, ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 2 } }) },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  body:         { flex: 1 },
  text:         { fontSize: 9.5, color: C.brownMid, marginTop: 4, lineHeight: 13 },
  author:       { fontSize: 9,   fontWeight: '700', color: C.brown, marginTop: 4 },
  dots:         { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 12 },
  dot:          { width: 7, height: 7, borderRadius: 4, backgroundColor: C.border, opacity: 0.3 },
  dotActive:    { opacity: 1, backgroundColor: C.amber },
});

/* ── FAQ ── */
const FAQ_ITEMS = [
  'How do I book a tour?',
  'Can I cancel my booking?',
  'Do you offer customized tours?',
  'What payment methods are accepted?',
  'Is customer support available 24/7?',
];
const FAQSection = () => {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <View style={fq.wrapper}>
      <View style={fq.headerRow}>
        <View style={fq.titleBlock}>
          <LightLabel text="SUPPORT" />
          <Text style={fq.sectionTitle}>FREQUENTLY ASKED</Text>
          <Text style={fq.sectionTitle}>QUESTIONS</Text>
        </View>
        <Image source={require('../../assets/images/faQ_logo.png')} style={fq.logoImg} resizeMode="contain" />
      </View>
      {FAQ_ITEMS.map((q, i) => (
        <TouchableOpacity key={q} style={fq.item} activeOpacity={0.8} onPress={() => setOpen(open === i ? null : i)}>
          <View style={fq.itemRow}>
            <Text style={fq.qLabel}>Q:</Text>
            <Text style={fq.qText}>{q}</Text>
            <Text style={fq.chevron}>{open === i ? '∧' : '∨'}</Text>
          </View>
          {open === i && (
            <Text style={fq.answer}>Please contact our support team for assistance with this question. We're available 24/7.</Text>
          )}
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={fq.helpBanner} activeOpacity={0.88}>
        <View style={fq.helpBannerText}>
          <Text style={fq.helpBannerTitle}>Still have questions?</Text>
          <Text style={fq.helpBannerSub}>Our team is here to help, anytime.</Text>
        </View>
        <View style={fq.helpBannerBtn}>
          <Text style={fq.helpBannerBtnText}>Contact Us</Text>
          <Text style={fq.helpBannerBtnText}>→</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};
const fq = StyleSheet.create({
  wrapper:      { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16, backgroundColor: C.bg },
  headerRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  titleBlock:   { flex: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: C.brown, letterSpacing: 0.3, lineHeight: 20 },
  logoImg:      { width: 90, height: 90, marginLeft: 10 },
  item:         { backgroundColor: C.white, borderRadius: 10, marginBottom: 8, padding: 12, ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } }, android: { elevation: 1 } }) },
  itemRow:      { flexDirection: 'row', alignItems: 'center' },
  qLabel:       { fontSize: 12, fontWeight: '800', color: C.amber, marginRight: 5 },
  qText:        { flex: 1, fontSize: 12, color: C.brown, fontWeight: '500' },
  chevron:      { fontSize: 13, color: C.amber, fontWeight: '700', marginLeft: 4 },
  answer:       { fontSize: 11, color: C.brownMid, marginTop: 8, lineHeight: 16 },
  helpBanner:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.brown, borderRadius: 16, padding: 16, marginTop: 6, ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 3 } }) },
  helpBannerText: { flex: 1, paddingRight: 10 },
  helpBannerTitle:{ fontSize: 13, fontWeight: '800', color: C.white },
  helpBannerSub:  { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  helpBannerBtn:  { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.amber, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 20 },
  helpBannerBtnText: { fontSize: 10.5, fontWeight: '800', color: C.white },
});

/* ── Footer ── */
const FOOTER_QUICK_LINKS = [
  { label: 'Explore',       sectionKey: 'explore' },
  { label: 'Why Us',        sectionKey: 'whyus' },
  { label: 'Handpicked',    sectionKey: 'handpicked' },
  { label: 'Testimonials',  sectionKey: 'testimonials' },
  { label: 'Support',       sectionKey: 'support' },
];
const FOOTER_INFO_LINKS = ['About Us', 'FAQ', 'Terms & Conditions', 'Privacy Policy'];

const FooterLink = ({ label, onPress }: { label: string; onPress?: () => void }) => (
  <TouchableOpacity style={fo.linkRow} activeOpacity={0.6} hitSlop={{ top: 4, bottom: 4 }} onPress={onPress}>
    <View style={fo.linkDot} />
    <Text style={fo.link}>{label}</Text>
  </TouchableOpacity>
);

const Footer = ({ scrollTo }: { scrollTo: (key: string) => void }) => (
  <View style={fo.wrapper}>
    <View style={fo.top}>
      <View style={fo.col}>
        <Text style={fo.colTitle}>QUICK LINKS</Text>
        {FOOTER_QUICK_LINKS.map(l => <FooterLink key={l.label} label={l.label} onPress={() => scrollTo(l.sectionKey)} />)}
      </View>
      <View style={fo.vDivider} />
      <View style={fo.col}>
        <Text style={fo.colTitle}>INFORMATION</Text>
        {FOOTER_INFO_LINKS.map(l => <FooterLink key={l} label={l} />)}
      </View>
    </View>
    <View style={fo.contactBanner}>
      <Text style={fo.contactBannerTitle}>GET IN TOUCH</Text>
      <TouchableOpacity style={fo.contactRow} activeOpacity={0.7}>
        <View style={fo.contactIconWrap}><Text style={fo.contactIcon}>✉</Text></View>
        <Text style={fo.contactText}>goventure.travelagency@gmail.com</Text>
      </TouchableOpacity>
      <TouchableOpacity style={fo.contactRow} activeOpacity={0.7}>
        <View style={fo.contactIconWrap}><Text style={fo.contactIcon}>☎</Text></View>
        <Text style={fo.contactText}>+63 912 345 6789</Text>
      </TouchableOpacity>
    </View>
    <View style={fo.divider} />
    <Text style={fo.copy}>© 2026 GoVenture Travel & Tours. All Rights Reserved.</Text>
  </View>
);
const fo = StyleSheet.create({
  wrapper:     { backgroundColor: C.brown, paddingHorizontal: 16, paddingTop: 24, paddingBottom: 24 },
  top:         { flexDirection: 'row', marginBottom: 18 },
  col:         { flex: 1 },
  vDivider:    { width: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginHorizontal: 14 },
  colTitle:    { fontSize: 9.5, fontWeight: '800', color: C.amber, marginBottom: 10, letterSpacing: 0.8 },
  linkRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  linkDot:     { width: 3, height: 3, borderRadius: 2, backgroundColor: C.amber, opacity: 0.8, marginRight: 7 },
  link:        { fontSize: 10, color: 'rgba(255,255,255,0.78)', fontWeight: '500' },
  contactBanner:      { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: 14, marginBottom: 16 },
  contactBannerTitle: { fontSize: 9.5, fontWeight: '800', color: C.amber, letterSpacing: 0.8, marginBottom: 8 },
  contactRow:      { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  contactIconWrap: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(196,107,26,0.25)', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  contactIcon:     { fontSize: 11, color: C.amber },
  contactText:     { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  divider:     { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: 10 },
  copy:        { fontSize: 8.5, color: 'rgba(255,255,255,0.45)', textAlign: 'center' },
});


/* ══════════════════════════════════════════════════════════ */
export default function LandingScreen() {
  const [fontsLoaded] = useFonts({ DancingScript_700Bold });
  const [showLogin, setShowLogin] = useState(false);

  const FULL_TEXT = 'Our Passion.';
  const { displayed, done } = useTypingAnimation(FULL_TEXT, 200);

  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Record<string, number>>({});

  const scrollTo = (key: string) => {
    const offset = sectionOffsets.current[key];
    if (offset !== undefined && scrollRef.current) {
      scrollRef.current.scrollTo({ y: offset, animated: true });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} style={{ backgroundColor: C.bg }}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <Image
            source={require('../../assets/images/go_logo.png')}
            style={s.logo}
            resizeMode="contain"
          />
        </View>

        {/* ── HERO ── */}
        <View style={s.hero}>
          <View style={s.headlineWrap}>
            <View style={s.eyebrow}>
              <Text style={s.eyebrowGlyph}>✦</Text>
              <Text style={s.eyebrowText}>GOVENTURE TRAVEL &amp; TOURS</Text>
              <Text style={s.eyebrowGlyph}>✦</Text>
            </View>

            <Text style={s.h1}>YOUR JOURNEY,</Text>

            <View style={s.scriptRow}>
              <Text style={[
                s.script,
                fontsLoaded && { fontFamily: 'DancingScript_700Bold' },
              ]}>
                {displayed}
              </Text>
              {!done && (
                <Text style={[
                  s.script,
                  fontsLoaded && { fontFamily: 'DancingScript_700Bold' },
                ]}>
                  |
                </Text>
              )}
            </View>
          </View>

          <View style={s.heroContent}>
            <View style={s.heroTextBlock}>
              <Text style={s.subtitle}>
                To give you a hassle-free and stress free vacation
              </Text>
              <TouchableOpacity style={s.cta} activeOpacity={0.85} onPress={() => setShowLogin(true)}>
                <Text style={s.ctaText} numberOfLines={1}>EXPLORE NOW</Text>
                <Text style={s.ctaArrow}>→</Text>
              </TouchableOpacity>
            </View>
            <View style={s.bottomCircle}>
              <BeachCircle />
              <TravelerBox />
            </View>
          </View>
        </View>

        {/* ── WAVY DIVIDER ── */}
        <View style={{ marginTop: -(WAVE_H + OFFSET) + 45 }}>
          <WavyDivider />
        </View>

        <View onLayout={e => sectionOffsets.current['explore'] = e.nativeEvent.layout.y}>
          <TopDestinations />
        </View>
        <View onLayout={e => sectionOffsets.current['whyus'] = e.nativeEvent.layout.y}>
          <WhyChoose />
        </View>
        <View onLayout={e => sectionOffsets.current['handpicked'] = e.nativeEvent.layout.y}>
          <FeaturedTours />
        </View>
        <View onLayout={e => sectionOffsets.current['testimonials'] = e.nativeEvent.layout.y}>
          <TravelersSay />
        </View>
        <View onLayout={e => sectionOffsets.current['support'] = e.nativeEvent.layout.y}>
          <FAQSection />
        </View>
        <Footer scrollTo={scrollTo} />
              <LoginModal visible={showLogin} onClose={() => setShowLogin(false)} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Styles ── */
const BIG = width >= 400 ? 56 : width >= 370 ? 50 : 44;

const s = StyleSheet.create({
  header: {
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 16,
    paddingTop:        40,
    paddingBottom:     24,
    backgroundColor:   C.bg,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 3 },
    }),
  },
  logo: { height: 74, width: 200 },
  hero: { overflow: 'visible', position: 'relative' },

  headlineWrap: {
    alignItems:        'center',
    paddingTop:        44,
    paddingHorizontal: 16,
    zIndex:            1,
  },
  eyebrow: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   '#FFF3E8',
    borderWidth:       1,
    borderColor:       C.divider,
    borderRadius:      20,
    paddingHorizontal: 12,
    paddingVertical:   5,
    marginBottom:      10,
    gap:               6,
  },
  eyebrowGlyph: {
    fontSize: 9,
    color:    C.amber,
  },
  eyebrowText: {
    fontSize:      9,
    fontWeight:    '800',
    color:         C.amber,
    letterSpacing: 1,
  },
  h1: {
    fontSize:          BIG * 0.72,
    fontWeight:        '900',
    color:             C.brown,
    letterSpacing:     -1,
    lineHeight:        (BIG * 0.72) + 4,
    textAlign:         'center',
    textShadowColor:   'rgba(196,107,26,0.18)',
    textShadowOffset:  { width: 0, height: 3 },
    textShadowRadius:  6,
  },
  scriptRow: {
    flexDirection:  'row',
    alignItems:     'flex-end',
    justifyContent: 'center',
  },
  script: {
    fontSize:     (BIG * 0.72) + 4,
    fontStyle:    'italic',
    fontWeight:   '700',
    color:        C.brownMid,
    lineHeight:   (BIG * 0.72) + 12,
    textAlign:    'center',
    marginBottom: 2,
  },
  heroContent: {
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop:     12,
    gap:            16,
    zIndex:         1,
  },
  heroTextBlock: {
    alignItems: 'center',
  },
  bottomCircle: {
    flexDirection:  'row',
    alignSelf:      'flex-start',
    marginLeft:     46,
    marginTop:      10,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            12,
    padding:        10,
  },
  subtitle: {
    fontSize:          13,
    color:             C.brownMid,
    lineHeight:        20,
    marginBottom:      12,
    textAlign:         'center',
  },
  cta: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               8,
    backgroundColor:   C.amber,
    paddingHorizontal: 22,
    paddingVertical:   10,
    borderRadius:      50,
    borderWidth:       1.5,
    borderColor:       'rgba(255,255,255,0.35)',
    alignSelf:         'center',
    ...Platform.select({
      ios:     { shadowColor: C.amber, shadowOpacity: 0.45, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 5 },
    }),
  },
  ctaText: {
    color:         C.white,
    fontWeight:    '800',
    fontSize:      11,
    letterSpacing: 1.5,
  },
  ctaArrow: {
    color:      C.white,
    fontWeight: '800',
    fontSize:   13,
  },
});