/**
 * app/(landing)/onboarding.tsx
 * 3-slide swipeable onboarding carousel, shown once after the splash screen.
 */

import React, { useMemo, useRef, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  StyleSheet, useWindowDimensions, StatusBar, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';

const C = {
  bg:       '#F8E4D5',
  brown:    '#3B1A0C',
  brownMid: '#6B3318',
  amber:    '#C46B1A',
};

const SLIDES = [
  {
    image: require('../../assets/images/explore1.png'),
    title: 'Explore the\nworld easily',
    subtitle: 'Discover new places and\namazing experiences.',
  },
  {
    image: require('../../assets/images/explore2.png'),
    title: 'Reach the\nunknown spot',
    subtitle: 'Adventure awaits beyond\nyour comfort zone.',
  },
  {
    image: require('../../assets/images/explore3.png'),
    title: 'Make connects\nwith GoVenture',
    subtitle: 'We make your journey\nmemorable.',
  },
];

const NextIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const { width: SCREEN_W } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const ob = useMemo(() => createStyles(SCREEN_W, insets.bottom), [SCREEN_W, insets.bottom]);

  const goToLogin = () => router.replace('/login' as any);

  const handleNext = () => {
    if (index === SLIDES.length - 1) {
      goToLogin();
      return;
    }
    const next = index + 1;
    scrollRef.current?.scrollTo({ x: next * SCREEN_W, animated: true });
    setIndex(next);
  };

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setIndex(next);
  };

  return (
    <SafeAreaView style={ob.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={[ob.slide, { width: SCREEN_W }]}>
            <View style={ob.imageGlow}>
              <Image source={slide.image} style={ob.image} resizeMode="cover" />
            </View>
            <Text style={ob.title}>{slide.title}</Text>
            <Text style={ob.subtitle}>{slide.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={ob.footer}>
        <View style={ob.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[ob.dot, i === index && ob.dotActive]} />
          ))}
        </View>

        <TouchableOpacity style={ob.nextBtn} activeOpacity={0.85} onPress={handleNext}>
          <NextIcon />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Styles recomputed per screen width (and bottom safe-area inset) so the
// carousel scales down cleanly on small phones instead of overflowing.
function createStyles(width: number, bottomInset: number) {
  const titleSize = width >= 400 ? 38 : width >= 360 ? 34 : 30;
  const subSize    = width >= 400 ? 18 : width >= 360 ? 16 : 15;

  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
    imageGlow: {
      width: '100%', aspectRatio: 0.85,
      alignItems: 'center', justifyContent: 'center',
      alignSelf: 'center',
      marginHorizontal: -12,
      marginBottom: 12,
      overflow: 'hidden',
    },
    image: { width: '100%', height: '100%' },
    title: { width: '100%', fontSize: titleSize, fontWeight: '900', color: C.brown, textAlign: 'left', lineHeight: titleSize + 6 },
    subtitle: { width: '100%', fontSize: subSize, color: C.brownMid, opacity: 0.75, textAlign: 'left', marginTop: 12, lineHeight: subSize + 7 },
    footer: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 28, paddingBottom: bottomInset + 20, paddingTop: 8,
    },
    dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(59,26,12,0.2)' },
    dotActive: { width: 18, backgroundColor: C.amber },
    nextBtn: {
      width: 52, height: 52, borderRadius: 26,
      backgroundColor: C.amber,
      alignItems: 'center', justifyContent: 'center',
    },
  });
}
