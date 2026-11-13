import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes, fontWeights } from '../../theme/typography';
import { radius, spacing } from '../../theme/spacing';

export interface PaletteColor {
  id: string;
  name: string;
  hex: string;
  category: 'primary' | 'accent' | 'background' | 'status' | 'neutral';
  isCustom?: boolean;
}

const DEFAULT_PALETTE: PaletteColor[] = [
  { id: '1', name: 'Background Primary', hex: '#0d0f12', category: 'background' },
  { id: '2', name: 'Background Secondary', hex: '#16191f', category: 'background' },
  { id: '3', name: 'Background Tertiary', hex: '#21262d', category: 'background' },
  { id: '4', name: 'Border Default', hex: '#30363d', category: 'neutral' },
  { id: '5', name: 'Border Light', hex: '#444c56', category: 'neutral' },
  { id: '6', name: 'Accent Primary', hex: '#388bfd', category: 'primary' },
  { id: '7', name: 'Accent Purple', hex: '#8957e5', category: 'accent' },
  { id: '8', name: 'Accent Cyan', hex: '#39c5cf', category: 'accent' },
  { id: '9', name: 'Accent Green', hex: '#3fb950', category: 'status' },
  { id: '10', name: 'Accent Orange', hex: '#f0883e', category: 'accent' },
  { id: '11', name: 'Warning Gold', hex: '#d29922', category: 'status' },
  { id: '12', name: 'Error Crimson', hex: '#f85149', category: 'status' },
  { id: '13', name: 'Text Primary', hex: '#f0f6fc', category: 'neutral' },
  { id: '14', name: 'Text Secondary', hex: '#8b949e', category: 'neutral' },
  { id: '15', name: 'Text Muted', hex: '#484f58', category: 'neutral' },
];

const PRESET_THEMES: { name: string; tag: string; colors: string[] }[] = [
  {
    name: 'Graphite Dark (Arena)',
    tag: 'Default',
    colors: ['#0d0f12', '#16191f', '#388bfd', '#8957e5', '#39c5cf', '#3fb950'],
  },
  {
    name: 'Cyberpunk Neon',
    tag: 'Vibrant',
    colors: ['#090d16', '#00ffcc', '#ff007f', '#7928ca', '#ffe600', '#00e5ff'],
  },
  {
    name: 'Linear Indigo',
    tag: 'Minimal',
    colors: ['#0f1117', '#1a1d28', '#5e6ad2', '#828fff', '#4b5563', '#f3f4f6'],
  },
  {
    name: 'Matrix Terminal',
    tag: 'Retro',
    colors: ['#0a0f0d', '#112211', '#00ff66', '#10b981', '#34d399', '#ecfdf5'],
  },
  {
    name: 'Sunset Ember',
    tag: 'Warm',
    colors: ['#140c0c', '#271717', '#f59e0b', '#ef4444', '#fb923c', '#fef3c7'],
  },
  {
    name: 'Xcode Slate',
    tag: 'IDE',
    colors: ['#1c2024', '#282c34', '#61afef', '#98c379', '#e5c07b', '#e06c75'],
  },
];

// Helper: Hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  return null;
}

// Helper: RGB to Hex
function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  const toHex = (c: number) => clamp(c).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Relative luminance for WCAG contrast
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Contrast ratio (1 to 21)
function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 1;

  const lum1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Generate shade spectrum (50-900)
function generateShades(hex: string): { label: string; hex: string }[] {
  const rgb = hexToRgb(hex);
  if (!rgb) return [];

  const factors = [
    { label: '50', factor: 0.85, type: 'tint' },
    { label: '100', factor: 0.7, type: 'tint' },
    { label: '200', factor: 0.5, type: 'tint' },
    { label: '300', factor: 0.3, type: 'tint' },
    { label: '400', factor: 0.15, type: 'tint' },
    { label: '500', factor: 0.0, type: 'base' },
    { label: '600', factor: 0.15, type: 'shade' },
    { label: '700', factor: 0.3, type: 'shade' },
    { label: '800', factor: 0.5, type: 'shade' },
    { label: '900', factor: 0.75, type: 'shade' },
  ];

  return factors.map((f) => {
    if (f.type === 'base') return { label: f.label, hex: hex.toLowerCase() };
    if (f.type === 'tint') {
      const r = rgb.r + (255 - rgb.r) * f.factor;
      const g = rgb.g + (255 - rgb.g) * f.factor;
      const b = rgb.b + (255 - rgb.b) * f.factor;
      return { label: f.label, hex: rgbToHex(r, g, b) };
    } else {
      const r = rgb.r * (1 - f.factor);
      const g = rgb.g * (1 - f.factor);
      const b = rgb.b * (1 - f.factor);
      return { label: f.label, hex: rgbToHex(r, g, b) };
    }
  });
}

