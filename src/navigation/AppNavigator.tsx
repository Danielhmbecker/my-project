import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  StatusBar,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { colors } from '../theme/colors';
import { spacing, radius, shadows } from '../theme/spacing';
import { fontSizes, fontWeights } from '../theme/typography';
import { TabType, Project, ProjectFile } from '../models/types';
import { Header, HeaderStatusType } from './Header';
import { BottomTabBar } from './BottomTabBar';

// Import Screens from feature modules
import { HomeScreen } from '../screens/home/HomeScreen';
import { ProjectsScreen } from '../screens/projects/ProjectsScreen';
import { ProjectDetailScreen } from '../screens/projects/ProjectDetailScreen';
import { AgentsScreen } from '../screens/agents/AgentsScreen';
import { SkillsScreen } from '../screens/skills/SkillsScreen';
import { ToolsScreen } from '../screens/tools/ToolsScreen';
import { DeployScreen } from '../screens/deploy/DeployScreen';
import { ArenaWorkspaceScreen } from '../screens/arena/ArenaWorkspaceScreen';
import { LivePreviewScreen } from '../screens/preview/LivePreviewScreen';
import { DesignStudioScreen } from '../screens/design/DesignStudioScreen';
import { WorkflowsScreen } from '../screens/workflows/WorkflowsScreen';

// Import IDE Components
import { CodeEditor } from '../screens/ide/CodeEditor';
import { FileExplorer } from '../screens/ide/FileExplorer';
import { DevTools, DevToolsHeaderButton } from '../screens/ide/DevTools';

// ============================================================================
// Types
// ============================================================================

export type ScreenType =
  | TabType
  | 'project-detail'
  | 'skills'
  | 'workflows'
  | 'design'
  | 'arena'
  | 'preview'
  | 'deploy';

export type ModalType =
  | 'deploy'
  | 'arena'
  | 'preview'
  | 'design'
  | 'workflows'
  | 'notifications'
  | 'file-explorer';

export interface HistoryItem {
  screen: ScreenType;
  params?: Record<string, any>;
  tab?: TabType;
}

export interface NavigationContextValue {
  activeTab: TabType;
  currentScreen: ScreenType;
  screenParams: Record<string, any>;
  canGoBack: boolean;
  activeModal: ModalType | null;
  modalParams: Record<string, any>;
  systemStatus: HeaderStatusType;
  statusMessage?: string;
  notificationsCount: number;
  activeAgentsCount: number;
  activeProjectId?: string | null;

  // Actions
  navigate: (screen: ScreenType, params?: Record<string, any>) => void;
  switchTab: (tab: TabType) => void;
  goBack: () => void;
  openModal: (modal: ModalType, params?: Record<string, any>) => void;
  closeModal: () => void;
  setSystemStatus: (status: HeaderStatusType, message?: string) => void;
  setNotificationsCount: (count: number | ((prev: number) => number)) => void;
  setActiveAgentsCount: (count: number) => void;
  setActiveProjectId: (id: string | null) => void;
}

// ============================================================================
// Navigation Context & Hook
// ============================================================================

const NavigationContext = createContext<NavigationContextValue | null>(null);

export const useNavigation = (): NavigationContextValue => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within an AppNavigator or NavigationProvider');
  }
  return context;
};

// ============================================================================
// Notifications Sheet Component
// ============================================================================

interface NotificationItem {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  type: 'build' | 'agent' | 'git' | 'system';
  unread: boolean;
}

const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'QA Agent Passed Verification',
    subtitle: 'NEXA Finance end-to-end tests completed with 0 errors.',
    time: '2m ago',
    type: 'agent',
    unread: true,
  },
  {
    id: 'notif-2',
    title: 'Metro Bundler Connected',
    subtitle: 'Fast Refresh active on port 8081 for iOS simulator.',
    time: '14m ago',
    type: 'system',
    unread: true,
  },
  {
    id: 'notif-3',
    title: 'EAS Build #108 Queued',
    subtitle: 'Production iOS build submitted to EAS cloud workers.',
    time: '45m ago',
    type: 'build',
    unread: true,
  },
  {
    id: 'notif-4',
    title: 'Architect Agent Generated Plan',
    subtitle: 'Multi-agent orchestration DAG created for E-Commerce app.',
    time: '2h ago',
    type: 'agent',
    unread: false,
  },
];

const NotificationsModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onClearAll: () => void;
}> = ({ visible, onClose, onClearAll }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(SAMPLE_NOTIFICATIONS);

  const getIconForType = (type: NotificationItem['type']) => {
    switch (type) {
      case 'build':
        return { name: 'cloud-upload' as const, color: colors.accentPrimary };
      case 'agent':
        return { name: 'hardware-chip' as const, color: colors.accentPurple };
      case 'git':
        return { name: 'git-commit' as const, color: colors.accentCyan };
      default:
        return { name: 'notifications' as const, color: colors.success };
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        </View>
        <View style={styles.notificationsSheet}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitleRow}>
              <Ionicons name="notifications" size={18} color={colors.accentPrimary} />
              <Text style={styles.sheetTitle}>Studio Notifications</Text>
            </View>
            <View style={styles.sheetActionsRow}>
              <TouchableOpacity
                onPress={() => {
                  setNotifications([]);
                  onClearAll();
                }}
                style={styles.sheetHeaderButton}
              >
                <Text style={styles.sheetHeaderButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.sheetCloseButton}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.notificationsList}>
            {notifications.length === 0 ? (
              <View style={styles.emptyNotifications}>
                <Ionicons name="checkmark-done-circle-outline" size={40} color={colors.textMuted} />
                <Text style={styles.emptyNotificationsText}>All caught up!</Text>
                <Text style={styles.emptyNotificationsSubtext}>No unread notifications.</Text>
              </View>
            ) : (
              notifications.map((item) => {
                const icon = getIconForType(item.type);
                return (
                  <View key={item.id} style={[styles.notifCard, item.unread && styles.notifCardUnread]}>
                    <View style={[styles.notifIconBadge, { backgroundColor: icon.color + '20' }]}>
                      <Ionicons name={icon.name} size={16} color={icon.color} />
                    </View>
                    <View style={styles.notifContent}>
                      <View style={styles.notifHeader}>
                        <Text style={styles.notifTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.notifTime}>{item.time}</Text>
                      </View>
                      <Text style={styles.notifSubtitle} numberOfLines={2}>
                        {item.subtitle}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ============================================================================
// Integrated IDE Workspace Screen Component
// ============================================================================

const IntegratedIDEScreen: React.FC<{
  onOpenPreview?: () => void;
  onOpenDeploy?: () => void;
  initialProjectId?: string;
}> = ({ onOpenPreview, onOpenDeploy, initialProjectId }) => {
  const [showExplorer, setShowExplorer] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
  const [activeFileId, setActiveFileId] = useState<string | undefined>(undefined);

  return (
    <View style={styles.ideContainer}>
      {/* Code Editor occupies primary space */}
      <View style={styles.ideEditorWrapper}>
        <CodeEditor
          activeFileId={activeFileId}
          onFileSelect={(id) => setActiveFileId(id)}
          onToggleExplorer={() => setShowExplorer((prev) => !prev)}
          onToggleDevTools={() => setShowDevTools((prev) => !prev)}
          onRunPreview={onOpenPreview}
        />
      </View>

      {/* File Explorer Slide-in Drawer Modal */}
      <Modal
        visible={showExplorer}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExplorer(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setShowExplorer(false)}
            activeOpacity={1}
          />
          <View style={styles.explorerSheet}>
            <View style={styles.explorerHeader}>
              <View style={styles.sheetTitleRow}>
                <Ionicons name="folder-open-outline" size={18} color={colors.accentPrimary} />
                <Text style={styles.sheetTitle}>Project File Explorer</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowExplorer(false)}
                style={styles.sheetCloseButton}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.explorerBody}>
              <FileExplorer
                projectId={initialProjectId || 'demo-proj-1'}
                onSelectFile={(file) => {
                  setActiveFileId(file.id);
                  setShowExplorer(false);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* DevTools Bottom Drawer (Terminal, Git, Logs) */}
      <DevTools
        isOpen={showDevTools}
        onClose={() => setShowDevTools(false)}
        defaultTab="terminal"
      />
    </View>
  );
};

// ============================================================================
// AppNavigator Main Shell Component
// ============================================================================

export interface AppNavigatorProps {
  initialTab?: TabType;
  initialScreen?: ScreenType;
}

export const AppNavigator: React.FC<AppNavigatorProps> = ({
  initialTab = 'home',
  initialScreen = 'home',
}) => {
  const insets = useSafeAreaInsets();

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [currentScreen, setCurrentScreen] = useState<ScreenType>(initialScreen);
  const [screenParams, setScreenParams] = useState<Record<string, any>>({});
  const [history, setHistory] = useState<HistoryItem[]>([
    { screen: initialScreen, tab: initialTab },
  ]);

  // Modal State
  const [activeModal, setActiveModal] = useState<ModalType | null>(null);
  const [modalParams, setModalParams] = useState<Record<string, any>>({});

  // System & Status State
  const [systemStatus, setSystemStatusState] = useState<HeaderStatusType>('ready');
  const [statusMessage, setStatusMessage] = useState<string | undefined>('Ready');
  const [notificationsCount, setNotificationsCount] = useState<number>(3);
  const [activeAgentsCount, setActiveAgentsCount] = useState<number>(8);
  const [activeProjectId, setActiveProjectId] = useState<string | null>('demo-proj-1');

  // ---------------------------------------------------------------------------
  // Navigation Handlers
  // ---------------------------------------------------------------------------

  const triggerHaptic = useCallback(() => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
    } catch {
      // Haptics fallback
    }
  }, []);

  const navigate = useCallback(
    (screen: ScreenType, params: Record<string, any> = {}) => {
      triggerHaptic();
      setScreenParams(params);

      // Check if screen is one of the 5 primary tabs
      const isTab = ['home', 'projects', 'ide', 'agents', 'tools'].includes(screen);
      if (isTab) {
        setActiveTab(screen as TabType);
      }

      setCurrentScreen(screen);
      setHistory((prev) => [...prev, { screen, params, tab: isTab ? (screen as TabType) : activeTab }]);
    },
    [activeTab, triggerHaptic]
  );

  const switchTab = useCallback(
    (tab: TabType) => {
      triggerHaptic();
      setActiveTab(tab);
      setCurrentScreen(tab);
      setScreenParams({});
      setActiveModal(null);
      setHistory((prev) => [...prev, { screen: tab, tab }]);
    },
    [triggerHaptic]
  );

  const goBack = useCallback(() => {
    triggerHaptic();

    // If modal is open, close it first
    if (activeModal) {
      setActiveModal(null);
      setModalParams({});
      return;
    }

    // If there is screen history
    if (history.length > 1) {
      const nextHistory = [...history];
      nextHistory.pop(); // remove current
      const previous = nextHistory[nextHistory.length - 1];

      setHistory(nextHistory);
      setCurrentScreen(previous.screen);
      setScreenParams(previous.params || {});
      if (previous.tab) {
        setActiveTab(previous.tab);
      }
    } else {
      // Fallback to active tab
      setCurrentScreen(activeTab);
      setScreenParams({});
    }
  }, [activeModal, history, activeTab, triggerHaptic]);

  const openModal = useCallback(
    (modal: ModalType, params: Record<string, any> = {}) => {
      triggerHaptic();
      setModalParams(params);
      setActiveModal(modal);
    },
    [triggerHaptic]
  );

  const closeModal = useCallback(() => {
    triggerHaptic();
    setActiveModal(null);
    setModalParams({});
  }, [triggerHaptic]);

  const setSystemStatus = useCallback(
    (status: HeaderStatusType, message?: string) => {
      setSystemStatusState(status);
      setStatusMessage(message);
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Context Value
  // ---------------------------------------------------------------------------

  const contextValue = useMemo<NavigationContextValue>(
    () => ({
      activeTab,
      currentScreen,
      screenParams,
      canGoBack: history.length > 1 || activeModal !== null || currentScreen !== activeTab,
      activeModal,
      modalParams,
      systemStatus,
      statusMessage,
      notificationsCount,
      activeAgentsCount,
      activeProjectId,
      navigate,
      switchTab,
      goBack,
      openModal,
      closeModal,
      setSystemStatus,
      setNotificationsCount,
      setActiveAgentsCount,
      setActiveProjectId,
    }),
    [
      activeTab,
      currentScreen,
      screenParams,
      history.length,
      activeModal,
      modalParams,
      systemStatus,
      statusMessage,
      notificationsCount,
      activeAgentsCount,
      activeProjectId,
      navigate,
      switchTab,
      goBack,
      openModal,
      closeModal,
      setSystemStatus,
    ]
  );

  // ---------------------------------------------------------------------------
  // Header Meta Determination
  // ---------------------------------------------------------------------------

  const getHeaderMeta = () => {
    switch (currentScreen) {
      case 'home':
        return {
          title: 'ARENA STUDIO',
          subtitle: 'Build. Design. Develop. Deploy.',
          showBack: false,
        };
      case 'projects':
        return {
          title: 'Projects',
          subtitle: 'Workspaces & Starters',
          showBack: false,
        };
      case 'project-detail':
        return {
          title: screenParams.name || 'Project Details',
          subtitle: screenParams.framework ? `Framework: ${screenParams.framework}` : 'Workspace Configuration',
          showBack: true,
          backTitle: 'Projects',
        };
      case 'ide':
        return {
          title: 'IDE Studio',
          subtitle: screenParams.filePath || 'Mobile Editor & Terminal',
          showBack: false,
        };
      case 'agents':
        return {
          title: 'AI Agent Centre',
          subtitle: `${activeAgentsCount} Specialist Agents Ready`,
          showBack: false,
        };
      case 'skills':
        return {
          title: 'Skills Library',
          subtitle: 'Development, Design, Testing, Ops',
          showBack: true,
          backTitle: 'Back',
        };
      case 'tools':
        return {
          title: 'Tools & Integrations',
          subtitle: 'Cloud Providers & Workflows',
          showBack: false,
        };
      case 'deploy':
        return {
          title: 'Build & Deploy',
          subtitle: 'EAS / Vercel / Web',
          showBack: true,
          backTitle: 'Back',
        };
      case 'arena':
        return {
          title: 'Arena.ai Workspace',
          subtitle: 'chat.arena.ai',
          showBack: true,
          backTitle: 'Studio',
        };
      case 'preview':
        return {
          title: 'Live Preview',
          subtitle: 'Metro Bundler & Diagnostics',
          showBack: true,
          backTitle: 'Back',
        };
      case 'design':
        return {
          title: 'Design Studio',
          subtitle: 'Tokens, Palettes & Components',
          showBack: true,
          backTitle: 'Back',
        };
      case 'workflows':
        return {
          title: 'Multi-Agent Workflows',
          subtitle: 'Pipeline & Task DAG',
          showBack: true,
          backTitle: 'Back',
        };
      default:
        return {
          title: 'ARENA STUDIO',
          subtitle: undefined,
          showBack: false,
        };
    }
  };

  const headerMeta = getHeaderMeta();

  // ---------------------------------------------------------------------------
  // Primary Screen Rendering
  // ---------------------------------------------------------------------------

  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <HomeScreen
            onNavigate={(screen, params) => navigate(screen as ScreenType, params)}
            onOpenNewProject={() => navigate('projects', { openCreate: true })}
            onOpenIDE={(project) => {
              if (project) setActiveProjectId(project.id);
              navigate('ide', { projectId: project?.id });
            }}
            onOpenPreview={(project) => {
              if (project) setActiveProjectId(project.id);
              openModal('preview', { project });
            }}
            onOpenDeploy={() => openModal('deploy')}
            onOpenArena={() => openModal('arena')}
            onOpenWorkflows={() => openModal('workflows')}
            onOpenAgents={() => switchTab('agents')}
            onSelectProject={(project) => {
              setActiveProjectId(project.id);
              navigate('project-detail', { projectId: project.id, project, name: project.name, framework: project.framework });
            }}
            onSelectAgent={() => switchTab('agents')}
            onSelectWorkflow={() => openModal('workflows')}
          />
        );

      case 'projects':
        return (
          <ProjectsScreen
            onSelectProject={(project) => {
              setActiveProjectId(project.id);
              navigate('project-detail', { projectId: project.id, project, name: project.name, framework: project.framework });
            }}
            onViewDetails={(project) => {
              setActiveProjectId(project.id);
              navigate('project-detail', { projectId: project.id, project, name: project.name, framework: project.framework });
            }}
            onOpenIDE={(project) => {
              setActiveProjectId(project.id);
              navigate('ide', { projectId: project.id });
            }}
            onLaunchPreview={(project) => {
              setActiveProjectId(project.id);
              openModal('preview', { project });
            }}
          />
        );

      case 'project-detail':
        return (
          <ProjectDetailScreen
            projectId={screenParams.projectId || activeProjectId || 'demo-proj-1'}
            project={screenParams.project}
            onBack={goBack}
            onOpenIDE={(project) => {
              setActiveProjectId(project.id);
              navigate('ide', { projectId: project.id });
            }}
            onLaunchPreview={(project) => {
              setActiveProjectId(project.id);
              openModal('preview', { project });
            }}
            onProjectDeleted={() => {
              navigate('projects');
            }}
          />
        );

      case 'ide':
        return (
          <IntegratedIDEScreen
            initialProjectId={screenParams.projectId || activeProjectId || 'demo-proj-1'}
            onOpenPreview={() => openModal('preview')}
            onOpenDeploy={() => openModal('deploy')}
          />
        );

      case 'agents':
        return <AgentsScreen />;

      case 'skills':
        return <SkillsScreen />;

      case 'tools':
        return <ToolsScreen />;

      case 'deploy':
        return <DeployScreen />;

      case 'arena':
        return <ArenaWorkspaceScreen onBack={goBack} />;

      case 'preview':
        return <LivePreviewScreen />;

      case 'design':
        return <DesignStudioScreen />;

      case 'workflows':
        return <WorkflowsScreen />;

      default:
        return (
          <HomeScreen
            onNavigate={(screen, params) => navigate(screen as ScreenType, params)}
          />
        );
    }
  };

  // ---------------------------------------------------------------------------
  // Modal Overlays Rendering (Accessible from anywhere)
  // ---------------------------------------------------------------------------

  const renderActiveModal = () => {
    if (!activeModal) return null;

    switch (activeModal) {
      case 'deploy':
        return (
          <Modal visible transparent animationType="slide" onRequestClose={closeModal}>
            <View style={styles.fullModalWrapper}>
              <Header
                title="Build & Deploy"
                subtitle="Cloud Pipeline & EAS Runners"
                isModal
                onClose={closeModal}
                showStatus={false}
                showActions={false}
              />
              <View style={styles.modalContentArea}>
                <DeployScreen />
              </View>
            </View>
          </Modal>
        );

      case 'arena':
        return (
          <Modal visible transparent animationType="slide" onRequestClose={closeModal}>
            <View style={styles.fullModalWrapper}>
              <ArenaWorkspaceScreen onBack={closeModal} />
            </View>
          </Modal>
        );

      case 'preview':
        return (
          <Modal visible transparent animationType="slide" onRequestClose={closeModal}>
            <View style={styles.fullModalWrapper}>
              <Header
                title="Live iOS Preview"
                subtitle="Metro Bundler & Simulator Console"
                isModal
                onClose={closeModal}
                showStatus={false}
                showActions={false}
              />
              <View style={styles.modalContentArea}>
                <LivePreviewScreen />
              </View>
            </View>
          </Modal>
        );

      case 'design':
        return (
          <Modal visible transparent animationType="slide" onRequestClose={closeModal}>
            <View style={styles.fullModalWrapper}>
              <Header
                title="Design Studio"
                subtitle="Tokens, Palettes & Components"
                isModal
                onClose={closeModal}
                showStatus={false}
                showActions={false}
              />
              <View style={styles.modalContentArea}>
                <DesignStudioScreen />
              </View>
            </View>
          </Modal>
        );

      case 'workflows':
        return (
          <Modal visible transparent animationType="slide" onRequestClose={closeModal}>
            <View style={styles.fullModalWrapper}>
              <Header
                title="Multi-Agent Workflows"
                subtitle="Task DAG & Real-Time Orchestration"
                isModal
                onClose={closeModal}
                showStatus={false}
                showActions={false}
              />
              <View style={styles.modalContentArea}>
                <WorkflowsScreen />
              </View>
            </View>
          </Modal>
        );

      default:
        return null;
    }
  };

  // Determine if persistent bottom bar should be shown
  const isTabBarVisible = !['arena'].includes(currentScreen) && activeModal === null;

  return (
    <NavigationContext.Provider value={contextValue}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgSecondary} />
      <KeyboardAvoidingView
        style={styles.rootContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Global Header (hidden for ArenaWorkspace which has its own custom browser bar) */}
        {currentScreen !== 'arena' && (
          <Header
            title={headerMeta.title}
            subtitle={headerMeta.subtitle}
            showBack={headerMeta.showBack}
            onBack={goBack}
            backTitle={headerMeta.backTitle}
            showStatus={true}
            status={systemStatus}
            statusText={statusMessage}
            showActions={true}
            unreadCount={notificationsCount}
            onOpenNotifications={() => openModal('notifications')}
            onOpenPreview={() => openModal('preview')}
            onOpenDeploy={() => openModal('deploy')}
            onOpenArena={() => openModal('arena')}
            onOpenWorkflows={() => openModal('workflows')}
          />
        )}

        {/* Screen Container */}
        <View style={styles.mainContentContainer}>{renderActiveScreen()}</View>

        {/* Persistent Bottom Tab Bar */}
        <BottomTabBar
          activeTab={activeTab}
          onTabPress={switchTab}
          hidden={!isTabBarVisible}
          badges={{
            agents: activeAgentsCount > 0 ? activeAgentsCount : false,
          }}
        />

        {/* Quick Modal Overlays */}
        {renderActiveModal()}

        {/* Notifications Sheet */}
        <NotificationsModal
          visible={activeModal === 'notifications'}
          onClose={closeModal}
          onClearAll={() => setNotificationsCount(0)}
        />
      </KeyboardAvoidingView>
    </NavigationContext.Provider>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  mainContentContainer: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  ideContainer: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  ideEditorWrapper: {
    flex: 1,
  },
  fullModalWrapper: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  modalContentArea: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  notificationsSheet: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: '75%',
    paddingBottom: spacing.xl,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sheetTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
  },
  sheetActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sheetHeaderButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.bgTertiary,
  },
  sheetHeaderButtonText: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
  },
  sheetCloseButton: {
    padding: 4,
  },
  notificationsList: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  notifCardUnread: {
    borderColor: colors.accentPrimary + '60',
    backgroundColor: colors.bgElevated,
  },
  notifIconBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  notifTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    flex: 1,
    marginRight: spacing.sm,
  },
  notifTime: {
    color: colors.textMuted,
    fontSize: fontSizes.xs - 2,
  },
  notifSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    lineHeight: 16,
  },
  emptyNotifications: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyNotificationsText: {
    color: colors.textPrimary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    marginTop: spacing.sm,
  },
  emptyNotificationsSubtext: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    marginTop: 2,
  },
  explorerSheet: {
    backgroundColor: colors.bgSecondary,
    height: '80%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  explorerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  explorerBody: {
    flex: 1,
  },
});

export default AppNavigator;
