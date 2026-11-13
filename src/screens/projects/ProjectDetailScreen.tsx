import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes, fontWeights } from '../../theme/typography';
import { radius, spacing } from '../../theme/spacing';
import { Badge, Button } from '../../components/ui';
import { Project, Agent, ProjectFile } from '../../models';
import { getProjects, getAgents, getProjectById } from '../../storage';
import { OverviewTab } from './OverviewTab';
import { FilesTab } from './FilesTab';
import { ActivityTab } from './ActivityTab';
import { AgentsTab } from './AgentsTab';
import { SettingsTab } from './SettingsTab';

export type ProjectDetailTab = 'overview' | 'files' | 'activity' | 'agents' | 'settings';

export interface ProjectDetailScreenProps {
  projectId?: string;
  project?: Project;
  initialTab?: ProjectDetailTab;
  onBack?: () => void;
  onOpenIDE?: (project: Project, file?: ProjectFile) => void;
  onLaunchPreview?: (project: Project) => void;
  onProjectUpdated?: (updatedProject: Project) => void;
  onProjectDeleted?: (projectId: string) => void;
}

export const ProjectDetailScreen: React.FC<ProjectDetailScreenProps> = ({
  projectId,
  project: propProject,
  initialTab = 'overview',
  onBack,
  onOpenIDE,
  onLaunchPreview,
  onProjectUpdated,
  onProjectDeleted,
}) => {
  const insets = useSafeAreaInsets();
  const [currentTab, setCurrentTab] = useState<ProjectDetailTab>(initialTab);
  const [project, setProject] = useState<Project | null>(propProject || null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState<boolean>(!propProject);

  // Load project & agents from persistent storage
  const loadProjectData = useCallback(async () => {
    try {
      setLoading(true);
      const [allProjects, allAgents] = await Promise.all([
        getProjects().catch(() => []),
        getAgents().catch(() => []),
      ]);

      setAgents(allAgents || []);

      if (propProject) {
        // Find freshest version from storage if it exists
        const fresh = allProjects.find((p) => p.id === propProject.id);
        setProject(fresh || propProject);
      } else if (projectId) {
        const found = allProjects.find((p) => p.id === projectId);
        if (found) {
          setProject(found);
        } else {
          // If not in list, try explicit by ID
          const direct = await getProjectById(projectId);
          setProject(direct);
        }
      } else if (allProjects.length > 0) {
        setProject(allProjects[0]);
      }
    } catch (err) {
      console.warn('Failed to load project details:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, propProject]);

  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]);

  // Handle Tab Navigation with Haptic feedback
  const handleTabPress = (tab: ProjectDetailTab) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setCurrentTab(tab);
  };

  const handleBackPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onBack?.();
  };

  const handleLaunchPreviewPress = () => {
    if (!project) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onLaunchPreview?.(project);
  };

  const handleOpenIDEPress = () => {
    if (!project) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onOpenIDE?.(project);
  };

  const handleProjectUpdated = (updatedProject: Project) => {
    setProject(updatedProject);
    onProjectUpdated?.(updatedProject);
  };

  const handleProjectDeleted = (deletedProjectId: string) => {
    onProjectDeleted?.(deletedProjectId);
    onBack?.();
  };

  // Build status dot color
  const getStatusColor = (status?: Project['buildStatus']) => {
    switch (status) {
      case 'success':
        return colors.success;
      case 'building':
        return colors.accentPrimary;
      case 'failed':
        return colors.error;
      case 'idle':
      default:
        return colors.textMuted;
    }
  };

  // Tabs configuration
  const tabItems: { id: ProjectDetailTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'overview', label: 'Overview', icon: 'grid-outline' },
    { id: 'files', label: 'Files', icon: 'folder-outline' },
    { id: 'activity', label: 'Activity', icon: 'pulse-outline' },
    { id: 'agents', label: 'Agents', icon: 'hardware-chip-outline' },
    { id: 'settings', label: 'Settings', icon: 'settings-outline' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />

      {/* 1. Top Navigation Bar */}
      <View style={styles.navBar}>
        <View style={styles.navBarLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.navTitle} numberOfLines={1}>
                {project ? project.name : 'Project Details'}
              </Text>
              {project && (
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(project.buildStatus) },
                  ]}
                />
              )}
            </View>
            {project && (
              <View style={styles.subtitleRow}>
                <Badge
                  label={project.framework.toUpperCase()}
                  status="info"
                  size="xs"
                />
                {project.isDemo && (
                  <Badge
                    label="DEMO"
                    status="purple"
                    size="xs"
                  />
                )}
                <Text style={styles.branchSubtitle}>
                  {project.gitBranch || 'main'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Header Action Buttons */}
        {project && (
          <View style={styles.navBarActions}>
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={handleLaunchPreviewPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="play" size={17} color={colors.accentGreen} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={handleOpenIDEPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="code-slash" size={18} color={colors.accentPrimary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 2. Five-Tab Segmented Navigation Bar */}
      <View style={styles.tabBar}>
        {tabItems.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => handleTabPress(tab.id)}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={isActive ? colors.accentPrimary : colors.secondary}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeTabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. Screen Content Area */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentPrimary} />
          <Text style={styles.loadingText}>Loading project workspace...</Text>
        </View>
      ) : !project ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>Project Not Found</Text>
          <Text style={styles.errorSubtitle}>
            The requested project could not be located in local storage.
          </Text>
          <Button
            title="Back to Projects"
            variant="secondary"
            size="md"
            onPress={handleBackPress}
            style={styles.errorBackButton}
          />
        </View>
      ) : (
        <View style={styles.contentArea}>
          {currentTab === 'overview' && (
            <OverviewTab
              project={project}
              agents={agents}
              onOpenIDE={onOpenIDE}
              onLaunchPreview={onLaunchPreview}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onRefresh={loadProjectData}
            />
          )}

          {currentTab === 'files' && (
            <FilesTab
              project={project}
              onOpenIDE={onOpenIDE}
            />
          )}

          {currentTab === 'activity' && (
            <ActivityTab
              project={project}
              onRefresh={loadProjectData}
            />
          )}

          {currentTab === 'agents' && (
            <AgentsTab
              project={project}
              agents={agents}
              onUpdateProject={handleProjectUpdated}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsTab
              project={project}
              onUpdateProject={handleProjectUpdated}
              onDeleteProject={handleProjectDeleted}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  // Nav Bar
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  navBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  branchSubtitle: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs - 2,
    color: colors.textSecondary,
  },
  navBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },

  // 5-Tab Navigation Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm + 2,
    position: 'relative',
  },
  tabButtonActive: {
    backgroundColor: colors.bgTertiary,
  },
  tabLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    color: colors.secondary,
    fontWeight: fontWeights.medium,
  },
  tabLabelActive: {
    color: colors.accentPrimary,
    fontWeight: fontWeights.semibold,
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.accentPrimary,
  },

  // Content Area
  contentArea: {
    flex: 1,
  },

  // Loading & Error
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  errorTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  errorSubtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
  errorBackButton: {
    marginTop: spacing.md,
  },
});