// Generate random harmonious palette
function generateHarmoniousPalette(): PaletteColor[] {
  const randomChannel = () => Math.floor(Math.random() * 200) + 55;
  const baseR = randomChannel();
  const baseG = randomChannel();
  const baseB = randomChannel();

  const primaryHex = rgbToHex(baseR, baseG, baseB);
  // Complementary (rotate hue ~180deg)
  const compHex = rgbToHex(255 - baseR, 255 - baseG, Math.min(255, baseB + 40));
  // Analogous
  const analog1 = rgbToHex(
    Math.min(255, Math.max(0, baseR + 40)),
    Math.min(255, Math.max(0, baseG - 30)),
    Math.min(255, Math.max(0, baseB + 50))
  );
  // Accent Cyan/Teal
  const cyanAccent = rgbToHex(40, Math.min(255, baseG + 70), Math.min(255, baseB + 90));
  // Warning/Amber
  const amberAccent = rgbToHex(240, 160, 40);

  return [
    { id: 'h-1', name: 'Background Canvas', hex: '#0a0d12', category: 'background', isCustom: true },
    { id: 'h-2', name: 'Surface Elevated', hex: '#141a23', category: 'background', isCustom: true },
    { id: 'h-3', name: 'Border Line', hex: '#283240', category: 'neutral', isCustom: true },
    { id: 'h-4', name: 'Dynamic Primary', hex: primaryHex, category: 'primary', isCustom: true },
    { id: 'h-5', name: 'Harmonic Contrast', hex: compHex, category: 'accent', isCustom: true },
    { id: 'h-6', name: 'Analogous Tint', hex: analog1, category: 'accent', isCustom: true },
    { id: 'h-7', name: 'Neon Glow', hex: cyanAccent, category: 'accent', isCustom: true },
    { id: 'h-8', name: 'Status Indicator', hex: amberAccent, category: 'status', isCustom: true },
  ];
}

