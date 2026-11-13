import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Share,
  Linking,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, Feather, MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius, typography } from '../../theme';
import { BuildPlatform, BuildTarget, BuildJobStatus, BuildJob } from '../../models';
import { EASBuildModal, EASBuildConfig } from './EASBuildModal';
import { saveBuildJob } from '../../storage';

export interface ExtendedBuildItem {
  id: string;
  projectId: string;
  commitSha: string;
  commitMessage: string;
  branch: string;
  platform: BuildPlatform;
  target: BuildTarget;
  status: BuildJobStatus;
  duration: string;
  startedAt: string;
  completedAt?: string;
  downloadUrl?: string;
  previewUrl?: string;
  qrCodeUrl?: string;
  logs: string[];
}

const STORAGE_KEY_BUILDS = '@arena_studio_build_history';

const INITIAL_BUILDS: ExtendedBuildItem[] = [
  {
    id: 'build-108',
    projectId: 'arena-studio-mobile',
    commitSha: '8f4b1c9',
    commitMessage: 'feat(orchestration): add multi-agent auto-handoff protocol',
    branch: 'main',
    platform: 'ios',
    target: 'production',
    status: 'success',
    duration: '3m 14s',
    startedAt: '15 mins ago',
    completedAt: '12 mins ago',
    downloadUrl: 'https://expo.dev/artifacts/eas/arena-studio-108.ipa',
    previewUrl: 'https://testflight.apple.com/join/arena-studio-preview',
    logs: [
      '[18:00:01] Initializing EAS Build runner (macOS 14.5, Xcode 16.1)...',
      '[18:00:15] Git ref checked out: refs/heads/main @ 8f4b1c9',
      '[18:00:32] Decrypting Apple Distribution Certificates from Secure Enclave...',
      '[18:00:48] Running bun install: 492 packages synchronized in 3.4s',
      '[18:01:20] Metro Bundler: Hermes byte-compiling 1,980 modules...',
      '[18:02:10] Running xcodebuild -workspace ArenaStudio.xcworkspace -scheme ArenaStudio archive',
      '[18:02:55] Packaging .xcarchive to signed .ipa payload (38.4 MB)',
      '[18:03:10] Artifact successfully uploaded to EAS CDN.',
      '[18:03:14] Build #108 finished with status SUCCESS.',
    ],
  },
  {
    id: 'build-107',
    projectId: 'arena-studio-mobile',
    commitSha: '3a91f42',
    commitMessage: 'fix(ide): live code editor syntax highlighter dark palette',
    branch: 'main',
    platform: 'android',
    target: 'preview',
    status: 'success',
    duration: '2m 28s',
    startedAt: '1 hour ago',
    completedAt: '58 mins ago',
    downloadUrl: 'https://expo.dev/artifacts/eas/arena-studio-107.apk',
    previewUrl: 'https://expo.dev/@arena-team/arena-studio?channel=preview',
    logs: [
      '[17:15:02] Initializing EAS Linux runner (Ubuntu 22.04 LTS, JDK 17)...',
      '[17:15:20] Git checkout 3a91f42 on branch main',
      '[17:15:45] Injected Google Play Upload Keystore (AES-256 decrypted)',
      '[17:16:15] Executing ./gradlew assembleRelease --no-daemon',
      '[17:17:18] Standalone APK generated: app-release.apk (42.1 MB)',
      '[17:17:30] Finished: Standalone preview APK ready for side-loading.',
    ],
  },
  {
    id: 'build-106',
    projectId: 'arena-studio-mobile',
    commitSha: 'c827b01',
    commitMessage: 'refactor(theme): charcoal background palette & 4px spacing grid',
    branch: 'feature/dark-theme',
    platform: 'web',
    target: 'development',
    status: 'success',
    duration: '48s',
    startedAt: '3 hours ago',
    completedAt: '3 hours ago',
    downloadUrl: 'https://arena-studio-preview.vercel.app',
    previewUrl: 'https://arena-studio-preview.vercel.app',
    logs: [
      '[15:22:10] Triggered Web Static Export via expo export -p web',
      '[15:22:25] Webpack bundle optimized for production: 1.2 MB gzipped',
      '[15:22:45] Deployed to Vercel Edge Network: https://arena-studio-preview.vercel.app',
      '[15:22:58] Deployment verified healthy (HTTP 200 OK)',
    ],
  },
  {
    id: 'build-105',
    projectId: 'arena-studio-mobile',
    commitSha: '6e19d7c',
    commitMessage: 'test(agents): add autonomous task checkpoint approval test',
    branch: 'test/qa-checkpoints',
    platform: 'ios',
    target: 'preview',
    status: 'failed',
    duration: '1m 12s',
    startedAt: '5 hours ago',
    completedAt: '5 hours ago',
    logs: [
      '[13:10:00] Initializing EAS Build runner...',
      '[13:10:22] Git checkout 6e19d7c',
      '[13:10:50] Metro bundle failure: Unresolved import "@testing-library/react-native/unstable"',
      '[13:11:12] Error: Process completed with exit code 1. Build aborted.',
    ],
  },
];

