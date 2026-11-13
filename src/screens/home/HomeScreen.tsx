import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes, fontWeights } from '../../theme/typography';
import { radius, spacing, shadows } from '../../theme/spacing';
import {
  Project,
  Agent,
  Workflow,
  AgentActivity,
} from '../../models/types';
import {
  getProjects,
  getAgents,
  getWorkflows,
  INITIAL_PROJECTS,
  INITIAL_AGENTS,
  INITIAL_WORKFLOWS,
} from '../../storage';
import { ProjectCard } from './ProjectCard';
import { ActivitySummary } from './ActivitySummary';

export interface HomeScreenProps {
  navigation?: any;
  onNavigate?: (screen: string, params?: any) => void;
  onOpenNewProject?: () => void;
  onOpenIDE?: (project?: Project) => void;
  onOpenPreview?: (project?: Project) => void;
  onOpenDeploy?: () => void;
  onOpenArena?: () => void;
  onOpenWorkflows?: () => void;
  onOpenAgents?: () => void;
  onSelectProject?: (project: Project) => void;
  onSelectAgent?: (agent: Agent) => void;
  onSelectWorkflow?: (workflow: Workflow) => void;
}

export type ProjectFilterType = 'all' | 'demo' | 'custom';
export type ViewModeType = 'carousel' | 'list';

