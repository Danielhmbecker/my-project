import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Animated,
  Dimensions,
  TextInput,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, fontFamilies, fontSizes, fontWeights, spacing, radius } from '../../theme';
import { GitStatus } from './GitStatus';
import { Terminal } from './Terminal';

export type DevToolsTab = 'git' | 'terminal' | 'logs';
export type DrawerHeightState = 'collapsed' | 'half' | 'expanded';
export type LogLevel = 'ALL' | 'INFO' | 'WARN' | 'ERROR' | 'BUILD';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'BUILD';
  tag: string;
  message: string;
  details?: string;
}

export interface DevToolsProps {
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  onClose?: () => void;
  defaultTab?: DevToolsTab;
  initialHeightState?: DrawerHeightState;
  projectId?: string;
  currentBranch?: string;
  onBranchChange?: (branch: string) => void;
  containerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}

export interface DevToolsToggleButtonProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTab?: DevToolsTab;
  errorsCount?: number;
  gitChangesCount?: number;
  style?: StyleProp<ViewStyle>;
}

// Initial realistic streaming logs
const INITIAL_LOGS: LogEntry[] = [
  {
    id: 'l1',
    timestamp: '18:04:12.301',
    level: 'BUILD',
    tag: 'Metro',
    message: 'Bundler initialized at http://localhost:8081',
  },
  {
    id: 'l2',
    timestamp: '18:04:13.115',
    level: 'INFO',
    tag: 'Storage',
    message: 'AsyncStorage initialized. 3 demo projects loaded.',
  },
  {
    id: 'l3',
    timestamp: '18:04:13.882',
    level: 'INFO',
    tag: 'AgentTeam',
    message: '8 specialist AI agents connected to orchestration message board.',
  },
  {
    id: 'l4',
    timestamp: '18:04:15.040',
    level: 'BUILD',
    tag: 'Hermes',
    message: 'JavaScript bytecode loaded (1,248KB). Execution ready.',
  },
  {
    id: 'l5',
    timestamp: '18:04:16.420',
    level: 'WARN',
    tag: 'Fonts',
    message: 'Optional custom font "JetBrainsMono" fallbacking to system monospace font.',
  },
  {
    id: 'l6',
    timestamp: '18:04:18.910',
    level: 'INFO',
    tag: 'Git',
    message: 'Local git repository verified on branch main (1 unpushed commit).',
  },
  {
    id: 'l7',
    timestamp: '18:04:22.100',
    level: 'BUILD',
    tag: 'Compiler',
    message: 'TypeScript 5.3.3 checking src/screens/ide/... (0 errors).',
  },
  {
    id: 'l8',
    timestamp: '18:04:24.750',
    level: 'ERROR',
    tag: 'Tunnel',
    message: 'Metro remote tunnel connection timeout (retrying via direct LAN).',
    details: 'ETIMEDOUT: tunnel.exp.direct:8081 did not respond in 5000ms',
  },
  {
    id: 'l9',
    timestamp: '18:04:25.320',
    level: 'INFO',
    tag: 'Tunnel',
    message: 'Fallback connection established via LAN IP (192.168.1.104:8081).',
  },
];

const STREAMING_SAMPLE_LOGS: Array<Omit<LogEntry, 'id' | 'timestamp'>> = [
  {
    level: 'INFO',
    tag: 'Agent',
    message: 'Architect Agent updated project specifications document.',
  },
  {
    level: 'BUILD',
    tag: 'FastRefresh',
    message: 'DevTools.tsx reloaded in 42ms.',
  },
  {
    level: 'WARN',
    tag: 'Memory',
    message: 'Image cache size reached 14.2MB (within normal limits).',
  },
  {
    level: 'BUILD',
    tag: 'Metro',
    message: 'Bundle src/screens/ide/Terminal.tsx complete (108 modules).',
  },
  {
    level: 'INFO',
    tag: 'Preview',
    message: 'Live preview client connected to session #4928.',
  },
  {
    level: 'ERROR',
    tag: 'Network',
    message: 'Failed to sync git remote origin/preview-tunnel: 404 Not Found',
    details: 'Remote branch does not exist on github.com/arena/studio-demo',
  },
];

/**
 * Quick toggle button to place in IDE header
 */