export const DeployScreen: React.FC = () => {
  const [builds, setBuilds] = useState<ExtendedBuildItem[]>(INITIAL_BUILDS);
  const [selectedTargetTab, setSelectedTargetTab] = useState<BuildTarget>('production');
  const [activeFilterPlatform, setActiveFilterPlatform] = useState<'all' | BuildPlatform>('all');
  const [isEASModalVisible, setIsEASModalVisible] = useState(false);
  const [modalInitialPlatform, setModalInitialPlatform] = useState<BuildPlatform>('ios');
  
  // Live Build Runner State
  const [isBuilding, setIsBuilding] = useState(false);
  const [currentBuildProgress, setCurrentBuildProgress] = useState(0);
  const [currentStageText, setCurrentStageText] = useState('Idle');
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    '[System] Ready to trigger remote EAS compilation or local deployment.',
    '[System] Last commit: 8f4b1c9 ("feat(orchestration): add multi-agent auto-handoff protocol")',
  ]);
  const [autoScrollLogs, setAutoScrollLogs] = useState(true);
  const [activeBuildingJobId, setActiveBuildingJobId] = useState<string | null>(null);

  // Direct confirmation dialog before quick builds
  const [quickConfirmTarget, setQuickConfirmTarget] = useState<{
    platform: BuildPlatform;
    target: BuildTarget;
  } | null>(null);

  const consoleScrollRef = useRef<ScrollView>(null);
  const buildIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadStoredBuilds();
    return () => {
      if (buildIntervalRef.current) clearInterval(buildIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (autoScrollLogs && consoleScrollRef.current) {
      consoleScrollRef.current.scrollToEnd({ animated: true });
    }
  }, [consoleLogs, autoScrollLogs]);

  const loadStoredBuilds = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY_BUILDS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBuilds(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load builds from storage', e);
    }
  };

  const saveBuilds = async (newBuilds: ExtendedBuildItem[]) => {
    setBuilds(newBuilds);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_BUILDS, JSON.stringify(newBuilds));
    } catch (e) {
      console.warn('Failed to save builds', e);
    }
  };

  const triggerLiveSimulatedBuild = (config: EASBuildConfig) => {
    if (isBuilding) {
      Alert.alert('Build in Progress', 'A cloud compilation runner is currently active.');
      return;
    }

    const newBuildId = `build-${Date.now().toString().slice(-4)}`;
    const startedTime = new Date().toLocaleTimeString();
    
    setIsBuilding(true);
    setActiveBuildingJobId(newBuildId);
    setCurrentBuildProgress(5);
    setCurrentStageText('Provisioning runner...');

    const initialLog = [
      `[${startedTime}] >>> Triggering EAS Build for ${config.platform.toUpperCase()} (${config.target.toUpperCase()}) <<<`,
      `[${startedTime}] Project: ${config.projectId} | Branch: ${config.branch} | Version: ${config.version} (${config.buildNumber})`,
      `[${startedTime}] Resolving cloud build machine: macOS M2 runner (4-core, 16GB RAM)...`,
      `[${startedTime}] Authenticating with Expo Application Services...`,
    ];
    setConsoleLogs(initialLog);

    const steps = [
      { progress: 15, stage: 'Cloning repository & checking out ref...', log: `[${startedTime}] Checked out ${config.branch} @ commit 8f4b1c9` },
      { progress: 30, stage: 'Decrypting credentials & keystores...', log: `[${startedTime}] Decrypted AES-256 credentials: Apple Distribution Profile verified.` },
      { progress: 45, stage: 'Restoring package dependencies...', log: `[${startedTime}] Synchronized 492 npm modules in 2.8s (bun cache hit)` },
      { progress: 65, stage: 'Bundling JavaScript via Metro...', log: `[${startedTime}] Hermes byte-compiler bundled 1,842 application modules.` },
      { progress: 85, stage: 'Compiling native toolchain...', log: `[${startedTime}] Native compilation passed without warnings.` },
      { progress: 95, stage: 'Signing & generating binary artifact...', log: `[${startedTime}] Code signing complete. Standalone package signed.` },
      { progress: 100, stage: 'Uploading artifact to EAS Cloud...', log: `[${startedTime}] Uploaded artifact to EAS CDN: https://expo.dev/artifacts/eas/${newBuildId}.${config.platform === 'ios' ? 'ipa' : config.platform === 'android' ? 'apk' : 'zip'}` },
    ];

    let stepIndex = 0;
    buildIntervalRef.current = setInterval(() => {
      if (stepIndex < steps.length) {
        const currentStep = steps[stepIndex];
        setCurrentBuildProgress(currentStep.progress);
        setCurrentStageText(currentStep.stage);
        setConsoleLogs((prev) => [...prev, currentStep.log]);
        stepIndex++;
      } else {
        if (buildIntervalRef.current) clearInterval(buildIntervalRef.current);
        setIsBuilding(false);
        setActiveBuildingJobId(null);
        setCurrentStageText('Build Successful');
        
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (_) {}

        const finalItem: ExtendedBuildItem = {
          id: newBuildId,
          projectId: config.projectId,
          commitSha: '8f4b1c9',
          commitMessage: `chore(release): automated build for ${config.platform} (${config.target})`,
          branch: config.branch,
          platform: config.platform,
          target: config.target,
          status: 'success',
          duration: '1m 45s',
          startedAt: 'Just now',
          completedAt: 'Just now',
          downloadUrl: `https://expo.dev/artifacts/eas/${newBuildId}.${config.platform === 'ios' ? 'ipa' : config.platform === 'android' ? 'apk' : 'zip'}`,
          previewUrl: config.platform === 'web' ? 'https://arena-studio-preview.vercel.app' : 'https://testflight.apple.com/join/arena-studio-preview',
          logs: [...initialLog, ...steps.map((s) => s.log), `[DONE] Build completed successfully with exit code 0.`],
        };

        saveBuilds([finalItem, ...builds]);
        saveBuildJob({
          id: finalItem.id,
          projectId: finalItem.projectId,
          platform: finalItem.platform,
          target: finalItem.target,
          status: 'success',
          logs: finalItem.logs,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          artifactUrl: finalItem.downloadUrl,
        }).catch(() => {});
      }
    }, 1800);
  };

  const handleAbortBuild = () => {
    Alert.alert(
      'Abort Active Build?',
      'Are you sure you want to send a cancellation signal to the remote EAS worker?',
      [
        { text: 'Keep Running', style: 'cancel' },
        {
          text: 'Abort Build',
          style: 'destructive',
          onPress: () => {
            if (buildIntervalRef.current) clearInterval(buildIntervalRef.current);
            setIsBuilding(false);
            setActiveBuildingJobId(null);
            setCurrentStageText('Aborted by user');
            setConsoleLogs((prev) => [
              ...prev,
              `[${new Date().toLocaleTimeString()}] WARNING: Build execution manually aborted by user.`,
            ]);
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            } catch (_) {}
          },
        },
      ]
    );
  };

  const handleQuickDeployPrompt = (platform: BuildPlatform, target: BuildTarget) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_) {}
    setQuickConfirmTarget({ platform, target });
  };

  const executeQuickDeploy = () => {
    if (!quickConfirmTarget) return;
    const { platform, target } = quickConfirmTarget;
    setQuickConfirmTarget(null);

    triggerLiveSimulatedBuild({
      platform,
      target,
      projectId: 'arena-studio-mobile',
      branch: 'main',
      clearCache: false,
      autoSubmit: target === 'production',
      version: '1.2.0',
      buildNumber: '43',
    });
  };

  const handleOpenArtifact = async (url?: string) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Cannot Open URL', `Unable to navigate to: ${url}`);
    }
  };

  const handleShareArtifact = async (build: ExtendedBuildItem) => {
    try {
      await Share.share({
        title: `ARENA STUDIO Build ${build.id}`,
        message: `Build ${build.id} (${build.platform.toUpperCase()} - ${build.target}) is ready!\nDownload: ${build.downloadUrl || build.previewUrl}`,
      });
    } catch (_) {}
  };

  const handleViewHistoricalLog = (build: ExtendedBuildItem) => {
    try {
      Haptics.selectionAsync();
    } catch (_) {}
    setConsoleLogs([
      `=== LOG ARCHIVE: ${build.id} (${build.platform.toUpperCase()} - ${build.target}) ===`,
      `Commit: ${build.commitSha} on branch ${build.branch}`,
      `Duration: ${build.duration} | Status: ${build.status.toUpperCase()}`,
      `Started: ${build.startedAt}`,
      '--------------------------------------------------',
      ...build.logs,
    ]);
  };

  const filteredBuilds = builds.filter((b) => {
    if (activeFilterPlatform === 'all') return true;
    return b.platform === activeFilterPlatform;
  });

  const getPlatformIcon = (plat: BuildPlatform, size: number = 16) => {
    switch (plat) {
      case 'ios':
        return <Ionicons name="logo-apple" size={size} color={colors.textPrimary} />;
      case 'android':
        return <Ionicons name="logo-android" size={size} color={colors.accentGreen} />;
      case 'web':
        return <Feather name="globe" size={size} color={colors.accentCyan} />;
    }
  };

  const getStatusBadge = (status: BuildJobStatus) => {
    switch (status) {
      case 'success':
        return (
          <View style={[styles.statusBadge, { backgroundColor: colors.statusBgSuccess, borderColor: colors.statusBorderSuccess }]}>
            <Ionicons name="checkmark-circle" size={13} color={colors.success} style={{ marginRight: 3 }} />
            <Text style={[styles.statusBadgeText, { color: colors.success }]}>Success</Text>
          </View>
        );
      case 'failed':
        return (
          <View style={[styles.statusBadge, { backgroundColor: colors.statusBgError, borderColor: colors.statusBorderError }]}>
            <Ionicons name="close-circle" size={13} color={colors.error} style={{ marginRight: 3 }} />
            <Text style={[styles.statusBadgeText, { color: colors.error }]}>Failed</Text>
          </View>
        );
      case 'in_progress':
        return (
          <View style={[styles.statusBadge, { backgroundColor: colors.statusBgInfo, borderColor: colors.statusBorderInfo }]}>
            <ActivityIndicator size="small" color={colors.info} style={{ transform: [{ scale: 0.6 }], marginRight: 2 }} />
            <Text style={[styles.statusBadgeText, { color: colors.info }]}>Building</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.statusBadge, { backgroundColor: colors.bgTertiary, borderColor: colors.border }]}>
            <Text style={[styles.statusBadgeText, { color: colors.textSecondary }]}>Queued</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.screen}>
      {/* Top App Bar */}
      <View style={styles.topBar}>
        <View>
          <View style={styles.titleRow}>
            <MaterialCommunityIcons name="rocket-launch" size={22} color={colors.accentPrimary} style={{ marginRight: spacing.sm }} />
            <Text style={styles.titleText}>Build & Deploy Workspace</Text>
          </View>
          <View style={styles.branchRow}>
            <Feather name="git-branch" size={13} color={colors.accentCyan} style={{ marginRight: 4 }} />
            <Text style={styles.branchText}>main</Text>
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={styles.commitShaText}>#8f4b1c9</Text>
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={styles.easStatusText}>EAS Cloud Active</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.openConfigBtn}
          onPress={() => {
            setModalInitialPlatform('ios');
            setIsEASModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Feather name="sliders" size={15} color={colors.textPrimary} style={{ marginRight: 6 }} />
          <Text style={styles.openConfigBtnText}>EAS Config</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
        {/* Environment Targets Showcase */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>DEPLOYMENT TARGETS</Text>
          <Text style={styles.sectionSubtitle}>Select an environment to view configuration or trigger a build</Text>
        </View>

        <View style={styles.targetsRow}>
          {/* Development Target Card */}
          <TouchableOpacity
            style={[
              styles.targetEnvCard,
              selectedTargetTab === 'development' && styles.targetEnvCardActive,
            ]}
            onPress={() => setSelectedTargetTab('development')}
            activeOpacity={0.85}
          >
            <View style={styles.envCardHeader}>
              <View style={[styles.envIconBadge, { backgroundColor: 'rgba(57, 197, 207, 0.15)' }]}>
                <Feather name="terminal" size={16} color={colors.accentCyan} />
              </View>
              <View style={[styles.envStatusPill, { backgroundColor: 'rgba(57, 197, 207, 0.2)' }]}>
                <Text style={[styles.envStatusPillText, { color: colors.accentCyan }]}>DEV</Text>
              </View>
            </View>
            <Text style={styles.envTitle}>Development</Text>
            <Text style={styles.envDetail}>Expo Go / Local Dev Client</Text>
            <Text style={styles.envSpecs}>Unminified • DevTools • Fast Hot Reload</Text>
            <TouchableOpacity
              style={styles.envDeployBtn}
              onPress={() => handleQuickDeployPrompt('web', 'development')}
            >
              <Feather name="play" size={13} color={colors.textPrimary} style={{ marginRight: 4 }} />
              <Text style={styles.envDeployBtnText}>Deploy Dev</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Preview Target Card */}
          <TouchableOpacity
            style={[
              styles.targetEnvCard,
              selectedTargetTab === 'preview' && styles.targetEnvCardActive,
            ]}
            onPress={() => setSelectedTargetTab('preview')}
            activeOpacity={0.85}
          >
            <View style={styles.envCardHeader}>
              <View style={[styles.envIconBadge, { backgroundColor: 'rgba(210, 153, 34, 0.15)' }]}>
                <Ionicons name="flask-outline" size={16} color={colors.accentYellow} />
              </View>
              <View style={[styles.envStatusPill, { backgroundColor: 'rgba(210, 153, 34, 0.2)' }]}>
                <Text style={[styles.envStatusPillText, { color: colors.accentYellow }]}>STAGING</Text>
              </View>
            </View>
            <Text style={styles.envTitle}>Preview</Text>
            <Text style={styles.envDetail}>Internal TestFlight & APK</Text>
            <Text style={styles.envSpecs}>Hermes Engine • Standalone Binary</Text>
            <TouchableOpacity
              style={styles.envDeployBtn}
              onPress={() => handleQuickDeployPrompt('ios', 'preview')}
            >
              <Feather name="send" size={13} color={colors.textPrimary} style={{ marginRight: 4 }} />
              <Text style={styles.envDeployBtnText}>Build Preview</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Production Target Card */}
          <TouchableOpacity
            style={[
              styles.targetEnvCard,
              selectedTargetTab === 'production' && styles.targetEnvCardActive,
            ]}
            onPress={() => setSelectedTargetTab('production')}
            activeOpacity={0.85}
          >
            <View style={styles.envCardHeader}>
              <View style={[styles.envIconBadge, { backgroundColor: 'rgba(63, 185, 80, 0.15)' }]}>
                <Ionicons name="storefront-outline" size={16} color={colors.accentGreen} />
              </View>
              <View style={[styles.envStatusPill, { backgroundColor: 'rgba(63, 185, 80, 0.2)' }]}>
                <Text style={[styles.envStatusPillText, { color: colors.accentGreen }]}>PROD</Text>
              </View>
            </View>
            <Text style={styles.envTitle}>Production</Text>
            <Text style={styles.envDetail}>App Store / Play Store / Edge</Text>
            <Text style={styles.envSpecs}>Signed Certs • Tree Shaken • Global CDN</Text>
            <TouchableOpacity
              style={[styles.envDeployBtn, { backgroundColor: colors.accentPrimary }]}
              onPress={() => handleQuickDeployPrompt('ios', 'production')}
            >
              <MaterialCommunityIcons name="rocket-launch-outline" size={14} color={colors.white} style={{ marginRight: 4 }} />
              <Text style={[styles.envDeployBtnText, { color: colors.white }]}>Ship Release</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* Live Build Runner & Console */}
        <View style={styles.consoleContainer}>
          <View style={styles.consoleHeader}>
            <View style={styles.consoleTitleGroup}>
              <View style={[styles.consoleLed, isBuilding ? styles.consoleLedActive : styles.consoleLedIdle]} />
              <Text style={styles.consoleTitle}>
                {isBuilding ? `BUILD IN PROGRESS [${currentBuildProgress}%]` : 'BUILD LOG CONSOLE'}
              </Text>
            </View>

            <View style={styles.consoleActions}>
              <TouchableOpacity
                style={styles.consoleActionBtn}
                onPress={() => setAutoScrollLogs(!autoScrollLogs)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather
                  name="arrow-down"
                  size={14}
                  color={autoScrollLogs ? colors.accentPrimary : colors.textMuted}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.consoleActionBtn}
                onPress={() => setConsoleLogs(['[System] Console cleared.'])}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="trash-2" size={14} color={colors.textSecondary} />
              </TouchableOpacity>
              {isBuilding && (
                <TouchableOpacity
                  style={styles.abortBtn}
                  onPress={handleAbortBuild}
                >
                  <Feather name="x-octagon" size={13} color={colors.error} style={{ marginRight: 4 }} />
                  <Text style={styles.abortBtnText}>Abort</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Progress Bar when Active */}
          {isBuilding && (
            <View style={styles.progressBarWrapper}>
              <View style={[styles.progressBarFill, { width: `${currentBuildProgress}%` }]} />
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressStageText}>{currentStageText}</Text>
                <Text style={styles.progressPercentText}>{currentBuildProgress}%</Text>
              </View>
            </View>
          )}

          {/* Terminal Log Screen */}
          <ScrollView
            ref={consoleScrollRef}
            style={styles.consoleScroll}
            nestedScrollEnabled
            showsVerticalScrollIndicator
          >
            {consoleLogs.map((log, index) => {
              const isError = log.includes('Error') || log.includes('failed') || log.includes('aborted');
              const isSuccess = log.includes('SUCCESS') || log.includes('finished') || log.includes('Uploaded');
              const isWarn = log.includes('WARNING');
              const isSpecial = log.includes('>>>');

              let logColor: string = colors.textCode;
              if (isError) logColor = colors.error;
              else if (isSuccess) logColor = colors.success;
              else if (isWarn) logColor = colors.warning;
              else if (isSpecial) logColor = colors.accentCyan;

              return (
                <Text key={index} style={[styles.consoleLine, { color: logColor }]}>
                  {log}
                </Text>
              );
            })}
          </ScrollView>
        </View>

        {/* Build History Section */}
        <View style={styles.historyHeader}>
          <View>
            <Text style={styles.sectionTitle}>BUILD HISTORY</Text>
            <Text style={styles.sectionSubtitle}>Recent compilation records, artifacts, and links</Text>
          </View>

          {/* Platform Filters */}
          <View style={styles.filterPills}>
            {(['all', 'ios', 'android', 'web'] as const).map((filter) => {
              const isActive = activeFilterPlatform === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterPill, isActive && styles.filterPillActive]}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch (_) {}
                    setActiveFilterPlatform(filter);
                  }}
                >
                  <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                    {filter.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Build Items List */}
        <View style={styles.buildsList}>
          {filteredBuilds.map((build) => {
            return (
              <View key={build.id} style={styles.buildCard}>
                <View style={styles.buildCardTop}>
                  <View style={styles.buildCardLeft}>
                    <View style={styles.platformBadgeBox}>
                      {getPlatformIcon(build.platform, 17)}
                    </View>
                    <View>
                      <View style={styles.buildTitleRow}>
                        <Text style={styles.buildIdText}>{build.id}</Text>
                        <View style={[styles.targetTag, { backgroundColor: colors.bgElevated }]}>
                          <Text style={styles.targetTagText}>{build.target}</Text>
                        </View>
                      </View>
                      <Text style={styles.commitMsg} numberOfLines={1}>
                        {build.commitMessage}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.buildCardRight}>
                    {getStatusBadge(build.status)}
                    <Text style={styles.durationText}>{build.duration}</Text>
                  </View>
                </View>

                {/* Build Metadata Bar */}
                <View style={styles.buildMetaBar}>
                  <View style={styles.metaItem}>
                    <Feather name="git-commit" size={12} color={colors.textSecondary} style={{ marginRight: 3 }} />
                    <Text style={styles.metaValue}>{build.commitSha}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Feather name="clock" size={12} color={colors.textSecondary} style={{ marginRight: 3 }} />
                    <Text style={styles.metaValue}>{build.startedAt}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Feather name="git-branch" size={12} color={colors.textSecondary} style={{ marginRight: 3 }} />
                    <Text style={styles.metaValue}>{build.branch}</Text>
                  </View>
                </View>

                {/* Actions & Links Bar */}
                <View style={styles.buildActionsBar}>
                  <TouchableOpacity
                    style={styles.buildActionBtn}
                    onPress={() => handleViewHistoricalLog(build)}
                  >
                    <Feather name="file-text" size={13} color={colors.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={styles.buildActionText}>Logs</Text>
                  </TouchableOpacity>

                  {build.downloadUrl && (
                    <TouchableOpacity
                      style={styles.buildActionBtn}
                      onPress={() => handleOpenArtifact(build.downloadUrl)}
                    >
                      <Feather name="download" size={13} color={colors.accentPrimary} style={{ marginRight: 4 }} />
                      <Text style={[styles.buildActionText, { color: colors.accentPrimary }]}>Artifact</Text>
                    </TouchableOpacity>
                  )}

                  {build.previewUrl && (
                    <TouchableOpacity
                      style={styles.buildActionBtn}
                      onPress={() => handleOpenArtifact(build.previewUrl)}
                    >
                      <Feather name="external-link" size={13} color={colors.accentGreen} style={{ marginRight: 4 }} />
                      <Text style={[styles.buildActionText, { color: colors.accentGreen }]}>Preview</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.buildActionBtn, { borderRightWidth: 0 }]}
                    onPress={() => handleShareArtifact(build)}
                  >
                    <Feather name="share-2" size={13} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: spacing['4xl'] }} />
      </ScrollView>

      {/* EAS Build Configuration Modal */}
      <EASBuildModal
        visible={isEASModalVisible}
        onClose={() => setIsEASModalVisible(false)}
        onStartBuild={(config) => {
          triggerLiveSimulatedBuild(config);
        }}
        initialPlatform={modalInitialPlatform}
        initialTarget={selectedTargetTab}
        projectId="arena-studio-mobile"
        currentBranch="main"
      />

      {/* Explicit User Confirmation Dialog for Quick Deploy */}
      {quickConfirmTarget && (
        <View style={styles.confirmModalBackdrop}>
          <View style={styles.confirmModalCard}>
            <View style={styles.confirmIconCircle}>
              <Ionicons name="shield-checkmark-outline" size={32} color={colors.accentPrimary} />
            </View>
            <Text style={styles.confirmModalTitle}>Confirm Deployment Launch</Text>
            <Text style={styles.confirmModalSubtitle}>
              Please verify target environment parameters before proceeding:
            </Text>

            <View style={styles.confirmMetaBox}>
              <View style={styles.confirmMetaRow}>
                <Text style={styles.confirmMetaKey}>Target Environment:</Text>
                <Text style={[styles.confirmMetaVal, { color: colors.accentPrimary, textTransform: 'uppercase' }]}>
                  {quickConfirmTarget.target}
                </Text>
              </View>
              <View style={styles.confirmMetaRow}>
                <Text style={styles.confirmMetaKey}>Target Platform:</Text>
                <Text style={styles.confirmMetaVal}>{quickConfirmTarget.platform.toUpperCase()}</Text>
              </View>
              <View style={styles.confirmMetaRow}>
                <Text style={styles.confirmMetaKey}>Git Commit:</Text>
                <Text style={styles.confirmMetaValCode}>8f4b1c9 (main)</Text>
              </View>
              <View style={[styles.confirmMetaRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.confirmMetaKey}>Signing Key:</Text>
                <Text style={styles.confirmMetaVal}>Verified AES-256</Text>
              </View>
            </View>

            <Text style={styles.confirmDisclaimer}>
              Cloud worker resources will be provisioned immediately.
            </Text>

            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setQuickConfirmTarget(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmProceedBtn}
                onPress={executeQuickDeploy}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmProceedText}>Launch Deployment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? spacing.xl : spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  branchText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accentCyan,
  },
  dotSeparator: {
    color: colors.textMuted,
    marginHorizontal: 5,
    fontSize: 11,
  },
  commitShaText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: typography.fontFamilies.mono,
  },
  easStatusText: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '500',
  },
  openConfigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  openConfigBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  bodyScroll: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  targetsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  targetEnvCard: {
    flex: 1,
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  targetEnvCardActive: {
    borderColor: colors.accentPrimary,
    backgroundColor: 'rgba(56, 139, 253, 0.05)',
  },
  envCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  envIconBadge: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  envStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  envStatusPillText: {
    fontSize: 9,
    fontWeight: '700',
  },
  envTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  envDetail: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 4,
  },
  envSpecs: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 14,
  },
  envDeployBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  envDeployBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  consoleContainer: {
    backgroundColor: '#090d13',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  consoleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  consoleTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  consoleLed: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  consoleLedActive: {
    backgroundColor: colors.success,
  },
  consoleLedIdle: {
    backgroundColor: colors.textMuted,
  },
  consoleTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.6,
  },
  consoleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  consoleActionBtn: {
    padding: 4,
    borderRadius: radius.xs,
  },
  abortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 81, 73, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(248, 81, 73, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  abortBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.error,
  },
  progressBarWrapper: {
    backgroundColor: colors.bgSecondary,
    height: 28,
    position: 'relative',
    justifyContent: 'center',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  progressBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(56, 139, 253, 0.3)',
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    zIndex: 1,
  },
  progressStageText: {
    fontSize: 11,
    color: colors.accentPrimary,
    fontWeight: '600',
  },
  progressPercentText: {
    fontSize: 11,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  consoleScroll: {
    maxHeight: 180,
    padding: spacing.md,
  },
  consoleLine: {
    fontFamily: typography.fontFamilies.mono,
    fontSize: 11,
    lineHeight: 18,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  filterPills: {
    flexDirection: 'row',
    gap: 4,
  },
  filterPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.accentPrimary,
    borderColor: colors.accentPrimary,
  },
  filterPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterPillTextActive: {
    color: colors.white,
  },
  buildsList: {
    gap: spacing.md,
  },
  buildCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  buildCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  buildCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  platformBadgeBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  buildTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  buildIdText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  targetTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.xs,
  },
  targetTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  commitMsg: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    maxWidth: 220,
  },
  buildCardRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  durationText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  buildMetaBar: {
    flexDirection: 'row',
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    gap: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderSubtle,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaValue: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: typography.fontFamilies.mono,
  },
  buildActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
  },
  buildActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRightWidth: 1,
    borderRightColor: colors.borderSubtle,
  },
  buildActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  confirmModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    zIndex: 999,
  },
  confirmModalCard: {
    width: '100%',
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    alignItems: 'center',
  },
  confirmIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(56, 139, 253, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  confirmModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  confirmModalSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.md,
  },
  confirmMetaBox: {
    width: '100%',
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  confirmMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  confirmMetaKey: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  confirmMetaVal: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  confirmMetaValCode: {
    fontSize: 12,
    fontFamily: typography.fontFamilies.mono,
    color: colors.accentCyan,
  },
  confirmDisclaimer: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  confirmProceedBtn: {
    flex: 2,
    backgroundColor: colors.accentPrimary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  confirmProceedText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
});

export default DeployScreen;
