import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
} from '../../theme/typography';
import { radius, spacing, shadows } from '../../theme/spacing';
import { ColorPalettePicker } from './ColorPalettePicker';
import { ComponentGallery } from './ComponentGallery';
import { AssetManager } from './AssetManager';

export type DesignStudioTab = 'tokens' | 'palettes' | 'components' | 'assets';

export const DesignStudioScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DesignStudioTab>('tokens');
  const [tokenSearchQuery, setTokenSearchQuery] = useState('');
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportFormat, setExportFormat] = useState<'typescript' | 'json' | 'css'>('typescript');
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // Sub-category filter inside Tokens tab
  const [tokenCategory, setTokenCategory] = useState<
    'all' | 'colors' | 'typography' | 'radiuses' | 'shadows' | 'spacing'
  >('all');

  const showToast = (message: string) => {
    setCopiedToast(message);
    setTimeout(() => {
      setCopiedToast(null);
    }, 2500);
  };

  // Color tokens list
  const colorTokenList = useMemo(() => {
    return [
      { key: 'bgPrimary', value: colors.bgPrimary, cat: 'Background' },
      { key: 'bgSecondary', value: colors.bgSecondary, cat: 'Background' },
      { key: 'bgTertiary', value: colors.bgTertiary, cat: 'Background' },
      { key: 'bgElevated', value: colors.bgElevated, cat: 'Background' },
      { key: 'border', value: colors.border, cat: 'Border' },
      { key: 'borderLight', value: colors.borderLight, cat: 'Border' },
      { key: 'textPrimary', value: colors.textPrimary, cat: 'Text' },
      { key: 'textSecondary', value: colors.textSecondary, cat: 'Text' },
      { key: 'textMuted', value: colors.textMuted, cat: 'Text' },
      { key: 'accentPrimary', value: colors.accentPrimary, cat: 'Accent' },
      { key: 'accentPurple', value: colors.accentPurple, cat: 'Accent' },
      { key: 'accentCyan', value: colors.accentCyan, cat: 'Accent' },
      { key: 'accentGreen', value: colors.accentGreen, cat: 'Accent' },
      { key: 'accentOrange', value: colors.accentOrange, cat: 'Accent' },
      { key: 'success', value: colors.success, cat: 'Status' },
      { key: 'warning', value: colors.warning, cat: 'Status' },
      { key: 'error', value: colors.error, cat: 'Status' },
      { key: 'info', value: colors.info, cat: 'Status' },
      { key: 'syntax.keyword', value: colors.syntax.keyword, cat: 'Syntax' },
      { key: 'syntax.string', value: colors.syntax.string, cat: 'Syntax' },
      { key: 'syntax.func', value: colors.syntax.func, cat: 'Syntax' },
      { key: 'syntax.variable', value: colors.syntax.variable, cat: 'Syntax' },
    ];
  }, []);

  // Typography tokens
  const typographyTokens = useMemo(() => {
    return [
      { key: 'xs', size: fontSizes.xs, lh: lineHeights.xs, sample: '11px Caption & Metadata' },
      { key: 'sm', size: fontSizes.sm, lh: lineHeights.sm, sample: '12px Compact Labels' },
      { key: 'md', size: fontSizes.md, lh: lineHeights.md, sample: '14px Base System & Body' },
      { key: 'lg', size: fontSizes.lg, lh: lineHeights.lg, sample: '16px Prominent Subtitles' },
      { key: 'xl', size: fontSizes.xl, lh: lineHeights.xl, sample: '18px Section Heading' },
      { key: 'xxl', size: fontSizes.xxl, lh: lineHeights.xxl, sample: '20px Card Header' },
      { key: '3xl', size: fontSizes['3xl'], lh: lineHeights['3xl'], sample: '24px Page Title' },
      { key: '4xl', size: fontSizes['4xl'], lh: lineHeights['4xl'], sample: '30px Hero Header' },
      { key: 'display', size: fontSizes.display, lh: lineHeights.display, sample: '36px Metric Display' },
    ];
  }, []);

  // Radius tokens
  const radiusTokens = useMemo(() => {
    return [
      { key: 'none', value: radius.none, px: '0px' },
      { key: 'xs', value: radius.xs, px: '2px' },
      { key: 'sm', value: radius.sm, px: '4px' },
      { key: 'md', value: radius.md, px: '8px' },
      { key: 'lg', value: radius.lg, px: '12px' },
      { key: 'xl', value: radius.xl, px: '16px' },
      { key: 'xxl', value: radius.xxl, px: '24px' },
      { key: 'full', value: radius.full, px: '9999px (Pill)' },
    ];
  }, []);

  // Shadows
  const shadowTokens = useMemo(() => {
    return [
      { key: 'none', desc: 'Flat no elevation' },
      { key: 'sm', desc: 'Subtle button / chip elevation (1px)' },
      { key: 'md', desc: 'Medium container elevation (2px)' },
      { key: 'card', desc: 'Xcode dark card surface (3px)' },
      { key: 'lg', desc: 'Floating action panel (4px)' },
      { key: 'elevated', desc: 'Elevated popover & dropdown (6px)' },
      { key: 'modal', desc: 'Dialog modal backdrop drop (10px)' },
      { key: 'glowPrimary', desc: 'Cyan/Blue accent glow #388bfd' },
      { key: 'glowSuccess', desc: 'Green compilation pass glow' },
      { key: 'glowError', desc: 'Red diagnostic error glow' },
    ];
  }, []);

  // Spacing
  const spacingTokens = useMemo(() => {
    return [
      { key: 'xs', val: spacing.xs },
      { key: 'sm', val: spacing.sm },
      { key: 'md', val: spacing.md },
      { key: 'lg', val: spacing.lg },
      { key: 'xl', val: spacing.xl },
      { key: 'xxl', val: spacing.xxl },
      { key: '3xl', val: spacing['3xl'] },
      { key: '4xl', val: spacing['4xl'] },
      { key: '5xl', val: spacing['5xl'] },
    ];
  }, []);

  // Filtered color tokens
  const filteredColors = useMemo(() => {
    const q = tokenSearchQuery.toLowerCase().trim();
    if (!q) return colorTokenList;
    return colorTokenList.filter(
      (c) =>
        c.key.toLowerCase().includes(q) ||
        c.value.toLowerCase().includes(q) ||
        c.cat.toLowerCase().includes(q)
    );
  }, [colorTokenList, tokenSearchQuery]);

  // Generated code for export modal
  const exportedCode = useMemo(() => {
    if (exportFormat === 'typescript') {
      return `/**
 * ARENA STUDIO Design System Tokens
 * Generated from DesignStudioScreen
 */

export const colors = {
  bgPrimary: '${colors.bgPrimary}',
  bgSecondary: '${colors.bgSecondary}',
  bgTertiary: '${colors.bgTertiary}',
  bgElevated: '${colors.bgElevated}',
  border: '${colors.border}',
  borderLight: '${colors.borderLight}',
  textPrimary: '${colors.textPrimary}',
  textSecondary: '${colors.textSecondary}',
  textMuted: '${colors.textMuted}',
  accentPrimary: '${colors.accentPrimary}',
  accentPurple: '${colors.accentPurple}',
  accentCyan: '${colors.accentCyan}',
  success: '${colors.success}',
  warning: '${colors.warning}',
  error: '${colors.error}',
  info: '${colors.info}',
} as const;

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, '3xl': 40, '4xl': 48, '5xl': 64,
} as const;

export const radius = {
  none: 0, xs: 2, sm: 4, md: 8, lg: 12, xl: 16, xxl: 24, full: 9999,
} as const;

export const typography = {
  fontSizes: { xs: 11, sm: 12, md: 14, lg: 16, xl: 18, xxl: 20, '3xl': 24, '4xl': 30, display: 36 },
  fontFamilies: { mono: 'Menlo', sans: 'System' },
} as const;
`;
    }

    if (exportFormat === 'json') {
      return JSON.stringify(
        {
          arenaTheme: {
            colors: {
              bgPrimary: colors.bgPrimary,
              bgSecondary: colors.bgSecondary,
              bgTertiary: colors.bgTertiary,
              bgElevated: colors.bgElevated,
              border: colors.border,
              borderLight: colors.borderLight,
              textPrimary: colors.textPrimary,
              textSecondary: colors.textSecondary,
              textMuted: colors.textMuted,
              accentPrimary: colors.accentPrimary,
              accentPurple: colors.accentPurple,
              accentCyan: colors.accentCyan,
              success: colors.success,
              warning: colors.warning,
              error: colors.error,
              info: colors.info,
            },
            spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
            radius: { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 },
            fontSizes: fontSizes,
          },
        },
        null,
        2
      );
    }

    // CSS variables
    return `:root {
  --color-bg-primary: ${colors.bgPrimary};
  --color-bg-secondary: ${colors.bgSecondary};
  --color-bg-tertiary: ${colors.bgTertiary};
  --color-bg-elevated: ${colors.bgElevated};
  --color-border: ${colors.border};
  --color-border-light: ${colors.borderLight};
  --color-text-primary: ${colors.textPrimary};
  --color-text-secondary: ${colors.textSecondary};
  --color-text-muted: ${colors.textMuted};
  --color-accent-primary: ${colors.accentPrimary};
  --color-accent-purple: ${colors.accentPurple};
  --color-accent-cyan: ${colors.accentCyan};
  --color-success: ${colors.success};
  --color-warning: ${colors.warning};
  --color-error: ${colors.error};
  --color-info: ${colors.info};
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
  --font-mono: 'Menlo', monospace;
  --font-sans: -apple-system, BlinkMacSystemFont, sans-serif;
}`;
  }, [exportFormat]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />

      {/* Top Navigation Bar (Xcode / Linear Aesthetic) */}
      <View style={styles.topNavbar}>
        <View style={styles.navbarLeft}>
          <View style={styles.breadcrumbRow}>
            <Text style={styles.breadcrumbRoot}>ARENA</Text>
            <Text style={styles.breadcrumbSlash}>/</Text>
            <Text style={styles.breadcrumbCurrent}>DESIGN STUDIO</Text>
          </View>
          <View style={styles.badgeRow}>
            <View style={styles.versionPill}>
              <View style={styles.liveGreenDot} />
              <Text style={styles.versionPillText}>v1.0 • TOKENS & PRIMITIVES</Text>
            </View>
          </View>
        </View>

        <View style={styles.navbarRight}>
          <TouchableOpacity
            style={styles.exportBtn}
            onPress={() => setExportModalVisible(true)}
          >
            <Ionicons name="code-slash" size={14} color="#f0f6fc" />
            <Text style={styles.exportBtnText}>Export Tokens</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Tabs Navigation Bar */}
      <View style={styles.tabBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarContent}
        >
          <TouchableOpacity
            style={[styles.mainTab, activeTab === 'tokens' && styles.mainTabActive]}
            onPress={() => setActiveTab('tokens')}
          >
            <Ionicons
              name="cube-outline"
              size={15}
              color={activeTab === 'tokens' ? '#388bfd' : '#8b949e'}
            />
            <Text
              style={[
                styles.mainTabText,
                activeTab === 'tokens' && styles.mainTabTextActive,
              ]}
            >
              Tokens Inspector
            </Text>
            <View style={styles.tabCountPill}>
              <Text style={styles.tabCountText}>42</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainTab, activeTab === 'palettes' && styles.mainTabActive]}
            onPress={() => setActiveTab('palettes')}
          >
            <Ionicons
              name="color-palette-outline"
              size={15}
              color={activeTab === 'palettes' ? '#388bfd' : '#8b949e'}
            />
            <Text
              style={[
                styles.mainTabText,
                activeTab === 'palettes' && styles.mainTabTextActive,
              ]}
            >
              Color Palettes
            </Text>
            <View style={styles.tabCountPill}>
              <Text style={styles.tabCountText}>WCAG</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainTab, activeTab === 'components' && styles.mainTabActive]}
            onPress={() => setActiveTab('components')}
          >
            <Ionicons
              name="layers-outline"
              size={15}
              color={activeTab === 'components' ? '#388bfd' : '#8b949e'}
            />
            <Text
              style={[
                styles.mainTabText,
                activeTab === 'components' && styles.mainTabTextActive,
              ]}
            >
              UI Kit Components
            </Text>
            <View style={styles.tabCountPill}>
              <Text style={styles.tabCountText}>8</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainTab, activeTab === 'assets' && styles.mainTabActive]}
            onPress={() => setActiveTab('assets')}
          >
            <Ionicons
              name="folder-open-outline"
              size={15}
              color={activeTab === 'assets' ? '#388bfd' : '#8b949e'}
            />
            <Text
              style={[
                styles.mainTabText,
                activeTab === 'assets' && styles.mainTabTextActive,
              ]}
            >
              Asset Library
            </Text>
            <View style={styles.tabCountPill}>
              <Text style={styles.tabCountText}>100+</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Copied Feedback Toast Banner */}
      {copiedToast && (
        <View style={styles.toastBanner}>
          <Ionicons name="checkmark-circle" size={15} color="#3fb950" />
          <Text style={styles.toastBannerText}>{copiedToast}</Text>
        </View>
      )}

      {/* TAB 1: TOKENS INSPECTOR */}
      {activeTab === 'tokens' && (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          {/* Search & Sub-Filter Bar */}
          <View style={styles.tokenSearchCard}>
            <View style={styles.searchRow}>
              <Ionicons name="search" size={16} color="#8b949e" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Filter design tokens (e.g. bgPrimary, accent, font, radius)..."
                placeholderTextColor="#484f58"
                value={tokenSearchQuery}
                onChangeText={setTokenSearchQuery}
              />
              {tokenSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setTokenSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color="#8b949e" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tokenFilterScroll}
              contentContainerStyle={styles.tokenFilterContent}
            >
              {[
                { id: 'all', label: 'All Tokens' },
                { id: 'colors', label: 'Colors' },
                { id: 'typography', label: 'Typography' },
                { id: 'radiuses', label: 'Border Radiuses' },
                { id: 'shadows', label: 'Shadows & Glows' },
                { id: 'spacing', label: '4px Grid Spacing' },
              ].map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.tokenFilterPill,
                    tokenCategory === cat.id && styles.tokenFilterPillActive,
                  ]}
                  onPress={() => setTokenCategory(cat.id as any)}
                >
                  <Text
                    style={[
                      styles.tokenFilterPillText,
                      tokenCategory === cat.id && styles.tokenFilterPillTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* 1.1 COLORS TOKENS */}
          {(tokenCategory === 'all' || tokenCategory === 'colors') && (
            <View style={styles.tokenSectionCard}>
              <View style={styles.tokenSectionHeader}>
                <View style={styles.tokenSectionTitleRow}>
                  <Ionicons name="color-palette-outline" size={16} color="#388bfd" />
                  <Text style={styles.tokenSectionTitle}>COLORS (colors.ts)</Text>
                </View>
                <Text style={styles.tokenSectionCount}>{filteredColors.length} tokens</Text>
              </View>

              <View style={styles.colorTokensGrid}>
                {filteredColors.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={styles.colorTokenRow}
                    onPress={() => showToast(`Copied ${item.key}: ${item.value}`)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.colorTokenSwatch, { backgroundColor: item.value }]} />
                    <View style={styles.colorTokenMeta}>
                      <Text style={styles.colorTokenKey}>{item.key}</Text>
                      <Text style={styles.colorTokenVal}>{item.value}</Text>
                    </View>
                    <View style={styles.colorTokenCategoryPill}>
                      <Text style={styles.colorTokenCategoryText}>{item.cat}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* 1.2 TYPOGRAPHY TOKENS */}
          {(tokenCategory === 'all' || tokenCategory === 'typography') && (
            <View style={styles.tokenSectionCard}>
              <View style={styles.tokenSectionHeader}>
                <View style={styles.tokenSectionTitleRow}>
                  <Ionicons name="text-outline" size={16} color="#8957e5" />
                  <Text style={styles.tokenSectionTitle}>TYPOGRAPHY SCALE (typography.ts)</Text>
                </View>
                <Text style={styles.tokenSectionCount}>Menlo / System</Text>
              </View>

              <View style={styles.typographyList}>
                {typographyTokens.map((t) => (
                  <View key={t.key} style={styles.typographyItem}>
                    <View style={styles.typographyMetaRow}>
                      <Text style={styles.typographyTokenName}>fontSizes.{t.key}</Text>
                      <Text style={styles.typographySizeBadge}>
                        {t.size}px / lh: {t.lh}px
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.typographySampleText,
                        { fontSize: t.size, lineHeight: t.lh },
                      ]}
                      numberOfLines={1}
                    >
                      {t.sample}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 1.3 RADIUS TOKENS */}
          {(tokenCategory === 'all' || tokenCategory === 'radiuses') && (
            <View style={styles.tokenSectionCard}>
              <View style={styles.tokenSectionHeader}>
                <View style={styles.tokenSectionTitleRow}>
                  <Ionicons name="square-outline" size={16} color="#39c5cf" />
                  <Text style={styles.tokenSectionTitle}>BORDER RADIUSES (spacing.ts)</Text>
                </View>
                <Text style={styles.tokenSectionCount}>8 tokens</Text>
              </View>

              <View style={styles.radiusGrid}>
                {radiusTokens.map((r) => (
                  <View key={r.key} style={styles.radiusCard}>
                    <View
                      style={[
                        styles.radiusBoxPreview,
                        {
                          borderRadius: typeof r.value === 'number' ? r.value : 16,
                        },
                      ]}
                    />
                    <Text style={styles.radiusKeyText}>radius.{r.key}</Text>
                    <Text style={styles.radiusPxText}>{r.px}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 1.4 SHADOWS & ELEVATION */}
          {(tokenCategory === 'all' || tokenCategory === 'shadows') && (
            <View style={styles.tokenSectionCard}>
              <View style={styles.tokenSectionHeader}>
                <View style={styles.tokenSectionTitleRow}>
                  <Ionicons name="copy-outline" size={16} color="#f0883e" />
                  <Text style={styles.tokenSectionTitle}>SHADOW ELEVATIONS (spacing.ts)</Text>
                </View>
                <Text style={styles.tokenSectionCount}>Dark Ambient</Text>
              </View>

              <View style={styles.shadowsList}>
                {shadowTokens.map((s) => (
                  <View key={s.key} style={styles.shadowItemRow}>
                    <View style={styles.shadowPreviewBox}>
                      <Text style={styles.shadowPreviewBoxText}>{s.key}</Text>
                    </View>
                    <View style={styles.shadowMeta}>
                      <Text style={styles.shadowKey}>shadows.{s.key}</Text>
                      <Text style={styles.shadowDesc}>{s.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 1.5 4PX GRID SPACING */}
          {(tokenCategory === 'all' || tokenCategory === 'spacing') && (
            <View style={styles.tokenSectionCard}>
              <View style={styles.tokenSectionHeader}>
                <View style={styles.tokenSectionTitleRow}>
                  <Ionicons name="grid-outline" size={16} color="#3fb950" />
                  <Text style={styles.tokenSectionTitle}>SPACING (4PX BASELINE GRID)</Text>
                </View>
                <Text style={styles.tokenSectionCount}>9 scale steps</Text>
              </View>

              <View style={styles.spacingScaleContainer}>
                {spacingTokens.map((sp) => (
                  <View key={sp.key} style={styles.spacingBarRow}>
                    <Text style={styles.spacingBarLabel}>spacing.{sp.key}</Text>
                    <View style={styles.spacingBarTrack}>
                      <View style={[styles.spacingBarFill, { width: sp.val * 3 }]} />
                    </View>
                    <Text style={styles.spacingBarVal}>{sp.val}px</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* TAB 2: COLOR PALETTES */}
      {activeTab === 'palettes' && <ColorPalettePicker />}

      {/* TAB 3: UI KIT COMPONENTS */}
      {activeTab === 'components' && <ComponentGallery />}

      {/* TAB 4: ASSET LIBRARY */}
      {activeTab === 'assets' && <AssetManager />}

      {/* EXPORT TOKENS MODAL */}
      <Modal
        visible={exportModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setExportModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="code-slash" size={18} color="#388bfd" />
                <Text style={styles.modalTitle}>Export Design Tokens</Text>
              </View>
              <TouchableOpacity
                onPress={() => setExportModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#8b949e" />
              </TouchableOpacity>
            </View>

            {/* Format Selector Pills */}
            <View style={styles.formatSelectorRow}>
              {(['typescript', 'json', 'css'] as const).map((fmt) => (
                <TouchableOpacity
                  key={fmt}
                  style={[
                    styles.formatPill,
                    exportFormat === fmt && styles.formatPillActive,
                  ]}
                  onPress={() => setExportFormat(fmt)}
                >
                  <Text
                    style={[
                      styles.formatPillText,
                      exportFormat === fmt && styles.formatPillTextActive,
                    ]}
                  >
                    {fmt.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Code Output Box */}
            <ScrollView style={styles.codeOutputBox} showsVerticalScrollIndicator>
              <Text style={styles.codeOutputText}>{exportedCode}</Text>
            </ScrollView>

            {/* Modal Footer Actions */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.copyExportBtn}
                onPress={() => {
                  showToast(`Copied ${exportFormat.toUpperCase()} tokens to clipboard!`);
                  setExportModalVisible(false);
                }}
              >
                <Ionicons name="copy-outline" size={16} color="#ffffff" />
                <Text style={styles.copyExportBtnText}>Copy to Clipboard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeModalBtn}
                onPress={() => setExportModalVisible(false)}
              >
                <Text style={styles.closeModalBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  topNavbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navbarLeft: {
    flexDirection: 'column',
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  breadcrumbRoot: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.8,
  },
  breadcrumbSlash: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
  },
  breadcrumbCurrent: {
    color: colors.textPrimary,
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.mono,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.8,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  versionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  liveGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3fb950',
  },
  versionPillText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontFamily: fontFamilies.mono,
  },
  navbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  exportBtnText: {
    color: colors.textPrimary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
  tabBarContainer: {
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBarContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    gap: 8,
  },
  mainTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  mainTabActive: {
    backgroundColor: 'rgba(56, 139, 253, 0.15)',
    borderColor: '#388bfd',
  },
  mainTabText: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
  },
  mainTabTextActive: {
    color: '#388bfd',
    fontWeight: fontWeights.bold,
  },
  tabCountPill: {
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.xs,
  },
  tabCountText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontFamily: fontFamilies.mono,
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  toastBannerText: {
    color: '#f0f6fc',
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.mono,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: 60,
  },
  tokenSearchCard: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    paddingVertical: 8,
  },
  tokenFilterScroll: {
    flexDirection: 'row',
  },
  tokenFilterContent: {
    gap: 6,
  },
  tokenFilterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tokenFilterPillActive: {
    backgroundColor: colors.accentPrimary,
    borderColor: colors.accentPrimary,
  },
  tokenFilterPillText: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  tokenFilterPillTextActive: {
    color: '#ffffff',
    fontWeight: fontWeights.bold,
  },
  tokenSectionCard: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  tokenSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  tokenSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tokenSectionTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.mono,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.5,
  },
  tokenSectionCount: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.mono,
  },
  colorTokensGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorTokenRow: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    padding: 8,
    gap: 8,
  },
  colorTokenSwatch: {
    width: 24,
    height: 24,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  colorTokenMeta: {
    flex: 1,
  },
  colorTokenKey: {
    color: colors.textPrimary,
    fontSize: 11,
    fontFamily: fontFamilies.mono,
    fontWeight: '600',
  },
  colorTokenVal: {
    color: colors.textSecondary,
    fontSize: 10,
    fontFamily: fontFamilies.mono,
  },
  colorTokenCategoryPill: {
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  colorTokenCategoryText: {
    color: colors.textMuted,
    fontSize: 8,
  },
  typographyList: {
    gap: spacing.sm,
  },
  typographyItem: {
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    padding: 10,
  },
  typographyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  typographyTokenName: {
    color: '#39c5cf',
    fontSize: 11,
    fontFamily: fontFamilies.mono,
    fontWeight: '600',
  },
  typographySizeBadge: {
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: fontFamilies.mono,
  },
  typographySampleText: {
    color: colors.textPrimary,
    fontFamily: fontFamilies.sans,
  },
  radiusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  radiusCard: {
    width: '23%',
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 8,
    alignItems: 'center',
  },
  radiusBoxPreview: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(56, 139, 253, 0.25)',
    borderWidth: 1.5,
    borderColor: '#388bfd',
    marginBottom: 6,
  },
  radiusKeyText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontFamily: fontFamilies.mono,
    fontWeight: '600',
  },
  radiusPxText: {
    color: colors.textMuted,
    fontSize: 9,
    fontFamily: fontFamilies.mono,
  },
  shadowsList: {
    gap: spacing.sm,
  },
  shadowItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    padding: 10,
  },
  shadowPreviewBox: {
    width: 72,
    height: 36,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  shadowPreviewBoxText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontFamily: fontFamilies.mono,
  },
  shadowMeta: {
    flex: 1,
  },
  shadowKey: {
    color: colors.textPrimary,
    fontSize: 11,
    fontFamily: fontFamilies.mono,
    fontWeight: '600',
  },
  shadowDesc: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  spacingScaleContainer: {
    gap: 8,
  },
  spacingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  spacingBarLabel: {
    width: 90,
    color: colors.textSecondary,
    fontSize: 10,
    fontFamily: fontFamilies.mono,
  },
  spacingBarTrack: {
    flex: 1,
    height: 12,
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.xs,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  spacingBarFill: {
    height: '100%',
    backgroundColor: '#3fb950',
    borderRadius: radius.xs,
  },
  spacingBarVal: {
    width: 40,
    color: colors.textPrimary,
    fontSize: 10,
    fontFamily: fontFamilies.mono,
    textAlign: 'right',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
  },
  modalCloseBtn: {
    padding: 4,
  },
  formatSelectorRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.md,
  },
  formatPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formatPillActive: {
    backgroundColor: colors.accentPrimary,
    borderColor: colors.accentPrimary,
  },
  formatPillText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: fontFamilies.mono,
  },
  formatPillTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  codeOutputBox: {
    maxHeight: 280,
    backgroundColor: '#0a0c10',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: spacing.md,
  },
  codeOutputText: {
    color: '#e6edf3',
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  copyExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentPrimary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  copyExportBtnText: {
    color: '#ffffff',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
  closeModalBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.bgTertiary,
  },
  closeModalBtnText: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
  },
});