export const DevToolsToggleButton: React.FC<DevToolsToggleButtonProps> = ({
  isOpen,
  onToggle,
  activeTab = 'terminal',
  errorsCount = 1,
  gitChangesCount = 3,
  style,
}) => {
  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}
    onToggle();
  };

  const getTabIcon = () => {
    switch (activeTab) {
      case 'git':
        return 'git-branch';
      case 'logs':
        return 'receipt-outline';
      case 'terminal':
      default:
        return 'terminal-outline';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.headerToggleBtn, isOpen && styles.headerToggleBtnActive, style]}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Toggle DevTools"
    >
      <Ionicons
        name={getTabIcon()}
        size={16}
        color={isOpen ? colors.accentPrimary : colors.textPrimary}
      />
      <Text style={[styles.headerToggleText, isOpen && styles.headerToggleTextActive]}>
        DevTools
      </Text>

      {/* Red badge for errors or Cyan for git changes */}
      {errorsCount > 0 ? (
        <View style={styles.errorDotBadge} />
      ) : gitChangesCount > 0 ? (
        <View style={styles.gitDotBadge} />
      ) : null}
    </TouchableOpacity>
  );
};

export const DevToolsHeaderButton = DevToolsToggleButton;

export const DevTools: React.FC<DevToolsProps> = ({
  isOpen = true,
  onToggle,
  onClose,
  defaultTab = 'terminal',
  initialHeightState = 'half',
  projectId = 'arena-project-1',
  currentBranch = 'main',
  onBranchChange,
  containerStyle,
  style,
}) => {
  const [activeTab, setActiveTab] = useState<DevToolsTab>(defaultTab);
  const [heightState, setHeightState] = useState<DrawerHeightState>(initialHeightState);
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [logFilter, setLogFilter] = useState<LogLevel>('ALL');
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const screenHeight = Dimensions.get('window').height;

  // Height configurations
  const HEIGHT_COLLAPSED = 48;
  const HEIGHT_HALF = Math.min(360, Math.round(screenHeight * 0.45));
  const HEIGHT_EXPANDED = Math.round(screenHeight * 0.82);

  const animatedHeight = useRef(new Animated.Value(
    initialHeightState === 'collapsed'
      ? HEIGHT_COLLAPSED
      : initialHeightState === 'expanded'
      ? HEIGHT_EXPANDED
      : HEIGHT_HALF
  )).current;

  const logsScrollRef = useRef<ScrollView>(null);

  // Transition height animation
  const animateToHeight = (targetState: DrawerHeightState) => {
    setHeightState(targetState);
    let toValue = HEIGHT_HALF;
    if (targetState === 'collapsed') toValue = HEIGHT_COLLAPSED;
    if (targetState === 'expanded') toValue = HEIGHT_EXPANDED;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}

    Animated.spring(animatedHeight, {
      toValue,
      useNativeDriver: false,
      friction: 9,
      tension: 50,
    }).start();
  };

  // Toggle between half and expanded
  const handleToggleExpand = () => {
    if (heightState === 'collapsed') {
      animateToHeight('half');
    } else if (heightState === 'half') {
      animateToHeight('expanded');
    } else {
      animateToHeight('half');
    }
  };

  // Switch tabs
  const handleSelectTab = (tab: DevToolsTab) => {
    setActiveTab(tab);
    if (heightState === 'collapsed') {
      animateToHeight('half');
    }
    try {
      Haptics.selectionAsync().catch(() => {});
    } catch {}
  };

  // Streaming log simulator
  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      const randomSample =
        STREAMING_SAMPLE_LOGS[Math.floor(Math.random() * STREAMING_SAMPLE_LOGS.length)];
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now
        .getMilliseconds()
        .toString()
        .padStart(3, '0')}`;

      const newLog: LogEntry = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: timeStr,
        level: randomSample.level,
        tag: randomSample.tag,
        message: randomSample.message,
        details: randomSample.details,
      };

      setLogs((prev) => [...prev, newLog]);
    }, 7000);

    return () => clearInterval(interval);
  }, [isStreaming]);

  // Log filter counts
  const errorLogsCount = logs.filter((l) => l.level === 'ERROR').length;
  const warnLogsCount = logs.filter((l) => l.level === 'WARN').length;
  const buildLogsCount = logs.filter((l) => l.level === 'BUILD').length;
  const infoLogsCount = logs.filter((l) => l.level === 'INFO').length;

  // Filtered logs
  const filteredLogs = logs.filter((log) => {
    if (logFilter !== 'ALL' && log.level !== logFilter) return false;
    if (logSearchQuery.trim()) {
      const query = logSearchQuery.toLowerCase();
      const matchText = `${log.tag} ${log.message} ${log.details || ''}`.toLowerCase();
      return matchText.includes(query);
    }
    return true;
  });

  // Clear logs
  const handleClearLogs = () => {
    setLogs([]);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}
  };

  // Copy logs
  const handleCopyLogs = () => {
    const text = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.level}] [${l.tag}] ${l.message}`)
      .join('\n');
    Clipboard.setString(text);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {}
  };

  // Inject a test log
  const handleAddTestLog = () => {
    const testLevels: Array<'INFO' | 'WARN' | 'ERROR' | 'BUILD'> = ['BUILD', 'WARN', 'ERROR'];
    const selectedLevel = testLevels[Math.floor(Math.random() * testLevels.length)];
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now
      .getMilliseconds()
      .toString()
      .padStart(3, '0')}`;

    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: timeStr,
      level: selectedLevel,
      tag: 'UserTest',
      message: `Manual test log triggered by developer at ${timeStr}`,
      details: selectedLevel === 'ERROR' ? 'Sample stack trace: at DevTools.tsx:321:12' : undefined,
    };

    setLogs((prev) => [...prev, newLog]);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch {}
  };

  // Color helper for log level
  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return colors.error;
      case 'WARN':
        return colors.warning;
      case 'BUILD':
        return colors.accentCyan;
      case 'INFO':
      default:
        return colors.info;
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.drawerContainer,
        { height: animatedHeight },
        containerStyle,
        style,
      ]}
    >
      {/* Top Drag / Header Bar */}
      <View style={styles.drawerHeader}>
        {/* Left: Drag indicator & Tabs */}
        <View style={styles.headerLeft}>
          {/* Tab 1: Git */}
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'git' && styles.tabButtonActive]}
            onPress={() => handleSelectTab('git')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="git-branch"
              size={14}
              color={activeTab === 'git' ? colors.accentPrimary : colors.textSecondary}
            />
            <Text
              style={[styles.tabButtonText, activeTab === 'git' && styles.tabButtonTextActive]}
            >
              Git
            </Text>
            <View style={[styles.tabBadge, activeTab === 'git' && styles.tabBadgeActive]}>
              <Text style={styles.tabBadgeText}>3</Text>
            </View>
          </TouchableOpacity>

          {/* Tab 2: Terminal */}
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'terminal' && styles.tabButtonActive]}
            onPress={() => handleSelectTab('terminal')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="terminal-outline"
              size={14}
              color={activeTab === 'terminal' ? colors.accentCyan : colors.textSecondary}
            />
            <Text
              style={[styles.tabButtonText, activeTab === 'terminal' && styles.tabButtonTextActive]}
            >
              Terminal
            </Text>
          </TouchableOpacity>

          {/* Tab 3: Logs */}
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'logs' && styles.tabButtonActive]}
            onPress={() => handleSelectTab('logs')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="receipt-outline"
              size={14}
              color={activeTab === 'logs' ? colors.accentPurple : colors.textSecondary}
            />
            <Text
              style={[styles.tabButtonText, activeTab === 'logs' && styles.tabButtonTextActive]}
            >
              Logs
            </Text>
            {errorLogsCount > 0 && (
              <View style={[styles.tabBadge, styles.errorBadge]}>
                <Text style={styles.tabBadgeText}>{errorLogsCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Right: Window Controls */}
        <View style={styles.headerRight}>
          {/* Height State Controls */}
          {heightState === 'collapsed' ? (
            <TouchableOpacity
              style={styles.controlIconBtn}
              onPress={() => animateToHeight('half')}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-up" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          ) : (
            <>
              {/* Expand / Half toggle */}
              <TouchableOpacity
                style={styles.controlIconBtn}
                onPress={handleToggleExpand}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={heightState === 'expanded' ? 'contract-outline' : 'expand-outline'}
                  size={16}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              {/* Minimize to dock bar */}
              <TouchableOpacity
                style={styles.controlIconBtn}
                onPress={() => animateToHeight('collapsed')}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </>
          )}

          {/* Close button */}
          <TouchableOpacity
            style={styles.controlIconBtn}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              } catch {}
              if (onClose) onClose();
              else if (onToggle) onToggle(false);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area (Hidden if Collapsed) */}
      {heightState !== 'collapsed' && (
        <View style={styles.drawerBody}>
          {/* TAB 1: GIT STATUS */}
          {activeTab === 'git' && (
            <GitStatus
              projectId={projectId}
              currentBranch={currentBranch}
              onBranchChange={onBranchChange}
            />
          )}

          {/* TAB 2: TERMINAL */}
          {activeTab === 'terminal' && (
            <Terminal projectId={projectId} currentBranch={currentBranch} />
          )}

          {/* TAB 3: BUILD & ERROR LOGS */}
          {activeTab === 'logs' && (
            <View style={styles.logsView}>
              {/* Logs Sub-Toolbar */}
              <View style={styles.logsSubHeader}>
                {/* Search Bar */}
                <View style={styles.logSearchBox}>
                  <Ionicons name="search" size={13} color={colors.textMuted} />
                  <TextInput
                    style={styles.logSearchInput}
                    placeholder="Filter logs..."
                    placeholderTextColor={colors.textMuted}
                    value={logSearchQuery}
                    onChangeText={setLogSearchQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {logSearchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setLogSearchQuery('')}>
                      <Ionicons name="close-circle" size={14} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Actions: Streaming toggle, Add Test Log, Clear, Copy */}
                <View style={styles.logsActionsRow}>
                  <TouchableOpacity
                    style={[styles.logActionBtn, isStreaming && styles.logActionBtnStreaming]}
                    onPress={() => setIsStreaming((prev) => !prev)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isStreaming ? 'pause' : 'play'}
                      size={12}
                      color={isStreaming ? colors.accentCyan : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.logActionBtnText,
                        isStreaming && { color: colors.accentCyan },
                      ]}
                    >
                      {isStreaming ? 'Streaming' : 'Paused'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.logActionBtn}
                    onPress={handleAddTestLog}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={14} color={colors.textSecondary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.logActionBtn}
                    onPress={handleCopyLogs}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="copy-outline" size={13} color={colors.textSecondary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.logActionBtn}
                    onPress={handleClearLogs}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={13} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Filter Pills */}
              <View style={styles.filterPillsRow}>
                <TouchableOpacity
                  style={[styles.pill, logFilter === 'ALL' && styles.pillActive]}
                  onPress={() => setLogFilter('ALL')}
                >
                  <Text style={[styles.pillText, logFilter === 'ALL' && styles.pillTextActive]}>
                    ALL ({logs.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.pill, logFilter === 'ERROR' && styles.pillActive]}
                  onPress={() => setLogFilter('ERROR')}
                >
                  <View
                    style={[styles.dot, { backgroundColor: colors.error }]}
                  />
                  <Text style={[styles.pillText, logFilter === 'ERROR' && styles.pillTextActive]}>
                    ERROR ({errorLogsCount})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.pill, logFilter === 'WARN' && styles.pillActive]}
                  onPress={() => setLogFilter('WARN')}
                >
                  <View
                    style={[styles.dot, { backgroundColor: colors.warning }]}
                  />
                  <Text style={[styles.pillText, logFilter === 'WARN' && styles.pillTextActive]}>
                    WARN ({warnLogsCount})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.pill, logFilter === 'BUILD' && styles.pillActive]}
                  onPress={() => setLogFilter('BUILD')}
                >
                  <View
                    style={[styles.dot, { backgroundColor: colors.accentCyan }]}
                  />
                  <Text style={[styles.pillText, logFilter === 'BUILD' && styles.pillTextActive]}>
                    BUILD ({buildLogsCount})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.pill, logFilter === 'INFO' && styles.pillActive]}
                  onPress={() => setLogFilter('INFO')}
                >
                  <View
                    style={[styles.dot, { backgroundColor: colors.info }]}
                  />
                  <Text style={[styles.pillText, logFilter === 'INFO' && styles.pillTextActive]}>
                    INFO ({infoLogsCount})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Logs Streaming Feed */}
              <ScrollView
                ref={logsScrollRef}
                style={styles.logsList}
                contentContainerStyle={{ paddingBottom: spacing.lg }}
                showsVerticalScrollIndicator
              >
                {filteredLogs.length === 0 ? (
                  <View style={styles.emptyLogsView}>
                    <Ionicons name="receipt-outline" size={28} color={colors.textMuted} />
                    <Text style={styles.emptyLogsText}>
                      {logSearchQuery ? 'No logs matching query' : 'No logs recorded'}
                    </Text>
                  </View>
                ) : (
                  filteredLogs.map((log) => {
                    const isExpanded = expandedLogId === log.id;
                    const levelColor = getLogLevelColor(log.level);

                    return (
                      <TouchableOpacity
                        key={log.id}
                        style={[
                          styles.logCard,
                          log.level === 'ERROR' && styles.logCardError,
                          log.level === 'WARN' && styles.logCardWarn,
                        ]}
                        onPress={() => setExpandedLogId(isExpanded ? null : log.id)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.logCardHeader}>
                          {/* Level badge */}
                          <View
                            style={[
                              styles.logLevelBadge,
                              { backgroundColor: levelColor + '20', borderColor: levelColor },
                            ]}
                          >
                            <Text style={[styles.logLevelText, { color: levelColor }]}>
                              {log.level}
                            </Text>
                          </View>

                          {/* Tag */}
                          <Text style={styles.logTag}>[{log.tag}]</Text>

                          {/* Timestamp */}
                          <Text style={styles.logTimestamp}>{log.timestamp}</Text>
                        </View>

                        {/* Message */}
                        <Text style={styles.logMessage} numberOfLines={isExpanded ? undefined : 3}>
                          {log.message}
                        </Text>

                        {/* Expanded details if present */}
                        {isExpanded && log.details && (
                          <View style={styles.logDetailsBox}>
                            <Text style={styles.logDetailsText}>{log.details}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  drawerContainer: {
    backgroundColor: colors.bgPrimary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  drawerHeader: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  tabButtonActive: {
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tabButtonText: {
    fontSize: fontSizes.xs + 1,
    fontFamily: fontFamilies.sans,
    color: colors.textSecondary,
    fontWeight: fontWeights.medium,
  },
  tabButtonTextActive: {
    color: colors.textPrimary,
    fontWeight: fontWeights.semibold,
  },
  tabBadge: {
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBadgeActive: {
    backgroundColor: colors.accentPrimaryAlpha,
    borderColor: colors.accentPrimary,
  },
  tabBadgeText: {
    fontSize: 9,
    fontFamily: fontFamilies.mono,
    color: colors.textPrimary,
    fontWeight: fontWeights.bold,
  },
  errorBadge: {
    backgroundColor: 'rgba(248, 81, 73, 0.25)',
    borderColor: colors.error,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  controlIconBtn: {
    padding: 6,
    borderRadius: radius.xs,
  },
  drawerBody: {
    flex: 1,
  },
  // IDE Header quick toggle button
  headerToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerToggleBtnActive: {
    backgroundColor: colors.accentPrimaryAlpha,
    borderColor: colors.accentPrimary,
  },
  headerToggleText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
    color: colors.textSecondary,
    fontWeight: fontWeights.medium,
  },
  headerToggleTextActive: {
    color: colors.accentPrimary,
    fontWeight: fontWeights.semibold,
  },
  errorDotBadge: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.error,
  },
  gitDotBadge: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentCyan,
  },
  // LOGS STYLES
  logsView: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  logsSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  logSearchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 4,
    gap: 4,
  },
  logSearchInput: {
    flex: 1,
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.mono,
    color: colors.textPrimary,
    padding: 0,
  },
  logsActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: spacing.xs + 3,
    paddingVertical: 5,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logActionBtnStreaming: {
    backgroundColor: 'rgba(57, 197, 207, 0.15)',
    borderColor: colors.accentCyan,
  },
  logActionBtnText: {
    fontSize: 10,
    fontFamily: fontFamilies.mono,
    color: colors.textSecondary,
  },
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    gap: spacing.xs,
    backgroundColor: colors.bgPrimary,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.xs + 4,
    paddingVertical: 3,
    borderRadius: radius.sm,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.bgActive,
    borderColor: colors.borderFocus,
  },
  pillText: {
    fontSize: 10,
    fontFamily: fontFamilies.mono,
    color: colors.textMuted,
  },
  pillTextActive: {
    color: colors.textPrimary,
    fontWeight: fontWeights.semibold,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  logsList: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
  emptyLogsView: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  emptyLogsText: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontFamily: fontFamilies.mono,
  },
  logCard: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.sm,
    padding: spacing.xs + 2,
    marginBottom: spacing.xs,
  },
  logCardError: {
    borderColor: 'rgba(248, 81, 73, 0.35)',
    backgroundColor: 'rgba(248, 81, 73, 0.08)',
  },
  logCardWarn: {
    borderColor: 'rgba(210, 153, 34, 0.35)',
    backgroundColor: 'rgba(210, 153, 34, 0.08)',
  },
  logCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  logLevelBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 1,
  },
  logLevelText: {
    fontSize: 9,
    fontFamily: fontFamilies.mono,
    fontWeight: fontWeights.bold,
  },
  logTag: {
    fontSize: 11,
    fontFamily: fontFamilies.mono,
    color: colors.textSecondary,
    fontWeight: fontWeights.semibold,
  },
  logTimestamp: {
    fontSize: 10,
    fontFamily: fontFamilies.mono,
    color: colors.textMuted,
    marginLeft: 'auto',
  },
  logMessage: {
    fontSize: 11,
    fontFamily: fontFamilies.mono,
    color: colors.textCode,
    lineHeight: 16,
  },
  logDetailsBox: {
    marginTop: spacing.xs,
    padding: spacing.xs,
    backgroundColor: colors.bgCode,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logDetailsText: {
    fontSize: 10,
    fontFamily: fontFamilies.mono,
    color: colors.error,
    lineHeight: 14,
  },
});

export default DevTools;
