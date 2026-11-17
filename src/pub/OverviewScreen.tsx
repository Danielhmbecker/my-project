import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PRODUCTS } from './data';
import { PubStore } from './store';
import { C, R } from './theme';

type Tab = 'stock' | 'reorder' | 'waste';

const gbp = (n: number) => `£${n.toFixed(2)}`;
const LOW = 2; // tenths: at or below this the bottle is nearly empty

export function OverviewScreen({ store, onBack, onJump }: { store: PubStore; onBack: () => void; onJump: (i: number) => void }) {
  const { state, removeWaste, resetCounts } = store;
  const [tab, setTab] = useState<Tab>('stock');

  const rows = PRODUCTS.map((p, i) => ({ p, i, c: state.counts[p.id] }));
  const counted = rows.filter((r) => r.c?.lockedAt);
  const onHandMl = counted.reduce((sum, r) => sum + (r.c!.level / 10) * r.p.sizeMl, 0);
  const value = counted.reduce((sum, r) => sum + (r.c!.level / 10) * r.p.cost, 0);
  const low = counted.filter((r) => r.c!.level <= LOW);
  const wasteMl = state.waste.reduce((sum, w) => sum + w.ml, 0);
  const wasteCost = state.waste.reduce((sum, w) => {
    const p = PRODUCTS.find((x) => x.id === w.productId);
    return sum + (p ? (w.ml / p.sizeMl) * p.cost : 0);
  }, 0);

  const confirmReset = () => {
    const go = () => resetCounts();
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Clear all counts and start a new stock-take?')) go();
    } else {
      Alert.alert('New stock-take', 'Clear all counts and start again? Waste log is kept.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear counts', style: 'destructive', onPress: go },
      ]);
    }
  };

  const bar = (level: number, warn?: boolean) => (
    <View style={s.barTrack}>
      <View style={[s.barFill, { width: `${level * 10}%`, backgroundColor: warn ? C.red : C.gold }]} />
    </View>
  );

  return (
    <View style={s.root}>
      <View style={s.top}>
        <Pressable onPress={onBack} hitSlop={12} style={s.back}>
          <Ionicons name="chevron-back" size={20} color={C.gold} />
          <Text style={s.backTxt}>Count</Text>
        </Pressable>
        <Pressable onPress={confirmReset} hitSlop={12}>
          <Text style={s.reset}>New stock-take</Text>
        </Pressable>
      </View>
      <Text style={s.h1}>Stock overview</Text>

      <View style={s.stats}>
        <Stat label="COUNTED" value={`${counted.length}/${PRODUCTS.length}`} />
        <Stat label="ON HAND" value={`${(onHandMl / 1000).toFixed(1)} L`} />
        <Stat label="VALUE" value={gbp(value)} />
        <Stat label="LOW" value={String(low.length)} warn={low.length > 0} />
      </View>

      <View style={s.tabs}>
        {([['stock', 'Stock'], ['reorder', `Reorder (${low.length})`], ['waste', `Waste (${state.waste.length})`]] as [Tab, string][]).map(([k, label]) => (
          <Pressable key={k} onPress={() => setTab(k)} style={[s.tab, tab === k && s.tabOn]}>
            <Text style={[s.tabTxt, tab === k && s.tabTxtOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        {tab === 'stock' &&
          [1, 2, 3, 4].map((shelf) => (
            <View key={shelf}>
              <Text style={s.shelf}>SHELF {shelf}</Text>
              {rows
                .filter((r) => r.p.shelf === shelf)
                .map(({ p, i, c }) => (
                  <Pressable key={p.id} style={s.row} onPress={() => onJump(i)}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.name} numberOfLines={1}>
                        {p.name}
                      </Text>
                      <Text style={s.sub}>
                        {c ? `${Math.round((c.level / 10) * p.sizeMl)} ml of ${p.sizeMl}` : `${p.sizeMl} ml · not counted`}
                      </Text>
                    </View>
                    <View style={{ width: 90 }}>{bar(c?.level ?? 0, !!c && c.level <= LOW)}</View>
                    <Text style={[s.lvl, c?.lockedAt ? { color: C.green } : { color: C.dim }]}>{c ? `${c.level}/10` : '–'}</Text>
                  </Pressable>
                ))}
            </View>
          ))}

        {tab === 'reorder' &&
          (low.length === 0 ? (
            <Text style={s.empty}>Nothing low yet. Lock in your counts and anything at {LOW}/10 or below shows up here.</Text>
          ) : (
            low.map(({ p, i, c }) => (
              <Pressable key={p.id} style={s.row} onPress={() => onJump(i)}>
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{p.name}</Text>
                  <Text style={s.sub}>
                    {Math.round((c!.level / 10) * p.sizeMl)} ml left · {gbp(p.cost)} / bottle
                  </Text>
                </View>
                <Text style={[s.lvl, { color: C.red }]}>{c!.level}/10</Text>
              </Pressable>
            ))
          ))}

        {tab === 'waste' && (
          <>
            <Text style={s.sub2}>
              {state.waste.length} entries · {wasteMl} ml · about {gbp(wasteCost)} at cost
            </Text>
            {state.waste.length === 0 ? (
              <Text style={s.empty}>No waste logged. Use LOG WASTE on the count screen.</Text>
            ) : (
              state.waste.map((w) => {
                const p = PRODUCTS.find((x) => x.id === w.productId);
                return (
                  <View key={w.id} style={s.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.name}>{p?.name ?? w.productId}</Text>
                      <Text style={s.sub}>
                        {w.ml} ml · {w.reason} · {new Date(w.at).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <Pressable onPress={() => removeWaste(w.id)} hitSlop={10}>
                      <Ionicons name="trash-outline" size={18} color={C.dim} />
                    </Pressable>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <View style={s.stat}>
      <Text style={[s.statV, warn && { color: C.red }]}>{value}</Text>
      <Text style={s.statL}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 14 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12 },
  back: { flexDirection: 'row', alignItems: 'center' },
  backTxt: { color: C.gold, fontSize: 15, fontWeight: '600' },
  reset: { color: C.muted, fontSize: 13 },
  h1: { color: C.text, fontSize: 26, fontWeight: '700', marginTop: 10 },
  stats: { flexDirection: 'row', gap: 8, marginTop: 14 },
  stat: { flex: 1, backgroundColor: C.card, borderRadius: R.md, paddingVertical: 10, alignItems: 'center' },
  statV: { color: C.text, fontSize: 16, fontWeight: '700' },
  statL: { color: C.muted, fontSize: 10, letterSpacing: 0.8, marginTop: 2 },
  tabs: { flexDirection: 'row', gap: 6, marginTop: 14, marginBottom: 4 },
  tab: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: R.pill, backgroundColor: '#1d3228' },
  tabOn: { backgroundColor: 'rgba(214,180,110,0.18)' },
  tabTxt: { color: C.muted, fontSize: 13 },
  tabTxtOn: { color: C.gold, fontWeight: '700' },
  shelf: { color: C.gold, fontSize: 11, letterSpacing: 1.2, fontWeight: '700', marginTop: 16, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  name: { color: C.text, fontSize: 15, fontWeight: '600' },
  sub: { color: C.muted, fontSize: 12, marginTop: 2 },
  sub2: { color: C.muted, fontSize: 13, marginTop: 12 },
  lvl: { width: 40, textAlign: 'right', fontSize: 13, fontWeight: '700' },
  barTrack: { height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  barFill: { height: 5, borderRadius: 3 },
  empty: { color: C.muted, fontSize: 14, marginTop: 24, lineHeight: 20 },
});
