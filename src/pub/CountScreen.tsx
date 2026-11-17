import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LOCATION, PER_SHELF, PRODUCTS } from './data';
import { BottleThumb } from './Bottle';
import { LevelGauge } from './LevelGauge';
import { PubStore } from './store';
import { C, R } from './theme';

const tap = (kind: 'light' | 'medium' | 'select' = 'light') => {
  if (Platform.OS === 'web') return;
  try {
    if (kind === 'select') Haptics.selectionAsync();
    else Haptics.impactAsync(kind === 'light' ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    /* ignore */
  }
};

interface Props {
  store: PubStore;
  onWaste: () => void;
  onOverview: () => void;
}

export function CountScreen({ store, onWaste, onOverview }: Props) {
  const { state, setIndex, setLevel, lockIn } = store;
  const product = PRODUCTS[state.index];
  const saved = state.counts[product.id];
  const [level, setLocal] = useState(saved?.level ?? 10);
  const [gaugeH, setGaugeH] = useState(340);
  const lastInt = useRef(Math.round(level));

  useEffect(() => {
    const l = state.counts[product.id]?.level ?? 10;
    setLocal(l);
    lastInt.current = Math.round(l);
  }, [product.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const whole = Math.round(level);
  const ml = Math.round((whole / 10) * product.sizeMl);
  const shelf = Math.ceil((state.index + 1) / PER_SHELF);

  const onChange = (l: number) => {
    setLocal(l);
    const r = Math.round(l);
    if (r !== lastInt.current) {
      lastInt.current = r;
      tap('select');
    }
  };
  const onRelease = (l: number) => {
    setLocal(l);
    setLevel(product.id, l);
  };

  const thumbs = useRef<ScrollView>(null);
  useEffect(() => {
    thumbs.current?.scrollTo({ x: Math.max(0, state.index * 74 - 148), animated: false });
  }, [state.index]);

  const counted = Object.values(state.counts).filter((c) => c.lockedAt).length;
  const isLocked = !!saved?.lockedAt;

  return (
    <View style={s.root}>
      {/* Background gradient */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none" pointerEvents="none">
        <Defs>
          <LinearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={C.bgTop} />
            <Stop offset="0.55" stopColor={C.bgMid} />
            <Stop offset="1" stopColor={C.bgDeep} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#bgGrad)" />
      </Svg>

      <View style={s.header}>
        <View style={s.eyebrowRow}>
          <Text style={s.eyebrow}>
            {LOCATION} - SHELF {shelf} - {state.index + 1} OF {PRODUCTS.length}
          </Text>
          <Pressable onPress={onOverview} hitSlop={12} style={s.overviewBtn} accessibilityLabel="Open stock overview">
            <Ionicons name="list" size={16} color={C.eyebrow} />
            <Text style={s.overviewTxt}>{counted}/{PRODUCTS.length}</Text>
          </Pressable>
        </View>
        <Text
          style={[s.title, product.name.length > 18 && { fontSize: 21 }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.78}
        >
          {product.name} - {product.sizeMl}ml
        </Text>
        <View style={s.divider} />
      </View>

      <View style={s.pillRow}>
        <View style={s.dot} />
        <Text style={s.pill}>OFFLINE - SYNCS LATER</Text>
      </View>

      <View
        style={s.gaugeWrap}
        onLayout={(e) => {
          const h = Math.floor(e.nativeEvent.layout.height);
          if (h > 180) setGaugeH(h);
        }}
      >
        <LevelGauge product={product} level={level} height={gaugeH} onChange={onChange} onRelease={onRelease} />
      </View>

      <View style={s.readout}>
        <Text style={s.big}>
          {whole}
          <Text style={s.slash}>/</Text>
          10
        </Text>
        <Text style={s.approx}>
          approx {ml} ml remaining{isLocked ? ' · locked ✓' : ''}
        </Text>
      </View>

      <View style={s.btnRow}>
        <Pressable
          style={({ pressed }) => [s.btn, s.btnDark, pressed && s.pressed]}
          onPress={() => {
            tap('light');
            onWaste();
          }}
          accessibilityRole="button"
        >
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="darkBtn" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#3a3f3c" />
                <Stop offset="1" stopColor="#262a27" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#darkBtn)" />
          </Svg>
          <Text style={s.btnDarkTxt}>LOG WASTE</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [s.btn, s.btnGold, pressed && s.pressed]}
          onPress={() => {
            tap('medium');
            lockIn(product.id, whole);
          }}
          accessibilityRole="button"
        >
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="goldBtn" x1="0" y1="0" x2="1" y2="0.4">
                <Stop offset="0" stopColor="#e4c57e" />
                <Stop offset="0.52" stopColor="#c59e53" />
                <Stop offset="1" stopColor="#a37c36" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#goldBtn)" />
          </Svg>
          <Text style={s.btnGoldTxt}>LOCK IN</Text>
        </Pressable>
      </View>

      <ScrollView ref={thumbs} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.thumbs} style={s.thumbsBar}>
        {PRODUCTS.map((p, i) => {
          const c = state.counts[p.id];
          const active = i === state.index;
          return (
            <Pressable
              key={p.id}
              onPress={() => {
                tap('select');
                setIndex(i);
              }}
              style={[s.thumb, active && s.thumbActive]}
              accessibilityLabel={p.name}
            >
              <BottleThumb product={p} level={c?.level ?? 10} />
              {c?.lockedAt ? <View style={s.tick} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 18, paddingTop: 14 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  eyebrow: { color: C.eyebrow, fontSize: 11.5, letterSpacing: 0.8, fontWeight: '600' },
  overviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, opacity: 0.85 },
  overviewTxt: { color: C.eyebrow, fontSize: 11.5, fontWeight: '600' },
  title: { color: C.text, fontSize: 25, fontWeight: '700', letterSpacing: -0.3 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginTop: 12 },
  pillRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 18, paddingTop: 8, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
  pill: { color: 'rgba(245,244,239,0.48)', fontSize: 10.5, letterSpacing: 0.6, fontWeight: '500' },
  gaugeWrap: { flex: 1, minHeight: 240, justifyContent: 'center' },
  readout: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    marginHorizontal: 16,
    marginTop: 6,
    borderRadius: R.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  big: { color: '#ffffff', fontSize: 44, fontWeight: '700', lineHeight: 48, letterSpacing: -0.5 },
  slash: { color: 'rgba(255,255,255,0.45)', fontWeight: '300' },
  approx: { color: 'rgba(255,255,255,0.58)', fontSize: 13, marginTop: 2 },
  btnRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 12 },
  btn: { flex: 1, height: 44, borderRadius: R.pill, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  btnDark: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  btnGold: { borderWidth: 1, borderColor: 'rgba(255,235,180,0.3)' },
  btnDarkTxt: { color: C.text, fontWeight: '700', fontSize: 13.5, letterSpacing: 0.5 },
  btnGoldTxt: { color: '#141008', fontWeight: '800', fontSize: 13.5, letterSpacing: 0.5 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  thumbsBar: { flexGrow: 0, marginTop: 12, marginBottom: 8 },
  thumbs: { paddingHorizontal: 14, gap: 9 },
  thumb: {
    width: 65,
    height: 62,
    borderRadius: 10,
    backgroundColor: C.thumb,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  thumbActive: { borderWidth: 1.5, borderColor: C.gold, backgroundColor: C.thumbActiveBg },
  tick: { position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
});