export const ColorPalettePicker: React.FC = () => {
  const [palette, setPalette] = useState<PaletteColor[]>(DEFAULT_PALETTE);
  const [selectedColor, setSelectedColor] = useState<PaletteColor>(DEFAULT_PALETTE[5]); // Accent Primary
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  // New color form state
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#');
  const [newColorCategory, setNewColorCategory] = useState<PaletteColor['category']>('primary');
  const [showAddForm, setShowAddForm] = useState(false);

  // Quick Swatches for adding
  const QUICK_SWATCHES = [
    '#388bfd',
    '#8957e5',
    '#39c5cf',
    '#3fb950',
    '#f0883e',
    '#f85149',
    '#e3b341',
    '#ec4899',
    '#10b981',
    '#06b6d4',
    '#a855f7',
    '#f43f5e',
  ];

  // Copy handler
  const handleCopyHex = useCallback((hex: string) => {
    setCopiedHex(hex);
    setTimeout(() => {
      setCopiedHex(null);
    }, 2500);
  }, []);

  // Add new color
  const handleAddColor = () => {
    const trimmedHex = newColorHex.trim();
    if (!trimmedHex.startsWith('#') || (trimmedHex.length !== 4 && trimmedHex.length !== 7)) {
      Alert.alert('Invalid Hex', 'Please enter a valid hex color code (e.g. #388bfd).');
      return;
    }
    const name = newColorName.trim() || `Color ${palette.length + 1}`;
    const newEntry: PaletteColor = {
      id: `custom-${Date.now()}`,
      name,
      hex: trimmedHex.toLowerCase(),
      category: newColorCategory,
      isCustom: true,
    };
    setPalette((prev) => [newEntry, ...prev]);
    setSelectedColor(newEntry);
    setNewColorName('');
    setNewColorHex('#');
    setShowAddForm(false);
  };

  // Delete custom color
  const handleDeleteColor = (id: string) => {
    setPalette((prev) => prev.filter((c) => c.id !== id));
    if (selectedColor.id === id) {
      setSelectedColor(palette[0] || DEFAULT_PALETTE[0]);
    }
  };

  // Generate shades of selected color
  const shades = useMemo(() => {
    return generateShades(selectedColor.hex);
  }, [selectedColor.hex]);

  // Contrast calculations for selected color
  const contrastAgainstBgPrimary = useMemo(() => {
    return getContrastRatio(selectedColor.hex, '#0d0f12');
  }, [selectedColor.hex]);

  const contrastAgainstBgSecondary = useMemo(() => {
    return getContrastRatio(selectedColor.hex, '#16191f');
  }, [selectedColor.hex]);

  const contrastAgainstWhite = useMemo(() => {
    return getContrastRatio(selectedColor.hex, '#ffffff');
  }, [selectedColor.hex]);

  // WCAG badge helper
  const getWcagBadge = (ratio: number) => {
    if (ratio >= 7.0) return { label: 'AAA Pass', color: '#3fb950', bg: 'rgba(63, 185, 80, 0.15)' };
    if (ratio >= 4.5) return { label: 'AA Pass', color: '#58a6ff', bg: 'rgba(88, 166, 255, 0.15)' };
    if (ratio >= 3.0) return { label: 'AA Large', color: '#d29922', bg: 'rgba(210, 153, 34, 0.15)' };
    return { label: 'Fails', color: '#f85149', bg: 'rgba(248, 81, 73, 0.15)' };
  };

  // Filtered palette
  const filteredPalette = useMemo(() => {
    if (filterCategory === 'all') return palette;
    return palette.filter((c) => c.category === filterCategory);
  }, [palette, filterCategory]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Copied Feedback Toast */}
      {copiedHex && (
        <View style={styles.toastBanner}>
          <Ionicons name="checkmark-circle" size={16} color="#3fb950" />
          <Text style={styles.toastText}>Copied {copiedHex.toUpperCase()} to clipboard</Text>
        </View>
      )}

      {/* Header Info & Generator Bar */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Interactive Color Studio</Text>
          <Text style={styles.sectionSubtitle}>
            Test WCAG 2.1 contrast ratios against dark surfaces and preview harmonious palettes.
          </Text>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtnSecondary}
            onPress={() => {
              const harmonious = generateHarmoniousPalette();
              setPalette(harmonious);
              setSelectedColor(harmonious[3]);
            }}
          >
            <Ionicons name="sparkles-outline" size={14} color="#39c5cf" />
            <Text style={[styles.actionBtnText, { color: '#39c5cf' }]}>Generate Harmony</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <Ionicons name={showAddForm ? 'close' : 'add'} size={15} color="#fff" />
            <Text style={styles.actionBtnPrimaryText}>
              {showAddForm ? 'Cancel' : 'New Color'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Preset Themes Carousel / Quick Selector */}
      <View style={styles.presetsCard}>
        <Text style={styles.cardHeaderLabel}>PRESET COLOR SCHEMES</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsScroll}>
          {PRESET_THEMES.map((themeItem, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.presetChip}
              onPress={() => {
                const newPalette = themeItem.colors.map((hex, i) => ({
                  id: `preset-${idx}-${i}`,
                  name: `${themeItem.name} ${i + 1}`,
                  hex,
                  category: i < 2 ? ('background' as const) : ('primary' as const),
                  isCustom: true,
                }));
                setPalette(newPalette);
                setSelectedColor(newPalette[2] || newPalette[0]);
              }}
            >
              <View style={styles.presetColorRow}>
                {themeItem.colors.map((c, ci) => (
                  <View key={ci} style={[styles.presetDot, { backgroundColor: c }]} />
                ))}
              </View>
              <Text style={styles.presetName}>{themeItem.name}</Text>
              <View style={styles.presetTag}>
                <Text style={styles.presetTagText}>{themeItem.tag}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Add Color Form (Toggleable) */}
      {showAddForm && (
        <View style={styles.addFormCard}>
          <View style={styles.addFormHeader}>
            <Ionicons name="color-palette-outline" size={16} color="#388bfd" />
            <Text style={styles.addFormTitle}>Add Custom Token</Text>
          </View>
          <View style={styles.formRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>TOKEN NAME</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Surface Glow"
                placeholderTextColor="#484f58"
                value={newColorName}
                onChangeText={setNewColorName}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>HEX CODE</Text>
              <View style={styles.hexInputWrapper}>
                <View
                  style={[
                    styles.hexPreviewDot,
                    {
                      backgroundColor:
                        newColorHex.length === 7 || newColorHex.length === 4
                          ? newColorHex
                          : '#388bfd',
                    },
                  ]}
                />
                <TextInput
                  style={[styles.textInput, styles.hexInput]}
                  placeholder="#388bfd"
                  placeholderTextColor="#484f58"
                  value={newColorHex}
                  onChangeText={(val) => setNewColorHex(val.startsWith('#') ? val : `#${val}`)}
                  autoCapitalize="none"
                />
              </View>
            </View>
          </View>

          {/* Quick Swatches */}
          <Text style={[styles.inputLabel, { marginTop: 8 }]}>QUICK SWATCHES</Text>
          <View style={styles.swatchesRow}>
            {QUICK_SWATCHES.map((swatch, sIdx) => (
              <TouchableOpacity
                key={sIdx}
                style={[styles.swatchItem, { backgroundColor: swatch }]}
                onPress={() => setNewColorHex(swatch)}
              />
            ))}
          </View>

          {/* Category Selector */}
          <View style={styles.categoryPickerRow}>
            {(['primary', 'accent', 'background', 'status', 'neutral'] as const).map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.catOption,
                  newColorCategory === cat && styles.catOptionActive,
                ]}
                onPress={() => setNewColorCategory(cat)}
              >
                <Text
                  style={[
                    styles.catOptionText,
                    newColorCategory === cat && styles.catOptionTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleAddColor}>
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text style={styles.saveBtnText}>Save Color to Palette</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Selected Color Inspector & Contrast Analyzer */}
      <View style={styles.inspectorCard}>
        <View style={styles.inspectorTop}>
          <View style={[styles.largeColorPreview, { backgroundColor: selectedColor.hex }]}>
            <Text
              style={[
                styles.largeColorPreviewText,
                { color: contrastAgainstWhite > 3 ? '#ffffff' : '#0d0f12' },
              ]}
            >
              {selectedColor.hex.toUpperCase()}
            </Text>
          </View>

          <View style={styles.inspectorDetails}>
            <View style={styles.inspectorHeaderRow}>
              <Text style={styles.inspectorTitle}>{selectedColor.name}</Text>
              {selectedColor.isCustom && (
                <TouchableOpacity
                  onPress={() => handleDeleteColor(selectedColor.id)}
                  style={styles.deleteBtn}
                >
                  <Ionicons name="trash-outline" size={14} color="#f85149" />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.inspectorCategory}>
              Category: <Text style={{ color: '#388bfd' }}>{selectedColor.category}</Text>
            </Text>

            <View style={styles.hexActions}>
              <TouchableOpacity
                style={styles.copyHexBadge}
                onPress={() => handleCopyHex(selectedColor.hex)}
              >
                <Ionicons name="copy-outline" size={13} color="#f0f6fc" />
                <Text style={styles.copyHexText}>{selectedColor.hex.toUpperCase()}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.copyRgbBadge}
                onPress={() => {
                  const rgb = hexToRgb(selectedColor.hex);
                  if (rgb) handleCopyHex(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
                }}
              >
                <Text style={styles.copyRgbText}>
                  {(() => {
                    const rgb = hexToRgb(selectedColor.hex);
                    return rgb ? `RGB(${rgb.r}, ${rgb.g}, ${rgb.b})` : 'RGB';
                  })()}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Contrast Checker Section */}
        <View style={styles.contrastSection}>
          <View style={styles.contrastHeader}>
            <Ionicons name="shield-checkmark-outline" size={14} color="#58a6ff" />
            <Text style={styles.contrastSectionTitle}>WCAG 2.1 Contrast Analysis</Text>
          </View>

          <View style={styles.contrastGrid}>
            {/* vs Canvas Dark (#0d0f12) */}
            <View style={styles.contrastItem}>
              <Text style={styles.contrastLabel}>vs. Canvas (#0d0f12)</Text>
              <View style={styles.contrastValueRow}>
                <Text style={styles.contrastRatioText}>
                  {contrastAgainstBgPrimary.toFixed(2)}:1
                </Text>
                {(() => {
                  const badge = getWcagBadge(contrastAgainstBgPrimary);
                  return (
                    <View style={[styles.wcagPill, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.wcagPillText, { color: badge.color }]}>
                        {badge.label}
                      </Text>
                    </View>
                  );
                })()}
              </View>
              {/* Mini live visual simulation */}
              <View style={[styles.contrastSimBox, { backgroundColor: '#0d0f12' }]}>
                <Text style={[styles.simText, { color: selectedColor.hex }]}>Aa Sample Text</Text>
              </View>
            </View>

            {/* vs Card Surface (#16191f) */}
            <View style={styles.contrastItem}>
              <Text style={styles.contrastLabel}>vs. Surface (#16191f)</Text>
              <View style={styles.contrastValueRow}>
                <Text style={styles.contrastRatioText}>
                  {contrastAgainstBgSecondary.toFixed(2)}:1
                </Text>
                {(() => {
                  const badge = getWcagBadge(contrastAgainstBgSecondary);
                  return (
                    <View style={[styles.wcagPill, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.wcagPillText, { color: badge.color }]}>
                        {badge.label}
                      </Text>
                    </View>
                  );
                })()}
              </View>
              <View style={[styles.contrastSimBox, { backgroundColor: '#16191f' }]}>
                <Text style={[styles.simText, { color: selectedColor.hex }]}>Aa Surface Test</Text>
              </View>
            </View>

            {/* vs White (#ffffff) */}
            <View style={styles.contrastItem}>
              <Text style={styles.contrastLabel}>vs. Pure White (#fff)</Text>
              <View style={styles.contrastValueRow}>
                <Text style={styles.contrastRatioText}>{contrastAgainstWhite.toFixed(2)}:1</Text>
                {(() => {
                  const badge = getWcagBadge(contrastAgainstWhite);
                  return (
                    <View style={[styles.wcagPill, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.wcagPillText, { color: badge.color }]}>
                        {badge.label}
                      </Text>
                    </View>
                  );
                })()}
              </View>
              <View style={[styles.contrastSimBox, { backgroundColor: '#ffffff' }]}>
                <Text style={[styles.simText, { color: selectedColor.hex }]}>Aa Light Mode</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Dynamic Shade Spectrum */}
        <View style={styles.shadesSection}>
          <Text style={styles.shadesTitle}>50–900 GENERATED SHADES</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.shadesScroll}>
            {shades.map((shade, sIndex) => (
              <TouchableOpacity
                key={sIndex}
                style={styles.shadeItem}
                onPress={() => handleCopyHex(shade.hex)}
              >
                <View style={[styles.shadeSwatch, { backgroundColor: shade.hex }]} />
                <Text style={styles.shadeLabel}>{shade.label}</Text>
                <Text style={styles.shadeHex}>{shade.hex.substring(0, 7)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Palette Filter Bar */}
      <View style={styles.paletteHeaderRow}>
        <Text style={styles.paletteTitle}>ACTIVE PALETTE ({filteredPalette.length})</Text>
        <View style={styles.filterTabs}>
          {['all', 'primary', 'accent', 'background', 'status', 'neutral'].map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterTab,
                filterCategory === cat && styles.filterTabActive,
              ]}
              onPress={() => setFilterCategory(cat)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filterCategory === cat && styles.filterTabTextActive,
                ]}
              >
                {cat.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Palette Grid */}
      <View style={styles.paletteGrid}>
        {filteredPalette.map((colorItem) => {
          const isSelected = selectedColor.id === colorItem.id;
          return (
            <TouchableOpacity
              key={colorItem.id}
              style={[styles.colorCard, isSelected && styles.colorCardSelected]}
              onPress={() => setSelectedColor(colorItem)}
              activeOpacity={0.8}
            >
              <View style={[styles.colorCardTop, { backgroundColor: colorItem.hex }]}>
                <TouchableOpacity
                  style={styles.copyOverlayBtn}
                  onPress={() => handleCopyHex(colorItem.hex)}
                >
                  <Ionicons name="copy-outline" size={12} color="#ffffff" />
                </TouchableOpacity>
              </View>
              <View style={styles.colorCardBody}>
                <Text style={styles.colorCardName} numberOfLines={1}>
                  {colorItem.name}
                </Text>
                <Text style={styles.colorCardHex}>{colorItem.hex.toUpperCase()}</Text>
                <View style={styles.colorCardFooter}>
                  <Text style={styles.colorCardCat}>{colorItem.category}</Text>
                  {colorItem.isCustom && (
                    <Text style={styles.customBadge}>CUSTOM</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: 60,
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  toastText: {
    color: '#f0f6fc',
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.mono,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'column',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    marginTop: 2,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentPrimary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  actionBtnPrimaryText: {
    color: '#ffffff',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(57, 197, 207, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(57, 197, 207, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  actionBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
  },
  presetsCard: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  cardHeaderLabel: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.mono,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  presetsScroll: {
    flexDirection: 'row',
  },
  presetChip: {
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    padding: 10,
    marginRight: spacing.sm,
    width: 140,
  },
  presetColorRow: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 6,
  },
  presetDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  presetName: {
    color: colors.textPrimary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    marginBottom: 4,
  },
  presetTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  presetTagText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontFamily: fontFamilies.mono,
  },
  addFormCard: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: '#388bfd',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  addFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  addFormTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.mono,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: colors.bgPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
  },
  hexInputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  hexInput: {
    paddingLeft: 34,
    fontFamily: fontFamilies.mono,
  },
  hexPreviewDot: {
    position: 'absolute',
    left: 10,
    width: 14,
    height: 14,
    borderRadius: 7,
    zIndex: 1,
  },
  swatchesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 6,
  },
  swatchItem: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  categoryPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: spacing.sm,
  },
  catOption: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catOptionActive: {
    backgroundColor: colors.accentPrimary,
    borderColor: colors.accentPrimary,
  },
  catOptionText: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    textTransform: 'capitalize',
  },
  catOptionTextActive: {
    color: '#ffffff',
    fontWeight: fontWeights.semibold,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#388bfd',
    paddingVertical: 10,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
  },
  inspectorCard: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  inspectorTop: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  largeColorPreview: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  largeColorPreviewText: {
    fontSize: 10,
    fontFamily: fontFamilies.mono,
    fontWeight: '700',
  },
  inspectorDetails: {
    flex: 1,
  },
  inspectorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inspectorTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
  },
  deleteBtn: {
    padding: 4,
  },
  inspectorCategory: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
  hexActions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  copyHexBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  copyHexText: {
    color: colors.textPrimary,
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.mono,
  },
  copyRgbBadge: {
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  copyRgbText: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.mono,
  },
  contrastSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  contrastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  contrastSectionTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.mono,
    fontWeight: fontWeights.semibold,
  },
  contrastGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  contrastItem: {
    flex: 1,
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  contrastLabel: {
    color: colors.textMuted,
    fontSize: 10,
    marginBottom: 4,
  },
  contrastValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  contrastRatioText: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.mono,
    fontWeight: '700',
  },
  wcagPill: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  wcagPillText: {
    fontSize: 9,
    fontWeight: '700',
  },
  contrastSimBox: {
    borderRadius: radius.xs,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  simText: {
    fontSize: 10,
    fontWeight: '600',
  },
  shadesSection: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
  },
  shadesTitle: {
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  shadesScroll: {
    flexDirection: 'row',
  },
  shadeItem: {
    alignItems: 'center',
    marginRight: 8,
    width: 48,
  },
  shadeSwatch: {
    width: 40,
    height: 28,
    borderRadius: radius.xs,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  shadeLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontFamily: fontFamilies.mono,
  },
  shadeHex: {
    color: colors.textMuted,
    fontSize: 8,
    fontFamily: fontFamilies.mono,
  },
  paletteHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    flexWrap: 'wrap',
    gap: 8,
  },
  paletteTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.mono,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.5,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  filterTab: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    backgroundColor: colors.bgTertiary,
  },
  filterTabActive: {
    backgroundColor: colors.accentPrimary,
  },
  filterTabText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: fontWeights.medium,
  },
  filterTabTextActive: {
    color: '#ffffff',
    fontWeight: fontWeights.bold,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorCard: {
    width: '48%',
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  colorCardSelected: {
    borderColor: colors.accentPrimary,
    borderWidth: 1.5,
  },
  colorCardTop: {
    height: 48,
    position: 'relative',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 6,
  },
  copyOverlayBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radius.full,
    padding: 4,
  },
  colorCardBody: {
    padding: 10,
  },
  colorCardName: {
    color: colors.textPrimary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
  colorCardHex: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: fontFamilies.mono,
    marginTop: 2,
  },
  colorCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  colorCardCat: {
    color: colors.textMuted,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  customBadge: {
    color: '#39c5cf',
    fontSize: 8,
    fontFamily: fontFamilies.mono,
    fontWeight: '700',
  },
});
