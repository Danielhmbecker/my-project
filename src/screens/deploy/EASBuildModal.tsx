import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  Platform as RNPlatform,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius, typography } from '../../theme';
import { BuildPlatform, BuildTarget } from '../../models';

export interface EASBuildConfig {
  platform: BuildPlatform;
  target: BuildTarget;
  projectId: string;
  branch: string;
  clearCache: boolean;
  autoSubmit: boolean;
  version: string;
  buildNumber: string;
}

export interface EASBuildModalProps {
  visible: boolean;
  onClose: () => void;
  onStartBuild: (config: EASBuildConfig) => void;
  initialPlatform?: BuildPlatform;
  initialTarget?: BuildTarget;
  projectId?: string;
  currentBranch?: string;
}

export const EASBuildModal: React.FC<EASBuildModalProps> = ({
  visible,
  onClose,
  onStartBuild,
  initialPlatform = 'ios',
  initialTarget = 'preview',
  projectId = 'arena-studio-mobile',
  currentBranch = 'main',
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<BuildPlatform>(initialPlatform);
  const [selectedTarget, setSelectedTarget] = useState<BuildTarget>(initialTarget);
  const [customBranch, setCustomBranch] = useState(currentBranch);
  const [appVersion, setAppVersion] = useState('1.2.0');
  const [buildNumber, setBuildNumber] = useState('42');
  const [clearCache, setClearCache] = useState(false);
  const [autoSubmit, setAutoSubmit] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleSelectPlatform = (platform: BuildPlatform) => {
    try {
      Haptics.selectionAsync();
    } catch (_) {}
    setSelectedPlatform(platform);
  };

  const handleSelectTarget = (target: BuildTarget) => {
    try {
      Haptics.selectionAsync();
    } catch (_) {}
    setSelectedTarget(target);
  };

  const handleTriggerConfirmation = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_) {}
    setShowConfirmDialog(true);
  };

  const handleConfirmAndLaunch = () => {
    setShowConfirmDialog(false);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (_) {}
    onStartBuild({
      platform: selectedPlatform,
      target: selectedTarget,
      projectId,
      branch: customBranch || 'main',
      clearCache,
      autoSubmit,
      version: appVersion,
      buildNumber,
    });
    onClose();
  };

  const getPlatformIcon = (platform: BuildPlatform) => {
    switch (platform) {
      case 'ios':
        return <Ionicons name="logo-apple" size={20} color={selectedPlatform === 'ios' ? colors.accentPrimary : colors.textSecondary} />;
      case 'android':
        return <Ionicons name="logo-android" size={20} color={selectedPlatform === 'android' ? colors.accentGreen : colors.textSecondary} />;
      case 'web':
        return <Feather name="globe" size={20} color={selectedPlatform === 'web' ? colors.accentCyan : colors.textSecondary} />;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={() => {
        if (showConfirmDialog) {
          setShowConfirmDialog(false);
        } else {
          onClose();
        }
      }}
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconContainer}>
                <MaterialCommunityIcons name="cloud-sync" size={22} color={colors.accentPrimary} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Configure EAS Cloud Build</Text>
                <Text style={styles.headerSubtitle}>Expo Application Services • Remote Runner</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Platform Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>TARGET PLATFORM</Text>
              <View style={styles.platformRow}>
                {(['ios', 'android', 'web'] as BuildPlatform[]).map((plat) => {
                  const isSelected = selectedPlatform === plat;
                  return (
                    <TouchableOpacity
                      key={plat}
                      style={[
                        styles.platformCard,
                        isSelected && styles.platformCardActive,
                      ]}
                      onPress={() => handleSelectPlatform(plat)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.platformIconBox}>
                        {getPlatformIcon(plat)}
                      </View>
                      <Text style={[styles.platformName, isSelected && styles.platformNameActive]}>
                        {plat === 'ios' ? 'iOS' : plat === 'android' ? 'Android' : 'Web'}
                      </Text>
                      <Text style={styles.platformArtifact}>
                        {plat === 'ios' ? '.ipa / Sim' : plat === 'android' ? '.apk / .aab' : 'Static SPA'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Target Profile */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>BUILD PROFILE & ENVIRONMENT</Text>
              <View style={styles.targetList}>
                {([
                  {
                    id: 'development' as BuildTarget,
                    name: 'Development Client',
                    desc: 'Debug engine with Expo Dev Menu, unminified JS & Metro hot-reloading.',
                    badge: 'Dev Client',
                    badgeColor: colors.accentCyan,
                  },
                  {
                    id: 'preview' as BuildTarget,
                    name: 'Internal Preview (Staging)',
                    desc: 'Ad-hoc distribution for TestFlight or internal APK side-loading.',
                    badge: 'TestFlight / APK',
                    badgeColor: colors.accentYellow,
                  },
                  {
                    id: 'production' as BuildTarget,
                    name: 'Production Release',
                    desc: 'Optimized Hermes bytecode, production certs, ready for App Store submission.',
                    badge: 'Store Ready',
                    badgeColor: colors.accentGreen,
                  },
                ]).map((item) => {
                  const isSelected = selectedTarget === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.targetCard,
                        isSelected && styles.targetCardActive,
                      ]}
                      onPress={() => handleSelectTarget(item.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.targetRadio}>
                        <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                      </View>
                      <View style={styles.targetInfo}>
                        <View style={styles.targetHeader}>
                          <Text style={[styles.targetTitle, isSelected && styles.targetTitleActive]}>
                            {item.name}
                          </Text>
                          <View style={[styles.targetBadge, { backgroundColor: `${item.badgeColor}20` }]}>
                            <Text style={[styles.targetBadgeText, { color: item.badgeColor }]}>
                              {item.badge}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.targetDescription}>{item.desc}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Parameters */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>BUILD PARAMETERS</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Git Ref / Branch</Text>
                <View style={styles.inputContainer}>
                  <Feather name="git-branch" size={16} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    value={customBranch}
                    onChangeText={setCustomBranch}
                    placeholder="main"
                    placeholderTextColor={colors.textMuted}
                    style={styles.textInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.rowTwoCols}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.sm }]}>
                  <Text style={styles.inputLabel}>App Version</Text>
                  <View style={styles.inputContainer}>
                    <Feather name="tag" size={15} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      value={appVersion}
                      onChangeText={setAppVersion}
                      placeholder="1.0.0"
                      placeholderTextColor={colors.textMuted}
                      style={styles.textInput}
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                  <Text style={styles.inputLabel}>Build Code</Text>
                  <View style={styles.inputContainer}>
                    <Feather name="hash" size={15} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      value={buildNumber}
                      onChangeText={setBuildNumber}
                      placeholder="1"
                      placeholderTextColor={colors.textMuted}
                      style={styles.textInput}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchTexts}>
                  <Text style={styles.switchTitle}>Clean Cache (--clear-cache)</Text>
                  <Text style={styles.switchSubtitle}>Re-download and build all native CocoaPods / Gradle dependencies</Text>
                </View>
                <Switch
                  value={clearCache}
                  onValueChange={setClearCache}
                  trackColor={{ false: colors.bgTertiary, true: colors.accentPrimary }}
                  thumbColor={clearCache ? colors.white : colors.textSecondary}
                />
              </View>

              {selectedTarget === 'production' && (
                <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
                  <View style={styles.switchTexts}>
                    <Text style={styles.switchTitle}>Auto-Submit to Stores</Text>
                    <Text style={styles.switchSubtitle}>Upload binary automatically upon successful cloud compilation</Text>
                  </View>
                  <Switch
                    value={autoSubmit}
                    onValueChange={setAutoSubmit}
                    trackColor={{ false: colors.bgTertiary, true: colors.accentGreen }}
                    thumbColor={autoSubmit ? colors.white : colors.textSecondary}
                  />
                </View>
              )}
            </View>

            {/* Security and Credentials Notice */}
            <View style={styles.securityBox}>
              <Ionicons name="shield-checkmark" size={18} color={colors.success} style={{ marginRight: spacing.sm, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.securityTitle}>Secure Build Credentials Verified</Text>
                <Text style={styles.securityText}>
                  Apple Distribution certs and Google Play Upload keys are injected directly from encrypted local Secure Enclave.
                  Secrets are never written to repository files.
                </Text>
              </View>
            </View>

            <View style={{ height: spacing.xl }} />
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.launchBtn}
              onPress={handleTriggerConfirmation}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="rocket-launch-outline" size={18} color={colors.white} style={{ marginRight: spacing.xs }} />
              <Text style={styles.launchBtnText}>Review & Trigger Build</Text>
            </TouchableOpacity>
          </View>

          {/* Confirmation Overlay Dialog */}
          {showConfirmDialog && (
            <View style={styles.confirmOverlay}>
              <View style={styles.confirmCard}>
                <View style={styles.confirmHeader}>
                  <View style={styles.confirmWarningIcon}>
                    <Ionicons name="alert-circle-outline" size={28} color={colors.warning} />
                  </View>
                  <Text style={styles.confirmTitle}>Confirm Build Launch</Text>
                  <Text style={styles.confirmSubtitle}>
                    You are initiating an automated cloud compilation pipeline.
                  </Text>
                </View>

                <View style={styles.summaryTable}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Platform:</Text>
                    <Text style={styles.summaryVal}>{selectedPlatform.toUpperCase()}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Profile:</Text>
                    <Text style={[styles.summaryVal, { color: colors.accentPrimary }]}>
                      {selectedTarget}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Branch:</Text>
                    <Text style={styles.summaryValCode}>{customBranch}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Version:</Text>
                    <Text style={styles.summaryVal}>{appVersion} ({buildNumber})</Text>
                  </View>
                  <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.summaryKey}>Clean Cache:</Text>
                    <Text style={styles.summaryVal}>{clearCache ? 'Yes' : 'No'}</Text>
                  </View>
                </View>

                <Text style={styles.confirmNote}>
                  Estimated compilation time is ~3–4 minutes on EAS M2 Cloud worker.
                </Text>

                <View style={styles.confirmButtonsRow}>
                  <TouchableOpacity
                    style={styles.confirmBackBtn}
                    onPress={() => setShowConfirmDialog(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.confirmBackBtnText}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.confirmStartBtn}
                    onPress={handleConfirmAndLaunch}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.confirmStartBtnText}>Confirm & Start</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: '90%',
    paddingBottom: RNPlatform.OS === 'ios' ? 24 : 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    padding: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.bgTertiary,
  },
  scrollArea: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  platformRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  platformCard: {
    flex: 1,
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  platformCardActive: {
    borderColor: colors.accentPrimary,
    backgroundColor: 'rgba(56, 139, 253, 0.08)',
  },
  platformIconBox: {
    marginBottom: spacing.xs,
  },
  platformName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  platformNameActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  platformArtifact: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  targetList: {
    gap: spacing.sm,
  },
  targetCard: {
    flexDirection: 'row',
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  targetCardActive: {
    borderColor: colors.accentPrimary,
    backgroundColor: 'rgba(56, 139, 253, 0.06)',
  },
  targetRadio: {
    marginRight: spacing.md,
    marginTop: 2,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: colors.accentPrimary,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentPrimary,
  },
  targetInfo: {
    flex: 1,
  },
  targetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  targetTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  targetTitleActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  targetBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  targetBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  targetDescription: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  inputGroup: {
    marginBottom: spacing.sm,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 40,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  textInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    padding: 0,
  },
  rowTwoCols: {
    flexDirection: 'row',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  switchTexts: {
    flex: 1,
    marginRight: spacing.md,
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  switchSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  securityBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(63, 185, 80, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(63, 185, 80, 0.25)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  securityTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
    marginBottom: 2,
  },
  securityText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    gap: spacing.md,
  },
  cancelBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  launchBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.accentPrimary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  launchBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  confirmOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    zIndex: 999,
  },
  confirmCard: {
    width: '100%',
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
  },
  confirmHeader: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  confirmWarningIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(210, 153, 34, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  confirmTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  confirmSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  summaryTable: {
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  summaryKey: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  summaryValCode: {
    fontSize: 12,
    fontFamily: typography.fontFamilies.mono,
    color: colors.accentCyan,
  },
  confirmNote: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  confirmButtonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  confirmBackBtn: {
    flex: 1,
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmBackBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  confirmStartBtn: {
    flex: 2,
    backgroundColor: colors.accentPrimary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  confirmStartBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
});

export default EASBuildModal;
