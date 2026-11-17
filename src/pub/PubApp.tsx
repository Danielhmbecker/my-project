import React, { useState } from 'react';
import { ActivityIndicator, Platform, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { CountScreen } from './CountScreen';
import { OverviewScreen } from './OverviewScreen';
import { WasteModal } from './WasteModal';
import { PRODUCTS } from './data';
import { usePubStore } from './store';
import { C } from './theme';

export default function PubApp() {
  const store = usePubStore();
  const [view, setView] = useState<'count' | 'overview'>('count');
  const [wasteOpen, setWasteOpen] = useState(false);
  const product = PRODUCTS[store.state.index];

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <View style={s.page}>
        <SafeAreaView style={s.phone} edges={['top', 'bottom']}>
          {!store.ready ? (
            <View style={s.loading}>
              <ActivityIndicator color={C.gold} />
            </View>
          ) : view === 'count' ? (
            <CountScreen store={store} onWaste={() => setWasteOpen(true)} onOverview={() => setView('overview')} />
          ) : (
            <OverviewScreen
              store={store}
              onBack={() => setView('count')}
              onJump={(i) => {
                store.setIndex(i);
                setView('count');
              }}
            />
          )}
        </SafeAreaView>
      </View>
      <WasteModal
        visible={wasteOpen}
        product={product}
        onClose={() => setWasteOpen(false)}
        onSave={(ml, reason) => store.logWaste(product.id, ml, reason)}
      />
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.pageBg, alignItems: 'center' },
  phone: { flex: 1, width: '100%', maxWidth: 430, backgroundColor: C.bg, ...(Platform.OS === 'web' ? ({ overflow: 'hidden' } as object) : null) },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
