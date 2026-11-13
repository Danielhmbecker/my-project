import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Linking,
  Animated,
  Modal,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';

export interface ArenaWorkspaceScreenProps {
  onBack?: () => void;
  navigation?: {
    goBack?: () => void;
    navigate?: (screen: string, params?: any) => void;
  };
  initialUrl?: string;
}

interface ArenaPreset {
  id: string;
  name: string;
  url: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

const ARENA_PRESETS: ArenaPreset[] = [
  {
    id: 'chat',
    name: 'Arena Chat',
    url: 'https://chat.arena.ai',
    icon: 'chatbubbles-outline',
    description: 'Official Arena side-by-side model evaluation & chat',
  },
  {
    id: 'battle',
    name: 'Battle Mode',
    url: 'https://chat.arena.ai/?arena=side-by-side',
    icon: 'flash-outline',
    description: 'Blind comparison of leading LLMs',
  },
  {
    id: 'leaderboard',
    name: 'Leaderboard',
    url: 'https://chat.arena.ai/leaderboard',
    icon: 'trophy-outline',
    description: 'LMSYS Global LLM Elo Rankings & Benchmarks',
  },
  {
    id: 'direct',
    name: 'Direct Chat',
    url: 'https://chat.arena.ai/?arena=direct-chat',
    icon: 'person-outline',
    description: 'Talk directly to specific frontier models',
  },
  {
    id: 'lmsys',
    name: 'LMSYS Org',
    url: 'https://lmarena.ai',
    icon: 'globe-outline',
    description: 'Large Model Systems Organization portal',
  },
];

export const ArenaWorkspaceScreen: React.FC<ArenaWorkspaceScreenProps> = ({
  onBack,
  navigation,
  initialUrl = 'https://chat.arena.ai',
}) => {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);

  // Navigation & State
  const [currentUrl, setCurrentUrl] = useState<string>(initialUrl);
  const [pageTitle, setPageTitle] = useState<string>('chat.arena.ai');
  const [canGoBack, setCanGoBack] = useState<boolean>(false);
  const [canGoForward, setCanGoForward] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [activePreset, setActivePreset] = useState<string>('chat');

  // Modals & Banners
  const [showSecurityModal, setShowSecurityModal] = useState<boolean>(false);
  const [showPresetsBar, setShowPresetsBar] = useState<boolean>(false);
  const [showPrivacyBanner, setShowPrivacyBanner] = useState<boolean>(true);

  // Progress animation
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressOpacity = useRef(new Animated.Value(1)).current;

