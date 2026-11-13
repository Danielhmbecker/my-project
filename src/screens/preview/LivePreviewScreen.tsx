import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Linking,
  Platform,
  Dimensions,
  Share,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { spacing, radius, shadows } from '../../theme/spacing';
import { fontFamilies, fontSizes, fontWeights } from '../../theme/typography';
import { Project, BuildTarget } from '../../models/types';
import { INITIAL_PROJECTS } from '../../storage/seedData';
import { getProjects } from '../../storage/storage';
import { PreviewDiagnostics } from './PreviewDiagnostics';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'bundle';
  source: string;
  message: string;
  details?: string;
}

export const LivePreviewScreen: React.FC = () => {
  // ---------------------------------------------------------------------------
  // State: Projects
  // ---------------------------------------------------------------------------
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [selectedProject, setSelectedProject] = useState<Project>(INITIAL_PROJECTS[0]);
  const [showProjectPicker, setShowProjectPicker] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // State: Metro Connection
  // ---------------------------------------------------------------------------
  const [metroHost, setMetroHost] = useState<string>('localhost');
  const [metroPort, setMetroPort] = useState<number>(8081);
  const [tempHost, setTempHost] = useState<string>('localhost');
  const [tempPort, setTempPort] = useState<string>('8081');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'offline'>('connecting');
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState<boolean>(false);
  const [showHostModal, setShowHostModal] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // State: Workspace & Targets
  // ---------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<'preview' | 'logs' | 'diagnostics'>('preview');
  const [selectedTarget, setSelectedTarget] = useState<BuildTarget>('development'); // 'development' (Expo Go), 'preview' (Dev Client), 'production'
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showFallbackModal, setShowFallbackModal] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // State: Bundle Reload & Fast Refresh
  // ---------------------------------------------------------------------------
  const [isBundling, setIsBundling] = useState<boolean>(false);
  const [bundleProgress, setBundleProgress] = useState<number>(100);
  const [bundleTimestamp, setBundleTimestamp] = useState<string>(new Date().toLocaleTimeString());
  const [showFastRefreshBadge, setShowFastRefreshBadge] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // State: Error Console & RedBox
  // ---------------------------------------------------------------------------
  const [activeError, setActiveError] = useState<{
    title: string;
    message: string;
    stack: string;
    file: string;
  } | null>(null);

  // ---------------------------------------------------------------------------
  // State: Interactive Preview App Simulation
  // ---------------------------------------------------------------------------
  const [interactiveTab, setInteractiveTab] = useState<'home' | 'crypto' | 'transactions'>('home');
  const [hideBalance, setHideBalance] = useState<boolean>(false);
  const [transferSuccess, setTransferSuccess] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // State: Logs Console
  // ---------------------------------------------------------------------------
  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'warn' | 'error' | 'bundle'>('all');
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 1000 * 45).toLocaleTimeString(),
      level: 'info',
      source: 'ARENA',
      message: 'Preview workspace initialized for iOS simulator viewport',
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 1000 * 30).toLocaleTimeString(),
      level: 'bundle',
      source: 'METRO',
      message: 'Fast Refresh engine listening on ws://localhost:8081/hot',
    },
    {
      id: 'log-3',
      timestamp: new Date(Date.now() - 1000 * 20).toLocaleTimeString(),
      level: 'info',
      source: 'EXPO',
      message: 'Registered root component "App" with Hermes engine v0.12',
    },
    {
      id: 'log-4',
      timestamp: new Date(Date.now() - 1000 * 10).toLocaleTimeString(),
      level: 'warn',
      source: 'RUNTIME',
      message: 'SafeAreaProvider: initialWindowMetrics calculated dynamically',
    },
  ]);

  // Load projects from persistent storage
  useEffect(() => {
    async function loadProjects() {
      try {
        const storedProjects = await getProjects();
        if (storedProjects && storedProjects.length > 0) {
          setProjects(storedProjects);
          setSelectedProject(storedProjects[0]);
        }
      } catch {
        // Keep initial fallback projects
      }
    }
    loadProjects();
  }, []);

  // ---------------------------------------------------------------------------
  // Real Metro Connection Detector
  // ---------------------------------------------------------------------------
  const checkConnection = useCallback(
    async (hostToTest: string = metroHost, portToTest: number = metroPort) => {
      setIsCheckingConnection(true);
      setConnectionStatus('connecting');

      const startTime = Date.now();
      let connected = false;
      let latency = 0;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const res = await fetch(`http://${hostToTest}:${portToTest}/status`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        latency = Date.now() - startTime;
        const text = await res.text();

        if (text.includes('packager-status:running') || res.status === 200) {
          connected = true;
        }
      } catch {
        connected = false;
      }

      setIsCheckingConnection(false);

      if (connected) {
        setConnectionStatus('connected');
        setPingLatency(latency);
        addLog('bundle', 'METRO', `Packager running at http://${hostToTest}:${portToTest} (${latency}ms roundtrip)`);
      } else {
        setConnectionStatus('offline');
        setPingLatency(null);
        addLog(
          'error',
          'METRO',
          `Cannot connect to Metro at http://${hostToTest}:${portToTest}. Verify server is running with 'npx expo start'`
        );
      }
    },
    [metroHost, metroPort]
  );

  // Probe connection upon mount
  useEffect(() => {
    checkConnection(metroHost, metroPort);
  }, []);

  // ---------------------------------------------------------------------------
  // Log Utilities
  // ---------------------------------------------------------------------------
  const addLog = (level: 'info' | 'warn' | 'error' | 'bundle', source: string, message: string, details?: string) => {
    const newEntry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      level,
      source,
      message,
      details,
    };
    setLogs((prev) => [newEntry, ...prev.slice(0, 150)]);
  };

  const clearLogs = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setLogs([]);
    showToast('Logs console cleared');
  };

  // ---------------------------------------------------------------------------
  // Reload / Refresh Bundle Handler
  // ---------------------------------------------------------------------------
  const handleReloadBundle = useCallback(() => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    setIsBundling(true);
    setBundleProgress(0);
    setShowFastRefreshBadge(true);
    setActiveError(null);

    addLog('bundle', 'METRO', `Reloading JavaScript bundle for "${selectedProject.name}"...`);

    const interval = setInterval(() => {
      setBundleProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 100;
        }
        return prev + 25;
      });
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      setBundleProgress(100);
      setIsBundling(false);
      const timeStr = new Date().toLocaleTimeString();
      setBundleTimestamp(timeStr);
      addLog('bundle', 'METRO', `Bundle index.bundle built in 384ms (1,482 modules)`);
      showToast('Bundle reloaded successfully');

      setTimeout(() => {
        setShowFastRefreshBadge(false);
      }, 1500);
    }, 600);
  }, [selectedProject.name]);

  // ---------------------------------------------------------------------------
  // Expo Go & URLs
  // ---------------------------------------------------------------------------
  const expoGoUrl = `exp://${metroHost}:${metroPort}`;
  const devClientUrl = `arena-studio://expo-development-client/?url=${encodeURIComponent(`http://${metroHost}:${metroPort}`)}`;
  const webPreviewUrl = `http://${metroHost}:${metroPort}`;

  const currentPreviewUrl = useMemo(() => {
    if (selectedTarget === 'development') return expoGoUrl;
    if (selectedTarget === 'preview') return devClientUrl;
    return selectedProject.previewUrl || webPreviewUrl;
  }, [selectedTarget, expoGoUrl, devClientUrl, selectedProject.previewUrl, webPreviewUrl]);

  const handleOpenExpoGo = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    addLog('info', 'EXPO', `Attempting deep link: ${expoGoUrl}`);

    try {
      const supported = await Linking.canOpenURL(expoGoUrl);
      if (supported) {
        await Linking.openURL(expoGoUrl);
        showToast('Launching in Expo Go...');
      } else {
        setShowFallbackModal(true);
      }
    } catch (err: any) {
      addLog('warn', 'EXPO', `Deep link open failed: ${err?.message || 'Protocol not handled'}`);
      setShowFallbackModal(true);
    }
  };

  const copyUrlToClipboard = async (urlToCopy: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        title: 'ARENA STUDIO Preview URL',
        message: urlToCopy,
      });
      showToast('Preview URL copied to share menu');
    } catch {
      showToast('URL: ' + urlToCopy);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // ---------------------------------------------------------------------------
  // Host Configuration Save
  // ---------------------------------------------------------------------------
  const handleSaveHostConfig = () => {
    const parsedPort = parseInt(tempPort, 10) || 8081;
    setMetroHost(tempHost.trim());
    setMetroPort(parsedPort);
    setShowHostModal(false);
    checkConnection(tempHost.trim(), parsedPort);
  };

  // ---------------------------------------------------------------------------
  // Filtered Logs
  // ---------------------------------------------------------------------------
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesLevel = logFilter === 'all' || log.level === logFilter;
      const matchesSearch =
        !logSearchQuery.trim() ||
        log.message.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
        log.source.toLowerCase().includes(logSearchQuery.toLowerCase());
      return matchesLevel && matchesSearch;
    });
  }, [logs, logFilter, logSearchQuery]);

  // ---------------------------------------------------------------------------
  // Trigger Simulated Error (RedBox Testing)
  // ---------------------------------------------------------------------------
  const triggerSimulatedError = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {}

    const err = {
      title: 'ReferenceError: Can\'t find variable: undefinedNativeModule',
      message: 'Attempted to invoke synchronous native method before turboModule registration.',
      file: 'src/screens/preview/LivePreviewScreen.tsx:284:12',
      stack: `ReferenceError: Can't find variable: undefinedNativeModule\n  at LivePreviewScreen.tsx:284:12\n  at invokeCallback (MessageQueue.js:428)\n  at flush (MessageQueue.js:122)\n  at callFunctionReturnFlushedQueue (MessageQueue.js:98)`,
    };
    setActiveError(err);
    addLog('error', 'EXCEPTION', `${err.title} at ${err.file}`);
  };

  return (
    <View style={styles.container}>
      {/* Toast Banner */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <Ionicons name="information-circle" size={16} color={colors.accentCyan} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Top Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.badgeiOS}>
            <Ionicons name="logo-apple" size={14} color={colors.white} />
            <Text style={styles.badgeiOSText}>iOS LIVE PREVIEW</Text>
          </View>

          {/* Connection Status Indicator */}
          <TouchableOpacity
            style={styles.connectionBadge}
            onPress={() => setShowHostModal(true)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.statusDot,
                connectionStatus === 'connected'
                  ? styles.statusDotConnected
                  : connectionStatus === 'connecting'
                  ? styles.statusDotConnecting
                  : styles.statusDotOffline,
              ]}
            />
            <Text style={styles.connectionText}>
              {connectionStatus === 'connected'
                ? `Metro ${pingLatency !== null ? `${pingLatency}ms` : 'Ready'}`
                : connectionStatus === 'connecting'
                ? 'Connecting...'
                : 'Metro Offline'}
            </Text>
            <Ionicons name="chevron-down" size={12} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Project Selector Bar */}
        <View style={styles.projectSelectorBar}>
          <TouchableOpacity
            style={styles.projectPickerButton}
            onPress={() => setShowProjectPicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.projectPickerLeft}>
              <View style={styles.projectIconBadge}>
                <Ionicons
                  name={
                    selectedProject.framework === 'expo'
                      ? 'flash'
                      : selectedProject.framework === 'ios'
                      ? 'logo-apple'
                      : 'globe-outline'
                  }
                  size={16}
                  color={colors.accentPrimary}
                />
              </View>
              <View>
                <Text style={styles.projectNameText}>{selectedProject.name}</Text>
                <Text style={styles.projectMetaText}>
                  {selectedProject.gitBranch} • {selectedProject.filesCount} files • {selectedProject.category}
                </Text>
              </View>
            </View>
            <Ionicons name="swap-vertical" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Workspace Tab Switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'preview' && styles.tabButtonActive]}
            onPress={() => setActiveTab('preview')}
          >
            <Ionicons
              name="phone-portrait-outline"
              size={15}
              color={activeTab === 'preview' ? colors.accentPrimary : colors.textMuted}
            />
            <Text style={[styles.tabButtonText, activeTab === 'preview' && styles.tabButtonTextActive]}>
              Simulator Frame
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'logs' && styles.tabButtonActive]}
            onPress={() => setActiveTab('logs')}
          >
            <Ionicons
              name="terminal-outline"
              size={15}
              color={activeTab === 'logs' ? colors.accentPurple : colors.textMuted}
            />
            <Text style={[styles.tabButtonText, activeTab === 'logs' && styles.tabButtonTextActive]}>
              Build Logs ({logs.length})
            </Text>
            {logs.some((l) => l.level === 'error') && <View style={styles.tabErrorIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'diagnostics' && styles.tabButtonActive]}
            onPress={() => setActiveTab('diagnostics')}
          >
            <Ionicons
              name="pulse-outline"
              size={15}
              color={activeTab === 'diagnostics' ? colors.accentCyan : colors.textMuted}
            />
            <Text style={[styles.tabButtonText, activeTab === 'diagnostics' && styles.tabButtonTextActive]}>
              Diagnostics
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Workspace Body */}
      {activeTab === 'preview' && (
        <ScrollView
          style={styles.previewScroll}
          contentContainerStyle={styles.previewScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Build Target Selector */}
          <View style={styles.targetSection}>
            <View style={styles.targetSectionHeader}>
              <Text style={styles.targetSectionLabel}>PREVIEW TARGET ENGINE</Text>
              <Text style={styles.targetSectionUrl} numberOfLines={1}>
                {currentPreviewUrl}
              </Text>
            </View>

            <View style={styles.targetSelector}>
              <TouchableOpacity
                style={[
                  styles.targetButton,
                  selectedTarget === 'development' && styles.targetButtonActive,
                ]}
                onPress={() => setSelectedTarget('development')}
              >
                <Ionicons
                  name="play-circle"
                  size={14}
                  color={selectedTarget === 'development' ? colors.accentCyan : colors.textMuted}
                />
                <Text
                  style={[
                    styles.targetButtonText,
                    selectedTarget === 'development' && styles.targetButtonTextActive,
                  ]}
                >
                  Expo Go
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.targetButton,
                  selectedTarget === 'preview' && styles.targetButtonActive,
                ]}
                onPress={() => setSelectedTarget('preview')}
              >
                <Ionicons
                  name="construct"
                  size={14}
                  color={selectedTarget === 'preview' ? colors.accentPurple : colors.textMuted}
                />
                <Text
                  style={[
                    styles.targetButtonText,
                    selectedTarget === 'preview' && styles.targetButtonTextActive,
                  ]}
                >
                  Dev Client
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.targetButton,
                  selectedTarget === 'production' && styles.targetButtonActive,
                ]}
                onPress={() => setSelectedTarget('production')}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={14}
                  color={selectedTarget === 'production' ? colors.success : colors.textMuted}
                />
                <Text
                  style={[
                    styles.targetButtonText,
                    selectedTarget === 'production' && styles.targetButtonTextActive,
                  ]}
                >
                  Production
                </Text>
              </TouchableOpacity>
            </View>

            {/* Target Action Bar */}
            <View style={styles.targetActionBar}>
              <TouchableOpacity
                style={styles.openExpoButton}
                onPress={handleOpenExpoGo}
                activeOpacity={0.8}
              >
                <Ionicons name="open-outline" size={16} color={colors.white} />
                <Text style={styles.openExpoButtonText}>Open in Expo Go</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.copyUrlButton}
                onPress={() => copyUrlToClipboard(currentPreviewUrl)}
                activeOpacity={0.8}
              >
                <Ionicons name="copy-outline" size={16} color={colors.accentPrimary} />
                <Text style={styles.copyUrlButtonText}>Copy URL</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.refreshBundleButton}
                onPress={handleReloadBundle}
                disabled={isBundling}
                activeOpacity={0.8}
              >
                {isBundling ? (
                  <ActivityIndicator size="small" color={colors.accentCyan} />
                ) : (
                  <Ionicons name="reload" size={16} color={colors.accentCyan} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* iPhone 16 Pro Viewport Frame */}
          <View style={styles.deviceFrameContainer}>
            <View style={styles.iphoneOuterBezel}>
              {/* Dynamic Island */}
              <View style={styles.dynamicIslandContainer}>
                <View style={styles.dynamicIsland}>
                  <View style={styles.dynamicIslandCamera} />
                  <View style={styles.dynamicIslandSensor} />
                </View>
              </View>

              {/* iOS Status Bar */}
              <View style={styles.iosStatusBar}>
                <Text style={styles.iosStatusTime}>9:41</Text>
                <View style={styles.iosStatusIcons}>
                  <Ionicons name="cellular" size={12} color={colors.textPrimary} />
                  <Ionicons name="wifi" size={12} color={colors.textPrimary} />
                  <Ionicons name="battery-full" size={14} color={colors.textPrimary} />
                </View>
              </View>

              {/* Fast Refresh Floating Pill */}
              {showFastRefreshBadge && (
                <View style={styles.fastRefreshBadge}>
                  <Ionicons name="flash" size={12} color={colors.accentCyan} />
                  <Text style={styles.fastRefreshText}>Fast Refresh (48ms)</Text>
                </View>
              )}

              {/* Bundling Progress Banner */}
              {isBundling && (
                <View style={styles.bundlingOverlay}>
                  <ActivityIndicator size="small" color={colors.accentPrimary} />
                  <Text style={styles.bundlingText}>Bundling index.js ({bundleProgress}%)...</Text>
                </View>
              )}

              {/* Inner Simulated App Screen */}
              <View style={styles.innerAppViewport}>
                {selectedProject.id === 'proj-nexa-finance' && (
                  <View style={styles.simAppContainer}>
                    {/* NEXA Header */}
                    <View style={styles.simHeader}>
                      <View>
                        <Text style={styles.simGreeting}>Good morning,</Text>
                        <Text style={styles.simUserTitle}>Alex Vance</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.simEyeButton}
                        onPress={() => setHideBalance(!hideBalance)}
                      >
                        <Ionicons
                          name={hideBalance ? 'eye-off-outline' : 'eye-outline'}
                          size={18}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Balance Card */}
                    <View style={styles.simBalanceCard}>
                      <Text style={styles.simBalanceLabel}>TOTAL PORTFOLIO NET WORTH</Text>
                      <Text style={styles.simBalanceAmount}>
                        {hideBalance ? '$ ••••••••' : '$84,291.50'}
                      </Text>
                      <View style={styles.simDeltaRow}>
                        <Ionicons name="trending-up" size={14} color={colors.success} />
                        <Text style={styles.simDeltaText}>+$4,820.10 (5.8%) this week</Text>
                      </View>
                    </View>

                    {/* Quick Action Buttons */}
                    <View style={styles.simActionGrid}>
                      <TouchableOpacity
                        style={styles.simActionPill}
                        onPress={() => {
                          setTransferSuccess(true);
                          setTimeout(() => setTransferSuccess(false), 2000);
                          addLog('info', 'USER_ACTION', 'Initiated instant SEPA transfer $500.00');
                        }}
                      >
                        <View style={[styles.simActionIcon, { backgroundColor: colors.accentPrimaryAlpha }]}>
                          <Ionicons name="arrow-up" size={14} color={colors.accentPrimary} />
                        </View>
                        <Text style={styles.simActionLabel}>Send</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.simActionPill}
                        onPress={() => {
                          showToast('Deposit address copied');
                          addLog('info', 'USER_ACTION', 'Generated Ethereum deposit address');
                        }}
                      >
                        <View style={[styles.simActionIcon, { backgroundColor: colors.statusBgSuccess }]}>
                          <Ionicons name="arrow-down" size={14} color={colors.success} />
                        </View>
                        <Text style={styles.simActionLabel}>Receive</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.simActionPill}
                        onPress={() => {
                          showToast('AI Yield Optimizer active');
                          addLog('info', 'USER_ACTION', 'Queried NEXA AI portfolio rebalance');
                        }}
                      >
                        <View style={[styles.simActionIcon, { backgroundColor: colors.accentPurpleAlpha }]}>
                          <Ionicons name="swap-horizontal" size={14} color={colors.accentPurple} />
                        </View>
                        <Text style={styles.simActionLabel}>Swap</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.simActionPill}
                        onPress={() => {
                          showToast('Staking APR: 6.4%');
                        }}
                      >
                        <View style={[styles.simActionIcon, { backgroundColor: colors.accentCyanAlpha }]}>
                          <Ionicons name="sparkles" size={14} color={colors.accentCyan} />
                        </View>
                        <Text style={styles.simActionLabel}>Earn</Text>
                      </TouchableOpacity>
                    </View>

                    {transferSuccess && (
                      <View style={styles.simSuccessCard}>
                        <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                        <Text style={styles.simSuccessText}>SEPA Instant Transfer Processed</Text>
                      </View>
                    )}

                    {/* Asset Watchlist */}
                    <View style={styles.simAssetList}>
                      <Text style={styles.simListTitle}>CONNECTED WALLETS & ASSETS</Text>
                      <View style={styles.simAssetItem}>
                        <View style={styles.simAssetLeft}>
                          <View style={[styles.simTokenBadge, { backgroundColor: '#f7931a' }]}>
                            <Text style={styles.simTokenBadgeText}>₿</Text>
                          </View>
                          <View>
                            <Text style={styles.simAssetName}>Bitcoin</Text>
                            <Text style={styles.simAssetSub}>0.842 BTC</Text>
                          </View>
                        </View>
                        <View style={styles.simAssetRight}>
                          <Text style={styles.simAssetValue}>$54,120.00</Text>
                          <Text style={[styles.simAssetChange, { color: colors.success }]}>+3.4%</Text>
                        </View>
                      </View>

                      <View style={styles.simAssetItem}>
                        <View style={styles.simAssetLeft}>
                          <View style={[styles.simTokenBadge, { backgroundColor: '#627eea' }]}>
                            <Text style={styles.simTokenBadgeText}>Ξ</Text>
                          </View>
                          <View>
                            <Text style={styles.simAssetName}>Ethereum</Text>
                            <Text style={styles.simAssetSub}>8.45 ETH</Text>
                          </View>
                        </View>
                        <View style={styles.simAssetRight}>
                          <Text style={styles.simAssetValue}>$28,890.50</Text>
                          <Text style={[styles.simAssetChange, { color: colors.success }]}>+5.1%</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {selectedProject.id === 'proj-arena-browser' && (
                  <View style={styles.simAppContainer}>
                    <View style={styles.browserAddressBar}>
                      <Ionicons name="lock-closed" size={12} color={colors.success} />
                      <Text style={styles.browserUrlText}>https://arena.ai/workspace</Text>
                      <Ionicons name="shield-checkmark" size={14} color={colors.accentCyan} />
                    </View>
                    <View style={styles.browserContent}>
                      <Ionicons name="globe-outline" size={48} color={colors.accentPrimary} />
                      <Text style={styles.browserHeadline}>Arena Tab Isolation Engine</Text>
                      <Text style={styles.browserSubtext}>
                        WebKit sandbox active with native biometric credential vault.
                      </Text>
                    </View>
                  </View>
                )}

                {selectedProject.id === 'proj-botworks' && (
                  <View style={styles.simAppContainer}>
                    <View style={styles.botworksHeader}>
                      <Ionicons name="hardware-chip" size={20} color={colors.accentPurple} />
                      <Text style={styles.botworksTitle}>BOTWORKS Orchestrator</Text>
                    </View>
                    <View style={styles.botworksPipeline}>
                      <View style={styles.pipelineStep}>
                        <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                        <Text style={styles.pipelineStepText}>Lint & TypeCheck passed</Text>
                      </View>
                      <View style={styles.pipelineStep}>
                        <Ionicons name="sync" size={16} color={colors.warning} />
                        <Text style={styles.pipelineStepText}>EAS iOS Dev Build in queue</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Simulated Device Controls Bar */}
                <View style={styles.simFloatingControls}>
                  <TouchableOpacity
                    style={styles.simDevButton}
                    onPress={handleReloadBundle}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="reload-circle" size={18} color={colors.accentCyan} />
                    <Text style={styles.simDevButtonText}>Reload</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.simDevButton}
                    onPress={triggerSimulatedError}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="bug-outline" size={18} color={colors.error} />
                    <Text style={styles.simDevButtonText}>Test Error</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.simDevButton}
                    onPress={() => setActiveTab('diagnostics')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="stats-chart" size={18} color={colors.accentPurple} />
                    <Text style={styles.simDevButtonText}>Metrics</Text>
                  </TouchableOpacity>
                </View>

                {/* Home Indicator Bar */}
                <View style={styles.homeIndicatorBar} />
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Build Logs Console Tab */}
      {activeTab === 'logs' && (
        <View style={styles.logsContainer}>
          {/* Logs Control Bar */}
          <View style={styles.logsControlBar}>
            <View style={styles.logSearchBox}>
              <Ionicons name="search" size={14} color={colors.textSecondary} />
              <TextInput
                style={styles.logSearchInput}
                placeholder="Filter logs or source..."
                placeholderTextColor={colors.textMuted}
                value={logSearchQuery}
                onChangeText={setLogSearchQuery}
              />
              {logSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setLogSearchQuery('')}>
                  <Ionicons name="close-circle" size={14} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity style={styles.clearLogsButton} onPress={clearLogs}>
              <Ionicons name="trash-outline" size={15} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.refreshLogsButton} onPress={handleReloadBundle}>
              <Ionicons name="reload" size={15} color={colors.accentPrimary} />
            </TouchableOpacity>
          </View>

          {/* Level Filter Chips */}
          <View style={styles.filterChipRow}>
            {(['all', 'bundle', 'info', 'warn', 'error'] as const).map((filterKey) => (
              <TouchableOpacity
                key={filterKey}
                style={[
                  styles.filterChip,
                  logFilter === filterKey && styles.filterChipActive,
                ]}
                onPress={() => setLogFilter(filterKey)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    logFilter === filterKey && styles.filterChipTextActive,
                  ]}
                >
                  {filterKey.toUpperCase()}{' '}
                  {filterKey === 'all'
                    ? `(${logs.length})`
                    : `(${logs.filter((l) => l.level === filterKey).length})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Logs Scroll List */}
          <ScrollView
            style={styles.logsScrollView}
            contentContainerStyle={styles.logsScrollContent}
            showsVerticalScrollIndicator={true}
          >
            {filteredLogs.length === 0 ? (
              <View style={styles.emptyLogsWrap}>
                <Ionicons name="terminal-outline" size={32} color={colors.textMuted} />
                <Text style={styles.emptyLogsText}>No logs match current filter</Text>
              </View>
            ) : (
              filteredLogs.map((log) => (
                <View key={log.id} style={styles.logRow}>
                  <View style={styles.logMeta}>
                    <Text style={styles.logTime}>{log.timestamp}</Text>
                    <View
                      style={[
                        styles.logLevelBadge,
                        log.level === 'error'
                          ? styles.logBadgeError
                          : log.level === 'warn'
                          ? styles.logBadgeWarn
                          : log.level === 'bundle'
                          ? styles.logBadgeBundle
                          : styles.logBadgeInfo,
                      ]}
                    >
                      <Text style={styles.logLevelText}>{log.source}</Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.logMessageText,
                      log.level === 'error'
                        ? styles.logTextError
                        : log.level === 'warn'
                        ? styles.logTextWarn
                        : log.level === 'bundle'
                        ? styles.logTextBundle
                        : styles.logTextInfo,
                    ]}
                  >
                    {log.message}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {/* Diagnostics Sub-View Tab */}
      {activeTab === 'diagnostics' && (
        <PreviewDiagnostics
          metroHost={metroHost}
          metroPort={metroPort}
          connectionStatus={connectionStatus}
          pingLatency={pingLatency}
          activeProject={selectedProject}
          onRefreshConnection={() => checkConnection(metroHost, metroPort)}
          onSelectHost={(host, port) => {
            setMetroHost(host);
            setMetroPort(port);
            checkConnection(host, port);
          }}
        />
      )}

      {/* Project Selector Modal */}
      <Modal
        visible={showProjectPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProjectPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowProjectPicker(false)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Project to Preview</Text>
              <TouchableOpacity onPress={() => setShowProjectPicker(false)}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.projectListWrap}>
              {projects.map((proj) => (
                <TouchableOpacity
                  key={proj.id}
                  style={[
                    styles.projectOptionCard,
                    selectedProject.id === proj.id && styles.projectOptionCardActive,
                  ]}
                  onPress={() => {
                    setSelectedProject(proj);
                    setShowProjectPicker(false);
                    addLog('info', 'PROJECT', `Switched active preview to "${proj.name}"`);
                    handleReloadBundle();
                  }}
                >
                  <View style={styles.projectOptionLeft}>
                    <View style={styles.projectOptionIcon}>
                      <Ionicons
                        name={
                          proj.framework === 'expo'
                            ? 'flash'
                            : proj.framework === 'ios'
                            ? 'logo-apple'
                            : 'globe-outline'
                        }
                        size={18}
                        color={colors.accentPrimary}
                      />
                    </View>
                    <View>
                      <Text style={styles.projectOptionTitle}>{proj.name}</Text>
                      <Text style={styles.projectOptionSub}>
                        {proj.framework.toUpperCase()} • {proj.gitBranch} • {proj.filesCount} files
                      </Text>
                    </View>
                  </View>
                  {selectedProject.id === proj.id && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.accentPrimary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Host & Port Configuration Modal */}
      <Modal
        visible={showHostModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowHostModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowHostModal(false)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="settings-outline" size={18} color={colors.accentCyan} />
                <Text style={styles.modalTitle}>Metro Connection Setup</Text>
              </View>
              <TouchableOpacity onPress={() => setShowHostModal(false)}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Configure the host and port of your Metro bundler server. For physical iOS devices, use your local
              Wi-Fi IP (e.g. 192.168.1.100).
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>METRO HOST / IP ADDRESS</Text>
              <TextInput
                style={styles.textInput}
                value={tempHost}
                onChangeText={setTempHost}
                placeholder="localhost or 192.168.1.xxx"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PORT</Text>
              <TextInput
                style={styles.textInput}
                value={tempPort}
                onChangeText={setTempPort}
                placeholder="8081"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>

            {/* Quick Preset Buttons */}
            <View style={styles.presetButtonsRow}>
              <TouchableOpacity
                style={styles.presetPill}
                onPress={() => {
                  setTempHost('localhost');
                  setTempPort('8081');
                }}
              >
                <Text style={styles.presetPillText}>localhost (Simulator)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetPill}
                onPress={() => {
                  setTempHost('10.0.2.2');
                  setTempPort('8081');
                }}
              >
                <Text style={styles.presetPillText}>10.0.2.2 (Android)</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowHostModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveHostButton}
                onPress={handleSaveHostConfig}
              >
                <Text style={styles.saveHostButtonText}>Save & Test Probe</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Expo Go Fallback Modal */}
      <Modal
        visible={showFallbackModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFallbackModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowFallbackModal(false)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="information-circle" size={20} color={colors.accentCyan} />
                <Text style={styles.modalTitle}>Expo Go Integration</Text>
              </View>
              <TouchableOpacity onPress={() => setShowFallbackModal(false)}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fallbackNoticeText}>
              The Expo Go app could not be opened directly from this environment (e.g. running inside simulator or Expo Go isn't installed).
            </Text>

            <View style={styles.fallbackStepBox}>
              <Text style={styles.fallbackStepTitle}>How to preview on your iPhone:</Text>
              <Text style={styles.fallbackStepDesc}>
                1. Install <Text style={{ color: colors.accentPrimary }}>Expo Go</Text> from the App Store.
              </Text>
              <Text style={styles.fallbackStepDesc}>
                2. Copy the URL below and enter it into Expo Go, or scan the QR code in the Diagnostics tab.
              </Text>
            </View>

            <View style={styles.fallbackUrlBox}>
              <Text style={styles.fallbackUrlText} numberOfLines={1}>
                {expoGoUrl}
              </Text>
            </View>

            <View style={styles.modalActionButtons}>
              <TouchableOpacity
                style={styles.copyFallbackButton}
                onPress={() => {
                  copyUrlToClipboard(expoGoUrl);
                  setShowFallbackModal(false);
                }}
              >
                <Ionicons name="copy-outline" size={16} color={colors.white} />
                <Text style={styles.copyFallbackButtonText}>Copy Expo URL</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.webFallbackButton}
                onPress={() => {
                  setShowFallbackModal(false);
                  Linking.openURL(webPreviewUrl).catch(() => {});
                }}
              >
                <Ionicons name="globe-outline" size={16} color={colors.accentPrimary} />
                <Text style={styles.webFallbackButtonText}>Open in Browser</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* RedBox Error Simulation Modal */}
      {activeError && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setActiveError(null)}
        >
          <View style={styles.redboxBackdrop}>
            <View style={styles.redboxContainer}>
              <View style={styles.redboxHeader}>
                <View style={styles.redboxTitleRow}>
                  <Ionicons name="alert-circle" size={22} color={colors.error} />
                  <Text style={styles.redboxTitle}>{activeError.title}</Text>
                </View>
                <TouchableOpacity onPress={() => setActiveError(null)}>
                  <Ionicons name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.redboxFileBadge}>
                <Text style={styles.redboxFileText}>{activeError.file}</Text>
              </View>

              <ScrollView style={styles.redboxScroll}>
                <Text style={styles.redboxMessage}>{activeError.message}</Text>
                <Text style={styles.redboxStackTitle}>CALL STACK:</Text>
                <Text style={styles.redboxStackText}>{activeError.stack}</Text>
              </ScrollView>

              <View style={styles.redboxFooter}>
                <TouchableOpacity
                  style={styles.redboxDismissButton}
                  onPress={() => setActiveError(null)}
                >
                  <Text style={styles.redboxDismissText}>Dismiss</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.redboxReloadButton}
                  onPress={handleReloadBundle}
                >
                  <Ionicons name="reload" size={16} color={colors.white} />
                  <Text style={styles.redboxReloadText}>Reload Bundle</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderFocus,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.elevated,
  },
  toastText: {
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
    fontWeight: fontWeights.semibold,
  },
  header: {
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: spacing.xs,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  badgeiOS: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  badgeiOSText: {
    fontSize: fontSizes.xs - 2,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    letterSpacing: 0.6,
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  statusDotConnected: {
    backgroundColor: colors.success,
  },
  statusDotConnecting: {
    backgroundColor: colors.warning,
  },
  statusDotOffline: {
    backgroundColor: colors.error,
  },
  connectionText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.mono,
    color: colors.textPrimary,
  },
  projectSelectorBar: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  projectPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  projectPickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  projectIconBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.accentPrimaryAlpha,
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectNameText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  projectMetaText: {
    fontSize: fontSizes.xs - 2,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    position: 'relative',
  },
  tabButtonActive: {
    borderBottomColor: colors.accentPrimary,
  },
  tabButtonText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    color: colors.textMuted,
  },
  tabButtonTextActive: {
    color: colors.textPrimary,
    fontWeight: fontWeights.bold,
  },
  tabErrorIndicator: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.error,
    position: 'absolute',
    top: 6,
    right: 8,
  },
  previewScroll: {
    flex: 1,
  },
  previewScrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  targetSection: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  targetSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  targetSectionLabel: {
    fontSize: fontSizes.xs - 2,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  targetSectionUrl: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.mono,
    color: colors.accentCyan,
    maxWidth: 200,
  },
  targetSelector: {
    flexDirection: 'row',
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    padding: 3,
    marginBottom: spacing.md,
  },
  targetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.sm,
    gap: 4,
  },
  targetButtonActive: {
    backgroundColor: colors.bgElevated,
  },
  targetButtonText: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontWeight: fontWeights.medium,
  },
  targetButtonTextActive: {
    color: colors.textPrimary,
    fontWeight: fontWeights.bold,
  },
  targetActionBar: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  openExpoButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentPrimary,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  openExpoButtonText: {
    fontSize: fontSizes.xs + 1,
    fontWeight: fontWeights.bold,
    color: colors.white,
  },
  copyUrlButton: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgTertiary,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  copyUrlButtonText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.accentPrimary,
  },
  refreshBundleButton: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceFrameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iphoneOuterBezel: {
    width: Math.min(Dimensions.get('window').width - 32, 380),
    height: 680,
    backgroundColor: '#000000',
    borderRadius: 48,
    borderWidth: 4,
    borderColor: '#30363d',
    padding: 10,
    position: 'relative',
    ...shadows.elevated,
  },
  dynamicIslandContainer: {
    position: 'absolute',
    top: 14,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  dynamicIsland: {
    width: 90,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 10,
    borderWidth: 1,
    borderColor: '#1f242c',
  },
  dynamicIslandCamera: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#0a101d',
    marginRight: 6,
  },
  dynamicIslandSensor: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#04284d',
  },
  iosStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 6,
    paddingBottom: 4,
    zIndex: 5,
  },
  iosStatusTime: {
    fontSize: fontSizes.xs - 1,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  iosStatusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fastRefreshBadge: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 15, 18, 0.92)',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.accentCyan,
    gap: 4,
  },
  fastRefreshText: {
    fontSize: fontSizes.xs - 2,
    fontFamily: fontFamilies.mono,
    color: colors.accentCyan,
    fontWeight: fontWeights.bold,
  },
  bundlingOverlay: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    zIndex: 30,
    backgroundColor: 'rgba(13, 15, 18, 0.95)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderFocus,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  bundlingText: {
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
    fontFamily: fontFamilies.mono,
  },
  innerAppViewport: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    borderRadius: 38,
    overflow: 'hidden',
    padding: spacing.md,
    position: 'relative',
  },
  simAppContainer: {
    flex: 1,
  },
  simHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  simGreeting: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  simUserTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  simEyeButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.bgTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  simBalanceCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  simBalanceLabel: {
    fontSize: fontSizes.xs - 2,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  simBalanceAmount: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    fontFamily: fontFamilies.mono,
    marginVertical: spacing.xs,
  },
  simDeltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  simDeltaText: {
    fontSize: fontSizes.xs,
    color: colors.success,
    fontWeight: fontWeights.semibold,
  },
  simActionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  simActionPill: {
    alignItems: 'center',
    gap: 4,
  },
  simActionIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  simActionLabel: {
    fontSize: fontSizes.xs - 1,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
  },
  simSuccessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.statusBgSuccess,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.statusBorderSuccess,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  simSuccessText: {
    fontSize: fontSizes.xs,
    color: colors.success,
    fontWeight: fontWeights.semibold,
  },
  simAssetList: {
    marginTop: spacing.xs,
  },
  simListTitle: {
    fontSize: fontSizes.xs - 2,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  simAssetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  simAssetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  simTokenBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  simTokenBadgeText: {
    color: colors.white,
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.xs,
  },
  simAssetName: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  simAssetSub: {
    fontSize: fontSizes.xs - 2,
    color: colors.textSecondary,
  },
  simAssetRight: {
    alignItems: 'flex-end',
  },
  simAssetValue: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    fontFamily: fontFamilies.mono,
  },
  simAssetChange: {
    fontSize: fontSizes.xs - 2,
    fontWeight: fontWeights.semibold,
  },
  browserAddressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  browserUrlText: {
    flex: 1,
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.mono,
    color: colors.textPrimary,
  },
  browserContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  browserHeadline: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  browserSubtext: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  botworksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  botworksTitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  botworksPipeline: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  pipelineStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pipelineStepText: {
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
  },
  simFloatingControls: {
    position: 'absolute',
    bottom: 24,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(22, 25, 31, 0.95)',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    ...shadows.elevated,
  },
  simDevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  simDevButtonText: {
    fontSize: fontSizes.xs - 1,
    fontWeight: fontWeights.bold,
    color: colors.textSecondary,
  },
  homeIndicatorBar: {
    position: 'absolute',
    bottom: 6,
    alignSelf: 'center',
    width: 120,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.borderLight,
  },
  logsContainer: {
    flex: 1,
    backgroundColor: colors.bgCode,
  },
  logsControlBar: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  logSearchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  logSearchInput: {
    flex: 1,
    height: 32,
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
    fontFamily: fontFamilies.mono,
  },
  clearLogsButton: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.bgTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  refreshLogsButton: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.bgTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    backgroundColor: colors.bgTertiary,
  },
  filterChipActive: {
    backgroundColor: colors.accentPrimaryAlpha,
    borderWidth: 1,
    borderColor: colors.accentPrimary,
  },
  filterChipText: {
    fontSize: fontSizes.xs - 2,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
  },
  filterChipTextActive: {
    color: colors.accentPrimary,
  },
  logsScrollView: {
    flex: 1,
  },
  logsScrollContent: {
    padding: spacing.md,
    paddingBottom: spacing['4xl'],
  },
  emptyLogsWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
    gap: spacing.sm,
  },
  emptyLogsText: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  logRow: {
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingBottom: spacing.xs,
  },
  logMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  logTime: {
    fontSize: fontSizes.xs - 2,
    fontFamily: fontFamilies.mono,
    color: colors.textMuted,
  },
  logLevelBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  logBadgeInfo: {
    backgroundColor: colors.statusBgInfo,
  },
  logBadgeWarn: {
    backgroundColor: colors.statusBgWarning,
  },
  logBadgeError: {
    backgroundColor: colors.statusBgError,
  },
  logBadgeBundle: {
    backgroundColor: colors.accentPurpleAlpha,
  },
  logLevelText: {
    fontSize: fontSizes.xs - 3,
    fontWeight: fontWeights.bold,
    fontFamily: fontFamilies.mono,
    color: colors.textPrimary,
  },
  logMessageText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.mono,
    lineHeight: 18,
  },
  logTextInfo: {
    color: colors.textPrimary,
  },
  logTextWarn: {
    color: colors.warning,
  },
  logTextError: {
    color: colors.error,
  },
  logTextBundle: {
    color: colors.accentPurple,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.modal,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  modalTitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  modalDescription: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  projectListWrap: {
    maxHeight: 280,
  },
  projectOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bgTertiary,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  projectOptionCardActive: {
    borderColor: colors.accentPrimary,
    backgroundColor: colors.accentPrimaryAlpha,
  },
  projectOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  projectOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectOptionTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  projectOptionSub: {
    fontSize: fontSizes.xs - 2,
    color: colors.textSecondary,
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: fontSizes.xs - 2,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
  },
  textInput: {
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    fontFamily: fontFamilies.mono,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetButtonsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  presetPill: {
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  presetPillText: {
    fontSize: fontSizes.xs - 2,
    fontFamily: fontFamilies.mono,
    color: colors.textSecondary,
  },
  modalActionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  cancelButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.bgTertiary,
  },
  cancelButtonText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontWeight: fontWeights.semibold,
  },
  saveHostButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.accentPrimary,
  },
  saveHostButtonText: {
    fontSize: fontSizes.sm,
    color: colors.white,
    fontWeight: fontWeights.bold,
  },
  fallbackNoticeText: {
    fontSize: fontSizes.xs + 1,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  fallbackStepBox: {
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  fallbackStepTitle: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  fallbackStepDesc: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  fallbackUrlBox: {
    backgroundColor: colors.bgPrimary,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  fallbackUrlText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.mono,
    color: colors.accentCyan,
  },
  copyFallbackButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentPrimary,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  copyFallbackButtonText: {
    fontSize: fontSizes.xs + 1,
    fontWeight: fontWeights.bold,
    color: colors.white,
  },
  webFallbackButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgTertiary,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  webFallbackButtonText: {
    fontSize: fontSizes.xs + 1,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  redboxBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  redboxContainer: {
    backgroundColor: '#1a0d0e',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 2,
    borderTopColor: colors.error,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  redboxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  redboxTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  redboxTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.error,
    flex: 1,
  },
  redboxFileBadge: {
    backgroundColor: colors.bgSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  redboxFileText: {
    fontSize: fontSizes.xs - 2,
    fontFamily: fontFamilies.mono,
    color: colors.textSecondary,
  },
  redboxScroll: {
    maxHeight: 280,
    marginBottom: spacing.lg,
  },
  redboxMessage: {
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  redboxStackTitle: {
    fontSize: fontSizes.xs - 2,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  redboxStackText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.mono,
    color: '#ff8585',
    lineHeight: 18,
    backgroundColor: '#260f12',
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  redboxFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  redboxDismissButton: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  redboxDismissText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
  },
  redboxReloadButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.error,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  redboxReloadText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.white,
  },
});

export default LivePreviewScreen;
