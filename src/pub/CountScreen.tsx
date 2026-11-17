import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
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
  const { height: winH } = useWindowDimensions();
  const product = PRODUCTS[state.index];
  const saved = state.counts[product.id];
  const [level, setLocal] = useState(saved?.level ?? 10);
  const lastInt = useRef(Math.round(level));

  // switching bottle loads its saved level
  useEffect(() => {
    const l = state.counts[product.id]?.level ?? 10;
    setLocal(l);
    lastInt.current = Math.round(l);
  }, [product.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const gaugeH = Math.max(240, Math.min(400, winH - 440));
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
    thumbs.current?.scrollTo({ x: Math.max(0, state.index * 74 - 140), animated: true });
  }, [state.index]);

  const counted = Object.values(state.counts).filter((c) => c.lockedAt).length;
  const isLocked = !!saved?.lockedAt;

  return (
    <View style={s.root}>
      <View style={s.header}>
        <View style={s.eyebrowRow}>
          <Text style={s.eyebrow}>
            {LOCATION} - SHELF {shelf} - {state.index + 1} OF {PRODUCTS.length}
          </Text>
          <Pressable onPress={onOverview} hitSlop={12} style={s.overviewBtn} accessibilityLabel="Open stock overview">
            <Ionicons name="list" size={18} color={C.gold} />
            <Text style={s.overviewTxt}>{counted}/{PRODUCTS.length}</Text>
          </Pressable>
        </View>
        <Text style={s.title} numberOfLines={1} adjustsFontSizeToFit>
          {product.name} - {product.sizeMl}ml
        </Text>
      </View>

      <View style={s.pillRow}>
        <View style={s.dot} />
        <Text style={s.pill}>OFFLINE - SYNCS LATER</Text>
      </View>

      <View style={{ paddingHorizontal: 0, marginTop: 4 }}>
        <LevelGauge product={product} level={level} height={gaugeH} onChange={onChange} onRelease={onRelease} />
      </View>

      <View style={s.readout}>
        <Text style={s.big}>
          {whole}
          <Text style={s.slash}>/</Text>
          10
        </Text>
        <Text style={s.approx}>approx {ml} ml remaining{isLocked ? '  ·  locked ✓' : ''}</Text>
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
          <Text style={s.btnDarkTxt}>LOG WASTE</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [s.btn, pressed && s.pressed]}
          onPress={() => {
            tap('medium');
            lockIn(product.id, whole);
          }}
          accessibilityRole="button"
        >
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#e9cf93" />
                <Stop offset="0.55" stopColor="#d6b46e" />
                <Stop offset="1" stopColor="#b8924a" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#gold)" />
          </Svg>
          <Text style={s.btnGoldTxt}>LOCK IN</Text>
        </Pressable>
      </View>

      <ScrollView ref={thumbs} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.thumbs} style={{ flexGrow: 0 }}>
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
  header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  eyebrow: { color: C.gold, fontSize: 12, letterSpacing: 1, fontWeight: '600' },
  overviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  overviewTxt: { color: C.gold, fontSize: 12, fontWeight: '700' },
  title: { color: C.text, fontSize: 26, fontWeight: '700' },
  pillRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 12, paddingTop: 8, gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
  pill: { color: C.muted, fontSize: 10, letterSpacing: 0.6 },
  readout: { backgroundColor: C.card, marginHorizontal: 12, marginTop: 10, borderRadius: R.md, paddingVertical: 12, alignItems: 'center' },
  big: { color: C.text, fontSize: 52, fontWeight: '700', lineHeight: 58 },
  slash: { color: C.muted, fontWeight: '300' },
  approx: { color: C.muted, fontSize: 13, marginTop: 0 },
  btnRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, marginTop: 14 },
  btn: { flex: 1, height: 38, borderRadius: R.pill, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  btnDark: { backgroundColor: C.btnDark, flex: 0.95 },
  btnDarkTxt: { color: C.text, fontWeight: '700', fontSize: 14 },
  btnGoldTxt: { color: '#1b1409', fontWeight: '800', fontSize: 14 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  thumbs: { paddingHorizontal: 0, paddingTop: 12, paddingBottom: 16, gap: 8 },
  thumb: { width: 66, height: 52, borderRadius: 10, backgroundColor: C.thumb, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
  thumbActive: { borderColor: C.gold, backgroundColor: '#22382d' },
  tick: { position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: 4, backgroundColor: C.green },
});
