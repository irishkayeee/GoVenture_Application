import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useFonts, DancingScript_700Bold } from '@expo-google-fonts/dancing-script';

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

const WAVE_H = 120;
const OFFSET = 20;
const SVG_H = WAVE_H + OFFSET + 20;
const CONTENT_MAX_W = 480;

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


/* ── Wavy Divider — sizes itself to whatever width it's given ── */
const WavyDivider = ({ width: W }: { width: number }) => {
  const cityscapeH = Math.min(Math.max(W * 0.62, 220), 340);

  const paths = useMemo(() => {
    const build = (extra: number) => `
      M 0,${WAVE_H + OFFSET + extra}
      C ${W * 0.15},${WAVE_H * 0.08 + OFFSET + extra}
        ${W * 0.38},${WAVE_H * 1.12 + OFFSET + extra}
        ${W * 0.55},${WAVE_H * 0.42 + OFFSET + extra}
      S ${W * 0.80},${WAVE_H * -0.12 + OFFSET + extra}
        ${W},${WAVE_H * 0.50 + OFFSET + extra}
    `;
    return {
      fill:   `${build(0)} L ${W},0 L 0,0 Z`,
      main:   build(0),
      inner:  build(-8),
      shadow: build(4),
    };
  }, [W]);

  return (
    <View style={{ width: W, height: cityscapeH }}>
      <Image
        source={require('../../assets/images/sunset-mountain.jpg')}
        style={{ position: 'absolute', top: 0, left: 0, width: W, height: cityscapeH }}
        resizeMode="cover"
      />
      <Svg width={W} height={SVG_H} style={{ position: 'absolute', top: 0, left: 0 }}>
        <Path d={paths.fill}   fill={C.bg} />
        <Path d={paths.shadow} fill="none" stroke="#8B4513" strokeWidth={4} strokeLinecap="round" opacity={0.15} />
        <Path d={paths.main}   fill="none" stroke={C.border} strokeWidth={5.5} strokeLinecap="round" />
        <Path d={paths.inner}  fill="none" stroke={C.border} strokeWidth={1.5} strokeLinecap="round" opacity={0.55} />
      </Svg>
    </View>
  );
};

/* ══════════════════════════════════════════════════════════ */
export default function LandingScreen() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({ DancingScript_700Bold });
  const { width } = useWindowDimensions();

  const FULL_TEXT = 'Our Passion.';
  const { displayed, done } = useTypingAnimation(FULL_TEXT, 200);

  const s = useMemo(() => createStyles(width), [width]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: C.bg }}
        contentContainerStyle={s.scrollContent}
      >

        {/* ── HERO ── */}
        <View style={s.hero}>
          <View style={s.headlineWrap}>
            <Image
              source={require('../../assets/images/go_logo.png')}
              style={s.logo}
              resizeMode="contain"
            />

            <View style={s.eyebrow}>
              <Text style={s.eyebrowGlyph}>✦</Text>
              <Text style={s.eyebrowText}>YOUR TRUSTED PARTNER</Text>
              <Text style={s.eyebrowGlyph}>✦</Text>
            </View>

            <Text style={[
              s.h1,
              fontsLoaded && { fontFamily: 'DancingScript_700Bold', fontStyle: 'normal' as const, fontWeight: 'normal' as const, letterSpacing: 0 },
            ]}>
              Your Journey,
            </Text>

            <View style={s.scriptRow}>
              <Text style={[
                s.script,
                fontsLoaded && { fontFamily: 'DancingScript_700Bold', fontStyle: 'normal' as const, fontWeight: 'normal' as const },
              ]}>
                {displayed}
              </Text>
              {!done && (
                <Text style={[
                  s.script,
                  fontsLoaded && { fontFamily: 'DancingScript_700Bold', fontStyle: 'normal' as const, fontWeight: 'normal' as const },
                ]}>
                  |
                </Text>
              )}
            </View>
          </View>

          <View style={s.heroContent}>
            <View style={s.heroTextBlock}>
              <Text style={s.subtitle}>
                To give you a hassle-free & stress free vacation
              </Text>
              <TouchableOpacity style={s.cta} activeOpacity={0.85} onPress={() => router.push('/onboarding' as any)}>
                <Text style={s.ctaText} numberOfLines={1}>EXPLORE NOW</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── WAVY DIVIDER ── */}
        <WavyDivider width={width} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Styles — recomputed whenever the window width changes ── */
function createStyles(width: number) {
  const BIG = width >= 400 ? 66 : width >= 370 ? 60 : 54;
  const logoW = Math.min(230, Math.max(160, width * 0.56));

  return StyleSheet.create({
    scrollContent: { flexGrow: 1, justifyContent: 'space-between' },
    logo: { width: logoW, height: logoW * (593 / 981), marginTop: 12, marginBottom: 28, transform: [{ translateY: -32 }] },
    hero: { flex: 1, justifyContent: 'center', overflow: 'visible', position: 'relative' },

    headlineWrap: {
      alignItems:        'center',
      alignSelf:         'center',
      width:             '100%',
      maxWidth:          CONTENT_MAX_W,
      paddingTop:        56,
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
      marginBottom:      18,
      gap:               6,
    },
    eyebrowGlyph: {
      fontSize: 11,
      color:    C.amber,
    },
    eyebrowText: {
      fontSize:      11,
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
      marginBottom:      8,
      textShadowColor:   'rgba(196,107,26,0.18)',
      textShadowOffset:  { width: 0, height: 3 },
      textShadowRadius:  6,
    },
    scriptRow: {
      flexDirection:  'row',
      alignItems:     'flex-end',
      justifyContent: 'center',
      marginBottom:   14,
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
      alignSelf:      'center',
      width:          '100%',
      maxWidth:       CONTENT_MAX_W,
      paddingHorizontal: 16,
      paddingTop:     12,
      gap:            16,
      zIndex:         1,
    },
    heroTextBlock: {
      alignItems: 'center',
    },
    subtitle: {
      fontSize:          13,
      color:             C.brownMid,
      lineHeight:        20,
      marginBottom:      20,
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
  });
}