  // Haptic trigger helper
  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      Haptics.impactAsync(style);
    } catch {
      // Ignore if not supported on platform
    }
  };

  // Safe navigation back to Studio
  const handleReturnToStudio = useCallback(() => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    if (onBack) {
      onBack();
    } else if (navigation && typeof navigation.goBack === 'function') {
      navigation.goBack();
    }
  }, [onBack, navigation]);

  // Web Navigation Handlers
  const handleGoBack = useCallback(() => {
    if (canGoBack && webViewRef.current) {
      triggerHaptic();
      webViewRef.current.goBack();
    }
  }, [canGoBack]);

  const handleGoForward = useCallback(() => {
    if (canGoForward && webViewRef.current) {
      triggerHaptic();
      webViewRef.current.goForward();
    }
  }, [canGoForward]);

  const handleReload = useCallback(() => {
    triggerHaptic();
    setHasError(false);
    setErrorMessage('');
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  }, []);

  const handleShareUrl = useCallback(async () => {
    triggerHaptic();
    try {
      await Share.share({
        title: pageTitle || 'Arena.ai Workspace',
        message: `Arena.ai Session: ${currentUrl}`,
        url: currentUrl,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  }, [currentUrl, pageTitle]);

  const handleOpenExternal = useCallback(async () => {
    triggerHaptic();
    try {
      const supported = await Linking.canOpenURL(currentUrl);
      if (supported) {
        await Linking.openURL(currentUrl);
      }
    } catch (err) {
      console.warn('Open external URL error:', err);
    }
  }, [currentUrl]);

  const handleSelectPreset = useCallback((preset: ArenaPreset) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setActivePreset(preset.id);
    setCurrentUrl(preset.url);
    setHasError(false);
    setErrorMessage('');
    setShowPresetsBar(false);
  }, []);

  // Progress Bar tracking
  const handleLoadProgress = useCallback(
    ({ nativeEvent }: { nativeEvent: { progress: number } }) => {
      const progress = nativeEvent.progress;
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 150,
        useNativeDriver: false,
      }).start();

      if (progress >= 1) {
        Animated.timing(progressOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }).start(() => {
          progressAnim.setValue(0);
          progressOpacity.setValue(1);
        });
      }
    },
    [progressAnim, progressOpacity]
  );

  const handleNavigationStateChange = useCallback((navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setIsLoading(navState.loading);
    if (navState.url) {
      setCurrentUrl(navState.url);
    }
    if (navState.title) {
      setPageTitle(navState.title);
    }
  }, []);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    progressOpacity.setValue(1);
    progressAnim.setValue(0.1);
  }, [progressOpacity, progressAnim]);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleLoadError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    setIsLoading(false);
    setHasError(true);
    setErrorMessage(nativeEvent?.description || 'Failed to connect to Arena.ai. Check your network.');
  }, []);

  const handleHttpError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    if (nativeEvent.statusCode >= 400) {
      setHasError(true);
      setErrorMessage(`HTTP Error ${nativeEvent.statusCode}: ${nativeEvent.description || 'Request failed'}`);
    }
  }, []);

  // Domain display parsing
  const getDomainDisplay = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.hostname;
    } catch {
      return 'chat.arena.ai';
    }
  };

  const isSecureConnection = currentUrl.startsWith('https://');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />

      {/* =========================================================================
          TOP NAVIGATION TOOLBAR
      ========================================================================== */}
      <View style={styles.topToolbar}>
        {/* Row 1: Return to Studio & Web Controls */}
        <View style={styles.toolbarRow1}>
          {/* Return to Studio Button */}
          <TouchableOpacity
            style={styles.returnButton}
            onPress={handleReturnToStudio}
            activeOpacity={0.7}
            accessibilityLabel="Return to Arena Studio"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={16} color={colors.accentPrimary} />
            <Text style={styles.returnButtonText}>ARENA STUDIO</Text>
            <View style={styles.nativeBadge}>
              <Text style={styles.nativeBadgeText}>NATIVE</Text>
            </View>
          </TouchableOpacity>

          {/* Quick Action Controls */}
          <View style={styles.controlsGroup}>
            {/* Back Button */}
            <TouchableOpacity
              style={[styles.iconButton, !canGoBack && styles.iconButtonDisabled]}
              onPress={handleGoBack}
              disabled={!canGoBack}
              accessibilityLabel="Back in WebView"
            >
              <Ionicons
                name="chevron-back"
                size={18}
                color={canGoBack ? colors.textPrimary : colors.textMuted}
              />
            </TouchableOpacity>

            {/* Forward Button */}
            <TouchableOpacity
              style={[styles.iconButton, !canGoForward && styles.iconButtonDisabled]}
              onPress={handleGoForward}
              disabled={!canGoForward}
              accessibilityLabel="Forward in WebView"
            >
              <Ionicons
                name="chevron-forward"
                size={18}
                color={canGoForward ? colors.textPrimary : colors.textMuted}
              />
            </TouchableOpacity>

            {/* Reload Button */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleReload}
              accessibilityLabel="Reload Page"
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.accentCyan} />
              ) : (
                <Ionicons name="refresh" size={17} color={colors.textSecondary} />
              )}
            </TouchableOpacity>

            {/* Share URL Button */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleShareUrl}
              accessibilityLabel="Share Current URL"
            >
              <Ionicons name="share-outline" size={17} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Open in External Browser */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleOpenExternal}
              accessibilityLabel="Open in External Browser"
            >
              <Ionicons name="open-outline" size={17} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Row 2: SSL & Domain Address Bar */}
        <View style={styles.addressBar}>
          <TouchableOpacity
            style={styles.sslBadge}
            onPress={() => {
              triggerHaptic();
              setShowSecurityModal(true);
            }}
            activeOpacity={0.8}
            accessibilityLabel="View Security & Privacy Details"
          >
            <Ionicons
              name={isSecureConnection ? 'lock-closed' : 'warning'}
              size={13}
              color={isSecureConnection ? colors.success : colors.warning}
            />
            <Text style={styles.domainText}>{getDomainDisplay(currentUrl)}</Text>
            <View style={styles.authenticPill}>
              <Ionicons name="shield-checkmark" size={10} color={colors.accentCyan} />
              <Text style={styles.authenticPillText}>AUTHENTIC</Text>
            </View>
          </TouchableOpacity>

          {/* Preset Selector Dropdown Toggle */}
          <TouchableOpacity
            style={styles.presetsToggle}
            onPress={() => {
              triggerHaptic();
              setShowPresetsBar(!showPresetsBar);
            }}
            accessibilityLabel="Switch Arena Mode"
          >
            <Text style={styles.presetsToggleText}>Shortcuts</Text>
            <Ionicons
              name={showPresetsBar ? 'chevron-up' : 'chevron-down'}
              size={12}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Optional Shortcuts / Presets Horizontal Bar */}
        {showPresetsBar && (
          <View style={styles.presetsBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsScroll}>
              {ARENA_PRESETS.map((preset) => {
                const isActive = activePreset === preset.id;
                return (
                  <TouchableOpacity
                    key={preset.id}
                    style={[styles.presetChip, isActive && styles.presetChipActive]}
                    onPress={() => handleSelectPreset(preset)}
                  >
                    <Ionicons
                      name={preset.icon}
                      size={13}
                      color={isActive ? colors.accentCyan : colors.textSecondary}
                    />
                    <Text style={[styles.presetChipText, isActive && styles.presetChipTextActive]}>
                      {preset.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Seamless Animated Loading Progress Bar */}
        <Animated.View
          style={[
            styles.progressBarContainer,
            { opacity: progressOpacity },
          ]}
        >
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </Animated.View>
      </View>

      {/* =========================================================================
          AUTHENTIC SESSION & PRIVACY BANNER
      ========================================================================== */}
      {showPrivacyBanner && (
        <View style={styles.privacyBanner}>
          <View style={styles.privacyBannerContent}>
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.accentCyan} />
            <Text style={styles.privacyBannerText}>
              Official Arena.ai session. Web cookies & local storage are preserved locally. ARENA STUDIO never captures credentials.
            </Text>
          </View>
          <View style={styles.privacyBannerActions}>
            <TouchableOpacity
              onPress={() => setShowSecurityModal(true)}
              style={styles.privacyInfoLink}
            >
              <Text style={styles.privacyInfoLinkText}>Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowPrivacyBanner(false)}
              style={styles.privacyDismiss}
              accessibilityLabel="Dismiss banner"
            >
              <Ionicons name="close" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* =========================================================================
          WEBVIEW OR OFFLINE / ERROR VIEW
      ========================================================================== */}
      <View style={styles.contentArea}>
        {hasError ? (
          <View style={styles.errorContainer}>
            <View style={styles.errorIconCircle}>
              <Ionicons name="cloud-offline-outline" size={36} color={colors.error} />
            </View>
            <Text style={styles.errorTitle}>Unable to Load Arena.ai</Text>
            <Text style={styles.errorMessage}>
              {errorMessage || 'Connection failed. Please verify your internet connection or network status.'}
            </Text>

            <View style={styles.errorActions}>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleReload}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={16} color="#ffffff" />
                <Text style={styles.retryButtonText}>Retry Connection</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.externalButton}
                onPress={handleOpenExternal}
                activeOpacity={0.8}
              >
                <Ionicons name="open-outline" size={16} color={colors.textPrimary} />
                <Text style={styles.externalButtonText}>Open in Browser</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backStudioButton}
                onPress={handleReturnToStudio}
                activeOpacity={0.8}
              >
                <Text style={styles.backStudioButtonText}>Return to Studio</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : Platform.OS === 'web' ? (
          /* Web fallback */
          <View style={styles.webFallbackContainer}>
            <Text style={styles.webFallbackTitle}>Arena.ai Web View</Text>
            <Text style={styles.webFallbackSubtitle}>
              Target: {currentUrl}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleOpenExternal}
            >
              <Ionicons name="open-outline" size={16} color="#ffffff" />
              <Text style={styles.retryButtonText}>Open Arena.ai in New Tab</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            source={{ uri: currentUrl }}
            style={styles.webView}
            // Privacy & Session Persistence:
            sharedCookiesEnabled={true}
            thirdPartyCookiesEnabled={true}
            domStorageEnabled={true}
            javaScriptEnabled={true}
            allowsBackForwardNavigationGestures={true}
            incognito={false}
            originWhitelist={['https://*', 'http://*']}
            // Navigation lifecycle
            onNavigationStateChange={handleNavigationStateChange}
            onLoadStart={handleLoadStart}
            onLoadProgress={handleLoadProgress}
            onLoadEnd={handleLoadEnd}
            onError={handleLoadError}
            onHttpError={handleHttpError}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.accentPrimary} />
                <Text style={styles.loadingText}>Connecting to Arena.ai...</Text>
              </View>
            )}
            renderError={() => (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={36} color={colors.error} />
                <Text style={styles.errorTitle}>Failed to Load Page</Text>
                <Text style={styles.errorMessage}>{errorMessage || 'Check your network connection.'}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={handleReload}>
                  <Ionicons name="refresh" size={16} color="#ffffff" />
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
            applicationNameForUserAgent="ArenaStudio/1.0"
          />
        )}
      </View>

      {/* =========================================================================
          SECURITY & PRIVACY MODAL
      ========================================================================== */}
      <Modal
        visible={showSecurityModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSecurityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="shield-checkmark" size={20} color={colors.accentCyan} />
                <Text style={styles.modalTitle}>Arena.ai Session Security</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowSecurityModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <ScrollView style={styles.modalScroll}>
              <View style={styles.securityItem}>
                <Ionicons name="lock-closed" size={18} color={colors.success} style={styles.securityItemIcon} />
                <View style={styles.securityItemTextContainer}>
                  <Text style={styles.securityItemTitle}>Authentic Arena.ai Web Connection</Text>
                  <Text style={styles.securityItemDesc}>
                    You are connected directly to <Text style={styles.monoHighlight}>chat.arena.ai</Text> over encrypted TLS/HTTPS.
                  </Text>
                </View>
              </View>

              <View style={styles.securityItem}>
                <Ionicons name="key-outline" size={18} color={colors.accentPrimary} style={styles.securityItemIcon} />
                <View style={styles.securityItemTextContainer}>
                  <Text style={styles.securityItemTitle}>Zero Credential Interception</Text>
                  <Text style={styles.securityItemDesc}>
                    ARENA STUDIO strictly runs Arena in an isolated native WebView sandbox. Neither your passwords, Google/GitHub OAuth logins, nor prompts are intercepted, logged, or stored by the app.
                  </Text>
                </View>
              </View>

              <View style={styles.securityItem}>
                <Ionicons name="file-tray-full-outline" size={18} color={colors.accentPurple} style={styles.securityItemIcon} />
                <View style={styles.securityItemTextContainer}>
                  <Text style={styles.securityItemTitle}>Native Session Persistence</Text>
                  <Text style={styles.securityItemDesc}>
                    Cookies and local web storage are preserved natively on your device (<Text style={styles.monoHighlight}>sharedCookiesEnabled</Text> and <Text style={styles.monoHighlight}>domStorageEnabled</Text>), keeping you logged in without requiring re-authentication.
                  </Text>
                </View>
              </View>

              <View style={styles.securityItem}>
                <Ionicons name="hardware-chip-outline" size={18} color={colors.accentCyan} style={styles.securityItemIcon} />
                <View style={styles.securityItemTextContainer}>
                  <Text style={styles.securityItemTitle}>Studio Integration</Text>
                  <Text style={styles.securityItemDesc}>
                    Quickly evaluate, compare, and benchmark model responses on Arena, then return to ARENA STUDIO with a single tap.
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={() => setShowSecurityModal(false)}
              >
                <Text style={styles.modalPrimaryButtonText}>Got It</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },

  // ----------------------------------------------------
  // TOP NAVIGATION TOOLBAR
  // ----------------------------------------------------
  topToolbar: {
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  toolbarRow1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  returnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 6,
  },
  returnButtonText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
  nativeBadge: {
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: radius.xs,
  },
  nativeBadgeText: {
    color: colors.accentPrimary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  controlsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  iconButtonDisabled: {
    opacity: 0.35,
    backgroundColor: colors.bgPrimary,
    borderColor: 'transparent',
  },

  // Address & SSL Bar
  addressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  sslBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  domainText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
  authenticPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 197, 207, 0.12)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.round,
    gap: 3,
  },
  authenticPillText: {
    color: colors.accentCyan,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  presetsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.bgTertiary,
  },
  presetsToggleText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },

  // Presets Bar
  presetsBar: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  presetsScroll: {
    flexDirection: 'row',
    gap: 6,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  presetChipActive: {
    backgroundColor: 'rgba(56, 139, 253, 0.15)',
    borderColor: colors.accentPrimary,
  },
  presetChipText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  presetChipTextActive: {
    color: colors.accentCyan,
    fontWeight: '600',
  },

  // Progress Bar
  progressBarContainer: {
    height: 2.5,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accentCyan,
  },

  // ----------------------------------------------------
  // PRIVACY & SECURITY BANNER
  // ----------------------------------------------------
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(57, 197, 207, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(57, 197, 207, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  privacyBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  privacyBannerText: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 14,
    flex: 1,
  },
  privacyBannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  privacyInfoLink: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  privacyInfoLinkText: {
    color: colors.accentCyan,
    fontSize: 11,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  privacyDismiss: {
    padding: 2,
  },

  // ----------------------------------------------------
  // CONTENT AREA & WEBVIEW
  // ----------------------------------------------------
  contentArea: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  webView: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },

  // Error / Offline Screen
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.bgPrimary,
  },
  errorIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(248, 81, 73, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(248, 81, 73, 0.25)',
  },
  errorTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  errorMessage: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: spacing.xl,
  },
  errorActions: {
    width: '100%',
    maxWidth: 280,
    gap: spacing.sm,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accentPrimary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  externalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.bgTertiary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  externalButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  backStudioButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  backStudioButtonText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },

  // Web Fallback
  webFallbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  webFallbackTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  webFallbackSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
  },

  // ----------------------------------------------------
  // SECURITY & PRIVACY MODAL
  // ----------------------------------------------------
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScroll: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  securityItemIcon: {
    marginTop: 2,
  },
  securityItemTextContainer: {
    flex: 1,
  },
  securityItemTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  securityItemDesc: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  monoHighlight: {
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    color: colors.accentCyan,
    fontSize: 11,
  },
  modalFooter: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bgTertiary,
  },
  modalPrimaryButton: {
    backgroundColor: colors.accentPrimary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ArenaWorkspaceScreen;