interface StudioNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'success' | 'info' | 'warning';
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  navigation,
  onNavigate,
  onOpenNewProject,
  onOpenIDE,
  onOpenPreview,
  onOpenDeploy,
  onOpenArena,
  onOpenWorkflows,
  onOpenAgents,
  onSelectProject,
  onSelectAgent,
  onSelectWorkflow,
}) => {
  const insets = useSafeAreaInsets();

  // State
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [workflows, setWorkflows] = useState<Workflow[]>(INITIAL_WORKFLOWS);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<ProjectFilterType>('all');
  const [viewMode, setViewMode] = useState<ViewModeType>('carousel');

  // Modals
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState<StudioNotification[]>([
    {
      id: 'notif-1',
      title: 'Build Passed',
      message: 'NEXA Finance Expo bundle build completed successfully (v1.0.4).',
      time: '12m ago',
      read: false,
      type: 'success',
    },
    {
      id: 'notif-2',
      title: 'Agent Task Completed',
      message: 'Architect Agent verified storage schema and interface contracts.',
      time: '35m ago',
      read: false,
      type: 'info',
    },
    {
      id: 'notif-3',
      title: 'Git Branch Sync',
      message: 'Remote repository synced with origin/main branch.',
      time: '1h ago',
      read: true,
      type: 'info',
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Unified Navigation Handler
  const handleNavigate = useCallback(
    (screen: string, params?: any) => {
      try {
        Haptics.selectionAsync();
      } catch {}

      if (onNavigate) {
        onNavigate(screen, params);
      } else if (navigation?.navigate) {
        navigation.navigate(screen, params);
      }
    },
    [navigation, onNavigate]
  );

  // Load data from storage
  const loadData = useCallback(async () => {
    try {
      const [storedProjects, storedAgents, storedWorkflows] = await Promise.all([
        getProjects().catch(() => INITIAL_PROJECTS),
        getAgents().catch(() => INITIAL_AGENTS),
        getWorkflows().catch(() => INITIAL_WORKFLOWS),
      ]);

      if (storedProjects && storedProjects.length > 0) {
        setProjects(storedProjects);
      }
      if (storedAgents && storedAgents.length > 0) {
        setAgents(storedAgents);
      }
      if (storedWorkflows && storedWorkflows.length > 0) {
        setWorkflows(storedWorkflows);
      }
    } catch (err) {
      // Fallback to initial seeds
      setProjects(INITIAL_PROJECTS);
      setAgents(INITIAL_AGENTS);
      setWorkflows(INITIAL_WORKFLOWS);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    await loadData();
    setRefreshing(false);
  };

  // Filtered projects
  const filteredProjects = projects.filter((p) => {
    if (filter === 'demo') return p.isDemo;
    if (filter === 'custom') return !p.isDemo;
    return true;
  });

  // Action Bar Handlers
  const handleNewProjectPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    if (onOpenNewProject) {
      onOpenNewProject();
    } else {
      handleNavigate('projects', { openCreateModal: true });
    }
  };

  const handleOpenIDEPress = (project?: Project) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const targetProject = project || projects[0];
    if (onOpenIDE) {
      onOpenIDE(targetProject);
    } else {
      handleNavigate('ide', { projectId: targetProject?.id });
    }
  };

  const handleLaunchPreviewPress = (project?: Project) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const targetProject = project || projects[0];
    if (onOpenPreview) {
      onOpenPreview(targetProject);
    } else {
      handleNavigate('preview', { projectId: targetProject?.id });
    }
  };

  const handleProjectSelect = (project: Project) => {
    if (onSelectProject) {
      onSelectProject(project);
    } else {
      handleOpenIDEPress(project);
    }
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

  return (
    <View style={[styles.rootContainer, { paddingTop: Math.max(insets.top, 16) }]}>
      {/* ==================================================================== */}
      {/* TOP BRANDING BAR                                                     */}
      {/* ==================================================================== */}
      <View style={styles.brandingBar}>
        <View style={styles.brandingLeft}>
          <View style={styles.logoBadge}>
            <Ionicons name="terminal" size={16} color={colors.accentPrimary} />
          </View>
          <View>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandTitle}>ARENA</Text>
              <Text style={styles.brandTitleAccent}>STUDIO</Text>
              <View style={styles.proTag}>
                <Text style={styles.proTagText}>PRO</Text>
              </View>
            </View>
            <Text style={styles.brandTagline}>Build. Design. Develop. Deploy.</Text>
          </View>
        </View>

        {/* User avatar & Notification bell */}
        <View style={styles.brandingRight}>
          {/* Notification Bell */}
          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            onPress={() => {
              try {
                Haptics.selectionAsync();
              } catch {}
              setShowNotificationsModal(true);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* User Avatar */}
          <TouchableOpacity
            style={styles.avatarButton}
            activeOpacity={0.8}
            onPress={() => {
              try {
                Haptics.selectionAsync();
              } catch {}
              setShowProfileModal(true);
            }}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>AS</Text>
            </View>
            <View style={styles.avatarOnlineDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ==================================================================== */}
      {/* MAIN SCROLLABLE CONTENT                                              */}
      {/* ==================================================================== */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 60 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accentPrimary}
            colors={[colors.accentPrimary]}
          />
        }
      >
        {/* ==================================================================== */}
        {/* PRIMARY QUICK ACTION BAR                                             */}
        {/* ==================================================================== */}
        <View style={styles.quickActionBar}>
          {/* + New Project */}
          <TouchableOpacity
            style={[styles.primaryActionBtn, styles.newProjectBtn]}
            activeOpacity={0.85}
            onPress={handleNewProjectPress}
          >
            <View style={styles.actionIconCircle}>
              <Ionicons name="add" size={18} color={colors.white} />
            </View>
            <Text style={styles.primaryActionBtnText}>+ New Project</Text>
          </TouchableOpacity>

          {/* Open IDE */}
          <TouchableOpacity
            style={[styles.primaryActionBtn, styles.openIdeBtn]}
            activeOpacity={0.85}
            onPress={() => handleOpenIDEPress()}
          >
            <Ionicons
              name="code-slash"
              size={16}
              color={colors.accentCyan}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.secondaryActionBtnText}>Open IDE</Text>
          </TouchableOpacity>

          {/* Launch Preview */}
          <TouchableOpacity
            style={[styles.primaryActionBtn, styles.launchPreviewBtn]}
            activeOpacity={0.85}
            onPress={() => handleLaunchPreviewPress()}
          >
            <Ionicons
              name="play"
              size={15}
              color={colors.accentPurple}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.secondaryActionBtnText}>Launch Preview</Text>
          </TouchableOpacity>
        </View>

        {/* Secondary Quick Access Chips */}
        <View style={styles.secondaryQuickRow}>
          <TouchableOpacity
            style={styles.quickChip}
            activeOpacity={0.75}
            onPress={() => {
              if (onOpenArena) onOpenArena();
              else handleNavigate('arena');
            }}
          >
            <Ionicons name="planet-outline" size={13} color={colors.accentCyan} />
            <Text style={styles.quickChipText}>Arena.ai</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickChip}
            activeOpacity={0.75}
            onPress={() => {
              if (onOpenWorkflows) onOpenWorkflows();
              else handleNavigate('workflows');
            }}
          >
            <Ionicons name="git-network-outline" size={13} color={colors.accentPrimary} />
            <Text style={styles.quickChipText}>Workflows</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickChip}
            activeOpacity={0.75}
            onPress={() => {
              if (onOpenDeploy) onOpenDeploy();
              else handleNavigate('deploy');
            }}
          >
            <Ionicons name="cloud-upload-outline" size={13} color={colors.accentOrange} />
            <Text style={styles.quickChipText}>Deploy EAS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickChip}
            activeOpacity={0.75}
            onPress={() => {
              if (onOpenAgents) onOpenAgents();
              else handleNavigate('agents');
            }}
          >
            <Ionicons name="hardware-chip-outline" size={13} color={colors.accentPurple} />
            <Text style={styles.quickChipText}>8 Agents</Text>
          </TouchableOpacity>
        </View>

        {/* ==================================================================== */}
        {/* RECENT PROJECTS SECTION                                              */}
        {/* ==================================================================== */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="folder-outline" size={16} color={colors.accentPrimary} />
              <Text style={styles.sectionTitle}>Recent Projects</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{filteredProjects.length}</Text>
              </View>
            </View>

            {/* Right Controls: View toggle & "View All" */}
            <View style={styles.sectionHeaderRight}>
              {/* Toggle view mode */}
              <TouchableOpacity
                style={styles.viewModeToggle}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch {}
                  setViewMode((prev) => (prev === 'carousel' ? 'list' : 'carousel'));
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={viewMode === 'carousel' ? 'grid-outline' : 'list-outline'}
                  size={14}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleNavigate('projects')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.viewAllText}>View All →</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Project Filters (All / Demo / Custom) */}
          <View style={styles.filterPillsRow}>
            {(['all', 'demo', 'custom'] as ProjectFilterType[]).map((f) => {
              const active = filter === f;
              const label = f === 'all' ? 'All' : f === 'demo' ? 'Templates' : 'User Projects';
              return (
                <TouchableOpacity
                  key={f}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch {}
                    setFilter(f);
                  }}
                  style={[styles.filterPill, active && styles.filterPillActive]}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      active && styles.filterPillTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Projects Carousel or List */}
          {filteredProjects.length === 0 ? (
            <View style={styles.emptyProjectsCard}>
              <Ionicons name="folder-open-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No projects found</Text>
              <Text style={styles.emptySubtitle}>
                Create your first project or toggle filters above.
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={handleNewProjectPress}
              >
                <Ionicons name="add" size={14} color={colors.white} />
                <Text style={styles.emptyActionBtnText}>Create Project</Text>
              </TouchableOpacity>
            </View>
          ) : viewMode === 'carousel' ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContent}
              decelerationRate="fast"
              snapToInterval={312}
            >
              {filteredProjects.map((item) => (
                <ProjectCard
                  key={item.id}
                  project={item}
                  variant="carousel"
                  onPress={handleProjectSelect}
                  onLaunchPreview={handleLaunchPreviewPress}
                  onOpenIDE={handleOpenIDEPress}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.listContainer}>
              {filteredProjects.map((item) => (
                <ProjectCard
                  key={item.id}
                  project={item}
                  variant="list"
                  onPress={handleProjectSelect}
                  onLaunchPreview={handleLaunchPreviewPress}
                  onOpenIDE={handleOpenIDEPress}
                />
              ))}
            </View>
          )}
        </View>

        {/* ==================================================================== */}
        {/* RUNNING WORKFLOWS & TEAM STATUS & RECENT ACTIVITY                    */}
        {/* ==================================================================== */}
        <ActivitySummary
          workflows={workflows}
          agents={agents}
          onSelectWorkflow={(wf) => {
            if (onSelectWorkflow) onSelectWorkflow(wf);
            else handleNavigate('workflows', { workflowId: wf.id });
          }}
          onSelectAgent={(ag) => {
            if (onSelectAgent) onSelectAgent(ag);
            else handleNavigate('agents', { agentId: ag.id });
          }}
          onViewAllWorkflows={() => handleNavigate('workflows')}
          onViewAllActivities={() => handleNavigate('projects')}
          onViewAllAgents={() => handleNavigate('agents')}
          style={{ marginTop: spacing.xl }}
        />
      </ScrollView>

      {/* ==================================================================== */}
      {/* NOTIFICATIONS MODAL                                                  */}
      {/* ==================================================================== */}
      <Modal
        visible={showNotificationsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotificationsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowNotificationsModal(false)}
        >
          <View
            style={[styles.modalCard, { marginTop: insets.top + 50 }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Ionicons name="notifications" size={16} color={colors.accentPrimary} />
                <Text style={styles.modalTitle}>Notifications</Text>
                {unreadCount > 0 && (
                  <View style={styles.modalCountPill}>
                    <Text style={styles.modalCountText}>{unreadCount} new</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={() => setShowNotificationsModal(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {notifications.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.notifItem,
                    !item.read && styles.notifItemUnread,
                  ]}
                >
                  <View style={styles.notifHeaderRow}>
                    <Text style={styles.notifItemTitle}>{item.title}</Text>
                    <Text style={styles.notifItemTime}>{item.time}</Text>
                  </View>
                  <Text style={styles.notifItemMessage}>{item.message}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.markReadButton}
                onPress={handleMarkAllNotificationsRead}
              >
                <Text style={styles.markReadText}>Mark all as read</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ==================================================================== */}
      {/* DEVELOPER PROFILE MODAL                                              */}
      {/* ==================================================================== */}
      <Modal
        visible={showProfileModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowProfileModal(false)}
        >
          <View
            style={[styles.modalCard, { marginTop: insets.top + 50 }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatarLarge}>
                <Text style={styles.profileAvatarText}>AS</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>Arena Studio Developer</Text>
                <Text style={styles.profileRole}>Autonomous AI Workspace</Text>
                <View style={styles.envPill}>
                  <Text style={styles.envPillText}>Expo SDK 52 • React Native 0.76</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowProfileModal(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.profileStatsRow}>
              <View style={styles.profileStatBox}>
                <Text style={styles.profileStatValue}>{projects.length}</Text>
                <Text style={styles.profileStatLabel}>Projects</Text>
              </View>
              <View style={styles.profileStatBox}>
                <Text style={styles.profileStatValue}>{agents.length}</Text>
                <Text style={styles.profileStatLabel}>Agents</Text>
              </View>
              <View style={styles.profileStatBox}>
                <Text style={styles.profileStatValue}>100%</Text>
                <Text style={styles.profileStatLabel}>Offline Local</Text>
              </View>
            </View>

            <View style={styles.profileActionList}>
              <TouchableOpacity
                style={styles.profileActionRow}
                onPress={() => {
                  setShowProfileModal(false);
                  handleNavigate('deploy');
                }}
              >
                <Ionicons name="cloud-upload-outline" size={16} color={colors.accentPrimary} />
                <Text style={styles.profileActionText}>Deployments & EAS</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.profileActionRow}
                onPress={() => {
                  setShowProfileModal(false);
                  handleNavigate('arena');
                }}
              >
                <Ionicons name="globe-outline" size={16} color={colors.accentCyan} />
                <Text style={styles.profileActionText}>Arena.ai Cloud Workspace</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  brandingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  brandingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brandTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  brandTitleAccent: {
    fontSize: fontSizes.lg,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.bold,
    color: colors.accentPrimary,
    letterSpacing: 0.5,
  },
  proTag: {
    backgroundColor: 'rgba(56, 139, 253, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(56, 139, 253, 0.35)',
    marginLeft: 2,
  },
  proTagText: {
    fontSize: 9,
    fontFamily: fontFamilies.mono,
    fontWeight: fontWeights.bold,
    color: colors.accentPrimary,
  },
  brandTagline: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
    color: colors.textSecondary,
    marginTop: 1,
  },
  brandingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerIconButton: {
    position: 'relative',
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.accentOrange,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.bgPrimary,
  },
  notificationBadgeText: {
    fontSize: 9,
    fontFamily: fontFamilies.mono,
    fontWeight: fontWeights.bold,
    color: colors.white,
  },
  avatarButton: {
    position: 'relative',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentPurple,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  avatarInitials: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.mono,
    fontWeight: fontWeights.bold,
    color: colors.white,
  },
  avatarOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.success,
    borderWidth: 1.5,
    borderColor: colors.bgPrimary,
  },

  // Main Scroll Area
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },

  // Primary Quick Action Bar
  quickActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
  },
  newProjectBtn: {
    backgroundColor: colors.accentPrimary,
    borderColor: colors.accentPrimary,
    flex: 1.2,
  },
  actionIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  primaryActionBtnText: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.bold,
    color: colors.white,
  },
  openIdeBtn: {
    backgroundColor: colors.bgSecondary,
    borderColor: colors.border,
  },
  launchPreviewBtn: {
    backgroundColor: colors.bgSecondary,
    borderColor: colors.border,
  },
  secondaryActionBtnText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },

  // Secondary Quick Access Row
  secondaryQuickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  quickChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgTertiary,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 4,
  },
  quickChipText: {
    fontSize: 10,
    fontFamily: fontFamilies.mono,
    color: colors.textSecondary,
    fontWeight: fontWeights.medium,
  },

  // Recent Projects Section
  sectionContainer: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  countBadge: {
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
  },
  countBadgeText: {
    fontSize: 10,
    fontFamily: fontFamilies.mono,
    color: colors.textSecondary,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  viewModeToggle: {
    backgroundColor: colors.bgSecondary,
    padding: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  viewAllText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.semibold,
    color: colors.accentPrimary,
  },

  // Filters
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  filterPillActive: {
    backgroundColor: colors.accentPrimaryAlpha,
    borderColor: colors.accentPrimary,
  },
  filterPillText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
  },
  filterPillTextActive: {
    color: colors.accentPrimary,
    fontWeight: fontWeights.bold,
  },

  // Carousel & List containers
  carouselContent: {
    paddingRight: spacing.md,
    paddingBottom: spacing.xs,
  },
  listContainer: {
    width: '100%',
  },

  // Empty state
  emptyProjectsCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: fontSizes.base,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.md,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
    gap: 6,
  },
  emptyActionBtnText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.bold,
    color: colors.white,
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.backdrop,
    paddingHorizontal: spacing.lg,
    justifyContent: 'flex-start',
  },
  modalCard: {
    backgroundColor: colors.bgModal,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    maxHeight: '75%',
    ...shadows.modal,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  modalTitle: {
    fontSize: fontSizes.base,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  modalCountPill: {
    backgroundColor: 'rgba(56, 139, 253, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  modalCountText: {
    fontSize: 10,
    fontFamily: fontFamilies.mono,
    fontWeight: fontWeights.bold,
    color: colors.accentPrimary,
  },
  modalBody: {
    marginVertical: spacing.sm,
  },
  notifItem: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  notifItemUnread: {
    borderColor: 'rgba(56, 139, 253, 0.4)',
    backgroundColor: 'rgba(56, 139, 253, 0.05)',
  },
  notifHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  notifItemTitle: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  notifItemTime: {
    fontSize: 10,
    fontFamily: fontFamilies.sans,
    color: colors.textMuted,
  },
  notifItemMessage: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  modalFooter: {
    paddingTop: spacing.xs,
    alignItems: 'center',
  },
  markReadButton: {
    paddingVertical: 6,
  },
  markReadText: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.semibold,
    color: colors.accentPrimary,
  },

  // Profile Modal
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  profileAvatarLarge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentPurple,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  profileAvatarText: {
    fontSize: fontSizes.base,
    fontFamily: fontFamilies.mono,
    fontWeight: fontWeights.bold,
    color: colors.white,
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  profileName: {
    fontSize: fontSizes.base,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  profileRole: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.sans,
    color: colors.textSecondary,
    marginBottom: 3,
  },
  envPill: {
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  envPillText: {
    fontSize: 9,
    fontFamily: fontFamilies.mono,
    color: colors.textMuted,
  },
  profileStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  profileStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  profileStatValue: {
    fontSize: fontSizes.lg,
    fontFamily: fontFamilies.mono,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  profileStatLabel: {
    fontSize: 10,
    fontFamily: fontFamilies.sans,
    color: colors.textMuted,
    marginTop: 2,
  },
  profileActionList: {
    paddingTop: spacing.sm,
  },
  profileActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  profileActionText: {
    flex: 1,
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.sans,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
});
