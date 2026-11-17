import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRODUCTS, WasteReason } from './data';

const KEY = 'taproom.v1';

export interface Count {
  level: number; // 0..10 tenths of a bottle
  lockedAt?: string;
}
export interface WasteEntry {
  id: string;
  productId: string;
  ml: number;
  reason: WasteReason;
  at: string;
}
export interface PubState {
  counts: Record<string, Count>;
  waste: WasteEntry[];
  index: number;
}

const initial: PubState = {
  // demo state matching the design: Pimm's part-used, not yet locked in
  counts: { pimms: { level: 6 } },
  waste: [],
  index: Math.max(0, PRODUCTS.findIndex((x) => x.id === 'pimms')),
};

export function usePubStore() {
  const [state, setState] = useState<PubState>(initial);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<PubState>;
          setState({ ...initial, ...parsed });
        }
      } catch {
        /* start fresh */
      }
      loaded.current = true;
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const setIndex = useCallback((index: number) => {
    setState((s) => ({ ...s, index: Math.min(PRODUCTS.length - 1, Math.max(0, index)) }));
  }, []);

  const setLevel = useCallback((productId: string, level: number) => {
    setState((s) => ({ ...s, counts: { ...s.counts, [productId]: { level } } }));
  }, []);

  const lockIn = useCallback((productId: string, level: number) => {
    setState((s) => ({
      ...s,
      counts: { ...s.counts, [productId]: { level, lockedAt: new Date().toISOString() } },
      index: Math.min(PRODUCTS.length - 1, s.index + 1),
    }));
  }, []);

  const logWaste = useCallback((productId: string, ml: number, reason: WasteReason) => {
    setState((s) => ({
      ...s,
      waste: [
        { id: `${Date.now()}-${Math.round(Math.random() * 1e4)}`, productId, ml, reason, at: new Date().toISOString() },
        ...s.waste,
      ],
    }));
  }, []);

  const removeWaste = useCallback((id: string) => {
    setState((s) => ({ ...s, waste: s.waste.filter((w) => w.id !== id) }));
  }, []);

  const resetCounts = useCallback(() => {
    setState((s) => ({ ...s, counts: {}, index: initial.index }));
  }, []);

  return { state, ready, setIndex, setLevel, lockIn, logWaste, removeWaste, resetCounts };
}

export type PubStore = ReturnType<typeof usePubStore>;
