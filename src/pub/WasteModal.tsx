import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Product, WASTE_AMOUNTS, WASTE_REASONS, WasteReason } from './data';
import { C, R } from './theme';

interface Props {
  visible: boolean;
  product: Product;
  onClose: () => void;
  onSave: (ml: number, reason: WasteReason) => void;
}

export function WasteModal({ visible, product, onClose, onSave }: Props) {
  const [ml, setMl] = useState<number>(50);
  const [reason, setReason] = useState<WasteReason>('Spillage');
  const amounts: number[] = [...WASTE_AMOUNTS, product.sizeMl];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.sheet} onPress={() => {}}>
          <Text style={s.eyebrow}>LOG WASTE</Text>
          <Text style={s.title}>{product.name}</Text>

          <Text style={s.label}>How much?</Text>
          <View style={s.chips}>
            {amounts.map((a) => (
              <Pressable key={a} onPress={() => setMl(a)} style={[s.chip, ml === a && s.chipOn]}>
                <Text style={[s.chipTxt, ml === a && s.chipTxtOn]}>{a === product.sizeMl ? 'Whole bottle' : `${a} ml`}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={s.label}>Why?</Text>
          <View style={s.chips}>
            {WASTE_REASONS.map((r) => (
              <Pressable key={r} onPress={() => setReason(r)} style={[s.chip, reason === r && s.chipOn]}>
                <Text style={[s.chipTxt, reason === r && s.chipTxtOn]}>{r}</Text>
              </Pressable>
            ))}
          </View>

          <View style={s.row}>
            <Pressable style={[s.btn, { backgroundColor: C.btnDark }]} onPress={onClose}>
              <Text style={[s.btnTxt, { color: C.text }]}>CANCEL</Text>
            </Pressable>
            <Pressable
              style={[s.btn, { backgroundColor: C.gold }]}
              onPress={() => {
                onSave(ml, reason);
                onClose();
              }}
            >
              <Text style={[s.btnTxt, { color: '#1b1409' }]}>LOG {ml} ML</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: { width: '100%', maxWidth: 430, backgroundColor: C.panel, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 32 },
  eyebrow: { color: C.gold, fontSize: 12, letterSpacing: 1, fontWeight: '600' },
  title: { color: C.text, fontSize: 22, fontWeight: '700', marginTop: 4 },
  label: { color: C.muted, fontSize: 13, marginTop: 18, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: R.pill, backgroundColor: '#243a30', borderWidth: 1, borderColor: 'transparent' },
  chipOn: { borderColor: C.gold, backgroundColor: 'rgba(214,180,110,0.16)' },
  chipTxt: { color: C.text, fontSize: 14 },
  chipTxtOn: { color: C.gold, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 10, marginTop: 24 },
  btn: { flex: 1, height: 44, borderRadius: R.pill, alignItems: 'center', justifyContent: 'center' },
  btnTxt: { fontWeight: '800', fontSize: 14 },
});
